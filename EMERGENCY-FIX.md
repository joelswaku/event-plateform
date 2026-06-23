# API is Crashing - Check Logs NOW

## Go to CloudWatch Logs:
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Fecs$252Fliteevent-production$252Fapi

## Click the LATEST log stream (top one)

## Look for errors with keywords:
- Error:
- crash
- failed
- 500
- CORS_ORIGIN
- env.CORS_ORIGIN
- Cannot read
- undefined

## COPY THE ERROR MESSAGE HERE
