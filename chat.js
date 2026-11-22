/* URCA: chat guiado, sin IA. Generado por build.py; no editar aquí. */
(function () {
  'use strict';
  var NODOS = {"inicio":{"m":["Hola, no soy una IA, soy un faro y estoy aquí para guiarte.","Te respondo con lo que explicamos en la web de URCA y, si quieres, te pongo en contacto con el equipo.","¿Qué quieres saber?"],"o":[["¿Google Ads o Meta Ads?","canal"],["¿Cuánto cuesta?","precio"],["¿URCA trabaja con mi tipo de negocio?","sector"],["¿Cómo es trabajar con URCA?","metodo"],["Ya me anuncio y no me convence","revisar"],["¿Cuándo veré resultados?","plazos"],["Hablar con el equipo","contacto"]]},"canal":{"m":["Depende sobre todo de una cosa: ¿la gente ya busca en Google lo que vendes?"],"o":[["Sí, lo buscan","canal_google"],["No, lo descubren al verlo","canal_meta"],["No lo sé","canal_nose"]]},"canal_google":{"m":["Entonces <b>Google Ads<\/b> suele ser el primer paso. Apareces arriba en Google y en Google Maps justo cuando alguien busca lo que vendes en tu zona: captas a quien ya tiene la necesidad.","Más adelante, Meta Ads sirve para volver a impactar a quien te visitó y no contactó. <a href=\"/google-ads\">Cómo gestionamos Google Ads →<\/a>"],"o":[["¿Cuánto cuesta?","precio"],["Hablar con el equipo","contacto"],["Otra pregunta","inicio"]]},"canal_meta":{"m":["Entonces <b>Meta Ads<\/b> (Facebook e Instagram) suele encajar mejor. Llegas con imagen y vídeo a quien encaja con tu negocio pero todavía no te conoce: es el canal para crear demanda.","Las creatividades las preparamos también con inteligencia artificial, siempre a partir de tu producto real y revisadas por una persona. <a href=\"/meta-ads\">Cómo gestionamos Meta Ads →<\/a>"],"o":[["¿Tengo que grabar vídeos?","videos"],["¿Cuánto cuesta?","precio"],["Hablar con el equipo","contacto"]]},"canal_nose":{"m":["Una prueba rápida: busca en Google lo que vendes y tu ciudad. Si salen anuncios de la competencia, suele haber gente buscándolo, y Google Ads tiene sentido.","Si tu producto entra por los ojos o es nuevo, Meta Ads. Muchos negocios acaban usando los dos. Lo comparamos con calma en <a href=\"/google-ads-o-meta-ads\">Google Ads o Meta Ads<\/a>."],"o":[["Que lo mire el equipo","contacto"],["¿Cuánto cuesta?","precio"],["Otra pregunta","inicio"]]},"videos":{"m":["Pocos. Partimos de lo que ya tienes: fotos, vídeos y tu perfil. Si hace falta material nuevo, te damos un guion corto para grabar con el móvil.","Los vídeos sencillos y reales suelen funcionar mejor que los muy producidos."],"o":[["Hablar con el equipo","contacto"],["Otra pregunta","inicio"]]},"precio":{"m":["Hay dos costes, y van por separado:","<b>1. La inversión en anuncios.<\/b> La pagas tú directamente a Google o a Meta, con tu tarjeta. Ese dinero no pasa por nosotros.<br><br><b>2. Nuestra gestión.<\/b> Un precio cerrado que te damos por escrito antes de empezar, según tu caso.","Lo explicamos con detalle en <a href=\"/cuanto-cuesta-google-ads\">cuánto cuesta Google Ads<\/a>."],"o":[["¿Cuánto debería invertir?","inversion"],["¿Me sale a cuenta?","rentable"],["Pedir precio para mi caso","contacto"],["Otra pregunta","inicio"]]},"inversion":{"m":["No damos una cifra general, porque depende de tu sector, tu zona y lo que vale un cliente para ti. Google y Meta no fijan un mínimo: tú decides cuánto gastar al día.","Empezamos con un presupuesto prudente y solo lo subimos si los datos lo justifican. Si nos cuentas tu caso, te damos una cifra de partida."],"o":[["¿Me sale a cuenta?","rentable"],["Contar mi caso","contacto"],["Otra pregunta","inicio"]]},"rentable":{"m":["Para saberlo necesitas tres números: lo que te paga un cliente, tu margen y cuántas veces te compra.","Con ellos, la <a href=\"/recursos/calculadora-roas\">calculadora de ROAS<\/a> te dice cuánto puedes pagar como máximo por cada cliente, por cada contacto y por cada clic sin perder dinero. Es gratis y no pide correo."],"o":[["¿Qué es el ROAS?","roas"],["Hablar con el equipo","contacto"],["Otra pregunta","inicio"]]},"roas":{"m":["El ROAS es lo que vuelve en ventas por cada euro que inviertes en anuncios. Un ROAS de 4 significa que por cada euro has vendido 4.","Pero vender no es ganar: con un margen del 25 % necesitas un ROAS de 4 solo para no perder. Más términos en el <a href=\"/recursos/glosario-google-ads-meta-ads\">glosario<\/a>."],"o":[["Calcular el mío","rentable"],["Hablar con el equipo","contacto"],["Otra pregunta","inicio"]]},"sector":{"m":["¿A qué se dedica tu negocio?"],"o":[["Negocio local o de servicios","s_local"],["Restaurante o comercio","s_comercio"],["Tienda online","s_tienda"],["Vendo a otras empresas","s_b2b"],["Otra cosa","s_otro"]]},"s_local":{"m":["Encaja muy bien: clínicas, academias, talleres, reformas, abogados… negocios que viven de que les llamen.","Lo habitual es empezar por Google Ads, con búsquedas y Google Maps en tu zona, y medir cada llamada, formulario y WhatsApp para saber qué anuncio trae clientes."],"o":[["¿Cuánto cuesta?","precio"],["Hablar con el equipo","contacto"],["Otra pregunta","inicio"]]},"s_comercio":{"m":["Encaja. Con restaurantes y comercios buscamos reservas, visitas a la tienda y pedidos en la zona.","Google Maps y las búsquedas cercanas captan a quien ya busca dónde ir; Meta Ads te da a conocer con imagen y vídeo a la gente de tu zona."],"o":[["¿Cuánto cuesta?","precio"],["Hablar con el equipo","contacto"],["Otra pregunta","inicio"]]},"s_tienda":{"m":["Encaja. En Google trabajamos campañas de producto (Shopping y Performance Max) y en Instagram, venta con imagen y vídeo.","Antes de lanzar dejamos medida cada venta, para saber qué campaña vende de verdad. Si quieres ver tus números, prueba la <a href=\"/recursos/calculadora-roas\">calculadora de ROAS<\/a>."],"o":[["¿Cuánto cuesta?","precio"],["Hablar con el equipo","contacto"],["Otra pregunta","inicio"]]},"s_b2b":{"m":["Encaja si vendes servicios a otras empresas y buscas contactos cualificados.","Google Ads capta a quien ya busca tu servicio, y cruzamos los contactos con tus ventas para saber cuáles acaban siendo clientes."],"o":[["¿Cuánto cuesta?","precio"],["Hablar con el equipo","contacto"],["Otra pregunta","inicio"]]},"s_otro":{"m":["Trabajamos con pymes que ya venden un producto o servicio probado y tienen a alguien que atiende cada contacto que llega.","Si es tu caso, cuéntanos a qué te dedicas y te decimos si tiene sentido. Si no encaja, también te lo decimos."],"o":[["Contar a qué me dedico","contacto"],["Otra pregunta","inicio"]]},"metodo":{"m":["Así son los tres primeros meses:","<ol><li><b>Semana 1.<\/b> Revisamos tu cuenta, tu web y tus números. Si no tienes cuenta, la creamos a tu nombre.<\/li><li><b>Antes de lanzar.<\/b> Dejamos medidas las llamadas, los formularios y los WhatsApp.<\/li><li><b>Semanas 2–4.<\/b> Lanzamos con un presupuesto prudente.<\/li><li><b>Cada semana.<\/b> Quitamos lo que no vende y movemos el dinero a lo que funciona.<\/li><li><b>Semana 12.<\/b> Revisamos contigo el coste por cliente y decidimos si escalar, mantener o cambiar el rumbo.<\/li><\/ol>"],"o":[["¿Las cuentas son mías?","reglas"],["¿Cuánto cuesta?","precio"],["Hablar con el equipo","contacto"],["Otra pregunta","inicio"]]},"reglas":{"m":["Sí. Google Ads, Meta y la medición se crean a tu nombre: si un día te vas, te lo llevas todo.","Además, pagas los anuncios directamente a Google y a Meta, la gestión tiene un precio cerrado y cada mes recibes un informe que se entiende: cuánto se ha invertido, cuántos contactos han llegado y cuánto ha costado cada uno."],"o":[["Hablar con el equipo","contacto"],["Otra pregunta","inicio"]]},"revisar":{"m":["Se puede revisar. Empezamos por lo que hay: búsquedas por las que pagas, conversiones que se miden y dinero que se pierde.","Si quieres mirarlo tú antes, la <a href=\"/recursos/checklist-google-ads-meta-ads\">checklist<\/a> tiene 11 puntos para revisar tu cuenta sin dejar el correo."],"o":[["Que la revise el equipo","contacto"],["¿Me sale a cuenta?","rentable"],["Otra pregunta","inicio"]]},"plazos":{"m":["Los primeros contactos pueden llegar en los primeros días de campaña. En Meta, además, cada campaña nueva pasa unos días de aprendizaje.","Para decidir con fundamento hacen falta varias semanas de datos; por eso hacemos la revisión de fondo en la semana 12."],"o":[["¿Hay resultados garantizados?","garantia"],["Hablar con el equipo","contacto"],["Otra pregunta","inicio"]]},"garantia":{"m":["No. Nadie puede garantizar un número de clientes con honestidad.","Lo que sí garantizamos es claridad: qué hacemos, cuánto cuesta cada contacto y qué decidimos con esos datos."],"o":[["Hablar con el equipo","contacto"],["Otra pregunta","inicio"]]},"contacto":{"m":["Perfecto. Déjanos tu nombre, tu correo y qué necesitas, y te escribimos para hablar de tu caso."],"o":[]}}, EMAIL = 'hola@urca.agency', WHATSAPP = '';
  var CLAVE = 'urca-chat-v1', CLAVE_VISTO = 'urca-chat-visto-v1';
  var FARO = '<svg class="faro" viewBox="0 0 32 32" width="__T__" height="__T__" aria-hidden="true"><path class="f-haz" d="M17.5 7.2 31 3.5v8.4z"/><path class="f-haz" d="M14.5 7.2 1 3.5v8.4z"/><path class="f-techo" d="M12.5 5.2 16 2l3.5 3.2z"/><rect class="f-luz" x="13.4" y="5.2" width="5.2" height="4" rx=".8"/><rect class="f-techo" x="11.6" y="9.2" width="8.8" height="1.6" rx=".6"/><path class="f-torre" d="M13.2 10.8h5.6L20.6 27H11.4z"/><path class="f-franja" d="M12.7 15.2h6.6l.35 3.2h-7.3zM12.05 21.2h7.9l.35 3.2h-8.6z"/><rect class="f-techo" x="9" y="27" width="14" height="2.4" rx="1"/></svg>';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var estado = { abierto: false, ruta: [] }; // ruta: [[texto elegido, nodo], ...]
  try { var g = JSON.parse(sessionStorage.getItem(CLAVE) || 'null'); if (g && g.ruta) estado = g; } catch (e) {}
  function guardar() { try { sessionStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) {} }
  function medir(ev, datos) {
    try {
      var o = { event: ev }; datos = datos || {}; for (var k in datos) o[k] = datos[k];
      window.dataLayer = window.dataLayer || []; window.dataLayer.push(o);
      if (typeof window.gtag === 'function') window.gtag('event', ev, datos);
    } catch (e) {}
  }
  function el(tag, clase, html) { var n = document.createElement(tag); if (clase) n.className = clase; if (html != null) n.innerHTML = html; return n; }

  // Botón y panel
  var boton = el('button', 'chat-boton');
  boton.type = 'button';
  boton.setAttribute('aria-controls', 'chat-panel'); boton.setAttribute('aria-expanded', 'false');
  boton.innerHTML = FARO.replace(/__T__/g, '30') + '<span class="chat-boton-txt">¿Dudas? Pregunta a Faro</span>';
  boton.setAttribute('aria-label', 'Abrir a Faro, el asistente de URCA');
  var panel = el('section', 'chat-panel');
  panel.id = 'chat-panel'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-labelledby', 'chat-tit');
  panel.innerHTML = '<header class="chat-cab"><span class="chat-avatar" aria-hidden="true">' + FARO.replace(/__T__/g, '26') + '</span><div><p class="chat-tit" id="chat-tit">Faro</p><p class="chat-sub">Asistente automático de URCA</p></div>'
    + '<button type="button" class="chat-icono" data-reinicio aria-label="Empezar de nuevo" title="Empezar de nuevo"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'
    + '<button type="button" class="chat-icono" data-cerrar aria-label="Cerrar el asistente" title="Cerrar"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></header>'
    + '<div class="chat-hilo" role="log" aria-live="polite"></div><div class="chat-opciones" role="group" aria-label="Elige una opción"></div>';
  var hilo = panel.querySelector('.chat-hilo'), opciones = panel.querySelector('.chat-opciones');
  document.body.appendChild(panel); document.body.appendChild(boton);

  // Tras elegir, la respuesta se lee desde su principio: el scroll no baja más allá de la última elección
  var ancla = null;
  function bajar() { hilo.scrollTop = ancla ? Math.min(hilo.scrollHeight, ancla.offsetTop - 12) : hilo.scrollHeight; }
  function burbuja(html, quien) { var b = el('div', 'chat-msj ' + quien, html); hilo.appendChild(b); if (quien === 'yo') ancla = b; bajar(); return b; }
  function escribiendo() { var b = el('div', 'chat-msj bot chat-puntos', '<span></span><span></span><span></span>'); b.setAttribute('aria-hidden', 'true'); hilo.appendChild(b); bajar(); return b; }

  // Muestra los mensajes de un nodo (con «escribiendo…» salvo al restaurar) y luego sus opciones
  var turno = 0;
  function mostrar(id, deprisa, hecho) {
    var n = NODOS[id] || NODOS.inicio, i = 0, mio = ++turno;
    opciones.innerHTML = '';
    (function siguiente() {
      if (mio !== turno) return;
      if (i >= n.m.length) { pintarOpciones(id); bajar(); if (hecho) hecho(); return; }
      var html = n.m[i++];
      if (deprisa || quieto) { burbuja(html, 'bot'); siguiente(); return; }
      var p = escribiendo();
      setTimeout(function () { if (mio !== turno) { p.remove(); return; } p.remove(); burbuja(html, 'bot'); setTimeout(siguiente, 160); },
                 Math.min(900, 320 + html.length * 3));
    })();
  }
  function pintarOpciones(id) {
    opciones.innerHTML = '';
    opciones.classList.toggle('con-form', id === 'contacto');
    if (id === 'contacto') { formulario(); return; }
    NODOS[id].o.forEach(function (o) {
      var b = el('button', 'chat-opcion', o[0]); b.type = 'button';
      b.addEventListener('click', function () { elegir(o[0], o[1]); });
      opciones.appendChild(b);
    });
  }
  function elegir(texto, destino) {
    burbuja(texto, 'yo');
    estado.ruta.push([texto, destino]); guardar();
    medir('chat_opcion', { opcion: texto, nodo: destino });
    if (destino === 'contacto') medir('chat_quiere_contacto', { pagina: location.pathname });
    mostrar(destino, false, function () { var f = opciones.querySelector('button, input'); if (f && !window.matchMedia('(max-width: 760px)').matches) f.focus({ preventScroll: true }); });
  }

  function resumen() {
    return estado.ruta.map(function (r) { return r[0]; }).join(' → ') || '(directo al contacto)';
  }
  function formulario() {
    if (!EMAIL) {
      opciones.appendChild(el('p', 'chat-nota', 'Escríbenos desde el <a href="/contacto">formulario de contacto</a>.'));
      return;
    }
    var f = el('form', 'chat-form');
    f.noValidate = true;
    f.innerHTML = '<label><span>Nombre</span><input name="nombre" autocomplete="name" required></label>'
      + '<label><span>Correo</span><input name="email" type="email" autocomplete="email" required></label>'
      + '<label><span>Qué necesitas</span><textarea name="mensaje" rows="2" placeholder="Ej.: una clínica en Gràcia que quiere más pacientes"></textarea></label>'
      + '<input class="oculto" type="text" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true">'
      + '<label class="chat-casilla"><input type="checkbox" name="privacidad" value="aceptada" required><span>Acepto que URCA use estos datos para responderme. <a href="/privacidad">Privacidad</a>.</span></label>'
      + '<p class="chat-error" role="alert" hidden></p>'
      + '<div class="chat-form-pie"><button class="btn btn-principal btn-peq" type="submit">Enviar</button>'
      + (WHATSAPP ? '<a class="chat-enlace" href="https://wa.me/' + WHATSAPP + '" rel="noopener" target="_blank">o escríbenos por WhatsApp</a>' : '<a class="chat-enlace" href="/contacto">o usa el formulario completo</a>')
      + '</div>';
    var err = f.querySelector('.chat-error');
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (f.elements._honey.value) return;
      var nombre = f.elements.nombre.value.trim(), correo = f.elements.email.value.trim();
      var fallo = !nombre ? 'Falta tu nombre.' : !EMAIL_RE.test(correo) ? 'Revisa el correo: parece incompleto.' : !f.elements.privacidad.checked ? 'Marca la casilla para poder enviarlo.' : '';
      if (fallo) { err.textContent = fallo; err.hidden = false; return; }
      err.hidden = true;
      var b = f.querySelector('button[type=submit]'); b.disabled = true; b.textContent = 'Enviando…';
      var d = new FormData();
      d.append('nombre', nombre); d.append('email', correo);
      d.append('mensaje', f.elements.mensaje.value.trim() || '(sin mensaje)');
      d.append('recorrido_en_el_chat', resumen()); d.append('pagina', location.pathname);
      d.append('privacidad', 'aceptada');
      d.append('_subject', 'Nuevo contacto desde el chat de la web de URCA'); d.append('_template', 'table');
      fetch('https://formsubmit.co/ajax/' + EMAIL, { method: 'POST', headers: { Accept: 'application/json' }, body: d })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (String(j && j.success) !== 'true') throw new Error('sin activar');
          opciones.innerHTML = ''; opciones.classList.remove('con-form');
          burbuja('Enviado: ' + nombre.replace(/[<>&]/g, '') + ', ' + correo.replace(/[<>&]/g, ''), 'yo');
          burbuja('Recibido. Te escribimos pronto para hablar de tu caso. Mientras tanto, puedes seguir mirando la web.', 'bot');
          medir('generate_lead', { origen: 'chat' });
          estado.ruta = []; estado.enviado = true; guardar();
          var o = el('button', 'chat-opcion', 'Hacer otra pregunta'); o.type = 'button';
          o.addEventListener('click', function () { reiniciar(); }); opciones.appendChild(o);
        })
        .catch(function () {
          b.disabled = false; b.textContent = 'Enviar';
          err.innerHTML = 'No se ha podido enviar. Escríbenos a <a href="mailto:' + EMAIL + '">' + EMAIL + '</a> o usa el <a href="/contacto">formulario de contacto</a>.';
          err.hidden = false;
        });
    });
    opciones.appendChild(f);
  }

  function reiniciar() {
    turno++; hilo.innerHTML = ''; ancla = null; estado.ruta = []; guardar(); mostrar('inicio');
  }
  function abrir(origen) {
    panel.hidden = false; boton.setAttribute('aria-expanded', 'true'); document.documentElement.classList.add('chat-abierto');
    if (!estado.abierto) medir('chat_abierto', { origen: origen || 'boton', pagina: location.pathname });
    estado.abierto = true; guardar();
    if (!hilo.children.length) {
      if (estado.ruta.length) {   // vuelve a pintar la conversación de esta visita
        mostrar('inicio', true);
        estado.ruta.forEach(function (r) { burbuja(r[0], 'yo'); mostrar(r[1], true); });
      } else mostrar('inicio');
    }
    try { (panel.querySelector('.chat-opcion') || panel.querySelector('[data-cerrar]')).focus({ preventScroll: true }); } catch (e) {}
  }
  function cerrar() {
    panel.hidden = true; boton.setAttribute('aria-expanded', 'false'); document.documentElement.classList.remove('chat-abierto');
    estado.abierto = false; guardar(); boton.focus({ preventScroll: true });
  }
  boton.addEventListener('click', function () { panel.hidden ? abrir('boton') : cerrar(); });
  panel.querySelector('[data-cerrar]').addEventListener('click', cerrar);
  panel.querySelector('[data-reinicio]').addEventListener('click', reiniciar);
  panel.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') cerrar(); });
  // Un enlace dentro del chat lleva a otra página: el chat sigue abierto allí
  hilo.addEventListener('click', function (ev) { var a = ev.target.closest && ev.target.closest('a'); if (a) { estado.abierto = true; guardar(); medir('chat_enlace', { destino: a.getAttribute('href') }); } });

  if (estado.abierto && !window.matchMedia('(max-width: 760px)').matches) abrir('continua');
  else if (estado.abierto) { estado.abierto = false; guardar(); }

  // Faro aparece sin molestar: en la primera página de la visita entra despacio y da tres destellos;
  // en las siguientes ya está ahí, quieto. Sin avisos emergentes.
  var visto = false; try { visto = sessionStorage.getItem(CLAVE_VISTO) === '1'; } catch (e) {}
  if (!visto && !quieto) boton.classList.add('entra');
  try { sessionStorage.setItem(CLAVE_VISTO, '1'); } catch (e) {}
})();
