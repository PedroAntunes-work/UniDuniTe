# Como o projeto foi feito — Sorteio de times

> **Evolução v2:** o projeto agora se chama **UniDuniTê** e foi migrado para uma arquitetura full stack. A interface está em `frontend/` com React; a API Express está em `backend/`, organizada em routes, controllers, services e repositories; os participantes são persistidos em `backend/db/participants.json`. Consulte o `README.md` para instalação, execução e contrato atual da API. O conteúdo abaixo preserva o histórico da versão estática original.

## 1. Visão geral

O projeto é uma página web simples para dividir uma turma em uma quantidade escolhida de grupos. Foi desenvolvido com HTML5, CSS3 e JavaScript puro, sem framework, backend ou dependências para instalar.

O objetivo é mostrar os participantes numerados, sortear grupos sem regras de sexo ou ordenação alfabética e permitir escolher a quantidade de grupos. Por padrão, o sistema calcula a quantidade de grupos para acomodar 2 pessoas em cada grupo e também permite limpar o resultado para fazer outro sorteio.

## 2. Tecnologias e estrutura

Os arquivos foram separados por responsabilidade:


| Arquivo      | Responsabilidade                                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `index.html` | Estrutura semântica da página, lista de participantes, controle da quantidade de grupos, área de resultado, botões e mensagens acessíveis. |
| `styles.css` | Cores, tipografia, cartões, disposição em colunas, estados dos botões, animações e adaptação para telas menores.                           |
| `script.js`  | Nomes da turma, embaralhamento, formação e exibição dos grupos, limpeza do resultado.                                                      |


Para executar, basta abrir `index.html` em um navegador moderno. Não é necessário iniciar servidor ou instalar pacotes.

## 3. Como a implementação funciona



### Lista de participantes

Os 12 nomes são mantidos em um array no `script.js`, na ordem informada. A função `renderParticipants()` cria um item de lista para cada pessoa e atualiza o contador. Os números são apresentados com estilos CSS, sem ordenar ou modificar os nomes.

### Sorteio aleatório

Ao escolher a quantidade de grupos e clicar em **Sortear grupos**:

1. O programa verifica se o navegador disponibiliza `crypto.getRandomValues`.
2. A função `shuffle()` faz uma cópia do array original, sem alterar a lista exibida.
3. A cópia é embaralhada pelo algoritmo Fisher–Yates.
4. Para cada posição, `secureRandomIndex()` escolhe um índice aleatório. A amostragem por rejeição evita o viés de módulo ao converter os valores aleatórios em índices.
5. A lista embaralhada é distribuída entre a quantidade de grupos informada. A quantidade deve ser um número inteiro entre 1 e o total de participantes; os grupos ficam equilibrados, com diferença máxima de uma pessoa.
6. `renderTeams()` cria os cartões do resultado e atualiza a região anunciada por tecnologia assistiva. A grade CSS ajusta automaticamente o número de colunas à quantidade de grupos e à largura disponível.

A quantidade inicial de grupos é calculada a partir do tamanho padrão de 2 pessoas por grupo, arredondando para cima quando a turma não puder ser dividida igualmente.

Assim, cada pessoa aparece uma única vez no resultado de um sorteio. O sorteio não usa critérios de sexo nem ordenação alfabética. Um novo clique pode produzir uma nova combinação.

Se a fonte segura de aleatoriedade não estiver disponível, a interface informa que não foi possível realizar o sorteio, em vez de apresentar um resultado como concluído.

### Limpeza

Ao clicar em **Limpar**, `clearTeams()` substitui os cartões pela mensagem inicial, mantendo intacta a lista de participantes. O botão de sorteio pode ser usado novamente.

### Interface e acessibilidade

