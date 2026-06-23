# SEO Deployment Checklist

Use this checklist to ensure proper SEO setup after deploying the sitemap changes.

## Pre-Deployment

- [ ] Verify environment variables are set:
  ```bash
  NEXT_PUBLIC_APP_URL=https://liteevent.com
  NEXT_PUBLIC_API_URL=https://api.liteevent.com/api
  ```

- [ ] Test sitemap locally:
  ```bash
  cd event-plateform/web
  npm run dev
  # Visit: http://localhost:3000/sitemap.xml
  ```

- [ ] Test robots.txt locally:
  ```bash
  # Visit: http://localhost:3000/robots.txt
  ```

- [ ] Verify backend API endpoint works:
  ```bash
  curl http://localhost:5000/api/events/public-sitemap
  ```

## Deployment Steps

1. **Deploy Backend API First**
   ```bash
   cd event-plateform/api
   # Deploy via your CI/CD pipeline
   ```

2. **Verify Backend API Endpoint**
   ```bash
   curl https://api.liteevent.com/api/events/public-sitemap
   # Should return: {"success":true,"data":{"events":[...]}}
   ```

3. **Deploy Web Frontend**
   ```bash
   cd event-plateform/web
   npm run build
   # Deploy via your CI/CD pipeline
   ```

4. **Verify Sitemap in Production**
   ```bash
   curl https://liteevent.com/sitemap.xml
   # Should return valid XML
   ```

5. **Verify Robots.txt in Production**
   ```bash
   curl https://liteevent.com/robots.txt
   # Should return robots.txt content
   ```

## Post-Deployment

### 1. Validate XML Structure
- [ ] Use [XML Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html)
- [ ] Paste: `https://liteevent.com/sitemap.xml`
- [ ] Ensure no errors

