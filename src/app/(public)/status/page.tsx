import { StatusPublicClient } from './StatusPublicClient';

export const metadata = {
  title: 'Lumina Status - Realtime System Monitoring',
  description: 'Check the real-time status of Lumina services, AI Providers, and Infrastructure.',
};

export default function StatusPage() {
  return <StatusPublicClient />;
}
