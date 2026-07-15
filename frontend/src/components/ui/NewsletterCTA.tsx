'use client';

import { useState } from 'react';
import { Button } from './Button';

export default function NewsletterCTA() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="w-full bg-secondary py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">Stay in the loop</h2>
        <p className="mt-3 text-highlight">
          Get occasional product updates — new features, plan changes, nothing else.
        </p>

        {submitted ? (
          <p className="mt-8 text-white">Thanks — we&apos;ll be in touch at {email}.</p>
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-md border-0 px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-highlight"
            />
            <Button type="submit" className="sm:w-auto">
              Notify me
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
