'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  HelpCircle,
  Clock,
  BarChart3,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  GripVertical,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { RichTextEditor } from '@/components/editor/RichTextEditor'

// Sortable Table Row Component
function SortableRow({
  item,
  activeTab,
  onEdit,
  onDelete,
}: {
  item: any
  activeTab: string
  onEdit: (item: any) => void
  onDelete: (id: number) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    backgroundColor: isDragging ? '#F0F9EB' : undefined,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="hover:bg-gray-50/80 transition-colors border-b border-[#E8EDE3]"
    >
      <td className="px-4 py-4 w-12 text-center">
        <button
          type="button"
          {...attributes}
          {...listeners}
          title="Geser untuk mengubah urutan"
          className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </td>
      <td className="px-4 py-4 font-bold text-gray-400 text-xs w-16">
        #{item.sort_order}
      </td>

      {/* FAQ Columns */}
      {activeTab === 'faqs' && (
        <>
          <td className="px-6 py-4 font-semibold text-gray-900 max-w-xs">
            {item.question}
          </td>
          <td className="px-6 py-4 text-xs text-gray-600 max-w-md">
            <div
              className="line-clamp-2 prose prose-xs max-w-none"
              dangerouslySetInnerHTML={{ __html: item.answer }}
            />
          </td>
          <td className="px-6 py-4 text-xs font-medium text-gray-600">
            {item.category}
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

      {/* Rundown Columns */}
      {activeTab === 'rundowns' && (
        <>
          <td className="px-6 py-4 font-mono text-xs font-bold text-[#3A7D0A] whitespace-nowrap">
            {item.start_time} - {item.end_time}
          </td>
          <td className="px-6 py-4 font-bold text-gray-900 text-sm">
            {item.activity}
          </td>
          <td className="px-6 py-4 text-xs text-gray-500 max-w-sm line-clamp-2">
            {item.description || '-'}
          </td>
        </>
      )}

      {/* Stats Columns */}
      {activeTab === 'stats' && (
        <>
          <td className="px-6 py-4 font-extrabold text-base text-[#3A7D0A]">
            {item.value}
          </td>
          <td className="px-6 py-4 font-semibold text-gray-900">
            {item.label}
          </td>
          <td className="px-6 py-4 font-mono text-xs text-gray-500">
            {item.icon_name}
          </td>
        </>
      )}

      {/* Concepts Columns */}
      {activeTab === 'concepts' && (
        <>
          <td className="px-6 py-4 font-bold text-gray-900">
            {item.title}
          </td>
          <td className="px-6 py-4 text-xs text-gray-600 max-w-md">
            <div
              className="line-clamp-2 prose prose-xs max-w-none"
              dangerouslySetInnerHTML={{ __html: item.body }}
            />
          </td>
          <td className="px-6 py-4 font-mono text-xs text-gray-500">
            {item.icon_name}
          </td>
        </>
      )}

      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

function CMSContent() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'faqs'
  const [activeTab, setActiveTab] = useState(initialTab)

  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  })

  // Dynamic form state
  const [form, setForm] = useState<any>({})

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const tabs = [
    { id: 'faqs', label: 'Tanya Jawab (FAQ)', icon: HelpCircle },
    { id: 'rundowns', label: 'Rundown Acara', icon: Clock },
    { id: 'stats', label: 'Statistik & Dampak', icon: BarChart3 },
    { id: 'concepts', label: 'Konsep Acara', icon: Sparkles },
  ]

  useEffect(() => {
    fetchCMSData(activeTab)
  }, [activeTab])

  const fetchCMSData = async (tab: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/panel/cms/${tab}`)
      const json = await res.json()
      if (Array.isArray(json)) setData(json)
    } catch (e: any) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = data.findIndex((i) => i.id === active.id)
    const newIndex = data.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const newItems = arrayMove(data, oldIndex, newIndex)
    // Update sort_order based on new order
    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      sort_order: idx + 1,
    }))
    setData(updatedItems)

    try {
      const payload = updatedItems.map((i) => ({ id: i.id, sort_order: i.sort_order }))
      const res = await fetch('/api/panel/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTab, items: payload }),
      })
      if (!res.ok) throw new Error('Gagal menyimpan urutan baru')
      setToast({ show: true, message: 'Urutan berhasil diperbarui & disinkronkan ke cache!', type: 'success' })
    } catch (e: any) {
      setToast({ show: true, message: e.message || 'Gagal mengubah urutan', type: 'error' })
      fetchCMSData(activeTab)
    } finally {
      setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000)
    }
  }

  const openCreateModal = () => {
    setEditingItem(null)
    if (activeTab === 'faqs') {
      setForm({
        question: '',
        answer: '<p>Tuliskan jawaban lengkap di sini...</p>',
        category: 'general',
        sort_order: data.length + 1,
        is_active: true,
      })
    } else if (activeTab === 'rundowns') {
      setForm({
        start_time: '06:00:00',
        end_time: '07:00:00',
        activity: '',
        description: '',
        sort_order: data.length + 1,
      })
    } else if (activeTab === 'stats') {
      setForm({
        icon_name: 'award',
        value: '7.0 KM',
        label: '',
        description: '',
        sort_order: data.length + 1,
      })
    } else if (activeTab === 'concepts') {
      setForm({
        icon_name: 'sparkles',
        title: '',
        body: '<p>Jelaskan konsep kegiatan di sini...</p>',
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
        ? `/api/panel/cms/${activeTab}/${editingItem.id}`
        : `/api/panel/cms/${activeTab}`
      const method = editingItem ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan data')

      setToast({
        show: true,
        message: 'Konten CMS berhasil disimpan & cache diperbarui!',
        type: 'success',
      })
      setIsModalOpen(false)
      fetchCMSData(activeTab)
    } catch (err: any) {
      setToast({ show: true, message: err.message, type: 'error' })
    } finally {
      setSaving(false)
      setTimeout(() => setToast((p) => ({ ...p, show: false })), 4000)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus konten ini?')) return
    try {
      const res = await fetch(`/api/panel/cms/${activeTab}/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menghapus')

      setToast({ show: true, message: 'Konten berhasil dihapus', type: 'success' })
      fetchCMSData(activeTab)
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
            Konten Landing Page (CMS)
          </h1>
          <p className="text-sm text-[#5A6E51] mt-1">
            Ubah teks FAQ, susunan rundown, data statistik, dan kartu konsep. Tersedia fitur Drag &amp; Drop untuk menyusun urutan.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6DC230] hover:bg-[#5EAA28] text-white text-sm font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Konten</span>
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-[#E2E8DF] gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-[#6DC230] text-[#3A7D0A] bg-emerald-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content Table / Drag & Drop Grid */}
      <div className="bg-white rounded-2xl border border-[#E2E8DF] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#6DC230] mb-2" />
            Memuat data konten...
          </div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            Belum ada konten di tab ini. Klik &quot;Tambah Konten&quot; untuk menambahkan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="w-full text-left text-sm text-[#1A2714]">
                <thead className="bg-[#F8FAF9] text-[11px] uppercase font-bold text-gray-500 border-b border-[#E8EDE3]">
                  <tr>
                    <th className="px-4 py-3.5 text-center w-12">Geser</th>
                    <th className="px-4 py-3.5 w-16">Urutan</th>
                    {activeTab === 'faqs' && (
                      <>
                        <th className="px-6 py-3.5">Pertanyaan</th>
                        <th className="px-6 py-3.5">Jawaban (RichText)</th>
                        <th className="px-6 py-3.5">Kategori</th>
                        <th className="px-6 py-3.5">Status</th>
                      </>
                    )}
                    {activeTab === 'rundowns' && (
                      <>
                        <th className="px-6 py-3.5">Waktu</th>
                        <th className="px-6 py-3.5">Aktivitas</th>
                        <th className="px-6 py-3.5">Deskripsi</th>
                      </>
                    )}
                    {activeTab === 'stats' && (
                      <>
                        <th className="px-6 py-3.5">Angka / Nilai</th>
                        <th className="px-6 py-3.5">Label</th>
                        <th className="px-6 py-3.5">Icon</th>
                      </>
                    )}
                    {activeTab === 'concepts' && (
                      <>
                        <th className="px-6 py-3.5">Judul Konsep</th>
                        <th className="px-6 py-3.5">Penjelasan (RichText)</th>
                        <th className="px-6 py-3.5">Icon</th>
                      </>
                    )}
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <SortableContext
                  items={data.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <tbody className="divide-y divide-[#E8EDE3]">
                    {data.map((item) => (
                      <SortableRow
                        key={item.id}
                        item={item}
                        activeTab={activeTab}
                        onEdit={openEditModal}
                        onDelete={handleDelete}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </table>
            </DndContext>
          </div>
        )}
      </div>

      {/* Modal Dialog Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-[#1A2714]">
                {editingItem ? 'Edit Konten' : 'Tambah Konten Baru'} ({tabs.find((t) => t.id === activeTab)?.label})
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* FAQ Fields */}
              {activeTab === 'faqs' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Pertanyaan
                    </label>
                    <input
                      type="text"
                      value={form.question || ''}
                      onChange={(e) => setForm({ ...form, question: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Jawaban (Tiptap RichText Editor)
                    </label>
                    <RichTextEditor
                      value={form.answer || ''}
                      onChange={(val) => setForm({ ...form, answer: val })}
                      placeholder="Ketik jawaban lengkap di sini..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Kategori
                      </label>
                      <input
                        type="text"
                        value={form.category || 'general'}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
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
                  </div>
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                      <input
                        type="checkbox"
                        checked={form.is_active ?? true}
                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                        className="w-4 h-4 text-[#6DC230] rounded-sm focus:ring-[#6DC230]"
                      />
                      <span>Tampilkan di Halaman Utama</span>
                    </label>
                  </div>
                </>
              )}

              {/* Rundown Fields */}
              {activeTab === 'rundowns' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Jam Mulai
                      </label>
                      <input
                        type="time"
                        step="1"
                        value={form.start_time || ''}
                        onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                        required
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Jam Selesai
                      </label>
                      <input
                        type="time"
                        step="1"
                        value={form.end_time || ''}
                        onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                        required
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Aktivitas
                    </label>
                    <input
                      type="text"
                      value={form.activity || ''}
                      onChange={(e) => setForm({ ...form, activity: e.target.value })}
                      required
                      placeholder="Contoh: Registrasi Ulang & Pengambilan Race Pack"
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
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
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

              {/* Stats Fields */}
              {activeTab === 'stats' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Angka / Nilai
                      </label>
                      <input
                        type="text"
                        value={form.value || ''}
                        onChange={(e) => setForm({ ...form, value: e.target.value })}
                        required
                        placeholder="Contoh: 7.0 KM / 1.000 Paket"
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-[#3A7D0A] focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Icon Name
                      </label>
                      <input
                        type="text"
                        value={form.icon_name || ''}
                        onChange={(e) => setForm({ ...form, icon_name: e.target.value })}
                        placeholder="route / gift / users"
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      value={form.label || ''}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                      required
                      placeholder="Contoh: Jarak Tempuh Berdampak"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Deskripsi Tambahan
                    </label>
                    <input
                      type="text"
                      value={form.description || ''}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
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

              {/* Concepts Fields */}
              {activeTab === 'concepts' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Judul Konsep
                    </label>
                    <input
                      type="text"
                      value={form.title || ''}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                      placeholder="Contoh: Sehat Bersama, Berdampak Nyata"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Penjelasan / Isi (Tiptap RichText Editor)
                    </label>
                    <RichTextEditor
                      value={form.body || ''}
                      onChange={(val) => setForm({ ...form, body: val })}
                      placeholder="Jelaskan konsep kegiatan di sini..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Icon Name
                      </label>
                      <input
                        type="text"
                        value={form.icon_name || ''}
                        onChange={(e) => setForm({ ...form, icon_name: e.target.value })}
                        placeholder="heart / shoes / globe"
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none font-mono"
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
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#6DC230] hover:bg-[#5EAA28] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Konten'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CMSPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-gray-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#6DC230] mb-2" />
          Memuat halaman CMS...
        </div>
      }
    >
      <CMSContent />
    </Suspense>
  )
}
