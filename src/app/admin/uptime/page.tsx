import { Metadata } from 'next';
import UptimeClient from './UptimeClient';

export const metadata: Metadata = {
  title: 'Uptime Center | AI Control Center',
  description: 'Trung tâm giám sát hệ thống thời gian thực.',
};

export default function UptimePage() {
  return <UptimeClient />;
}
