#!/usr/bin/env pwsh
# ============================================================================
# Deployment Platform Switcher
# ============================================================================
# Switch between Railway (< 20K users) and AWS (> 20K users)
# Usage: .\deploy-switcher.ps1 -Platform railway|aws
# ============================================================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('railway', 'aws')]
    [string]$Platform,

    [Parameter(Mandatory=$false)]
    [ValidateSet('staging', 'production')]
    [string]$Environment = 'production'
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Platform Switcher" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Platform: $Platform" -ForegroundColor Yellow
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host ""

# ============================================================================
# Railway Deployment
# ============================================================================
function Deploy-Railway {
    Write-Host "🚂 Deploying to Railway..." -ForegroundColor Green

    # Check if Railway CLI is installed
    try {
        railway --version | Out-Null
    } catch {
        Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Red
        npm install -g @railway/cli
    }

    Write-Host "📋 Railway Deployment Checklist:" -ForegroundColor Cyan
    Write-Host "  1. Login to Railway (if not already)" -ForegroundColor White
    Write-Host "  2. Link project to Railway" -ForegroundColor White
    Write-Host "  3. Set up PostgreSQL database" -ForegroundColor White
    Write-Host "  4. Set up Redis instance" -ForegroundColor White
    Write-Host "  5. Configure environment variables" -ForegroundColor White
    Write-Host "  6. Deploy all services" -ForegroundColor White
    Write-Host ""

    # Step 1: Login check
    Write-Host "Checking Railway authentication..." -ForegroundColor Yellow
    $loginStatus = railway whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Please login to Railway:" -ForegroundColor Yellow
        railway login
    } else {
        Write-Host "✅ Already logged in: $loginStatus" -ForegroundColor Green
    }

    # Step 2: Project linking
    Write-Host ""
    Write-Host "Current Railway project status:" -ForegroundColor Yellow
    railway status 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "⚠️  No project linked. Please choose an option:" -ForegroundColor Yellow
        Write-Host "  1. Create new Railway project: railway init" -ForegroundColor White
        Write-Host "  2. Link existing project: railway link" -ForegroundColor White
        Write-Host ""
        $choice = Read-Host "Create new (n) or Link existing (l)? [n/l]"

        if ($choice -eq 'n') {
            railway init
        } else {
            railway link
        }
    }

    Write-Host ""
    Write-Host "📦 Deploying services to Railway..." -ForegroundColor Green
    Write-Host ""

    # Deploy API
    Write-Host "Deploying API service..." -ForegroundColor Cyan
    Set-Location api
    railway up --service api
    Set-Location ..

    # Deploy Web
    Write-Host "Deploying Web service..." -ForegroundColor Cyan
    Set-Location web
    railway up --service web
    Set-Location ..

    # Deploy Vendors
    Write-Host "Deploying Vendors service..." -ForegroundColor Cyan
    Set-Location vendors
    railway up --service vendors
    Set-Location ..

    Write-Host ""
    Write-Host "✅ Railway deployment complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Get your deployment URLs:" -ForegroundColor Yellow
    railway domain
}

# ============================================================================
# AWS Deployment
# ============================================================================
function Deploy-AWS {
    Write-Host "☁️  Deploying to AWS..." -ForegroundColor Green

    # Check if AWS CLI is installed
    try {
        aws --version | Out-Null
    } catch {
        Write-Host "❌ AWS CLI not found. Please install it first:" -ForegroundColor Red
        Write-Host "https://aws.amazon.com/cli/" -ForegroundColor Yellow
        exit 1
    }

    Write-Host "📋 AWS Deployment Checklist:" -ForegroundColor Cyan
    Write-Host "  1. Terraform infrastructure ready" -ForegroundColor White
    Write-Host "  2. GitHub OIDC configured" -ForegroundColor White
    Write-Host "  3. Secrets configured in GitHub" -ForegroundColor White
    Write-Host "  4. Push to main branch triggers deployment" -ForegroundColor White
    Write-Host ""

    # Check AWS credentials
    Write-Host "Checking AWS credentials..." -ForegroundColor Yellow
    $awsIdentity = aws sts get-caller-identity 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ AWS credentials not configured" -ForegroundColor Red
        Write-Host "Run: aws configure" -ForegroundColor Yellow
        exit 1
    }

    Write-Host "✅ AWS credentials verified" -ForegroundColor Green
    Write-Host $awsIdentity
    Write-Host ""

    # Check if using GitHub Actions or manual deploy
    Write-Host "AWS Deployment Options:" -ForegroundColor Yellow
    Write-Host "  1. Push to GitHub (recommended) - triggers automatic deployment" -ForegroundColor White
    Write-Host "  2. Manual Terraform apply (advanced)" -ForegroundColor White
    Write-Host ""

    $deployChoice = Read-Host "Use GitHub Actions (g) or Manual Terraform (t)? [g/t]"

    if ($deployChoice -eq 'g') {
        Write-Host ""
        Write-Host "To deploy via GitHub Actions:" -ForegroundColor Cyan
        Write-Host "  1. Commit your changes: git add . && git commit -m 'Deploy to AWS'" -ForegroundColor White
        Write-Host "  2. Push to main: git push origin main" -ForegroundColor White
        Write-Host "  3. Monitor: https://github.com/YOUR_USERNAME/event-plateform/actions" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "Manual Terraform deployment..." -ForegroundColor Yellow
        Set-Location terraform/environments/$Environment

        Write-Host "Initializing Terraform..." -ForegroundColor Cyan
        terraform init

        Write-Host "Planning deployment..." -ForegroundColor Cyan
        terraform plan -out=tfplan

        $confirm = Read-Host "Apply this plan? [y/N]"
        if ($confirm -eq 'y') {
            terraform apply tfplan
            Write-Host "✅ AWS infrastructure deployed" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Deployment cancelled" -ForegroundColor Yellow
        }

        Set-Location ../../..
    }
}

# ============================================================================
# Main Execution
# ============================================================================
if ($Platform -eq 'railway') {
    Deploy-Railway
} elseif ($Platform -eq 'aws') {
    Deploy-AWS
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
