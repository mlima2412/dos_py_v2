# DOSPY v2 - Projetos Separados

Este repositório contém dois projetos independentes que foram separados do monorepo original:

## 📁 Estrutura do Projeto

```
dos_py_v2/
├── admin/          # Frontend React + TypeScript + Vite
└── api/            # Backend NestJS + Prisma
```

## 🚀 Como Executar

### API (Backend)

1. Navegue até o diretório da API:
```bash
cd api
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o banco de dados (se necessário):
```bash
npx prisma generate
npx prisma db push
```

4. Execute em modo de desenvolvimento:
```bash
npm run dev
```

A API estará disponível em: `http://localhost:3000`

### Admin (Frontend)

1. Navegue até o diretório do admin:
```bash
cd admin
```

2. Instale as dependências:
```bash
npm install
```

3. Execute em modo de desenvolvimento:
```bash
npm run dev
```

O frontend estará disponível em: `http://localhost:5173`

## 🔧 Scripts Disponíveis

### API
- `npm run dev` - Executa em modo desenvolvimento com watch
- `npm run build` - Compila o projeto
- `npm run start` - Executa a versão compilada
- `npm run test` - Executa os testes
- `npm run lint` - Executa o linter

### Admin
- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Compila o projeto para produção
- `npm run preview` - Visualiza a build de produção
- `npm run generate:api` - Gera cliente da API
- `npm run dev:with-api` - Gera cliente da API e executa em desenvolvimento
- `npm run lint` - Executa o linter

## 🌐 Comunicação entre Projetos

O frontend está configurado para se comunicar com a API através de:
- Proxy configurado no Vite (desenvolvimento)
- Cliente da API gerado automaticamente com Kubb
- Endpoint padrão: `http://localhost:3000`

## 📝 Notas Importantes

- **API deve ser executada primeiro** para que o frontend possa se conectar
- O frontend possui geração automática de tipos TypeScript baseados na API
- Cada projeto tem suas próprias dependências e configurações independentes
- Os projetos podem ser deployados separadamente

## 🛠️ Tecnologias

### API
- NestJS
- Prisma ORM
- TypeScript
- JWT Authentication
- Swagger/OpenAPI

### Admin
- React 19
- TypeScript
- Vite
- TailwindCSS
- React Query
- React Router
- Radix UI

---

**Benefícios da Separação:**
- ✅ Desenvolvimento independente
- ✅ Deploy separado
- ✅ Escalabilidade melhorada
- ✅ Menos conflitos de dependências
- ✅ Builds mais rápidos
- ✅ Manutenção simplificada