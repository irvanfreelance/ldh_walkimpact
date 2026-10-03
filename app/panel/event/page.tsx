'use client'

import React, { useEffect, useState } from 'react'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Save,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import { RichTextEditor } from '@/components/editor/RichTextEditor'

export default function EventSettingsPage() {
  const [formData, setFormData] = useState<any>({
    name: '',
    tagline: '',
    description: '',
    event_date: '',
    assembly_time: '',
    start_time: '',
    end_time: '',
    venue_name: '',
    venue_address: '',
    venue_city: '',
    venue_maps_url: '',
    route_km: '7.0',
    max_quota: 750,
    contact_name: '',
    contact_whatsapp: '',
    is_active: true,
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error'
  }>({ show: false, message: '', type: 'success' })

  useEffect(() => {
    fetchEvent()
  }, [])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/panel/event')
      if (!res.ok) throw new Error('Gagal memuat pengaturan event')
      const json = await res.json()
      setFormData({
        ...json,
        event_date: json.event_date ? json.event_date.slice(0, 10) : '',
        max_quota: Number(json.max_quota) || 750,
      })
    } catch (err: any) {
      setNotification({ show: true, message: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev: any) => ({ ...prev, [name]: checked }))
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const res = await fetch('/api/panel/event', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan perubahan')

      setNotification({
        show: true,
        message: 'Pengaturan event berhasil disimpan! Cache Redis telah dibersihkan.',
        type: 'success',
      })
    } catch (err: any) {
      setNotification({ show: true, message: err.message, type: 'error' })
    } finally {
      setSaving(false)
      setTimeout(() => setNotification((prev) => ({ ...prev, show: false })), 4000)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-[#6DC230] animate-spin" />
        <p className="text-sm font-medium text-gray-500">Memuat data event...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Toast Alert */}
      {notification.show && (
        <div className="fixed top-5 right-5 z-50">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A2714] tracking-tight">
            Pengaturan Event Utama
          </h1>
          <p className="text-sm text-[#5A6E51] mt-1">
            Ubah informasi tanggal, venue, jarak rute, dan kuota maksimal peserta Walk Impact.
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#6DC230] hover:bg-[#5EAA28] text-white text-sm font-bold shadow-xs transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Event Info */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8DF] shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#1A2714] border-b pb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#3A7D0A]" />
            <span>Identitas & Informasi Utama</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Nama Event
              </label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Tagline Slogan
              </label>
              <input
                type="text"
                name="tagline"
                value={formData.tagline || ''}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Deskripsi Event (RichText)
              </label>
              <RichTextEditor
                value={formData.description || ''}
                onChange={(val) => setFormData((prev: any) => ({ ...prev, description: val }))}
                placeholder="Tuliskan deskripsi lengkap event..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Tanggal Pelaksanaan
              </label>
              <input
                type="date"
                name="event_date"
                value={formData.event_date || ''}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Total Jarak Rute (KM)
              </label>
              <input
                type="text"
                name="route_km"
                value={formData.route_km || ''}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Time & Quota */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8DF] shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#1A2714] border-b pb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#3A7D0A]" />
            <span>Waktu & Kapasitas Kuota</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Jam Kumpul (Assembly)
              </label>
              <input
                type="time"
                step="1"
                name="assembly_time"
                value={formData.assembly_time || ''}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Jam Start
              </label>
              <input
                type="time"
                step="1"
                name="start_time"
                value={formData.start_time || ''}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Jam Selesai
              </label>
              <input
                type="time"
                step="1"
                name="end_time"
                value={formData.end_time || ''}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Maksimal Kuota Peserta (Total Quota)
              </label>
              <input
                type="number"
                name="max_quota"
                value={formData.max_quota || ''}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-[#3A7D0A] focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                *Mengubah kuota akan langsung mengupdate progress bar di website utama & widget kuota pendaftaran.
              </p>
            </div>
          </div>
        </div>

        {/* Venue & Location */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8DF] shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#1A2714] border-b pb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#3A7D0A]" />
            <span>Lokasi Venue Acara</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Nama Tempat (Venue)
              </label>
              <input
                type="text"
                name="venue_name"
                value={formData.venue_name || ''}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Kota
              </label>
              <input
                type="text"
                name="venue_city"
                value={formData.venue_city || ''}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Alamat Lengkap
              </label>
              <textarea
                name="venue_address"
                rows={2}
                value={formData.venue_address || ''}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                URL Google Maps
              </label>
              <input
                type="text"
                name="venue_maps_url"
                value={formData.venue_maps_url || ''}
                onChange={handleChange}
                placeholder="https://maps.google.com/..."
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Contact Panitia */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8DF] shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#1A2714] border-b pb-3">
            Kontak Panitia
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Nama PIC / Panitia
              </label>
              <input
                type="text"
                name="contact_name"
                value={formData.contact_name || ''}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                WhatsApp Panitia
              </label>
              <input
                type="text"
                name="contact_whatsapp"
                value={formData.contact_whatsapp || ''}
                onChange={handleChange}
                placeholder="6281234..."
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