### 2. Test Structured Data
- [ ] Go to [Google Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Test a public event page: `https://liteevent.com/e/[event-slug]`
- [ ] Verify "Event" structured data is detected

### 3. Google Search Console Setup

#### Add Property
- [ ] Go to [Google Search Console](https://search.google.com/search-console)
- [ ] Click "Add Property"
- [ ] Enter: `https://liteevent.com`
- [ ] Choose verification method

#### Verification Options

**Option 1: HTML Tag (Recommended)**
- [ ] Copy verification meta tag from Google
- [ ] Edit `event-plateform/web/src/app/layout.js`:
  ```javascript
  verification: {
    google: 'your-verification-code-here',
  },
  ```
- [ ] Redeploy web frontend
- [ ] Click "Verify" in Google Search Console

**Option 2: DNS TXT Record**
- [ ] Add TXT record to your DNS:
  ```
  TXT @ google-site-verification=your-code
  ```
- [ ] Wait for DNS propagation (5-30 minutes)
- [ ] Click "Verify" in Google Search Console

**Option 3: HTML File**
- [ ] Download verification file
- [ ] Place in `event-plateform/web/public/`
- [ ] Redeploy
- [ ] Verify file accessible: `https://liteevent.com/google-verification-file.html`
- [ ] Click "Verify" in Google Search Console

#### Submit Sitemap
- [ ] In Google Search Console, go to **Sitemaps** section
- [ ] Enter: `https://liteevent.com/sitemap.xml`
- [ ] Click **Submit**
- [ ] Wait 24-48 hours for initial crawl
- [ ] Check for errors in the report

### 4. Bing Webmaster Tools Setup (Optional)

- [ ] Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [ ] Click "Add a Site"
- [ ] Enter: `https://liteevent.com`
- [ ] Import settings from Google (if verified there)
- [ ] Or manually verify using similar methods as Google
- [ ] Submit sitemap: `https://liteevent.com/sitemap.xml`

### 5. Monitor Initial Indexing

**Week 1**
- [ ] Check Google Search Console > Coverage report
- [ ] Verify pages are being discovered
- [ ] Fix any errors reported

**Week 2-4**
- [ ] Monitor search appearance in Google Search Console > Performance
- [ ] Check which pages are getting impressions
- [ ] Review mobile usability report
- [ ] Check Core Web Vitals

**Month 2+**
- [ ] Analyze search traffic trends
- [ ] Optimize meta descriptions for high-impression, low-CTR pages
- [ ] Update content based on search queries

## Testing Production URLs

### Check Homepage
```bash
curl -I https://liteevent.com
# Should return: 200 OK
```

### Check Sitemap
```bash
curl https://liteevent.com/sitemap.xml | head -20
# Should show XML structure with URLs
```

### Check Robots.txt
```bash
curl https://liteevent.com/robots.txt
# Should show robots directives
```

### Check Public Event Page
```bash
# Replace [slug] with actual event slug
curl -I https://liteevent.com/e/[slug]
# Should return: 200 OK
```

### Check API Endpoint
```bash
curl https://api.liteevent.com/api/events/public-sitemap
# Should return JSON with events array
```

## Troubleshooting

### Sitemap Returns 404
- [ ] Check Next.js build output for errors
- [ ] Verify `src/app/sitemap.ts` is in the correct location
- [ ] Check deployment logs
- [ ] Verify production build includes sitemap route

### Sitemap Returns Empty
- [ ] Verify backend API is accessible
- [ ] Check `NEXT_PUBLIC_API_URL` environment variable
- [ ] Ensure database has published public events
- [ ] Check API response: `curl https://api.liteevent.com/api/events/public-sitemap`

### Events Not Appearing
- [ ] Verify events in database:
  ```sql
  SELECT slug, status, visibility, deleted_at 
  FROM events 
  WHERE status = 'PUBLISHED' AND visibility = 'PUBLIC' AND deleted_at IS NULL;
  ```
- [ ] Check API returns events
- [ ] Verify sitemap fetch logic in `sitemap.ts`

### Google Can't Fetch Sitemap
- [ ] Ensure sitemap is not behind authentication
- [ ] Check firewall/CDN rules allow Googlebot
- [ ] Verify HTTPS certificate is valid
- [ ] Test with: `curl -A "Googlebot" https://liteevent.com/sitemap.xml`

### Structured Data Not Detected
- [ ] Check event page source code for `<script type="application/ld+json">`
- [ ] Validate JSON-LD syntax
- [ ] Use [Schema Markup Validator](https://validator.schema.org/)
- [ ] Ensure event data fields are populated

## Performance Optimization

### After Initial Setup
- [ ] Monitor sitemap generation time
- [ ] If slow (>2 seconds), consider:
  - Adding database index on `status` and `visibility` columns
  - Implementing sitemap caching
  - Splitting into multiple sitemaps if >10,000 URLs

### Database Index (if needed)
```sql
-- Only if sitemap generation is slow
CREATE INDEX idx_events_sitemap ON events(status, visibility, deleted_at) 
WHERE status = 'PUBLISHED' AND visibility = 'PUBLIC' AND deleted_at IS NULL;
```

## Success Metrics

Track these metrics monthly:

- [ ] Number of pages indexed (Google Search Console > Coverage)
- [ ] Sitemap submission status (no errors)
- [ ] Organic search traffic increase
- [ ] Event pages appearing in search results
- [ ] Click-through rate (CTR) from search
- [ ] Average position in search results

## Next Steps (Future Enhancements)

- [ ] Add Google Analytics 4 integration
- [ ] Implement event-specific schema markup improvements
- [ ] Add breadcrumb structured data
- [ ] Optimize images for search (alt tags, file names)
- [ ] Create content marketing strategy
- [ ] Build backlinks to event pages
- [ ] Implement dynamic sitemap index for large sites
- [ ] Add multi-language support (hreflang tags)

---

**Deployment Date**: _______________  
**Verified By**: _______________  
**Google Search Console Verification**: _______________
