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
    const contas = await prisma.contaContabil.findMany({
      where: { empresaId },
      orderBy: {
        codigo: "asc",
      },
      include: {
        contasFilhas: true,
      },
    });

    // Para o front-end facilitar a renderização, podemos retornar a estrutura flat
    // ou montar uma árvore recursiva. O roadmap sugere popular dropdowns.
    return NextResponse.json({ success: true, data: contas });
  } catch (error) {
    console.error("Erro ao buscar contas:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao carregar o plano de contas" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const empresaId = getEmpresaId(request);
    const body = await request.json();
    const { codigo, nome, aceitaLancamento, contaPaiId } = body;

    if (!codigo || !nome) {
      return NextResponse.json(
        {
          success: false,
          error: "Campos obrigatorios (codigo, nome) nao preenchidos.",
        },
        { status: 400 },
      );
    }

    // Derivacao estrita do tipo pelo primeiro digito do codigo
    const TIPO_MAP: Record<
      string,
      "Ativo" | "Passivo" | "Receita" | "Despesa"
    > = {
      "1": "Ativo",
      "2": "Passivo",
      "3": "Receita",
      "4": "Despesa",
    };

    const primeiroDigito = codigo.toString().charAt(0);
    const tipoDerivedado = TIPO_MAP[primeiroDigito];

    if (!tipoDerivedado) {
      return NextResponse.json(
        {
          success: false,
          error: `Codigo invalido. O primeiro digito deve ser 1 (Ativo), 2 (Passivo), 3 (Receita) ou 4 (Despesa). Recebido: "${primeiroDigito}".`,
        },
        { status: 400 },
      );
    }

    // Se tem conta pai, validar que o prefixo do codigo e compativel
    if (contaPaiId) {
      const pai = await prisma.contaContabil.findUnique({
        where: { id: Number(contaPaiId), empresaId },
      });
      if (!pai) {
        return NextResponse.json(
          {
            success: false,
            error: "Conta pai não encontrada ou pertence a outra empresa.",
          },
          { status: 400 },
        );
      }
      if (!codigo.toString().startsWith(pai.codigo)) {
        return NextResponse.json(
          {
            success: false,
            error: `O codigo "${codigo}" deve comecar com o prefixo do pai "${pai.codigo}".`,
          },
          { status: 400 },
        );
      }
    }

    const newConta = await prisma.contaContabil.create({
      data: {
        codigo,
        nome,
        tipo: tipoDerivedado,
        aceitaLancamento: aceitaLancamento ?? true,
        contaPaiId: contaPaiId ? Number(contaPaiId) : null,
        empresaId: empresaId,
      },
    });

    return NextResponse.json(
      { success: true, data: newConta },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Erro ao criar conta:", error);

    // Tratamento de erro único de código
    if (typeof error === "object" && error !== null && "code" in error) {
      if ((error as { code: string }).code === "P2002") {
        return NextResponse.json(
          { success: false, error: "Uma conta com este código já existe." },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Erro interno ao criar a conta contábil." },
      { status: 500 },
    );
  }
}
