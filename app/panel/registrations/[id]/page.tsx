'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  Save,
  MessageCircle,
  Phone,
  Mail,
  User,
  Ticket,
  CreditCard,
  Trash2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'

export default function RegistrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { id } = use(params)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<any>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const [shirtSizes, setShirtSizes] = useState<any[]>([])
  const [status, setStatus] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactWhatsapp, setContactWhatsapp] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [communityName, setCommunityName] = useState('')
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  })

  useEffect(() => {
    fetchDetail()
    fetchShirtSizes()
  }, [id])

  const fetchDetail = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/panel/registrations/${id}`)
      if (!res.ok) throw new Error('Data registrasi tidak ditemukan')
      const json = await res.json()
      setData(json.registration)
      setParticipants(json.participants || [])
      setStatus(json.registration.status)
      setContactName(json.registration.contact_name || '')
      setContactWhatsapp(json.registration.contact_whatsapp || '')
      setContactEmail(json.registration.contact_email || '')
      setCommunityName(json.registration.community_name || '')
    } catch (err: any) {
      setToast({ show: true, message: err.message || 'Gagal memuat detail', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const fetchShirtSizes = async () => {
    try {
      const res = await fetch('/api/panel/master/shirt-sizes')
      const json = await res.json()
      if (Array.isArray(json)) setShirtSizes(json)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/panel/registrations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          contact_name: contactName,
          contact_whatsapp: contactWhatsapp,
          contact_email: contactEmail,
          community_name: communityName,
          participants,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan perubahan')

      setToast({ show: true, message: 'Data registrasi berhasil diperbarui!', type: 'success' })
      fetchDetail()
    } catch (err: any) {
      setToast({ show: true, message: err.message || 'Gagal menyimpan', type: 'error' })
    } finally {
      setSaving(false)
      setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3500)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus data pendaftaran ini secara permanen?')) {
      return
    }

    try {
      const res = await fetch(`/api/panel/registrations/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Gagal menghapus data')
      alert('Registrasi berhasil dihapus')
      router.push('/panel/registrations')
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus')
    }
  }

  const handleParticipantChange = (index: number, field: string, value: any) => {
    const updated = [...participants]
    updated[index] = { ...updated[index], [field]: value }
    setParticipants(updated)
  }

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-[#6DC230] animate-spin" />
        <p className="text-sm font-medium text-gray-500">Memuat detail pendaftar...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-gray-200">
        <p className="text-gray-500 font-medium">Registrasi tidak ditemukan.</p>
        <Link
          href="/panel/registrations"
          className="mt-4 inline-flex items-center gap-2 text-sm text-[#3A7D0A] font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
        </Link>
      </div>
    )
  }

  // Format link direct WhatsApp
  const cleanPhone = contactWhatsapp.replace(/\D/g, '')
  const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone
  const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
    `Halo ${contactName}, terkait pendaftaran Walk Impact 2026 Anda (${data.registration_number})...`
  )}`

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast Alert */}
      {toast.show && (
        <div className="fixed top-5 right-5 z-50">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/panel/registrations"
            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold font-mono text-[#3A7D0A]">
                {data.registration_number}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  status === 'paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : status === 'pending'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Didaftarkan pada {new Date(data.created_at).toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {status !== 'paid' && (
            <button
              onClick={async () => {
                if (!confirm(`Konfirmasi pelunasan transfer manual untuk ${data.registration_number} sebesar ${formatRupiah(Number(data.total_amount))}? Nomor BIB peserta akan otomatis digenerate.`)) {
                  return
                }
                try {
                  setSaving(true)
                  const res = await fetch(`/api/panel/registrations/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      status: 'paid',
                    }),
                  })
                  const json = await res.json()
                  if (!res.ok) throw new Error(json.error || 'Gagal mengubah status menjadi Lunas')
                  setStatus('paid')
                  setToast({ show: true, message: 'Berhasil set LUNAS manual! BIB otomatis dibuat.', type: 'success' })
                  fetchDetail()
                } catch (err: any) {
                  setToast({ show: true, message: err.message || 'Gagal mengubah status', type: 'error' })
                } finally {
                  setSaving(false)
                  setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3500)
                }
              }}
              disabled={saving}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Set LUNAS (Manual Transfer)</span>
            </button>
          )}

          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Chat WhatsApp</span>
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6DC230] hover:bg-[#5EAA28] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
          <button
            onClick={handleDelete}
            title="Hapus Registrasi"
            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contact & Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Informasi Pemesan */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8DF] shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#1A2714] border-b pb-3">
              Informasi Kontak Pemesan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                  Nama Kontak
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                  Nomor WhatsApp
                </label>
                <input
                  type="text"
                  value={contactWhatsapp}
                  onChange={(e) => setContactWhatsapp(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Opsional"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                  Komunitas / Instansi
                </label>
                <input
                  type="text"
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  placeholder="Opsional"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card: Rincian Peserta per Slot (Ukuran Kaos & Nama) */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8DF] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-[#1A2714]">
                Peserta Tiap Tiket ({participants.length} Slot)
              </h2>
              <span className="text-xs font-semibold text-gray-500">
                Kategori: {data.category_label}
              </span>
            </div>

            <div className="space-y-4">
              {participants.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="p-4 rounded-xl border border-gray-200 bg-[#FAFCF8] space-y-3"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                    <span>Slot #{p.slot_number}</span>
                    <span className="text-gray-400 font-normal">ID: {p.id}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                        Nama Peserta
                      </label>
                      <input
                        type="text"
                        value={p.name || ''}
                        placeholder={idx === 0 ? contactName : `Peserta #${p.slot_number}`}
                        onChange={(e) => handleParticipantChange(idx, 'name', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                        Ukuran Kaos (Jersey)
                      </label>
                      <select
                        value={p.shirt_size_id || ''}
                        onChange={(e) => handleParticipantChange(idx, 'shirt_size_id', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                      >
                        {shirtSizes.map((sz) => (
                          <option key={sz.id} value={sz.id}>
                            {sz.code} - {sz.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                        Nomor BIB (Opsional)
                      </label>
                      <input
                        type="text"
                        value={p.bib_number || ''}
                        placeholder="e.g. 0101"
                        onChange={(e) => handleParticipantChange(idx, 'bib_number', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#6DC230] focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Order Details & Status Override */}
        <div className="space-y-6">
          {/* Card: Override Status */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8DF] shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#1A2714] border-b pb-3">
              Status Registrasi
            </h2>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                Ubah Status Pembayaran Manual
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
              >
                <option value="paid">PAID (Lunas - Hitung ke Kuota)</option>
                <option value="pending">PENDING (Menunggu Pembayaran)</option>
                <option value="cancelled">CANCELLED (Dibatalkan)</option>
                <option value="expired">EXPIRED (Kedaluwarsa)</option>
              </select>
              <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                *Mengubah status menjadi <b>PAID</b> akan secara otomatis mengurangi sisa kuota dan mengosongkan cache Redis kuota.
              </p>
            </div>
          </div>

          {/* Card: Rincian Finansial */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8DF] shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#1A2714] border-b pb-3">
              Rincian Pembayaran
            </h2>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Kategori Tiket</span>
                <span className="font-semibold text-gray-800">{data.ticket_tier_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Jumlah Tiket</span>
                <span className="font-semibold text-gray-800">{data.ticket_qty} Tiket</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Harga Satuan</span>
                <span className="font-semibold text-gray-800">{formatRupiah(Number(data.unit_price))}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Biaya Admin</span>
                <span className="font-semibold text-gray-800">{formatRupiah(Number(data.admin_fee || 0))}</span>
              </div>
              <div className="flex justify-between py-1.5 text-sm font-bold border-b border-gray-200 text-gray-900">
                <span>Total Tagihan</span>
                <span className="text-[#3A7D0A]">{formatRupiah(Number(data.total_amount))}</span>
              </div>
            </div>

            <div className="mt-4 pt-2 space-y-2 text-xs text-gray-600 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <div>
                <b>Channel:</b> {data.payment_type || '-'} ({data.bank || data.payment_method_code || '-'})
              </div>
              {data.va_number && (
                <div>
                  <b>No VA:</b> <span className="font-mono font-bold text-gray-800">{data.va_number}</span>
                </div>
              )}
              {data.paid_at && (
                <div>
                  <b>Lunas Pada:</b> {new Date(data.paid_at).toLocaleString('id-ID')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
