# Contexto: Diretrizes do Sistema (Negócio, Código e API)

## 1. Regras de Negócio (O Núcleo Contábil)
* **Partidas Dobradas Estritas:** Todo `lancamento_contabil` deve, obrigatoriamente, possuir pelo menos duas entradas em `movimentacao_item` (um Débito e um Crédito). A soma total dos Débitos DEVE ser exatamente igual à soma total dos Créditos. O sistema deve abortar a transação caso essa equação não feche.
* **Valores Absolutos:** A coluna `valor` na tabela `movimentacao_item` nunca aceita números negativos. A indicação de adição ou subtração no balanço é dada exclusivamente pelo campo `natureza` (Debito ou Credito).
* **Precisão Financeira:** Valores monetários nunca devem ser calculados ou trafegados usando ponto flutuante padrão. Garanta a precisão de duas casas decimais em todas as operações matemáticas no back-end antes de salvar no banco de dados.

## 2. Padrões de Código (Next.js & Prisma)
* **Arquitetura:** Utilize exclusivamente o App Router do Next.js (pasta `app/`).
* **Idioma:** Escreva a lógica, variáveis, funções e banco de dados em português (ex: `criarLancamento`), mantendo o código alinhado com o jargão contábil do domínio.
* **Tratamento de Erros:** Nenhuma transação de banco de dados deve quebrar silenciosamente. Use `try/catch`. 
* **Transações no Banco:** Ao salvar um `lancamento_contabil` e suas `movimentacoes`, utilize o `$transaction` do Prisma para garantir que, se uma linha falhar, nada seja salvo (rollback automático).

## 3. Design da API (Route Handlers do Next.js)
* **Localização:** Todas as rotas de API devem ficar em `app/api/[nome_do_recurso]/route.ts`.
* **Validação (Gatekeeper):** Nenhuma requisição (POST/PUT) deve tocar no Prisma sem antes passar por um schema de validação estrito do Zod.
* **Padrão de Resposta JSON:** * Sucesso (200/201): `{ "success": true, "data": { ... } }`
    * Erro (400/500): `{ "success": false, "error": "Mensagem clara do que deu errado" }`