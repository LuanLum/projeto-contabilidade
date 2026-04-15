"use client";

import React, { useEffect, useState } from "react";
import { useEmpresa } from "@/contexts/EmpresaContext";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type DashboardData = {
  patrimonial: { name: string; valor: number; fill: string }[];
  resultado: { name: string; valor: number; fill: string }[];
  saldos: {
    Ativo: number;
    Passivo: number;
    Receita: number;
    Despesa: number;
  };
};

type RelatoriosData = {
  diario: any[];
  razao: any[];
  balancete: {
    contas: any[];
    totais: { debitos: number; creditos: number };
  };
};

export default function Dashboard({
  refreshTrigger,
}: {
  refreshTrigger: number;
}) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [relatorios, setRelatorios] = useState<RelatoriosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'diario' | 'razao' | 'balancete'>('diario');

  const { empresaId, isDemo } = useEmpresa();

  useEffect(() => {
    setLoading(true);
    const headers = { "x-empresa-id": String(empresaId) };
    Promise.all([
      fetch("/api/dashboard", { headers }).then((res) => res.json()),
      fetch("/api/relatorios", { headers }).then((res) => res.json()),
    ])
      .then(([dashRes, relRes]) => {
        if (dashRes.success && dashRes.data) {
          setData(dashRes.data);
        }
        if (relRes.success && relRes.data) {
          setRelatorios(relRes.data);
        }
      })
      .catch((err) => console.error("Erro no dashboard:", err))
      .finally(() => setLoading(false));
  }, [refreshTrigger, empresaId]);

  if (loading)
    return (
      <div
        className="glass-panel"
        style={{ padding: "2rem", height: "100%", minHeight: "300px" }}
      >
        Carregando painel e relatórios...
      </div>
    );
  if (!data || !relatorios)
    return (
      <div
        className="glass-panel"
        style={{ padding: "2rem", color: "#ef4444" }}
      >
        Erro ao carregar dados.
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div
        className="glass-panel"
        style={{ padding: "2rem", animation: "slideUp 0.6s ease" }}
      >
        <h2 style={{ marginBottom: "1.5rem", fontWeight: 600 }}>
          Posição Patrimonial
        </h2>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <div
            style={{
              flex: 1,
              padding: "1rem",
              background: "rgba(6, 182, 212, 0.1)",
              borderRadius: "8px",
              border: "1px solid rgba(6, 182, 212, 0.2)",
            }}
          >
            <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              Total Ativos
            </div>
            <div
              style={{ fontSize: "1.8rem", color: "#06b6d4", fontWeight: 700 }}
            >
              R$ {data.saldos.Ativo.toFixed(2)}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              padding: "1rem",
              background: "rgba(139, 92, 246, 0.1)",
              borderRadius: "8px",
              border: "1px solid rgba(139, 92, 246, 0.2)",
            }}
          >
            <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              Total Passivos
            </div>
            <div
              style={{ fontSize: "1.8rem", color: "#8b5cf6", fontWeight: 700 }}
            >
              R$ {data.saldos.Passivo.toFixed(2)}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              padding: "1rem",
              background: "rgba(250, 204, 21, 0.1)",
              borderRadius: "8px",
              border: "1px solid rgba(250, 204, 21, 0.2)",
            }}
          >
            <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              Patrimonio Liquido
            </div>
            <div
              style={{ fontSize: "1.8rem", color: "#facc15", fontWeight: 700 }}
            >
              R$ {(data.saldos.Ativo - data.saldos.Passivo).toFixed(2)}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Ativo - Passivo
            </div>
          </div>
        </div>

        <div style={{ height: "300px", width: "100%", marginTop: "2rem" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.patrimonial}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--glass-border)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="var(--text-secondary)"
                tick={{ fill: "var(--text-secondary)" }}
              />
              <YAxis
                stroke="var(--text-secondary)"
                tick={{ fill: "var(--text-secondary)" }}
              />
              <Tooltip
                cursor={{ fill: "var(--glass-border)" }}
                contentStyle={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="valor" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div
        className="glass-panel"
        style={{ padding: "2rem", animation: "slideUp 0.8s ease" }}
      >
        <h2 style={{ marginBottom: "1.5rem", fontWeight: 600 }}>
          DRE (Resultado)
        </h2>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <div
            style={{
              flex: 1,
              padding: "1rem",
              background: "rgba(34, 197, 94, 0.1)",
              borderRadius: "8px",
              border: "1px solid rgba(34, 197, 94, 0.2)",
            }}
          >
            <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              Total Receitas
            </div>
            <div
              style={{ fontSize: "1.8rem", color: "#22c55e", fontWeight: 700 }}
            >
              R$ {data.saldos.Receita.toFixed(2)}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              padding: "1rem",
              background: "rgba(239, 68, 68, 0.1)",
              borderRadius: "8px",
              border: "1px solid rgba(239, 68, 68, 0.2)",
            }}
          >
            <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              Total Despesas
            </div>
            <div
              style={{ fontSize: "1.8rem", color: "#ef4444", fontWeight: 700 }}
            >
              R$ {data.saldos.Despesa.toFixed(2)}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              padding: "1rem",
              background: (data.saldos.Receita - data.saldos.Despesa) >= 0 ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
              borderRadius: "8px",
              border: `1px solid ${(data.saldos.Receita - data.saldos.Despesa) >= 0 ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
              transition: "all 0.3s ease",
            }}
          >
            <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              {(data.saldos.Receita - data.saldos.Despesa) >= 0 ? "Resultado (Lucro)" : "Resultado (Prejuizo)"}
            </div>
            <div
              style={{ 
                fontSize: "1.8rem", 
                color: (data.saldos.Receita - data.saldos.Despesa) >= 0 ? "#22c55e" : "#ef4444", 
                fontWeight: 700 
              }}
            >
              R$ {Math.abs(data.saldos.Receita - data.saldos.Despesa).toFixed(2)}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Receita - Despesa
            </div>
          </div>
        </div>

        <div style={{ height: "300px", width: "100%", marginTop: "2rem" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.resultado}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--glass-border)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="var(--text-secondary)"
                tick={{ fill: "var(--text-secondary)" }}
              />
              <YAxis
                stroke="var(--text-secondary)"
                tick={{ fill: "var(--text-secondary)" }}
              />
              <Tooltip
                cursor={{ fill: "var(--glass-border)" }}
                contentStyle={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="valor" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div
        className="glass-panel"
        style={{ padding: "2rem", animation: "slideUp 1.0s ease" }}
      >
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem", borderBottom: "1px solid var(--glass-border)", paddingBottom: "1rem" }}>
          <button 
            onClick={() => setActiveTab('diario')} 
            className={activeTab === 'diario' ? 'btn-primary' : 'btn-secondary'} 
            style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', outline: 'none', border: 'none', fontWeight: 600, transition: '0.2s' }}
          >
            Livro Diario
          </button>
          <button 
            onClick={() => setActiveTab('razao')} 
            className={activeTab === 'razao' ? 'btn-primary' : 'btn-secondary'} 
            style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', outline: 'none', border: 'none', fontWeight: 600, transition: '0.2s' }}
          >
            Livro Razao
          </button>
          <button 
            onClick={() => setActiveTab('balancete')} 
            className={activeTab === 'balancete' ? 'btn-primary' : 'btn-secondary'} 
            style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', outline: 'none', border: 'none', fontWeight: 600, transition: '0.2s' }}
          >
            Balancete
          </button>
        </div>

        <div style={{ minHeight: "300px" }}>

        {/* TAB 1: DIÁRIO */}
        {activeTab === 'diario' && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <h2 style={{ marginBottom: "1.5rem", fontWeight: 600 }}>Livro Diario (Registro Cronologico)</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--glass-border)", color: "var(--text-secondary)" }}>
                    <th style={{ padding: "1rem", fontWeight: 500 }}>Data</th>
                    <th style={{ padding: "1rem", fontWeight: 500 }}>Histórico</th>
                    <th style={{ padding: "1rem", fontWeight: 500 }}>Conta(s) de Débito</th>
                    <th style={{ padding: "1rem", fontWeight: 500 }}>Conta(s) de Crédito</th>
                    <th style={{ padding: "1rem", fontWeight: 500, textAlign: "right" }}>Valor R$</th>
                  </tr>
                </thead>
                <tbody>
                  {relatorios.diario.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "1rem", textAlign: "center", color: "var(--text-secondary)" }}>
                        Nenhuma transação encontrada.
                      </td>
                    </tr>
                  ) : (
                    relatorios.diario.map((lanc) => (
                      <tr key={lanc.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "1rem" }}>{new Date(lanc.data).toLocaleDateString("pt-BR")}</td>
                        <td style={{ padding: "1rem", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={lanc.historico}>{lanc.historico}</td>
                        <td style={{ padding: "1rem", color: "#06b6d4" }}>{lanc.contasDebito}</td>
                        <td style={{ padding: "1rem", color: "#8b5cf6" }}>{lanc.contasCredito}</td>
                        <td style={{ padding: "1rem", textAlign: "right", fontWeight: "bold" }}>{lanc.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: RAZÃO */}
        {activeTab === 'razao' && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem", animation: "fadeIn 0.3s ease" }}>
            <h2 style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Livro Razao (Movimentacao por Conta)</h2>
            {relatorios.razao.map((grupo) => (
              <div key={grupo.conta.codigo} style={{ background: "rgba(0,0,0,0.15)", borderRadius: "8px", padding: "1.5rem", border: "1px solid var(--glass-border)" }}>
                <h3 style={{ marginBottom: "1rem", color: "var(--text-primary)", display: "flex", justifyContent: "space-between" }}>
                  <span>{grupo.conta.codigo} - {grupo.conta.nome} ({grupo.conta.tipo})</span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Saldo Atual: <strong style={{ color: "#22c55e", fontSize: "1.1rem" }}>{grupo.saldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></span>
                </h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)" }}>
                        <th style={{ padding: "0.75rem", fontWeight: 500 }}>Data</th>
                        <th style={{ padding: "0.75rem", fontWeight: 500 }}>Histórico</th>
                        <th style={{ padding: "0.75rem", fontWeight: 500, textAlign: "right" }}>Débito</th>
                        <th style={{ padding: "0.75rem", fontWeight: 500, textAlign: "right" }}>Crédito</th>
                        <th style={{ padding: "0.75rem", fontWeight: 500, textAlign: "right", borderLeft: "1px dashed rgba(255,255,255,0.1)" }}>Saldo D/C</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grupo.movimentos.map((mov: any) => (
                        <tr key={mov.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                          <td style={{ padding: "0.75rem" }}>{new Date(mov.data).toLocaleDateString("pt-BR")}</td>
                          <td style={{ padding: "0.75rem" }}>{mov.historico}</td>
                          <td style={{ padding: "0.75rem", textAlign: "right", color: "#06b6d4" }}>{mov.debito ? mov.debito.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</td>
                          <td style={{ padding: "0.75rem", textAlign: "right", color: "#8b5cf6" }}>{mov.credito ? mov.credito.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</td>
                          <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: "bold", borderLeft: "1px dashed rgba(255,255,255,0.1)" }}>{mov.saldoMomento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: BALANCETE */}
        {activeTab === 'balancete' && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <h2 style={{ marginBottom: "1.5rem", fontWeight: 600 }}>Balancete de Verificacao</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--glass-border)", color: "var(--text-secondary)" }}>
                    <th style={{ padding: "1rem", fontWeight: 500 }}>Conta</th>
                    <th style={{ padding: "1rem", fontWeight: 500, textAlign: "right" }}>Débitos Acumulados</th>
                    <th style={{ padding: "1rem", fontWeight: 500, textAlign: "right" }}>Créditos Acumulados</th>
                    <th style={{ padding: "1rem", fontWeight: 500, textAlign: "right", borderLeft: "1px dashed rgba(255,255,255,0.1)" }}>Saldo Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {relatorios.balancete.contas.map((c) => (
                    <tr key={c.codigo} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "1rem" }}>{c.codigo} - {c.nome} <span style={{fontSize: '0.8rem', color: "var(--text-secondary)", opacity: 0.7}}>({c.tipo})</span></td>
                      <td style={{ padding: "1rem", textAlign: "right", color: "#06b6d4" }}>{c.debitos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: "1rem", textAlign: "right", color: "#8b5cf6" }}>{c.creditos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: "1rem", textAlign: "right", fontWeight: "bold", borderLeft: "1px dashed rgba(255,255,255,0.1)" }}>{c.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: "2px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.2)" }}>
                    <td style={{ padding: "1rem", fontWeight: "bold" }}>SOMA TOTAL (Conferência das Partidas)</td>
                    <td style={{ padding: "1rem", textAlign: "right", fontWeight: "bold", color: "#06b6d4" }}>{relatorios.balancete.totais.debitos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: "1rem", textAlign: "right", fontWeight: "bold", color: "#8b5cf6" }}>{relatorios.balancete.totais.creditos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: "1rem", textAlign: "center", borderLeft: "1px dashed rgba(255,255,255,0.1)", fontSize: "1.2rem", fontWeight: 'bold' }}>
                       {Math.abs(relatorios.balancete.totais.debitos - relatorios.balancete.totais.creditos) < 0.01 
                          ? <span style={{ color: "#22c55e" }}>Fechado</span> 
                          : <span style={{ color: "#ef4444" }}>Divergencia</span>}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
