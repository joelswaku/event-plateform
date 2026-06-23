# 🎯 Final Production Steps

## ✅ STEP 1: Scale API to 2 Tasks (2 min)

**Click here:** https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services/liteevent-production-api-service/update-service?region=us-east-1

1. Find **"Desired tasks"** field
2. Change from **1** to **2**
3. Click **"Update"** at the bottom
4. Wait 2 minutes for both tasks to start

---

## ✅ STEP 2: Create Health Monitoring Alarm (3 min)

### Method 1: Quick Create (Easiest)

**Click here:** https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#alarmsV2:

1. Click **"Create alarm"** button (orange button)
2. Click **"Select metric"**
3. In the search box, type: **`liteevent-production-api-tg`**
4. Click **"Application Load Balancer"**
5. Click **"Per AppELB, per TG Metrics"**
6. Find **HealthyHostCount** metric for **liteevent-production-api-tg**
7. Check the box next to it
8. Click **"Select metric"**

**Configure threshold:**
- Statistic: **Average**
- Period: **1 minute**
- Threshold type: **Static**
- Whenever HealthyHostCount is: **Lower** than **1**
- Click **"Next"**

**Configure notification:**
- Click **"Create new topic"**
- Topic name: **liteevent-alerts**
- Email: **joelswaku@gmail.com**
- Click **"Create topic"**
- Click **"Next"**

**Name the alarm:**
- Alarm name: **liteevent-api-unhealthy**
- Click **"Next"**
- Click **"Create alarm"**

**CHECK YOUR EMAIL** - Confirm the SNS subscription!

---

## ✅ STEP 3: Verify Everything (1 min)

**Test HTTPS (wait 5-10 min for DNS to propagate):**

Open in browser:
```
https://liteevent.com/health
```

Should see:
```json
{"success":true,"message":"API is healthy"}
```

**Check ECS Tasks:**
https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services/liteevent-production-api-service/health?region=us-east-1

Should show: **2/2 tasks running**

---

## 🎉 DONE!

Once you complete these 3 steps, your production setup is complete:

✅ SSL/HTTPS enabled
✅ DNS configured
✅ 2 tasks for high availability
✅ Health monitoring with email alerts

**Total time: ~5 minutes**

---

## 📊 Quick Links for Monitoring

**CloudWatch Logs:**
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Fecs$252Fliteevent-production$252Fapi

**Target Group Health:**
https://console.aws.amazon.com/ec2/home?region=us-east-1#TargetGroups:

**ECS Service:**
https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services/liteevent-production-api-service?region=us-east-1
