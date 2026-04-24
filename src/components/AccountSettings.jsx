import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function AccountSettings({ isOpen, onClose }) {
  const { user, updateProfile } = useAuth()
  const { toast } = useToast()
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    email:     user?.email     || '',
    phone:     user?.phone     || '',
  })
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleUpdate = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 500))
    updateProfile(form)
    setLoading(false)
    toast.success('อัปเดตโปรไฟล์สำเร็จ')
  }

  const handleAvatar = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'image/png') { toast.error('รองรับเฉพาะไฟล์ PNG เท่านั้น'); return }
    const reader = new FileReader()
    reader.onload = ev => updateProfile({ avatar: ev.target.result })
    reader.readAsDataURL(file)
    toast.success('อัปเดตรูปโปรไฟล์สำเร็จ')
  }

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase()

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-6">ตั้งค่าบัญชีผู้ใช้</h2>

        {/* Profile picture */}
        <div className="mb-5">
          <p className="font-medium text-gray-800 mb-0.5">รูปโปรไฟล์</p>
          <p className="text-xs text-gray-400 mb-4">รองรับเฉพาะไฟล์ PNG</p>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0">
              {user?.avatar
                ? <img src={user.avatar} alt="profile" className="w-full h-full object-cover" />
                : <span className="text-lg font-semibold text-gray-400">{initials}</span>
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: '#E91E8C' }}
            >
              <Upload size={14} /> อัพโหลด
            </button>
            <input ref={fileRef} type="file" accept="image/png" className="hidden" onChange={handleAvatar} />
          </div>
        </div>

        <hr className="border-gray-100 mb-5" />

        {/* First name */}
        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-1.5">ชื่อ</label>
          <div className="flex gap-2">
            <input
              value={form.firstName}
              onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
              className="flex-1 border rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: '#E91E8C' }}
            />
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="px-5 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-60"
              style={{ backgroundColor: '#E91E8C' }}
            >
              {loading ? '...' : 'อัปเดต'}
            </button>
          </div>
        </div>

        {/* Last name */}
        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-1.5">นามสกุล</label>
          <input
            value={form.lastName}
            onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-1.5">อีเมล</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
          />
        </div>

        {/* Phone */}
        <div className="mb-2">
          <label className="block text-sm text-gray-700 mb-1.5">เบอร์โทรศัพท์</label>
          <input
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
          />
        </div>
      </div>
    </div>
  )
}
