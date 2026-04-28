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
    // Busca todos os lançamentos em ordem cronológica
    const lancamentos = await prisma.lancamentoContabil.findMany({
      where: { empresaId },
      orderBy: {
        dataOcorrencia: 'asc'
      },
      include: {
        movimentacoes: {
          include: {
            conta: true
          }
        }
      }
    });

    // 1. LIVRO DIÁRIO
    const diario = lancamentos.map(lanc => {
      const debitos = lanc.movimentacoes.filter(m => m.natureza === 'Debito');
      const creditos = lanc.movimentacoes.filter(m => m.natureza === 'Credito');
      
      const nomesDebitos = debitos.map(m => m.conta.nome).join(' e ');
      const nomesCreditos = creditos.map(m => m.conta.nome).join(' e ');
      
      const valorTotal = debitos.reduce((acc, curr) => acc + parseFloat(curr.valor.toString()), 0);

      return {
        id: lanc.id,
        data: lanc.dataOcorrencia,
        historico: lanc.descricaoHistorico,
        contasDebito: nomesDebitos,
        contasCredito: nomesCreditos,
        valor: valorTotal
      };
    }).reverse(); // Diário no front costuma ser mais útil do mais recente para o mais antigo.

    // 2. LIVRO RAZÃO & 3. BALANCETE
    // Estruturas auxiliares
    const contasMap = new Map<number, { 
      conta: any, 
      movimentacoes: any[], 
      totalDebitos: number, 
      totalCreditos: number,
      saldo: number
    }>();

    // Primeiro, vamos organizar as movimentações por conta
    for (const lanc of lancamentos) {
      for (const mov of lanc.movimentacoes) {
        if (!contasMap.has(mov.contaId)) {
          contasMap.set(mov.contaId, {
            conta: mov.conta,
            movimentacoes: [],
            totalDebitos: 0,
            totalCreditos: 0,
            saldo: 0
          });
        }
        
        const grupo = contasMap.get(mov.contaId)!;
        const valorMov = parseFloat(mov.valor.toString());
        
        let debitoLine = mov.natureza === 'Debito' ? valorMov : 0;
        let creditoLine = mov.natureza === 'Credito' ? valorMov : 0;
        
        grupo.totalDebitos += debitoLine;
        grupo.totalCreditos += creditoLine;

        // Regra de saldo dinâmico da T-Account:
        // Contas de Ativo e Despesa sobem a débito.
        // Contas de Passivo e Receita sobem a crédito.
        if (mov.conta.tipo === 'Ativo' || mov.conta.tipo === 'Despesa') {
          grupo.saldo += debitoLine - creditoLine;
        } else {
          grupo.saldo += creditoLine - debitoLine;
        }

        // Para o Razão, queremos o saldo NAQUELE MOMENTO (rolling balance)
        grupo.movimentacoes.push({
          id: mov.id,
          data: lanc.dataOcorrencia,
          historico: lanc.descricaoHistorico,
          debito: debitoLine > 0 ? debitoLine : null,
          credito: creditoLine > 0 ? creditoLine : null,
          saldoMomento: grupo.saldo
        });
      }
    }

    const razao = Array.from(contasMap.values()).map(g => ({
      conta: { codigo: g.conta.codigo, nome: g.conta.nome, tipo: g.conta.tipo },
      movimentos: g.movimentacoes, // já estão cronológicos pois `lancamentos` vieram asc
      saldoAtual: g.saldo
    }));

    const balancete = Array.from(contasMap.values()).map(g => ({
      codigo: g.conta.codigo,
      nome: g.conta.nome,
      tipo: g.conta.tipo,
      debitos: g.totalDebitos,
      creditos: g.totalCreditos,
      saldo: g.saldo
    })).sort((a, b) => a.codigo.localeCompare(b.codigo)); // Balancete ordenado por código da conta

    const totaisBalancete = {
      debitos: balancete.reduce((acc, curr) => acc + curr.debitos, 0),
      creditos: balancete.reduce((acc, curr) => acc + curr.creditos, 0)
    };

    return NextResponse.json({ 
      success: true, 
      data: {
        diario,
        razao,
        balancete: {
          contas: balancete,
          totais: totaisBalancete
        }
      }
    });

  } catch (error) {
    console.error("Erro ao gerar relatórios contábeis:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao gerar relatórios" },
      { status: 500 }
    );
  }
}
