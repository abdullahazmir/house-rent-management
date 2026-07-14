import Link from 'next/link';
import { Button } from '../components/ui/Button';

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-4 text-center sm:p-6 lg:p-8">
      <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
        Property management, rent collection, and billing — all in one place.
      </h1>
      <p className="max-w-xl text-gray-600">
        House Rent Management is a multi-tenant platform for real estate owners: manage properties, leases, and
        tenants, and collect rent online.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link href="/register">
          <Button className="w-full sm:w-auto">Get started</Button>
        </Link>
        <Link href="/pricing">
          <Button variant="secondary" className="w-full sm:w-auto">
            View pricing
          </Button>
        </Link>
      </div>
    </main>
  );
}
