import { redirect } from 'next/navigation';

export default function ElectionIndexPage() {
  redirect('/election/dashboard');
}
