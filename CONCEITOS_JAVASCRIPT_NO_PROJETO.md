# Conceitos de JavaScript no UniDuniTê

Este documento relaciona conceitos de JavaScript e TypeScript apresentados na [apresentação de Fundamentos de JavaScript e TypeScript](https://claude.ai/artifact/XqCawVCv4UT7mddwC2a7qk) com implementações existentes no UniDuniTê. O frontend continua em JavaScript; o backend foi migrado para TypeScript.

As referências abaixo apontam para o código-fonte atual. Em cada caso, a justificativa explica por que o conceito foi usado no contexto da aplicação, sem confundir um tópico estudado nos slides com uma implementação que não existe no projeto.

## Visão geral

| Conceito dos slides | Onde aparece no projeto | Exemplo visível na aplicação | Por que é usado |
|---|---|---|
| Tipos, conversão e coerção | [frontend/src/App.js](frontend/src/App.js), [frontend/src/utils/participants.js](frontend/src/utils/participants.js), [backend/src/services/participants.service.ts](backend/src/services/participants.service.ts) | Campos de mínimo e máximo de pessoas por grupo; nome inválido ou longo na inclusão/importação. | Interpretar valores vindos de formulários e requisições, validar entradas e evitar comparações ambíguas. |
| Valores truthy/falsy e valores ausentes | [frontend/src/App.js](frontend/src/App.js), [frontend/src/services/participantsApi.js](frontend/src/services/participantsApi.js), [backend/src/app.ts](backend/src/app.ts) | Estado vazio da área de resultados antes do sorteio e mensagens de erro ou carregamento. | Tratar estados vazios e configurar valores opcionais de forma explícita. |
| `const`, `let` e escopo | Em todo o código, especialmente [frontend/src/App.js](frontend/src/App.js) e [backend/src/services/participants.service.ts](backend/src/services/participants.service.ts) | A lista original de participantes permanece no painel enquanto uma cópia embaralhada alimenta os cartões de grupos. | Manter os valores estáveis por padrão e limitar variáveis mutáveis ao trecho que precisa delas. |
| Funções, callbacks e funções de ordem superior | [frontend/src/App.js](frontend/src/App.js), [frontend/src/components/ParticipantPanel.js](frontend/src/components/ParticipantPanel.js), [backend/src/services/participants.service.ts](backend/src/services/participants.service.ts) | Os botões **Adicionar**, **Sortear**, **Limpar** e **Editar grupos** respondem a eventos e executam funções específicas. | Organizar regras em operações reutilizáveis e conectar eventos, transformações de dados e fluxos da API. |
| Escopo léxico e closures | Componentes React em [frontend/src/App.js](frontend/src/App.js) e [frontend/src/components/TeamsPanel.js](frontend/src/components/TeamsPanel.js) | Ao selecionar outro grupo para uma pessoa, o callback usa os índices e o estado de edição atuais. | Fazer os callbacks de interface acessarem o estado e as operações da renderização em que foram criados. |
| Objetos, arrays, iteração e métodos de coleção | [frontend/src/utils/participants.js](frontend/src/utils/participants.js), [frontend/src/utils/draw.js](frontend/src/utils/draw.js), [backend/src/services/participants.service.ts](backend/src/services/participants.service.ts) | Lista numerada de participantes, prévia de importação e cartões de cada grupo sorteado. | Normalizar, validar, transformar, filtrar e apresentar listas de participantes e grupos. |
| Cópia, referência e spread | [frontend/src/App.js](frontend/src/App.js), [frontend/src/components/TeamsPanel.js](frontend/src/components/TeamsPanel.js), [frontend/src/utils/draw.js](frontend/src/utils/draw.js) | A grade muda quando grupos são editados, mas a edição só é aplicada após **Salvar grupos**. | Evitar alterar acidentalmente os dados originais e atualizar o estado React por novas referências. |
| Assincronismo, Promises e `async`/`await` | [frontend/src/services/participantsApi.js](frontend/src/services/participantsApi.js), [frontend/src/App.js](frontend/src/App.js), [backend/src/controllers/participants.controller.ts](backend/src/controllers/participants.controller.ts) | Indicadores de carregamento, confirmação de inclusão/importação e atualização da lista após resposta da API. | Aguardar chamadas HTTP, leitura de arquivos e operações da aplicação sem perder a sequência lógica do fluxo. |
| Tratamento de erros | [frontend/src/services/participantsApi.js](frontend/src/services/participantsApi.js), [backend/src/services/participants.service.ts](backend/src/services/participants.service.ts), [backend/src/middlewares/error-handler.ts](backend/src/middlewares/error-handler.ts) | Mensagens de estado quando há duplicidade, entrada inválida ou falha ao carregar/salvar. | Comunicar falhas de forma controlada em vez de apresentar sucesso quando uma operação não foi concluída. |
| Módulos ESM e CommonJS | Frontend: `import`/`export`; backend: [backend/package.json](backend/package.json) mantém `commonjs`, enquanto os módulos TypeScript usam `import`/`export` e compilam para CommonJS conforme [backend/tsconfig.json](backend/tsconfig.json). | Os painéis de participantes e de grupos são componentes separados; a API separa rotas, serviços e persistência. | Separar responsabilidades por arquivo e manter o formato de módulos consumido pelo runtime Node. |

## Conceitos TypeScript solicitados para o backend

| Conceito | Onde está aplicado | Benefício concreto |
|---|---|---|
| Parâmetros e retornos tipados | Métodos de `ParticipantsService`, controladores Express e métodos do repositório, por exemplo em [backend/src/services/participants.service.ts](backend/src/services/participants.service.ts) | Detecta em tempo de desenvolvimento quando uma camada recebe ou devolve um valor incompatível, antes de a requisição falhar em produção. |
| `interface` | `Participant` e `ParticipantsRepositoryContract` em [backend/src/types/participants.ts](backend/src/types/participants.ts) | Deixa explícito o formato dos dados e permite verificar mocks e implementações do contrato do repositório. |
| `Promise<T>` e `async`/`await` | Serviços e controladores em [backend/src/services/participants.service.ts](backend/src/services/participants.service.ts) e [backend/src/controllers/participants.controller.ts](backend/src/controllers/participants.controller.ts) | Explicita o tipo que cada operação assíncrona resolve e mantém o fluxo de resposta da API legível. O acesso ao SQLite continua síncrono no repositório. |
| Validação em runtime com Zod | Schemas em [backend/src/schemas/participants.schema.ts](backend/src/schemas/participants.schema.ts), usados pelo serviço | Verifica JSON e conteúdo recebido pela API em execução; os tipos TypeScript não substituem validação de dados externos. Os erros continuam usando status e códigos atuais. |

## Relação detalhada com os slides

### 1. Tipos, coerção e validação

Os slides introduzem tipos primitivos, coerção, comparação e o uso de valores em condições. No projeto, esse conhecimento aparece principalmente nas validações das entradas:

- Em `drawTeams`, de [frontend/src/App.js](frontend/src/App.js), os valores dos campos numéricos chegam como texto e são convertidos com `Number(...)`. Em seguida, `Number.isInteger` e limites explícitos verificam se a quantidade informada pode ser usada no sorteio.
- Em `createImportPreview`, de [frontend/src/utils/participants.js](frontend/src/utils/participants.js), nomes são tratados como strings: espaços são removidos, sequências de espaços são normalizadas e a comparação não diferencia maiúsculas de minúsculas com `toLocaleLowerCase("pt-BR")`.
- Em `validateBody`, de [backend/src/services/participants.service.ts](backend/src/services/participants.service.ts), o schema Zod de nome confirma em runtime que o valor é texto, remove espaços externos e valida o tamanho.
- O código usa comparações estritas (`===` e `!==`) para estados, códigos de erro e valores. Isso reduz resultados inesperados causados por conversões implícitas.

Essas conversões e verificações são necessárias porque a interface, os arquivos importados e as requisições HTTP podem fornecer valores em formatos diferentes. O backend valida novamente os dados para que as regras não dependam somente do navegador.

**Na aplicação:** os campos numéricos de mínimo e máximo do painel **Grupos sorteados** recebem texto do formulário. A conversão permite calcular a quantidade válida de grupos; se os limites não forem inteiros ou não puderem acomodar a turma, o sorteio é bloqueado e uma mensagem explica o problema. Na importação, nomes vazios, duplicados e acima de 100 caracteres aparecem na prévia como itens rejeitados.

### 2. Valores truthy/falsy e valores opcionais

As condições do código usam truthiness em verificações de estado, mas validam os dados importantes antes de processá-los. Por exemplo, `if (!normalized)` em `createImportPreview`, de [frontend/src/utils/participants.js](frontend/src/utils/participants.js), classifica nomes vazios depois da normalização. Em `drawTeams`, de [frontend/src/App.js](frontend/src/App.js), um sorteio sem participantes é interrompido com uma mensagem para a pessoa usuária.

O projeto também diferencia ausência de valor de outros valores falsy:

- `??` em [backend/src/app.ts](backend/src/app.ts) aplica um caminho ou configuração padrão apenas quando a opção é `null` ou `undefined`.
- `||` em [frontend/src/services/participantsApi.js](frontend/src/services/participantsApi.js) escolhe a URL padrão da API quando a variável de ambiente não está definida.
- `?.` em [frontend/src/services/participantsApi.js](frontend/src/services/participantsApi.js) e [frontend/src/App.js](frontend/src/App.js) acessa detalhes de erro que podem não existir sem provocar outra exceção.

Esses operadores tornam as alternativas para valores ausentes concisas, mas a validação continua explícita onde um dado inválido precisa ser rejeitado.

**Na aplicação:** antes do primeiro sorteio, a área de resultados mostra a mensagem “Os grupos aparecerão aqui quando você fizer o sorteio.” Se a API falhar, a interface apresenta o motivo no espaço de status. As opções `??`, `||` e `?.` suportam configuração e erros que podem estar ausentes, sem impedir a renderização dos painéis.

### 3. `const`, `let` e escopo de bloco

O código prefere `const` quando uma variável não precisa ser reatribuída, por exemplo, nos dados calculados durante o sorteio e nas dependências montadas para o servidor. `let` aparece em pontos de mudança controlada, como o índice do laço de Fisher–Yates em `shuffle`, de [frontend/src/App.js](frontend/src/App.js), e o código de rejeição que começa sem valor em `createImportPreview`, de [frontend/src/utils/participants.js](frontend/src/utils/participants.js).

Essa escolha ajuda a deixar visível quais nomes podem receber uma nova atribuição e quais representam uma referência estável durante aquela operação. O projeto não usa `var`; assim, evita o escopo de função e o comportamento em laços que os slides apresentam como fonte possível de bugs.

**Na aplicação:** ao clicar em **Sortear**, `shuffle` trabalha sobre uma cópia da lista. Por isso a lista numerada do painel **Participantes** mantém sua ordem, enquanto os cartões da grade **Grupos sorteados** mostram a combinação embaralhada.

### 4. Funções, callbacks e closures

Funções organizam as operações do sorteio e as regras do domínio. Exemplos incluem `shuffle` e `drawTeams` em [frontend/src/App.js](frontend/src/App.js), `createImportPreview` em [frontend/src/utils/participants.js](frontend/src/utils/participants.js) e os métodos de `ParticipantsService` em [backend/src/services/participants.service.ts](backend/src/services/participants.service.ts).

O projeto usa funções como valores e callbacks em situações práticas:

- Componentes passam funções para `onClick`, `onChange` e `onSubmit` para responder a ações da interface, como em [frontend/src/components/ParticipantPanel.js](frontend/src/components/ParticipantPanel.js).
- `map`, `filter`, `forEach` e `some` recebem callbacks para transformar, filtrar ou verificar coleções.
- `mutate`, em [frontend/src/App.js](frontend/src/App.js), recebe uma operação como função e centraliza o estado de atividade, a atualização dos participantes e as mensagens de resultado.

Os callbacks definidos dentro dos componentes mantêm acesso ao escopo léxico da renderização — por exemplo, às funções de estado e às propriedades recebidas. Esse é o uso de closure relevante para a interface: permite que cada ação execute a regra correspondente sem armazenar esse contexto em variáveis globais.

As declarações de função também aparecem em funções nomeadas, mas a aplicação não depende de chamar funções antes de sua declaração como requisito de funcionamento. Hoisting é um comportamento da linguagem explicado nos slides, não uma técnica necessária para a lógica do UniDuniTê.

**Na aplicação:** os botões **Adicionar**, **Sortear**, **Próximo** e **Editar grupos** acionam callbacks vinculados às funções do componente. Os callbacks têm acesso ao estado da operação atual, por exemplo ao grupo de origem/destino durante a edição, sem variáveis globais.

### 5. Objetos, arrays e métodos de coleção

Participantes são representados por objetos, e listas de participantes e grupos por arrays. Os métodos de coleção expressam diretamente as operações necessárias:

- `map` constrói listas para a interface e normaliza nomes existentes, por exemplo, em [frontend/src/components/ParticipantPanel.js](frontend/src/components/ParticipantPanel.js) e [backend/src/services/participants.service.ts](backend/src/services/participants.service.ts).
- `filter` remove entradas vazias da lista normalizada e identifica campos não permitidos para rejeitá-los, em [frontend/src/utils/participants.js](frontend/src/utils/participants.js) e [backend/src/services/participants.service.ts](backend/src/services/participants.service.ts).
- `forEach` processa os nomes importados e distribui participantes, em [backend/src/services/participants.service.ts](backend/src/services/participants.service.ts) e [frontend/src/App.js](frontend/src/App.js).
- `some` verifica se há nome duplicado ou se algum grupo viola os limites, em [backend/src/services/participants.service.ts](backend/src/services/participants.service.ts) e [frontend/src/components/TeamsPanel.js](frontend/src/components/TeamsPanel.js).
- `slice`, `findIndex` e `Set` apoiam a revelação progressiva, a edição de grupos e a detecção de duplicatas, em [frontend/src/utils/draw.js](frontend/src/utils/draw.js), [frontend/src/components/TeamsPanel.js](frontend/src/components/TeamsPanel.js) e [frontend/src/utils/participants.js](frontend/src/utils/participants.js).

Essas operações tornam a validação e a transformação das listas mais legíveis e ajudam a preservar as regras do sorteio: cada participante é distribuído uma vez, e as listas importadas podem separar nomes válidos dos rejeitados.

**Na aplicação:** a lista numerada é construída a partir dos participantes; após o sorteio, cada array de membros vira um cartão “Grupo 01”, “Grupo 02” etc., com os nomes em etiquetas. A prévia de importação também mostra contagens de nomes “para adicionar” e “ignorados”, além dos motivos para rejeição.

### 6. Cópia, referência, desestruturação e spread

O spread (`...`) é usado para criar novas referências em vez de alterar estruturas já existentes:

- `shuffle`, em [frontend/src/App.js](frontend/src/App.js), começa com `[...values]`, embaralhando uma cópia e preservando a lista original.
- `moveParticipant`, em [frontend/src/components/TeamsPanel.js](frontend/src/components/TeamsPanel.js), cria cópias dos grupos antes de remover e inserir uma pessoa.
- `advanceReveal`, em [frontend/src/utils/draw.js](frontend/src/utils/draw.js), devolve um novo objeto de estado com `{ ...state, ... }`.
- A API combina cabeçalhos com `{ ...options.headers }` em [frontend/src/services/participantsApi.js](frontend/src/services/participantsApi.js).

Essa estratégia é importante no frontend porque o React detecta atualizações por novas referências e porque mutações acidentais poderiam alterar o resultado anterior. A desestruturação de parâmetros, como `({ name })` em callbacks, também é usada para obter somente a propriedade necessária e deixar o propósito da operação claro.

**Na aplicação:** ao entrar em **Editar grupos**, os grupos são copiados para um rascunho. Mover uma pessoa atualiza esse rascunho e a grade; **Salvar grupos** aplica a alteração, enquanto **Cancelar** descarta a edição. Os limites mínimo/máximo são checados antes de salvar.

### 7. Assincronismo e Promises

O frontend precisa aguardar o servidor e a leitura de arquivos:

- `request`, em [frontend/src/services/participantsApi.js](frontend/src/services/participantsApi.js), usa `fetch` e `await` para obter e interpretar a resposta HTTP.
- `loadParticipants`, `mutate` e `importParticipants`, em [frontend/src/App.js](frontend/src/App.js), aguardam operações da API antes de atualizar a interface.
- `parseParticipantFile`, em [frontend/src/utils/participants.js](frontend/src/utils/participants.js), aguarda o conteúdo do arquivo com a Promise retornada por `file.text()`.

No backend, os controladores em [backend/src/controllers/participants.controller.ts](backend/src/controllers/participants.controller.ts) são `async`, retornam `Promise<void>` e aguardam os serviços antes de enviar as respostas HTTP. Assim, os erros de uma operação assíncrona podem seguir pelo fluxo de tratamento de erros da API.

O projeto usa `async`/`await` para tornar a ordem dessas operações explícita, sem bloquear a interface enquanto aguarda uma resposta. O evento de tempo da animação do resultado usa `setTimeout` em `revealResult`, de [frontend/src/App.js](frontend/src/App.js); o sorteio já está calculado antes da animação, que apenas controla quando o resultado se torna visível.

**Na aplicação:** ao abrir a página, a lista de participantes é carregada da API. Durante uma chamada, os controles ficam desabilitados e o estado `busy` impede submissões repetidas. Na importação por arquivo, a interface espera a leitura do conteúdo antes de preencher a prévia; depois da confirmação, atualiza a lista com o resultado do servidor.

### 8. Tratamento de erros

O projeto diferencia erros esperados de falhas inesperadas:

- `request`, em [frontend/src/services/participantsApi.js](frontend/src/services/participantsApi.js), transforma respostas HTTP malsucedidas em erros que podem ser apresentados pela interface.
- `loadParticipants`, `mutate` e `importParticipants`, em [frontend/src/App.js](frontend/src/App.js), capturam falhas e atualizam a mensagem de estado. O bloco `finally` libera o estado `busy` mesmo se a operação falhar.
- `ParticipantsService`, em [backend/src/services/participants.service.ts](backend/src/services/participants.service.ts), lança `AppError` para violações das regras, enquanto `save` converte a violação única do SQLite em um erro de duplicidade e relança erros que não reconhece.
- `errorHandler`, em [backend/src/middlewares/error-handler.ts](backend/src/middlewares/error-handler.ts), converte erros conhecidos em respostas estruturadas e registra falhas inesperadas.

Esse tratamento evita deixar a interface indefinidamente ocupada ou retornar uma resposta de sucesso quando o servidor não conseguiu concluir uma operação.

**Na aplicação:** se o nome já estiver cadastrado, o painel exibe a mensagem de duplicidade em vez de limpar o campo como se tivesse incluído o participante. Se os grupos editados violarem o mínimo ou máximo, a grade continua em modo de edição e apresenta o erro junto aos controles.

### 9. Módulos: ESM e CommonJS

Os dois lados do projeto usam módulos JavaScript, mas com formatos diferentes:

- O frontend usa sintaxe ESM: `import` e `export`, como em [frontend/src/index.js](frontend/src/index.js), [frontend/src/App.js](frontend/src/App.js) e [frontend/src/utils/draw.js](frontend/src/utils/draw.js).
- O backend declara `"type": "commonjs"` em [backend/package.json](backend/package.json). Os arquivos TypeScript usam `import`/`export` e o compilador em [backend/tsconfig.json](backend/tsconfig.json) os transforma em CommonJS para o Node, como no servidor e na aplicação.

Essa separação permite que cada parte carregue componentes e funções de outros arquivos sem concentrar a aplicação em um único script. O formato do backend segue a configuração do pacote Node; o frontend segue o formato processado pela ferramenta React.

**Na aplicação:** a tela combina componentes especializados — painel de participantes, painel de grupos e seletor de tema — importados pelo componente principal. Do lado do servidor, a mesma separação de módulos sustenta a passagem de uma requisição pelas rotas, controladores, serviço e repositório, sem misturar regras de negócio com a renderização.

## Conceitos dos slides sem uso direto equivalente

Nem todo tópico da apresentação precisa aparecer como uma construção explícita na aplicação:

- **`var`:** não é usado; o código usa `const` e `let`.
- **Hoisting como estratégia:** não há fluxo que dependa de chamar uma função antes de sua declaração.
- **`this`, `call`, `apply` e `bind`:** não são usados como mecanismo central de comportamento. O frontend é baseado em componentes funcionais e callbacks; no backend, `ParticipantsService` usa `this.repository` nos métodos da instância, sem precisar de `call`/`apply`/`bind`.
- **`reduce`:** não é necessário nas regras atuais. O projeto usa outros métodos de array mais diretos para as transformações existentes.
- **Concorrência com `Promise.all`:** não é usada no fluxo normal de produto. Os testes da API usam `Promise.all` em [backend/tests/participants.test.ts](backend/tests/participants.test.ts) para verificar que duas criações concorrentes não registram o mesmo nome.

Esses tópicos continuam úteis para compreender JavaScript, mas não devem ser descritos como soluções adotadas no código quando não participam diretamente do funcionamento da aplicação.

## Evidências de testes

Os testes exercitam alguns dos usos de JavaScript descritos acima:

- [frontend/src/utils/participants.test.js](frontend/src/utils/participants.test.js) verifica normalização e separação de nomes válidos e rejeitados.
- [frontend/src/utils/draw.test.js](frontend/src/utils/draw.test.js) verifica a revelação de grupos e a formatação do resultado.
- [backend/tests/participants.test.ts](backend/tests/participants.test.ts) verifica operações assíncronas da API, importação, validação e concorrência na criação de nomes.

Os testes não são uma lista exaustiva dos conceitos da linguagem; servem como evidência de que comportamentos importantes implementados com esses conceitos são verificados.
