// Radar de clientes de URCA · función de Vercel
//
//   GET /api/escanear?url=https://negocio.com
//
// Entra en la portada de la web de un negocio (y en sus contenedores de Google Tag
// Manager, donde suelen ir los píxeles) y devuelve las señales que interesan a URCA:
// si se anuncia en Google o Meta, si mide, si se puede contactar o reservar desde la
// web, si va bien en el móvil. No guarda nada.
//
// Seguridad: solo http/https a direcciones públicas (nada de redes internas), cada
// redirección se vuelve a comprobar, tiempo y tamaño limitados.

const dns = require("dns").promises;
const net = require("net");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const LIMITE_HTML = 1500000;
const LIMITE_GTM = 2500000;
const WEB_LENTA_S = 3;

// ───────────────────────────── red

function ipPrivada(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
  }
  const v = ip.toLowerCase();
  if (v.startsWith("::ffff:")) return ipPrivada(v.slice(7));
  return v === "::" || v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
}

async function hostPublico(host) {
  if (!host || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
  if (net.isIP(host)) return !ipPrivada(host);
  try {
    const dirs = await dns.lookup(host, { all: true });
    return dirs.length > 0 && dirs.every(d => !ipPrivada(d.address));
  } catch (_) {
    return false;
  }
}

async function leerCuerpo(res, limite) {
  if (!res.body) return "";
  const lector = res.body.getReader();
  const trozos = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    trozos.push(value);
    total += value.length;
    if (total >= limite) { try { await lector.cancel(); } catch (_) {} break; }
  }
  const bytes = Buffer.concat(trozos.map(t => Buffer.from(t)));
  const tipo = res.headers.get("content-type") || "";
  let charset = (tipo.match(/charset=([\w-]+)/i) || [])[1];
  if (!charset) charset = (bytes.subarray(0, 4000).toString("latin1").match(/charset=["']?([\w-]+)/i) || [])[1] || "utf-8";
  try { return new TextDecoder(charset.toLowerCase()).decode(bytes); }
  catch (_) { return new TextDecoder("utf-8").decode(bytes); }
}

// Descarga siguiendo redirecciones a mano para comprobar cada destino.
async function traer(url, { ms = 7000, limite = LIMITE_HTML } = {}) {
  const ctl = new AbortController();
  const reloj = setTimeout(() => ctl.abort(), ms);
  const t0 = Date.now();
  try {
    let actual = url;
    for (let salto = 0; salto < 6; salto++) {
      const u = new URL(actual);
      if (!/^https?:$/.test(u.protocol) || (u.port && !["80", "443"].includes(u.port))) return { ok: false, error: "Dirección no permitida" };
      if (!(await hostPublico(u.hostname))) return { ok: false, error: "El dominio no existe o no es público" };
      const res = await fetch(u, {
        redirect: "manual", signal: ctl.signal,
        headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml,*/*;q=0.8", "Accept-Language": "es-ES,es;q=0.9,ca;q=0.7" },
      });
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        actual = new URL(res.headers.get("location"), u).toString();
        continue;
      }
      const texto = await leerCuerpo(res, limite);
      return { ok: res.ok, status: res.status, url: actual, texto, segundos: Math.round((Date.now() - t0) / 100) / 10,
               error: res.ok ? null : "La web responde con error " + res.status };
    }
    return { ok: false, error: "Demasiadas redirecciones" };
  } catch (e) {
    const motivo = e.name === "AbortError" ? "La web tarda demasiado en responder"
      : /certificate|SSL|TLS/i.test(String(e.cause || e)) ? "Certificado de seguridad roto"
      : /ENOTFOUND|EAI_AGAIN/.test(String(e.cause && e.cause.code || "")) ? "El dominio no existe"
      : "La web no responde";
    return { ok: false, error: motivo, segundos: Math.round((Date.now() - t0) / 100) / 10 };
  } finally {
    clearTimeout(reloj);
  }
}

// ───────────────────────────── análisis

// Del contenedor de GTM solo interesa el objeto de datos (`var data = {...}`):
// la librería de Google que lo acompaña contiene textos como `googleadservices`
// en todos los contenedores y daría falsos positivos.
function datosGtm(js) {
  let i = js.indexOf("var data = {");
  if (i < 0) return "";
  i = js.indexOf("{", i);
  let nivel = 0, cadena = false, escape = false;
  const fin = Math.min(js.length, i + 2500000);
  for (let j = i; j < fin; j++) {
    const c = js[j];
    if (cadena) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === '"') cadena = false;
    } else if (c === '"') cadena = true;
    else if (c === "{") nivel++;
    else if (c === "}" && --nivel === 0) return js.slice(i, j + 1);
  }
  return "";
}

const RESERVAS = [
  ["Doctoralia", /doctoralia\./i], ["Booksy", /booksy\.com/i], ["Treatwell", /treatwell\./i], ["Fresha", /fresha\.com/i],
  ["TheFork", /thefork\.|eltenedor\./i], ["CoverManager", /covermanager\.com/i], ["Calendly", /calendly\.com/i],
  ["SimplyBook", /simplybook\./i], ["Bookitit", /bookitit\.com/i], ["Reservio", /reservio\.com/i], ["Setmore", /setmore\.com/i],
  ["Timify", /timify\.com/i], ["Glofox / Mindbody", /glofox\.com|mindbodyonline\.com|healcode/i], ["Resengo / Dish", /resengo\.|dish\.co/i],
  ["Weekendesk / Booking", /booking\.com\/hotel|bookingengine|motor-?de-?reservas|mirai\.com|roiback/i],
];

const PLATAFORMAS = [
  ["Shopify", /cdn\.shopify\.com|myshopify\.com/i], ["WooCommerce", /woocommerce|wc-ajax/i], ["PrestaShop", /prestashop/i],
  ["Wix", /wixstatic\.com|wix\.com/i], ["Squarespace", /squarespace(-cdn)?\.com/i], ["Webflow", /website-files\.com|data-wf-site/i],
  ["Jimdo", /jimdo/i], ["GoDaddy", /godaddysites|img1\.wsimg\.com/i], ["Framer", /framerusercontent\.com/i],
  ["WordPress", /wp-content\/|wp-includes\//i], ["Joomla", /\/media\/jui\/|joomla!/i], ["Drupal", /drupal-settings-json/i],
];

function analizar(html, gtm) {
  const todo = html + "\n" + gtm;
  const publicidad = [];
  if (/fbq\(\s*\\?['"]init|fbevents\.js|facebook\.com\/tr\?id=\d|vtp_pixelId|facebook_pixel_id/.test(todo)) publicidad.push("Meta");
  if (/\bAW-\d{8,12}\b|google_conversion_id\W+\d{6,}|googleadservices\.com\/pagead\/conversion\/\d{6,}/.test(todo) ||
      /"function":"__(awct|sp|gclidw_ads)"|"vtp_conversionId":"?\d{6,}/.test(gtm)) publicidad.push("Google Ads");
  if (/analytics\.tiktok\.com|ttq\.load\(|TiktokAnalyticsObject/.test(todo)) publicidad.push("TikTok");
  if (/snap\.licdn\.com|_linkedin_partner_id/.test(todo) || gtm.includes('"function":"__bzi"')) publicidad.push("LinkedIn");

  const ga4 = [...new Set((todo.match(/\bG-[A-Z0-9]{8,12}\b/g) || []).filter(x => /\d/.test(x)))];
  const ua = /\bUA-\d{4,10}-\d{1,3}\b/.test(todo);
  const gtmIds = [...new Set(html.match(/\bGTM-[A-Z0-9]{4,9}\b/g) || [])];

  const visible = html.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const titulo = ((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "").replace(/\s+/g, " ").trim().slice(0, 140);
  const reservas = RESERVAS.filter(([, re]) => re.test(html)).map(([n]) => n);
  if (!reservas.length && /reserva(r)?\s+(online|cita|mesa|ahora)|pide\s+cita|pedir\s+cita|cita\s+online|book\s+(now|online)/i.test(visible)) reservas.push("Botón de reserva propio");
  const plataforma = (PLATAFORMAS.find(([, re]) => re.test(html)) || ["Otra / a medida"])[0];
  const anio = Math.max(0, ...((visible.match(/(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?((?:19|20)\d{2})/gi) || [])
    .map(x => +(x.match(/((?:19|20)\d{2})\s*$/) || [0, 0])[1])));

  return {
    titulo,
    publicidad,
    ga4: ga4.length > 0,
    ua_antiguo: ua && !ga4.length,
    gtm: gtmIds.length > 0,
    google_ads_conversion: /"function":"__awct"|send_to['"]?\s*[:,]\s*['"]AW-\d+\/[\w-]+/.test(todo),
    reservas,
    whatsapp: /wa\.me\/|api\.whatsapp\.com|web\.whatsapp\.com|whatsapp:\/\//i.test(html),
    formulario: /<form[\s\S]{0,4000}?(type=["']?(email|tel)|name=["']?(email|telefono|phone|mensaje|message))/i.test(html) ||
                /wpcf7|gform_wrapper|elementor-form|hs-form|typeform|jotform|formspree|formsubmit/i.test(html),
    telefono_clic: /href=["']tel:/i.test(html),
    instagram: /instagram\.com\/(?!p\/|reel\/|explore\/)[\w.]+/i.test(html),
    movil: /name=["']viewport["']/i.test(html),
    plataforma,
    anio_copyright: anio || null,
    descripcion: /<meta[^>]+name=["']description["'][^>]*content=["'][^"']{20,}/i.test(html) ||
                 /<meta[^>]+content=["'][^"']{20,}["'][^>]*name=["']description["']/i.test(html),
  };
}

// ───────────────────────────── función

async function escanear(entrada) {
  let texto = String(entrada || "").trim();
  if (!texto) return { ok: false, error: "Falta la dirección de la web" };
  if (!/^https?:\/\//i.test(texto)) texto = "https://" + texto.replace(/^\/+/, "");
  let u;
  try { u = new URL(texto); } catch (_) { return { ok: false, error: "Dirección no válida" }; }
  const host = u.hostname.replace(/^www\./, "");

  // Portada: primero lo que viene en OpenStreetMap; si falla, con y sin www y por http.
  const intentos = [u.toString(), "https://" + host + "/", "https://www." + host + "/", "http://" + host + "/"];
  let r = null;
  for (const url of [...new Set(intentos)]) {
    r = await traer(url);
    if (r.ok && r.texto && r.texto.length > 300) break;
    if (r.error && /no es público|no permitida/.test(r.error)) break;
  }
  if (!r.ok || !r.texto || r.texto.length < 300) {
    const bloqueo = r && (r.status === 403 || r.status === 429 || r.status === 503 || /just a moment|cf-chl|captcha/i.test(r.texto || ""));
    return { ok: false, estado: bloqueo ? "bloqueada" : "caida",
             error: bloqueo ? "La web bloquea las visitas automáticas: mírala a mano" : (r && r.error) || "La web no responde",
             segundos: r && r.segundos };
  }

  const html = r.texto;
  const ids = [...new Set(html.match(/\bGTM-[A-Z0-9]{4,9}\b/g) || [])].slice(0, 2);
  const contenedores = await Promise.all(ids.map(id =>
    traer("https://www.googletagmanager.com/gtm.js?id=" + id, { ms: 5000, limite: LIMITE_GTM })
      .then(x => (x.ok ? datosGtm(x.texto) : ""))));
  const senales = analizar(html, contenedores.join("\n"));
  return Object.assign({ ok: true, estado: "ok", url: r.url, https: r.url.startsWith("https://"), segundos: r.segundos,
                         lenta: r.segundos > WEB_LENTA_S }, senales);
}

module.exports = async function handler(req, res) {
  const responder = (codigo, datos, cache) => {
    res.statusCode = codigo;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("X-Robots-Tag", "noindex");
    res.setHeader("Cache-Control", cache ? "public, s-maxage=86400, stale-while-revalidate=604800" : "no-store");
    res.end(JSON.stringify(datos));
  };
  if (req.method !== "GET") return responder(405, { ok: false, error: "Solo GET" });
  const consulta = new URL(req.url, "http://x").searchParams;
  try {
    const datos = await escanear(consulta.get("url"));
    responder(200, datos, datos.ok);
  } catch (e) {
    responder(200, { ok: false, estado: "error", error: "No se pudo analizar la web" });
  }
};
module.exports.escanear = escanear;
module.exports.analizar = analizar;
module.exports.datosGtm = datosGtm;
