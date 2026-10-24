import sql from '@/lib/db/client'
import { Navbar } from './Navbar'
import { getSiteSetting } from '@/lib/db/queries/settings'

interface NavbarWrapperProps {
  registrationClosed?: boolean
}

async function getActiveSponsors() {
  try {
    return await sql`SELECT id, name, logo_url FROM sponsors WHERE is_active = true AND role = 'penyelenggara' ORDER BY display_order ASC, id ASC`
  } catch {
    return []
  }
}

export async function NavbarWrapper({ registrationClosed }: NavbarWrapperProps) {
  const [sponsors, logoUrl] = await Promise.all([
    getActiveSponsors(),
    getSiteSetting('walk_impact_logo'),
  ])
  return (
    <Navbar
      registrationClosed={registrationClosed}
      sponsors={sponsors as any}
      logoUrl={logoUrl || '/images/logo-walk-impact.png'}
    />
  )
}
