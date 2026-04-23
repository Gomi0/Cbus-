import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Toast from '../../components/Toast'

export default function AccountSettings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: user?.name ?? 'Admin SPU',
    email: user?.email ?? 'admin@spu.ac.th',
    phone: '',
    department: 'IT Department',
  })
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [pwErrors, setPwErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const validateProfile = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'กรุณากรอกชื่อ'
    if (!form.email.trim()) e.email = 'กรุณากรอกอีเมล'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'รูปแบบอีเมลไม่ถูกต้อง'
    if (form.phone && !/^[0-9]{9,10}$/.test(form.phone.replace(/-/g, ''))) e.phone = 'หมายเลขโทรศัพท์ไม่ถูกต้อง'
    return e
  }

  const validatePw = () => {
    const e = {}
    if (!pwForm.current) e.current = 'กรุณากรอกรหัสผ่านปัจจุบัน'
    if (!pwForm.newPw) e.newPw = 'กรุณากรอกรหัสผ่านใหม่'
    else if (pwForm.newPw.length < 6) e.newPw = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
    if (!pwForm.confirm) e.confirm = 'กรุณายืนยันรหัสผ่าน'
    else if (pwForm.confirm !== pwForm.newPw) e.confirm = 'รหัสผ่านไม่ตรงกัน'
    return e
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    const errs = validateProfile()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 700))
      setToast({ message: 'บันทึกข้อมูลเรียบร้อย', type: 'success' })
    } finally {
      setLoading(false)
    }
  }

  const handlePwSave = async (e) => {
    e.preventDefault()
    const errs = validatePw()
    if (Object.keys(errs).length) { setPwErrors(errs); return }
    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 700))
      setPwForm({ current: '', newPw: '', confirm: '' })
      setToast({ message: 'เปลี่ยนรหัสผ่านสำเร็จ', type: 'success' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Account Settings</h1>
          <p className="text-sm text-gray-400">จัดการข้อมูลบัญชีของคุณ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-100">
            <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xl">
              {form.name[0]}
            </div>
            <div>
              <p className="font-bold text-gray-800">{form.name}</p>
              <p className="text-sm text-gray-400">{form.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-pink-100 text-pink-600 text-xs rounded-full font-medium">Admin</span>
            </div>
          </div>

          <h3 className="font-semibold text-gray-800 mb-4 text-sm">ข้อมูลส่วนตัว</h3>
          <form onSubmit={handleProfileSave} noValidate className="space-y-3">
            {[
              { key: 'name', label: 'ชื่อ-นามสกุล', type: 'text' },
              { key: 'email', label: 'อีเมล', type: 'email' },
              { key: 'phone', label: 'โทรศัพท์', type: 'tel' },
              { key: 'department', label: 'แผนก', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={e => { setForm(v => ({ ...v, [f.key]: e.target.value })); setErrors(v => ({ ...v, [f.key]: '' })) }}
                  className={`w-full px-3 py-2 rounded-xl border text-sm outline-none transition-colors ${
                    errors[f.key] ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-pink-400'
                  }`}
                />
                {errors[f.key] && <p className="mt-0.5 text-xs text-red-500">{errors[f.key]}</p>}
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 mt-4"
            >
              {loading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
              บันทึกข้อมูล
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm">เปลี่ยนรหัสผ่าน</h3>
          <form onSubmit={handlePwSave} noValidate className="space-y-3">
            {[
              { key: 'current', label: 'รหัสผ่านปัจจุบัน' },
              { key: 'newPw', label: 'รหัสผ่านใหม่' },
              { key: 'confirm', label: 'ยืนยันรหัสผ่านใหม่' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                <input
                  type="password"
                  value={pwForm[f.key]}
                  onChange={e => { setPwForm(v => ({ ...v, [f.key]: e.target.value })); setPwErrors(v => ({ ...v, [f.key]: '' })) }}
                  placeholder="••••••••"
                  className={`w-full px-3 py-2 rounded-xl border text-sm outline-none transition-colors ${
                    pwErrors[f.key] ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-pink-400'
                  }`}
                />
                {pwErrors[f.key] && <p className="mt-0.5 text-xs text-red-500">{pwErrors[f.key]}</p>}
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 mt-4"
            >
              {loading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
              เปลี่ยนรหัสผ่าน
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
