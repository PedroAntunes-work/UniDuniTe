# UniDuniTê v2

Aplicação full stack para cadastrar participantes e dividi-los aleatoriamente em grupos equilibrados.

## Stack e arquitetura

- **Frontend:** React 19 com Create React App.
- **Backend:** Node.js e Express.
- **Persistência de testes:** arquivo `backend/db/participants.json`.
- **Testes da API:** Jest e Supertest.

O backend separa o fluxo em `router → service → repository`:

- `routes`: definição dos endpoints e respostas HTTP;
- `services`: validações e regras de negócio;
- `repositories`: leitura e escrita do JSON.

## Pré-requisitos

- Node.js 20 ou mais recente
- npm

## Instalação e execução

```bash
npm run install:all
npm run start:backend
```

Em outro terminal:

```bash
npm run start:frontend
```

A interface abre em `http://localhost:3000` e a API em `http://localhost:3001`.

Copie os arquivos `.env.example` para `.env` em cada aplicação caso queira alterar portas ou URLs.

## Scripts

| Comando | Ação |
|---|---|
| `npm run start:backend` | Inicia a API |
| `npm run start:frontend` | Inicia o React em desenvolvimento |
| `npm test` | Executa os testes da API |
| `npm run build` | Gera o build de produção do frontend |

## API de participantes

Base URL: `http://localhost:3001/api`

| Método | Rota | Resultado de sucesso |
|---|---|---|
| `GET` | `/participants` | `200`, lista os participantes |
| `GET` | `/participants/:id` | `200`, retorna um participante |
| `POST` | `/participants` | `201`, cria um participante |
| `PUT` | `/participants/:id` | `200`, substitui os dados editáveis |
| `PATCH` | `/participants/:id` | `200`, atualiza o nome |
| `DELETE` | `/participants/:id` | `204`, exclui o participante |
| `POST` | `/participants/import` | `201`, importa nomes válidos e informa rejeitados |
| `GET` | `/health` | `200`, informa a saúde da API |

Corpo para criação e atualização:

```json
{ "name": "Sofia" }
```

Importação em lote:

```json
{ "names": ["Ana", "Bia", "Caio"] }
```

Resposta `201` (mesmo quando alguns nomes são rejeitados):

```json
{
  "created": [{ "id": 13, "name": "Bia" }],
  "rejected": [{ "index": 1, "name": "Ana", "code": "ALREADY_REGISTERED" }]
}
```

A interface aceita nomes separados por linha, vírgula ou ponto e vírgula e arquivos `.txt`/`.csv` (primeira coluna). A prévia informa nomes válidos e motivos de rejeição: duplicado na lista, já cadastrado, vazio ou com mais de 100 caracteres. A API grava todos os nomes aceitos em uma única operação.

Erros usam o formato:

```json
{
  "error": {
    "code": "DUPLICATE_NAME",
    "message": "Já existe um participante com esse nome."
  }
}
```

Status previstos: `400` para requisição inválida, `404` para recurso inexistente, `409` para nome duplicado, `422` para nome inválido e `500` para falha interna.

## Regras

- IDs são numéricos e incrementais.
- Nomes são obrigatórios, têm até 100 caracteres e não podem se repetir, ignorando caixa e espaços externos.
- O sorteio ocorre no navegador com `crypto.getRandomValues` e distribui cada participante uma única vez.
- A quantidade de grupos é calculada automaticamente respeitando o intervalo entre o mínimo e o máximo: o número de grupos parte de `ceil(participantes / máximo)` e precisa ser menor ou igual a `floor(participantes / mínimo)`.
- O sorteio só é permitido quando existe uma combinação possível de mínimo e máximo; participantes excedentes são distribuídos entre os grupos sem ultrapassar o máximo.
- Alterar participantes, o mínimo ou o máximo de pessoas limpa qualquer sorteio anterior.

## Revelação e compartilhamento

Depois do sorteio, o resultado pode ser revelado de uma vez ou um grupo por vez. O sorteio é calculado antes da animação visual; `Pular animação` apenas revela o resultado já calculado. A animação respeita `prefers-reduced-motion`. Quando o resultado está completo, é possível editar os grupos movendo participantes por seletores, respeitando os limites mínimo e máximo, compartilhar pelo WhatsApp ou copiar o texto formatado para a área de transferência.

> O JSON local é adequado para desenvolvimento e testes de baixa concorrência. A separação por repository permite trocar essa persistência por um banco de dados posteriormente.
