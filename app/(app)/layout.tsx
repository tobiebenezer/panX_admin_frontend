import { AppShell } from '@/components/Shell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell kind="admin">{children}</AppShell>;
}

