import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import heroImg from '../../assets/hero.png'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'กรุณากรอกชื่อ'
    if (!form.email.trim()) e.email = 'กรุณากรอกอีเมล'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'รูปแบบอีเมลไม่ถูกต้อง'
    if (!form.password) e.password = 'กรุณากรอกรหัสผ่าน'
    else if (form.password.length < 6) e.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
    if (!form.confirm) e.confirm = 'กรุณายืนยันรหัสผ่าน'
    else if (form.confirm !== form.password) e.confirm = 'รหัสผ่านไม่ตรงกัน'
    return e
  }

  const handleChange = (field) => (e) => {
    setForm(v => ({ ...v, [field]: e.target.value }))
    setErrors(v => ({ ...v, [field]: '' }))
    setApiError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 800))
      navigate('/login')
    } catch {
      setApiError('เกิดข้อผิดพลาด กรุณาลองอีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'admin@spu.ac.th' },
    { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
    { key: 'confirm', label: 'Confirm Password', type: 'password', placeholder: '••••••••' },
  ]

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-pink-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">SPU</span>
            </div>
            <span className="font-bold text-gray-800 text-lg">Building Control</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-1">Welcome to Sign in at</h1>
          <p className="text-gray-400 text-sm mb-7">Create your account</p>

          {apiError && (
            <div role="alert" className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-600 text-sm">{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {fields.map(f => (
              <div key={f.key} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={handleChange(f.key)}
                  placeholder={f.placeholder}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors ${
                    errors[f.key] ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-gray-200 focus:border-pink-400'
                  }`}
                  aria-invalid={!!errors[f.key]}
                  aria-describedby={errors[f.key] ? `${f.key}-err` : undefined}
                />
                {errors[f.key] && <p id={`${f.key}-err`} className="mt-1 text-xs text-red-500">{errors[f.key]}</p>}
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              )}
              {loading ? 'Creating...' : 'Sign Up'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-pink-600 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:block w-1/2 relative overflow-hidden rounded-l-3xl m-3">
        <img src={heroImg} alt="SPU Building" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 to-transparent" />
      </div>
    </div>
  )
}
