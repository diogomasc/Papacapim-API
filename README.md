# Papacapim API

Backend API RESTful para a rede social Papacapim, desenvolvida com Node.js, TypeScript, Fastify e PostgreSQL.

> 💡 **Projeto inspirado na API [api.papacapim.just.pro.br](https://api.papacapim.just.pro.br/)**. O objetivo deste repositório é reproduzir as funcionalidades e endpoints da API original para fins de aprendizado e desenvolvimento.

<img width="1899" height="1936" alt="image" src="https://github.com/user-attachments/assets/237e6dec-a7cb-4c2d-bf88-b5c93475e558" />


## 🚀 Tecnologias

- **Node.js 22** - Runtime JavaScript
- **TypeScript** - Superset tipado do JavaScript
- **Fastify** - Framework web rápido e leve
- **Drizzle ORM** - ORM TypeScript para PostgreSQL
- **PostgreSQL** - Banco de dados relacional
- **Zod** - Validação de schemas
- **Swagger** - Documentação da API
- **Docker** - Containerização
- **bcrypt** - Hash de senhas

## 📋 Pré-requisitos

- Node.js v22+
- Docker & Docker Compose
- npm ou yarn

## 🔧 Instalação e Configuração

### 1. Clone o repositório

```bash
cd api
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` conforme necessário:

```env
# Server
PORT=3333

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/papacapim

# JWT
JWT_SECRET=your-secret-key-change-this-in-production
```

### 4. Inicie o PostgreSQL com Docker

```bash
docker-compose up -d postgres
```

### 5. Gere e execute as migrations

```bash
npm run db:generate
npm run db:migrate
```

### 6. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

A API estará disponível em `http://localhost:3333`

## 📖 Documentação da API

Acesse a documentação Swagger em: `http://localhost:3333/docs`

### Autenticação

#### POST /sessions

Criar nova sessão (login)

**Body:**

```json
{
  "login": "usuario",
  "password": "senha123"
}
```

**Response 200:**

```json
{
  "id": 1,
  "user_login": "usuario",
  "token": "uuid-token",
  "ip": "::1",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

#### DELETE /sessions/:id

Encerrar sessão (logout)

### Usuários

#### POST /users

Criar novo usuário

**Body:**

```json
{
  "user": {
    "login": "usuario",
    "name": "Nome Completo",
    "password": "senha123",
    "password_confirmation": "senha123"
  }
}
```

#### PATCH /users/:id

Atualizar usuário (campos opcionais)

#### GET /users

Listar usuários (suporta paginação e busca)

- Query params: `page`, `search`

#### GET /users/:login

Obter usuário específico

#### DELETE /users/:id

Excluir usuário

### Seguidores

#### POST /users/:login/followers

Seguir usuário

- Header: `x-session-token`

#### GET /users/:login/followers

Listar seguidores

#### DELETE /users/:login/followers/:id

Deixar de seguir

### Postagens

#### POST /posts

Criar postagem

- Header: `x-session-token`

#### POST /posts/:id/replies

Responder postagem

- Header: `x-session-token`

#### GET /posts

Listar postagens

- Query params: `page`, `feed`, `search`

#### GET /users/:login/posts

Listar postagens de um usuário

#### GET /posts/:id/replies

Listar respostas

#### DELETE /posts/:id

Excluir postagem

- Header: `x-session-token`

### Curtidas

#### POST /posts/:id/likes

Curtir postagem

- Header: `x-session-token`

#### GET /posts/:id/likes

Listar curtidas

#### DELETE /posts/:id/likes/:id

Remover curtida

- Header: `x-session-token`

## 🐳 Docker

### Executar com Docker Compose

Inicie todos os serviços:

```bash
docker-compose up -d
```

Parar serviços:

```bash
docker-compose down
```

### Apenas PostgreSQL

```bash
docker-compose up -d postgres
```

## 📝 Scripts

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Compila o projeto para produção
- `npm start` - Inicia o servidor de produção
- `npm run db:generate` - Gera migrations do Drizzle
- `npm run db:migrate` - Executa migrations

## 🏗️ Estrutura do Projeto

```
api/
├── src/
│   ├── drizzle/
│   │   ├── schema/          # Schemas do banco de dados
│   │   │   ├── users.ts
│   │   │   ├── sessions.ts
│   │   │   ├── posts.ts
│   │   │   ├── followers.ts
│   │   │   └── likes.ts
│   │   ├── migrations/      # Migrations Drizzle
│   │   └── index.ts         # Conexão do banco
│   ├── functions/           # Funções utilitárias
│   │   ├── hash-password.ts
│   │   ├── verify-password.ts
│   │   └── generate-token.ts
│   ├── routes/              # Rotas da API
│   │   ├── sessions/
│   │   ├── users/
│   │   ├── followers/
│   │   ├── posts/
│   │   └── likes/
│   ├── env.ts               # Validação de variáveis de ambiente
│   └── server.ts            # Configuração do servidor Fastify
├── .env                     # Variáveis de ambiente
├── .env.example             # Template de variáveis
├── docker-compose.yml       # Configuração Docker
├── Dockerfile               # Imagem Docker
├── drizzle.config.ts        # Configuração Drizzle
├── tsconfig.json            # Configuração TypeScript
├── tsup.config.ts           # Configuração build
└── package.json
```

## 🔒 Autenticação

A API utiliza tokens de sessão para autenticação. Após fazer login via `/sessions`, utilize o token retornado no header `x-session-token` nas requisições que necessitam autenticação.

## 🗄️ Banco de Dados

### Schema

- **users**: Usuários do sistema
- **sessions**: Sessões de autenticação
- **posts**: Postagens e respostas
- **followers**: Relacionamento de seguidores
- **likes**: Curtidas em postagens

Todas as tabelas possuem relacionamentos com cascade delete para manter a integridade referencial.

## 📄 Licença

ISC

## 👤 Autor

Desenvolvido como réplica local da API Papacapim
