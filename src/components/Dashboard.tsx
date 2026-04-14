"use client";

import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

type DashboardData = {
  patrimonial: { name: string, valor: number, fill: string }[];
  resultado: { name: string, valor: number, fill: string }[];
  saldos: {
    Ativo: number, Passivo: number, Receita: number, Despesa: number
  };
};

export default function Dashboard({ refreshTrigger }: { refreshTrigger: number }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard').then(res => res.json()),
      fetch('/api/lancamentos').then(res => res.json())
    ])
    .then(([dashRes, lancRes]) => {
      if (dashRes.success && dashRes.data) {
        setData(dashRes.data);
      }
      if (lancRes.success && lancRes.data) {
        setLancamentos(lancRes.data);
      }
    })
    .catch(err => console.error("Erro no dashboard:", err))
    .finally(() => setLoading(false));
  }, [refreshTrigger]);

  if (loading) return <div className="glass-panel" style={{ padding: '2rem', height: '100%', minHeight: '300px' }}>Carregando gráficos...</div>;
  if (!data) return <div className="glass-panel" style={{ padding: '2rem', color: '#ef4444' }}>Erro ao carregar dados.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="glass-panel" style={{ padding: '2rem', animation: 'slideUp 0.6s ease' }}>
        <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Posição Patrimonial</h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1, padding: '1rem', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '8px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Ativos</div>
            <div style={{ fontSize: '1.8rem', color: '#06b6d4', fontWeight: 700 }}>R$ {data.saldos.Ativo.toFixed(2)}</div>
          </div>
          <div style={{ flex: 1, padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Passivos</div>
            <div style={{ fontSize: '1.8rem', color: '#8b5cf6', fontWeight: 700 }}>R$ {data.saldos.Passivo.toFixed(2)}</div>
          </div>
        </div>
        
        <div style={{ height: '300px', width: '100%', marginTop: '2rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.patrimonial} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} />
              <YAxis stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} />
              <Tooltip cursor={{fill: 'var(--glass-border)'}} contentStyle={{background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px'}} />
              <Bar dataKey="valor" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', animation: 'slideUp 0.8s ease' }}>
        <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>DRE (Resultado)</h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1, padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Receitas</div>
            <div style={{ fontSize: '1.8rem', color: '#22c55e', fontWeight: 700 }}>R$ {data.saldos.Receita.toFixed(2)}</div>
          </div>
          <div style={{ flex: 1, padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Despesas</div>
            <div style={{ fontSize: '1.8rem', color: '#ef4444', fontWeight: 700 }}>R$ {data.saldos.Despesa.toFixed(2)}</div>
          </div>
        </div>

        <div style={{ height: '300px', width: '100%', marginTop: '2rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.resultado} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} />
              <YAxis stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} />
              <Tooltip cursor={{fill: 'var(--glass-border)'}} contentStyle={{background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px'}} />
              <Bar dataKey="valor" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', animation: 'slideUp 1.0s ease' }}>
        <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Histórico Recente</h2>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Data</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Histórico</th>
                <th style={{ padding: '1rem', fontWeight: 500, textAlign: 'right' }}>Débitos</th>
                <th style={{ padding: '1rem', fontWeight: 500, textAlign: 'right' }}>Créditos</th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              ) : (
                lancamentos.map((lanc) => {
                  const dataOcorrencia = new Date(lanc.dataOcorrencia).toLocaleDateString('pt-BR');
                  const debitos = lanc.movimentacoes
                    .filter((m: any) => m.natureza === 'Debito')
                    .reduce((acc: number, curr: any) => acc + parseFloat(curr.valor), 0);
                  const creditos = lanc.movimentacoes
                    .filter((m: any) => m.natureza === 'Credito')
                    .reduce((acc: number, curr: any) => acc + parseFloat(curr.valor), 0);

                  return (
                    <tr key={lanc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '1rem' }}>{dataOcorrencia}</td>
                      <td style={{ padding: '1rem' }}>{lanc.descricaoHistorico}</td>
                      <td style={{ padding: '1rem', color: '#06b6d4', textAlign: 'right', fontWeight: 500 }}>R$ {debitos.toFixed(2)}</td>
                      <td style={{ padding: '1rem', color: '#8b5cf6', textAlign: 'right', fontWeight: 500 }}>R$ {creditos.toFixed(2)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
