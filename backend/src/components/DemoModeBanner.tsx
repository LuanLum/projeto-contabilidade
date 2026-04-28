"use client";

import { useEmpresa } from "@/contexts/EmpresaContext";
import { TEMPLATES } from "@/lib/templates/definitions";

export default function DemoModeBanner() {
  const { isDemo, templateId, switchToDemo, switchToReal, loading } = useEmpresa();

  const templateKeys = Object.keys(TEMPLATES);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        padding: "1.25rem",
        borderRadius: "12px",
        background: isDemo
          ? "linear-gradient(135deg, rgba(251, 146, 60, 0.12), rgba(234, 88, 12, 0.08))"
          : "linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(6, 182, 212, 0.06))",
        border: `1px solid ${isDemo ? "rgba(251, 146, 60, 0.3)" : "rgba(34, 197, 94, 0.2)"}`,
        transition: "all 0.4s ease",
        animation: "slideUp 0.5s ease",
      }}
    >
      {/* Status Badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: isDemo ? "#fb923c" : "#22c55e",
              boxShadow: `0 0 8px ${isDemo ? "rgba(251,146,60,0.5)" : "rgba(34,197,94,0.5)"}`,
              animation: "pulse 2s infinite",
            }}
          />
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: isDemo ? "#fb923c" : "#22c55e" }}>
            {isDemo ? "MODO DEMONSTRACAO" : "PRODUCAO"}
          </span>
        </div>

        {isDemo && (
          <button
            onClick={switchToReal}
            style={{
              padding: "0.25rem 0.75rem",
              fontSize: "0.7rem",
              fontWeight: 600,
              borderRadius: "6px",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              background: "rgba(34, 197, 94, 0.1)",
              color: "#22c55e",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Voltar para Producao
          </button>
        )}
      </div>

      {/* Template Selector */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {templateKeys.map((key) => {
          const t = TEMPLATES[key];
          const isActive = isDemo && templateId === key;
          return (
            <button
              key={key}
              disabled={loading}
              onClick={() => switchToDemo(key)}
              style={{
                flex: 1,
                minWidth: "120px",
                padding: "0.6rem 0.5rem",
                fontSize: "0.75rem",
                fontWeight: isActive ? 700 : 500,
                borderRadius: "8px",
                border: isActive
                  ? "1px solid rgba(251, 146, 60, 0.5)"
                  : "1px solid var(--glass-border)",
                background: isActive
                  ? "rgba(251, 146, 60, 0.15)"
                  : "rgba(255,255,255,0.03)",
                color: isActive ? "#fb923c" : "var(--text-secondary)",
                cursor: loading ? "wait" : "pointer",
                transition: "all 0.2s ease",
                opacity: loading ? 0.5 : 1,
              }}
            >
              <div>{t.name}</div>
              <div style={{ fontSize: "0.65rem", opacity: 0.7, marginTop: "0.2rem" }}>
                {t.description.slice(0, 40)}...
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
