import Link from 'next/link';
import { Button } from '../components/ui/Button';

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight">
        Property management, rent collection, and billing — all in one place.
      </h1>
      <p className="max-w-xl text-gray-600">
        House Rent Management is a multi-tenant platform for real estate owners: manage properties, leases, and
        tenants, and collect rent online.
      </p>
      <div className="flex gap-4">
        <Link href="/register">
          <Button>Get started</Button>
        </Link>
        <Link href="/pricing">
          <Button variant="secondary">View pricing</Button>
        </Link>
      </div>
    </main>
  );
}
