import React from 'react'
import Image from 'next/image'
import { getRegistrationByNumber } from '@/lib/db/queries/registrations'
import { getActiveEvent } from '@/lib/db/queries/events'
import { formatEventDate } from '@/lib/utils/format'

interface TiketPageProps {
  params: Promise<{ id: string }>
}

export default async function TiketPage({ params }: TiketPageProps) {
  const { id } = await params
  const [reg, event] = await Promise.all([
    getRegistrationByNumber(id),
    getActiveEvent(),
  ])

  // Not found
  if (!reg) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow p-8 text-center max-w-sm w-full">
          <div className="text-4xl mb-3">❌</div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">Tiket Tidak Ditemukan</h2>
          <p className="text-sm text-gray-500">Kode pemesanan tidak valid atau sudah kadaluarsa.</p>
        </div>
      </div>
    )
  }

  // Not paid yet
  if (reg.status !== 'paid') {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow p-8 text-center max-w-sm w-full border border-amber-200">
          <div className="text-4xl mb-3">⏳</div>
          <h2 className="text-lg font-bold text-amber-800 mb-1">Pembayaran Belum Dikonfirmasi</h2>
          <p className="text-sm text-gray-500 mb-3">Tiket ini belum aktif karena pembayaran belum diterima.</p>
          <p className="text-xs font-mono text-gray-400">{reg.registration_number}</p>
        </div>
      </div>
    )
  }

  const eventDateStr = event?.event_date ? formatEventDate(event.event_date) : '-'
  const whatsappDisplay = reg.contact_whatsapp
    ? reg.contact_whatsapp.replace(/^62/, '0').replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3')
    : '-'

  return (
    <div className="min-h-screen bg-[#F0F7E6] flex items-start justify-center p-4 pt-8 pb-12">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[#D4EDBA]">

          {/* Header */}
          <div className="bg-[#3A7D0A] px-6 py-5 text-center">
            <Image
              src="/images/logo-walk-impact.png"
              alt="Walk Impact"
              width={150}
              height={48}
              className="h-10 w-auto object-contain brightness-0 invert mx-auto mb-2"
            />
            <p className="text-white/80 text-xs font-semibold tracking-widest uppercase">
              {event?.name || 'Walk Impact 2026'}
            </p>
          </div>

          {/* Status badge */}
          <div className="flex justify-center -mt-3">
            <span className="bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow">
              ✓ Tiket Valid
            </span>
          </div>

          {/* Kode pemesanan */}
          <div className="text-center px-6 pt-4 pb-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Kode Pemesanan</p>
            <p className="text-xl font-black font-mono text-[#1A2714] tracking-wide">
              {reg.registration_number}
            </p>
          </div>

          <hr className="mx-6 border-dashed border-gray-200" />

          {/* Info grid */}
          <div className="px-6 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Nama Pemesan</p>
                <p className="text-sm font-bold text-gray-800 leading-tight">{reg.contact_name}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Nomor HP</p>
                <p className="text-sm font-bold text-gray-800 leading-tight">{whatsappDisplay}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Tanggal Penukaran</p>
                <p className="text-sm font-bold text-gray-800 leading-tight">{eventDateStr}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Jumlah Tiket</p>
                <p className="text-sm font-bold text-gray-800 leading-tight">{reg.ticket_qty} tiket</p>
              </div>
            </div>
          </div>

          <hr className="mx-6 border-dashed border-gray-200" />

          {/* BIB / Nomor Peserta */}
          <div className="px-6 py-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Nomor Peserta</p>
            {reg.participants && reg.participants.length > 0 ? (
              <div className="space-y-2">
                {reg.participants.map((p) => (
                  <div
                    key={p.slot}
                    className="flex items-center justify-between bg-[#F0F7E6] border border-[#C5E5A0] rounded-xl px-4 py-2.5"
                  >
                    <div>
                      <p className="text-xs font-semibold text-gray-700">
                        {p.name || `Peserta ${p.slot}`}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Kaos: <strong className="text-[#3A7D0A]">{p.size_code}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      {p.bib_number ? (
                        <span className="bg-[#3A7D0A] text-white text-xs font-black px-3 py-1 rounded-full">
                          BIB #{p.bib_number}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">Belum ditetapkan</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Data peserta belum tersedia</p>
            )}
          </div>

          {/* Footer card */}
          <div className="bg-[#F8FAF6] border-t border-[#E2E8DF] px-6 py-3 text-center">
            <p className="text-[10px] text-gray-400">
              LAZ Darul Hikam · Walk Impact 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
