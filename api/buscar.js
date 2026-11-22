// Radar de clientes de URCA · función de Vercel
//
//   GET /api/buscar?sector=dentistas&lugar=Sabadell            (OpenStreetMap)
//   GET /api/buscar?sector=dentistas&bbox=sur,oeste,norte,este  (la zona del mapa)
//   GET /api/buscar?...&fuente=google                           (Google Maps, si hay clave)
//   GET /api/buscar?estado=1                                    (qué fuentes hay disponibles)
//
// Devuelve una lista de negocios con el mismo formato venga de donde venga.
//
// Google Maps SOLO DENTRO DE LO GRATUITO. Pide web, teléfono, valoración y reseñas, así que
// cada petición cuenta como «Text Search Enterprise»: Google da 1.000 gratis al mes y luego
// cobra (35 $ cada 1.000, noviembre de 2026). Cada búsqueda del radar son 1 a 3 peticiones.
// Por eso:
//   - un contador mensual (Upstash Redis, gratis, conectado desde Vercel) apunta cada
//     petición ANTES de hacerla y se planta en GOOGLE_LIMITE_MES (900 por defecto);
//   - sin contador, o si el contador no responde, Google no se usa (falla cerrado);
//   - al llegar al tope, la búsqueda se frena y se avisa de que se puede seguir el mes
//     siguiente o ahora con OpenStreetMap.
// Variables en Vercel: GOOGLE_PLACES_KEY y las que crea Upstash al conectarlo
// (KV_REST_API_URL + KV_REST_API_TOKEN, o UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN).

const UA = "URCA-Radar/1.0 (+https://www.urca.agency)";
const MAX_OSM = 400;
const LIMITE_GRATIS_GOOGLE = 1000;  // lo que regala Google al mes (Text Search Enterprise)
const LIMITE_MES = Math.min(LIMITE_GRATIS_GOOGLE, Number(process.env.GOOGLE_LIMITE_MES) || 900);
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

// Sectores: etiquetas de OpenStreetMap, búsqueda en Google y si el ticket suele ser alto.
const SECTORES = {
  dentistas:     { nombre: "Clínicas dentales", google: "clínica dental", alto: true, osm: ["amenity=dentist", "healthcare=dentist"] },
  clinicas:      { nombre: "Clínicas médicas", google: "clínica médica privada", alto: true, osm: ["amenity=clinic", "healthcare=clinic", "amenity=doctors", "healthcare=doctor"] },
  fisioterapia:  { nombre: "Fisioterapia", google: "fisioterapeuta", alto: false, osm: ["healthcare=physiotherapist"] },
  estetica:      { nombre: "Estética y masajes", google: "centro de estética", alto: true, osm: ["shop=beauty", "shop=massage"] },
  peluquerias:   { nombre: "Peluquerías y barberías", google: "peluquería", alto: false, osm: ["shop=hairdresser"] },
  gimnasios:     { nombre: "Gimnasios", google: "gimnasio", alto: false, osm: ["leisure=fitness_centre"] },
  restaurantes:  { nombre: "Restaurantes", google: "restaurante", alto: false, osm: ["amenity=restaurant"] },
  abogados:      { nombre: "Abogados", google: "abogado", alto: true, osm: ["office=lawyer"] },
  inmobiliarias: { nombre: "Inmobiliarias", google: "inmobiliaria", alto: true, osm: ["office=estate_agent", "shop=estate_agent"] },
  reformas:      { nombre: "Reformas e instaladores", google: "empresa de reformas", alto: true,
                   osm: ["craft=builder", "craft=plumber", "craft=electrician", "craft=hvac", "craft=carpenter", "craft=painter", "craft=tiler"] },
  talleres:      { nombre: "Talleres mecánicos", google: "taller mecánico", alto: false, osm: ["shop=car_repair"] },
  veterinarios:  { nombre: "Veterinarios", google: "veterinario", alto: false, osm: ["amenity=veterinary"] },
  academias:     { nombre: "Academias y autoescuelas", google: "academia", alto: false,
                   osm: ["amenity=language_school", "amenity=driving_school", "amenity=music_school", "amenity=prep_school"] },
  opticas:       { nombre: "Ópticas", google: "óptica", alto: false, osm: ["shop=optician"] },
  alojamientos:  { nombre: "Hoteles y alojamientos", google: "hotel", alto: true, osm: ["tourism=hotel", "tourism=guest_house", "tourism=apartment"] },
};

