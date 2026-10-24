import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getAllSiteSettings, setSiteSetting } from '@/lib/db/queries/settings'
import { revalidatePath } from 'next/cache'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = await getAllSiteSettings()
  return NextResponse.json(settings)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const key = formData.get('key') as string
    const file = formData.get('file') as File | null
    const valueRaw = formData.get('value') as string | null

    if (!key) return NextResponse.json({ error: 'Key wajib diisi' }, { status: 400 })

    let value: string

    if (file && file.size > 0) {
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: 'Ukuran file maksimal 2MB' }, { status: 400 })
      }
      const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif']
      if (!allowed.includes(file.type)) {
        return NextResponse.json({ error: 'Format file tidak didukung' }, { status: 400 })
      }
      const buffer = Buffer.from(await file.arrayBuffer())
      value = `data:${file.type};base64,${buffer.toString('base64')}`
    } else if (valueRaw) {
      value = valueRaw
    } else {
      return NextResponse.json({ error: 'File atau value wajib diisi' }, { status: 400 })
    }

    await setSiteSetting(key, value)

    revalidatePath('/', 'layout')

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan' }, { status: 500 })
  }
}
