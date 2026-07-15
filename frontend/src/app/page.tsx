import Link from 'next/link';
import { Button } from '../components/ui/Button';
import BenefitsSection from '@/components/ui/BenefitsSection';
import WhyChooseUs from '@/components/ui/WhyChooseUs';
import FeaturedListings from '@/components/ui/FeaturedListings';
import StatsSection from '@/components/ui/StatsSection';
import Testimonials from '@/components/ui/Testimonials';
import FAQ from '@/components/ui/FAQ';
import NewsletterCTA from '@/components/ui/NewsletterCTA';

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-4 text-center sm:p-6 lg:p-8">
      <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-secondary sm:text-4xl">
        Property management, rent collection, and billing — all in one place.
      </h1>
      <p className="max-w-xl text-gray-600">
        House Rent Management is a multi-tenant platform for real estate owners: manage properties, leases, and
        tenants, and collect rent online.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link href="/register">
          <Button className="w-full sm:w-auto">Get started</Button>
        </Link>
        <Link href="/pricing">
          <Button variant="secondary" className="w-full sm:w-auto">
            View pricing
          </Button>
        </Link>
      </div>
      <FeaturedListings />
      <BenefitsSection></BenefitsSection>
      <StatsSection />
      <WhyChooseUs></WhyChooseUs>
      <Testimonials />
      <FAQ />
      <NewsletterCTA />
    </main>
  );
}
