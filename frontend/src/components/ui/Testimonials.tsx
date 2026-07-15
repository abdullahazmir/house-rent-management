const testimonials = [
  {
    quote:
      'I stopped chasing rent checks by hand. Everything is logged automatically and I can see who’s paid at a glance.',
    name: 'Alex R.',
    role: 'Independent property owner',
  },
  {
    quote: 'Setting up a lease and inviting a tenant takes minutes instead of a stack of paperwork.',
    name: 'Morgan T.',
    role: 'Small portfolio landlord',
  },
  {
    quote: 'The renter portal makes it easy to see what I owe and pay it without emailing my landlord.',
    name: 'Jamie K.',
    role: 'Renter',
  },
];

export default function Testimonials() {
  return (
    <section className="w-full bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-wide text-primary">Testimonials</span>
          <h2 className="mt-3 text-3xl font-bold text-secondary sm:text-4xl">What people say</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {testimonials.map(({ quote, name, role }) => (
            <div key={name} className="rounded-md border border-muted p-6">
              <p className="text-sm leading-relaxed text-gray-700">&ldquo;{quote}&rdquo;</p>
              <p className="mt-4 text-sm font-medium text-secondary">{name}</p>
              <p className="text-xs text-gray-500">{role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
