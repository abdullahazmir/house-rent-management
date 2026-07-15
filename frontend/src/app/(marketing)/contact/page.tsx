'use client';

import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-secondary">Contact us</h1>
        <p className="mt-4 text-gray-700">
          Questions about a plan, a bug to report, or feedback on the product? Reach us at{' '}
          <a href="mailto:support@houserent.dev" className="font-medium text-secondary underline">
            support@houserent.dev
          </a>{' '}
          or use the form below.
        </p>

        {submitted ? (
          <p className="mt-8 rounded-md border border-muted p-6 text-secondary">
            Thanks, {name || 'there'} — we&apos;ve received your message and will reply to {email} soon.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-secondary">Message</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="rounded-md border border-secondary/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button type="submit" className="sm:w-auto">
              Send message
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
