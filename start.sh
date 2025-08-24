#!/bin/bash

# Script para executar o serviço de vendas em containers Docker

echo "🚀 Iniciando setup do Serviço de Vendas..."

# Parar e remover containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down -v

# Remover imagens antigas (opcional)
echo "🗑️ Removendo imagens antigas..."
docker rmi servico-vendas-servico-vendas 2>/dev/null || true

# Build e start dos containers
echo "🔨 Fazendo build e iniciando containers..."
docker-compose up --build -d

# Aguardar containers ficarem saudáveis
echo "⏳ Aguardando containers ficarem saudáveis..."
sleep 10

# Verificar status dos containers
echo "📊 Status dos containers:"
docker-compose ps

# Mostrar logs do serviço
echo "📋 Logs do serviço de vendas:"
docker-compose logs servico-vendas

echo "✅ Setup concluído!"
echo "📚 Acesse a documentação em: http://localhost:3001/api-docs"
echo "🏥 Health check em: http://localhost:3001/health"
echo "💰 API de vendas em: http://localhost:3001/api/vendas"

# Comando para acompanhar logs em tempo real
echo ""
echo "Para acompanhar os logs em tempo real, execute:"
echo "docker-compose logs -f"
