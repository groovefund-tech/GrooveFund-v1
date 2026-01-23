// next-sitemap.config.js

module.exports = {
  siteUrl: process.env.SITE_URL || 'https://groovefund.co.za',
  generateRobotsTxt: true, // Also generates robots.txt
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 50000,
  
  // Exclude pages you don't want in sitemap
  exclude: ['/admin/*', '/api/*', '/404', '/500', '/_app', '/_document'],
  
  // Alternate URLs (for multi-language, if needed)
  // alternateRefs: [],
  
  // Transform function to customize each entry
  transform: async (config, path) => {
    // Customize priority and changefreq per page
    let priority = 0.7;
    let changefreq = 'weekly';

    // Homepage gets highest priority
    if (path === '') {
      priority = 1.0;
      changefreq = 'daily';
    }

    // Key pages
    if (path === '/how-it-works' || path === '/blog') {
      priority = 0.9;
      changefreq = 'weekly';
    }

    // Auth pages lower priority
    if (path.includes('/login') || path.includes('/signup')) {
      priority = 0.6;
      changefreq = 'monthly';
    }

    // Blog posts change frequently
    if (path.includes('/blog/')) {
      priority = 0.8;
      changefreq = 'weekly';
    }

    return {
      loc: `${config.siteUrl}${path}`,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    };
  },

  // Custom robots.txt rules
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
    ],
  },
};