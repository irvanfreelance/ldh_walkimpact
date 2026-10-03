'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Ticket,
  FileText,
  MessageSquare,
  Database,
  Trash2,
  ExternalLink,
  Menu,
  X,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Clock,
  BarChart3,
  Sparkles,
  UserCog,
  LogOut,
  User as UserIcon,
} from 'lucide-react'

interface PanelLayoutProps {
  children: React.ReactNode
}

export default function PanelLayout({ children }: PanelLayoutProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isClearingCache, setIsClearingCache] = useState(false)
  const [cacheNotification, setCacheNotification] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error'
  }>({ show: false, message: '', type: 'success' })

  const navItems = [
    {
      label: 'Dashboard',
      href: '/panel',
      icon: LayoutDashboard,
      active: pathname === '/panel',
    },
    {
      label: 'Peserta & Registrasi',
      href: '/panel/registrations',
      icon: Users,
      active: pathname.startsWith('/panel/registrations'),
    },
    {
      label: 'Pengaturan Event',
      href: '/panel/event',
      icon: Calendar,
      active: pathname === '/panel/event',
    },
    {
      label: 'Manajemen Tiket',
      href: '/panel/tickets',
      icon: Ticket,
      active: pathname === '/panel/tickets',
    },
    {
      label: 'Konten CMS',
      href: '/panel/cms',
      icon: FileText,
      active: pathname.startsWith('/panel/cms'),
      subItems: [
        { label: 'FAQ', href: '/panel/cms?tab=faqs', icon: HelpCircle },
        { label: 'Rundown', href: '/panel/cms?tab=rundowns', icon: Clock },
        { label: 'Statistik', href: '/panel/cms?tab=stats', icon: BarChart3 },
        { label: 'Konsep', href: '/panel/cms?tab=concepts', icon: Sparkles },
      ],
    },
    {
      label: 'Template Notifikasi',
      href: '/panel/notifications',
      icon: MessageSquare,
      active: pathname.startsWith('/panel/notifications'),
    },
    {
      label: 'Master Data',
      href: '/panel/master',
      icon: Database,
      active: pathname.startsWith('/panel/master'),
    },
    {
      label: 'Manajemen User',
      href: '/panel/users',
      icon: UserCog,
      active: pathname.startsWith('/panel/users'),
    },
  ]

  const handleQuickPurgeCache = async () => {
    try {
      setIsClearingCache(true)
      const res = await fetch('/api/panel/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'purge_all' }),
      })
      const data = await res.json()
      if (res.ok) {
        setCacheNotification({
          show: true,
          message: `Berhasil flush cache Redis (${data.deletedCount} keys) & revalidasi halaman!`,
          type: 'success',
        })
      } else {
        throw new Error(data.error || 'Gagal menghapus cache')
      }
    } catch (err: any) {
      setCacheNotification({
        show: true,
        message: err.message || 'Gagal menghapus cache',
        type: 'error',
      })
    } finally {
      setIsClearingCache(false)
      setTimeout(() => {
        setCacheNotification((prev) => ({ ...prev, show: false }))
      }, 4000)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex font-sans antialiased text-[#1A2714]">
      {/* Toast Notification */}
      {cacheNotification.show && (
        <div className="fixed top-5 right-5 z-50 animate-bounce duration-300">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
              cacheNotification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {cacheNotification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span>{cacheNotification.message}</span>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#E2E8DF] fixed inset-y-0 z-30 shadow-sm">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#E8EDE3]">
          <Link href="/panel" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3A7D0A] to-[#6DC230] flex items-center justify-center text-white font-black text-lg shadow-sm">
              W
            </div>
            <div>
              <div className="font-extrabold text-[#1A2714] text-base leading-tight">
                Walk Impact
              </div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-[#6DC230]">
                Admin Panel
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="space-y-0.5">
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    item.active
                      ? 'bg-[#6DC230]/10 text-[#3A7D0A] font-semibold shadow-xs'
                      : 'text-[#4A5D40] hover:bg-[#F2F6EF] hover:text-[#1A2714]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      item.active ? 'text-[#3A7D0A]' : 'text-[#7D9173]'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
                {item.subItems && item.active && (
                  <div className="pl-9 pr-2 py-1 space-y-1">
                    {item.subItems.map((sub) => {
                      const SubIcon = sub.icon
                      return (
                        <Link
                          key={sub.label}
                          href={sub.href}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#5A6E51] hover:text-[#1A2714] hover:bg-[#F2F6EF]"
                        >
                          <SubIcon className="w-3.5 h-3.5 text-[#7D9173]" />
                          <span>{sub.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#E8EDE3] space-y-2 bg-[#FAFCF8]">
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/80 border border-emerald-100 rounded-lg text-xs font-semibold text-[#3A7D0A]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Auto Cache Sync Active</span>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-[#5A6E51] hover:text-[#1A2714] hover:bg-[#EAEFE6] rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Lihat Website Utama</span>
          </a>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-white h-full flex flex-col z-10 shadow-xl">
            <div className="h-16 flex items-center justify-between px-6 border-b border-[#E8EDE3]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#6DC230] text-white flex items-center justify-center font-bold">
                  W
                </div>
                <span className="font-bold text-[#1A2714]">Walk Impact Admin</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md text-gray-500 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                      item.active
                        ? 'bg-[#6DC230]/10 text-[#3A7D0A] font-semibold'
                        : 'text-[#4A5D40] hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleQuickPurgeCache()
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-[#3A7D0A] border border-emerald-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Flush Cache Redis</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-[#E2E8DF] sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[#5A6E51] hover:bg-gray-100"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm font-semibold text-[#24341E]">
              Walk Impact 2026 Admin Dashboard
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 pr-3 border-r border-gray-200">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-gray-500">
                Live DB
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'Admin'}
                  className="w-7 h-7 rounded-full border border-gray-200"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#3A7D0A] flex items-center justify-center font-bold text-xs">
                  {session?.user?.name?.[0] || 'A'}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-[#1A2714] line-clamp-1">
                  {session?.user?.name || 'Administrator'}
                </div>
                <div className="text-[10px] text-gray-400 line-clamp-1">
                  {session?.user?.email || 'admin@walkimpact.org'}
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                title="Keluar / Logout"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors ml-1 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