- A página usa regiões, títulos e uma lista ordenada para estruturar o conteúdo.
- A região do resultado usa `aria-live="polite"` e as mensagens de estado usam `role="status"`.
- Os botões são controles HTML nativos e mostram um indicador de foco ao navegar pelo teclado.
- O layout apresenta as listas lado a lado em telas maiores e empilhadas em telas menores.
- O CSS respeita a preferência do sistema por movimento reduzido.
- As fontes são do sistema, sem depender de um serviço externo.



## 4. Decisões de implementação

- **HTML, CSS e JavaScript sem bibliotecas:** mantém a aplicação leve e fácil de abrir localmente.
- **Lista única como fonte dos participantes:** evita manter nomes duplicados em várias partes da interface.
- **Embaralhar uma cópia:** preserva a ordem original da lista à esquerda.
- **Fisher–Yates com aleatoriedade segura do navegador:** fornece uma distribuição uniforme de permutações, em vez de ordenar nomes por uma chave aleatória ou usar um embaralhamento enviesado.
- **Resultado construído com elementos DOM e** `textContent`**:** exibe os dados como texto sem interpretar nomes como marcação HTML.
- **Limpar apenas o resultado:** atende à possibilidade de realizar um novo sorteio sem perder a turma cadastrada no código.



## 5. Validação realizada

A página foi aberta no navegador e foram verificados estes fluxos:

1. Carregamento da página e apresentação dos 12 nomes.
2. Sorteio em 5 grupos (tamanhos 3, 3, 2, 2 e 2), em 12 grupos (uma pessoa por grupo) e em 1 grupo (as 12 pessoas juntas).
3. Rejeição da quantidade inválida de 13 grupos e remoção do resultado anterior.
4. Clique em **Limpar** e retorno da área de resultado ao estado inicial.

Para conferir manualmente um resultado, confirme que o número de cartões corresponde à quantidade escolhida, que os 12 nomes aparecem uma única vez e que a diferença de tamanho entre grupos é no máximo uma pessoa.

## 6. Prompts usados durante a criação



### Prompt inicial — solicitação da aplicação

> Preciso criar um programa que faça sorteios para atribuir duplas/times para um treinamento interno da empresa.
>
> Temos 12 pessoas, essas 12 pessoas vão ser divididas em 6 duplas/times.
> Lista das pessoas:
> Dude;
> Sofia;
> Márcio;
> Pedro;
> Wilson;
> Ana;
> Vinícius;
> Kauan;
> Luís;
> Ellon;
> Caíque;
> Samuel.
>
> Vamos usar de stack: HTML5, CSS3 e JavaScript.
>
> Regras:
> As duplas devem ser sorteadas da forma mais aleatória possível;
> Sem distinção de sexo;
> Sem ordenar alfabeticamente.
>
> A tela deve ter:
> Uma lista numerada de todas as pessoas da turma(à equerda da tela);
> Uma lista vazia ao lado direito com espaços entre as duplas, onde após o clique do botão, seja atualizada com os nomes sorteados;
> Um botão escrito "Sortear times", com a função de atribuir duplas aos times;
> Um botão "Limpar", para limpar a tela e possibilitar um possível novo sorteio



### Prompt de documentação do plano

> Preciso agora que crie um plano de execução do projeto no formato .md.

Esse pedido originou o arquivo `plano_execucao.md`, que registra o objetivo, escopo, etapas, critérios de aceite e validação.

### Prompt desta documentação

> gere um md de como o projeto foi feito. incluindo os prompts

Esse pedido originou este documento, com explicações sobre os arquivos, o algoritmo, as decisões de implementação e os prompts da conversa.

## 7. Limitações e possíveis extensões

A relação de participantes está escrita diretamente no `script.js`; para mudar a turma é preciso editar esse array. O resultado não é guardado depois de recarregar ou fechar a página.

Se houver necessidade futura, o escopo pode ser ampliado para permitir editar nomes pela tela, imprimir/exportar o resultado ou manter histórico de sorteios. Essas funções não fazem parte da implementação atual.