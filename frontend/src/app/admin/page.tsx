import Link from 'next/link';

export default function AdminHomePage() {
  return (
    <main className="flex-1 p-8">
      <h1 className="mb-6 text-xl font-semibold">Super Admin</h1>
      <Link href="/admin/owners" className="inline-block rounded-md border border-gray-200 p-4 hover:bg-gray-50">
        <p className="font-medium">Real estate owners</p>
        <p className="text-sm text-gray-500">View, suspend, and activate owner accounts</p>
      </Link>
    </main>
  );
}
