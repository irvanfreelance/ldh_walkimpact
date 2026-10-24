import { put } from '@vercel/blob'

const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/gif': 'gif',
}

export async function uploadPublicImage(
  body: File | Buffer,
  options: { folder: string; contentType: string; name?: string },
): Promise<string> {
  const ext = EXTENSIONS[options.contentType] || 'bin'
  const base = (options.name || 'image')
    .replace(/\.[a-z0-9]+$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'image'

  const blob = await put(`${options.folder}/${base}.${ext}`, body, {
    access: 'public',
    addRandomSuffix: true,
    contentType: options.contentType,
  })

  return blob.url
}
