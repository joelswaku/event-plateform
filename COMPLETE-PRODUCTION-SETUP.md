# Complete Production Setup Guide

## Current Status
✅ API is healthy and running
✅ Database is configured
✅ Containers are deployed

## Tasks to Complete
1. ✅ Request SSL Certificate
2. ✅ Configure Domain DNS
3. ✅ Enable HTTPS on ALB
4. ✅ Scale to 2 tasks
5. ✅ Set up monitoring

---

## STEP 1: Request SSL Certificate

### 1.1 Go to AWS Certificate Manager
**URL:** https://console.aws.amazon.com/acm/home?region=us-east-1

### 1.2 Request Certificate
1. Click **"Request certificate"**
2. Choose **"Request a public certificate"**
3. Click **"Next"**

### 1.3 Enter Domain Names
**Add these domain names:**
```
liteevent.com
*.liteevent.com
```
*(The wildcard *.liteevent.com covers all subdomains like api.liteevent.com, vendors.liteevent.com)*

4. Click **"Next"**

### 1.4 Validation Method
1. Choose **"DNS validation"**
2. Click **"Next"**
3. Click **"Request"**

### 1.5 Add DNS Validation Records
After requesting, you'll see CNAME records to add. **KEEP THIS PAGE OPEN.**

Example:
```
Name: _abc123.liteevent.com
Type: CNAME
Value: _xyz789.acm-validations.aws.
```

---

## STEP 2: Configure DNS (Choose Your DNS Provider)

### Option A: Using Cloudflare (Recommended)

1. **Go to Cloudflare Dashboard:** https://dash.cloudflare.com
2. Select your domain: **liteevent.com**
3. Click **"DNS"** → **"Records"**

4. **Add Certificate Validation Records:**
   - Copy the CNAME records from ACM (Step 1.5)
   - In Cloudflare, click **"Add record"**
   - Type: **CNAME**
   - Name: *(copy from ACM, remove .liteevent.com)*
   - Target: *(copy from ACM)*
   - Proxy status: **DNS only** (gray cloud, NOT orange)
   - Click **"Save"**

5. **Add ALB DNS Records:**

   **Root domain (liteevent.com):**
   - Type: **CNAME** or **A**
   - Name: **@**
   - Target: `liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com`
   - Proxy: **DNS only** (gray cloud)
   - Click **"Save"**

   **API subdomain (api.liteevent.com):**
   - Type: **CNAME**
   - Name: **api**
   - Target: `liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com`
   - Proxy: **DNS only** (gray cloud)
   - Click **"Save"**

   **Vendors subdomain (vendors.liteevent.com):**
   - Type: **CNAME**
   - Name: **vendors**
   - Target: `liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com`
   - Proxy: **DNS only** (gray cloud)
   - Click **"Save"**

### Option B: Using Route53

1. **Go to Route53:** https://console.aws.amazon.com/route53/home
2. Click **"Hosted zones"**
3. Click **liteevent.com**

4. **Add Certificate Validation:**
   - Click **"Create record"**
   - Copy the CNAME name and value from ACM
   - Click **"Create records"**

5. **Add ALB Records:**
   - Click **"Create record"**
   - Record name: *(leave empty for root)*
   - Type: **A**
   - Toggle **"Alias"** to ON
   - Route traffic to: **Alias to Application Load Balancer**
   - Region: **us-east-1**
   - Select your ALB
   - Click **"Create records"**

   Repeat for:
   - **api** (api.liteevent.com)
   - **vendors** (vendors.liteevent.com)

### 1.6 Wait for Certificate Validation

**Go back to ACM:** https://console.aws.amazon.com/acm/home?region=us-east-1

- Status should change from **"Pending validation"** → **"Issued"**
- This takes **5-30 minutes**
- Refresh the page periodically

**When status is "Issued":**
1. Click on the certificate
2. **Copy the ARN** (looks like: `arn:aws:acm:us-east-1:455697799547:certificate/abc123...`)
3. Save it - we'll use it in Step 3

---

## STEP 3: Enable HTTPS on ALB

### 3.1 Update Terraform Configuration

**Edit:** `C:\projects\event-plateform\terraform\environments\production\terraform.tfvars`

**Find this line:**
```hcl
acm_certificate_arn = ""  # Disabled - using HTTP only for now
```

**Replace with:**
```hcl
acm_certificate_arn = "arn:aws:acm:us-east-1:455697799547:certificate/YOUR-CERT-ID"
```
*(Paste your actual certificate ARN from Step 1.6)*

### 3.2 Apply Terraform

**Run in PowerShell:**
```powershell
cd C:\projects\event-plateform\terraform\environments\production
terraform apply -auto-approve
```

