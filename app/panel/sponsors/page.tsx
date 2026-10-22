'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Plus, Pencil, Trash2, X, Upload, Eye, EyeOff } from 'lucide-react'

interface Sponsor {
  id: number
  name: string
  logo_url: string
  display_order: number
  is_active: boolean
  created_at: string
}

type ModalMode = 'add' | 'edit'

interface FormState {
  name: string
  display_order: string
  is_active: boolean
  logo: File | null
  previewUrl: string
}

const defaultForm: FormState = {
  name: '',
  display_order: '0',
  is_active: true,
  logo: null,
  previewUrl: '',
}

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [modal, setModal] = useState<{ open: boolean; mode: ModalMode; sponsor?: Sponsor }>({
    open: false,
    mode: 'add',
  })
  const [form, setForm] = useState<FormState>(defaultForm)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500)
  }

  const fetchSponsors = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/panel/sponsors')
      const data = await res.json()
      setSponsors(data)
    } catch {
      showToast('Gagal memuat data sponsor', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSponsors() }, [])

  const openAdd = () => {
    setForm(defaultForm)
    setError('')
    setModal({ open: true, mode: 'add' })
  }

  const openEdit = (sponsor: Sponsor) => {
    setForm({
      name: sponsor.name,
      display_order: String(sponsor.display_order),
      is_active: sponsor.is_active,
      logo: null,
      previewUrl: sponsor.logo_url,
    })
    setError('')
    setModal({ open: true, mode: 'edit', sponsor })
  }

  const closeModal = () => {
    setModal((m) => ({ ...m, open: false }))
    setForm(defaultForm)
    setError('')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setForm((f) => ({ ...f, logo: file, previewUrl: URL.createObjectURL(file) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nama wajib diisi'); return }
    if (modal.mode === 'add' && !form.logo) { setError('Logo wajib diupload'); return }

    setSaving(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('name', form.name.trim())
      fd.append('display_order', form.display_order || '0')
      fd.append('is_active', String(form.is_active))
      if (form.logo) fd.append('logo', form.logo)

      let res: Response
      if (modal.mode === 'add') {
        res = await fetch('/api/panel/sponsors', { method: 'POST', body: fd })
      } else {
        res = await fetch(`/api/panel/sponsors/${modal.sponsor!.id}`, { method: 'PUT', body: fd })
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Terjadi kesalahan')
      }

      showToast(modal.mode === 'add' ? 'Sponsor berhasil ditambahkan' : 'Sponsor berhasil diperbarui')
      closeModal()
      fetchSponsors()
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (sponsor: Sponsor) => {
    if (!confirm(`Hapus sponsor "${sponsor.name}"? Tindakan ini tidak bisa dibatalkan.`)) return
    setDeleting(sponsor.id)
    try {
      const res = await fetch(`/api/panel/sponsors/${sponsor.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      showToast('Sponsor berhasil dihapus')
      fetchSponsors()
    } catch {
      showToast('Gagal menghapus sponsor', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const handleToggleActive = async (sponsor: Sponsor) => {
    const fd = new FormData()
    fd.append('name', sponsor.name)
    fd.append('display_order', String(sponsor.display_order))
    fd.append('is_active', String(!sponsor.is_active))
    try {
      const res = await fetch(`/api/panel/sponsors/${sponsor.id}`, { method: 'PUT', body: fd })
      if (!res.ok) throw new Error()
      fetchSponsors()
    } catch {
      showToast('Gagal mengubah status sponsor', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast.show && (
        <div className="fixed top-5 right-5 z-50">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2714]">Manajemen Sponsor</h1>
          <p className="text-sm text-[#5A6E51] mt-0.5">
            Logo sponsor yang tampil di Navbar dan Footer website
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#3A7D0A] hover:bg-[#2d6008] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Sponsor
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8DF] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-[#7D9173]">Memuat data...</div>
        ) : sponsors.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-[#7D9173] mb-3">Belum ada sponsor.</p>
            <button onClick={openAdd} className="text-sm font-semibold text-[#3A7D0A] hover:underline">
              + Tambah sponsor pertama
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAF9] border-b border-[#E2E8DF]">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-[#4A5D40] text-xs uppercase tracking-wide">Logo</th>
                <th className="text-left px-5 py-3 font-semibold text-[#4A5D40] text-xs uppercase tracking-wide">Nama</th>
                <th className="text-center px-5 py-3 font-semibold text-[#4A5D40] text-xs uppercase tracking-wide">Urutan</th>
                <th className="text-center px-5 py-3 font-semibold text-[#4A5D40] text-xs uppercase tracking-wide">Status</th>
                <th className="text-right px-5 py-3 font-semibold text-[#4A5D40] text-xs uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4ED]">
              {sponsors.map((sponsor) => (
                <tr key={sponsor.id} className="hover:bg-[#FAFCF8] transition-colors">
                  <td className="px-5 py-3">
                    <div className="w-20 h-10 bg-[#F0F4ED] rounded-lg flex items-center justify-center overflow-hidden">
                      <Image
                        src={sponsor.logo_url}
                        alt={sponsor.name}
                        width={80}
                        height={40}
                        className="w-full h-full object-contain p-1"
                        unoptimized
                      />
                    </div>
                  </td>
                  <td className="px-5 py-3 font-medium text-[#1A2714]">{sponsor.name}</td>
                  <td className="px-5 py-3 text-center text-[#5A6E51]">{sponsor.display_order}</td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(sponsor)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                        sponsor.is_active
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {sponsor.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {sponsor.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(sponsor)}
                        className="p-1.5 rounded-lg text-[#5A6E51] hover:bg-[#F0F4ED] hover:text-[#1A2714] transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(sponsor)}
                        disabled={deleting === sponsor.id}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8DF]">
              <h2 className="text-base font-bold text-[#1A2714]">
                {modal.mode === 'add' ? 'Tambah Sponsor' : 'Edit Sponsor'}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Logo Upload */}
              <div>
                <label className="block text-xs font-semibold text-[#4A5D40] mb-1.5">
                  Logo {modal.mode === 'add' && <span className="text-red-500">*</span>}
                </label>
                {form.previewUrl && (
                  <div className="mb-2 w-32 h-14 bg-[#F0F4ED] rounded-lg flex items-center justify-center overflow-hidden border border-[#E2E8DF]">
                    <img
                      src={form.previewUrl}
                      alt="Preview"
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 border border-dashed border-[#B5C9AD] rounded-xl text-sm text-[#5A6E51] hover:border-[#3A7D0A] hover:text-[#3A7D0A] transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {form.logo ? form.logo.name : modal.mode === 'edit' ? 'Ganti Logo' : 'Pilih File Logo'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.svg"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <p className="text-[11px] text-[#7D9173] mt-1">PNG, JPG, WEBP, atau SVG. Maks 2MB.</p>
              </div>

              {/* Nama */}
              <div>
                <label className="block text-xs font-semibold text-[#4A5D40] mb-1.5">
                  Nama Sponsor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="cth. LAZ Darul Hikam"
                  className="w-full px-3 py-2 border border-[#D1D9CC] rounded-xl text-sm focus:outline-none focus:border-[#3A7D0A] focus:ring-2 focus:ring-[#3A7D0A]/10"
                />
              </div>

              {/* Urutan */}
              <div>
                <label className="block text-xs font-semibold text-[#4A5D40] mb-1.5">
                  Urutan Tampil
                </label>
                <input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm((f) => ({ ...f, display_order: e.target.value }))}
                  min="0"
                  className="w-full px-3 py-2 border border-[#D1D9CC] rounded-xl text-sm focus:outline-none focus:border-[#3A7D0A] focus:ring-2 focus:ring-[#3A7D0A]/10"
                />
                <p className="text-[11px] text-[#7D9173] mt-1">Angka kecil = tampil lebih awal</p>
              </div>

              {/* Status (edit mode only) */}
              {modal.mode === 'edit' && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      form.is_active ? 'bg-[#3A7D0A]' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      form.is_active ? 'translate-x-4' : 'translate-x-1'
                    }`} />
                  </button>
                  <span className="text-sm font-medium text-[#4A5D40]">
                    {form.is_active ? 'Aktif (ditampilkan di website)' : 'Nonaktif (disembunyikan)'}
                  </span>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-[#D1D9CC] rounded-xl text-sm font-semibold text-[#5A6E51] hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-[#3A7D0A] hover:bg-[#2d6008] disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {saving ? 'Menyimpan...' : modal.mode === 'add' ? 'Simpan' : 'Perbarui'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
