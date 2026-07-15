"use client";

import { Card, CardBody, Chip } from "@heroui/react";
import { Building2, ShieldCheck, Zap, PiggyBank, LucideIcon } from "lucide-react";

interface Differentiator {
  icon: LucideIcon;
  title: string;
  description: string;
  highlight?: boolean;
}

const differentiators: Differentiator[] = [
  {
    icon: Building2,
    title: "Built for owners, not enterprises",
    description:
      "No bloated tools built for property giants. Just the features an independent owner or small landlord actually uses.",
  },
  {
    icon: Zap,
    title: "Stripe-native payouts",
    description:
      "Rent goes from tenant to your bank account through Stripe Connect — fast, transparent, and with no manual reconciliation.",
    highlight: true,
  },
  {
    icon: ShieldCheck,
    title: "One dashboard, every property",
    description:
      "Track occupancy, payment status, and lease renewals across your whole portfolio without switching between tools.",
  },
  {
    icon: PiggyBank,
    title: "Transparent, predictable pricing",
    description:
      "One flat subscription through Stripe Billing. No per-tenant fees, no surprise charges as your portfolio grows.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-[#304C53] py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-wide text-[#AFE0E7]">
            Why us
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Built for real estate owners, not spreadsheets
          </h2>
          <p className="mt-4 text-base text-[#DDAD9C]">
            Most tools make you choose between "simple" and "actually
            handles payments." We didn't think you should have to.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {differentiators.map(({ icon: Icon, title, description, highlight }) => (
            <Card
              key={title}
              shadow="none"
              className={
                highlight
                  ? "border border-[#AFE0E7]/50 bg-[#AFE0E7] transition-all duration-200 hover:-translate-y-1"
                  : "border border-white/10 bg-[#304C53] transition-all duration-200 hover:-translate-y-1 hover:border-white/25"
              }
            >
              <CardBody className="gap-4 p-6">
                <div
                  className={
                    highlight
                      ? "flex h-11 w-11 items-center justify-center rounded-lg bg-[#304C53]/10"
                      : "flex h-11 w-11 items-center justify-center rounded-lg bg-white/10"
                  }
                >
                  <Icon
                    className={highlight ? "h-5 w-5 text-[#304C53]" : "h-5 w-5 text-[#AFE0E7]"}
                    strokeWidth={2}
                  />
                </div>

                {highlight && (
                  <Chip
                    size="sm"
                    className="w-fit bg-[#304C53] text-[#AFE0E7]"
                  >
                    Most loved
                  </Chip>
                )}

                <h3
                  className={
                    highlight
                      ? "text-lg font-semibold text-[#304C53]"
                      : "text-lg font-semibold text-white"
                  }
                >
                  {title}
                </h3>
                <p
                  className={
                    highlight
                      ? "text-sm leading-relaxed text-[#304C53]/80"
                      : "text-sm leading-relaxed text-[#DDAD9C]/90"
                  }
                >
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