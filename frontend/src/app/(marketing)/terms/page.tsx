export default function TermsPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-secondary">Terms of service</h1>
        <p className="mt-4 text-sm text-gray-500">Last updated: 2026</p>

        <h2 className="mt-8 text-xl font-semibold text-secondary">Using the platform</h2>
        <p className="mt-3 text-gray-700">
          By creating an account you agree to provide accurate information about yourself and your properties, and to
          use the platform only for legitimate property management and rental purposes.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-secondary">Subscriptions and billing</h2>
        <p className="mt-3 text-gray-700">
          Property owner accounts are billed on a recurring subscription through Stripe Billing according to the plan
          selected. Subscriptions can be managed, upgraded, or cancelled at any time from the billing settings page.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-secondary">Rent payments</h2>
        <p className="mt-3 text-gray-700">
          Online rent payments are processed through Stripe Connect and paid out directly to the property owner. The
          platform records payment status but is not a party to the lease agreement between an owner and a renter.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-secondary">Account suspension</h2>
        <p className="mt-3 text-gray-700">
          Accounts may be suspended for violating these terms, non-payment of subscription fees, or fraudulent
          activity.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-secondary">Contact</h2>
        <p className="mt-3 text-gray-700">
          Questions about these terms can be sent to{' '}
          <a href="mailto:support@houserent.dev" className="font-medium text-secondary underline">
            support@houserent.dev
          </a>
          .
        </p>
      </div>
    </main>
  );
}
