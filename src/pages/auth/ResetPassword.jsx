import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import heroImg from '../../assets/hero.png'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1=email, 2=success
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    if (!email.trim()) return 'กรุณากรอกอีเมล'
    if (!/\S+@\S+\.\S+/.test(email)) return 'รูปแบบอีเมลไม่ถูกต้อง'
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 800))
      setStep(2)
    } finally {
      setLoading(false)
    }
  }

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

          {step === 1 ? (
            <>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">Reset Password</h1>
              <p className="text-gray-400 text-sm mb-7">Enter your email to receive a reset link</p>

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="admin@spu.ac.th"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors ${
                      error ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-gray-200 focus:border-pink-400'
                    }`}
                    aria-invalid={!!error}
                    aria-describedby={error ? 'reset-email-err' : undefined}
                  />
                  {error && <p id="reset-email-err" className="mt-1 text-xs text-red-500">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {loading && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  )}
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <p className="mt-5 text-center text-xs text-gray-400">
                Remember your password?{' '}
                <Link to="/login" className="text-pink-600 hover:underline">Sign in</Link>
              </p>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">ส่งลิงก์แล้ว!</h2>
              <p className="text-gray-400 text-sm mb-6">ตรวจสอบอีเมล <span className="text-gray-700 font-medium">{email}</span></p>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2.5 bg-pink-600 text-white rounded-xl text-sm font-medium hover:bg-pink-700 transition-colors"
              >
                กลับหน้า Login
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="hidden lg:block w-1/2 relative overflow-hidden rounded-l-3xl m-3">
        <img src={heroImg} alt="SPU Building" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 to-transparent" />
      </div>
    </div>
  )
}
