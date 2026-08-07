import { rewrite, next } from '@vercel/edge';

export const config = {
  matcher: '/:path*',
};

export default function middleware(request) {
  const host = (request.headers.get('host') || '').split(':')[0];
  const slug = host.split('.')[0];

  // Sicherheitsnetz: Hauptseite nicht anfassen
  if (!slug || slug === 'www' || slug === 'machmalweb') {
    return next();
  }

  const url = new URL(request.url);

  // Demos aus Google raushalten
  if (url.pathname === '/robots.txt') {
    return new Response('User-agent: *\nDisallow: /\n', {
      headers: { 'content-type': 'text/plain' },
    });
  }

  // <slug>.machmalweb.de/<pfad> -> Ordner /<slug>/<pfad>
  // Pfade ohne Dateiendung (Seiten wie / oder /datenschutz) auf index.html aufloesen
  let path = url.pathname;
  const lastSegment = path.split('/').pop();
  if (!lastSegment.includes('.')) {
    path = path.replace(/\/$/, '') + '/index.html';
  }
  return rewrite(new URL(`/${slug}${path}`, request.url));
}
