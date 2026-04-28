export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
import { getEmpresaId } from "@/lib/auth-utils";

export async function POST(request: Request) {
  try {
    const empresaId = getEmpresaId(request);

    // Verificar se a empresa existe
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });
    if (!empresa) {
      return NextResponse.json(
        { success: false, error: "Empresa nao encontrada." },
        { status: 404 },
      );
    }

    // Executa o reset em uma transação para garantir atomicidade
    await prisma.$transaction(async (tx) => {
      // 1. Deletar movimentações da empresa
      await tx.movimentacaoItem.deleteMany({
        where: { lancamento: { empresaId } },
      });

      // 2. Deletar lançamentos da empresa
      await tx.lancamentoContabil.deleteMany({
        where: { empresaId },
      });

      // 3. Deletar contas (filhas primeiro, depois raiz)
      await tx.contaContabil.deleteMany({
        where: { empresaId, contaPaiId: { not: null } },
      });
      await tx.contaContabil.deleteMany({
        where: { empresaId },
      });

      // 4. Recriar contas raiz padrão para esta empresa
      await tx.contaContabil.createMany({
        data: [
          {
            codigo: "1",
            nome: "ATIVO",
            tipo: "Ativo",
            aceitaLancamento: false,
            empresaId,
          },
          {
            codigo: "2",
            nome: "PASSIVO",
            tipo: "Passivo",
            aceitaLancamento: false,
            empresaId,
          },
          {
            codigo: "3",
            nome: "RECEITAS",
            tipo: "Receita",
            aceitaLancamento: false,
            empresaId,
          },
          {
            codigo: "4",
            nome: "DESPESAS",
            tipo: "Despesa",
            aceitaLancamento: false,
            empresaId,
          },
        ],
      });
    });

    return NextResponse.json({
      success: true,
      message:
        "Sistema resetado com sucesso. Todos os registros foram removidos.",
    });
  } catch (error) {
    console.error("Erro ao resetar sistema:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno ao resetar o sistema." },
      { status: 500 },
    );
  }
}
