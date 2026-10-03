'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-brand-light-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left: Walk Impact Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/images/logo-walk-impact.png"
              alt="Walk Impact 2026"
              width={160}
              height={50}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>

          {/* Center: Nav links (Desktop) */}
          <nav className="hidden lg:flex items-center space-x-7 text-sm font-semibold text-brand-text-dark">
            <Link href="/" className="hover:text-brand-green transition-colors">
              Beranda
            </Link>
            <Link href="#tentang" className="hover:text-brand-green transition-colors">
              Tentang
            </Link>
            <Link href="#rundown" className="hover:text-brand-green transition-colors">
              Rundown
            </Link>
            <Link href="#dampak" className="hover:text-brand-green transition-colors">
              Dampak
            </Link>
            <Link href="#faq" className="hover:text-brand-green transition-colors">
              FAQ
            </Link>
          </nav>

          {/* Right: Partner Logos & CTA Button */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-3 pr-2 border-r border-brand-light-gray">
              <Image
                src="/images/logo-laz-darul-hikam.png"
                alt="LAZ Darul Hikam"
                width={70}
                height={28}
                className="h-7 w-auto object-contain"
              />
              <Image
                src="/images/logo-pasar-modern-batununggal-indah.png"
                alt="Pasar Modern Batununggal Indah"
                width={80}
                height={28}
                className="h-6 w-auto object-contain"
              />
              <Image
                src="/images/logo-batununggal-indah-club.png"
                alt="Batununggal Indah Club"
                width={65}
                height={28}
                className="h-6 w-auto object-contain"
              />
            </div>

            <Link
              href="/daftar"
              className="bg-brand-green hover:bg-brand-green-leaf active:scale-95 text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-cta transition-all"
            >
              Daftar Sekarang
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center space-x-2">
            <Link
              href="/daftar"
              className="bg-brand-green hover:bg-brand-green-leaf text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-cta"
            >
              Daftar
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-brand-text-dark hover:bg-brand-off-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-brand-light-gray bg-white px-4 pt-3 pb-6 space-y-4">
          <nav className="flex flex-col space-y-3 font-semibold text-brand-text-dark text-base">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-brand-green py-1"
            >
              Beranda
            </Link>
            <Link
              href="#tentang"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-brand-green py-1"
            >
              Tentang
            </Link>
            <Link
              href="#rundown"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-brand-green py-1"
            >
              Rundown
            </Link>
            <Link
              href="#dampak"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-brand-green py-1"
            >
              Dampak
            </Link>
            <Link
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-brand-green py-1"
            >
              FAQ
            </Link>
          </nav>

          <div className="pt-3 border-t border-brand-light-gray flex items-center justify-around">
            <Image
              src="/images/logo-laz-darul-hikam.png"
              alt="LAZ Darul Hikam"
              width={70}
              height={28}
              className="h-6 w-auto object-contain"
            />
            <Image
              src="/images/logo-pasar-modern-batununggal-indah.png"
              alt="Pasar Modern Batununggal Indah"
              width={75}
              height={28}
              className="h-6 w-auto object-contain"
            />
            <Image
              src="/images/logo-batununggal-indah-club.png"
              alt="Batununggal Indah Club"
              width={60}
              height={28}
              className="h-6 w-auto object-contain"
            />
          </div>
        </div>
      )}
    </header>
  )
}
