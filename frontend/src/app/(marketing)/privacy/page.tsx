export default function PrivacyPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-secondary">Privacy policy</h1>
        <p className="mt-4 text-sm text-gray-500">Last updated: 2026</p>

        <h2 className="mt-8 text-xl font-semibold text-secondary">What we collect</h2>
        <p className="mt-3 text-gray-700">
          We collect the information you provide when you register (name, email, and — for property owners — company
          details), plus the property, unit, lease, and payment records you create while using the platform. Payment
          processing is handled entirely by Stripe; we never store your card details ourselves.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-secondary">How we use it</h2>
        <p className="mt-3 text-gray-700">
          Your data is used to operate your account: authenticating you, scoping your properties and tenants so no
          other owner can see them, generating rent payments, and processing subscription billing. We do not sell
          your data to third parties.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-secondary">Data isolation</h2>
        <p className="mt-3 text-gray-700">
          Every owner&apos;s properties, units, leases, tenants, and payments are strictly isolated from every other
          owner&apos;s data. Renters can only see the lease and payment information tied to their own tenancy.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-secondary">Contact</h2>
        <p className="mt-3 text-gray-700">
          Questions about this policy can be sent to{' '}
          <a href="mailto:support@houserent.dev" className="font-medium text-secondary underline">
            support@houserent.dev
          </a>
          .
        </p>
      </div>
    </main>
  );
}
