const stats = [
  { value: 'Unlimited', label: 'Properties per plan tier' },
  { value: 'Stripe Connect', label: 'Direct-to-bank payouts' },
  { value: '4 roles', label: 'Owner, staff, renter & admin access' },
  { value: 'Real-time', label: 'Occupancy & rent-collection tracking' },
];

export default function StatsSection() {
  return (
    <section className="w-full bg-muted/30 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold text-secondary sm:text-3xl">{value}</p>
              <p className="mt-2 text-sm text-brown">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
