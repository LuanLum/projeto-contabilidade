"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useEmpresa } from "@/contexts/EmpresaContext";

type Conta = {
  id: number;
  codigo: string;
  nome: string;
  tipo: string;
  aceitaLancamento: boolean;
  contaPaiId: number | null;
};

const TIPO_MAP: Record<string, { label: string; color: string; bg: string }> = {
  '1': { label: 'Ativo', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
  '2': { label: 'Passivo', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  '3': { label: 'Receita', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  '4': { label: 'Despesa', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
};

export default function ContaForm({ onContaCriada }: { onContaCriada: () => void }) {
  const [todasContas, setTodasContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [contaPaiId, setContaPaiId] = useState('');

  const { empresaId } = useEmpresa();

  const carregarContas = () => {
    const headers = { "x-empresa-id": String(empresaId) };
    fetch('/api/contas', { headers })
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setTodasContas(res.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregarContas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  // Derivacao automatica do tipo pelo primeiro digito
  const tipoDerivedado = useMemo(() => {
    const d = codigo.charAt(0);
    return TIPO_MAP[d] || null;
  }, [codigo]);

  // Contas raiz (grupos)
  const contasRaiz = todasContas.filter(c => c.contaPaiId === null);

  // Auto-preencher prefixo quando selecionar pai
  const handleContaPaiChange = (value: string) => {
    setContaPaiId(value);
    if (value) {
      const pai = todasContas.find(c => c.id === Number(value));
      if (pai && !codigo.startsWith(pai.codigo)) {
        setCodigo(pai.codigo + '.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!tipoDerivedado) {
      setError('O codigo deve comecar com 1 (Ativo), 2 (Passivo), 3 (Receita) ou 4 (Despesa).');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        codigo,
        nome,
        contaPaiId: contaPaiId ? Number(contaPaiId) : null,
      };

      const res = await fetch('/api/contas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-empresa-id': String(empresaId) },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setCodigo('');
        setNome('');
        setContaPaiId('');
        carregarContas();
        onContaCriada();
      } else {
        setError(data.error || "Erro ao criar conta.");
      }
    } catch {
      setError("Erro de rede ao criar conta.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente excluir esta conta? Esta acao nao pode ser desfeita.')) return;

    try {
      const res = await fetch(`/api/contas/${id}`, { 
        method: 'DELETE', 
        headers: { 'x-empresa-id': String(empresaId) } 
      });
      const data = await res.json();

      if (res.ok && data.success) {
        carregarContas();
        onContaCriada();
      } else {
        alert(data.error || 'Erro ao excluir conta.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de rede ao excluir conta.');
    }
  };

  if (loading) return <div className="glass-panel" style={{ padding: '2rem' }}>Carregando plano de contas...</div>;

  return (
    <div className="glass-panel" style={{ padding: '2rem', animation: 'slideUp 0.6s ease' }}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>Plano de Contas</h2>

      {/* Lista de contas existentes */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Contas Cadastradas</h3>
        
        {contasRaiz.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '0.75rem', background: 'rgba(0,0,0,0.15)', borderRadius: '8px' }}>
            Nenhuma conta cadastrada ainda.
          </div>
        ) : (
          <div style={{ maxHeight: '280px', overflowY: 'auto', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', padding: '0.5rem' }}>
            {contasRaiz.map(raiz => {
              const filhas = todasContas.filter(c => c.contaPaiId === raiz.id);
              const tipoInfo = TIPO_MAP[raiz.codigo.charAt(0)];
              return (
                <div key={raiz.id} style={{ marginBottom: '0.25rem' }}>
                  <div style={{
                    padding: '0.5rem 0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      { !['1', '2', '3', '4'].includes(raiz.codigo) && (
                        <button 
                          onClick={() => handleDelete(raiz.id)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px', fontSize: '1rem', display: 'flex', alignItems: 'center' }}
                          title="Excluir conta"
                        >
                          x
                        </button>
                      )}
                      <span>{raiz.codigo} — {raiz.nome}</span>
                    </div>
                    {tipoInfo && (
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        background: tipoInfo.bg,
                        color: tipoInfo.color,
                      }}>
                        {tipoInfo.label}
                      </span>
                    )}
                  </div>
                  {filhas.map(f => (
                    <div key={f.id} style={{
                      padding: '0.35rem 0.75rem 0.35rem 2rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      borderLeft: '2px solid rgba(255,255,255,0.05)',
                      marginLeft: '0.75rem',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        { !['1', '2', '3', '4'].includes(f.codigo) && (
                          <button 
                            onClick={() => handleDelete(f.id)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}
                            title="Excluir conta"
                          >
                            x
                          </button>
                        )}
                        <span>{f.codigo} — {f.nome}</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Formulario */}
      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Cadastrar Nova Conta</h3>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', padding: '1rem', marginBottom: '1rem', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: '0.9rem' }}>{error}</div>}
        {success && <div style={{ background: 'rgba(34,197,94,0.1)', color: '#86efac', padding: '1rem', marginBottom: '1rem', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', fontSize: '0.9rem' }}>Conta criada com sucesso!</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Vincular a (Conta Pai)</label>
            <select className="input-premium" value={contaPaiId} onChange={e => handleContaPaiChange(e.target.value)}>
              <option value="">-- Nenhuma (criar como raiz) --</option>
              {todasContas.map(c => <option key={c.id} value={c.id}>{c.codigo} — {c.nome}</option>)}
            </select>
            <span style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
              Selecione a conta pai para criar uma subconta. O codigo sera pre-preenchido.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Codigo</label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input 
                type="text" 
                className="input-premium" 
                placeholder="Ex: 1.1.1" 
                value={codigo} 
                onChange={e => setCodigo(e.target.value)} 
                required 
                style={{ flex: 1 }}
              />
              {/* Badge do tipo derivado automaticamente */}
              {codigo.length > 0 && (
                tipoDerivedado ? (
                  <span style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: tipoDerivedado.bg,
                    color: tipoDerivedado.color,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                  }}>
                    {tipoDerivedado.label}
                  </span>
                ) : (
                  <span style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: 'rgba(239,68,68,0.15)',
                    color: '#ef4444',
                    whiteSpace: 'nowrap',
                  }}>
                    Digito invalido
                  </span>
                )
              )}
            </div>
            <span style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
              O tipo e derivado automaticamente: 1=Ativo, 2=Passivo, 3=Receita, 4=Despesa.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nome da Conta</label>
            <input type="text" className="input-premium" placeholder="Ex: Banco Itau" value={nome} onChange={e => setNome(e.target.value)} required />
          </div>

          <button type="submit" className="btn-secondary" style={{ marginTop: '0.5rem' }} disabled={submitting || !tipoDerivedado}>
            {submitting ? 'Adicionando...' : '+ Cadastrar Nova Conta'}
          </button>
        </form>
      </div>
    </div>
  );
}
