# 🔧 Pre-commit Hooks Configurados

Este projeto está configurado com **Husky** para executar verificações automáticas antes de cada commit e push.

## 🚦 O que acontece a cada commit?

### Pre-commit Hook
Quando você executa `git commit`, o sistema automaticamente executa:

1. **📝 Lint-staged**: Verifica e corrige apenas os arquivos modificados
   - ESLint com auto-fix nos arquivos `.ts` e `.js`
   - Type checking nos arquivos TypeScript

2. **🧪 Testes**: Executa todos os testes com coverage
   - `npm run test:ci`

### Pre-push Hook
Quando você executa `git push`, o sistema executa:

1. **🔍 Validação completa**: `npm run validate`
   - Type checking completo
   - Linting de todo o projeto
   - Todos os testes

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Servidor de desenvolvimento com hot reload
npm run build           # Build para produção
npm run start           # Iniciar servidor de produção

# Testes
npm test                # Executar testes em modo watch
npm run test:ci         # Executar testes uma vez (usado no CI)
npm run test:coverage   # Testes com relatório de coverage

# Qualidade de código
npm run lint            # Verificar problemas de linting
npm run lint:fix        # Corrigir problemas de linting automaticamente
npm run type-check      # Verificar tipos TypeScript
npm run validate        # Executar todas as verificações (type-check + lint + tests)
```

## 📋 Fluxo de Trabalho Recomendado

### 1. Desenvolvimento Normal
```bash
# Fazer mudanças no código
git add .
git commit -m "feat: nova funcionalidade"
# → Pre-commit executará automaticamente lint e testes nos arquivos modificados

git push
# → Pre-push executará validação completa
```

### 2. Se os Hooks Falharem

#### Falha no Linting
```bash
# O hook falhará e mostrará os erros
# Corrigir automaticamente:
npm run lint:fix
git add .
git commit -m "fix: corrigir problemas de linting"
```

#### Falha nos Testes
```bash
# Ver quais testes falharam:
npm test

# Executar testes específicos:
npm test -- --testNamePattern="nome do teste"

# Executar testes em modo watch para desenvolvimento:
npm run test:watch
```

#### Falha no Type Checking
```bash
# Ver erros de tipo:
npm run type-check

# O TypeScript mostrará exatamente onde estão os problemas
```

### 3. Bypass dos Hooks (Não Recomendado)
Se necessário, você pode pular os hooks:

```bash
# Pular pre-commit
git commit -m "commit urgente" --no-verify

# Pular pre-push
git push --no-verify
```

⚠️ **Use apenas em emergências!**

## 🎯 Benefícios

- ✅ **Qualidade garantida**: Código sempre testado antes do commit
- ✅ **Menos bugs**: Problemas detectados antes de ir para o repositório
- ✅ **Consistência**: Estilo de código uniforme
- ✅ **CI/CD confiável**: Se passou localmente, passará no CI
- ✅ **Produtividade**: Problemas detectados cedo são mais fáceis de corrigir

## 🔧 Configuração dos Hooks

### Pre-commit (`.husky/pre-commit`)
```bash
- Lint-staged (arquivos modificados)
- Testes completos
```

### Pre-push (`.husky/pre-push`)
```bash
- Validação completa do projeto
```

### Lint-staged (`package.json`)
```json
{
  "lint-staged": {
    "*.{ts,js}": ["eslint --fix", "git add"],
    "*.ts": ["npm run type-check"]
  }
}
```

## 📊 Métricas de Qualidade

O projeto monitora:
- **Coverage de testes**: Mínimo recomendado 80%
- **Linting**: Zero erros/warnings
- **Type safety**: 100% tipado

## 🚨 Troubleshooting

### Hook muito lento?
```bash
# Executar apenas lint nos arquivos modificados:
npx lint-staged

# Executar testes específicos:
npm test -- --testPathPattern="caminho/do/teste"
```

### Problemas com Husky?
```bash
# Reinstalar hooks:
npx husky install

# Verificar se hooks estão executáveis:
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

Agora você tem um ambiente de desenvolvimento robusto com verificações automáticas! 🚀
