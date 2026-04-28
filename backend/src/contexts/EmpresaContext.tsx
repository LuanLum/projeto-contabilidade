"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface EmpresaContextType {
  empresaId: number;
  empresaNome: string;
  isDemo: boolean;
  templateId: string | null;
  switchToDemo: (templateId: string) => Promise<void>;
  switchToReal: () => void;
  loading: boolean;
}

const EmpresaContext = createContext<EmpresaContextType | null>(null);

export function useEmpresa() {
  const ctx = useContext(EmpresaContext);
  if (!ctx) throw new Error("useEmpresa must be used within EmpresaProvider");
  return ctx;
}

/**
 * Retorna os headers com o x-empresa-id configurado.
 * Todos os fetch() da aplicação usam esta função.
 */
export function useEmpresaHeaders(): Record<string, string> {
  const { empresaId } = useEmpresa();
  return { "x-empresa-id": String(empresaId) };
}

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const [empresaId, setEmpresaId] = useState<number>(1);
  const [empresaNome, setEmpresaNome] = useState("Minha Empresa Real");
  const [isDemo, setIsDemo] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const switchToDemo = useCallback(async (newTemplateId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/demo/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: newTemplateId }),
      });
      const data = await res.json();
      if (data.success) {
        setEmpresaId(data.empresaId);
        setEmpresaNome(`DEMO - ${newTemplateId}`);
        setIsDemo(true);
        setTemplateId(newTemplateId);
      } else {
        alert("Erro ao ativar modo demo: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Erro de rede ao ativar modo demo.");
    } finally {
      setLoading(false);
    }
  }, []);

  const switchToReal = useCallback(() => {
    setEmpresaId(1);
    setEmpresaNome("Minha Empresa Real");
    setIsDemo(false);
    setTemplateId(null);
  }, []);

  return (
    <EmpresaContext.Provider
      value={{
        empresaId,
        empresaNome,
        isDemo,
        templateId,
        switchToDemo,
        switchToReal,
        loading,
      }}
    >
      {children}
    </EmpresaContext.Provider>
  );
}
