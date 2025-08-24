# Configuração ECS para Serviço de Vendas no LocalStack

# Definir endpoint do LocalStack
$env:AWS_ACCESS_KEY_ID = "test"
$env:AWS_SECRET_ACCESS_KEY = "test"
$env:AWS_DEFAULT_REGION = "us-east-1"
$env:AWS_ENDPOINT_URL = "http://localhost:4567"

Write-Host "Configurando ECS para Serviço de Vendas..."

# Criar cluster ECS
aws ecs create-cluster `
    --cluster-name servico-vendas-cluster `
    --endpoint-url $env:AWS_ENDPOINT_URL

# Registrar definição de task
$taskDefinition = @'
[
    {
        "name": "servico-vendas",
        "image": "servico-vendas:latest",
        "memory": 512,
        "essential": true,
        "portMappings": [
            {
                "containerPort": 3001,
                "hostPort": 3001,
                "protocol": "tcp"
            }
        ],
        "environment": [
            {"name": "NODE_ENV", "value": "production"},
            {"name": "PORT", "value": "3001"},
            {"name": "DB_HOST", "value": "mysql"},
            {"name": "DB_PORT", "value": "3306"},
            {"name": "DB_USER", "value": "root"},
            {"name": "DB_PASSWORD", "value": "rootpassword"},
            {"name": "DB_NAME", "value": "servico_vendas"},
            {"name": "SERVICO_PRINCIPAL_URL", "value": "http://servico-principal:3000"}
        ]
    }
]
'@

aws ecs register-task-definition `
    --family servico-vendas-task `
    --network-mode bridge `
    --requires-compatibilities EC2 `
    --cpu 256 `
    --memory 512 `
    --container-definitions $taskDefinition `
    --endpoint-url $env:AWS_ENDPOINT_URL

# Criar serviço ECS
aws ecs create-service `
    --cluster servico-vendas-cluster `
    --service-name servico-vendas-service `
    --task-definition servico-vendas-task `
    --desired-count 1 `
    --endpoint-url $env:AWS_ENDPOINT_URL

Write-Host "ECS configurado para Serviço de Vendas com sucesso!"
