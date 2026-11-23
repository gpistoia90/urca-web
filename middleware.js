// Protección con contraseña de /brief (formulario de pre-kickoff para clientes)
//
// Solo actúa si existe la variable de entorno BRIEF_PASSWORD en Vercel
// (Settings > Environment Variables). Sin ella, /brief queda abierto
// para quien tenga el enlace, como cualquier página oculta.
//
// El navegador pide usuario y contraseña: el usuario da igual, solo se comprueba la contraseña.

export const config = { matcher: ["/brief", "/brief.html"] };

export default function middleware(request) {
  const clave = process.env.BRIEF_PASSWORD;
  if (!clave) return; // sin contraseña configurada: deja pasar

  const auth = request.headers.get("authorization") || "";
  if (auth.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const pass = decoded.slice(decoded.indexOf(":") + 1);
      if (pass === clave) return; // correcta: sirve la página
    } catch (e) {}
  }

  return new Response("Acceso restringido. Pide la contraseña a tu contacto en URCA.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="URCA - Brief de cliente", charset="UTF-8"',
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow"
    }
  });
}
