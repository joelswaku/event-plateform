# Production Setup Checklist

Use this to track your progress!

---

## 🎯 STEP 1: SSL Certificate (5-10 min)

- [ ] Requested certificate in ACM for `liteevent.com` and `*.liteevent.com`
- [ ] Got CNAME validation records from ACM
- [ ] Added CNAME records to DNS
- [ ] Certificate status changed to **"Issued"** in ACM
- [ ] Copied certificate ARN

**Certificate ARN:**
```
_______________________________________________
```

---

## 🌐 STEP 2: DNS Configuration (5 min)

- [ ] Added DNS record: `liteevent.com` → ALB (CNAME or A record)
- [ ] Added DNS record: `api.liteevent.com` → ALB
- [ ] Added DNS record: `vendors.liteevent.com` → ALB
- [ ] Added ACM validation CNAME record(s)
- [ ] Turned OFF Cloudflare proxy (if using Cloudflare)
- [ ] DNS propagated (test with `nslookup liteevent.com`)

**Test DNS:**
```powershell
nslookup liteevent.com
nslookup api.liteevent.com
```

---

## 🔒 STEP 3: Enable HTTPS (3 min)

- [ ] Updated `terraform.tfvars` with certificate ARN
- [ ] Ran `terraform apply -auto-approve`
- [ ] Terraform completed successfully
- [ ] ALB now has HTTPS listener (port 443)
- [ ] HTTP redirects to HTTPS

**Test HTTPS:**
```
https://liteevent.com/health
```

---

## 📈 STEP 4: Scale to 2 Tasks (2 min)

- [ ] Went to ECS service page
- [ ] Updated desired tasks to **2**
- [ ] Waited for 2 tasks to be RUNNING
- [ ] Checked target group shows 2 HEALTHY targets

**Verify:**
- Tasks: https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services/liteevent-production-api-service/health?region=us-east-1

---

## 🚨 STEP 5: CloudWatch Monitoring (5 min)

- [ ] Created alarm: `liteevent-production-api-unhealthy`
- [ ] Configured SNS topic with email: `joelswaku@gmail.com`
- [ ] Confirmed SNS subscription via email
- [ ] Alarm status is **OK** (green)

**Optional alarms created:**
- [ ] High CPU alarm (>80%)
- [ ] High Memory alarm (>80%)
- [ ] Slow response time alarm (>5s)

---

## ✅ FINAL VERIFICATION

### Test all endpoints:

- [ ] https://liteevent.com/health → Returns `{"success":true}`
- [ ] https://api.liteevent.com/health → Returns `{"success":true}`
- [ ] https://vendors.liteevent.com → Loads without error
- [ ] http://liteevent.com → Redirects to HTTPS
- [ ] Web app loads at https://liteevent.com
- [ ] API is accessible from web app

### Check infrastructure:

- [ ] 2 ECS tasks RUNNING for API service
- [ ] 2 targets HEALTHY in ALB target group
- [ ] CloudWatch alarms show **OK** status
- [ ] CloudWatch logs showing no errors
- [ ] SSL certificate valid (no browser warnings)

---

## 🎉 SUCCESS CRITERIA

All boxes checked above = **PRODUCTION READY!** 🚀

---

## 📝 Notes

**Current Status:**
```
Date: ___________
Time spent: ___________
Issues encountered: ___________
```

**Certificate Details:**
```
Certificate ARN: _______________________________________________
Issued date: ___________
Expires: ___________
```

**Performance Metrics:**
```
API Response Time: ___________ ms
Uptime: ___________ %
Active users: ___________
```

---

## 🆘 Troubleshooting

**Certificate stuck at "Pending validation":**
- Double-check CNAME records in DNS
- Wait 30 minutes and refresh
- Make sure DNS records don't have proxy enabled

**HTTPS not working:**
- Check certificate ARN is correct in terraform.tfvars
- Verify Terraform apply completed without errors
- Check ALB has port 443 listener

**DNS not resolving:**
- Wait for DNS propagation (up to 48 hours, usually <10 min)
- Clear your DNS cache: `ipconfig /flushdns`
- Test with: `nslookup liteevent.com 8.8.8.8`

**Tasks not scaling:**
- Check CloudWatch logs for container errors
- Verify database connection is working
- Make sure there's enough capacity in your account

---

**Time to complete: ~20 minutes**
**Ready? Start with STEP 1!** 🎯
