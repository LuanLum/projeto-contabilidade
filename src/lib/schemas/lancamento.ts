import { z } from "zod";

export const MovimentacaoSchema = z.object({
  contaId: z.number().int().positive("ID da conta deve ser um número inteiro positivo"),
  natureza: z.enum(["Debito", "Credito"]),
  valor: z.string().transform((val) => parseFloat(val)).refine((val) => val > 0, "O valor deve ser maior que zero"),
});

export const LancamentoSchema = z.object({
  dataOcorrencia: z.string().transform((str) => new Date(str)),
  descricaoHistorico: z.string().min(5, "O histórico deve ter pelo menos 5 caracteres"),
  documentoReferencia: z.string().optional().nullable(),
  movimentacoes: z.array(MovimentacaoSchema).min(2, "Um lançamento contábil deve ter pelo menos duas partidas (partida dobrada)"),
}).refine((data) => {
  const totalDebito = data.movimentacoes
    .filter((m) => m.natureza === "Debito")
    .reduce((acc, m) => acc + m.valor, 0);
  
  const totalCredito = data.movimentacoes
    .filter((m) => m.natureza === "Credito")
    .reduce((acc, m) => acc + m.valor, 0);

  // Consideramos uma margem pequena para erros de floating point, 
  // embora na API final devamos preferir trabalhar com centavos ou Decimal.
  return Math.abs(totalDebito - totalCredito) < 0.001;
}, {
  message: "A soma dos débitos deve ser igual à soma dos créditos (Princípio das Partidas Dobradas)",
});

export type LancamentoInput = z.infer<typeof LancamentoSchema>;
