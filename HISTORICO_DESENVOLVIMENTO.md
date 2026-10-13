# Histórico de desenvolvimento — UniDuniTê v2

Este documento registra a evolução realizada no projeto **UniDuniTê**, desde a versão estática original até a aplicação full stack atual.

## 1. Versão original

O projeto começou como um sorteador de grupos feito com HTML, CSS e JavaScript puro.

### Funcionalidades originais

- Lista fixa com 12 participantes.
- Sorteio aleatório usando o algoritmo Fisher–Yates.
- Uso de `crypto.getRandomValues` para gerar índices aleatórios.
- Distribuição equilibrada dos participantes entre os grupos.
- Definição manual da quantidade de grupos.
- Botão para limpar o resultado.
- Tema claro e escuro.
- Layout responsivo e recursos básicos de acessibilidade.

Os arquivos originais eram:

- `index.html`: estrutura da página.
- `styles.css`: estilos e responsividade.
- `script.js`: participantes, sorteio e interação.

Posteriormente, esses arquivos foram substituídos pela versão React.

## 2. Objetivo da versão 2

A versão 2 passou a se chamar **UniDuniTê** e foi transformada em uma aplicação full stack com:

- frontend em React;
- backend em Node.js e Express;
- persistência local em JSON;
- API REST para participantes;
- testes automatizados;
- gerenciamento de participantes pela interface;
- compartilhamento dos resultados.

## 3. Estrutura atual do projeto

```text
UniDuniTe/
├── backend/
│   ├── db/
│   │   └── participants.json
│   ├── src/
│   │   ├── errors/
│   │   │   └── app-error.js
│   │   ├── middlewares/
│   │   │   └── error-handler.js
│   │   ├── repositories/
│   │   │   └── participants.repository.js
│   │   ├── routes/
│   │   │   └── participants.routes.js
│   │   ├── services/
│   │   │   └── participants.service.js
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   │   └── participants.test.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ImportParticipants.js
│   │   │   ├── ParticipantPanel.js
│   │   │   ├── TeamsPanel.js
│   │   │   └── ThemeSwitch.js
│   │   ├── services/
│   │   │   └── participantsApi.js
│   │   ├── utils/
│   │   │   ├── draw.js
│   │   │   ├── draw.test.js
│   │   │   ├── participants.js
│   │   │   └── participants.test.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   └── package.json
├── README.md
├── package.json
└── .gitignore
```

## 4. Arquitetura do backend

A arquitetura foi mantida no fluxo:

```text
router → service → repository
```

### Routes e respostas HTTP

O arquivo `backend/src/routes/participants.routes.js` declara os caminhos da API, chama os services e retorna status e JSON das respostas. A camada separada de controllers foi removida por apenas encaminhar essas chamadas.

### Services

O arquivo `backend/src/services/participants.service.js` concentra:

- validação de IDs;
- validação de nomes;
- normalização de espaços;
- bloqueio de nomes duplicados;
- validação da importação em lote;
- identificação dos motivos de rejeição;
- aplicação das regras de negócio.

### Repositories

O arquivo `backend/src/repositories/participants.repository.js` é o único responsável pelo acesso ao arquivo JSON.

A persistência inclui:

- leitura dos participantes;
- criação individual;
- importação em lote;
- atualização;
- exclusão;
- geração de IDs incrementais;
- fila de escrita para evitar operações concorrentes;
- escrita por arquivo temporário e substituição atômica.

## 5. Persistência local

Os dados são armazenados em:

```text
backend/db/participants.json
```

O arquivo contém objetos no formato:

```json
{
  "id": 1,
  "name": "Dude"
}
```

As regras mantidas são:

- IDs numéricos e incrementais.
- O nome é obrigatório.
- O nome tem no máximo 100 caracteres.
- Nomes duplicados são bloqueados ignorando maiúsculas/minúsculas e espaços externos.
- As alterações permanecem após reiniciar o backend.

Durante o desenvolvimento, também foi corrigido o encoding do arquivo JSON. O arquivo deve permanecer em UTF-8 sem BOM para preservar corretamente nomes acentuados como `Márcio`, `Vinícius`, `Luís` e `Caíque`.

## 6. API REST

A API utiliza a base:

```text
http://localhost:3001/api
```

### Rotas disponíveis

| Método | Rota | Descrição | Sucesso |
|---|---|---|---|
| `GET` | `/health` | Verifica a saúde da API | `200` |
| `GET` | `/participants` | Lista participantes | `200` |
| `GET` | `/participants/:id` | Busca um participante | `200` |
| `POST` | `/participants` | Cria um participante | `201` |
| `PUT` | `/participants/:id` | Substitui o participante | `200` |
| `PATCH` | `/participants/:id` | Atualiza o nome | `200` |
| `DELETE` | `/participants/:id` | Exclui um participante | `204` |
| `POST` | `/participants/import` | Importa vários participantes | `201` |

