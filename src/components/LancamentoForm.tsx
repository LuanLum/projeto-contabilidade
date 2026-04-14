"use client";

import React, { useState, useEffect } from "react";

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
};

export default function LancamentoForm() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [dataOcorrencia, setDataOcorrencia] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [descricaoHistorico, setDescricaoHistorico] = useState("");
  const [documentoReferencia, setDocumentoReferencia] = useState("");

  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoForm[]>([
    { id: "1", natureza: "Debito", contaPaiId: "", contaId: "", valor: "" },
    { id: "2", natureza: "Credito", contaPaiId: "", contaId: "", valor: "" },
  ]);

  useEffect(() => {
    fetch("/api/contas")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setContas(res.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const contasPai = contas.filter((c) => c.contaPaiId === null);

  const getContasFilhas = (paiId: number | "") => {
    if (paiId === "") return [];
    return contas.filter((c) => c.contaPaiId === paiId);
  };

  const toNumberOrEmpty = (v: string): number | "" =>
    v === "" ? "" : Number(v);

  const handleMovimentacaoChange = (
    id: string,
    field: keyof MovimentacaoForm,
    value: string,
  ) => {
    setMovimentacoes((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;

        switch (field) {
          case "contaPaiId":
            return {
              ...m,
              contaPaiId: toNumberOrEmpty(value),
              contaId: "",
            };

          case "contaId":
            return {
              ...m,
              contaId: toNumberOrEmpty(value),
            };

          case "natureza":
            return {
              ...m,
              natureza: value as "Debito" | "Credito",
            };

          case "valor":
            return {
              ...m,
              valor: value,
            };

          default:
            return m;
        }
      }),
    );
  };

  const addMovimentacao = () => {
    setMovimentacoes((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        natureza: "Debito",
        contaPaiId: "",
        contaId: "",
        valor: "",
      },
    ]);
  };

  const removeMovimentacao = (id: string) => {
    setMovimentacoes((prev) => prev.filter((m) => m.id !== id));
  };

  const totalDebitos = movimentacoes
    .filter((m) => m.natureza === "Debito")
    .reduce((acc, curr) => acc + (parseFloat(curr.valor) || 0), 0);

  const totalCreditos = movimentacoes
    .filter((m) => m.natureza === "Credito")
    .reduce((acc, curr) => acc + (parseFloat(curr.valor) || 0), 0);

  const isBalanced = Math.abs(totalDebitos - totalCreditos) < 0.001;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!isBalanced) {
      setError("Débitos e Créditos não estão balanceados!");
      return;
    }

    if (movimentacoes.some((m) => m.contaId === "" || !m.valor)) {
      setError("Preencha todas as contas e valores.");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setDescricaoHistorico("");
        setDocumentoReferencia("");

        setMovimentacoes([
          {
            id: Date.now().toString() + "1",
            natureza: "Debito",
            contaPaiId: "",
            contaId: "",
            valor: "",
          },
          {
            id: Date.now().toString() + "2",
            natureza: "Credito",
            contaPaiId: "",
            contaId: "",
            valor: "",
          },
        ]);
      } else {
        setError(data.error || "Erro ao salvar lançamento.");
      }
    } catch {
      setError("Erro de rede ao salvar lançamento.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: "2rem" }}>
        Carregando contas...
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: "2rem" }}>
      <h2>Novo Lançamento Contábil</h2>

      {error && <div>{error}</div>}
      {success && <div>Lançamento salvo com sucesso!</div>}

      <form onSubmit={handleSubmit}>
        <input
          type="date"
          value={dataOcorrencia}
          onChange={(e) => setDataOcorrencia(e.target.value)}
        />

        <input
          type="text"
          placeholder="Histórico"
          value={descricaoHistorico}
          onChange={(e) => setDescricaoHistorico(e.target.value)}
        />

        {movimentacoes.map((mov) => (
          <div key={mov.id}>
            <select
              value={mov.natureza}
              onChange={(e) =>
                handleMovimentacaoChange(mov.id, "natureza", e.target.value)
              }
            >
              <option value="Debito">D</option>
              <option value="Credito">C</option>
            </select>

            <select
              value={mov.contaPaiId}
              onChange={(e) =>
                handleMovimentacaoChange(mov.id, "contaPaiId", e.target.value)
              }
            >
              <option value="">Pai</option>
              {contasPai.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>

            <select
              value={mov.contaId}
              onChange={(e) =>
                handleMovimentacaoChange(mov.id, "contaId", e.target.value)
              }
            >
              <option value="">Filha</option>
              {getContasFilhas(mov.contaPaiId).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={mov.valor}
              onChange={(e) =>
                handleMovimentacaoChange(mov.id, "valor", e.target.value)
              }
            />
          </div>
        ))}

        <button type="button" onClick={addMovimentacao}>
          Add
        </button>

        <button type="submit" disabled={!isBalanced}>
          Salvar
        </button>
      </form>
    </div>
  );
}
