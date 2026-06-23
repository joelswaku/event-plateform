# Check ALB listeners
aws elbv2 describe-listeners --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:455697799547:loadbalancer/app/liteevent-production-alb/743558b507d16dcd --region us-east-1 --query 'Listeners[].{Port:Port,Protocol:Protocol,ARN:ListenerArn}' --output table 2>$null
