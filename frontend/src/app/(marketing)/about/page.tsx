export default function AboutPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-secondary">About House Rent Management</h1>
        <p className="mt-4 text-gray-700">
          House Rent Management is a multi-tenant platform built for independent real estate owners and small
          landlords who are tired of juggling spreadsheets, paper leases, and manual rent tracking. Every owner gets
          their own isolated workspace to manage properties, units, leases, and tenants, with rent collection and
          subscription billing handled through Stripe.
        </p>
        <p className="mt-4 text-gray-700">
          Our goal is simple: give owners the tools that property management giants have, without the enterprise
          price tag or the bloat. One dashboard for your whole portfolio, one flat subscription, and a renter portal
          your tenants will actually want to use.
        </p>
        <h2 className="mt-8 text-xl font-semibold text-secondary">What we handle for you</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-700">
          <li>Property, unit, and lease management with owner-level data isolation</li>
          <li>Automated monthly rent generation with configurable late fees</li>
          <li>Online rent payments via Stripe Connect, with payouts straight to your bank account</li>
          <li>Subscription billing for your own account via Stripe Billing</li>
          <li>A self-serve renter portal for lease details, payment history, and receipts</li>
        </ul>
      </div>
    </main>
  );
}
