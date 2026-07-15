"use client";

import { Card, CardBody } from "@heroui/react";
import { Wallet, Users, CreditCard, LayoutGrid, LucideIcon } from "lucide-react";

interface Benefit {
  icon: LucideIcon;
  title: string;
  description: string;
}

const benefits: Benefit[] = [
  {
    icon: Wallet,
    title: "Online rent collection & tracking",
    description:
      "Tenants pay rent in a few taps. Every payment, late fee, and balance is logged automatically — no spreadsheets, no chasing.",
  },
  {
    icon: Users,
    title: "Lease & tenant management",
    description:
      "Store lease terms, renewal dates, and tenant details in one place, so nothing slips through when a lease is about to expire.",
  },
  {
    icon: CreditCard,
    title: "Automated Stripe billing",
    description:
      "Your own subscription renews itself, and rent payouts route straight to your bank account — no manual invoicing on either side.",
  },
  {
    icon: LayoutGrid,
    title: "Multi-property dashboard",
    description:
      "See occupancy, rent status, and revenue across every property you own from a single screen, not five different tools.",
  },
];

export default function BenefitsSection() {
  return (
    <section className="bg-[#DDAD9C]/25 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-wide text-[#BC6C50]">
            Why owners switch
          </span>
          <h2 className="mt-3 text-3xl font-bold text-[#304C53] sm:text-4xl">
            Rent management that runs itself
          </h2>
          <p className="mt-4 text-base text-[#5A2F25]/80">
            Everything you need to collect rent, manage leases, and get paid
            on time — built for owners who'd rather run their properties than
            their paperwork.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              shadow="none"
              className="border border-[#304C53]/10 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-[#BC6C50]/40 hover:shadow-lg"
            >
              <CardBody className="gap-4 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#BC6C50]/10">
                  <Icon className="h-5 w-5 text-[#BC6C50]" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-semibold text-[#304C53]">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-[#5A2F25]/75">
                  {description}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}