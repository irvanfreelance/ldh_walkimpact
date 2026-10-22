import sql from '@/lib/db/client'
import { Navbar } from './Navbar'

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
  const sponsors = await getActiveSponsors()
  return <Navbar registrationClosed={registrationClosed} sponsors={sponsors as any} />
}