This will:
- ✅ Add HTTPS listener to ALB (port 443)
- ✅ Add HTTP → HTTPS redirect
- ✅ Configure SSL certificate

---

## STEP 4: Scale to 2 Tasks

**Go to ECS:**
https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services/liteevent-production-api-service?region=us-east-1

1. Click **"Update"**
2. Set **"Desired tasks"** to **2**
3. Click **"Update"**

**Wait 2 minutes** - both tasks should show **RUNNING**

---

## STEP 5: Set Up CloudWatch Alarms

### 5.1 Go to CloudWatch
**URL:** https://console.aws.amazon.com/cloudwatch/home?region=us-east-1

### 5.2 Create API Health Check Alarm

1. Click **"Alarms"** → **"All alarms"**
2. Click **"Create alarm"**
3. Click **"Select metric"**
4. Click **"Application Load Balancer"** → **"Per AppELB, per TG Metrics"**
5. Search for: **liteevent-production**
6. Select: **HealthyHostCount** for **liteevent-production-api-tg**
7. Click **"Select metric"**

**Configure alarm:**
- Statistic: **Average**
- Period: **1 minute**
- Threshold: **Static**
- Whenever HealthyHostCount is: **Lower than 1**
- Click **"Next"**

**Configure notifications:**
- Click **"Create new topic"**
- Topic name: **liteevent-production-alerts**
- Email: **joelswaku@gmail.com**
- Click **"Create topic"**
- Click **"Next"**

**Name the alarm:**
- Name: **liteevent-production-api-unhealthy**
- Description: **Alert when API has no healthy tasks**
- Click **"Next"**
- Click **"Create alarm"**

### 5.3 Check Your Email

You'll receive an email from **AWS Notifications** asking to confirm the subscription.
**Click the confirmation link!**

### 5.4 Create More Alarms (Optional but Recommended)

**High CPU:**
- Metric: **ECS → ClusterName,ServiceName → CPUUtilization**
- Threshold: **Greater than 80%**
- Name: **liteevent-production-api-high-cpu**

**High Memory:**
- Metric: **ECS → ClusterName,ServiceName → MemoryUtilization**
- Threshold: **Greater than 80%**
- Name: **liteevent-production-api-high-memory**

**Target Response Time:**
- Metric: **ALB → Per AppELB Metrics → TargetResponseTime**
- Threshold: **Greater than 5 seconds**
- Name: **liteevent-production-api-slow-response**

---

## STEP 6: Verify Everything Works

### 6.1 Test HTTPS (After Terraform Apply)
```
https://liteevent.com/health
https://api.liteevent.com/health
```

Expected: 
```json
{"success":true,"message":"API is healthy"}
```

### 6.2 Test HTTP Redirect
```
http://liteevent.com
```
Should redirect to: `https://liteevent.com`

### 6.3 Check ECS Tasks
**URL:** https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services/liteevent-production-api-service/health?region=us-east-1

Should show:
- **2 tasks RUNNING**
- **2 targets HEALTHY**

### 6.4 Check CloudWatch Alarms
**URL:** https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#alarmsV2:

Should show:
- **liteevent-production-api-unhealthy: OK** (green)

---

## ✅ Success Checklist

- [ ] SSL certificate issued (ACM status: "Issued")
- [ ] DNS records added (liteevent.com, api.liteevent.com, vendors.liteevent.com)
- [ ] Terraform updated with certificate ARN
- [ ] Terraform applied successfully
- [ ] HTTPS working (https://liteevent.com/health returns 200)
- [ ] HTTP redirects to HTTPS
- [ ] 2 ECS tasks running
- [ ] 2 targets healthy in ALB
- [ ] CloudWatch alarms created
- [ ] SNS email confirmed

---

## 🎯 Final URLs

Once everything is complete:

**Production:**
- Web: https://liteevent.com
- API: https://api.liteevent.com
- Vendors: https://vendors.liteevent.com
- Health: https://api.liteevent.com/health

**Local Development:**
- Web: http://localhost:3000
- API: http://localhost:5000
- Vendors: http://localhost:3001

---

## 📞 Need Help?

**If certificate won't validate:**
- Check DNS records are correct (no typos)
- Make sure Cloudflare proxy is OFF (gray cloud)
- Wait 30 minutes and refresh ACM page

**If HTTPS doesn't work after Terraform:**
- Check certificate ARN is correct in terraform.tfvars
- Run `terraform plan` to see what will change
- Check ALB listeners in AWS Console

**If tasks won't scale:**
- Check CloudWatch logs for errors
- Verify database connection is working
- Make sure Redis is accessible

---

**START NOW: Go to Step 1 (Request SSL Certificate)** 🚀
