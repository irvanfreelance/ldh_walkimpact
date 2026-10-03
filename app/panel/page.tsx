'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Ticket,
  ArrowUpRight,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Percent,
} from 'lucide-react'

export default function PanelDashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/panel/stats')
      if (!res.ok) throw new Error('Gagal mengambil data statistik')
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-[#6DC230] animate-spin" />
        <p className="text-sm font-medium text-gray-500">Memuat data dashboard...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
        <p className="text-red-700 font-semibold">{error || 'Data tidak tersedia'}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  const { stats, quota, recent_registrations, payment_distribution, category_distribution } = data

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Lunas
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            Menunggu
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            Batal
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A2714] tracking-tight">
            Ringkasan Acara
          </h1>
          <p className="text-sm text-[#5A6E51] mt-1">
            Pantau status pendaftaran, pendapatan, dan penggunaan kuota Walk Impact 2026 secara realtime.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-xs transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
            <span>Refresh</span>
          </button>
          <Link
            href="/panel/registrations"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6DC230] text-white text-sm font-semibold hover:bg-[#5EAA28] shadow-sm transition-colors"
          >
            <span>Lihat Semua Peserta</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8DF] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A6E51]">
              Total Pendapatan
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1A2714]">
              {formatRupiah(stats.total_revenue)}
            </div>
            <div className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
              <span>Dari {stats.paid_registrations} transaksi lunas</span>
            </div>
          </div>
        </div>

        {/* Paid Tickets / Kuota */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8DF] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A6E51]">
              Tiket Lunas (Kuota)
            </span>
            <div className="p-2.5 rounded-xl bg-[#6DC230]/10 text-[#3A7D0A]">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1A2714]">
              {quota.paid_count} <span className="text-lg font-normal text-gray-400">/ {quota.max_quota}</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-[#6DC230] h-full rounded-full transition-all duration-500"
                style={{ width: `${quota.percentage}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1.5 flex justify-between">
              <span>{quota.percentage}% Terisi</span>
              <span>Sisa {quota.remaining}</span>
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8DF] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A6E51]">
              Menunggu Pembayaran
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1A2714]">
              {stats.pending_registrations}
            </div>
            <div className="text-xs text-amber-700 font-medium mt-1">
              Pesanan belum diselesaikan
            </div>
          </div>
        </div>

        {/* Total Registrations */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8DF] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A6E51]">
              Total Pendaftar
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1A2714]">
              {stats.total_registrations}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Total {stats.total_tickets} tiket dipesan
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Distribution & Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8DF] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#1A2714] text-base">Metode Pembayaran (Lunas)</h3>
            <span className="text-xs text-gray-500 font-medium">Channel</span>
          </div>
          <div className="space-y-3">
            {payment_distribution?.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Belum ada transaksi lunas</p>
            ) : (
              payment_distribution?.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-none">
                  <span className="font-semibold text-gray-700 uppercase">{item.payment_type || 'Lainnya'}</span>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">{item.count} transaksi</span>
                    <span className="text-xs text-gray-500 block">{formatRupiah(Number(item.total_amount))}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8DF] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#1A2714] text-base">Kategori Peserta</h3>
            <span className="text-xs text-gray-500 font-medium">Distribusi</span>
          </div>
          <div className="space-y-3">
            {category_distribution?.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Belum ada pendaftar</p>
            ) : (
              category_distribution?.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-none">
                  <span className="font-semibold text-gray-700">{item.category}</span>
                  <span className="font-bold px-2 py-0.5 bg-gray-100 rounded-md text-gray-800 text-xs">
                    {item.count} pendaftar
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System & Auto Cache Sync Card */}
        <div className="bg-gradient-to-br from-[#1A2714] to-[#2B3F23] text-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400">
                Otomatisasi Cache
              </span>
            </div>
            <h3 className="text-lg font-bold mt-2">Upstash Redis Auto-Sync</h3>
            <p className="text-xs text-gray-300 mt-1 leading-relaxed">
              Seluruh operasi CRUD (Event, Tiket, FAQ, Rundown, Statistik, Konsep, Master Data, dan Registrasi) otomatis mengosongkan cache Redis &amp; merevalidasi tampilan publik.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-white/10 flex flex-col sm:flex-row gap-2">
            <Link
              href="/panel/event"
              className="flex-1 text-center py-2 px-3 rounded-xl bg-[#6DC230] hover:bg-[#5EAA28] text-xs font-semibold text-white transition-colors"
            >
              Pengaturan Event
            </Link>
            <Link
              href="/panel/registrations"
              className="flex-1 text-center py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
            >
              Kelola Peserta
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Registrations Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8DF] shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[#E8EDE3] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[#1A2714] text-lg">Pendaftar Terbaru</h3>
            <p className="text-xs text-gray-500 mt-0.5">8 pendaftar paling mutakhir yang masuk ke sistem</p>
          </div>
          <Link
            href="/panel/registrations"
            className="text-xs font-bold text-[#3A7D0A] hover:underline flex items-center gap-1"
          >
            <span>Semua Data</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#1A2714]">
            <thead className="bg-[#F8FAF9] text-[11px] uppercase font-bold text-gray-500 border-b border-[#E8EDE3]">
              <tr>
                <th className="px-6 py-3.5">No. Invoice</th>
                <th className="px-6 py-3.5">Nama & Kontak</th>
                <th className="px-6 py-3.5">Kategori</th>
                <th className="px-6 py-3.5">Tiket</th>
                <th className="px-6 py-3.5">Total Bayar</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EDE3]">
              {recent_registrations?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-400">
                    Belum ada data pendaftaran
                  </td>
                </tr>
              ) : (
                recent_registrations?.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-[#3A7D0A]">
                      {r.registration_number}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{r.contact_name}</div>
                      <div className="text-xs text-gray-500">{r.contact_whatsapp}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-600">
                      {r.category_label}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold">
                      {r.ticket_qty} Tiket
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {formatRupiah(Number(r.total_amount))}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(r.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/panel/registrations/${r.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
