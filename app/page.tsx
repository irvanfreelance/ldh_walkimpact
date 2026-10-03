import { Navbar } from '@/components/layout/Navbar'
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
import { getRedis } from '@/lib/cache/redis'
import { CACHE_KEYS, EVENT_DATA_TTL } from '@/lib/cache/keys'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // 5 minutes ISR

export default async function HomePage() {
  let event: ActiveEvent | null = null

  try {
    const redis = getRedis()
    if (redis) {
      const cached = await redis.get<ActiveEvent>(CACHE_KEYS.EVENT_DATA)
      if (cached) {
        event = cached
      }
    }
  } catch (e) {
    console.warn('Redis cache read failed, falling back to DB:', e)
  }

  if (!event) {
    event = await getActiveEvent()
    if (event) {
      try {
        const redis = getRedis()
        if (redis) {
          await redis.set(CACHE_KEYS.EVENT_DATA, event, { ex: EVENT_DATA_TTL })
        }
      } catch (e) {
        console.warn('Redis cache write failed:', e)
      }
    }
  }

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

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <HeroSection event={event} />
        <ImpactSection stats={event.stats} />
        <ConceptSection concepts={event.concepts} />
        <RundownSection rundowns={event.rundowns} />
        <AudienceSection />
        <QuotaSection initialData={initialQuota} eventId={event.id} />
        <AboutSection />
        <FAQSection faqs={event.faqs} />
      </main>
      <Footer />
    </div>
  )
}
