import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TEMPLATES } from "@/lib/templates/definitions";

export async function POST(request: Request) {
  try {
    const { templateId } = await request.json();
    const template = TEMPLATES[templateId as keyof typeof TEMPLATES];

    if (!template) {
      return NextResponse.json({ success: false, error: "Template não encontrado." }, { status: 400 });
    }

    // 1. Garantir que a empresa de DEMO existe
    let demoEmpresa = await prisma.empresa.findFirst({
      where: { isDemo: true, templateId: templateId }
    });

    if (!demoEmpresa) {
      demoEmpresa = await prisma.empresa.create({
        data: {
          nome: `DEMO - ${template.name}`,
          isDemo: true,
          templateId: templateId
        }
      });
    }

    const empresaId = demoEmpresa.id;

    // 2. Limpar dados existentes desta empresa de demo em uma transação
    await prisma.$transaction(async (tx) => {
      // Deletar movimentos e lançamentos
      await tx.movimentacaoItem.deleteMany({
        where: { lancamento: { empresaId } }
      });
      await tx.lancamentoContabil.deleteMany({
        where: { empresaId }
      });
      
      // Deletar contas (precisa ser do fim para o início da hierarquia, ou várias passadas)
      // Como o volume é baixo no demo, podemos deletar as filhas primeiro
      await tx.contaContabil.deleteMany({
        where: { empresaId, contaPaiId: { not: null } }
      });
      await tx.contaContabil.deleteMany({
        where: { empresaId }
      });

      // 3. Semear Plano de Contas
      // Criamos as contas raiz primeiro, depois subníveis
      const contasCriadas: Record<string, number> = {};

      // Ordenamos por profundidade do código (quantidade de pontos)
      const sortedAccounts = [...template.accounts].sort((a, b) => 
        (a.codigo.match(/\./g) || []).length - (b.codigo.match(/\./g) || []).length
      );

      for (const acc of sortedAccounts) {
        // Achar o pai pelo código prefixo
        const partes = acc.codigo.split('.');
        const codigoPai = partes.length > 1 ? partes.slice(0, -1).join('.') : null;
        const contaPaiId = codigoPai ? contasCriadas[codigoPai] : null;

        const newAcc = await tx.contaContabil.create({
          data: {
            codigo: acc.codigo,
            nome: acc.nome,
            tipo: acc.tipo,
            aceitaLancamento: acc.aceitaLancamento,
            empresaId: empresaId,
            contaPaiId: contaPaiId
          }
        });
        contasCriadas[acc.codigo] = newAcc.id;
      }

      // 4. Semear Lançamentos de Exemplo
      for (const t of template.sampleTransactions) {
        const data = new Date();
        data.setDate(data.getDate() + t.dataOffset);

        await tx.lancamentoContabil.create({
          data: {
            descricaoHistorico: t.historico,
            dataOcorrencia: data,
            empresaId: empresaId,
            movimentacoes: {
              create: t.movimentacoes.map(m => ({
                natureza: m.natureza,
                valor: m.valor,
                contaId: contasCriadas[m.codigoConta]
              }))
            }
          }
        });
      }
    });

    return NextResponse.json({ 
      success: true, 
      empresaId: empresaId,
      message: `Ambiente de demonstração '${template.name}' configurado com sucesso.` 
    });

  } catch (error) {
    console.error("Erro ao configurar demo:", error);
    return NextResponse.json({ success: false, error: "Falha ao configurar ambiente de demonstração." }, { status: 500 });
  }
}
