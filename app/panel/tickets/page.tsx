'use client'

import React, { useEffect, useState } from 'react'
import {
  Ticket,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Save,
  X,
  RefreshCw,
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

function SortableTicketRow({
  t,
  onEdit,
  onDelete,
  formatRupiah,
}: {
  t: any
  onEdit: (t: any) => void
  onDelete: (id: number) => void
  formatRupiah: (n: number) => string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: t.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    backgroundColor: isDragging ? '#F0F9EB' : undefined,
  }

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-gray-50/80 transition-colors border-b border-[#E8EDE3]">
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
        #{t.sort_order}
      </td>
      <td className="px-6 py-4">
        <div className="font-bold text-gray-900 text-sm">{t.name}</div>
        {t.description && (
          <div
            className="text-xs text-gray-500 mt-0.5 max-w-sm line-clamp-1 prose prose-xs"
            dangerouslySetInnerHTML={{ __html: t.description }}
          />
        )}
      </td>
      <td className="px-6 py-4 font-extrabold text-sm text-[#3A7D0A]">
        {formatRupiah(Number(t.price))}
      </td>
      <td className="px-6 py-4 text-xs font-semibold text-gray-700">
        {t.max_per_order} tiket
      </td>
      <td className="px-6 py-4 text-xs text-gray-500">
        <div>Mulai: {t.available_from ? new Date(t.available_from).toLocaleDateString('id-ID') : '-'}</div>
        <div>Sampai: {t.available_until ? new Date(t.available_until).toLocaleDateString('id-ID') : '-'}</div>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
            t.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {t.is_active ? 'Aktif' : 'Non-Aktif'}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(t)}
            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(t.id)}
            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 75000,
    maxPerOrder: 5,
    availableFrom: '',
    availableUntil: '',
    isActive: true,
    sortOrder: 1,
  })
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  })

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

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/panel/tickets')
      const json = await res.json()
      if (Array.isArray(json)) setTickets(json)
    } catch (e: any) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = tickets.findIndex((i) => i.id === active.id)
    const newIndex = tickets.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const newItems = arrayMove(tickets, oldIndex, newIndex)
    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      sort_order: idx + 1,
    }))
    setTickets(updatedItems)

    try {
      const payload = updatedItems.map((i) => ({ id: i.id, sort_order: i.sort_order }))
      const res = await fetch('/api/panel/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'tickets', items: payload }),
      })
      if (!res.ok) throw new Error('Gagal menyimpan urutan baru')
      setToast({ show: true, message: 'Urutan tiket berhasil disimpan & cache diperbarui!', type: 'success' })
    } catch (e: any) {
      setToast({ show: true, message: e.message || 'Gagal mengubah urutan', type: 'error' })
      fetchTickets()
    } finally {
      setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000)
    }
  }

  const openCreateModal = () => {
    setEditingItem(null)
    setFormData({
      name: '',
      description: '<p>Sudah termasuk 1 paket sembako dan kaos jersey event...</p>',
      price: 75000,
      maxPerOrder: 5,
      availableFrom: new Date().toISOString().slice(0, 16),
      availableUntil: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 16),
      isActive: true,
      sortOrder: tickets.length + 1,
    })
    setIsModalOpen(true)
  }

  const openEditModal = (t: any) => {
    setEditingItem(t)
    setFormData({
      name: t.name,
      description: t.description || '',
      price: Number(t.price),
      maxPerOrder: t.max_per_order || 5,
      availableFrom: t.available_from ? new Date(t.available_from).toISOString().slice(0, 16) : '',
      availableUntil: t.available_until ? new Date(t.available_until).toISOString().slice(0, 16) : '',
      isActive: t.is_active,
      sortOrder: t.sort_order || 0,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const url = editingItem ? `/api/panel/tickets/${editingItem.id}` : '/api/panel/tickets'
      const method = editingItem ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: formData.price,
          max_per_order: formData.maxPerOrder,
          maxPerOrder: formData.maxPerOrder,
          available_from: formData.availableFrom,
          availableFrom: formData.availableFrom,
          available_until: formData.availableUntil,
          availableUntil: formData.availableUntil,
          is_active: formData.isActive,
          isActive: formData.isActive,
          sort_order: formData.sortOrder,
          sortOrder: formData.sortOrder,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan tiket')

      setToast({
        show: true,
        message: editingItem ? 'Tiket berhasil diperbarui!' : 'Tiket baru berhasil ditambahkan!',
        type: 'success',
      })
      setIsModalOpen(false)
      fetchTickets()
    } catch (err: any) {
      setToast({ show: true, message: err.message, type: 'error' })
    } finally {
      setSaving(false)
      setTimeout(() => setToast((p) => ({ ...p, show: false })), 4000)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kategori tiket ini?')) return
    try {
      const res = await fetch(`/api/panel/tickets/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menghapus tiket')

      setToast({ show: true, message: 'Tiket berhasil dihapus', type: 'success' })
      fetchTickets()
    } catch (err: any) {
      setToast({ show: true, message: err.message, type: 'error' })
    } finally {
      setTimeout(() => setToast((p) => ({ ...p, show: false })), 4000)
    }
  }

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num)
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
            Manajemen Kategori Tiket
          </h1>
          <p className="text-sm text-[#5A6E51] mt-1">
            Kelola harga tiket, periode pendaftaran, dan status ketersediaan tiket Walk Impact. Geser baris untuk mengubah urutan tampilan.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6DC230] hover:bg-[#5EAA28] text-white text-sm font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Tiket</span>
        </button>
      </div>

      {/* Tickets List Card */}
      <div className="bg-white rounded-2xl border border-[#E2E8DF] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#6DC230] mb-2" />
            Memuat kategori tiket...
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            Belum ada kategori tiket. Klik &quot;Tambah Tiket&quot; untuk membuat tier baru.
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
                    <th className="px-6 py-3.5">Nama Tiket</th>
                    <th className="px-6 py-3.5">Harga</th>
                    <th className="px-6 py-3.5">Max / Order</th>
                    <th className="px-6 py-3.5">Periode Berlaku</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <SortableContext
                  items={tickets.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <tbody className="divide-y divide-[#E8EDE3]">
                    {tickets.map((t) => (
                      <SortableTicketRow
                        key={t.id}
                        t={t}
                        onEdit={openEditModal}
                        onDelete={handleDelete}
                        formatRupiah={formatRupiah}
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
                {editingItem ? 'Edit Kategori Tiket' : 'Tambah Tiket Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nama Tiket
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Regular / Early Bird"
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Deskripsi / Benefit (Tiptap RichText)
                </label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(val) => setFormData({ ...formData, description: val })}
                  placeholder="Deskripsikan benefit tiket di sini..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Harga (Rp)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-[#3A7D0A] focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Maks Tiket per Order
                  </label>
                  <input
                    type="number"
                    value={formData.maxPerOrder}
                    onChange={(e) => setFormData({ ...formData, maxPerOrder: Number(e.target.value) })}
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Berlaku Mulai
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.availableFrom}
                    onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Berlaku Sampai
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.availableUntil}
                    onChange={(e) => setFormData({ ...formData, availableUntil: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#6DC230] focus:outline-none"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-[#6DC230] rounded-sm focus:ring-[#6DC230]"
                    />
                    <span>Aktifkan Tiket Ini</span>
                  </label>
                </div>
              </div>

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
                  {saving ? 'Menyimpan...' : 'Simpan Tiket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
