import { AppShell } from '@/components/Shell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell kind="admin">{children}</AppShell>;
}
