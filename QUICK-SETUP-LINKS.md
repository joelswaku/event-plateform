# 🚀 Quick Setup - Direct Links

Click these links in order:

---

## 1️⃣ Request SSL Certificate (5 min)
**Go here:** https://console.aws.amazon.com/acm/home?region=us-east-1#/certificates/request

**What to do:**
1. Select "Request a public certificate" → Next
2. Add domains:
   - `liteevent.com`
   - `*.liteevent.com`
3. Choose "DNS validation" → Next → Request
4. **SAVE THE CNAME RECORDS** - you'll add them to your DNS

---

## 2️⃣ Configure DNS

**Your ALB URL:**
```
liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com
```

**Cloudflare (if you use it):**
https://dash.cloudflare.com

**Add these DNS records:**

| Type  | Name    | Target                                                              | Proxy  |
|-------|---------|---------------------------------------------------------------------|--------|
| CNAME | @       | liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com     | ☁️ OFF |
| CNAME | api     | liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com     | ☁️ OFF |
| CNAME | vendors | liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com     | ☁️ OFF |
| CNAME | _xxx    | _yyy.acm-validations.aws. *(from ACM)*                              | ☁️ OFF |

⚠️ **IMPORTANT:** Turn OFF Cloudflare proxy (gray cloud) for ALL records!

---

## 3️⃣ Scale to 2 Tasks (2 min)

**Go here:** https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services/liteevent-production-api-service/update-service?region=us-east-1

1. Set "Desired tasks" to **2**
2. Click "Update"

---

## 4️⃣ Create CloudWatch Alarm (3 min)

**Go here:** https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#alarmsV2:alarm/create-alarm

**Quick settings:**
- Metric: **Application Load Balancer** → **Per AppELB, per TG Metrics**
- Search: **liteevent-production-api-tg**
- Select: **HealthyHostCount**
- Threshold: **Lower than 1**
- Email: **joelswaku@gmail.com**
- Name: **liteevent-production-api-unhealthy**

---

## 5️⃣ Enable HTTPS (After certificate is issued)

**Check certificate status:**
https://console.aws.amazon.com/acm/home?region=us-east-1#/certificates/list

When status = **"Issued"**:

1. Click the certificate
2. Copy the ARN (arn:aws:acm:us-east-1:...)
3. Edit: `C:\projects\event-plateform\terraform\environments\production\terraform.tfvars`
4. Update:
   ```hcl
   acm_certificate_arn = "arn:aws:acm:us-east-1:455697799547:certificate/YOUR-CERT-ID"
   ```
5. Run:
   ```powershell
   cd C:\projects\event-plateform\terraform\environments\production
   terraform apply -auto-approve
   ```

---

## ✅ Test Everything

**After all steps:**

```
https://liteevent.com/health
https://api.liteevent.com/health
```

Should return:
```json
{"success":true,"message":"API is healthy"}
```

---

## 📊 Monitor Your App

**ECS Service:**
https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services?region=us-east-1

**CloudWatch Logs:**
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Fecs$252Fliteevent-production$252Fapi

**CloudWatch Alarms:**
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#alarmsV2:

**Target Group Health:**
https://console.aws.amazon.com/ec2/home?region=us-east-1#TargetGroups:

---

**Time estimate: 15-20 minutes total** ⏱️

**Start with Step 1!** 🚀
