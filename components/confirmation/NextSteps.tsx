import React from 'react'
import Image from 'next/image'
import { FileText, MessageSquare, ShoppingBag, Footprints } from 'lucide-react'

export function NextSteps() {
  const steps = [
    {
      num: 1,
      icon: <FileText className="w-5 h-5 text-brand-green" />,
      title: 'Simpan nomor pendaftaranmu',
      description: 'Gunakan nomor ini untuk semua komunikasi dan registrasi ulang terkait acara.',
    },
    {
      num: 2,
      icon: <MessageSquare className="w-5 h-5 text-brand-green" />,
      title: 'Pantau WhatsApp untuk instruksi lanjutan',
      description: 'Kami akan mengirim informasi rute, panduan, dan pengumuman resmi via WhatsApp.',
    },
    {
      num: 3,
      icon: <ShoppingBag className="w-5 h-5 text-brand-green" />,
      title: 'Ambil perlengkapan pada 2–3 November 2026',
      description: 'Pengambilan race pack & kaos event di lokasi yang akan diumumkan via WhatsApp.',
    },
    {
      num: 4,
      icon: <Footprints className="w-5 h-5 text-brand-green" />,
      title: 'Datang pukul 05.30 di hari-H',
      description: 'Bersama 750 peserta, mari kita berjalan dan mengantarkan kebaikan untuk sesama!',
    },
  ]

  return (
    <div className="space-y-6">
      {/* 4 Steps Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-light-gray shadow-card">
        <h3 className="text-lg sm:text-xl font-extrabold text-brand-text-dark font-heading mb-6 text-center sm:text-left">
          Yang Perlu Kamu Lakukan Selanjutnya
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step) => (
            <div
              key={step.num}
              className="bg-brand-off-white rounded-2xl p-5 border border-brand-light-gray flex flex-col items-start gap-3 relative"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-brand-green text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {step.num}
                </span>
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-brand-light-gray/60 shadow-xs">
                  {step.icon}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-brand-text-dark leading-snug mb-1">
                  {step.title}
                </h4>
                <p className="text-xs text-brand-text-muted leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Amber Impact Banner */}
      <div className="bg-[#FFF9EE] border-2 border-[#F5A623]/40 rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-center gap-5 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-[#F5A623]/20 flex items-center justify-center shrink-0">
          <Image
            src="/images/icon-donation-package.png"
            alt="Donasi Sembako"
            width={40}
            height={40}
            className="w-9 h-9 object-contain"
          />
        </div>
        <div className="space-y-1 text-center sm:text-left flex-1">
          <h4 className="text-base sm:text-lg font-black text-[#8A5800] font-heading">
            1 tiketmu = 1 paket sembako
          </h4>
          <p className="text-xs sm:text-sm text-[#8A5800]/90 leading-relaxed">
            Langkahmu membantu saudara-saudara yang membutuhkan melalui program sosial kemanusiaan LAZ Darul Hikam. Terima kasih telah menjadi pahlawan kebaikan bagi masyarakat Bandung!
          </p>
        </div>
      </div>
    </div>
  )
}
