"use client";

import React, { useState, useEffect } from 'react';

type Conta = {
  id: number;
  codigo: string;
  nome: string;
  tipo: string;
  contaPaiId: number | null;
};

export default function ContaForm({ onContaCriada }: { onContaCriada: () => void }) {
  const [contasPai, setContasPai] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('');
  const [contaPaiId, setContaPaiId] = useState('');

  const carregarContas = () => {
    fetch('/api/contas')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          // Apenas contas podem ser definidas como pai
          setContasPai(res.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregarContas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    try {
      const payload = {
        codigo,
        nome,
        tipo,
        contaPaiId: contaPaiId ? Number(contaPaiId) : null,
        aceitaLancamento: true
      };

      const res = await fetch('/api/contas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setCodigo('');
        setNome('');
        setTipo('');
        setContaPaiId('');
        carregarContas();
        onContaCriada();
      } else {
        setError(data.error || "Erro ao criar conta.");
      }
    } catch (err) {
      setError("Erro de rede ao criar conta.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="glass-panel" style={{ padding: '2rem' }}>Carregando plano de contas...</div>;

  return (
    <div className="glass-panel" style={{ padding: '2rem', animation: 'slideUp 0.6s ease' }}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>Nova Conta (Plano de Contas)</h2>

      {error && <div className="glass-panel" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', padding: '1rem', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.3)' }}>{error}</div>}
      {success && <div className="glass-panel" style={{ background: 'rgba(34,197,94,0.1)', color: '#86efac', padding: '1rem', marginBottom: '1.5rem', border: '1px solid rgba(34,197,94,0.3)' }}>Conta criada com sucesso!</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Código</label>
            <input type="text" className="input-premium" placeholder="Ex: 1.1.1" value={codigo} onChange={e => setCodigo(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Nome da Conta</label>
            <input type="text" className="input-premium" placeholder="Ex: Banco Itaú" value={nome} onChange={e => setNome(e.target.value)} required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Tipo</label>
            <select className="input-premium" value={tipo} onChange={e => setTipo(e.target.value)} required>
              <option value="">Selecione o Tipo</option>
              <option value="Ativo">Ativo</option>
              <option value="Passivo">Passivo</option>
              <option value="Receita">Receita</option>
              <option value="Despesa">Despesa</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Conta Pai (Opcional)</label>
            <select className="input-premium" value={contaPaiId} onChange={e => setContaPaiId(e.target.value)}>
              <option value="">-- Raiz --</option>
              {contasPai.map(c => <option key={c.id} value={c.id}>{c.codigo} - {c.nome}</option>)}
            </select>
          </div>
        </div>

        <button type="submit" className="btn-secondary" style={{ marginTop: '0.5rem' }} disabled={submitting}>
          {submitting ? 'Adicionando...' : '+ Cadastrar Nova Conta'}
        </button>

      </form>
    </div>
  );
}
