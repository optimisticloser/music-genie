import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <main className="container mx-auto p-6">{children}</main>;
} 