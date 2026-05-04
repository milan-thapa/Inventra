import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/'], // Keep internal business data private
    },
    sitemap: 'https://inventra.com/sitemap.xml',
  }
}
