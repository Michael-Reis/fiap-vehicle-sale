-- Script para criação do banco de dados e tabelas do serviço de vendas
-- Execute este script no seu MySQL para configurar o banco manualmente

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS servico_vendas 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE servico_vendas;

-- Tabela de vendas
CREATE TABLE IF NOT EXISTS vendas (
    id VARCHAR(36) PRIMARY KEY,
    veiculo_id VARCHAR(50) NOT NULL,
    cpf_comprador VARCHAR(11) NOT NULL,
    valor_pago DECIMAL(10,2) NOT NULL,
    metodo_pagamento ENUM('pix', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia') NOT NULL,
    status ENUM('pendente', 'processando', 'aprovado', 'rejeitado', 'cancelado') DEFAULT 'pendente',
    codigo_pagamento VARCHAR(100),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    data_aprovacao TIMESTAMP NULL,
    webhook_notificado BOOLEAN DEFAULT FALSE,
    tentativas_webhook INT DEFAULT 0,
    INDEX idx_status (status),
    INDEX idx_veiculo_id (veiculo_id),
    INDEX idx_cpf_comprador (cpf_comprador),
    INDEX idx_webhook_pendente (webhook_notificado, status),
    INDEX idx_codigo_pagamento (codigo_pagamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de log de webhooks
CREATE TABLE IF NOT EXISTS log_webhook (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venda_id VARCHAR(36) NOT NULL,
    url VARCHAR(500) NOT NULL,
    payload TEXT NOT NULL,
    status_code INT,
    resposta TEXT,
    data_tentativa TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sucesso BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE,
    INDEX idx_venda_id (venda_id),
    INDEX idx_sucesso (sucesso),
    INDEX idx_data_tentativa (data_tentativa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir alguns dados de exemplo (opcional)
-- INSERT INTO vendas (id, veiculo_id, cpf_comprador, valor_pago, metodo_pagamento, status, codigo_pagamento)
-- VALUES 
--     (UUID(), '1', '12345678901', 85000.00, 'cartao_credito', 'pendente', 'PAG-123456789'),
--     (UUID(), '2', '98765432100', 45000.00, 'pix', 'aprovado', 'PAG-987654321'),
--     (UUID(), '3', '11122233344', 120000.00, 'transferencia', 'pendente', 'PAG-111222333');

-- Verificar estrutura das tabelas
DESCRIBE vendas;
DESCRIBE log_webhook;

-- Consultas úteis para monitoramento
-- SELECT * FROM vendas ORDER BY data_criacao DESC LIMIT 10;
-- SELECT status, COUNT(*) as total FROM vendas GROUP BY status;
-- SELECT * FROM log_webhook ORDER BY data_tentativa DESC LIMIT 10;