### Criar participante

```http
POST http://localhost:3001/api/participants
Content-Type: application/json
```

```json
{
  "name": "João"
}
```

### Atualizar participante

```http
PATCH http://localhost:3001/api/participants/1
Content-Type: application/json
```

```json
{
  "name": "Nome atualizado"
}
```

### Importar participantes

```http
POST http://localhost:3001/api/participants/import
Content-Type: application/json
```

```json
{
  "names": ["Ana", "Bia", "Caio"]
}
```

Resposta de sucesso:

```json
{
  "created": [
    {
      "id": 25,
      "name": "Bia"
    }
  ],
  "rejected": [
    {
      "index": 0,
      "name": "Ana",
      "code": "ALREADY_REGISTERED"
    }
  ]
}
```

A importação realiza uma única escrita no arquivo para todos os nomes válidos.

### Formato dos erros

```json
{
  "error": {
    "code": "DUPLICATE_NAME",
    "message": "Já existe um participante com esse nome."
  }
}
```

Status utilizados:

- `400 Bad Request`: corpo inválido, JSON malformado, ID inválido ou campo desconhecido.
- `404 Not Found`: rota ou participante inexistente.
- `409 Conflict`: nome duplicado.
- `422 Unprocessable Entity`: nome vazio, inválido, muito longo ou importação sem nomes válidos.
- `500 Internal Server Error`: falha inesperada de aplicação ou persistência.

## 7. Frontend React

A interface foi migrada para React 19 com Create React App.

### Componentes

#### `ParticipantPanel`

Responsável por:

- listar participantes;
- adicionar participante;
- editar participante;
- excluir participante;
- abrir o importador de listas.

#### `ImportParticipants`

Responsável por:

- abrir e fechar a área de importação;
- receber texto colado;
- selecionar arquivos `.txt` e `.csv`;
- mostrar pré-visualização;
- indicar nomes válidos e rejeitados;
- confirmar a importação.

#### `TeamsPanel`

Responsável por:

- configurar mínimo de pessoas por grupo;
- configurar máximo de pessoas por grupo;
- mostrar a quantidade calculada de grupos;
- iniciar o sorteio;
- revelar o resultado;
- editar grupos;
- compartilhar ou copiar o resultado.

#### `ThemeSwitch`

Controla o tema claro/escuro e persiste a preferência no `localStorage`.

## 8. Importação de participantes pela interface

A interface aceita:

- um nome por linha;
- nomes separados por vírgula;
- nomes separados por ponto e vírgula;
- arquivos `.txt`;
- arquivos `.csv` usando a primeira coluna.

Em CSV, um cabeçalho óbvio como `nome` é ignorado.

Antes da confirmação, os nomes são normalizados:

- espaços externos são removidos;
- múltiplos espaços internos são reduzidos;
- linhas vazias são removidas.

A pré-visualização informa:

- nomes que serão adicionados;
- nomes já cadastrados;
- duplicados dentro da própria lista;
- nomes vazios;
- nomes com mais de 100 caracteres.

Após uma importação bem-sucedida, o resultado do sorteio anterior é limpo.

## 9. Sorteio e cálculo dos grupos

O sorteio é feito no navegador usando `crypto.getRandomValues` e Fisher–Yates.

Cada participante aparece uma única vez no resultado.

A quantidade de grupos considera os limites informados:

```text
grupos mínimos necessários = ceil(participantes / máximo por grupo)
grupos máximos permitidos = floor(participantes / mínimo por grupo)
```

A combinação só é aceita quando os grupos mínimos necessários não ultrapassam os grupos máximos permitidos.

Os participantes são distribuídos de forma equilibrada entre os grupos, mantendo a diferença máxima de uma pessoa quando possível e respeitando os limites validados.

Alterar qualquer participante ou alterar os limites mínimo/máximo limpa o resultado anterior.

## 10. Revelação estilo caça-níquel

O resultado é calculado antes da animação. A animação não refaz nem altera o sorteio.

Recursos implementados:

- revelação de todos os grupos de uma vez;
- revelação de um grupo por vez;
- indicador de progresso no modo um por vez;
- botão `Próximo`;
- botão `Pular animação`;
- botão `Sortear novamente`;
- respeito à preferência `prefers-reduced-motion` por meio das regras de animação CSS;
- resultado em texto real no DOM;
- região com `aria-live` para acessibilidade.

A unidade usada no modo um por vez é o **grupo**.

## 11. Edição dos grupos

Depois que o resultado completo é revelado, o botão `Editar grupos` fica disponível.

A edição funciona com um rascunho local:

