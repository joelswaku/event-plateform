# SEO Setup Guide for LiteEvent

This document explains the SEO implementation for the LiteEvent platform.

## Files Added/Modified

### 1. Sitemap (`src/app/sitemap.ts`)
- **Purpose**: Generates dynamic XML sitemap for search engines
- **Route**: Accessible at `https://liteevent.com/sitemap.xml`
- **Includes**:
  - Static pages (homepage, legal pages, auth pages)
  - Dynamic public event pages (`/e/[slug]`)
  - Event ticketing pages (`/e/[slug]/tickets`)
- **Revalidation**: Automatically revalidates every hour

### 2. Robots.txt (`public/robots.txt`)
- **Purpose**: Instructs search engines which pages to crawl/index
- **Route**: Accessible at `https://liteevent.com/robots.txt`
- **Configuration**:
  - Allows public event pages and legal pages
  - Disallows private pages (dashboard, settings, API routes)
  - Disallows auth pages to prevent duplicate content
  - References sitemap location

### 3. Enhanced Metadata (`src/app/layout.js`)
- **Updates**:
  - Comprehensive meta tags (title, description, keywords)
  - Open Graph tags for social media sharing
  - Twitter Card tags
  - Robots directives for search engines
  - Structured metadata base URL

### 4. Backend API Endpoint
- **Route**: `GET /api/events/public-sitemap`
- **Purpose**: Returns all published public events for sitemap generation
- **Files Modified**:
  - `api/services/events.service.js` - Added `getAllPublishedPublicEventsService()`
  - `api/controllers/events.controller.js` - Added `getAllPublishedPublicEvents()`
  - `api/routes/events.routes.js` - Added route handler

## How It Works

### Sitemap Generation Flow
1. Next.js calls `sitemap()` function in `src/app/sitemap.ts`
2. Function fetches published public events from backend API
3. Combines static routes + dynamic event routes
4. Returns XML sitemap to search engines
5. Sitemap auto-refreshes every hour

### Event Visibility Requirements
Events appear in sitemap only when:
- `status = 'PUBLISHED'`
- `visibility = 'PUBLIC'`
- `deleted_at IS NULL`

## Google Search Console Setup

### Step 1: Verify Your Site
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://liteevent.com`
3. Choose verification method:
   - **HTML tag** (recommended): Add to `src/app/layout.js` in `metadata.verification.google`
   - **DNS record**: Add TXT record to your domain DNS
   - **HTML file**: Upload verification file to `public/` folder

### Step 2: Submit Sitemap
1. In Google Search Console, navigate to **Sitemaps**
2. Enter sitemap URL: `https://liteevent.com/sitemap.xml`
3. Click **Submit**
4. Google will start crawling your pages within 24-48 hours

### Step 3: Monitor Performance
- Check **Coverage** report for indexing issues
- Monitor **Performance** for search analytics
- Review **Enhancements** for mobile usability and Core Web Vitals

## Bing Webmaster Tools Setup

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Add your site: `https://liteevent.com`
3. Verify ownership (similar to Google)
4. Submit sitemap: `https://liteevent.com/sitemap.xml`

## Testing

### Local Testing (Development)
```bash
# Start the web app
cd event-plateform/web
npm run dev

# Visit in browser:
# http://localhost:3000/sitemap.xml
# http://localhost:3000/robots.txt
```

### Production Testing
```bash
# After deployment, verify:
curl https://liteevent.com/sitemap.xml
curl https://liteevent.com/robots.txt

# Check sitemap structure:
curl https://liteevent.com/sitemap.xml | xmllint --format -
```

### Validation Tools
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [XML Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html)
- [Robots.txt Tester](https://support.google.com/webmasters/answer/6062598)

## Environment Variables Required

Make sure these are set in production:

```env
NEXT_PUBLIC_APP_URL=https://liteevent.com
NEXT_PUBLIC_API_URL=https://api.liteevent.com/api
# or
INTERNAL_API_URL=http://your-internal-api/api
```

## Customization

### Adding More Static Pages
Edit `event-plateform/web/src/app/sitemap.ts`:

```typescript
const staticRoutes: MetadataRoute.Sitemap = [
  // ... existing routes
  {
    url: `${baseUrl}/your-new-page`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
];
```

### Adding Google Verification Code
Edit `event-plateform/web/src/app/layout.js`:

```javascript
verification: {
  google: 'your-google-verification-code',
  bing: 'your-bing-verification-code',
},
```

### Adjusting Crawl Permissions
Edit `event-plateform/web/public/robots.txt`:

```txt
# Allow specific pages
Allow: /your-page

# Disallow specific pages
Disallow: /private-page
```

## Best Practices

### For Event Organizers
- Use descriptive event titles (appears in search results)
- Add compelling event descriptions with keywords
- Upload high-quality cover images (used in social sharing)
- Set events to `PUBLIC` and `PUBLISHED` for indexing

### For Platform Admins
- Monitor sitemap size (Google has 50MB/50,000 URLs limit)
- Keep robots.txt updated with new private routes
- Submit sitemap after major content changes
- Review Search Console weekly for issues

## Troubleshooting

### Sitemap Returns Empty or 404
1. Check backend API is running
2. Verify `NEXT_PUBLIC_API_URL` is set correctly
3. Ensure database has published public events
4. Check logs: `console.log` statements in `sitemap.ts`

### Events Not Appearing in Sitemap
1. Verify event status: `SELECT status, visibility FROM events WHERE id = X`
2. Must be: `status='PUBLISHED'` AND `visibility='PUBLIC'`
3. Check API endpoint: `curl https://your-api.com/api/events/public-sitemap`

### Google Says "Couldn't Fetch Sitemap"
1. Verify sitemap is accessible publicly (not behind auth)
2. Check firewall/security rules allow Google crawler
3. Ensure HTTPS certificate is valid
4. Test with: `curl -I https://liteevent.com/sitemap.xml`

### Pages Not Indexed After Submission
- Google can take 1-7 days to index new pages
- Check robots.txt isn't blocking the page
- Ensure page returns 200 OK status
- Use "URL Inspection" tool in Search Console to request indexing

## Additional SEO Enhancements (Future)

Consider implementing:
- [ ] Structured data (JSON-LD) for events (schema.org/Event)
- [ ] Canonical URLs for duplicate content prevention
- [ ] Breadcrumb navigation with schema markup
- [ ] Image alt tags optimization
- [ ] Page speed optimization (lazy loading, image compression)
- [ ] Mobile-first responsive design (already implemented)
- [ ] Analytics integration (Google Analytics 4)
- [ ] Social media meta tags per event page (already implemented)

## Resources

- [Next.js Sitemap Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Google Search Central](https://developers.google.com/search)
- [Robots.txt Specification](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- [Schema.org Event Markup](https://schema.org/Event)

---

**Last Updated**: 2026-06-23  
**Implemented By**: Claude Code
