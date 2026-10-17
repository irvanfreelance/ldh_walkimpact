'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  MessageSquare,
  Mail,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Save,
  X,
  RefreshCw,
  AlertCircle,
  Clock,
  ToggleLeft,
  ToggleRight,
  Eye,
  Sparkles,
  Code2,
  Monitor,
} from 'lucide-react'

// ------- types -------
interface Template {
  id: number
  event_trigger: string
  channel: string
  message_content: string
  is_active: boolean
}

interface EmailContent {
  subject: string
  header_title: string
  body: string
  barcode_note: string
  jersey_heading: string
  jersey_contact: string
  cta_note: string
  cta_label: string
  footer: string
}

const EMPTY_EMAIL: EmailContent = {
  subject: '',
  header_title: '',
  body: '',
  barcode_note: '',
  jersey_heading: '',
  jersey_contact: '',
  cta_note: '',
  cta_label: '',
  footer: '',
}

function parseEmailContent(raw: string): EmailContent {
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.subject === 'string') return { ...EMPTY_EMAIL, ...parsed }
  } catch {}
  return { ...EMPTY_EMAIL, body: raw }
}

// ------- mini email preview -------
function EmailPreview({ content, trigger }: { content: EmailContent; trigger: string }) {
  const isSuccess = trigger.includes('SUCCESS')
  const headerBg = isSuccess ? '#4caf22' : '#f59e0b'
  const cardBg = isSuccess ? '#f0f9e8' : '#fffbeb'
  const cardBorder = isSuccess ? '#c5e5a0' : '#fcd34d'
  const labelColor = isSuccess ? '#2e7d00' : '#92400e'

  // Sample values for preview
  const sample: Record<string, string> = {
    nama: 'Asep Saepul Rohman',
    nama_program: 'WALK IMPACT 2026',
    nomor_daftar: 'WI-20261017-001',
    nominal: 'Rp 200.544',
    metode: 'Mandiri (Transfer Manual)',
    tanggal_acara: 'Sabtu, 12 Desember 2026',
    jam_registrasi: '05.00 WIB - 06.00 WIB',
    jam_acara: '06.00 WIB - 12.00 WIB',
    lokasi: 'Pasar Modern Batununggal',
    rpc_lokasi: 'Kantor LAZ Darul Hikam',
    ticket_url: '#',
  }

  const fill = (text: string) =>
    Object.entries(sample).reduce((acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), v), text)

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#f4f4f4', padding: '12px', borderRadius: '8px', fontSize: '10px', lineHeight: '1.4' }}>
      <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', maxWidth: '100%', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        {/* header */}
        <div style={{ background: headerBg, padding: '10px 14px', textAlign: 'center', color: '#fff', fontWeight: 'bold', fontSize: '11px' }}>
          {fill(content.header_title) || (isSuccess ? '✅ Pendaftaran Berhasil!' : '⏳ Selesaikan Pembayaran Anda')}
        </div>

        {/* body */}
        <div style={{ padding: '10px 14px' }}>
          <p style={{ margin: '0 0 5px', fontSize: '10px', color: '#222' }}>Halo Kak {sample.nama}, 👋</p>
          <p style={{ margin: '0 0 8px', fontSize: '9px', color: '#444', lineHeight: '1.5' }}>
            {fill(content.body) || 'Teks paragraf utama...'}
          </p>

          {/* info card */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '6px', padding: '6px 8px', marginBottom: '7px' }}>
            {[
              ['Nama Program', sample.nama_program, labelColor],
              ['Kode Registrasi', sample.nomor_daftar, '#222'],
              ['Jumlah Pembayaran', sample.nominal, '#c0392b'],
              ['Metode Pembayaran', sample.metode, '#222'],
            ].map(([label, value, color]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ color: '#555', fontSize: '9px' }}>{label}</span>
                <span style={{ color, fontWeight: 'bold', fontSize: '9px' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* event info */}
          {isSuccess && (
            <div style={{ marginBottom: '7px' }}>
              <p style={{ margin: '0 0 2px', fontSize: '9px', fontWeight: 'bold', color: '#222' }}>Registration: {sample.jam_registrasi}</p>
              <p style={{ margin: '0 0 1px', fontSize: '9px', color: '#444' }}>📅 {sample.tanggal_acara}</p>
              <p style={{ margin: '0 0 1px', fontSize: '9px', color: '#444' }}>⏰ {sample.jam_acara}</p>
              <p style={{ margin: '0', fontSize: '9px', color: '#444' }}>📍 {sample.lokasi}</p>
            </div>
          )}

          {content.barcode_note && (
            <p style={{ margin: '0 0 6px', fontSize: '9px', color: '#555', lineHeight: '1.4', background: isSuccess ? 'transparent' : '#f9fafb', padding: isSuccess ? '0' : '5px 7px', borderRadius: '4px' }}>
              {fill(content.barcode_note)}
            </p>
          )}

          {(content.jersey_heading || content.jersey_contact) && (
            <div style={{ marginBottom: '6px' }}>
              {content.jersey_heading && <p style={{ margin: '0 0 2px', fontSize: '9px', fontWeight: 'bold', color: '#222' }}>{fill(content.jersey_heading)}</p>}
              {isSuccess && <p style={{ margin: '0 0 1px', fontSize: '9px', color: '#444' }}>📍 {sample.rpc_lokasi}</p>}
              {content.jersey_contact && <p style={{ margin: '0', fontSize: '9px', color: '#444' }}>{fill(content.jersey_contact)}</p>}
            </div>
          )}

          {content.cta_note && (
            <p style={{ margin: '0 0 6px', fontSize: '9px', color: '#444' }}>{fill(content.cta_note)}</p>
          )}

          {/* cta button */}
          <div style={{ textAlign: 'center', marginTop: '6px' }}>
            <span style={{ display: 'inline-block', background: headerBg, color: '#fff', padding: '5px 14px', borderRadius: '5px', fontWeight: 'bold', fontSize: '9px' }}>
              {fill(content.cta_label) || (isSuccess ? 'Download Barcode' : 'Cek Status Pembayaran')}
            </span>
          </div>
        </div>

        {/* footer */}
        <div style={{ borderTop: '1px solid #eee', padding: '5px 14px', textAlign: 'center', fontSize: '8px', color: '#888' }}>
          {fill(content.footer) || 'LAZ Darul Hikam — Bersama Membantu Sesama'}
        </div>
      </div>
    </div>
  )
}

