import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lumina-vocab.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/dashboard/', '/library/', '/vocabulary/', '/settings/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
