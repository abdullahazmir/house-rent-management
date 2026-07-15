'use client';

import { useState } from 'react';

const faqs = [
  {
    question: 'How does rent collection work?',
    answer:
      'Owners create a lease and invite a tenant (or a renter can self-register and rent a publicly listed unit). Rent payments are generated automatically each month and can be paid online through Stripe or recorded manually.',
  },
  {
    question: 'Do you take a cut of rent payments?',
    answer:
      'Rent flows from the renter to the owner’s bank account via Stripe Connect. Any platform fee is configurable per plan, not hidden in the payment flow.',
  },
  {
    question: 'What happens if I have more than one property?',
    answer:
      'Every plan tier supports multiple properties and units. Your dashboard shows occupancy and rent status across your whole portfolio in one place.',
  },
  {
    question: 'Can renters browse available houses without an account?',
    answer:
      'Yes — anyone can search and view listing details. Creating an account is only required to actually rent a house or manage a property.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="w-full bg-muted/30 py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-10 text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-primary">FAQ</span>
          <h2 className="mt-3 text-3xl font-bold text-secondary sm:text-4xl">Frequently asked questions</h2>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={faq.question} className="rounded-md border border-muted bg-white">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-secondary"
                >
                  {faq.question}
                  <span className="ml-4 text-lg text-primary">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen ? <p className="px-5 pb-4 text-sm text-gray-600">{faq.answer}</p> : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
