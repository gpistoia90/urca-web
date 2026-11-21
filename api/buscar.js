// Radar de clientes de URCA · función de Vercel
//
//   GET /api/buscar?sector=dentistas&lugar=Sabadell            (OpenStreetMap)
//   GET /api/buscar?sector=dentistas&bbox=sur,oeste,norte,este  (la zona del mapa)
//   GET /api/buscar?...&fuente=google                           (Google Maps, si hay clave)
//   GET /api/buscar?estado=1                                    (qué fuentes hay disponibles)
//
// Devuelve una lista de negocios con el mismo formato venga de donde venga.
// Google Maps se activa poniendo la variable GOOGLE_PLACES_KEY en Vercel
// (Places API (New) habilitada en Google Cloud).

const UA = "URCA-Radar/1.0 (+https://www.urca.agency)";
const MAX_OSM = 400;

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

const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
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

async function overpass(q, limiteMs) {
  const fin = Date.now() + limiteMs;
  const errores = [];
  for (const ep of OVERPASS) {
    const quedan = fin - Date.now();
    if (quedan < 4000) break;
    try {
      return await json(ep, { method: "POST", headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
                              body: "data=" + encodeURIComponent(q) }, Math.min(quedan, 45000));
    } catch (e) {
      errores.push(ep.split("/")[2] + ": " + (e.name === "TimeoutError" ? "no contesta" : e.message.slice(0, 60)));
    }
  }
  throw new Fallo("Los servidores de OpenStreetMap están saturados ahora mismo. Vuelve a probar en un minuto. (" + errores.join(" · ") + ")");
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
  let token = null;
  for (let pagina = 0; pagina < 3; pagina++) {
    const datos = await json("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": clave, "X-Goog-FieldMask": campos },
      body: JSON.stringify(token ? Object.assign({}, cuerpo, { pageToken: token }) : cuerpo),
    }, 15000);
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
  return { zona, negocios, hay_mas: Boolean(token) };
}

// ───────────────────────────── función

module.exports = async function handler(req, res) {
  const q = new URL(req.url, "http://x").searchParams;
  const google = Boolean(process.env.GOOGLE_PLACES_KEY);
  const responder = (codigo, datos, cache) => {
    res.statusCode = codigo;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("X-Robots-Tag", "noindex");
    res.setHeader("Cache-Control", cache ? "public, s-maxage=21600, stale-while-revalidate=86400" : "no-store");
    res.end(JSON.stringify(datos));
  };

  if (q.get("estado")) {
    return responder(200, { fuentes: { osm: true, google },
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
  if (fuente === "google" && !google) return responder(400, { ok: false, error: "Google Maps no está activado: falta la clave en Vercel." });

  try {
    const r = fuente === "google" ? await buscarGoogle(sector, lugar, bbox) : await buscarOsm(sector, lugar, bbox);
    responder(200, Object.assign({ ok: true, fuente, sector: q.get("sector"), sector_alto: sector.alto }, r), true);
  } catch (e) {
    responder(200, { ok: false, error: e instanceof Fallo ? e.message : "No se pudo completar la búsqueda. Vuelve a probar en un momento." });
  }
};
module.exports.SECTORES = SECTORES;
