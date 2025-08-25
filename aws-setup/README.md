# FIAP Vehicle Sales Service - Deploy AWS

Este documento descreve como fazer o deploy do serviço de vendas na AWS usando ECS, ECR e RDS.

## 📋 Pré-requisitos

Antes de executar o deploy, certifique-se de ter:

1. **AWS CLI** configurado com credenciais válidas
2. **Docker** instalado e rodando
3. **Terraform** instalado (>= 1.0)
4. **PowerShell** (Windows) ou **Bash** (Linux/Mac)

### Configuração das credenciais AWS

```bash
aws configure
```

Ou use variáveis de ambiente:
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1
```

## 🚀 Deploy Automático

### Script Completo (Recomendado)

Execute o script que faz tudo automaticamente:

```powershell
# No diretório servico-vendas
.\aws-setup\deploy-complete.ps1
```

#### Opções do script:

```powershell
# Apenas criar o plano (não aplica)
.\aws-setup\deploy-complete.ps1 -PlanOnly

# Pular o push para ECR (se a imagem já existe)
.\aws-setup\deploy-complete.ps1 -SkipECR

# Pular o Terraform (apenas ECR)
.\aws-setup\deploy-complete.ps1 -SkipTerraform
```

## 🐳 Deploy Manual - Passo a Passo

### 1. Push da Imagem para ECR

```powershell
# No diretório servico-vendas
.\aws-setup\push-to-ecr.ps1
```

Este script irá:
- Fazer login no ECR
- Criar o repositório `fiap-vehicle-sale` (se não existir)
- Fazer build da imagem Docker
- Fazer push para o ECR

### 2. Deploy da Infraestrutura

```bash
# Navegar para o diretório terraform
cd terraform

# Inicializar Terraform
terraform init

# Criar plano
terraform plan -out=tfplan

# Aplicar (cuidado: irá criar recursos que geram custos!)
terraform apply tfplan
```

## 🏗️ Recursos Criados

O Terraform irá criar:

### Rede
- 1 VPC (10.1.0.0/16)
- 2 Subnets públicas (para ALB)
- 2 Subnets privadas (para ECS e RDS)
- Internet Gateway
- 2 NAT Gateways
- Route Tables

### Segurança
- Security Groups para ALB, ECS e RDS
- IAM Roles para ECS

### Compute
- ECS Cluster
- ECS Service (2 tasks)
- Application Load Balancer
- Target Group

### Database
- RDS MySQL (db.t3.micro)
- DB Subnet Group

### Monitoring
- CloudWatch Log Group

## 🔧 Configurações

### Variáveis do Terraform

Você pode customizar as seguintes variáveis em `terraform/main.tf`:

```hcl
variable "aws_region" {
  default = "us-east-1"
}

variable "app_name" {
  default = "fiap-vehicle-sales"
}

variable "container_port" {
  default = 3001
}

variable "ecr_image_uri" {
  default = "497986631333.dkr.ecr.us-east-1.amazonaws.com/fiap-vehicle-sale:latest"
}

variable "servico_principal_url" {
  default = "http://fiap-vehicle-management-alb-1408414491.us-east-1.elb.amazonaws.com"
}
```

### Variáveis de Ambiente da Aplicação

As seguintes variáveis são configuradas automaticamente no ECS:

- `NODE_ENV=production`
- `PORT=3001`
- `DB_HOST` (endpoint do RDS)
- `DB_PORT=3306`
- `DB_NAME=veiculovendas`
- `DB_USER=admin`
- `DB_PASSWORD=fiap123456`
- `SERVICO_PRINCIPAL_URL` (URL do serviço principal)
- `JWT_SECRET`
- `CORS_ORIGIN=*`

## 📊 Monitoramento

### Verificar Status do Deployment

1. **ECS Console**: https://console.aws.amazon.com/ecs/
   - Cluster: `fiap-vehicle-sales-cluster`
   - Service: `fiap-vehicle-sales-service`

2. **CloudWatch Logs**: https://console.aws.amazon.com/cloudwatch/
   - Log Group: `/ecs/fiap-vehicle-sales`

3. **RDS Console**: https://console.aws.amazon.com/rds/
   - Instance: `fiap-vehicle-sales-database`

### Health Check

Após o deploy, teste o health check:

```bash
# Obter URL do ALB
terraform output alb_url

# Testar health check
curl http://[ALB_URL]/health
```

## 🧹 Limpeza

Para remover todos os recursos criados:

```bash
cd terraform
terraform destroy
```

⚠️ **Atenção**: Isso irá remover TODOS os recursos, incluindo o banco de dados!

## 🔍 Troubleshooting

### Problemas Comuns

1. **Erro de credenciais AWS**
   ```bash
   aws sts get-caller-identity
   ```

2. **Erro no push ECR**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 497986631333.dkr.ecr.us-east-1.amazonaws.com
   ```

3. **Tasks não inicializando**
   - Verifique os logs no CloudWatch
   - Verifique se o RDS está disponível
   - Verifique os security groups

4. **Health check falhando**
   - Verifique se a aplicação está rodando na porta 3001
   - Verifique se o endpoint `/health` existe

### Logs Úteis

```bash
# Ver logs do ECS
aws logs tail /ecs/fiap-vehicle-sales --follow

# Status do RDS
aws rds describe-db-instances --db-instance-identifier fiap-vehicle-sales-database
```

## 💰 Custos Estimados

Os recursos criados geram aproximadamente:

- RDS db.t3.micro: ~$15/mês
- ECS Fargate (2 tasks): ~$30/mês
- NAT Gateways: ~$45/mês
- ALB: ~$25/mês
- **Total estimado**: ~$115/mês

⚠️ **Importante**: Estes são custos estimados. Monitore sua fatura AWS regularmente.

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs no CloudWatch
2. Revise a configuração do Terraform
3. Verifique o status dos recursos no console AWS
4. Consulte a documentação oficial da AWS