const OVERPASS = [  // por orden de lanzamiento
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

class Fallo extends Error {}

async function json(url, opciones, ms) {
  const r = await fetch(url, Object.assign({ signal: AbortSignal.timeout(ms) }, opciones));
  const texto = await r.text();
  if (!r.ok) throw new Fallo("HTTP " + r.status + " " + texto.slice(0, 120));
  return JSON.parse(texto);
}

// ───────────────────────────── lugar

async function geocodificar(lugar) {
  const url = "https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=es&limit=8&accept-language=es&q=" + encodeURIComponent(lugar);
  const res = await json(url, { headers: { "User-Agent": UA } }, 10000);
  if (!res.length) throw new Fallo("No encuentro «" + lugar + "» en España. Prueba con el nombre del municipio o «barrio, ciudad».");
  const admin = res.find(x => x.osm_type === "relation" && /^(boundary|place)$/.test(x.category) );
  const elegido = admin || res[0];
  const [s, n, o, e] = elegido.boundingbox.map(Number);
  return {
    nombre: elegido.display_name.split(",").slice(0, 2).join(",").trim(),
    completo: elegido.display_name,
    area: elegido.osm_type === "relation" ? 3600000000 + Number(elegido.osm_id) : null,
    bbox: [s, o, n, e],
    centro: [Number(elegido.lat), Number(elegido.lon)],
  };
}

// ───────────────────────────── OpenStreetMap

function consultaOverpass(sector, filtro) {
  const partes = sector.osm.map(t => { const [k, v] = t.split("="); return `nwr["${k}"="${v}"]["name"]${filtro};`; }).join("");
  return `[out:json][timeout:40];${filtro === "(area.a)" ? "" : ""}(${partes});out center tags ${MAX_OSM + 1};`;
}

// Los servidores públicos de Overpass se saturan a menudo. Se lanza el primero; si a los
// ESCALON ms no ha contestado (o falla antes), se lanza también el siguiente, y así. Gana el
// primero que responde y se cancelan los demás.
const ESCALON = 8000;
function overpass(q, limiteMs) {
  const ctl = new AbortController();
  const fin = setTimeout(() => ctl.abort(), limiteMs);
  const errores = [];
  return new Promise((resolver, rechazar) => {
    let lanzados = 0, vivos = 0, hecho = false, siguiente = null;
    const terminar = (error, datos) => {
      if (hecho) return;
      hecho = true; clearTimeout(fin); clearTimeout(siguiente); ctl.abort();
      error ? rechazar(error) : resolver(datos);
    };
    const lanzar = () => {
      clearTimeout(siguiente);
      if (hecho || lanzados >= OVERPASS.length) return;
      const ep = OVERPASS[lanzados++];
      vivos++;
      siguiente = setTimeout(lanzar, ESCALON);
      fetch(ep, { method: "POST", signal: ctl.signal, body: "data=" + encodeURIComponent(q),
                  headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" } })
        .then(async r => { const t = await r.text(); if (!r.ok) throw new Error("HTTP " + r.status); return JSON.parse(t); })
        .then(datos => terminar(null, datos))
        .catch(e => {
          vivos--;
          errores.push(ep.split("/")[2] + ": " + (e.name === "AbortError" ? "no contesta" : String(e.message).slice(0, 40)));
          if (hecho) return;
          if (lanzados < OVERPASS.length) lanzar();
          else if (!vivos) terminar(new Fallo("Los servidores de OpenStreetMap están saturados ahora mismo. Vuelve a probar en un par de minutos."));
        });
    };
    ctl.signal.addEventListener("abort", () => {
      if (!hecho) terminar(new Fallo("OpenStreetMap no ha contestado a tiempo. Vuelve a probar en un par de minutos o acota a un barrio."));
    });
    lanzar();
  });
}

function primera(tags, claves) {
  for (const c of claves) if (tags[c]) return String(tags[c]).split(";")[0].trim();
  return "";
}

function normalizarWeb(w) {
  if (!w) return "";
  w = w.trim();
  if (/^(www\.)?(facebook|instagram|twitter|x|tiktok|linkedin|youtube)\.com/i.test(w.replace(/^https?:\/\//, ""))) return "";
  return /^https?:\/\//i.test(w) ? w : "https://" + w;
}

function desdeOsm(el) {
  const t = el.tags || {};
  const lat = el.lat != null ? el.lat : el.center && el.center.lat;
  const lon = el.lon != null ? el.lon : el.center && el.center.lon;
  const calle = [primera(t, ["addr:street"]), primera(t, ["addr:housenumber"])].filter(Boolean).join(", ");
  const direccion = [calle, primera(t, ["addr:postcode"]), primera(t, ["addr:city"])].filter(Boolean).join(" · ");
  const webBruta = primera(t, ["website", "contact:website", "url", "brand:website"]);
  const redes = [primera(t, ["contact:facebook", "facebook"]), webBruta].join(" ");
  return {
    id: "osm-" + el.type[0] + el.id,
    nombre: t.name,
    direccion,
    lat, lon,
    web: normalizarWeb(webBruta),
    telefono: primera(t, ["phone", "contact:phone", "contact:mobile", "mobile"]),
    email: primera(t, ["email", "contact:email"]),
    instagram: primera(t, ["contact:instagram", "instagram"]) || ((redes.match(/instagram\.com\/[\w.]+/i) || [""])[0]),
    facebook: primera(t, ["contact:facebook", "facebook"]) || ((redes.match(/facebook\.com\/[\w.]+/i) || [""])[0]),
    horario: primera(t, ["opening_hours"]),
    cadena: Boolean(t.brand || t["brand:wikidata"]),
    valoracion: null, resenas: null,
    ficha: "https://www.openstreetmap.org/" + el.type + "/" + el.id,
    fuente: "OpenStreetMap",
  };
}

async function buscarOsm(sector, lugar, bbox) {
  let zona;
  let filtro;
  if (bbox) {
    zona = { nombre: "la zona del mapa", bbox, centro: [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2] };
    filtro = `(${bbox.join(",")})`;
  } else {
    zona = await geocodificar(lugar);
    filtro = zona.area ? "(area.a)" : `(${zona.bbox.join(",")})`;
  }
  const cabeza = zona.area && !bbox ? `[out:json][timeout:40];area(id:${zona.area})->.a;` : "[out:json][timeout:40];";
  const partes = sector.osm.map(t => { const [k, v] = t.split("="); return `nwr["${k}"="${v}"]["name"]${filtro};`; }).join("");
  const datos = await overpass(`${cabeza}(${partes});out center tags ${MAX_OSM + 1};`, 52000);
  const vistos = new Set();
  const negocios = [];
  for (const el of datos.elements || []) {
    const n = desdeOsm(el);
    const clave = (n.nombre + "|" + (n.web || n.direccion)).toLowerCase();
    if (!n.nombre || n.lat == null || vistos.has(clave)) continue;
    vistos.add(clave);
    negocios.push(n);
  }
  return { zona, negocios: negocios.slice(0, MAX_OSM), hay_mas: negocios.length > MAX_OSM };
}

// ───────────────────────────── contador del cupo gratuito de Google

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

// Google factura por meses naturales; se usa el mes en UTC y el margen de 100 cubre el desfase.
function mesActual() {
  const d = new Date();
  return { clave: "radar:google:" + d.toISOString().slice(0, 7), siguiente: MESES[(d.getUTCMonth() + 1) % 12] };
}

async function redis(...orden) {
  if (!REDIS_URL || !REDIS_TOKEN) throw new Error("sin contador");
  const r = await fetch(REDIS_URL, { method: "POST", signal: AbortSignal.timeout(5000),
    headers: { Authorization: "Bearer " + REDIS_TOKEN, "Content-Type": "application/json" }, body: JSON.stringify(orden) });
  const d = await r.json();
  if (!r.ok || d.error) throw new Error("contador: " + (d.error || r.status));
  return d.result;
}

async function usadasEsteMes() {
  return Number(await redis("GET", mesActual().clave)) || 0;
}

// Reserva una petición del cupo. Devuelve false si ya no quedan (y no gasta nada).
async function reservarPeticion() {
  const { clave } = mesActual();
  const n = Number(await redis("INCR", clave));
  if (n === 1) await redis("EXPIRE", clave, 60 * 60 * 24 * 40);
  if (n > LIMITE_MES) { await redis("DECR", clave); return false; }
  return true;
}

function avisoLimite() {
  return "Se ha usado todo lo gratuito de Google Maps de este mes. Puedes seguir a partir del 1 de " + mesActual().siguiente +
         ", o buscar ahora con OpenStreetMap.";
}

class Limite extends Fallo {}

async function estadoGoogle() {
  if (!process.env.GOOGLE_PLACES_KEY) return { activo: false, motivo: "Falta la clave de Google en Vercel." };
  if (!REDIS_URL || !REDIS_TOKEN) return { activo: false, motivo: "Falta el contador del cupo gratuito (Upstash en Vercel). Sin él, Google no se usa para no pasarse de lo gratis." };
  try {
    const usadas = await usadasEsteMes();
    const quedan = Math.max(0, LIMITE_MES - usadas);
    return { activo: quedan > 0, usadas, limite: LIMITE_MES, quedan, motivo: quedan > 0 ? "" : avisoLimite() };
  } catch (_) {
    return { activo: false, motivo: "El contador del cupo gratuito no responde. Por seguridad, Google no se usa ahora; prueba más tarde." };
  }
}

// ───────────────────────────── Google Maps (Places API New)

async function buscarGoogle(sector, lugar, bbox) {
  const clave = process.env.GOOGLE_PLACES_KEY;
  const zona = bbox ? { nombre: "la zona del mapa", bbox, centro: [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2] } : await geocodificar(lugar);
  const campos = ["places.id", "places.displayName", "places.formattedAddress", "places.location", "places.websiteUri",
    "places.nationalPhoneNumber", "places.rating", "places.userRatingCount", "places.googleMapsUri", "places.businessStatus", "nextPageToken"].join(",");
  const cuerpo = {
    textQuery: sector.google + (bbox ? "" : " en " + zona.nombre),
    languageCode: "es", regionCode: "ES", pageSize: 20,
    locationRestriction: { rectangle: { low: { latitude: zona.bbox[0], longitude: zona.bbox[1] }, high: { latitude: zona.bbox[2], longitude: zona.bbox[3] } } },
  };
  const negocios = [];
  let token = null, frenada = false;
  for (let pagina = 0; pagina < 3; pagina++) {
    let libre;
    try { libre = await reservarPeticion(); }
    catch (_) { throw new Fallo("El contador del cupo gratuito no responde. Por seguridad, Google no se usa ahora: busca con OpenStreetMap o prueba más tarde."); }
    if (!libre) {
      if (pagina === 0) throw new Limite(avisoLimite());
      frenada = true;
      break;
    }
    const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST", signal: AbortSignal.timeout(15000),
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": clave, "X-Goog-FieldMask": campos },
      body: JSON.stringify(token ? Object.assign({}, cuerpo, { pageToken: token }) : cuerpo),
    });
    const texto = await r.text();
    if (r.status === 429 || r.status === 403) {
      if (pagina === 0) throw new Limite("Google Maps ha frenado las búsquedas (límite o facturación). Puedes seguir en otro momento o buscar ahora con OpenStreetMap.");
      frenada = true;
      break;
    }
    if (!r.ok) throw new Fallo("Google Maps no ha respondido bien (error " + r.status + "). Vuelve a probar en un momento o usa OpenStreetMap.");
    const datos = JSON.parse(texto);
    for (const p of datos.places || []) {
      if (p.businessStatus && p.businessStatus !== "OPERATIONAL") continue;
      negocios.push({
        id: "g-" + p.id,
        nombre: p.displayName && p.displayName.text,
        direccion: (p.formattedAddress || "").replace(/, España$/, ""),
        lat: p.location && p.location.latitude, lon: p.location && p.location.longitude,
        web: normalizarWeb(p.websiteUri || ""),
        telefono: p.nationalPhoneNumber || "", email: "", instagram: "", facebook: "", horario: "", cadena: false,
        valoracion: p.rating == null ? null : p.rating, resenas: p.userRatingCount == null ? null : p.userRatingCount,
        ficha: p.googleMapsUri || "", fuente: "Google Maps",
      });
    }
    token = datos.nextPageToken;
    if (!token) break;
  }
  return { zona, negocios, hay_mas: Boolean(token), aviso: frenada ? avisoLimite() + " Esta lista se ha quedado a medias." : "" };
}

// ───────────────────────────── función

module.exports = async function handler(req, res) {
  const q = new URL(req.url, "http://x").searchParams;
  const responder = (codigo, datos, cache) => {
    res.statusCode = codigo;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("X-Robots-Tag", "noindex");
    res.setHeader("Cache-Control", cache ? "public, s-maxage=21600, stale-while-revalidate=86400" : "no-store");
    res.end(JSON.stringify(datos));
  };

  if (q.get("estado")) {
    const g = await estadoGoogle();
    return responder(200, { fuentes: { osm: true, google: g.activo }, google: g,
      sectores: Object.entries(SECTORES).map(([id, s]) => ({ id, nombre: s.nombre, alto: s.alto })) });
  }
  const sector = SECTORES[q.get("sector")];
  if (!sector) return responder(400, { ok: false, error: "Elige un sector de la lista." });
  let bbox = null;
  if (q.get("bbox")) {
    bbox = q.get("bbox").split(",").map(Number);
    if (bbox.length !== 4 || bbox.some(x => !isFinite(x))) return responder(400, { ok: false, error: "Zona del mapa no válida." });
    if (Math.abs(bbox[2] - bbox[0]) * Math.abs(bbox[3] - bbox[1]) > 0.25) {
      return responder(400, { ok: false, error: "La zona del mapa es demasiado grande. Acerca el mapa a una ciudad o comarca." });
    }
  }
  const lugar = (q.get("lugar") || "").trim().slice(0, 120);
  if (!bbox && !lugar) return responder(400, { ok: false, error: "Escribe un municipio o un barrio." });
  const fuente = q.get("fuente") === "google" ? "google" : "osm";
  if (fuente === "google") {
    if (!process.env.GOOGLE_PLACES_KEY) return responder(400, { ok: false, limite: true, error: "Google Maps no está activado: falta la clave en Vercel." });
    if (!REDIS_URL || !REDIS_TOKEN) return responder(400, { ok: false, limite: true, error: "Google Maps está en pausa: falta el contador del cupo gratuito. Busca con OpenStreetMap." });
  }

  try {
    const r = fuente === "google" ? await buscarGoogle(sector, lugar, bbox) : await buscarOsm(sector, lugar, bbox);
    // Una lista cortada por el límite no se guarda en caché: el mes que viene debe poder completarse.
    responder(200, Object.assign({ ok: true, fuente, sector: q.get("sector"), sector_alto: sector.alto }, r), !r.aviso);
  } catch (e) {
    responder(200, { ok: false, limite: e instanceof Limite || undefined,
                     error: e instanceof Fallo ? e.message : "No se pudo completar la búsqueda. Vuelve a probar en un momento." });
  }
};
module.exports.SECTORES = SECTORES;
