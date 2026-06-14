# ☁️ Cloudflare DNS Setup for LiteEvent

Your domain: **liteevent.com** is in Cloudflare - Perfect! 🎉

## 📋 DNS Records to Add

### Step 1: SSL Certificate Validation (Do This NOW)

Go to Cloudflare Dashboard → Your domain → DNS → Add record

**Add this CNAME record:**
```
Type: CNAME
Name: _465cfda4f0770e4ab7d25a996681c6e8
Target: _dc4028464374f12d3e2f60ebce528e76.jkddzztszm.acm-validations.aws.
Proxy status: DNS only (grey cloud) ⚠️ IMPORTANT!
TTL: Auto
```

⚠️ **IMPORTANT:** Make sure proxy is OFF (grey cloud icon) for this record!

This validates your SSL certificate so you can enable HTTPS later.

---

### Step 2: Point Domains to AWS (AFTER deployment completes)

Once deployment finishes, I'll give you the ALB DNS name. Then add these records:

**Main Domain:**
```
Type: CNAME
Name: @  (or liteevent.com)
Target: <ALB-DNS-NAME>  (I'll provide this)
Proxy status: Proxied (orange cloud) 🟠 or DNS only (grey cloud)
TTL: Auto
```

**API Subdomain:**
```
Type: CNAME
Name: api
Target: <ALB-DNS-NAME>  (same as above)
Proxy status: DNS only (grey cloud) ⚠️ IMPORTANT for API!
TTL: Auto
```

**Vendors Subdomain:**
```
Type: CNAME
Name: vendors
Target: <ALB-DNS-NAME>  (same as above)
Proxy status: Proxied (orange cloud) 🟠 or DNS only (grey cloud)
TTL: Auto
```

---

## 🔒 Cloudflare Proxy Status Explained

**🟠 Proxied (Orange Cloud):**
- Traffic goes through Cloudflare
- Free DDoS protection
- Free SSL/TLS (Cloudflare certificate)
- Caching and performance
- Hides your AWS IP

**⚫ DNS Only (Grey Cloud):**
- Direct connection to AWS
- No Cloudflare proxy
- Use AWS certificate
- Lower latency
- Required for some services

### Recommended Settings:

| Domain | Proxy Status | Why |
|--------|-------------|-----|
| liteevent.com | 🟠 Proxied | Free SSL + DDoS protection |
| api.liteevent.com | ⚫ DNS Only | API needs direct connection |
| vendors.liteevent.com | 🟠 Proxied | Free SSL + protection |

---

## 🎯 Quick Setup Guide

### Right Now (While Deployment Runs):

1. **Login to Cloudflare Dashboard**
   - Go to: https://dash.cloudflare.com
   - Select your domain: liteevent.com

2. **Add SSL Validation Record**
   - Click "DNS" in the left menu
   - Click "Add record"
   - Type: CNAME
   - Name: `_465cfda4f0770e4ab7d25a996681c6e8`
   - Target: `_dc4028464374f12d3e2f60ebce528e76.jkddzztszm.acm-validations.aws.`
   - Proxy status: **DNS only** (grey cloud)
   - Click "Save"

3. **Wait for Validation**
   - AWS will check the DNS record
   - Usually takes 5-10 minutes
   - Certificate will change from "Pending" to "Issued"

---

### After Deployment Completes:

I'll give you the ALB DNS name (looks like: `liteevent-production-alb-123456789.us-east-1.elb.amazonaws.com`)

Then add these 3 CNAME records in Cloudflare:

1. **@** → ALB DNS (Proxied 🟠)
2. **api** → ALB DNS (DNS only ⚫)
3. **vendors** → ALB DNS (Proxied 🟠)

---

## ⚡ Cloudflare SSL/TLS Settings

After adding DNS records:

1. Go to: **SSL/TLS** in Cloudflare
2. Set encryption mode to: **Full** or **Full (strict)**
   - NOT "Flexible" (causes redirect loops)
3. Enable "Always Use HTTPS" (optional, for later when you add HTTPS to AWS)

---

## 🧪 Test After Setup

Once DNS propagates (5-30 minutes):

```bash
# Check DNS
nslookup liteevent.com
nslookup api.liteevent.com
nslookup vendors.liteevent.com

# Test URLs (after Docker images deployed)
curl http://liteevent.com
curl http://api.liteevent.com/health
curl http://vendors.liteevent.com
```

---

## 📝 Notes

- DNS changes can take 5-30 minutes to propagate
- Cloudflare proxy is FREE and recommended for web/vendors
- API subdomain should use DNS only (no proxy) for best performance
- SSL validation record only needs to exist until certificate is issued

---

**Ready to add the SSL validation record now?**

1. Go to Cloudflare
2. Add the CNAME record above
3. Come back here - deployment should be finishing soon!
