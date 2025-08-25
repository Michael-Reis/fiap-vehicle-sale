# 🚀 Configuração do CI/CD Pipeline

Este documento explica como configurar o pipeline CI/CD para deploy automático no AWS.

## 📋 Pré-requisitos

### 1. Secrets do GitHub (Obrigatórios)

Configure os seguintes secrets no seu repositório GitHub:

**Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Valor | Descrição |
|-------------|-------|-----------|
| `AWS_ACCESS_KEY_ID` | `AKIA...` | Access Key ID do usuário AWS |
| `AWS_SECRET_ACCESS_KEY` | `xxxxx...` | Secret Access Key do usuário AWS |

### 2. Permissões AWS Necessárias

O usuário AWS precisa das seguintes permissões:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload",
                "ecr:PutImage"
            ],
            "Resource": "arn:aws:ecr:us-east-1:497986631333:repository/fiap-vehicle-sale"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ecs:UpdateService",
                "ecs:DescribeServices"
            ],
            "Resource": [
                "arn:aws:ecs:us-east-1:497986631333:cluster/fiap-vehicle-sales-cluster",
                "arn:aws:ecs:us-east-1:497986631333:service/fiap-vehicle-sales-cluster/fiap-vehicle-sales-service"
            ]
        }
    ]
}
```

## 🔄 Como Funciona o Pipeline

### Triggers
- **Push**: Branches `main`, `develop`, `feat/*`
- **Pull Request**: Para `main` e `develop`

### Jobs

#### 1. **test-and-build**
- ✅ Executa em Node.js 18.x e 20.x
- 🔍 Instala dependências
- 🧪 Executa testes
- 🏗️ Builda a aplicação

#### 2. **deploy** (apenas `main` e `develop`)
- 🔐 Configura credenciais AWS
- 🐳 Builda imagem Docker
- 📤 Faz push para ECR
- 🚀 Atualiza serviço ECS
- ⏳ Aguarda deployment completar
- ✅ Verifica se o serviço está funcionando

## 🛠️ Configuração Manual das Credenciais AWS

### Opção 1: Via AWS CLI (Recomendado)
```bash
aws iam create-user --user-name github-actions-fiap-vendas
aws iam create-access-key --user-name github-actions-fiap-vendas
aws iam attach-user-policy --user-name github-actions-fiap-vendas --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser
```

### Opção 2: Console AWS
1. IAM → Users → Add user
2. Nome: `github-actions-fiap-vendas`
3. Access type: Programmatic access
4. Attach policies: `AmazonEC2ContainerRegistryPowerUser` + Custom ECS policy

## 📊 Monitoramento

### URLs de Verificação
- **Health Check**: http://fiap-vehicle-sales-alb-544721435.us-east-1.elb.amazonaws.com/health
- **Swagger UI**: http://fiap-vehicle-sales-alb-544721435.us-east-1.elb.amazonaws.com/api-docs

### Logs
- **GitHub Actions**: Repository → Actions
- **ECS**: AWS Console → ECS → Clusters → fiap-vehicle-sales-cluster
- **CloudWatch**: AWS Console → CloudWatch → Log groups

## 🚨 Troubleshooting

### Erro: "Unable to locate credentials"
- ✅ Verifique se os secrets AWS estão configurados corretamente
- ✅ Confirme os nomes dos secrets: `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY`

### Erro: "AccessDenied"
- ✅ Verifique as permissões IAM do usuário
- ✅ Confirme se as ARNs dos recursos estão corretas

### Erro: "Health check failed"
- ✅ Verifique se o ALB está funcionando
- ✅ Confirme se as tasks ECS estão healthy
- ✅ Verifique os logs do CloudWatch

## 📝 Exemplo de Uso

```bash
# 1. Fazer mudanças no código
git add .
git commit -m "feat: adicionar nova funcionalidade"

# 2. Push para develop (dispara CI/CD)
git push origin develop

# 3. Acompanhar o pipeline
# - GitHub Actions executará testes
# - Se testes passarem, fará deploy automaticamente
# - Verificará se o serviço está funcionando

# 4. Verificar deployment
curl http://fiap-vehicle-sales-alb-544721435.us-east-1.elb.amazonaws.com/health
```

## 🔧 Customização

Para modificar o pipeline, edite o arquivo `.github/workflows/cicd.yml`:

- **Adicionar steps**: Inclua novos steps antes ou depois do deploy
- **Modificar triggers**: Altere as branches que disparam o pipeline
- **Alterar ambiente**: Modifique as variáveis de ambiente no topo do arquivo
