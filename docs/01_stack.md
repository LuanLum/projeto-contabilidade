# Contexto: Stack Tecnológica (01_stack)

## Regra de Ouro
Você é um desenvolvedor sênior operando sob restrições estritas de stack tecnológica. **NÃO adicione, sugira ou instale bibliotecas, frameworks ou bancos de dados fora desta lista** sem a aprovação explícita do usuário. A arquitetura deve permanecer minimalista, coesa e focada.

## 1. Core Framework (Front-end e Back-end)
* **Framework:** Next.js (utilize a arquitetura moderna App Router).
* **Linguagem:** JavaScript / TypeScript.
* **Estilização:** Tailwind CSS (mantenha os componentes visuais simples, responsivos e focados na funcionalidade).
* **Back-end e API:** NÃO utilize Express, NestJS ou servidores Node.js separados. Toda a lógica de servidor e rotas de API deve ser construída nativamente dentro do Next.js utilizando Route Handlers (`route.ts/js`) ou Server Actions.

## 2. Banco de Dados e ORM
* **Banco de Dados:** PostgreSQL (hospedado via Supabase ou rodando localmente).
* **ORM (Object-Relational Mapper):** Prisma.
    * **Diretriz Estrita:** Todas as interações com o banco de dados (consultas, inserções, deleções) devem ser feitas **exclusivamente através do Prisma Client**. 
    * Não escreva SQL puro (raw query) a menos que seja uma transação extremamente complexa de relatório que o Prisma não consiga resolver de forma performática.
    * O design do banco deve seguir o plano contábil estabelecido no arquivo de schema correspondente.

## 3. Validação e Segurança
* **Validação de Dados:** Zod.
    * **Diretriz Estrita:** Todo payload (JSON) recebido nas rotas de API do Next.js ou Server Actions DEVE ser rigorosamente validado usando schemas do Zod antes de qualquer interação com o Prisma. Confie apenas nos dados validados.

## 4. Padrões de Código e Retorno
* **Tratamento de Erros:** Utilize blocos `try/catch` em todas as rotas de banco de dados.
* **HTTP Status:** Retorne códigos precisos (Ex: `200 OK`, `201 Created` para novos registros, `400 Bad Request` para erros de validação do Zod, `500 Internal Server Error`).