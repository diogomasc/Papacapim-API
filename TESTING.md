# 🧪 Testes E2E - Papacapim API

## 📋 Sobre os Testes

Esta API possui uma suíte completa de **testes End-to-End (E2E)** que cobrem todos os endpoints implementados, garantindo que a aplicação funciona corretamente do início ao fim.

### 🎯 Cobertura de Testes

- ✅ **Users (Usuários)**: 5 testes
  - Criar usuário
  - Listar usuários
  - Obter usuário por login
  - Atualizar usuário (com segurança)
  - Deletar usuário (com segurança)

- ✅ **Sessions (Autenticação)**: 2 testes
  - Login (criar sessão)
  - Logout (deletar sessão)

- ✅ **Posts (Postagens)**: 6 testes
  - Criar post
  - Listar posts
  - Listar posts de usuário
  - Responder a post
  - Listar respostas de post
  - Deletar post

- ✅ **Followers (Seguidores)**: 3 testes
  - Seguir usuário (idempotente)
  - Listar seguidores
  - Deixar de seguir

- ✅ **Likes (Curtidas)**: 3 testes
  - Curtir post (idempotente)
  - Listar curtidas
  - Remover curtida

- ✅ **Validations (Sad Paths)**: 12 testes
  - **Segurança de Usuário**: Tentar deletar/editar outro usuário
  - **Validação de Cadastro**: Login duplicado, senha curta
  - **Autenticação**: Senha errada, usuário inexistente
  - **Postagens**: Deletar post alheio, post inexistente
  - **Seguidores**: Seguir a si mesmo
  - **Idempotência**: Seguir/Curtir duplicado (deve retornar 204)

**Total: 31 testes E2E** ✨

## 🛠️ Ferramentas Utilizadas

- **Vitest**: Framework de testes rápido e moderno
- **Supertest**: Biblioteca para testes de APIs HTTP
- **@faker-js/faker**: Geração de dados fake realistas
- **@vitest/coverage-v8**: Cobertura de código com V8

## 🗄️ Banco de Dados de Testes

Os testes utilizam um banco de dados PostgreSQL separado rodando em Docker na porta **5433**.

### Configuração (já feita):

```yaml
# .env.test
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/papacapim_test
PORT=3334
JWT_SECRET=test-secret-key
```

O banco de testes está configurado no `docker-compose.yml` como serviço `postgres-test`.

## 🏭 Factories (Geradores de Dados)

As factories estão em `src/tests/factories/` e geram dados de teste consistentes:

- **make-user.ts**: Gera dados de usuário (login, nome, senha)
- **make-session.ts**: Gera dados de login/sessão
- **make-post.ts**: Gera mensagens de posts

## 🚀 Executando os Testes

### 1. Subir o banco de dados de testes (faça uma vez):

```bash
docker-compose up -d postgres-test
```

### 2. Rodar todos os testes:

```bash
npm test
```

### 3. Rodar testes em modo watch (desenvolvimento):

```bash
npm run test:watch
```

### 4. Rodar testes com relatório de cobertura:

```bash
npm run test:coverage
```

O relatório de cobertura será gerado em:

- **Terminal**: Resumo da cobertura
- **HTML**: `coverage/index.html` (abra no navegador para visualização detalhada)

## 📊 Estrutura dos Testes

```
src/tests/
├── factories/           # Geradores de dados fake
│   ├── make-user.ts
│   ├── make-session.ts
│   └── make-post.ts
└── e2e/                # Testes end-to-end
    ├── users.test.ts
    ├── sessions.test.ts
    ├── posts.test.ts
    ├── followers.test.ts
    ├── likes.test.ts
    └── validations.test.ts  # Testes de erro e segurança
```

## 💡 Exemplo de Teste

```typescript
it("should create a new user", async () => {
  const userData = makeUser(); // Gera dados fake

  const response = await request(app.server)
    .post("/users")
    .send({ user: userData });

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty("id");
  expect(response.body).toHaveProperty("login", userData.login);
});
```

## ✅ Scripts Disponíveis

| Script                  | Descrição                                           |
| ----------------------- | --------------------------------------------------- |
| `npm test`              | Executa todos os testes E2E uma vez                 |
| `npm run test:watch`    | Executa testes em modo watch (re-executa ao salvar) |
| `npm run test:coverage` | Executa testes e gera relatório de cobertura        |
| `npm run pretest`       | Aplica migrations no banco de testes (automático)   |
| `npm run validate`      | Executa type-check + lint                           |

## 🎯 Boas Práticas Implementadas

1. **Isolamento**: Cada teste é independente e não depende de outros
2. **Setup/Teardown**: beforeAll e afterAll para configurar e limpar
3. **Dados Realistas**: Uso do Faker para gerar dados que parecem reais
4. **Happy Path**: Testes focados no caminho feliz (sucesso)
5. **Sad Path**: Testes focados em erros e validações de segurança
6. **Factories**: Reutilização de código para geração de dados
7. **E2E Real**: Testes fazem requisições HTTP reais para a API
8. **Segurança**: Testes validam permissões de edição/exclusão

## 📈 Próximos Passos

Para 100% de cobertura, considere adicionar:

- Testes de performance e carga
- Testes de integração com mock de banco (para velocidade extrema)

## 🐛 Troubleshooting

**Erro: "ECONNREFUSED localhost:5433"**

- Solução: Execute `docker-compose up -d postgres-test`

**Erro: "relation does not exist"**

- Solução: Execute `npm run pretest` para rodar migrations (o `npm test` já faz isso automaticamente)

**Testes lentos:**

- Normal! Testes E2E são mais lentos por serem completos
- Use `npm run test:watch` durante desenvolvimento

---

**Status**: ✅ 31/31 testes passando | ✅ TypeScript validado | ✅ ESLint validado | ✅ Sad Paths Cobertos
