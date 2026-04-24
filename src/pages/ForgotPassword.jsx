import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

function SpuLogo() {
  return (
    <div className="flex items-end gap-2 select-none">
      <span className="text-5xl font-black text-gray-900 leading-none tracking-tight">SPU</span>
      <div className="mb-1">
        <div className="text-[9px] text-gray-500 leading-tight tracking-widest font-medium">SRIPATUM</div>
        <div className="text-[9px] text-gray-500 leading-tight tracking-widest font-medium">UNIVERSITY</div>
        <div className="h-[3px] mt-1 w-full rounded-full" style={{ backgroundColor: '#E91E8C' }} />
      </div>
    </div>
  )
}

function PinkWave() {
  return (
    <div className="absolute bottom-0 left-0 w-48 h-36 pointer-events-none">
      <svg viewBox="0 0 192 144" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path d="M0 144 C50 110, 100 70, 192 90 L192 144 Z" fill="#E91E8C" opacity="0.12" />
        <path d="M0 144 C40 118, 80 90, 140 108 L140 144 Z" fill="#E91E8C" opacity="0.25" />
        <path d="M0 144 C25 128, 55 112, 90 122 L90 144 Z" fill="#E91E8C" opacity="0.55" />
        <path d="M0 144 C15 135, 30 126, 55 132 L55 144 Z" fill="#E91E8C" opacity="0.85" />
      </svg>
    </div>
  )
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { forgotPassword } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('รหัสผ่านไม่ตรงกัน'); return }
    setLoading(true)
    const result = await forgotPassword(email)
    setLoading(false)
    if (result.success) toast.success('รีเซ็ตรหัสผ่านสำเร็จ')
    else setError(result.error)
  }

  const inputCls = "w-full bg-gray-100 rounded-full px-5 py-3.5 text-sm text-gray-700 outline-none placeholder-gray-400 focus:bg-gray-200 transition"

  return (
    <div className="min-h-screen flex">
      {/* Left — Form Panel */}
      <div className="w-full md:w-[52%] flex flex-col px-14 lg:px-20 py-10 bg-white relative overflow-hidden">
        <SpuLogo />

        <div className="flex-1 flex flex-col justify-center py-6">
          <Link to="/login" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 w-fit">
            <ArrowLeft size={15} /> กลับ
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">รีเซ็ตรหัสผ่าน</h1>
          <p className="text-sm text-gray-400 mb-7">กรุณากรอกอีเมลเพื่อรีเซ็ตรหัสผ่านของคุณ</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="อีเมล" required className={inputCls} />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="รหัสผ่าน"
                required
                className={`${inputCls} pr-12`}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="ยืนยันรหัสผ่าน" required className={inputCls} />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full text-white font-semibold text-base transition disabled:opacity-60 mt-1"
              style={{ backgroundColor: '#E91E8C' }}
            >
              {loading ? 'กรุณารอสักครู่...' : 'ดำเนินการต่อ'}
            </button>
          </form>
        </div>

        <PinkWave />
      </div>

      {/* Right — Building Photo */}
      <div className="hidden md:block flex-1 bg-gray-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-200 to-gray-400 flex items-center justify-center">
          <span className="text-white/40 text-lg font-medium select-none">[Building Photo]</span>
        </div>
      </div>
    </div>
  )
}
