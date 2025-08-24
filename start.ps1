# Script PowerShell para executar o serviço de vendas em containers Docker

Write-Host "🚀 Iniciando setup do Serviço de Vendas..." -ForegroundColor Green

# Parar e remover containers existentes
Write-Host "🛑 Parando containers existentes..." -ForegroundColor Yellow
docker-compose down -v

# Remover imagens antigas (opcional)
Write-Host "🗑️ Removendo imagens antigas..." -ForegroundColor Yellow
docker rmi servico-vendas-servico-vendas 2>$null

# Build e start dos containers
Write-Host "🔨 Fazendo build e iniciando containers..." -ForegroundColor Cyan
docker-compose up --build -d

# Aguardar containers ficarem saudáveis
Write-Host "⏳ Aguardando containers ficarem saudáveis..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar status dos containers
Write-Host "📊 Status dos containers:" -ForegroundColor Cyan
docker-compose ps

# Mostrar logs do serviço
Write-Host "📋 Logs do serviço de vendas:" -ForegroundColor Cyan
docker-compose logs servico-vendas

Write-Host "✅ Setup concluído!" -ForegroundColor Green
Write-Host "📚 Acesse a documentação em: http://localhost:3001/api-docs" -ForegroundColor White
Write-Host "🏥 Health check em: http://localhost:3001/health" -ForegroundColor White
Write-Host "💰 API de vendas em: http://localhost:3001/api/vendas" -ForegroundColor White

# Comando para acompanhar logs em tempo real
Write-Host ""
Write-Host "Para acompanhar os logs em tempo real, execute:" -ForegroundColor Yellow
Write-Host "docker-compose logs -f" -ForegroundColor White
