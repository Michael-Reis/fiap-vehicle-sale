#!/usr/bin/env pwsh

# Script completo para fazer o deploy do serviço de vendas na AWS
# Execute este script a partir do diretório raiz do servico-vendas

param(
    [switch]$SkipECR,
    [switch]$SkipTerraform,
    [switch]$PlanOnly
)

Write-Host "=== FIAP Vehicle Sales Service - Deploy Completo para AWS ===" -ForegroundColor Green

# Configurações
$SCRIPT_DIR = $PSScriptRoot
$PROJECT_ROOT = Split-Path $SCRIPT_DIR -Parent
$TERRAFORM_DIR = Join-Path $PROJECT_ROOT "terraform"

Write-Host "📋 Configurações do deploy:" -ForegroundColor Cyan
Write-Host "  - Projeto: $PROJECT_ROOT" -ForegroundColor White
Write-Host "  - Terraform: $TERRAFORM_DIR" -ForegroundColor White
Write-Host "  - Skip ECR: $SkipECR" -ForegroundColor White
Write-Host "  - Skip Terraform: $SkipTerraform" -ForegroundColor White
Write-Host "  - Plan Only: $PlanOnly" -ForegroundColor White
Write-Host ""

# Verificar se estamos no diretório correto
Set-Location $PROJECT_ROOT
if (-not (Test-Path "package.json")) {
    Write-Error "❌ Não foi possível encontrar package.json. Verifique se está no diretório correto."
    exit 1
}

# Verificar pré-requisitos
Write-Host "🔍 Verificando pré-requisitos..." -ForegroundColor Yellow

# Verificar AWS CLI
try {
    aws --version | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "AWS CLI não encontrado"
    }
    Write-Host "✅ AWS CLI encontrado" -ForegroundColor Green
} catch {
    Write-Error "❌ AWS CLI não está instalado ou não está no PATH"
    exit 1
}

# Verificar Docker
try {
    docker --version | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker não encontrado"
    }
    Write-Host "✅ Docker encontrado" -ForegroundColor Green
} catch {
    Write-Error "❌ Docker não está instalado ou não está rodando"
    exit 1
}

# Verificar Terraform
try {
    terraform version | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Terraform não encontrado"
    }
    Write-Host "✅ Terraform encontrado" -ForegroundColor Green
} catch {
    Write-Error "❌ Terraform não está instalado ou não está no PATH"
    exit 1
}

# Verificar credenciais AWS
Write-Host "🔐 Verificando credenciais AWS..." -ForegroundColor Yellow
try {
    $awsIdentity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Host "✅ Credenciais AWS válidas" -ForegroundColor Green
    Write-Host "  - Account: $($awsIdentity.Account)" -ForegroundColor White
    Write-Host "  - User: $($awsIdentity.Arn)" -ForegroundColor White
} catch {
    Write-Error "❌ Credenciais AWS inválidas ou não configuradas"
    Write-Host "Configure suas credenciais com: aws configure" -ForegroundColor Yellow
    exit 1
}

# ETAPA 1: Push da imagem para ECR
if (-not $SkipECR) {
    Write-Host ""
    Write-Host "🐳 ETAPA 1: Push da imagem para ECR" -ForegroundColor Magenta
    Write-Host "============================================" -ForegroundColor Magenta
    
    $ecrScript = Join-Path $SCRIPT_DIR "push-to-ecr.ps1"
    if (Test-Path $ecrScript) {
        & $ecrScript
        if ($LASTEXITCODE -ne 0) {
            Write-Error "❌ Erro no push para ECR"
            exit 1
        }
    } else {
        Write-Error "❌ Script push-to-ecr.ps1 não encontrado em $SCRIPT_DIR"
        exit 1
    }
} else {
    Write-Host "⏭️  Pulando push para ECR (--SkipECR especificado)" -ForegroundColor Yellow
}

# ETAPA 2: Deploy com Terraform
if (-not $SkipTerraform) {
    Write-Host ""
    Write-Host "🏗️  ETAPA 2: Deploy da infraestrutura com Terraform" -ForegroundColor Magenta
    Write-Host "====================================================" -ForegroundColor Magenta
    
    # Navegar para o diretório do Terraform
    Set-Location $TERRAFORM_DIR
    
    # Terraform init
    Write-Host "📦 Inicializando Terraform..." -ForegroundColor Yellow
    terraform init
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Erro no terraform init"
        exit 1
    }
    Write-Host "✅ Terraform inicializado com sucesso" -ForegroundColor Green
    
    # Terraform plan
    Write-Host "📋 Criando plano Terraform..." -ForegroundColor Yellow
    terraform plan -out=tfplan
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Erro no terraform plan"
        exit 1
    }
    Write-Host "✅ Plano Terraform criado com sucesso" -ForegroundColor Green
    
    # Terraform apply (apenas se não for plan-only)
    if (-not $PlanOnly) {
        Write-Host ""
        Write-Host "⚠️  ATENÇÃO: Isso irá criar recursos na AWS que podem gerar custos!" -ForegroundColor Red
        $confirmation = Read-Host "Digite 'sim' para continuar com o deploy"
        
        if ($confirmation -eq "sim") {
            Write-Host "🚀 Aplicando configuração Terraform..." -ForegroundColor Yellow
            terraform apply tfplan
            if ($LASTEXITCODE -ne 0) {
                Write-Error "❌ Erro no terraform apply"
                exit 1
            }
            Write-Host "✅ Deploy concluído com sucesso!" -ForegroundColor Green
            
            # Exibir outputs
            Write-Host ""
            Write-Host "📊 Outputs do Terraform:" -ForegroundColor Cyan
            terraform output
            
        } else {
            Write-Host "⏹️  Deploy cancelado pelo usuário" -ForegroundColor Yellow
            exit 0
        }
    } else {
        Write-Host "📋 Plan criado. Use terraform apply tfplan para aplicar." -ForegroundColor Yellow
    }
    
} else {
    Write-Host "⏭️  Pulando deploy Terraform (--SkipTerraform especificado)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Deploy completo!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. Aguarde alguns minutos para que os serviços inicializem" -ForegroundColor White
Write-Host "  2. Verifique o health check no console AWS ECS" -ForegroundColor White
Write-Host "  3. Teste a API usando o URL do ALB" -ForegroundColor White
Write-Host "  4. Monitore os logs no CloudWatch" -ForegroundColor White
Write-Host ""

# Voltar para o diretório do projeto
Set-Location $PROJECT_ROOT
