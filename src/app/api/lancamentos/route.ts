import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { LancamentoSchema } from "@/lib/schemas/lancamento";
import { getEmpresaId } from "@/lib/auth-utils";

export async function POST(request: Request) {
  try {
    const empresaId = getEmpresaId(request);
    const body = await request.json();
    
    // 1. Validação via Zod (Incluindo regra Sum(Deb) = Sum(Cred))
    const validation = LancamentoSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Dados inválidos", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { data } = validation;

    // 2. Persistência Atômica via Transação
    const result = await prisma.$transaction(async (tx) => {
      // Cria o cabeçalho do lançamento
      const lancamento = await tx.lancamentoContabil.create({
        data: {
          dataOcorrencia: data.dataOcorrencia,
          descricaoHistorico: data.descricaoHistorico,
          documentoReferencia: data.documentoReferencia,
          empresaId: empresaId,
        },
      });

      // Cria as linhas de movimentação (Débitos e Créditos)
      const movimentacoes = await Promise.all(
        data.movimentacoes.map((mov) =>
          tx.movimentacaoItem.create({
            data: {
              natureza: mov.natureza,
              valor: mov.valor,
              contaId: mov.contaId,
              lancamentoId: lancamento.id,
            },
          })
        )
      );

      return { ...lancamento, movimentacoes };
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("Erro ao salvar lançamento:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno ao processar o lançamento" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const empresaId = getEmpresaId(request);
    const lancamentos = await prisma.lancamentoContabil.findMany({
      where: { empresaId },
      take: 10,
      orderBy: {
        dataOcorrencia: 'desc'
      },
      include: {
        movimentacoes: {
          include: {
            conta: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, data: lancamentos });
  } catch (error) {
    console.error("Erro ao carregar histórico de lançamentos:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao consultar histórico" },
      { status: 500 }
    );
  }
}
