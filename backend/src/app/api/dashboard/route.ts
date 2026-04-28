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

export async function GET(request: Request) {
  try {
    const empresaId = getEmpresaId(request);
    // Busca agrupada das movimentações juntando com a conta para saber o Tipo
    const movimentacoes = await prisma.movimentacaoItem.findMany({
      where: {
        lancamento: {
          empresaId: empresaId,
        },
      },
      include: {
        conta: true,
      },
    });

    const saldos = {
      Ativo: 0,
      Passivo: 0,
      Receita: 0,
      Despesa: 0,
    };

    movimentacoes.forEach((mov) => {
      const valor = parseFloat(mov.valor.toString());
      const isDebito = mov.natureza === "Debito";

      // Lógica Contábil Básica de Saldos:
      // Ativo cresce a Débito, diminui a Crédito
      // Passivo cresce a Crédito, diminui a Débito
      // Despesa cresce a Débito, diminui a Crédito
      // Receita cresce a Crédito, diminui a Débito
      switch (mov.conta.tipo) {
        case "Ativo":
          saldos.Ativo += isDebito ? valor : -valor;
          break;
        case "Passivo":
          saldos.Passivo += !isDebito ? valor : -valor;
          break;
        case "Despesa":
          saldos.Despesa += isDebito ? valor : -valor;
          break;
        case "Receita":
          saldos.Receita += !isDebito ? valor : -valor;
          break;
      }
    });

    // Construção dos dados padronizada para o Recharts
    const dataGraficos = {
      patrimonial: [
        { name: "Ativos", valor: saldos.Ativo, fill: "#06b6d4" },
        { name: "Passivos", valor: saldos.Passivo, fill: "#8b5cf6" },
      ],
      resultado: [
        { name: "Receitas", valor: saldos.Receita, fill: "#22c55e" },
        { name: "Despesas", valor: saldos.Despesa, fill: "#ef4444" },
      ],
      saldos,
    };

    return NextResponse.json({ success: true, data: dataGraficos });
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao compilar saldos do dashboard" },
      { status: 500 },
    );
  }
}
