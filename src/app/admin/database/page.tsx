import { DatabaseClient } from './DatabaseClient';
import { hasDbUrl } from '@/lib/db/admin';

export default function AdminDatabasePage() {
  return <DatabaseClient hasDbUrl={hasDbUrl} />;
}
