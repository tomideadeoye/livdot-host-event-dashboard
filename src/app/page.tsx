import { AccessGate } from '@/components/AccessGate';
import { Dashboard } from '@/components/Dashboard';

export default function Home() {
  return (
    <main className="page">
      <AccessGate>
        <Dashboard />
      </AccessGate>
    </main>
  );
}
