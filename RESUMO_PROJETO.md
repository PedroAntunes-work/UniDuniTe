# UniDuniTê v2 — Resumo do projeto

## Visão geral

O UniDuniTê é uma aplicação full stack para cadastrar participantes e dividi-los aleatoriamente em grupos equilibrados.

## Stack

- **Frontend:** React 19 com Create React App.
- **Backend:** Node.js + Express.
- **Persistência:** JSON local em `backend/db/participants.json`.
- **Testes:** Jest, Supertest e testes puros do frontend.

## Estrutura principal
 
```text
UniDuniTe/
├── backend/
│   ├── db/                 # Dados locais
│   ├── src/
│   │   ├── routes/         # Rotas HTTP
│   │   ├── services/       # Regras de negócio e validações
│   │   ├── repositories/   # Leitura e escrita do JSON
│   │   └── middlewares/    # Tratamento de erros
│   └── tests/              # Testes da API
├── frontend/
│   └── src/
│       ├── components/     # Componentes React
│       ├── services/       # Comunicação com a API
│       └── utils/          # Funções auxiliares e testes
├── README.md
└── package.json
```

## API

Base URL:

```text
http://localhost:3001/api
```

| Método | Rota | Função |
|---|---|---|
| `GET` | `/health` | Verifica a API |
| `GET` | `/participants` | Lista participantes |
| `GET` | `/participants/:id` | Busca participante |
| `POST` | `/participants` | Cria participante |
| `POST` | `/participants/import` | Importa vários nomes |
| `PUT` | `/participants/:id` | Substitui participante |
| `PATCH` | `/participants/:id` | Atualiza participante |
| `DELETE` | `/participants/:id` | Remove participante |

Body para criação ou atualização:

```json
{
  "name": "Ana"
}
```

Body para importação:

```json
{
  "names": ["Ana", "Bia", "Caio"]
}
```

## Funcionalidades

- Cadastro, edição e exclusão de participantes.
- Importação por texto, `.txt` e `.csv`.
- Pré-visualização de nomes válidos e rejeitados.
- Bloqueio de nomes duplicados.
- Sorteio usando `crypto.getRandomValues`.
- Configuração de mínimo e máximo de pessoas por grupo.
- Cálculo automático da quantidade de grupos.
- Revelação de todos os grupos ou um grupo por vez.
- Animação visual estilo caça-níquel.
- Botão para pular a animação.
- Edição manual dos grupos após o sorteio.
- Compartilhamento pelo WhatsApp.
- Cópia do resultado para a área de transferência.
- Tema claro e escuro.
- Layout responsivo e acessível.

## Regras principais

- IDs são numéricos e incrementais.
- Nomes são obrigatórios e limitados a 100 caracteres.
- Duplicidades são verificadas ignorando caixa e espaços externos.
- Cada participante aparece uma única vez no sorteio.
- A quantidade de grupos respeita os limites mínimo e máximo.
- Alterar participantes ou limites limpa o resultado anterior.

## Formato dos erros

```json
{
  "error": {
    "code": "DUPLICATE_NAME",
    "message": "Já existe um participante com esse nome."
  }
}
```

Status utilizados: `400`, `404`, `409`, `422` e `500`.

## Como executar

Instalar dependências:

```powershell
npm run install:all
```

Iniciar o backend:

```powershell
npm run start:backend
```

Em outro terminal, iniciar o frontend:

```powershell
npm run start:frontend
```

Executar testes:

```powershell
npm test
npm test --prefix frontend -- --watchAll=false --runInBand
```

Gerar build:

```powershell
npm run build
```

## Testes realizados

- Testes da API com Jest e Supertest.
- Testes do parser de importação.
- Testes da prévia de nomes.
- Testes do modo de revelação.
- Teste da geração do texto para WhatsApp.
- Build de produção do frontend.

## Fora do escopo atual

- Autenticação.
- Histórico persistente de sorteios.
- Banco de dados real.
- Deploy.
- Efeito sonoro da animação.