// ------- main page -------
export default function NotificationsPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email' | 'logs'>('whatsapp')
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Template | null>(null)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [previewTpl, setPreviewTpl] = useState<Template | null>(null)

  const [waForm, setWaForm] = useState({
    event_trigger: '',
    message_content: '',
    is_active: true,
  })
  const [emailForm, setEmailForm] = useState<EmailContent & { is_active: boolean }>({
    ...EMPTY_EMAIL,
    is_active: true,
  })
  const [emailTab, setEmailTab] = useState<'visual' | 'html' | 'preview'>('visual')
  const lastFocusedRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  const insertVariable = (tag: string) => {
    const el = lastFocusedRef.current
    if (!el) return
    const field = el.dataset.field as keyof EmailContent | undefined
    if (!field) return
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const newVal = el.value.slice(0, start) + tag + el.value.slice(end)
    setEmailForm((prev) => ({ ...prev, [field]: newVal }))
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + tag.length, start + tag.length)
    }, 0)
  }

  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  })

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 4000)
  }

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/panel/notifications/templates')
      const json = await res.json()
      if (Array.isArray(json)) {
        setTemplates(json)
        // Auto-seed default email templates if none exist yet
        const hasEmail = json.some((t: Template) => t.channel === 'EMAIL')
        if (!hasEmail) {
          await fetch('/api/panel/notifications/seed', { method: 'POST' })
          const res2 = await fetch('/api/panel/notifications/templates')
          const json2 = await res2.json()
          if (Array.isArray(json2)) setTemplates(json2)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/panel/notifications/logs?limit=100')
      const json = await res.json()
      if (Array.isArray(json)) setLogs(json)
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
    fetchLogs()
  }, [fetchTemplates, fetchLogs])

  const waTemplates = templates.filter((t) => t.channel === 'WHATSAPP')
  const emailTemplates = templates.filter((t) => t.channel === 'EMAIL')

  // ---- WhatsApp CRUD ----
  const openWaCreate = () => {
    setEditingItem(null)
    setWaForm({ event_trigger: 'INVOICE_REMINDER', message_content: 'Halo {nama}, ...', is_active: true })
    setIsModalOpen(true)
  }

  const openWaEdit = (tpl: Template) => {
    setEditingItem(tpl)
    setWaForm({ event_trigger: tpl.event_trigger, message_content: tpl.message_content, is_active: tpl.is_active })
    setIsModalOpen(true)
  }

  const handleWaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const url = editingItem
        ? `/api/panel/notifications/templates/${editingItem.id}`
        : '/api/panel/notifications/templates'
      const method = editingItem ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...waForm, channel: 'WHATSAPP' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan')
      showToast('Template WhatsApp berhasil disimpan!')
      setIsModalOpen(false)
      fetchTemplates()
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  // ---- Email CRUD ----
  const openEmailEdit = (tpl: Template) => {
    setEditingItem(tpl)
    const content = parseEmailContent(tpl.message_content)
    setEmailForm({ ...content, is_active: tpl.is_active })
    setEmailTab('visual')
    setIsModalOpen(true)
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const { is_active, ...fields } = emailForm
      const message_content = JSON.stringify(fields)
      const res = await fetch(`/api/panel/notifications/templates/${editingItem!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_content,
          is_active,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan')
      showToast('Template email berhasil disimpan!')
      setIsModalOpen(false)
      fetchTemplates()
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  // ---- Seed default email templates ----
  const seedDefaultEmailTemplates = async () => {
    try {
      setSeeding(true)
      const defaults = [
        {
          event_trigger: 'EMAIL_INVOICE_SUCCESS',
          channel: 'EMAIL',
          is_active: true,
          message_content: JSON.stringify({
            subject: '✅ Pendaftaran Berhasil – WALK IMPACT 2026 | {nomor_daftar}',
            body: 'Pembayaran Kakak telah berhasil kami terima. Terima kasih telah mendaftar acara WALK IMPACT 2026 sekaligus ikut berbagi paket sembako secara langsung kepada keluarga yang membutuhkan.',
          }),
        },
        {
          event_trigger: 'EMAIL_INVOICE_PENDING',
          channel: 'EMAIL',
          is_active: true,
          message_content: JSON.stringify({
            subject: '⏳ Selesaikan Pembayaran – WALK IMPACT 2026 | {nomor_daftar}',
            body: 'Terima kasih telah mendaftar acara WALK IMPACT 2026. Pendaftaran Kakak belum aktif sampai pembayaran diselesaikan. Segera lakukan pembayaran sesuai instruksi di bawah ini.',
          }),
        },
      ]

      for (const tpl of defaults) {
        const existing = templates.find((t) => t.event_trigger === tpl.event_trigger)
        if (existing) continue
        await fetch('/api/panel/notifications/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tpl),
        })
      }

      showToast('Template email default berhasil dibuat!')
      fetchTemplates()
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setSeeding(false)
    }
  }

  // ---- Toggle active ----
  const toggleActive = async (tpl: Template) => {
    try {
      const res = await fetch(`/api/panel/notifications/templates/${tpl.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !tpl.is_active }),
      })
      if (!res.ok) throw new Error('Gagal update')
      fetchTemplates()
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin hapus template ini?')) return
    try {
      const res = await fetch(`/api/panel/notifications/templates/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menghapus')
      showToast('Template berhasil dihapus')
      fetchTemplates()
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  const placeholderTags = ['{nama}', '{nominal}', '{tiket_qty}', '{metode}', '{nomor_daftar}', '{va_number}']

  const isEmailModal = editingItem?.channel === 'EMAIL'

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast.show && (
        <div className="fixed top-5 right-5 z-50">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A2714] tracking-tight">
            Template & Log Notifikasi
          </h1>
          <p className="text-sm text-[#5A6E51] mt-1">
            Konfigurasi pesan otomatis WhatsApp dan email yang dikirimkan ke peserta.
          </p>
        </div>
        {activeTab === 'whatsapp' && (
          <button
            onClick={openWaCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6DC230] hover:bg-[#5EAA28] text-white text-sm font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Template WA
          </button>
        )}
        {activeTab === 'email' && emailTemplates.length === 0 && (
          <button
            onClick={seedDefaultEmailTemplates}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-xs transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {seeding ? 'Membuat...' : 'Buat Template Default'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E2E8DF] gap-1">
        {[
          { key: 'whatsapp', label: `WhatsApp (${waTemplates.length})`, icon: MessageSquare },
          { key: 'email', label: `Email (${emailTemplates.length})`, icon: Mail },
          { key: 'logs', label: `Log Pengiriman (${logs.length})`, icon: Clock },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === key
                ? 'border-[#6DC230] text-[#3A7D0A] bg-emerald-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ===== WhatsApp Tab ===== */}
      {activeTab === 'whatsapp' && (
        <div className="bg-white rounded-2xl border border-[#E2E8DF] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#1A2714]">
              <thead className="bg-[#F8FAF9] text-[11px] uppercase font-bold text-gray-500 border-b border-[#E8EDE3]">
                <tr>
                  <th className="px-6 py-3.5">Trigger Event</th>
                  <th className="px-6 py-3.5">Isi Pesan</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EDE3]">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#6DC230] mb-2" />
                      Memuat...
                    </td>
                  </tr>
                ) : waTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-400">
                      Belum ada template WhatsApp.
                    </td>
                  </tr>
                ) : (
                  waTemplates.map((tpl) => (
                    <tr key={tpl.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-xs text-[#3A7D0A]">
                        {tpl.event_trigger}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-700 max-w-lg leading-relaxed whitespace-pre-line">
                        {tpl.message_content}
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => toggleActive(tpl)} className="flex items-center gap-1.5">
                          {tpl.is_active ? (
                            <ToggleRight className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                          )}
                          <span className={`text-xs font-semibold ${tpl.is_active ? 'text-emerald-700' : 'text-gray-500'}`}>
                            {tpl.is_active ? 'Aktif' : 'Non-Aktif'}
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openWaEdit(tpl)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tpl.id)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== Email Tab ===== */}
      {activeTab === 'email' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-16 text-center text-sm text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#6DC230] mb-2" />
              Memuat template email...
            </div>
          ) : emailTemplates.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
              <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-500 mb-1">Belum ada template email</p>
              <p className="text-xs text-gray-400 mb-4">
                Klik tombol &quot;Buat Template Default&quot; untuk membuat template email otomatis.
              </p>
              <button
                onClick={seedDefaultEmailTemplates}
                disabled={seeding}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {seeding ? 'Membuat...' : '✨ Buat Template Default'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {emailTemplates.map((tpl) => {
                const content = parseEmailContent(tpl.message_content)
                const isSuccess = tpl.event_trigger.includes('SUCCESS')
                return (
                  <div
                    key={tpl.id}
                    className={`bg-white rounded-2xl border-2 shadow-xs overflow-hidden transition-all ${
                      tpl.is_active ? 'border-[#E2E8DF]' : 'border-gray-200 opacity-70'
                    }`}
                  >
                    {/* Card header */}
                    <div className={`px-5 py-3.5 border-b flex items-center justify-between ${
                      isSuccess ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg ${
                          isSuccess ? 'bg-emerald-100' : 'bg-amber-100'
                        }`}>
                          {isSuccess ? '✅' : '⏳'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">
                            {isSuccess ? 'Email Pendaftaran Berhasil' : 'Email Instruksi Pembayaran'}
                          </p>
                          <p className="text-[10px] font-mono text-gray-500 mt-0.5">{tpl.event_trigger}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleActive(tpl)}
                          className="flex items-center gap-1 text-xs font-semibold"
                          title={tpl.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {tpl.is_active ? (
                            <ToggleRight className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                          )}
                          <span className={tpl.is_active ? 'text-emerald-700' : 'text-gray-500'}>
                            {tpl.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* subject + body info */}
                    <div className="px-5 py-4 border-b border-gray-100 space-y-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-gray-400 mb-0.5">Subject</p>
                        <p className="text-xs text-gray-800 font-medium leading-relaxed">{content.subject || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-gray-400 mb-0.5">Isi Paragraf Utama</p>
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{content.body || '-'}</p>
                      </div>
                    </div>

                    {/* mini preview */}
                    <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                      <p className="text-[10px] font-bold uppercase text-gray-400 mb-2 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Preview Email
                      </p>
                      <div className="overflow-hidden rounded-lg">
                        <EmailPreview
                          trigger={tpl.event_trigger}
                          content={content}
                        />
                      </div>
                    </div>

                    {/* actions */}
                    <div className="px-5 py-3 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleDelete(tpl.id)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                        title="Hapus template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEmailEdit(tpl)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#6DC230] hover:bg-[#5EAA28] text-white text-xs font-bold transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit Template
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== Logs Tab ===== */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-[#E2E8DF] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#1A2714]">
              <thead className="bg-[#F8FAF9] text-[11px] uppercase font-bold text-gray-500 border-b border-[#E8EDE3]">
                <tr>
                  <th className="px-6 py-3.5">Waktu</th>
                  <th className="px-6 py-3.5">No. Invoice</th>
                  <th className="px-6 py-3.5">Penerima</th>
                  <th className="px-6 py-3.5">Channel</th>
                  <th className="px-6 py-3.5">Trigger</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EDE3]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                      Belum ada riwayat log.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-xs text-[#3A7D0A]">
                        {log.invoice_code || '-'}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-800">{log.recipient}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.channel === 'EMAIL' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {log.channel || 'WHATSAPP'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">
                        {log.event_trigger || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status || 'SENT'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== Modal WhatsApp ===== */}
      {isModalOpen && !isEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-lg text-[#1A2714]">
                  {editingItem ? 'Edit Template WhatsApp' : 'Tambah Template WhatsApp'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWaSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Event Trigger</label>
                <input
                  type="text"
                  value={waForm.event_trigger}
                  onChange={(e) => setWaForm({ ...waForm, event_trigger: e.target.value })}
                  placeholder="e.g. INVOICE_SUCCESS / INVOICE_PENDING"
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase">Isi Pesan</label>
                  <span className="text-[11px] text-gray-400">Gunakan placeholder</span>
                </div>
                <textarea
                  rows={5}
                  value={waForm.message_content}
                  onChange={(e) => setWaForm({ ...waForm, message_content: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none leading-relaxed"
                />
                <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] text-gray-500 font-medium">Tag:</span>
                  {placeholderTags.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => setWaForm({ ...waForm, message_content: waForm.message_content + ' ' + tag })}
                      className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-[11px] font-mono transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={waForm.is_active}
                  onChange={(e) => setWaForm({ ...waForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-[#6DC230] rounded-sm"
                />
                Aktifkan template ini
              </label>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#6DC230] hover:bg-[#5EAA28] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Modal Email ===== */}
      {isModalOpen && isEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl max-h-[95vh] flex flex-col">

            {/* Modal header */}
            <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1A2714]">Edit Template Email</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">Ubah isi dan tampilan email notifikasi</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <form onSubmit={handleEmailSubmit} className="flex flex-col overflow-y-auto flex-1">
              <div className="px-6 pt-5 pb-4 space-y-4">

                {/* Event Trigger + Channel row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Event Trigger</label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className="text-xs font-mono font-bold text-[#3A7D0A]">{editingItem?.event_trigger}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Channel</label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs font-bold text-blue-700">EMAIL</span>
                    </div>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Subject Email</label>
                  <input
                    type="text"
                    data-field="subject"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                    onFocus={(e) => { lastFocusedRef.current = e.currentTarget }}
                    placeholder="Judul email yang akan muncul di inbox peserta..."
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:outline-none transition-shadow"
                  />
                </div>

                {/* Body tabs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">Body Email (HTML)</label>
                    {/* Tab switcher */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
                      {([
                        { key: 'visual', label: 'Visual', icon: Eye },
                        { key: 'html', label: 'HTML', icon: Code2 },
                        { key: 'preview', label: 'Preview', icon: Monitor },
                      ] as const).map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setEmailTab(key)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                            emailTab === key
                              ? 'bg-white text-gray-900 shadow-xs'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab: Visual — email preview live */}
                  {emailTab === 'visual' && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                      <div className="px-3 py-2 border-b border-gray-200 bg-white flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                        <span className="text-[10px] text-gray-400 ml-2">preview — klik HTML untuk mengedit teks</span>
                      </div>
                      <div className="p-3 overflow-y-auto max-h-72">
                        <EmailPreview trigger={editingItem?.event_trigger || ''} content={emailForm} />
                      </div>
                    </div>
                  )}

                  {/* Tab: HTML — all 9 editable fields */}
                  {emailTab === 'html' && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                      {/* Toolbar hint */}
                      <div className="px-3 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="text-[11px] text-amber-700">
                          Warna teks di sini = warna yang diterima di inbox. Klik <strong>Preview</strong> untuk verifikasi tampilan akhir sebelum simpan.
                        </span>
                      </div>

                      <div className="p-4 space-y-3 bg-white max-h-72 overflow-y-auto">
                        {/* Header title */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Judul Header</label>
                          <input
                            type="text" data-field="header_title"
                            value={emailForm.header_title}
                            onChange={(e) => setEmailForm({ ...emailForm, header_title: e.target.value })}
                            onFocus={(e) => { lastFocusedRef.current = e.currentTarget }}
                            placeholder="e.g. ✅ Pendaftaran Berhasil!"
                            required
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-400 focus:outline-none"
                          />
                        </div>

                        {/* Body paragraph */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Paragraf Utama</label>
                          <textarea
                            rows={3} data-field="body"
                            value={emailForm.body}
                            onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                            onFocus={(e) => { lastFocusedRef.current = e.currentTarget }}
                            placeholder="Teks pembuka email setelah sapaan..."
                            required
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-400 focus:outline-none resize-none"
                          />
                        </div>

                        {/* Barcode note */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Catatan Barcode / Info</label>
                          <textarea
                            rows={2} data-field="barcode_note"
                            value={emailForm.barcode_note}
                            onChange={(e) => setEmailForm({ ...emailForm, barcode_note: e.target.value })}
                            onFocus={(e) => { lastFocusedRef.current = e.currentTarget }}
                            placeholder="Catatan barcode atau info penting lainnya..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-400 focus:outline-none resize-none"
                          />
                        </div>

                        {/* Jersey section */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Judul Seksi Jersey</label>
                            <input
                              type="text" data-field="jersey_heading"
                              value={emailForm.jersey_heading}
                              onChange={(e) => setEmailForm({ ...emailForm, jersey_heading: e.target.value })}
                              onFocus={(e) => { lastFocusedRef.current = e.currentTarget }}
                              placeholder="Pengambilan Jersey"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Kontak Info</label>
                            <input
                              type="text" data-field="jersey_contact"
                              value={emailForm.jersey_contact}
                              onChange={(e) => setEmailForm({ ...emailForm, jersey_contact: e.target.value })}
                              onFocus={(e) => { lastFocusedRef.current = e.currentTarget }}
                              placeholder="Info selengkapnya: ..."
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-400 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* CTA */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Teks Sebelum Tombol</label>
                          <textarea
                            rows={2} data-field="cta_note"
                            value={emailForm.cta_note}
                            onChange={(e) => setEmailForm({ ...emailForm, cta_note: e.target.value })}
                            onFocus={(e) => { lastFocusedRef.current = e.currentTarget }}
                            placeholder="Sampai bertemu di {nama_program}! ..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-400 focus:outline-none resize-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Label Tombol CTA</label>
                            <input
                              type="text" data-field="cta_label"
                              value={emailForm.cta_label}
                              onChange={(e) => setEmailForm({ ...emailForm, cta_label: e.target.value })}
                              onFocus={(e) => { lastFocusedRef.current = e.currentTarget }}
                              placeholder="Download Barcode"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Footer</label>
                            <input
                              type="text" data-field="footer"
                              value={emailForm.footer}
                              onChange={(e) => setEmailForm({ ...emailForm, footer: e.target.value })}
                              onFocus={(e) => { lastFocusedRef.current = e.currentTarget }}
                              placeholder="LAZ Darul Hikam — ..."
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-400 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab: Preview — full-size view */}
                  {emailTab === 'preview' && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-[#f4f4f4]">
                      <div className="px-3 py-2 border-b border-gray-200 bg-white flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-[10px] text-gray-500">Tampilan email di inbox — dengan data contoh</span>
                      </div>
                      <div className="p-4 overflow-y-auto max-h-72">
                        <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center', width: '117%', marginLeft: '-8.5%' }}>
                          <EmailPreview trigger={editingItem?.event_trigger || ''} content={emailForm} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Variables */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Code2 className="w-3 h-3" /> Variabel yang Tersedia
                  </p>
                  <p className="text-[10px] text-blue-500 mb-2">Klik variabel untuk menyisipkan ke field yang sedang aktif</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      '{nama}', '{nominal}', '{nomor_daftar}', '{metode}', '{tanggal_acara}',
                      '{nama_program}', '{jam_registrasi}', '{jam_acara}', '{lokasi}',
                      '{rpc_lokasi}', '{ticket_url}',
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => insertVariable(tag)}
                        className="px-2 py-1 bg-white hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-md text-[11px] font-mono font-semibold transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active toggle */}
                <div className="flex items-center justify-between py-3 border-t border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Template aktif</p>
                    <p className="text-[11px] text-gray-500">Email akan dikirim otomatis jika template ini aktif</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmailForm({ ...emailForm, is_active: !emailForm.is_active })}
                    className={`relative inline-flex w-11 h-6 items-center rounded-full transition-colors focus:outline-none ${
                      emailForm.is_active ? 'bg-[#6DC230]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        emailForm.is_active ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-gray-50 shrink-0 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#6DC230] hover:bg-[#5EAA28] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Menyimpan...' : 'Simpan Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
