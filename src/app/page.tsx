"use client";

import { useState } from "react";
import LancamentoForm from "@/components/LancamentoForm";
import Dashboard from "@/components/Dashboard";
import ContaForm from "@/components/ContaForm";
import DemoModeBanner from "@/components/DemoModeBanner";
import { useEmpresa } from "@/contexts/EmpresaContext";

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { empresaId, isDemo, empresaNome } = useEmpresa();

  return (
    <main className="page-container">
      <header
        style={{
          marginBottom: "2rem",
          textAlign: "center",
          animation: "slideUp 0.4s ease",
        }}
      >
        <h1>Sistema Contabil</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem", fontSize: "0.85rem" }}>
          {empresaNome}
        </p>
      </header>

      {/* Demo Mode Controls */}
      <div style={{ marginBottom: "2rem", maxWidth: "900px", marginInline: "auto" }}>
        <DemoModeBanner />
      </div>

      <div className="grid-dashboard">
        <aside
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div onClick={() => setRefreshTrigger((prev) => prev + 1)}>
            <LancamentoForm />
          </div>
          <ContaForm
            onContaCriada={() => setRefreshTrigger((prev) => prev + 1)}
          />
        </aside>

        <section>
          <Dashboard refreshTrigger={refreshTrigger} />
        </section>
      </div>

      <footer
        style={{
          marginTop: "4rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
          color: "var(--text-secondary)",
          fontSize: "0.9rem",
          borderTop: "1px solid var(--glass-border)",
          paddingTop: "2rem",
        }}
      >
        <button
          onClick={async () => {
            if (confirm("ATENCAO: Esta acao ira apagar TODOS os lancamentos, movimentacoes e contas desta empresa. Deseja realmente prosseguir?")) {
              try {
                const res = await fetch("/api/system/reset", { 
                  method: "POST",
                  headers: { "x-empresa-id": String(empresaId) }
                });
                const data = await res.json();
                if (data.success) {
                  alert("Sistema resetado com sucesso!");
                  window.location.reload();
                } else {
                  alert("Erro ao resetar sistema: " + data.error);
                }
              } catch (err) {
                console.error(err);
                alert("Erro de rede ao resetar sistema.");
              }
            }
          }}
          className="btn-danger"
          style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", opacity: 0.7 }}
        >
          Resetar Banco de Dados {isDemo ? "(Demo)" : "(Producao)"}
        </button>
        <div>WIP Contabilidade</div>
      </footer>
    </main>
  );
}
