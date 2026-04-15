import { NextRequest } from "next/server";

/**
 * Obtém o ID da empresa atual a partir dos headers da requisição.
 * Em um cenário real de SaaS, isso viria da sessão do usuário autenticado.
 * Para este MVP/Demo, usaremos um header customizado.
 */
export function getEmpresaId(request: Request | NextRequest): number {
  const req = request as NextRequest;
  const headerId = req.headers.get("x-empresa-id");
  
  if (headerId) {
    return parseInt(headerId, 10);
  }

  // Fallback para a empresa real padrão (ID 1) se nenhum for fornecido
  return 1;
}
