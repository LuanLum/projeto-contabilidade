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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const empresaId = getEmpresaId(request);
    const { id: idStr } = await params;
    const id = Number(idStr);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "ID invalido." },
        { status: 400 },
      );
    }

    // Protecao contra delecao de contas raiz (Ativo, Passivo, Receita, Despesa)
    const conta = await prisma.contaContabil.findUnique({
      where: { id, empresaId },
    });

    if (!conta) {
      return NextResponse.json(
        {
          success: false,
          error: "Conta nao encontrada ou não pertence a esta empresa.",
        },
        { status: 404 },
      );
    }

    if (["1", "2", "3", "4"].includes(conta.codigo)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Nao e possivel excluir contas raiz do sistema (Ativo, Passivo, Receita ou Despesa).",
        },
        { status: 403 },
      );
    }

    // Check if account has children
    const childCount = await prisma.contaContabil.count({
      where: { contaPaiId: id, empresaId },
    });

    if (childCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Nao e possivel excluir uma conta que possui subcontas vinculadas.",
        },
        { status: 400 },
      );
    }

    // Check if account has movements
    const movementCount = await prisma.movimentacaoItem.count({
      where: { contaId: id },
    });

    if (movementCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Nao e possivel excluir uma conta que possui lancamentos contabeis vinculados.",
        },
        { status: 400 },
      );
    }

    await prisma.contaContabil.delete({
      where: { id, empresaId },
    });

    return NextResponse.json({
      success: true,
      message: "Conta excluida com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao excluir conta:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno ao excluir a conta." },
      { status: 500 },
    );
  }
}
