# Docker - Serviço de Vendas

## Pré-requisitos

Antes de executar este serviço, é necessário que o **servico-principal** esteja rodando, pois este serviço se comunica com as APIs do serviço principal.

## Ordem de Execução

### 1. Primeiro, execute o serviço principal:

```bash
cd ../servico-principal
docker-compose up -d
```

### 2. Depois, execute o serviço de vendas:

```bash
cd ../servico-vendas
docker-compose up -d
```

## Comandos Úteis

### Executar apenas o serviço de vendas:
```bash
docker-compose up -d
```

### Ver logs do serviço:
```bash
docker-compose logs -f servico-vendas
```

### Parar o serviço:
```bash
docker-compose down
```

### Rebuild do container:
```bash
docker-compose up --build -d
```

## Portas

- **Serviço de Vendas**: http://localhost:3001
- **Serviço Principal**: http://localhost:3000 (deve estar rodando)

## Rede

Ambos os serviços utilizam a rede `veiculos-network` para comunicação interna.

## Variáveis de Ambiente

- `NODE_ENV`: Ambiente de execução (production)
- `PORT`: Porta do serviço (3001)
- `SERVICO_PRINCIPAL_URL`: URL do serviço principal (http://servico-principal:3000)
