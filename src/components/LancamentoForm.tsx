"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useEmpresa } from "@/contexts/EmpresaContext";

type Conta = {
  id: number;
  codigo: string;
  nome: string;
  tipo: string;
  aceitaLancamento: boolean;
  contaPaiId: number | null;
};

type MovimentacaoForm = {
  id: string;
  natureza: "Debito" | "Credito";
  contaPaiId: number | "";
  contaId: number | "";
  valor: string;
  touched: boolean; // Did the user interact with this row?
};

type RowError = {
  grupo?: string;
  conta?: string;
  valor?: string;
};

const NATUREZA_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  Debito: { label: "D", color: "#06b6d4", bgColor: "rgba(6,182,212,0.15)" },
  Credito: { label: "C", color: "#8b5cf6", bgColor: "rgba(139,92,246,0.15)" },
};

export default function LancamentoForm() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [attempted, setAttempted] = useState(false); // Has the user attempted to submit?

  const [dataOcorrencia, setDataOcorrencia] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [descricaoHistorico, setDescricaoHistorico] = useState("");
  const [documentoReferencia, setDocumentoReferencia] = useState("");

  const makeRow = (natureza: "Debito" | "Credito"): MovimentacaoForm => ({
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    natureza,
    contaPaiId: "",
    contaId: "",
    valor: "",
    touched: false,
  });

  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoForm[]>([
    makeRow("Debito"),
    makeRow("Credito"),
  ]);

  const { empresaId } = useEmpresa();

  // ── Data fetching ──
  useEffect(() => {
    const headers = { "x-empresa-id": String(empresaId) };
    fetch("/api/contas", { headers })
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) setContas(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── Derived data ──
  const grupos = useMemo(() => contas.filter((c) => c.contaPaiId === null), [contas]);

  const getContasFilhas = (paiId: number | "") => {
    if (paiId === "") return [];
    return contas.filter((c) => c.contaPaiId === paiId && c.aceitaLancamento);
  };

  // ── Totals ──
  const totalDebitos = movimentacoes
    .filter((m) => m.natureza === "Debito")
    .reduce((acc, curr) => acc + (parseFloat(curr.valor) || 0), 0);

  const totalCreditos = movimentacoes
    .filter((m) => m.natureza === "Credito")
    .reduce((acc, curr) => acc + (parseFloat(curr.valor) || 0), 0);

  const diferenca = Math.abs(totalDebitos - totalCreditos);
  const isBalanced = diferenca < 0.001;
  const hasAnyValue = totalDebitos > 0 || totalCreditos > 0;

  // ── Per-row validation ──
  const getRowErrors = (mov: MovimentacaoForm): RowError => {
    const errors: RowError = {};
    if (mov.contaPaiId === "") errors.grupo = "Selecione um grupo";
    else if (mov.contaId === "") errors.conta = "Selecione a conta";
    if (!mov.valor || parseFloat(mov.valor) <= 0) errors.valor = "Informe um valor > 0";
    return errors;
  };

  const shouldShowRowError = (mov: MovimentacaoForm) => mov.touched || attempted;

  // ── Handlers ──
  const toNumberOrEmpty = (v: string): number | "" => (v === "" ? "" : Number(v));

  const handleChange = (id: string, field: keyof MovimentacaoForm, value: string) => {
    setMovimentacoes((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, touched: true };
        switch (field) {
          case "contaPaiId":
            return { ...updated, contaPaiId: toNumberOrEmpty(value), contaId: "" };
          case "contaId":
            return { ...updated, contaId: toNumberOrEmpty(value) };
          case "natureza":
            return { ...updated, natureza: value as "Debito" | "Credito" };
          case "valor":
            return { ...updated, valor: value };
          default:
            return updated;
        }
      }),
    );
  };

  const addMovimentacao = (natureza: "Debito" | "Credito") => {
    setMovimentacoes((prev) => [...prev, makeRow(natureza)]);
  };

  const removeMovimentacao = (id: string) => {
    setMovimentacoes((prev) => prev.filter((m) => m.id !== id));
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(false);
    setAttempted(true);

    // Check per-row validity
    const allValid = movimentacoes.every((m) => {
      const errs = getRowErrors(m);
      return Object.keys(errs).length === 0;
    });

    if (!allValid) {
      setFormError("Existem linhas incompletas. Revise os campos destacados em vermelho.");
      return;
    }

    if (!isBalanced) {
      setFormError(
        `Partidas desbalanceadas — diferença de R$ ${diferenca.toFixed(2)}. Débitos devem ser iguais a Créditos.`,
      );
      return;
    }

    if (!descricaoHistorico.trim() || descricaoHistorico.trim().length < 5) {
      setFormError("O histórico deve conter ao menos 5 caracteres.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        dataOcorrencia,
        descricaoHistorico,
        documentoReferencia,
        movimentacoes: movimentacoes.map((m) => ({
          contaId: Number(m.contaId),
          natureza: m.natureza,
          valor: m.valor,
        })),
      };

      const res = await fetch("/api/lancamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-empresa-id": String(empresaId) },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setAttempted(false);
        setDescricaoHistorico("");
        setDocumentoReferencia("");
        setMovimentacoes([makeRow("Debito"), makeRow("Credito")]);
      } else {
        setFormError(data.error || "Erro ao salvar lançamento.");
      }
    } catch {
      setFormError("Erro de rede ao salvar lançamento.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render helpers ──
  const inputErrorStyle = (hasError: boolean) =>
    hasError
      ? { borderColor: "#ef4444", boxShadow: "0 0 0 2px rgba(239,68,68,0.25)" }
      : {};

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: "2rem" }}>
        Carregando contas...
      </div>
    );
  }

  return (
    <div
      className="glass-panel"
      style={{ padding: "2rem", animation: "slideUp 0.5s ease" }}
    >
      <h2 style={{ marginBottom: "1.5rem", fontSize: "1.5rem", fontWeight: 600 }}>
        Novo Lançamento Contábil
      </h2>

      {/* ── Alerts ── */}
      {formError && (
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            color: "#fca5a5",
            padding: "1rem",
            marginBottom: "1.5rem",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "8px",
            fontSize: "0.9rem",
          }}
        >
          {formError}
        </div>
      )}
      {success && (
        <div
          style={{
            background: "rgba(34,197,94,0.1)",
            color: "#86efac",
            padding: "1rem",
            marginBottom: "1.5rem",
            border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: "8px",
            fontSize: "0.9rem",
          }}
        >
          Lancamento salvo com sucesso!
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
      >
        {/* ── Header fields ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              Data da Ocorrência
            </label>
            <input
              type="date"
              className="input-premium"
              value={dataOcorrencia}
              onChange={(e) => setDataOcorrencia(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              Doc. Referência (Opcional)
            </label>
            <input
              type="text"
              className="input-premium"
              placeholder="Ex: NF 12345"
              value={documentoReferencia}
              onChange={(e) => setDocumentoReferencia(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            Histórico (Descrição do Fato)
          </label>
          <input
            type="text"
            className="input-premium"
            placeholder="Descreva o fato contábil — ex: Pagamento de aluguel à vista..."
            value={descricaoHistorico}
            onChange={(e) => setDescricaoHistorico(e.target.value)}
            required
            minLength={5}
            style={attempted && descricaoHistorico.trim().length < 5 ? inputErrorStyle(true) : {}}
          />
          {attempted && descricaoHistorico.trim().length < 5 && (
            <span style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "0.25rem", display: "block" }}>
              Mínimo de 5 caracteres
            </span>
          )}
        </div>

        {/* ── Partidas section ── */}
        <div
          style={{
            marginTop: "0.5rem",
            borderTop: "1px solid var(--glass-border)",
            paddingTop: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h3 style={{ fontSize: "1.15rem", color: "var(--text-secondary)" }}>
              Partidas (Débitos e Créditos)
            </h3>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => addMovimentacao("Debito")}
                className="btn-secondary"
                style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
              >
                + Débito
              </button>
              <button
                type="button"
                onClick={() => addMovimentacao("Credito")}
                className="btn-secondary"
                style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
              >
                + Crédito
              </button>
            </div>
          </div>

          {/* ── Column headers ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "56px 2fr 2fr 140px 40px",
              gap: "0.75rem",
              padding: "0 1rem 0.5rem",
              color: "var(--text-secondary)",
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            <span>Tipo</span>
            <span>Grupo de Contas</span>
            <span>Conta</span>
            <span style={{ textAlign: "right" }}>Valor R$</span>
            <span></span>
          </div>

          {/* ── Rows ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {movimentacoes.map((mov) => {
              const errors = getRowErrors(mov);
              const show = shouldShowRowError(mov);
              const nat = NATUREZA_LABELS[mov.natureza];
              const filhas = getContasFilhas(mov.contaPaiId);

              return (
                <div key={mov.id}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "56px 2fr 2fr 140px 40px",
                      gap: "0.75rem",
                      alignItems: "center",
                      background: nat.bgColor,
                      padding: "0.75rem 1rem",
                      borderRadius: "8px",
                      borderLeft: `3px solid ${nat.color}`,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {/* Nature toggle */}
                    <select
                      className="input-premium"
                      value={mov.natureza}
                      onChange={(e) => handleChange(mov.id, "natureza", e.target.value)}
                      style={{
                        padding: "0.5rem",
                        textAlign: "center",
                        fontWeight: 700,
                        color: nat.color,
                        background: "rgba(0,0,0,0.3)",
                      }}
                    >
                      <option value="Debito">D</option>
                      <option value="Credito">C</option>
                    </select>

                    {/* Account Group */}
                    <select
                      className="input-premium"
                      value={mov.contaPaiId}
                      onChange={(e) => handleChange(mov.id, "contaPaiId", e.target.value)}
                      style={{ padding: "0.5rem 0.75rem", ...inputErrorStyle(show && !!errors.grupo) }}
                    >
                      <option value="">-- Grupo de Contas --</option>
                      {grupos.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.codigo} — {c.nome}
                        </option>
                      ))}
                    </select>

                    {/* Account */}
                    <select
                      className="input-premium"
                      value={mov.contaId}
                      onChange={(e) => handleChange(mov.id, "contaId", e.target.value)}
                      disabled={mov.contaPaiId === ""}
                      style={{
                        padding: "0.5rem 0.75rem",
                        opacity: mov.contaPaiId === "" ? 0.4 : 1,
                        ...inputErrorStyle(show && !!errors.conta && mov.contaPaiId !== ""),
                      }}
                    >
                      <option value="">
                        {mov.contaPaiId === "" ? "Primeiro selecione o grupo →" : "-- Selecionar Conta --"}
                      </option>
                      {filhas.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.codigo} — {c.nome}
                        </option>
                      ))}
                      {mov.contaPaiId !== "" && filhas.length === 0 && (
                        <option disabled>Nenhuma conta registrada</option>
                      )}
                    </select>

                    {/* Amount */}
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="input-premium"
                      placeholder="0,00"
                      value={mov.valor}
                      onChange={(e) => handleChange(mov.id, "valor", e.target.value)}
                      disabled={mov.contaId === ""}
                      style={{
                        padding: "0.5rem 0.75rem",
                        textAlign: "right",
                        fontWeight: 600,
                        opacity: mov.contaId === "" ? 0.4 : 1,
                        ...inputErrorStyle(show && !!errors.valor && mov.contaId !== ""),
                      }}
                    />

                    {/* Remove */}
                    {movimentacoes.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeMovimentacao(mov.id)}
                        className="btn-danger"
                        style={{
                          padding: "0.4rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "32px",
                          height: "32px",
                          borderRadius: "6px",
                          fontSize: "1rem",
                        }}
                      >
                        x
                      </button>
                    )}
                  </div>

                  {/* Inline row error messages */}
                  {show && Object.keys(errors).length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        gap: "1rem",
                        padding: "0.25rem 1rem 0 4.5rem",
                        fontSize: "0.78rem",
                        color: "#ef4444",
                      }}
                    >
                      {errors.grupo && <span>↑ {errors.grupo}</span>}
                      {errors.conta && <span>↑ {errors.conta}</span>}
                      {errors.valor && <span>↑ {errors.valor}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Live Balance Indicator ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              marginTop: "1.25rem",
              gap: "2rem",
              padding: "1rem 1.5rem",
              background: "rgba(0,0,0,0.2)",
              borderRadius: "8px",
            }}
          >
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Total Débitos
              </div>
              <div style={{ fontSize: "1.3rem", color: "#06b6d4", fontWeight: 700 }}>
                R$ {totalDebitos.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Total Créditos
              </div>
              <div style={{ fontSize: "1.3rem", color: "#8b5cf6", fontWeight: 700 }}>
                R$ {totalCreditos.toFixed(2)}
              </div>
            </div>

            {/* Balance badge */}
            {hasAnyValue && (
              <div
                style={{
                  padding: "0.4rem 1rem",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  background: isBalanced ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                  color: isBalanced ? "#22c55e" : "#ef4444",
                  border: `1px solid ${isBalanced ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                  transition: "all 0.3s ease",
                }}
              >
                {isBalanced ? "Balanceado" : `Diferenca: R$ ${diferenca.toFixed(2)}`}
              </div>
            )}
          </div>
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          className="btn-primary"
          style={{ marginTop: "0.5rem" }}
          disabled={submitting}
        >
          {submitting ? "Salvando..." : "Salvar Lançamento (Fato Contábil)"}
        </button>
      </form>
    </div>
  );
}
