'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  Database,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
  RefreshCw,
  Tag,
  Shirt,
  CreditCard,
  Star,
  Upload,
  Eye,
  EyeOff,
  Pencil,
  Settings,
} from 'lucide-react'

// ─── Sponsor types ───────────────────────────────────────────────────────────
interface Sponsor {
  id: number
  name: string
  logo_url: string
  role: 'penyelenggara' | 'pendukung'
  display_order: number
  is_active: boolean
  created_at: string
}

interface SponsorForm {
  name: string
  role: 'penyelenggara' | 'pendukung'
  display_order: string
  is_active: boolean
  logo: File | null
  previewUrl: string
}

const defaultSponsorForm: SponsorForm = {
  name: '',
  role: 'pendukung',
  display_order: '0',
  is_active: true,
  logo: null,
  previewUrl: '',
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'shirt-sizes' | 'payment-methods' | 'sponsors' | 'site-settings'>('categories')

  // Generic master data state (categories / shirt-sizes / payment-methods)
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({})

  // Sponsor-specific state
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [sponsorsLoading, setSponsorsLoading] = useState(false)
  const [sponsorModal, setSponsorModal] = useState<{ open: boolean; mode: 'add' | 'edit'; sponsor?: Sponsor }>({ open: false, mode: 'add' })
  const [sponsorForm, setSponsorForm] = useState<SponsorForm>(defaultSponsorForm)
  const [sponsorError, setSponsorError] = useState('')
  const [sponsorSaving, setSponsorSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Site settings state
  const [siteLogoPreview, setSiteLogoPreview] = useState<string>('')
  const [siteLogoFile, setSiteLogoFile] = useState<File | null>(null)
  const [siteLogoSaving, setSiteLogoSaving] = useState(false)
  const logoFileInputRef = useRef<HTMLInputElement>(null)

  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  })

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 4000)
  }

  const tabs = [
    { id: 'categories' as const, label: 'Kategori Peserta', icon: Tag },
    { id: 'shirt-sizes' as const, label: 'Ukuran Kaos', icon: Shirt },
    { id: 'payment-methods' as const, label: 'Metode Pembayaran', icon: CreditCard },
    { id: 'sponsors' as const, label: 'Sponsor', icon: Star },
    { id: 'site-settings' as const, label: 'Pengaturan Situs', icon: Settings },
  ]

  useEffect(() => {
    if (activeTab === 'sponsors') {
      fetchSponsors()
    } else if (activeTab === 'site-settings') {
      fetchSiteSettings()
    } else {
      fetchMasterData(activeTab)
    }
  }, [activeTab])

  const fetchSiteSettings = async () => {
    try {
      const res = await fetch('/api/panel/settings')
      const data = await res.json()
      if (data.walk_impact_logo) {
        setSiteLogoPreview(data.walk_impact_logo)
      }
    } catch {
      showToast('Gagal memuat pengaturan situs', 'error')
    }
  }

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSiteLogoFile(file)
    setSiteLogoPreview(URL.createObjectURL(file))
  }

  const handleSaveLogoSetting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!siteLogoFile) { showToast('Pilih file logo terlebih dahulu', 'error'); return }
    setSiteLogoSaving(true)
    try {
      const fd = new FormData()
      fd.append('key', 'walk_impact_logo')
      fd.append('file', siteLogoFile)
      const res = await fetch('/api/panel/settings', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan logo')
      showToast('Logo berhasil diperbarui! Refresh halaman untuk melihat perubahan.')
      setSiteLogoFile(null)
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setSiteLogoSaving(false)
    }
  }

  // ─── Generic CRUD ───────────────────────────────────────────────────────────
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
      setForm({ slug: '', label: '', description: '', is_active: true, sort_order: data.length + 1 })
    } else if (activeTab === 'shirt-sizes') {
      setForm({ code: '', label: '', sort_order: data.length + 1 })
    } else if (activeTab === 'payment-methods') {
      setForm({
        code: '', name: '', logo_url: '', provider: 'Midtrans', type: 'bank_transfer',
        admin_fee_flat: 0, is_active: true, sort_order: data.length + 1,
        account_number: '', account_holder: '',
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
      showToast('Data master berhasil disimpan!')
      setIsModalOpen(false)
      fetchMasterData(activeTab)
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data master ini?')) return
    try {
      const res = await fetch(`/api/panel/master/${activeTab}/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menghapus')
      showToast('Data master berhasil dihapus')
      fetchMasterData(activeTab)
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  // ─── Sponsor CRUD ───────────────────────────────────────────────────────────
  const fetchSponsors = async () => {
    setSponsorsLoading(true)
    try {
      const res = await fetch('/api/panel/sponsors')
      const data = await res.json()
      setSponsors(data)
    } catch {
      showToast('Gagal memuat data sponsor', 'error')
    } finally {
      setSponsorsLoading(false)
    }
  }

  const openAddSponsor = () => {
    setSponsorForm(defaultSponsorForm)
    setSponsorError('')
    setSponsorModal({ open: true, mode: 'add' })
  }

  const openEditSponsor = (sponsor: Sponsor) => {
    setSponsorForm({
      name: sponsor.name,
      role: sponsor.role,
      display_order: String(sponsor.display_order),
      is_active: sponsor.is_active,
      logo: null,
      previewUrl: sponsor.logo_url,
    })
    setSponsorError('')
    setSponsorModal({ open: true, mode: 'edit', sponsor })
  }

  const closeSponsorModal = () => {
    setSponsorModal((m) => ({ ...m, open: false }))
    setSponsorForm(defaultSponsorForm)
    setSponsorError('')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSponsorForm((f) => ({ ...f, logo: file, previewUrl: URL.createObjectURL(file) }))
  }

  const handleSponsorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sponsorForm.name.trim()) { setSponsorError('Nama wajib diisi'); return }
    if (sponsorModal.mode === 'add' && !sponsorForm.logo) { setSponsorError('Logo wajib diupload'); return }
    setSponsorSaving(true)
    setSponsorError('')
    try {
      const fd = new FormData()
      fd.append('name', sponsorForm.name.trim())
      fd.append('role', sponsorForm.role)
      fd.append('display_order', sponsorForm.display_order || '0')
      fd.append('is_active', String(sponsorForm.is_active))
      if (sponsorForm.logo) fd.append('logo', sponsorForm.logo)

      const res = sponsorModal.mode === 'add'
        ? await fetch('/api/panel/sponsors', { method: 'POST', body: fd })
        : await fetch(`/api/panel/sponsors/${sponsorModal.sponsor!.id}`, { method: 'PUT', body: fd })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Terjadi kesalahan')
      }
      showToast(sponsorModal.mode === 'add' ? 'Sponsor berhasil ditambahkan' : 'Sponsor berhasil diperbarui')
      closeSponsorModal()
      fetchSponsors()
    } catch (err: any) {
      setSponsorError(err.message || 'Terjadi kesalahan')
    } finally {
      setSponsorSaving(false)
    }
  }

  const handleDeleteSponsor = async (sponsor: Sponsor) => {
    if (!confirm(`Hapus sponsor "${sponsor.name}"? Tindakan ini tidak bisa dibatalkan.`)) return
    setDeletingId(sponsor.id)
    try {
      const res = await fetch(`/api/panel/sponsors/${sponsor.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      showToast('Sponsor berhasil dihapus')
      fetchSponsors()
    } catch {
      showToast('Gagal menghapus sponsor', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleSponsor = async (sponsor: Sponsor) => {
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
      {/* Toast Alert */}
      {toast.show && (
        <div className="fixed top-5 right-5 z-50">
          <div className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
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
            Kelola kategori peserta, ukuran kaos, metode pembayaran, dan sponsor.
          </p>
        </div>
        {activeTab !== 'site-settings' && (
          <button
            onClick={activeTab === 'sponsors' ? openAddSponsor : openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6DC230] hover:bg-[#5EAA28] text-white text-sm font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'sponsors' ? 'Tambah Sponsor' : 'Tambah Data'}</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-[#E2E8DF] gap-1">
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

      {/* ── Sponsors Tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'sponsors' && (
        <div className="bg-white rounded-2xl border border-[#E2E8DF] shadow-xs overflow-hidden">
          {sponsorsLoading ? (
            <div className="py-16 text-center text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#6DC230] mb-2" />
              Memuat data sponsor...
            </div>
          ) : sponsors.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-[#7D9173] mb-3">Belum ada sponsor.</p>
              <button onClick={openAddSponsor} className="text-sm font-semibold text-[#3A7D0A] hover:underline">
                + Tambah sponsor pertama
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#F8FAF9] border-b border-[#E2E8DF]">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-[#4A5D40] text-xs uppercase tracking-wide">Logo</th>
                  <th className="text-left px-5 py-3 font-semibold text-[#4A5D40] text-xs uppercase tracking-wide">Nama</th>
                  <th className="text-center px-5 py-3 font-semibold text-[#4A5D40] text-xs uppercase tracking-wide">Peran</th>
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
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        sponsor.role === 'penyelenggara'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {sponsor.role === 'penyelenggara' ? 'Penyelenggara' : 'Pendukung'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center text-[#5A6E51]">{sponsor.display_order}</td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => handleToggleSponsor(sponsor)}
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
                          onClick={() => openEditSponsor(sponsor)}
                          className="p-1.5 rounded-lg text-[#5A6E51] hover:bg-[#F0F4ED] hover:text-[#1A2714] transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSponsor(sponsor)}
                          disabled={deletingId === sponsor.id}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
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
      )}

      {/* ── Site Settings Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'site-settings' && (
        <div className="bg-white rounded-2xl border border-[#E2E8DF] shadow-xs p-6 max-w-lg space-y-5">
          <div>
            <h3 className="text-base font-bold text-[#1A2714] mb-1">Logo Walk Impact</h3>
            <p className="text-sm text-[#5A6E51]">Upload logo baru untuk mengganti logo yang tampil di navbar, footer, halaman tiket, dan halaman pendaftaran.</p>
          </div>

          {siteLogoPreview && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#4A5D40] uppercase tracking-wide">Preview Logo Saat Ini</p>
              <div className="w-48 h-16 bg-[#F0F4ED] rounded-xl flex items-center justify-center overflow-hidden border border-[#E2E8DF]">
                <img src={siteLogoPreview} alt="Logo preview" className="w-full h-full object-contain p-3" />
              </div>
              <div className="w-48 h-14 bg-[#1A2714] rounded-xl flex items-center justify-center overflow-hidden">
                <img src={siteLogoPreview} alt="Logo on dark" className="w-full h-full object-contain p-3 brightness-0 invert" style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
              <p className="text-[11px] text-[#7D9173]">Tampilan di latar terang (atas) dan latar gelap/footer (bawah)</p>
            </div>
          )}

          <form onSubmit={handleSaveLogoSetting} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#4A5D40] mb-1.5">Upload Logo Baru</label>
              {siteLogoFile && (
                <p className="text-xs text-[#3A7D0A] font-semibold mb-2">✓ {siteLogoFile.name}</p>
              )}
              <button
                type="button"
                onClick={() => logoFileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 border border-dashed border-[#B5C9AD] rounded-xl text-sm text-[#5A6E51] hover:border-[#3A7D0A] hover:text-[#3A7D0A] transition-colors"
              >
                <Upload className="w-4 h-4" />
                {siteLogoFile ? 'Ganti File' : 'Pilih File Logo'}
              </button>
              <input
                ref={logoFileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.svg"
                className="hidden"
                onChange={handleLogoFileChange}
              />
              <p className="text-[11px] text-[#7D9173] mt-1">PNG, JPG, WEBP, atau SVG. Maks 2MB. Disarankan format transparent PNG.</p>
            </div>

            <button
              type="submit"
              disabled={siteLogoSaving || !siteLogoFile}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6DC230] hover:bg-[#5EAA28] disabled:opacity-50 text-white text-sm font-bold transition-colors"
            >
              {siteLogoSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {siteLogoSaving ? 'Menyimpan...' : 'Simpan Logo'}
            </button>
          </form>
        </div>
      )}

      {/* ── Generic Master Data Table ─────────────────────────────────────────── */}
      {activeTab !== 'sponsors' && activeTab !== 'site-settings' && (
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
                          <td className="px-6 py-4 font-mono font-bold text-xs text-[#3A7D0A]">{item.slug}</td>
                          <td className="px-6 py-4 font-bold text-gray-900">{item.label}</td>
                          <td className="px-6 py-4 text-xs text-gray-500 max-w-sm line-clamp-1">{item.description || '-'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              item.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {item.is_active ? 'Aktif' : 'Non-Aktif'}
                            </span>
                          </td>
                        </>
                      )}
                      {activeTab === 'shirt-sizes' && (
                        <>
                          <td className="px-6 py-4 font-bold text-base text-[#3A7D0A]">{item.code}</td>
                          <td className="px-6 py-4 font-semibold text-gray-900">{item.label}</td>
                        </>
                      )}
                      {activeTab === 'payment-methods' && (
                        <>
                          <td className="px-6 py-4 font-mono font-bold text-xs text-[#3A7D0A]">{item.code}</td>
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
                                  NO
                                </div>
                              )}
                              <span className="font-bold text-gray-900">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-600">{item.provider} / {item.type}</td>
                          <td className="px-6 py-4 font-mono text-xs text-gray-700">
                            Rp {Number(item.admin_fee_flat || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              item.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                            }`}>
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
      )}

      {/* ── Generic Master Data Modal ─────────────────────────────────────────── */}
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
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Slug Kategori (ID Unik)</label>
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
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Label Nama Kategori</label>
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
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Deskripsi</label>
                    <textarea
                      rows={2}
                      value={form.description || ''}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Urutan Tampil</label>
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
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Kode Ukuran Kaos</label>
                    <input
                      type="text"
                      value={form.code || ''}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      placeholder="e.g. S, M, L, XL, 2XL, 3XL"
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Label Keterangan</label>
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
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Urutan Tampil</label>
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
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Kode Metode</label>
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
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama Metode</label>
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
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">URL Logo / Ikon Pembayaran</label>
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
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Provider</label>
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
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tipe Saluran</label>
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
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Biaya Admin Flat (Rp)</label>
                      <input
                        type="number"
                        value={form.admin_fee_flat || 0}
                        onChange={(e) => setForm({ ...form, admin_fee_flat: Number(e.target.value) })}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Urutan</label>
                      <input
                        type="number"
                        value={form.sort_order || 0}
                        onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                      />
                    </div>
                  </div>
                  {(form.provider === 'Manual' || form.type === 'bank_transfer' || form.type === 'manual_transfer') && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                      <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Info Rekening Bank (Transfer Manual)</p>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nomor Rekening</label>
                        <input
                          type="text"
                          value={form.account_number || ''}
                          onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                          placeholder="e.g. 00804000200"
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama Pemilik Rekening</label>
                        <input
                          type="text"
                          value={form.account_holder || ''}
                          onChange={(e) => setForm({ ...form, account_holder: e.target.value })}
                          placeholder="e.g. LAZ Darul Hikam"
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
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

      {/* ── Sponsor Modal ─────────────────────────────────────────────────────── */}
      {sponsorModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8DF]">
              <h2 className="text-base font-bold text-[#1A2714]">
                {sponsorModal.mode === 'add' ? 'Tambah Sponsor' : 'Edit Sponsor'}
              </h2>
              <button onClick={closeSponsorModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSponsorSubmit} className="p-6 space-y-4">
              {/* Logo Upload */}
              <div>
                <label className="block text-xs font-semibold text-[#4A5D40] mb-1.5">
                  Logo {sponsorModal.mode === 'add' && <span className="text-red-500">*</span>}
                </label>
                {sponsorForm.previewUrl && (
                  <div className="mb-2 w-32 h-14 bg-[#F0F4ED] rounded-lg flex items-center justify-center overflow-hidden border border-[#E2E8DF]">
                    <img src={sponsorForm.previewUrl} alt="Preview" className="w-full h-full object-contain p-2" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 border border-dashed border-[#B5C9AD] rounded-xl text-sm text-[#5A6E51] hover:border-[#3A7D0A] hover:text-[#3A7D0A] transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {sponsorForm.logo ? sponsorForm.logo.name : sponsorModal.mode === 'edit' ? 'Ganti Logo' : 'Pilih File Logo'}
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
                  value={sponsorForm.name}
                  onChange={(e) => setSponsorForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="cth. LAZ Darul Hikam"
                  className="w-full px-3 py-2 border border-[#D1D9CC] rounded-xl text-sm focus:outline-none focus:border-[#3A7D0A] focus:ring-2 focus:ring-[#3A7D0A]/10"
                />
              </div>

              {/* Peran */}
              <div>
                <label className="block text-xs font-semibold text-[#4A5D40] mb-1.5">
                  Peran Sponsor <span className="text-red-500">*</span>
                </label>
                <select
                  value={sponsorForm.role}
                  onChange={(e) => setSponsorForm((f) => ({ ...f, role: e.target.value as SponsorForm['role'] }))}
                  className="w-full px-3 py-2 border border-[#D1D9CC] rounded-xl text-sm focus:outline-none focus:border-[#3A7D0A] focus:ring-2 focus:ring-[#3A7D0A]/10 bg-white"
                >
                  <option value="pendukung">Pendukung — tampil di "Didukung Oleh"</option>
                  <option value="penyelenggara">Penyelenggara — tampil di "Diselenggarakan oleh" + Navbar</option>
                </select>
              </div>

              {/* Urutan */}
              <div>
                <label className="block text-xs font-semibold text-[#4A5D40] mb-1.5">Urutan Tampil</label>
                <input
                  type="number"
                  value={sponsorForm.display_order}
                  onChange={(e) => setSponsorForm((f) => ({ ...f, display_order: e.target.value }))}
                  min="0"
                  className="w-full px-3 py-2 border border-[#D1D9CC] rounded-xl text-sm focus:outline-none focus:border-[#3A7D0A] focus:ring-2 focus:ring-[#3A7D0A]/10"
                />
                <p className="text-[11px] text-[#7D9173] mt-1">Angka kecil = tampil lebih awal</p>
              </div>

              {/* Status (edit mode only) */}
              {sponsorModal.mode === 'edit' && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSponsorForm((f) => ({ ...f, is_active: !f.is_active }))}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      sponsorForm.is_active ? 'bg-[#3A7D0A]' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      sponsorForm.is_active ? 'translate-x-4' : 'translate-x-1'
                    }`} />
                  </button>
                  <span className="text-sm font-medium text-[#4A5D40]">
                    {sponsorForm.is_active ? 'Aktif (ditampilkan di website)' : 'Nonaktif (disembunyikan)'}
                  </span>
                </div>
              )}

              {sponsorError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {sponsorError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeSponsorModal}
                  className="flex-1 px-4 py-2 border border-[#D1D9CC] rounded-xl text-sm font-semibold text-[#5A6E51] hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sponsorSaving}
                  className="flex-1 px-4 py-2 bg-[#3A7D0A] hover:bg-[#2d6008] disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {sponsorSaving ? 'Menyimpan...' : sponsorModal.mode === 'add' ? 'Simpan' : 'Perbarui'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
