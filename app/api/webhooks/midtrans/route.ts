import { NextRequest } from 'next/server'
import { POST as handleNotification } from '@/app/api/payments/notification/route'

export async function POST(req: NextRequest) {
  return handleNotification(req)
}
