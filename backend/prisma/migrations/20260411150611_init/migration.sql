-- CreateEnum
CREATE TYPE "TipoConta" AS ENUM ('Ativo', 'Passivo', 'Receita', 'Despesa');

-- CreateEnum
CREATE TYPE "NaturezaMov" AS ENUM ('Debito', 'Credito');

-- CreateEnum
CREATE TYPE "StatusBem" AS ENUM ('Ativo', 'Baixado', 'Vendido');

-- CreateTable
CREATE TABLE "conta_contabil" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "tipo" "TipoConta" NOT NULL,
    "aceita_lancamento" BOOLEAN NOT NULL DEFAULT false,
    "conta_pai_id" INTEGER,

    CONSTRAINT "conta_contabil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lancamento_contabil" (
    "id" SERIAL NOT NULL,
    "data_ocorrencia" DATE NOT NULL,
    "descricao_historico" TEXT NOT NULL,
    "documento_referencia" VARCHAR(100),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lancamento_contabil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacao_item" (
    "id" SERIAL NOT NULL,
    "natureza" "NaturezaMov" NOT NULL,
    "valor" DECIMAL(15,2) NOT NULL,
    "lancamento_id" INTEGER NOT NULL,
    "conta_id" INTEGER NOT NULL,

    CONSTRAINT "movimentacao_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BemPatrimonial" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "data_aquisicao" DATE NOT NULL,
    "valor_aquisicao" DECIMAL(15,2) NOT NULL,
    "taxa_depreciacao_anual" DECIMAL(5,2) NOT NULL,
    "status" "StatusBem" NOT NULL DEFAULT 'Ativo',
    "conta_imobilizado_id" INTEGER NOT NULL,

    CONSTRAINT "BemPatrimonial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conta_contabil_codigo_key" ON "conta_contabil"("codigo");

-- AddForeignKey
ALTER TABLE "conta_contabil" ADD CONSTRAINT "conta_contabil_conta_pai_id_fkey" FOREIGN KEY ("conta_pai_id") REFERENCES "conta_contabil"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacao_item" ADD CONSTRAINT "movimentacao_item_lancamento_id_fkey" FOREIGN KEY ("lancamento_id") REFERENCES "lancamento_contabil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacao_item" ADD CONSTRAINT "movimentacao_item_conta_id_fkey" FOREIGN KEY ("conta_id") REFERENCES "conta_contabil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BemPatrimonial" ADD CONSTRAINT "BemPatrimonial_conta_imobilizado_id_fkey" FOREIGN KEY ("conta_imobilizado_id") REFERENCES "conta_contabil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
