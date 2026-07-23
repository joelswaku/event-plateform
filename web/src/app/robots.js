// Dynamic robots.txt for Next.js App Router
// This generates robots.txt automatically at https://liteevent.com/robots.txt

export default function robots() {
  const baseUrl = 'https://liteevent.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/dashboard/*',
          '/events/',
          '/planner/',
          '/settings/',
          '/billing/',
          '/api/',
          '/invitation/',
          '/invite/',
          '/my-tickets',
          '/team/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
