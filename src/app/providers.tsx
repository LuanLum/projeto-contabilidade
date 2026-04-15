"use client";

import { EmpresaProvider } from "@/contexts/EmpresaContext";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return <EmpresaProvider>{children}</EmpresaProvider>;
}
