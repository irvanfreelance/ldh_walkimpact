'use client'

import React, { useEffect, useState } from 'react'
import {
  MessageSquare,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Save,
  X,
  RefreshCw,
  AlertCircle,
  Copy,
} from 'lucide-react'

export default function NotificationsPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'templates' | 'logs'>('templates')
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    event_trigger: '',
    channel: 'WHATSAPP',
    message_content: '',
    is_active: true,
  })
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  })

  useEffect(() => {
    fetchTemplates()
    fetchLogs()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/panel/notifications/templates')
      const json = await res.json()
      if (Array.isArray(json)) setTemplates(json)
    } catch (e: any) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/panel/notifications/logs')
      const json = await res.json()
      if (Array.isArray(json)) setLogs(json)
    } catch (e: any) {
      console.error(e)
    }
  }

  const openCreateModal = () => {
    setEditingItem(null)
    setForm({
      event_trigger: 'INVOICE_REMINDER',
      channel: 'WHATSAPP',
      message_content:
        'Halo {nama}, jangan lupa untuk menyelesaikan pembayaran tiket Walk Impact 2026 sebesar Rp {nominal}. Nomor pendaftaran Anda: {nomor_daftar}.',
      is_active: true,
    })
    setIsModalOpen(true)
  }

  const openEditModal = (tpl: any) => {
    setEditingItem(tpl)
    setForm({
      event_trigger: tpl.event_trigger,
      channel: tpl.channel,
      message_content: tpl.message_content,
      is_active: tpl.is_active,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan template')

      setToast({ show: true, message: 'Template notifikasi berhasil disimpan!', type: 'success' })
      setIsModalOpen(false)
      fetchTemplates()
    } catch (err: any) {
      setToast({ show: true, message: err.message, type: 'error' })
    } finally {
      setSaving(false)
      setTimeout(() => setToast((p) => ({ ...p, show: false })), 4000)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus template notifikasi ini?')) return
    try {
      const res = await fetch(`/api/panel/notifications/templates/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menghapus')

      setToast({ show: true, message: 'Template berhasil dihapus', type: 'success' })
      fetchTemplates()
    } catch (err: any) {
      setToast({ show: true, message: err.message, type: 'error' })
    } finally {
      setTimeout(() => setToast((p) => ({ ...p, show: false })), 4000)
    }
  }

  const placeholderTags = ['{nama}', '{nominal}', '{tiket_qty}', '{metode}', '{nomor_daftar}']

  return (
    <div className="space-y-6">
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
            Konfigurasi pesan otomatis WhatsApp yang dikirimkan ke peserta saat transaksi berhasil atau pending.
          </p>
        </div>
        {activeTab === 'templates' && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6DC230] hover:bg-[#5EAA28] text-white text-sm font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Template</span>
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-[#E2E8DF] gap-2">
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'templates'
              ? 'border-[#6DC230] text-[#3A7D0A] bg-emerald-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Daftar Template ({templates.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'logs'
              ? 'border-[#6DC230] text-[#3A7D0A] bg-emerald-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Riwayat Log Pengiriman ({logs.length})</span>
        </button>
      </div>

      {/* Templates View */}
      {activeTab === 'templates' && (
        <div className="bg-white rounded-2xl border border-[#E2E8DF] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#1A2714]">
              <thead className="bg-[#F8FAF9] text-[11px] uppercase font-bold text-gray-500 border-b border-[#E8EDE3]">
                <tr>
                  <th className="px-6 py-3.5">Trigger Event</th>
                  <th className="px-6 py-3.5">Channel</th>
                  <th className="px-6 py-3.5">Isi Pesan Template</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EDE3]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#6DC230] mb-2" />
                      Memuat template notifikasi...
                    </td>
                  </tr>
                ) : templates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                      Belum ada template. Klik tombol di atas untuk menambah.
                    </td>
                  </tr>
                ) : (
                  templates.map((tpl) => (
                    <tr key={tpl.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-xs text-[#3A7D0A]">
                        {tpl.event_trigger}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold uppercase text-gray-700">
                        {tpl.channel}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-700 max-w-lg leading-relaxed whitespace-pre-line">
                        {tpl.message_content}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            tpl.is_active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {tpl.is_active ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(tpl)}
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

      {/* Logs View */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-[#E2E8DF] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#1A2714]">
              <thead className="bg-[#F8FAF9] text-[11px] uppercase font-bold text-gray-500 border-b border-[#E8EDE3]">
                <tr>
                  <th className="px-6 py-3.5">Waktu Kirim</th>
                  <th className="px-6 py-3.5">No. Invoice</th>
                  <th className="px-6 py-3.5">Penerima</th>
                  <th className="px-6 py-3.5">Trigger Event</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EDE3]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                      Belum ada riwayat log pengiriman notifikasi.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-xs text-[#3A7D0A]">
                        {log.invoice_code || '-'}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-800">
                        {log.recipient}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">
                        {log.event_trigger || 'WHATSAPP'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
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

      {/* Modal Dialog Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-[#1A2714]">
                {editingItem ? 'Edit Template Notifikasi' : 'Tambah Template Notifikasi'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Event Trigger
                </label>
                <input
                  type="text"
                  value={form.event_trigger}
                  onChange={(e) => setForm({ ...form, event_trigger: e.target.value })}
                  placeholder="e.g. INVOICE_SUCCESS / INVOICE_PENDING"
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Channel Pengiriman
                </label>
                <select
                  value={form.channel}
                  onChange={(e) => setForm({ ...form, channel: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                >
                  <option value="WHATSAPP">WHATSAPP</option>
                  <option value="EMAIL">EMAIL</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase">
                    Isi Pesan Notifikasi
                  </label>
                  <span className="text-[11px] text-gray-400">Gunakan placeholder</span>
                </div>
                <textarea
                  rows={5}
                  value={form.message_content}
                  onChange={(e) => setForm({ ...form, message_content: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none leading-relaxed"
                />

                <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] text-gray-500 font-medium">Tag yang tersedia:</span>
                  {placeholderTags.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() =>
                        setForm({ ...form, message_content: form.message_content + ' ' + tag })
                      }
                      className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-[11px] font-mono transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 text-[#6DC230] rounded-sm focus:ring-[#6DC230]"
                  />
                  <span>Aktifkan Template Ini</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#6DC230] hover:bg-[#5EAA28] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
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
