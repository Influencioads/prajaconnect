'use client';

import * as React from 'react';
import Link from 'next/link';
import { Mail, MapPin, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Reveal } from '@/components/marketing/reveal';

const DEMO_ACCOUNTS = [
  { role: 'Super Admin', email: 'admin@praja.in' },
  { role: 'Constituency Incharge', email: 'leader@praja.in' },
  { role: 'Government Official', email: 'official@praja.in' },
  { role: 'Volunteer', email: 'volunteer@praja.in' },
];

const CONTACT_EMAIL = 'hello@prajaconnect.in';

export default function ContactPage() {
  const [submitted, setSubmitted] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', org: '', email: '', message: '' });

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`Demo request — ${form.org || form.name || 'Praja Connect'}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nOrganisation: ${form.org}\nEmail: ${form.email}\n\n${form.message}`,
    );
    // No backend wired — compose an email the visitor can send.
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }

  return (
    <>
      <section className="relative overflow-hidden bg-navy text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-gold/20 blur-[110px]"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
          <Reveal className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">Get in touch</p>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Request a guided demo
            </h1>
            <p className="mt-5 text-base leading-relaxed text-white/70 sm:text-lg">
              Tell us a little about your organisation and we&apos;ll walk you through Praja Connect
              with realistic demo data. Already onboarded? Just{' '}
              <Link href="/login" className="font-semibold text-gold hover:underline">
                log in
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          {/* form */}
          <Reveal className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/20 text-gold-600">
                  <Check className="h-7 w-7" strokeWidth={3} />
                </div>
                <h2 className="mt-5 font-display text-xl font-semibold text-navy dark:text-white">
                  Your email is ready to send
                </h2>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  We opened your mail app with the details filled in. Send it across and our team
                  will get back to you shortly.
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => setSubmitted(false)}
                >
                  Edit the request
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your name</Label>
                    <Input id="name" required value={form.name} onChange={update('name')} placeholder="Sai Kumar" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org">Organisation</Label>
                    <Input id="org" value={form.org} onChange={update('org')} placeholder="Constituency office" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={update('email')}
                    placeholder="you@example.in"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">What would you like to see?</Label>
                  <textarea
                    id="message"
                    value={form.message}
                    onChange={update('message')}
                    rows={4}
                    placeholder="We'd like to map our cadre and track grievances…"
                    className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <Button type="submit" variant="gold" size="lg" className="w-full sm:w-auto">
                  Request demo
                  <ArrowRight />
                </Button>
              </form>
            )}
          </Reveal>

          {/* side info */}
          <Reveal delay={120} className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy/5 text-navy dark:bg-white/10 dark:text-white">
                  <Mail className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display font-semibold text-navy dark:text-white">Email us</p>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm text-muted-foreground hover:text-gold-600">
                    {CONTACT_EMAIL}
                  </a>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy/5 text-navy dark:bg-white/10 dark:text-white">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display font-semibold text-navy dark:text-white">Based in</p>
                  <p className="text-sm text-muted-foreground">Andhra Pradesh, India</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <p className="font-display font-semibold text-navy dark:text-white">
                Try the live demo
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in with any account below — password{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-navy dark:text-white">
                  Praja@123
                </code>
              </p>
              <ul className="mt-4 space-y-2">
                {DEMO_ACCOUNTS.map((acct) => (
                  <li
                    key={acct.email}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">{acct.role}</span>
                    <code className="font-mono text-xs text-navy dark:text-white">{acct.email}</code>
                  </li>
                ))}
              </ul>
              <Button asChild variant="default" className="mt-5 w-full">
                <Link href="/login">
                  Go to login
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
