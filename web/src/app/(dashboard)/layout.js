import AppShell  from "@/components/layout/app-shell";
import TermsGate from "@/components/legal/TermsGate";

export default function DashboardLayout({ children }) {
  return (
    <AppShell>
      <TermsGate>{children}</TermsGate>
    </AppShell>
  );
}