1. o usuário entra no modo de edição;
2. escolhe para qual grupo cada participante deve ser movido;
3. o resultado original permanece intacto até salvar;
4. o usuário pode cancelar;
5. ao salvar, os grupos são validados;
6. o resultado atualizado fica disponível para compartilhar.

Cada grupo deve respeitar:

- o mínimo configurado;
- o máximo configurado.

Se algum grupo estiver fora dos limites, o salvamento é bloqueado e uma mensagem é exibida.

## 12. Compartilhamento no WhatsApp

O texto é montado em:

```text
frontend/src/utils/draw.js
```

A função `formatWhatsAppResult` gera um texto como:

```text
🎲 Sorteio de grupos

Grupo 1: Ana, Bruno, Carla
Grupo 2: Diego, Elisa, Fábio
```

O link é aberto pela função `shareWhatsApp` em `App.js`:

```text
https://wa.me/?text=<texto codificado>
```

Também foi implementado o botão `Copiar resultado`, com uso de `navigator.clipboard` e fallback para navegadores sem suporte.

## 13. Testes automatizados

### Backend

Os testes estão em:

```text
backend/tests/participants.test.js
```

São cobertos:

- listagem e consulta;
- criação;
- atualização com `PUT`;
- atualização com `PATCH`;
- exclusão;
- IDs inválidos;
- participantes inexistentes;
- nomes vazios;
- nomes inválidos;
- nomes duplicados;
- campos desconhecidos;
- JSON malformado;
- rota inexistente;
- falha de persistência;
- importação total/parcial;
- duplicados no banco;
- duplicados dentro da importação;
- nomes longos;
- corpo de importação inválido.

### Frontend

Os testes puros estão em:

```text
frontend/src/utils/participants.test.js
frontend/src/utils/draw.test.js
```

São cobertos:

- parser de nomes por linhas, vírgulas e ponto e vírgula;
- pré-visualização de importação;
- rejeição de duplicados;
- lógica de revelação por grupo;
- geração do texto para WhatsApp.

## 14. Comandos para executar

Na raiz do projeto:

```powershell
npm run install:all
```

Iniciar o backend:

```powershell
npm run start:backend
```

Iniciar o frontend em outro terminal:

```powershell
npm run start:frontend
```

Executar testes da API:

```powershell
npm test
```

Executar testes do frontend:

```powershell
npm test --prefix frontend -- --watchAll=false --runInBand
```

Gerar o build de produção:

```powershell
npm run build
```

## 15. Teste manual pelo Thunder Client

Use a base:

```text
http://localhost:3001/api
```

Para requisições com body, use:

```text
Content-Type: application/json
```

Exemplo de importação:

```http
POST http://localhost:3001/api/participants/import
```

```json
{
  "names": ["Bruno", "Carla", "Diego"]
}
```

O backend precisa estar executando o código atual. Se uma versão antiga estiver ocupando a porta `3001`, a nova rota pode retornar `ROUTE_NOT_FOUND`; nesse caso, encerre o processo antigo e execute novamente:

```powershell
npm run start:backend
```

## 16. Problemas corrigidos durante o desenvolvimento

### Encoding do JSON

O arquivo de participantes chegou a ser salvo com BOM e nomes acentuados corrompidos. O arquivo foi regravado em UTF-8 sem BOM e os nomes foram restaurados.

### Processo antigo na porta 3001

Em alguns testes, um processo antigo do Node continuava respondendo na porta `3001`, sem conhecer a rota de importação. O processo foi encerrado e o backend atual foi reiniciado.

### Layout do viewport

O layout foi ajustado para:

- manter os controles de sorteio acessíveis;
- adaptar os painéis à altura disponível;
- usar rolagem interna em listas extensas;
- preservar o fluxo natural em telas pequenas.

### Grade dos grupos

A grade de resultados foi adaptada para:

- usar a largura disponível do painel;
- evitar overflow horizontal;
- quebrar cards conforme o espaço disponível;
- tratar nomes longos;
- manter responsividade em mobile.

## 17. Itens opcionais não implementados

- Efeito sonoro do caça-níquel.
- Autenticação de usuários.
- Histórico persistente de sorteios.
- Banco de dados real SQL ou NoSQL.
- Deploy e infraestrutura de produção.
- Testes end-to-end completos no navegador.

## 18. Estado final

A aplicação atual possui:

- frontend React;
- backend Express;
- API REST completa;
- persistência local em JSON;
- CRUD de participantes;
- importação em lote;
- validações centralizadas;
- sorteio com aleatoriedade segura;
- mínimo e máximo de pessoas por grupo;
- revelação animada;
- revelação por grupo;
- edição manual dos grupos;
- compartilhamento no WhatsApp;
- cópia do resultado;
- temas claro e escuro;
- layout responsivo;
- testes automatizados;
- documentação de execução e API.
