'use client'

import React, { useEffect, useState } from 'react'
import {
  Database,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Save,
  X,
  RefreshCw,
  Tag,
  Shirt,
  CreditCard,
} from 'lucide-react'

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'shirt-sizes' | 'payment-methods'>('categories')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({})
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  })

  const tabs = [
    { id: 'categories' as const, label: 'Kategori Peserta', icon: Tag },
    { id: 'shirt-sizes' as const, label: 'Ukuran Kaos (Jersey)', icon: Shirt },
    { id: 'payment-methods' as const, label: 'Metode Pembayaran', icon: CreditCard },
  ]

  useEffect(() => {
    fetchMasterData(activeTab)
  }, [activeTab])

  const fetchMasterData = async (tab: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/panel/master/${tab}`)
      const json = await res.json()
      if (Array.isArray(json)) setData(json)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingItem(null)
    if (activeTab === 'categories') {
      setForm({
        slug: '',
        label: '',
        description: '',
        is_active: true,
        sort_order: data.length + 1,
      })
    } else if (activeTab === 'shirt-sizes') {
      setForm({
        code: '',
        label: '',
        sort_order: data.length + 1,
      })
    } else if (activeTab === 'payment-methods') {
      setForm({
        code: '',
        name: '',
        logo_url: '',
        provider: 'Midtrans',
        type: 'bank_transfer',
        admin_fee_flat: 0,
        is_active: true,
        sort_order: data.length + 1,
      })
    }
    setIsModalOpen(true)
  }

  const openEditModal = (item: any) => {
    setEditingItem(item)
    setForm({ ...item })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const url = editingItem
        ? `/api/panel/master/${activeTab}/${editingItem.id}`
        : `/api/panel/master/${activeTab}`
      const method = editingItem ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan data master')

      setToast({ show: true, message: 'Data master berhasil disimpan!', type: 'success' })
      setIsModalOpen(false)
      fetchMasterData(activeTab)
    } catch (err: any) {
      setToast({ show: true, message: err.message, type: 'error' })
    } finally {
      setSaving(false)
      setTimeout(() => setToast((p) => ({ ...p, show: false })), 4000)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data master ini?')) return
    try {
      const res = await fetch(`/api/panel/master/${activeTab}/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menghapus')

      setToast({ show: true, message: 'Data master berhasil dihapus', type: 'success' })
      fetchMasterData(activeTab)
    } catch (err: any) {
      setToast({ show: true, message: err.message, type: 'error' })
    } finally {
      setTimeout(() => setToast((p) => ({ ...p, show: false })), 4000)
    }
  }

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
            Master Data Sistem
          </h1>
          <p className="text-sm text-[#5A6E51] mt-1">
            Kelola data acuan kategori peserta, varian ukuran kaos, serta konfigurasi channel pembayaran.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6DC230] hover:bg-[#5EAA28] text-white text-sm font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Data</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E2E8DF] gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                isActive
                  ? 'border-[#6DC230] text-[#3A7D0A] bg-emerald-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-[#E2E8DF] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#6DC230] mb-2" />
            Memuat data master...
          </div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center text-gray-400">Belum ada data.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#1A2714]">
              <thead className="bg-[#F8FAF9] text-[11px] uppercase font-bold text-gray-500 border-b border-[#E8EDE3]">
                <tr>
                  <th className="px-6 py-3.5">Urutan</th>
                  {activeTab === 'categories' && (
                    <>
                      <th className="px-6 py-3.5">Slug</th>
                      <th className="px-6 py-3.5">Label Kategori</th>
                      <th className="px-6 py-3.5">Deskripsi</th>
                      <th className="px-6 py-3.5">Status</th>
                    </>
                  )}
                  {activeTab === 'shirt-sizes' && (
                    <>
                      <th className="px-6 py-3.5">Kode Ukuran</th>
                      <th className="px-6 py-3.5">Label Keterangan</th>
                    </>
                  )}
                  {activeTab === 'payment-methods' && (
                    <>
                      <th className="px-6 py-3.5">Kode</th>
                      <th className="px-6 py-3.5">Nama Channel</th>
                      <th className="px-6 py-3.5">Provider / Tipe</th>
                      <th className="px-6 py-3.5">Admin Fee</th>
                      <th className="px-6 py-3.5">Status</th>
                    </>
                  )}
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EDE3]">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-400 text-xs">
                      #{item.sort_order}
                    </td>

                    {activeTab === 'categories' && (
                      <>
                        <td className="px-6 py-4 font-mono font-bold text-xs text-[#3A7D0A]">
                          {item.slug}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {item.label}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 max-w-sm line-clamp-1">
                          {item.description || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              item.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {item.is_active ? 'Aktif' : 'Non-Aktif'}
                          </span>
                        </td>
                      </>
                    )}

                    {activeTab === 'shirt-sizes' && (
                      <>
                        <td className="px-6 py-4 font-bold text-base text-[#3A7D0A]">
                          {item.code}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {item.label}
                        </td>
                      </>
                    )}

                    {activeTab === 'payment-methods' && (
                      <>
                        <td className="px-6 py-4 font-mono font-bold text-xs text-[#3A7D0A]">
                          {item.code}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {item.logo_url ? (
                              <img
                                src={item.logo_url}
                                alt={item.name}
                                className="w-8 h-8 object-contain rounded-md border border-gray-100 p-0.5 bg-white shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] font-bold shrink-0">
                                NO LOGO
                              </div>
                            )}
                            <span className="font-bold text-gray-900">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600">
                          {item.provider} / {item.type}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-700">
                          Rp {Number(item.admin_fee_flat || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              item.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {item.is_active ? 'Aktif' : 'Non-Aktif'}
                          </span>
                        </td>
                      </>
                    )}

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-[#1A2714]">
                {editingItem ? 'Edit Data Master' : 'Tambah Data Master'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'categories' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Slug Kategori (ID Unik)
                    </label>
                    <input
                      type="text"
                      value={form.slug || ''}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      placeholder="e.g. keluarga / komunitas"
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Label Nama Kategori
                    </label>
                    <input
                      type="text"
                      value={form.label || ''}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                      placeholder="e.g. Keluarga / Komunitas"
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Deskripsi
                    </label>
                    <textarea
                      rows={2}
                      value={form.description || ''}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Urutan Tampil
                      </label>
                      <input
                        type="number"
                        value={form.sort_order || 0}
                        onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                      />
                    </div>
                    <div className="pt-5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                        <input
                          type="checkbox"
                          checked={form.is_active ?? true}
                          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                          className="w-4 h-4 text-[#6DC230] rounded-sm focus:ring-[#6DC230]"
                        />
                        <span>Aktif</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'shirt-sizes' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Kode Ukuran Kaos
                    </label>
                    <input
                      type="text"
                      value={form.code || ''}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      placeholder="e.g. S, M, L, XL, XXL, 3XL"
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Label Keterangan
                    </label>
                    <input
                      type="text"
                      value={form.label || ''}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                      placeholder="e.g. Small / Medium"
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Urutan Tampil
                    </label>
                    <input
                      type="number"
                      value={form.sort_order || 0}
                      onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                    />
                  </div>
                </>
              )}

              {activeTab === 'payment-methods' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Kode Metode
                    </label>
                    <input
                      type="text"
                      value={form.code || ''}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      placeholder="e.g. bca_va / qris"
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Nama Metode
                    </label>
                    <input
                      type="text"
                      value={form.name || ''}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. BCA Virtual Account"
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      URL Logo / Ikon Pembayaran
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="url"
                        value={form.logo_url || ''}
                        onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                        placeholder="https://.../logo.png"
                        className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#6DC230] focus:outline-none font-mono"
                      />
                      {form.logo_url && (
                        <img
                          src={form.logo_url}
                          alt="Preview"
                          className="w-9 h-9 object-contain rounded-lg border border-gray-200 p-1 bg-white shrink-0"
                          onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                        />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Provider
                      </label>
                      <select
                        value={form.provider || 'Midtrans'}
                        onChange={(e) => setForm({ ...form, provider: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none bg-white"
                      >
                        <option value="Midtrans">Midtrans</option>
                        <option value="Manual">Manual</option>
                        <option value="Xendit">Xendit</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Tipe Saluran
                      </label>
                      <select
                        value={form.type || 'va'}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none bg-white"
                      >
                        <option value="va">Virtual Account (VA)</option>
                        <option value="qr_code">QRIS / QR Code</option>
                        <option value="E-Wallet">E-Wallet</option>
                        <option value="bank_transfer">Manual Transfer</option>
                        <option value="credit_card">Kartu Kredit</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Biaya Admin Flat (Rp)
                      </label>
                      <input
                        type="number"
                        value={form.admin_fee_flat || 0}
                        onChange={(e) => setForm({ ...form, admin_fee_flat: Number(e.target.value) })}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Urutan
                      </label>
                      <input
                        type="number"
                        value={form.sort_order || 0}
                        onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                      <input
                        type="checkbox"
                        checked={form.is_active ?? true}
                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                        className="w-4 h-4 text-[#6DC230] rounded-sm focus:ring-[#6DC230]"
                      />
                      <span>Aktifkan Channel Ini</span>
                    </label>
                  </div>
                </>
              )}

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
                  {saving ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
