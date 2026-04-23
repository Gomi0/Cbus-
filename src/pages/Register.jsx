import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Register() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { register } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    const result = await register({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password })
    setLoading(false)
    if (result.success) {
      toast.success('Account created successfully')
      navigate('/')
    } else {
      setError(result.error)
    }
  }

  const inputCls = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:ring-2 focus:ring-[#E91E8C]/20 transition"

  return (
    <div className="min-h-screen flex">
      {/* Left — Form Panel */}
      <div className="w-full md:w-[45%] flex flex-col justify-center px-10 lg:px-16 bg-white overflow-y-auto py-10">
        {/* SPU Logo placeholder */}
        <div className="mb-6">
          <div className="w-28 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs font-medium select-none">
            SPU Logo
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-1">Create Account</h1>
        <p className="text-gray-500 text-sm mb-6">Fill in the details below to get started</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
              <input type="text" value={form.firstName} onChange={set('firstName')} placeholder="First name" required className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
              <input type="text" value={form.lastName} onChange={set('lastName')} placeholder="Last name" required className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="Enter your email" required className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
            <input type="tel" value={form.phone} onChange={set('phone')} placeholder="e.g. 0812345678" className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder="Min. 6 characters"
                required
                className={`${inputCls} pr-11`}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={form.confirm}
              onChange={set('confirm')}
              placeholder="Re-enter password"
              required
              className={inputCls}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-full text-white font-semibold text-sm transition disabled:opacity-60 mt-2"
            style={{ backgroundColor: '#E91E8C' }}
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold" style={{ color: '#E91E8C' }}>
            Login
          </Link>
        </p>
      </div>

      {/* Right — Building Photo Placeholder */}
      <div className="hidden md:flex flex-1 bg-gray-300 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
          <span className="text-white/40 text-lg font-medium select-none">[Building Photo]</span>
        </div>
      </div>
    </div>
  )
}
