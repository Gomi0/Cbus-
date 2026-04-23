import { useState } from 'react'
import { Camera, Save, KeyRound } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function AccountSettingsPage() {
  const { user, updateProfile } = useAuth()
  const { toast } = useToast()
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [saving, setSaving] = useState(false)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    updateProfile(form)
    setSaving(false)
    toast.success('Profile updated successfully')
  }

  const initials = `${form.firstName?.[0] || ''}${form.lastName?.[0] || ''}`.toUpperCase() || 'U'

  const inputCls = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:ring-2 focus:ring-[#E91E8C]/20 transition"

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onOpenAccount={() => {}} />

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500 overflow-hidden border-4 border-white shadow-md">
                {user?.avatar
                  ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                  : initials
                }
              </div>
              <button
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-md"
                style={{ backgroundColor: '#E91E8C' }}
                title="Change photo"
              >
                <Camera size={13} className="text-white" />
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-3">Click the camera icon to change photo</p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                <input type="text" value={form.firstName} onChange={set('firstName')} required className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                <input type="text" value={form.lastName} onChange={set('lastName')} required className={inputCls} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={set('email')} required className={inputCls} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input type="tel" value={form.phone} onChange={set('phone')} placeholder="e.g. 0812345678" className={inputCls} />
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-white font-semibold text-sm transition disabled:opacity-60"
                style={{ backgroundColor: '#E91E8C' }}
              >
                <Save size={15} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="flex items-center gap-2 px-6 py-2.5 rounded-full border font-semibold text-sm transition hover:bg-gray-50"
                style={{ borderColor: '#E91E8C', color: '#E91E8C' }}
              >
                <KeyRound size={15} />
                Change Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
