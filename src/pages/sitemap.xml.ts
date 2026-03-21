import type { APIRoute } from 'astro';

const staticPages = [
  '',
  'about',
  'contact',
  'portfolio',
  'quoter',
  'blog',
  'bloog/cuanto-cuesta-diseno-arquitectonico',
  'blog/cuanto-cuesta-construccion',
  'ubicacion/sangolqui',
  'ubicacion/quito',
];

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.toString() || 'https://acimu.studio';

  // Generar el XML del sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${staticPages
  .map((page) => {
    const url = page === '' ? siteUrl : `${siteUrl}${page}`;
    // Prioridad más alta para páginas importantes
    const priority = getPriority(page);
    const changefreq = getChangeFreq(page);

    return `  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  })
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};

function getPriority(page: string): string {
  // Páginas principales tienen máxima prioridad
  if (page === '') return '1.0';
  if (page === 'contact' || page === 'quoter') return '0.9';
  if (page.startsWith('ubicacion/') || page.startsWith('servicios/'))
    return '0.8';
  if (page === 'portfolio') return '0.7';
  return '0.6';
}

function getChangeFreq(page: string): string {
  if (page === '') return 'weekly';
  if (page === 'blog' || page === 'portfolio') return 'weekly';
  if (page === 'contact' || page === 'quoter') return 'monthly';
  return 'monthly';
}
