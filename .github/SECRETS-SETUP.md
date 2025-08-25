# 🔐 Configuração dos Secrets do GitHub

## Passo a Passo para Configurar os Secrets

### 1. Acesse as Configurações do Repositório
1. Vá para o seu repositório no GitHub
2. Clique em **Settings** (configurações)
3. No menu lateral, clique em **Secrets and variables**
4. Selecione **Actions**

### 2. Adicione os Secrets Necessários

#### Secret 1: AWS_ACCESS_KEY_ID
1. Clique em **New repository secret**
2. **Name**: `AWS_ACCESS_KEY_ID`
3. **Secret**: Cole aqui o Access Key ID do AWS (ex: `AKIAIOSFODNN7EXAMPLE`)
4. Clique em **Add secret**

#### Secret 2: AWS_SECRET_ACCESS_KEY
1. Clique em **New repository secret**
2. **Name**: `AWS_SECRET_ACCESS_KEY`
3. **Secret**: Cole aqui o Secret Access Key do AWS
4. Clique em **Add secret**

### 3. Como Obter as Credenciais AWS

#### Opção A: Usar usuário existente (se você já tem)
Se você já tem um usuário AWS configurado localmente:

```bash
# Ver as credenciais atuais (CUIDADO: não compartilhe)
cat ~/.aws/credentials
```

#### Opção B: Criar novo usuário (Recomendado)

1. **Acesse o Console AWS**
   - Vá para IAM → Users
   - Clique em "Add user"

2. **Configure o Usuário**
   - **User name**: `github-actions-fiap-vendas`
   - **Access type**: ✅ Programmatic access (apenas API)
   - ❌ AWS Management Console access (desmarque)

3. **Anexe Políticas**
   - Clique em "Attach existing policies directly"
   - Procure e selecione: `AmazonEC2ContainerRegistryPowerUser`
   - Adicione também uma política customizada para ECS (ver abaixo)

4. **Política Customizada para ECS**
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
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

5. **Salve as Credenciais**
   - ⚠️ **IMPORTANTE**: Anote o Access Key ID e Secret Access Key
   - ⚠️ Esta é a única vez que você verá o Secret Access Key!

### 4. Teste a Configuração

Depois de configurar os secrets, faça um push para a branch `develop` ou `main`:

```bash
git add .
git commit -m "test: configurar CI/CD pipeline"
git push origin develop
```

O pipeline será executado automaticamente e você pode acompanhar em:
**Repository → Actions**

### 5. Verificação dos Secrets

Para verificar se os secrets estão configurados:
1. Vá em **Settings → Secrets and variables → Actions**
2. Você deve ver:
   - ✅ `AWS_ACCESS_KEY_ID`
   - ✅ `AWS_SECRET_ACCESS_KEY`

### 🚨 Importante - Segurança

- ❌ **NUNCA** commite credenciais AWS no código
- ❌ **NUNCA** compartilhe as credenciais publicamente
- ✅ Use sempre os GitHub Secrets para credenciais sensíveis
- ✅ Revise periodicamente as permissões dos usuários AWS
- ✅ Monitore o uso das credenciais no CloudTrail

### 📞 Precisa de Ajuda?

Se encontrar problemas:

1. **Erro de permissões**: Verifique se o usuário AWS tem as políticas corretas
2. **Erro de credenciais**: Confirme se os secrets estão nomeados corretamente
3. **Pipeline não executa**: Verifique se o push foi feito para `main` ou `develop`

### 📋 Checklist de Configuração

- [ ] Usuário AWS criado
- [ ] Políticas anexadas ao usuário
- [ ] Secret `AWS_ACCESS_KEY_ID` configurado no GitHub
- [ ] Secret `AWS_SECRET_ACCESS_KEY` configurado no GitHub
- [ ] Push realizado para testar o pipeline
- [ ] Pipeline executou com sucesso
- [ ] Aplicação foi deployada no ECS
- [ ] Health check está funcionando
