import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('--- Iniciando migração manual para Multi-Tenancy (V2) ---');

    const execute = async (sql: string, description: string) => {
      console.log(`Executando: ${description}...`);
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (e: any) {
        console.warn(`Aviso em "${description}":`, e.message);
      }
    };

    // 1. Criar Enums se não existirem
    // Nota: Em Postgres, enums são tipos e precisam de tratamento especial para "se não existir"
    await execute(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TipoConta') THEN
          CREATE TYPE "TipoConta" AS ENUM ('Ativo', 'Passivo', 'Receita', 'Despesa');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NaturezaMov') THEN
          CREATE TYPE "NaturezaMov" AS ENUM ('Debito', 'Credito');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StatusBem') THEN
          CREATE TYPE "StatusBem" AS ENUM ('Ativo', 'Baixado', 'Vendido');
        END IF;
      END $$;
    `, 'Criando enums');

    // 2. Criar tabela empresa
    await execute(`
      CREATE TABLE IF NOT EXISTS "empresa" (
        "id" SERIAL NOT NULL,
        "nome" VARCHAR(255) NOT NULL,
        "is_demo" BOOLEAN NOT NULL DEFAULT false,
        "template_id" TEXT,
        "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "empresa_pkey" PRIMARY KEY ("id")
      );
    `, 'Criando tabela empresa');

    // 3. Garantir empresa padrão
    console.log('Garantindo empresa padrão...');
    let empresaId: number;
    const empresaExistente = await prisma.$queryRawUnsafe<{id: number}[]>(`SELECT id FROM "empresa" WHERE is_demo = false LIMIT 1`);
    
    if (empresaExistente.length === 0) {
      const novaEmpresa = await prisma.$queryRawUnsafe<{id: number}[]>(`
        INSERT INTO "empresa" ("nome", "is_demo") 
        VALUES ('Minha Empresa Real', false) 
        RETURNING id
      `);
      empresaId = novaEmpresa[0].id;
    } else {
      empresaId = empresaExistente[0].id;
    }
    console.log(`ID da empresa padrão: ${empresaId}`);

    // 4. Preparar conta_contabil
    await execute(`ALTER TABLE "conta_contabil" ADD COLUMN IF NOT EXISTS "empresa_id" INTEGER;`, 'Adicionando empresa_id em conta_contabil');
    await execute(`UPDATE "conta_contabil" SET "empresa_id" = ${empresaId} WHERE "empresa_id" IS NULL;`, 'Vinculando contas existentes');
    
    // 5. Preparar lancamento_contabil
    await execute(`ALTER TABLE "lancamento_contabil" ADD COLUMN IF NOT EXISTS "empresa_id" INTEGER;`, 'Adicionando empresa_id em lancamento_contabil');
    await execute(`UPDATE "lancamento_contabil" SET "empresa_id" = ${empresaId} WHERE "empresa_id" IS NULL;`, 'Vinculando lancamentos existentes');

    // 6. Criar/Preparar bem_patrimonial
    await execute(`
      CREATE TABLE IF NOT EXISTS "bem_patrimonial" (
        "id" SERIAL NOT NULL,
        "nome" VARCHAR(255) NOT NULL,
        "data_aquisicao" DATE NOT NULL,
        "valor_aquisicao" DECIMAL(15,2) NOT NULL,
        "taxa_depreciacao_anual" DECIMAL(5,2) NOT NULL,
        "status" "StatusBem" NOT NULL DEFAULT 'Ativo',
        "empresa_id" INTEGER NOT NULL,
        "conta_imobilizado_id" INTEGER NOT NULL,
        CONSTRAINT "bem_patrimonial_pkey" PRIMARY KEY ("id")
      );
    `, 'Criando tabela bem_patrimonial');
    await execute(`ALTER TABLE "bem_patrimonial" ADD COLUMN IF NOT EXISTS "empresa_id" INTEGER;`, 'Garantindo empresa_id em bem_patrimonial');
    await execute(`UPDATE "bem_patrimonial" SET "empresa_id" = ${empresaId} WHERE "empresa_id" IS NULL;`, 'Vinculando bens existentes');

    // 7. Aplicar restrições finais (Constraints)
    console.log('Aplicando restrições finais...');
    
    // Unicidade de código por empresa
    await execute(`DROP INDEX IF EXISTS "conta_contabil_codigo_key";`, 'Removendo indice unico antigo');
    await execute(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conta_contabil_codigo_empresa_id_key') THEN
          ALTER TABLE "conta_contabil" ADD CONSTRAINT "conta_contabil_codigo_empresa_id_key" UNIQUE ("codigo", "empresa_id");
        END IF;
      END $$;
    `, 'Criando indice unico composto');

    // Foreign Keys
    await execute(`ALTER TABLE "conta_contabil" ADD CONSTRAINT "conta_contabil_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE;`, 'FK conta_contabil -> empresa');
    await execute(`ALTER TABLE "lancamento_contabil" ADD CONSTRAINT "lancamento_contabil_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE;`, 'FK lancamento_contabil -> empresa');
    await execute(`ALTER TABLE "bem_patrimonial" ADD CONSTRAINT "bem_patrimonial_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE;`, 'FK bem_patrimonial -> empresa');
    await execute(`ALTER TABLE "bem_patrimonial" ADD CONSTRAINT "bem_patrimonial_conta_imobilizado_id_fkey" FOREIGN KEY ("conta_imobilizado_id") REFERENCES "conta_contabil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;`, 'FK bem_patrimonial -> conta');

    console.log('--- Migração concluída com sucesso! ---');
  } catch (error) {
    console.error('Erro fatal na migração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
