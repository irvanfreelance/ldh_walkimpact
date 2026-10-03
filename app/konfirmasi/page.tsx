import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { User, Ticket, Users, Calendar, Clock, MapPin, Home } from 'lucide-react'
import {
  getRegistrationByNumber,
  markRegistrationPaid,
  RegistrationDetail,
} from '@/lib/db/queries/registrations'
import { getActiveEvent } from '@/lib/db/queries/events'
import { ConfirmationHero } from '@/components/confirmation/ConfirmationHero'
import { RegistrationCard } from '@/components/confirmation/RegistrationCard'
import { PaymentInstructionsCard } from '@/components/confirmation/PaymentInstructionsCard'
import { NextSteps } from '@/components/confirmation/NextSteps'
import { buildWhatsAppShareUrl, formatEventDate } from '@/lib/utils/format'

interface KonfirmasiPageProps {
  searchParams: Promise<{
    order_id?: string
    demo?: string
  }>
}

export default async function KonfirmasiPage(props: KonfirmasiPageProps) {
  const searchParams = await props.searchParams
  const orderId = searchParams?.order_id || 'WI-2026-0842'
  const isDemo = searchParams?.demo === 'true'

  let registration: RegistrationDetail | null = null
  const event = await getActiveEvent()

  if (orderId) {
    registration = await getRegistrationByNumber(orderId)

    // If order is pending, sync with Midtrans to fetch VA Number, Bill Key, or Settlement status
    if (registration && registration.status === 'pending' && !isDemo) {
      try {
        const { syncMidtransTransactionStatus } = await import('@/lib/midtrans/sync-status')
        await syncMidtransTransactionStatus(orderId)
        registration = await getRegistrationByNumber(orderId)
      } catch (syncErr) {
        console.warn('Error syncing Midtrans status:', syncErr)
      }
    }

    // Only in explicit demo simulation mode, auto mark paid
    if (registration && isDemo && registration.status === 'pending') {
      await markRegistrationPaid(registration.id, new Date())
      registration.status = 'paid'
      // Re-fetch to get any updated BIB numbers
      registration = await getRegistrationByNumber(orderId)
    }
  }

  // Fallback demo data if order_id is simulated or not found in local test
  if (!registration) {
    registration = {
      id: 1,
      registration_number: orderId || 'WI-2026-0842',
      event_id: 1,
      ticket_tier_id: 1,
      category_id: 1,
      category_label: 'Umum',
      contact_name: 'Andi Pratama',
      contact_email: 'andi@example.com',
      contact_whatsapp: '6281234567890',
      community_name: null,
      ticket_qty: 1,
      unit_price: 75000,
      admin_fee: 0,
      total_amount: 75000,
      status: 'paid',
      payment_method_id: 5,
      payment_method_code: 'QRIS',
      payment_type: 'qris',
      bank: null,
      va_number: null,
      biller_code: null,
      bill_key: null,
      snap_token: null,
      qr_url: null,
      payment_url: null,
      transaction_id: 'trx_demo_0842',
      fraud_status: 'accept',
      transaction_time: new Date().toISOString(),
      settlement_time: new Date().toISOString(),
      paid_at: new Date().toISOString(),
      expired_at: null,
      cancelled_at: null,
      cancel_reason: null,
      ip_address: null,
      user_agent: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      participants: [
        {
          slot: 1,
          name: 'Andi Pratama',
          gender: 'Laki-laki',
          bib_number: '0842',
          size_code: 'L',
          size_label: 'Large',
        },
      ],
    }
  }

  const currentRegistration: RegistrationDetail = registration
  const shareUrl = buildWhatsAppShareUrl(currentRegistration.registration_number)

  return (
    <div className="min-h-screen bg-brand-off-white flex flex-col relative overflow-hidden">
      {/* Background illustration overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <Image
          src="/images/runner.png"
          alt="Runner Atmosphere"
          fill
          priority
          className="object-cover object-top opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-off-white/80 via-brand-off-white/95 to-brand-off-white" />
      </div>

      {/* Top Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-brand-light-gray py-4 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo-walk-impact.png"
              alt="Walk Impact 2026"
              width={150}
              height={45}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>

          <div className="flex items-center gap-3 sm:gap-5">
            <Image
              src="/images/logo-laz-darul-hikam.png"
              alt="LAZ Darul Hikam"
              width={75}
              height={30}
              className="h-7 w-auto object-contain hidden xs:block"
            />
            <a
              href="https://wa.me/6281572225545?text=Halo%20Admin%20Walk%20Impact,%20saya%20butuh%20bantuan%20terkait%20konfirmasi%20tiket%20dan%20pembayaran"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-xs sm:text-sm font-bold transition-all shadow-xs"
            >
              <Image
                src="/images/icon-whatsapp.png"
                alt="WhatsApp"
                width={18}
                height={18}
                className="w-4 h-4 object-contain"
              />
              <span>Bantuan &amp; Layanan CS</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10 space-y-8">
        {/* Hero checkmark & greetings */}
        <ConfirmationHero
          contactName={currentRegistration.contact_name}
          status={currentRegistration.status}
        />

        {/* Pending Payment Instructions (VA / QRIS / Payment Link / Manual Transfer) */}
        {currentRegistration.status !== 'paid' && (
          <PaymentInstructionsCard
            registrationNumber={currentRegistration.registration_number}
            totalAmount={currentRegistration.total_amount}
            adminFee={Number(currentRegistration.admin_fee || 0)}
            status={currentRegistration.status}
            paymentType={currentRegistration.payment_type}
            paymentMethodCode={currentRegistration.payment_method_code}
            bank={currentRegistration.bank}
            vaNumber={currentRegistration.va_number}
            billerCode={currentRegistration.biller_code}
            billKey={currentRegistration.bill_key}
            qrUrl={currentRegistration.qr_url}
            paymentUrl={currentRegistration.payment_url}
          />
        )}

        {/* Registration Number display with Copy & Download */}
        <RegistrationCard
          registrationNumber={currentRegistration.registration_number}
          status={currentRegistration.status}
        />

        {/* 2 Summary Cards (Ringkasan Peserta & Detail Acara) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Ringkasan Peserta */}
          <div className="bg-white rounded-3xl p-6 border border-brand-light-gray shadow-card space-y-4">
            <div className="flex items-center gap-2 text-brand-green font-bold text-sm uppercase tracking-wide">
              <User className="w-4 h-4" />
              <span>Ringkasan Peserta</span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-off-white flex items-center justify-center text-brand-text-muted">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-brand-text-muted block">Nama Peserta</span>
                  <span className="font-bold text-brand-text-dark">{currentRegistration.contact_name}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-off-white flex items-center justify-center text-brand-text-muted">
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-brand-text-muted block">Jumlah Tiket</span>
                  <span className="font-bold text-brand-text-dark">{currentRegistration.ticket_qty} tiket</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-off-white flex items-center justify-center text-brand-text-muted">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-brand-text-muted block">Kategori</span>
                  <span className="font-bold text-brand-text-dark">{currentRegistration.category_label}</span>
                </div>
              </div>

              {currentRegistration.participants && currentRegistration.participants.length > 0 && (
                <div className="pt-2 border-t border-brand-light-gray space-y-2">
                  <span className="text-[11px] text-brand-text-muted block">Daftar Peserta & Nomor BIB:</span>
                  <div className="space-y-1.5">
                    {currentRegistration.participants.map((p) => (
                      <div
                        key={p.slot}
                        className="bg-brand-off-white border border-brand-light-gray p-2.5 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-brand-text-dark">
                            Slot {p.slot}: {p.name || 'Peserta'}
                          </span>
                          <span className="text-brand-text-muted ml-2 text-[11px]">
                            (Kaos: <strong className="text-brand-green">{p.size_code}</strong>)
                          </span>
                        </div>
                        {p.bib_number ? (
                          <span className="bg-brand-green text-white font-extrabold px-2.5 py-0.5 rounded-full text-[11px] tracking-wide">
                            BIB #{p.bib_number}
                          </span>
                        ) : (
                          <span className="text-[10px] text-brand-text-muted italic">
                            BIB di-assign setelah bayar
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Detail Acara */}
          <div className="bg-white rounded-3xl p-6 border border-brand-light-gray shadow-card space-y-4">
            <div className="flex items-center gap-2 text-brand-green font-bold text-sm uppercase tracking-wide">
              <Calendar className="w-4 h-4" />
              <span>Detail Acara</span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-off-white flex items-center justify-center text-brand-text-muted">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-brand-text-muted block">Tanggal Pelaksanaan</span>
                  <span className="font-bold text-brand-text-dark">
                    {event ? formatEventDate(event.event_date) : 'Sabtu, 7 November 2026'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-off-white flex items-center justify-center text-brand-text-muted">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-brand-text-muted block">Waktu Kumpul</span>
                  <span className="font-bold text-brand-text-dark">05.30 WIB (Pagi)</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-off-white flex items-center justify-center text-brand-text-muted">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-brand-text-muted block">Lokasi Titik Kumpul</span>
                  <span className="font-bold text-brand-text-dark">
                    {event?.venue_name || 'Pasar Modern Batununggal Indah'}, {event?.venue_city || 'Bandung'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Next Steps & Amber Impact Banner */}
        <NextSteps />

        {/* Bottom CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto bg-brand-green hover:bg-brand-green-leaf active:scale-95 text-white font-extrabold text-sm sm:text-base px-8 py-4 rounded-xl shadow-cta transition-all flex items-center justify-center gap-2.5"
          >
            <Image
              src="/images/icon-whatsapp.png"
              alt="WA"
              width={22}
              height={22}
              className="w-5 h-5 object-contain brightness-0 invert"
            />
            <span>Bagikan ke WhatsApp →</span>
          </a>

          <Link
            href="/"
            className="w-full sm:w-auto bg-white hover:bg-brand-off-white text-brand-text-dark border-2 border-brand-light-gray font-bold text-sm sm:text-base px-8 py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-brand-green" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-brand-light-gray bg-white text-center text-xs text-brand-text-muted relative z-10">
        © 2026 Walk Impact · LAZ Darul Hikam. Hak Cipta Dilindungi.
      </footer>
    </div>
  )
}
