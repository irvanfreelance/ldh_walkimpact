import { NavbarWrapper as Navbar } from '@/components/layout/NavbarWrapper'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/sections/HeroSection'
import { ImpactSection } from '@/components/sections/ImpactSection'
import { ConceptSection } from '@/components/sections/ConceptSection'
import { RundownSection } from '@/components/sections/RundownSection'
import { AudienceSection } from '@/components/sections/AudienceSection'
import { QuotaSection } from '@/components/sections/QuotaSection'
import { AboutSection } from '@/components/sections/AboutSection'
import { FAQSection } from '@/components/sections/FAQSection'
import { getActiveEvent, ActiveEvent } from '@/lib/db/queries/events'
import { getQuotaFromDB } from '@/lib/db/queries/quota'
import { isRegistrationClosed } from '@/lib/utils/registration'

export const revalidate = 300

export default async function HomePage() {
  const event: ActiveEvent | null = await getActiveEvent()

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Walk Impact 2026</h1>
          <p className="text-brand-text-muted">Event tidak ditemukan atau belum aktif.</p>
        </div>
      </div>
    )
  }

  // Initial quota
  const initialQuota = (await getQuotaFromDB(event.id)) || {
    maxQuota: event.max_quota,
    paidCount: 0,
    remaining: event.max_quota,
    percentage: 0,
  }

  const registrationClosed = isRegistrationClosed(event.registration_closes_at)

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar registrationClosed={registrationClosed} />
      <main className="flex-1">
        <HeroSection event={event} registrationClosed={registrationClosed} />
        <ImpactSection stats={event.stats} />
        <ConceptSection concepts={event.concepts} />
        <RundownSection rundowns={event.rundowns} />
        <AudienceSection />
        <QuotaSection
          initialData={initialQuota}
          eventId={event.id}
          registrationClosesAt={event.registration_closes_at}
          registrationClosed={registrationClosed}
        />
        <AboutSection />
        <FAQSection faqs={event.faqs} />
      </main>
      <Footer />
    </div>
  )
}
