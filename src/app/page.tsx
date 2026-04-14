"use client";

import { useState } from 'react';
import LancamentoForm from '@/components/LancamentoForm';
import Dashboard from '@/components/Dashboard';
import ContaForm from '@/components/ContaForm';

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <main className="page-container">
      <header style={{ marginBottom: '3rem', textAlign: 'center', animation: 'slideUp 0.4s ease' }}>
        <h1>Sistema Contábil Core</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Gestão patrimonial por partidas dobradas
        </p>
      </header>

      <div className="grid-dashboard">
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div onClick={() => setRefreshTrigger(prev => prev + 1)}>
            <LancamentoForm />
          </div>
          <ContaForm onContaCriada={() => setRefreshTrigger(prev => prev + 1)} />
        </aside>

        <section>
          <Dashboard refreshTrigger={refreshTrigger} />
        </section>
      </div>

      <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
        Antigravity Contábil &copy; 2026. Lógica estrita. Total Precisão.
      </footer>
    </main>
  );
}
