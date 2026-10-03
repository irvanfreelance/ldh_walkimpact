'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Phone,
  FileSpreadsheet,
  Users as UsersIcon,
  Shirt,
  Hash,
} from 'lucide-react'

export default function RegistrationsPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'participants'>('orders')

  // Orders State
  const [orders, setOrders] = useState<any[]>([])
  const [ordersMeta, setOrdersMeta] = useState<any>({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatus, setOrderStatus] = useState('')
  const [orderCategory, setOrderCategory] = useState('')
  const [orderPage, setOrderPage] = useState(1)

  // Participants State
  const [participants, setParticipants] = useState<any[]>([])
  const [partMeta, setPartMeta] = useState<any>({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [partLoading, setPartLoading] = useState(true)
  const [partSearch, setPartSearch] = useState('')
  const [partSize, setPartSize] = useState('')
  const [partStatus, setPartStatus] = useState('')
  const [partPage, setPartPage] = useState(1)

  // Reference Data
  const [categories, setCategories] = useState<any[]>([])
  const [shirtSizes, setShirtSizes] = useState<any[]>([])

  const fetchRegistrations = useCallback(async () => {
    try {
      setOrdersLoading(true)
      const params = new URLSearchParams()
      if (orderSearch) params.set('search', orderSearch)
      if (orderStatus) params.set('status', orderStatus)
      if (orderCategory) params.set('category', orderCategory)
      params.set('page', orderPage.toString())
      params.set('limit', '20')

      const res = await fetch(`/api/panel/registrations?${params.toString()}`)
      const json = await res.json()
      if (res.ok) {
        setOrders(json.data || [])
        setOrdersMeta(json.meta || { page: 1, limit: 20, total: 0, totalPages: 1 })
      }
    } catch (err) {
      console.error('Error fetching registrations:', err)
    } finally {
      setOrdersLoading(false)
    }
  }, [orderSearch, orderStatus, orderCategory, orderPage])

  const fetchParticipants = useCallback(async () => {
    try {
      setPartLoading(true)
      const params = new URLSearchParams()
      if (partSearch) params.set('search', partSearch)
      if (partSize) params.set('size', partSize)
      if (partStatus) params.set('status', partStatus)
      params.set('page', partPage.toString())
      params.set('limit', '20')

      const res = await fetch(`/api/panel/participants?${params.toString()}`)
      const json = await res.json()
      if (res.ok) {
        setParticipants(json.data || [])
        setPartMeta(json.meta || { page: 1, limit: 20, total: 0, totalPages: 1 })
      }
    } catch (err) {
      console.error('Error fetching participants:', err)
    } finally {
      setPartLoading(false)
    }
  }, [partSearch, partSize, partStatus, partPage])

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchRegistrations()
    } else {
      fetchParticipants()
    }
  }, [activeTab, fetchRegistrations, fetchParticipants])

  useEffect(() => {
    fetch('/api/panel/master/categories')
      .then((r) => r.json())
      .then((cats) => {
        if (Array.isArray(cats)) setCategories(cats)
      })
      .catch(() => {})

    fetch('/api/panel/master/shirt-sizes')
      .then((r) => r.json())
      .then((sizes) => {
        if (Array.isArray(sizes)) setShirtSizes(sizes)
      })
      .catch(() => {})
  }, [])

  const handleExportExcel = () => {
    const url = `/api/panel/registrations/export${orderStatus ? `?status=${orderStatus}` : ''}`
    window.open(url, '_blank')
  }

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num)
  }

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Lunas
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 text-amber-600" />
            Menunggu
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 text-red-600" />
            Batal
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {s}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A2714] tracking-tight">
            Data Pendaftaran &amp; Peserta
          </h1>
          <p className="text-sm text-[#5A6E51] mt-1">
            Kelola data transaksi invoice dan database perseorangan peserta Walk Impact 2026.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Semua ke Excel</span>
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-[#E2E8DF] gap-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'border-[#6DC230] text-[#3A7D0A] bg-emerald-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Tab 1: Transaksi &amp; Invoice ({ordersMeta.total})</span>
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'participants'
              ? 'border-[#6DC230] text-[#3A7D0A] bg-emerald-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <UsersIcon className="w-4 h-4" />
          <span>Tab 2: Data Individu Peserta &amp; Jersey ({partMeta.total})</span>
        </button>
      </div>

      {/* TAB 1: ORDERS & INVOICES */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E2E8DF] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => {
                  setOrderSearch(e.target.value)
                  setOrderPage(1)
                }}
                placeholder="Cari Invoice, Nama Kontak, WhatsApp, atau Komunitas..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC230] focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <select
                value={orderStatus}
                onChange={(e) => {
                  setOrderStatus(e.target.value)
                  setOrderPage(1)
                }}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6DC230]"
              >
                <option value="">Semua Status</option>
                <option value="paid">Lunas (Paid)</option>
                <option value="pending">Menunggu (Pending)</option>
                <option value="cancelled">Dibatalkan</option>
                <option value="expired">Kedaluwarsa</option>
              </select>

              <select
                value={orderCategory}
                onChange={(e) => {
                  setOrderCategory(e.target.value)
                  setOrderPage(1)
                }}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6DC230]"
              >
                <option value="">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>

              <button
                onClick={fetchRegistrations}
                title="Refresh Data"
                className="p-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-[#E2E8DF] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#1A2714]">
                <thead className="bg-[#F8FAF9] text-[11px] uppercase font-bold text-gray-500 border-b border-[#E8EDE3]">
                  <tr>
                    <th className="px-5 py-3.5">Invoice</th>
                    <th className="px-5 py-3.5">Kontak Pemesan</th>
                    <th className="px-5 py-3.5">Kategori / Komunitas</th>
                    <th className="px-5 py-3.5">Tiket &amp; Kaos</th>
                    <th className="px-5 py-3.5">Total Bayar</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Tanggal</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EDE3]">
                  {ordersLoading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#6DC230] mb-2" />
                        Memuat data registrasi...
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-400">
                        Tidak ada transaksi yang cocok.
                      </td>
                    </tr>
                  ) : (
                    orders.map((r) => (
                      <tr key={r.id} className="hover:bg-[#F9FCF8] transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-xs text-[#3A7D0A]">
                          {r.registration_number}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-gray-900">{r.contact_name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{r.contact_whatsapp}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-xs font-semibold text-gray-800">{r.category_label}</div>
                          {r.community_name && r.community_name !== '-' && (
                            <div className="text-[11px] text-gray-500 italic mt-0.5">
                              {r.community_name}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-xs text-gray-900">
                            {r.ticket_qty} Tiket ({r.ticket_tier_name})
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5 max-w-xs truncate" title={r.participant_summary}>
                            {r.participant_summary}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-gray-900 text-xs">
                            {formatRupiah(Number(r.total_amount))}
                          </div>
                          <div className="text-[10px] text-gray-400 uppercase">
                            {r.payment_type || 'Belum bayar'}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {getStatusBadge(r.status)}
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(r.created_at).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/panel/registrations/${r.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-[#6DC230]/20 hover:text-[#3A7D0A] text-gray-800 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Orders */}
            <div className="p-4 border-t border-[#E8EDE3] bg-[#FAFCF8] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-gray-500">
                Menampilkan <span className="font-bold text-gray-800">{orders.length}</span> dari total{' '}
                <span className="font-bold text-gray-800">{ordersMeta.total}</span> transaksi
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                  disabled={ordersMeta.page <= 1 || ordersLoading}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 text-xs font-semibold text-gray-700">
                  Halaman {ordersMeta.page} dari {ordersMeta.totalPages || 1}
                </span>
                <button
                  onClick={() => setOrderPage((p) => Math.min(ordersMeta.totalPages, p + 1))}
                  disabled={ordersMeta.page >= ordersMeta.totalPages || ordersLoading}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INDIVIDUAL PARTICIPANTS */}
      {activeTab === 'participants' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E2E8DF] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={partSearch}
                onChange={(e) => {
                  setPartSearch(e.target.value)
                  setPartPage(1)
                }}
                placeholder="Cari Nama Peserta, No BIB, No Invoice, atau WhatsApp..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC230] focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <select
                value={partSize}
                onChange={(e) => {
                  setPartSize(e.target.value)
                  setPartPage(1)
                }}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6DC230]"
              >
                <option value="">Semua Ukuran Kaos</option>
                {shirtSizes.map((s) => (
                  <option key={s.id} value={s.code}>
                    Ukuran {s.code} ({s.label})
                  </option>
                ))}
              </select>

              <select
                value={partStatus}
                onChange={(e) => {
                  setPartStatus(e.target.value)
                  setPartPage(1)
                }}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6DC230]"
              >
                <option value="">Semua Status Bayar</option>
                <option value="paid">Lunas (Paid)</option>
                <option value="pending">Menunggu</option>
                <option value="cancelled">Batal</option>
              </select>

              <button
                onClick={fetchParticipants}
                title="Refresh Data"
                className="p-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${partLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Participants Table */}
          <div className="bg-white rounded-2xl border border-[#E2E8DF] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#1A2714]">
                <thead className="bg-[#F8FAF9] text-[11px] uppercase font-bold text-gray-500 border-b border-[#E8EDE3]">
                  <tr>
                    <th className="px-5 py-3.5">Slot / No. BIB</th>
                    <th className="px-5 py-3.5">Nama Peserta</th>
                    <th className="px-5 py-3.5">Ukuran Kaos</th>
                    <th className="px-5 py-3.5">No. Invoice &amp; Pemesan</th>
                    <th className="px-5 py-3.5">Kategori Tiket</th>
                    <th className="px-5 py-3.5">Status Tiket</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EDE3]">
                  {partLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#6DC230] mb-2" />
                        Memuat data peserta...
                      </td>
                    </tr>
                  ) : participants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                        Tidak ada data peserta yang cocok.
                      </td>
                    </tr>
                  ) : (
                    participants.map((p) => (
                      <tr key={p.id} className="hover:bg-[#F9FCF8] transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-xs text-gray-900">
                            Slot #{p.slot_number}
                          </div>
                          {p.bib_number ? (
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 mt-1">
                              <Hash className="w-3 h-3" />
                              {p.bib_number}
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">Belum ada BIB</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-gray-900 text-sm">
                            {p.participant_name || p.contact_name || `Peserta Slot #${p.slot_number}`}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{p.contact_whatsapp}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-100 font-extrabold text-sm text-[#3A7D0A] border border-gray-200">
                            <Shirt className="w-3.5 h-3.5 text-gray-500" />
                            {p.shirt_size || '-'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-mono font-bold text-xs text-[#3A7D0A]">
                            {p.registration_number}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Pemesan: {p.contact_name}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-xs font-bold text-gray-800">
                            {p.ticket_tier_name}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {p.category_label}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {getStatusBadge(p.registration_status)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/panel/registrations/${p.registration_id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-[#6DC230]/20 hover:text-[#3A7D0A] text-gray-800 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail Order</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Participants */}
            <div className="p-4 border-t border-[#E8EDE3] bg-[#FAFCF8] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-gray-500">
                Menampilkan <span className="font-bold text-gray-800">{participants.length}</span> dari total{' '}
                <span className="font-bold text-gray-800">{partMeta.total}</span> data peserta
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPartPage((p) => Math.max(1, p - 1))}
                  disabled={partMeta.page <= 1 || partLoading}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 text-xs font-semibold text-gray-700">
                  Halaman {partMeta.page} dari {partMeta.totalPages || 1}
                </span>
                <button
                  onClick={() => setPartPage((p) => Math.min(partMeta.totalPages, p + 1))}
                  disabled={partMeta.page >= partMeta.totalPages || partLoading}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
