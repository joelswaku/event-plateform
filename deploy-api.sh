#!/bin/bash
# Deploy API to Railway
cd api
echo "Creating deployment for API service..."
railway up --service api --detach || {
    echo "Service 'api' not found. You need to create it in Railway dashboard first."
    echo "Go to: https://railway.com/project/3b0af4a1-4bf5-4782-8b4b-383b0b37855c"
    echo "Click: New Service → Empty Service → Name it 'api'"
}
