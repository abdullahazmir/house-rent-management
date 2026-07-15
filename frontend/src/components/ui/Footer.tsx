"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import type { SVGProps } from "react";

interface FooterLink {
  label: string;
  href: string;
}

function TwitterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.9 2H22l-7.6 8.7L23.3 22h-7.2l-5.6-6.9L4 22H1l8.2-9.4L1 2h7.4l5.1 6.3L18.9 2Zm-1.3 18h2L7.5 4H5.4l12.2 16Z" />
    </svg>
  );
}

function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.55 4.78 5.87V21h-4v-5.6c0-1.34-.02-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96V21h-4V9Z" />
    </svg>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-7.5h2.5l.4-3H13.5V8.5c0-.87.24-1.46 1.5-1.46H16.5V4.35C16.24 4.32 15.35 4.24 14.3 4.24c-2.18 0-3.67 1.33-3.67 3.77V10.5H8.14v3H10.63V21h2.87Z" />
    </svg>
  );
}

const productLinks: FooterLink[] = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Get started", href: "/register" },
];

const companyLinks: FooterLink[] = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const legalLinks: FooterLink[] = [
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms of service", href: "/terms" },
];

const socialLinks = [
  { icon: TwitterIcon, href: "https://twitter.com", label: "Twitter" },
  { icon: LinkedinIcon, href: "https://linkedin.com", label: "LinkedIn" },
  { icon: FacebookIcon, href: "https://facebook.com", label: "Facebook" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#304C53]">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#BC6C50]">
                <Home className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-base font-semibold text-white">
                House Rent
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#DDAD9C]/80">
              Property management, rent collection, and billing — all in one
              place.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-[#AFE0E7]">
              Product
            </h4>
            <ul className="mt-4 space-y-3">
              {productLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-[#DDAD9C]/90 transition-colors hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-[#AFE0E7]">
              Company
            </h4>
            <ul className="mt-4 space-y-3">
              {companyLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-[#DDAD9C]/90 transition-colors hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-[#AFE0E7]">
              Legal
            </h4>
            <ul className="mt-4 space-y-3">
              {legalLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-[#DDAD9C]/90 transition-colors hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col-reverse items-center justify-between gap-6 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-[#DDAD9C]/70">
            © {year} House Rent Management. All rights reserved.
          </p>

          <div className="flex items-center gap-3">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-[#DDAD9C] transition-colors hover:bg-[#AFE0E7] hover:text-[#304C53]"
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
