# Papacapim API — Documentação de Rotas

> **Guia de referência completo** para agentes de IA e desenvolvedores que interagem com a API.
> Inclui todas as rotas, schemas de validação por campo, formatos de body/resposta e regras de negócio.

---

## Índice

- [Visão Geral](#visão-geral)
- [Autenticação](#autenticação)
- [Convenções](#convenções)
- [Schemas do Banco de Dados](#schemas-do-banco-de-dados)
- [Rotas](#rotas)
  - [Usuários](#usuários)
  - [Sessões (Autenticação)](#sessões-autenticação)
  - [Postagens](#postagens)
  - [Seguidores](#seguidores)
  - [Curtidas](#curtidas)

---

## Visão Geral

| Item               | Detalhe                                              |
| ------------------ | ---------------------------------------------------- |
| **Framework**      | Fastify + fastify-type-provider-zod                  |
| **Validação**      | Zod (schemas declarados nas rotas)                   |
| **Banco de Dados** | PostgreSQL via Drizzle ORM                           |
| **Formato**        | JSON (application/json)                              |
| **Paginação**      | 20 itens por página, parâmetro `page` (query string) |
| **Documentação**   | Swagger UI disponível em `/docs`                     |

---

## Autenticação

A API utiliza autenticação baseada em **token de sessão**. O fluxo é:

1. O cliente faz login via `POST /sessions` enviando `login` e `password`.
2. A API retorna um **token** no campo `token` da resposta.
3. Nas rotas protegidas, o cliente envia o token no header `x-session-token`.

### Header de autenticação

```
x-session-token: <token_da_sessao>
```

> **Rotas protegidas** são marcadas com 🔒 nesta documentação.

---

## Convenções

| Convenção                   | Descrição                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| **IDs numéricos em params** | Sempre convertidos via `z.coerce.number()` — aceita string ou número           |
| **Respostas snake_case**    | Todos os campos de resposta usam `snake_case` (ex: `created_at`, `user_login`) |
| **Body aninhado**           | Alguns bodies usam wrapper (ex: `{ user: { ... } }`, `{ post: { ... } }`)      |
| **Paginação padrão**        | `page` default `1`, limite fixo de `20` resultados por página                  |
| **Erros de validação**      | Retornados automaticamente pelo Zod com status `400` e detalhes dos campos     |

---

## Schemas do Banco de Dados

### Tabela `users`

| Coluna          | Tipo        | Constraints               |
| --------------- | ----------- | ------------------------- |
| `id`            | `serial`    | PK, auto-incremento       |
| `login`         | `text`      | NOT NULL, UNIQUE          |
| `name`          | `text`      | NOT NULL                  |
| `password_hash` | `text`      | NOT NULL                  |
| `created_at`    | `timestamp` | NOT NULL, default `now()` |
| `updated_at`    | `timestamp` | NOT NULL, default `now()` |

### Tabela `sessions`

| Coluna       | Tipo        | Constraints                                      |
| ------------ | ----------- | ------------------------------------------------ |
| `id`         | `serial`    | PK, auto-incremento                              |
| `user_login` | `text`      | NOT NULL, FK → `users.login` (ON DELETE CASCADE) |
| `token`      | `text`      | NOT NULL, UNIQUE                                 |
| `ip`         | `text`      | NOT NULL                                         |
| `created_at` | `timestamp` | NOT NULL, default `now()`                        |
| `updated_at` | `timestamp` | NOT NULL, default `now()`                        |

### Tabela `posts`

| Coluna       | Tipo        | Constraints                                      |
| ------------ | ----------- | ------------------------------------------------ |
| `id`         | `serial`    | PK, auto-incremento                              |
| `user_login` | `text`      | NOT NULL, FK → `users.login` (ON DELETE CASCADE) |
| `post_id`    | `integer`   | NULLABLE, FK → `posts.id` (ON DELETE CASCADE)    |
| `message`    | `text`      | NOT NULL                                         |
| `created_at` | `timestamp` | NOT NULL, default `now()`                        |
| `updated_at` | `timestamp` | NOT NULL, default `now()`                        |

> `post_id` é `null` para posts originais e preenchido com o ID do post pai para respostas (replies).

### Tabela `followers`

| Coluna           | Tipo        | Constraints                                      |
| ---------------- | ----------- | ------------------------------------------------ |
| `id`             | `serial`    | PK, auto-incremento                              |
| `follower_login` | `text`      | NOT NULL, FK → `users.login` (ON DELETE CASCADE) |
| `followed_login` | `text`      | NOT NULL, FK → `users.login` (ON DELETE CASCADE) |
| `created_at`     | `timestamp` | NOT NULL, default `now()`                        |
| `updated_at`     | `timestamp` | NOT NULL, default `now()`                        |

> **Constraint UNIQUE** em `(follower_login, followed_login)` — impede duplicatas.

### Tabela `likes`

| Coluna       | Tipo        | Constraints                                      |
| ------------ | ----------- | ------------------------------------------------ |
| `id`         | `serial`    | PK, auto-incremento                              |
| `user_login` | `text`      | NOT NULL, FK → `users.login` (ON DELETE CASCADE) |
| `post_id`    | `integer`   | NOT NULL, FK → `posts.id` (ON DELETE CASCADE)    |
| `created_at` | `timestamp` | NOT NULL, default `now()`                        |
| `updated_at` | `timestamp` | NOT NULL, default `now()`                        |

> **Constraint UNIQUE** em `(user_login, post_id)` — impede curtida duplicada.

---

## Rotas

---

### Usuários

#### `POST /users` — Criar Usuário

Cria um novo usuário no sistema. **Não requer autenticação.**

**Body (JSON):**

```json
{
  "user": {
    "login": "string",
    "name": "string",
    "password": "string",
    "password_confirmation": "string"
  }
}
```

**Validação do Body:**

| Campo                        | Tipo     | Obrigatório | Validação               |
| ---------------------------- | -------- | ----------- | ----------------------- |
| `user`                       | `object` | ✅ Sim      | Wrapper obrigatório     |
| `user.login`                 | `string` | ✅ Sim      | Mínimo **3 caracteres** |
| `user.name`                  | `string` | ✅ Sim      | Mínimo **3 caracteres** |
| `user.password`              | `string` | ✅ Sim      | Mínimo **6 caracteres** |
| `user.password_confirmation` | `string` | ✅ Sim      | Mínimo **6 caracteres** |

**Regras de negócio:**

- `password` e `password_confirmation` devem ser **idênticos** (validação no handler).
- `login` deve ser **único** no banco de dados.

**Respostas:**

| Status | Descrição                  | Body                                          |
| ------ | -------------------------- | --------------------------------------------- |
| `201`  | Usuário criado com sucesso | `{ id, login, name, created_at, updated_at }` |
| `400`  | Senhas não conferem        | `{ message: "Senhas nao conferem" }`          |
| `400`  | Login já existe            | `{ message: "Login ja existe" }`              |
| `400`  | Erro de validação (Zod)    | Detalhes dos campos inválidos                 |

**Exemplo de resposta `201`:**

```json
{
  "id": 1,
  "login": "joao",
  "name": "João Silva",
  "created_at": "2026-02-13T12:00:00.000Z",
  "updated_at": "2026-02-13T12:00:00.000Z"
}
```

---

#### `GET /users` — Listar Usuários

Lista todos os usuários com paginação e busca opcional. **Não requer autenticação.**

**Query String:**

| Parâmetro | Tipo     | Obrigatório | Validação / Default                            |
| --------- | -------- | ----------- | ---------------------------------------------- |
| `page`    | `number` | ❌ Não      | Convertido de string, default `1`              |
| `search`  | `string` | ❌ Não      | Opcional; filtra por `name` ou `login` (ILIKE) |

**Respostas:**

| Status | Descrição         | Body                                                   |
| ------ | ----------------- | ------------------------------------------------------ |
| `200`  | Lista de usuários | Array de `{ id, login, name, created_at, updated_at }` |

**Schema de resposta `200`:**

```json
[
  {
    "id": 1,
    "login": "joao",
    "name": "João Silva",
    "created_at": "2026-02-13T12:00:00.000Z",
    "updated_at": "2026-02-13T12:00:00.000Z"
  }
]
```

| Campo        | Tipo       | Descrição                  |
| ------------ | ---------- | -------------------------- |
| `id`         | `number`   | ID do usuário              |
| `login`      | `string`   | Login único                |
| `name`       | `string`   | Nome do usuário            |
| `created_at` | `date/ISO` | Data de criação            |
| `updated_at` | `date/ISO` | Data de última atualização |

---

#### `GET /users/:login` — Obter Usuário

Retorna os dados de um usuário específico pelo login. **Não requer autenticação.**

**Params:**

| Parâmetro | Tipo     | Obrigatório | Validação          |
| --------- | -------- | ----------- | ------------------ |
| `login`   | `string` | ✅ Sim      | Não pode ser vazio |

**Respostas:**

| Status | Descrição              | Body                                          |
| ------ | ---------------------- | --------------------------------------------- |
| `200`  | Usuário encontrado     | `{ id, login, name, created_at, updated_at }` |
| `404`  | Usuário não encontrado | `{ message: "Usuario nao encontrado" }`       |

---

#### `PATCH /users/:id` — Atualizar Usuário 🔒

Atualiza dados do usuário autenticado. **Requer autenticação.**

**Headers:**

| Header            | Tipo     | Obrigatório | Validação          |
| ----------------- | -------- | ----------- | ------------------ |
| `x-session-token` | `string` | ✅ Sim      | Não pode ser vazio |

**Params:**

| Parâmetro | Tipo     | Obrigatório | Validação                          |
| --------- | -------- | ----------- | ---------------------------------- |
| `id`      | `number` | ✅ Sim      | Convertido via `z.coerce.number()` |

**Body (JSON):**

```json
{
  "user": {
    "login": "string (opcional)",
    "name": "string (opcional)",
    "password": "string (opcional)",
    "password_confirmation": "string (opcional)"
  }
}
```

**Validação do Body:**

| Campo                        | Tipo     | Obrigatório | Validação                                     |
| ---------------------------- | -------- | ----------- | --------------------------------------------- |
| `user`                       | `object` | ✅ Sim      | Wrapper obrigatório                           |
| `user.login`                 | `string` | ❌ Não      | Opcional; se enviado, mínimo **3 caracteres** |
| `user.name`                  | `string` | ❌ Não      | Opcional; se enviado, mínimo **3 caracteres** |
| `user.password`              | `string` | ❌ Não      | Opcional; se enviado, mínimo **6 caracteres** |
| `user.password_confirmation` | `string` | ❌ Não      | Opcional; se enviado, mínimo **6 caracteres** |

**Regras de negócio:**

- O usuário só pode atualizar **a si mesmo** (login da sessão deve coincidir com o login do usuário alvo).
- Se `password` for enviado, `password_confirmation` deve ser **idêntico**.
- Se a senha for alterada, **todas as sessões do usuário são deletadas**.
- Se `login` for alterado, deve permanecer **único** no banco de dados.

**Respostas:**

| Status | Descrição              | Body                                                     |
| ------ | ---------------------- | -------------------------------------------------------- |
| `200`  | Usuário atualizado     | `{ id, login, name, created_at, updated_at }`            |
| `400`  | Senhas não conferem    | `{ message: "Senhas nao conferem" }`                     |
| `400`  | Login já existe        | `{ message: "Login ja existe" }`                         |
| `401`  | Sessão inválida        | `{ message: "Sessao invalida" }`                         |
| `403`  | Sem permissão          | `{ message: "Sem permissao para alterar este usuario" }` |
| `404`  | Usuário não encontrado | `{ message: "Usuario nao encontrado" }`                  |

---

#### `DELETE /users/:id` — Excluir Usuário 🔒

Exclui o usuário autenticado. **Requer autenticação.**

**Headers:**

| Header            | Tipo     | Obrigatório | Validação          |
| ----------------- | -------- | ----------- | ------------------ |
| `x-session-token` | `string` | ✅ Sim      | Não pode ser vazio |

**Params:**

| Parâmetro | Tipo     | Obrigatório | Validação                          |
| --------- | -------- | ----------- | ---------------------------------- |
| `id`      | `number` | ✅ Sim      | Convertido via `z.coerce.number()` |

**Regras de negócio:**

- O usuário só pode excluir **a si mesmo** (login da sessão deve coincidir com o login do usuário alvo).
- A exclusão é em cascata (deleta sessões, posts, followers, likes associados via FK CASCADE).

**Respostas:**

| Status | Descrição                    | Body                                                     |
| ------ | ---------------------------- | -------------------------------------------------------- |
| `204`  | Usuário excluído com sucesso | Sem body (`null`)                                        |
| `401`  | Sessão inválida              | `{ message: "Sessao invalida" }`                         |
| `403`  | Sem permissão                | `{ message: "Sem permissao para excluir este usuario" }` |
| `404`  | Usuário não encontrado       | `{ message: "Usuario nao encontrado" }`                  |

---

### Sessões (Autenticação)

#### `POST /sessions` — Login (Criar Sessão)

Cria uma nova sessão (login). **Não requer autenticação.**

**Body (JSON):**

```json
{
  "login": "string",
  "password": "string"
}
```

**Validação do Body:**

| Campo      | Tipo     | Obrigatório | Validação          |
| ---------- | -------- | ----------- | ------------------ |
| `login`    | `string` | ✅ Sim      | Não pode ser vazio |
| `password` | `string` | ✅ Sim      | Não pode ser vazio |

**Regras de negócio:**

- Verifica se o `login` existe no banco de dados.
- Verifica se o `password` corresponde ao hash armazenado (bcrypt).
- Gera um **token aleatório** associado à sessão.
- Armazena o **IP** do cliente na sessão.

**Respostas:**

| Status | Descrição                   | Body                                                    |
| ------ | --------------------------- | ------------------------------------------------------- |
| `200`  | Login realizado com sucesso | `{ id, user_login, token, ip, created_at, updated_at }` |
| `401`  | Credenciais inválidas       | `{ message: "Credenciais invalidas" }`                  |

**Exemplo de resposta `200`:**

```json
{
  "id": 1,
  "user_login": "joao",
  "token": "abc123def456",
  "ip": "127.0.0.1",
  "created_at": "2026-02-13T12:00:00.000Z",
  "updated_at": "2026-02-13T12:00:00.000Z"
}
```

---

#### `DELETE /sessions/:id` — Logout (Encerrar Sessão)

Encerra uma sessão (logout). **Não requer header de autenticação** (apenas o ID da sessão no params).

**Params:**

| Parâmetro | Tipo     | Obrigatório | Validação                          |
| --------- | -------- | ----------- | ---------------------------------- |
| `id`      | `number` | ✅ Sim      | Convertido via `z.coerce.number()` |

**Respostas:**

| Status | Descrição        | Body              |
| ------ | ---------------- | ----------------- |
| `204`  | Sessão encerrada | Sem body (`null`) |

---

### Postagens

#### `POST /posts` — Criar Postagem 🔒

Cria uma nova postagem. **Requer autenticação.**

**Headers:**

| Header            | Tipo     | Obrigatório | Validação          |
| ----------------- | -------- | ----------- | ------------------ |
| `x-session-token` | `string` | ✅ Sim      | Não pode ser vazio |

**Body (JSON):**

```json
{
  "post": {
    "message": "string"
  }
}
```

**Validação do Body:**

| Campo          | Tipo     | Obrigatório | Validação                                         |
| -------------- | -------- | ----------- | ------------------------------------------------- |
| `post`         | `object` | ✅ Sim      | Wrapper obrigatório                               |
| `post.message` | `string` | ✅ Sim      | Mínimo **1 caractere**, máximo **500 caracteres** |

**Respostas:**

| Status | Descrição       | Body                                                           |
| ------ | --------------- | -------------------------------------------------------------- |
| `201`  | Postagem criada | `{ id, user_login, post_id, message, created_at, updated_at }` |
| `401`  | Sessão inválida | `{ message: "Sessao invalida" }`                               |

**Exemplo de resposta `201`:**

```json
{
  "id": 1,
  "user_login": "joao",
  "post_id": null,
  "message": "Minha primeira postagem!",
  "created_at": "2026-02-13T12:00:00.000Z",
  "updated_at": "2026-02-13T12:00:00.000Z"
}
```

> `post_id` é `null` para postagens originais (não é resposta a outro post).

---

#### `GET /posts` — Listar Postagens

Lista postagens com paginação, feed e busca. **Autenticação condicional** (obrigatória apenas se `feed=1`).

**Headers (condicionais):**

| Header            | Tipo     | Obrigatório           | Validação          |
| ----------------- | -------- | --------------------- | ------------------ |
| `x-session-token` | `string` | ⚠️ Apenas se `feed=1` | Não pode ser vazio |

**Query String:**

| Parâmetro | Tipo     | Obrigatório | Validação / Default                                             |
| --------- | -------- | ----------- | --------------------------------------------------------------- |
| `page`    | `number` | ❌ Não      | Convertido de string, default `1`                               |
| `feed`    | `number` | ❌ Não      | Convertido de string; se `1`, filtra posts de usuários seguidos |
| `search`  | `string` | ❌ Não      | Opcional; filtra mensagens por conteúdo (ILIKE)                 |

**Regras de negócio:**

- Se `feed=1`: requer `x-session-token`, retorna apenas posts de usuários que o autenticado segue.
- Se nenhum usuário seguido, retorna array vazio `[]`.
- Resultados ordenados por `created_at`.

**Respostas:**

| Status | Descrição                   | Body                                                                            |
| ------ | --------------------------- | ------------------------------------------------------------------------------- |
| `200`  | Lista de postagens          | Array de `{ id, user_login, post_id, message, created_at, updated_at }`         |
| `401`  | Token necessário / inválido | `{ message: "Token necessario para feed" }` ou `{ message: "Sessao invalida" }` |

**Schema de resposta `200`:**

| Campo        | Tipo             | Descrição                         |
| ------------ | ---------------- | --------------------------------- |
| `id`         | `number`         | ID da postagem                    |
| `user_login` | `string`         | Login do autor                    |
| `post_id`    | `number \| null` | ID do post pai (null se original) |
| `message`    | `string`         | Conteúdo da postagem              |
| `created_at` | `date/ISO`       | Data de criação                   |
| `updated_at` | `date/ISO`       | Data de última atualização        |

---

#### `GET /users/:login/posts` — Listar Postagens de um Usuário

Lista as postagens de um usuário específico. **Não requer autenticação.**

**Params:**

| Parâmetro | Tipo     | Obrigatório | Validação          |
| --------- | -------- | ----------- | ------------------ |
| `login`   | `string` | ✅ Sim      | Não pode ser vazio |

**Query String:**

| Parâmetro | Tipo     | Obrigatório | Validação / Default               |
| --------- | -------- | ----------- | --------------------------------- |
| `page`    | `number` | ❌ Não      | Convertido de string, default `1` |

**Respostas:**

| Status | Descrição          | Body                                                                    |
| ------ | ------------------ | ----------------------------------------------------------------------- |
| `200`  | Lista de postagens | Array de `{ id, user_login, post_id, message, created_at, updated_at }` |

---

#### `POST /posts/:id/replies` — Responder Postagem 🔒

Cria uma resposta (reply) a uma postagem existente. **Requer autenticação.**

**Headers:**

| Header            | Tipo     | Obrigatório | Validação          |
| ----------------- | -------- | ----------- | ------------------ |
| `x-session-token` | `string` | ✅ Sim      | Não pode ser vazio |

**Params:**

| Parâmetro | Tipo     | Obrigatório | Validação                          |
| --------- | -------- | ----------- | ---------------------------------- |
| `id`      | `number` | ✅ Sim      | Convertido via `z.coerce.number()` |

**Body (JSON):**

```json
{
  "reply": {
    "message": "string"
  }
}
```

**Validação do Body:**

| Campo           | Tipo     | Obrigatório | Validação                                         |
| --------------- | -------- | ----------- | ------------------------------------------------- |
| `reply`         | `object` | ✅ Sim      | Wrapper obrigatório                               |
| `reply.message` | `string` | ✅ Sim      | Mínimo **1 caractere**, máximo **500 caracteres** |

**Regras de negócio:**

- O post pai (`:id`) deve existir.
- O `post_id` da resposta é preenchido com o ID do post pai.

**Respostas:**

| Status | Descrição                   | Body                                                           |
| ------ | --------------------------- | -------------------------------------------------------------- |
| `201`  | Resposta criada             | `{ id, user_login, post_id, message, created_at, updated_at }` |
| `401`  | Sessão inválida             | `{ message: "Sessao invalida" }`                               |
| `404`  | Postagem pai não encontrada | `{ message: "Postagem nao encontrada" }`                       |

---

#### `GET /posts/:id/replies` — Listar Respostas de uma Postagem

Lista as respostas de uma postagem específica. **Não requer autenticação.**

**Params:**

| Parâmetro | Tipo     | Obrigatório | Validação                          |
| --------- | -------- | ----------- | ---------------------------------- |
| `id`      | `number` | ✅ Sim      | Convertido via `z.coerce.number()` |

**Query String:**

| Parâmetro | Tipo     | Obrigatório | Validação / Default               |
| --------- | -------- | ----------- | --------------------------------- |
| `page`    | `number` | ❌ Não      | Convertido de string, default `1` |

**Respostas:**

| Status | Descrição          | Body                                                                    |
| ------ | ------------------ | ----------------------------------------------------------------------- |
| `200`  | Lista de respostas | Array de `{ id, user_login, post_id, message, created_at, updated_at }` |

**Schema de resposta `200`:**

| Campo        | Tipo             | Descrição                  |
| ------------ | ---------------- | -------------------------- |
| `id`         | `number`         | ID da resposta             |
| `user_login` | `string`         | Login do autor da resposta |
| `post_id`    | `number \| null` | ID do post pai             |
| `message`    | `string`         | Conteúdo da resposta       |
| `created_at` | `date/ISO`       | Data de criação            |
| `updated_at` | `date/ISO`       | Data de última atualização |

---

#### `DELETE /posts/:id` — Excluir Postagem 🔒

Exclui uma postagem. **Requer autenticação.**

**Headers:**

| Header            | Tipo     | Obrigatório | Validação          |
| ----------------- | -------- | ----------- | ------------------ |
| `x-session-token` | `string` | ✅ Sim      | Não pode ser vazio |

**Params:**

| Parâmetro | Tipo     | Obrigatório | Validação                          |
| --------- | -------- | ----------- | ---------------------------------- |
| `id`      | `number` | ✅ Sim      | Convertido via `z.coerce.number()` |

**Regras de negócio:**

- O post deve pertencer ao usuário autenticado.
- A exclusão é em cascata (deleta replies e likes associados via FK CASCADE).

**Respostas:**

| Status | Descrição               | Body                                                      |
| ------ | ----------------------- | --------------------------------------------------------- |
| `204`  | Postagem excluída       | Sem body (`null`)                                         |
| `401`  | Sessão inválida         | `{ message: "Sessao invalida" }`                          |
| `403`  | Sem permissão           | `{ message: "Sem permissao para excluir esta postagem" }` |
| `404`  | Postagem não encontrada | `{ message: "Postagem nao encontrada" }`                  |

---

### Seguidores

#### `POST /users/:login/followers` — Seguir Usuário 🔒

Segue um usuário. **Requer autenticação.**

**Headers:**

| Header            | Tipo     | Obrigatório | Validação          |
| ----------------- | -------- | ----------- | ------------------ |
| `x-session-token` | `string` | ✅ Sim      | Não pode ser vazio |

**Params:**

| Parâmetro | Tipo     | Obrigatório | Validação          |
| --------- | -------- | ----------- | ------------------ |
| `login`   | `string` | ✅ Sim      | Não pode ser vazio |

**Sem body.** O seguidor é identificado pela sessão, e o seguido pelo `:login` nos params.

**Regras de negócio:**

- O usuário a ser seguido (`:login`) deve existir.
- Se já segue o usuário, retorna `204` (idempotente, sem erro).
- Constraint UNIQUE impede duplicatas no banco.

**Respostas:**

| Status | Descrição               | Body                                                             |
| ------ | ----------------------- | ---------------------------------------------------------------- |
| `201`  | Seguindo com sucesso    | `{ id, follower_login, followed_login, created_at, updated_at }` |
| `204`  | Já seguia (idempotente) | Sem body (`null`)                                                |
| `401`  | Sessão inválida         | `{ message: "Sessao invalida" }`                                 |
| `404`  | Usuário não encontrado  | `{ message: "Usuario nao encontrado" }`                          |

**Exemplo de resposta `201`:**

```json
{
  "id": 1,
  "follower_login": "joao",
  "followed_login": "maria",
  "created_at": "2026-02-13T12:00:00.000Z",
  "updated_at": "2026-02-13T12:00:00.000Z"
}
```

---

#### `GET /users/:login/followers` — Listar Seguidores

Lista todos os seguidores de um usuário. **Não requer autenticação.**

**Params:**

| Parâmetro | Tipo     | Obrigatório | Validação          |
| --------- | -------- | ----------- | ------------------ |
| `login`   | `string` | ✅ Sim      | Não pode ser vazio |

**Respostas:**

| Status | Descrição           | Body                                                   |
| ------ | ------------------- | ------------------------------------------------------ |
| `200`  | Lista de seguidores | Array de `{ id, login, name, created_at, updated_at }` |

**Schema de resposta `200`:**

| Campo        | Tipo       | Descrição                  |
| ------------ | ---------- | -------------------------- |
| `id`         | `number`   | ID do usuário seguidor     |
| `login`      | `string`   | Login do seguidor          |
| `name`       | `string`   | Nome do seguidor           |
| `created_at` | `date/ISO` | Data de criação do usuário |
| `updated_at` | `date/ISO` | Data de última atualização |

---

#### `DELETE /users/:login/followers/:id` — Deixar de Seguir 🔒

Remove o follow do usuário autenticado. **Requer autenticação.**

**Headers:**

| Header            | Tipo     | Obrigatório | Validação          |
| ----------------- | -------- | ----------- | ------------------ |
| `x-session-token` | `string` | ✅ Sim      | Não pode ser vazio |

**Params:**

| Parâmetro | Tipo     | Obrigatório | Validação                                   |
| --------- | -------- | ----------- | ------------------------------------------- |
| `login`   | `string` | ✅ Sim      | Login do usuário que deixará de ser seguido |
| `id`      | `number` | ✅ Sim      | Convertido via `z.coerce.number()`          |

**Regras de negócio:**

- Remove a relação de follow entre o usuário autenticado (`follower`) e o `:login` (`followed`).
- O parâmetro `:id` existe na URL mas a deleção é feita pelo par `(follower_login, followed_login)`.

**Respostas:**

| Status | Descrição          | Body                             |
| ------ | ------------------ | -------------------------------- |
| `204`  | Unfollow realizado | Sem body (`null`)                |
| `401`  | Sessão inválida    | `{ message: "Sessao invalida" }` |

---

### Curtidas

#### `POST /posts/:id/likes` — Curtir Postagem 🔒

Adiciona uma curtida a uma postagem. **Requer autenticação.**

**Headers:**

| Header            | Tipo     | Obrigatório | Validação          |
| ----------------- | -------- | ----------- | ------------------ |
| `x-session-token` | `string` | ✅ Sim      | Não pode ser vazio |

**Params:**

| Parâmetro | Tipo     | Obrigatório | Validação                          |
| --------- | -------- | ----------- | ---------------------------------- |
| `id`      | `number` | ✅ Sim      | Convertido via `z.coerce.number()` |

**Sem body.**

**Regras de negócio:**

- Se já curtiu, retorna `204` (idempotente, sem erro).
- Constraint UNIQUE em `(user_login, post_id)` impede curtida duplicada.

**Respostas:**

| Status | Descrição                | Body                                                  |
| ------ | ------------------------ | ----------------------------------------------------- |
| `201`  | Curtida registrada       | `{ id, user_login, post_id, created_at, updated_at }` |
| `204`  | Já curtido (idempotente) | Sem body (`null`)                                     |
| `401`  | Sessão inválida          | `{ message: "Sessao invalida" }`                      |

**Exemplo de resposta `201`:**

```json
{
  "id": 1,
  "user_login": "joao",
  "post_id": 5,
  "created_at": "2026-02-13T12:00:00.000Z",
  "updated_at": "2026-02-13T12:00:00.000Z"
}
```

---

#### `GET /posts/:id/likes` — Listar Curtidas de uma Postagem

Lista todas as curtidas de uma postagem. **Não requer autenticação.**

**Params:**

| Parâmetro | Tipo     | Obrigatório | Validação                          |
| --------- | -------- | ----------- | ---------------------------------- |
| `id`      | `number` | ✅ Sim      | Convertido via `z.coerce.number()` |

**Respostas:**

| Status | Descrição         | Body                                                           |
| ------ | ----------------- | -------------------------------------------------------------- |
| `200`  | Lista de curtidas | Array de `{ id, user_login, post_id, created_at, updated_at }` |

**Schema de resposta `200`:**

| Campo        | Tipo       | Descrição                  |
| ------------ | ---------- | -------------------------- |
| `id`         | `number`   | ID da curtida              |
| `user_login` | `string`   | Login de quem curtiu       |
| `post_id`    | `number`   | ID do post curtido         |
| `created_at` | `date/ISO` | Data da curtida            |
| `updated_at` | `date/ISO` | Data de última atualização |

---

#### `DELETE /posts/:id/likes/:likeId` — Remover Curtida 🔒

Remove a curtida do usuário autenticado de uma postagem. **Requer autenticação.**

**Headers:**

| Header            | Tipo     | Obrigatório | Validação          |
| ----------------- | -------- | ----------- | ------------------ |
| `x-session-token` | `string` | ✅ Sim      | Não pode ser vazio |

**Params:**

| Parâmetro | Tipo     | Obrigatório | Validação                          |
| --------- | -------- | ----------- | ---------------------------------- |
| `id`      | `number` | ✅ Sim      | Convertido via `z.coerce.number()` |
| `likeId`  | `number` | ✅ Sim      | Convertido via `z.coerce.number()` |

**Regras de negócio:**

- Remove a curtida onde `post_id` = `:id` E `user_login` = login do usuário autenticado.
- O parâmetro `:likeId` existe na URL mas a deleção real usa `(post_id, user_login)`.

**Respostas:**

| Status | Descrição        | Body                             |
| ------ | ---------------- | -------------------------------- |
| `204`  | Curtida removida | Sem body (`null`)                |
| `401`  | Sessão inválida  | `{ message: "Sessao invalida" }` |

---

## Resumo de Todas as Rotas

| Método   | Rota                          | Autenticação | Descrição                      |
| -------- | ----------------------------- | ------------ | ------------------------------ |
| `POST`   | `/users`                      | ❌           | Criar usuário                  |
| `GET`    | `/users`                      | ❌           | Listar usuários                |
| `GET`    | `/users/:login`               | ❌           | Obter usuário                  |
| `PATCH`  | `/users/:id`                  | 🔒           | Atualizar usuário              |
| `DELETE` | `/users/:id`                  | 🔒           | Excluir usuário                |
| `POST`   | `/sessions`                   | ❌           | Login (criar sessão)           |
| `DELETE` | `/sessions/:id`               | ❌           | Logout (encerrar sessão)       |
| `POST`   | `/posts`                      | 🔒           | Criar postagem                 |
| `GET`    | `/posts`                      | ⚠️ (feed)    | Listar postagens               |
| `GET`    | `/users/:login/posts`         | ❌           | Listar postagens de um usuário |
| `POST`   | `/posts/:id/replies`          | 🔒           | Responder postagem             |
| `GET`    | `/posts/:id/replies`          | ❌           | Listar respostas               |
| `DELETE` | `/posts/:id`                  | 🔒           | Excluir postagem               |
| `POST`   | `/users/:login/followers`     | 🔒           | Seguir usuário                 |
| `GET`    | `/users/:login/followers`     | ❌           | Listar seguidores              |
| `DELETE` | `/users/:login/followers/:id` | 🔒           | Deixar de seguir               |
| `POST`   | `/posts/:id/likes`            | 🔒           | Curtir postagem                |
| `GET`    | `/posts/:id/likes`            | ❌           | Listar curtidas                |
| `DELETE` | `/posts/:id/likes/:likeId`    | 🔒           | Remover curtida                |

---

## Códigos de Erro Comuns

| Status | Significado  | Quando ocorre                                                         |
| ------ | ------------ | --------------------------------------------------------------------- |
| `400`  | Bad Request  | Validação Zod falhou, senhas não conferem, login duplicado            |
| `401`  | Unauthorized | Token de sessão ausente, inválido ou expirado; credenciais incorretas |
| `403`  | Forbidden    | Tentativa de alterar/excluir recurso de outro usuário                 |
| `404`  | Not Found    | Recurso (usuário, post) não encontrado                                |
| `204`  | No Content   | Operação bem-sucedida sem body de retorno (delete, ação idempotente)  |
