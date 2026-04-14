import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Iniciando o plantio das contas raiz...");

  // Cria a conta raiz do ATIVO
  const ativo = await prisma.contaContabil.upsert({
    where: { codigo: "1" },
    update: {},
    create: {
      codigo: "1",
      nome: "ATIVO",
      tipo: "Ativo",
      aceitaLancamento: false,
    },
  });

  // Cria a conta raiz do PASSIVO
  const passivo = await prisma.contaContabil.upsert({
    where: { codigo: "2" },
    update: {},
    create: {
      codigo: "2",
      nome: "PASSIVO",
      tipo: "Passivo",
      aceitaLancamento: false,
    },
  });

  // Cria a conta raiz de RECEITAS
  const receitas = await prisma.contaContabil.upsert({
    where: { codigo: "3" },
    update: {},
    create: {
      codigo: "3",
      nome: "RECEITAS",
      tipo: "Receita",
      aceitaLancamento: false,
    },
  });

  // Cria a conta raiz de DESPESAS
  const despesas = await prisma.contaContabil.upsert({
    where: { codigo: "4" },
    update: {},
    create: {
      codigo: "4",
      nome: "DESPESAS",
      tipo: "Despesa",
      aceitaLancamento: false,
    },
  });

  console.log("✅ Plano de Contas básico criado com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
