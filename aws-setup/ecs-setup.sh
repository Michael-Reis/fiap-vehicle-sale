#!/bin/bash

# Configuração ECS para Serviço de Vendas no LocalStack

# Definir endpoint do LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4567

echo "Configurando ECS para Serviço de Vendas..."

# Criar cluster ECS
aws ecs create-cluster \
    --cluster-name servico-vendas-cluster \
    --endpoint-url $AWS_ENDPOINT_URL

# Registrar definição de task
aws ecs register-task-definition \
    --family servico-vendas-task \
    --network-mode bridge \
    --requires-compatibilities EC2 \
    --cpu 256 \
    --memory 512 \
    --container-definitions '[
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
    ]' \
    --endpoint-url $AWS_ENDPOINT_URL

# Criar serviço ECS
aws ecs create-service \
    --cluster servico-vendas-cluster \
    --service-name servico-vendas-service \
    --task-definition servico-vendas-task \
    --desired-count 1 \
    --endpoint-url $AWS_ENDPOINT_URL

echo "ECS configurado para Serviço de Vendas com sucesso!"
