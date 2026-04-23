import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Toast from '../../components/Toast'
import heroImg from '../../assets/hero.png'

const TIME_SLOTS = ['08:00–10:00', '10:00–12:00', '13:00–15:00', '15:00–17:00', '17:00–19:00']

export default function BookingForm() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const room = state?.room ?? { name: 'Classroom A', id: 'A', floor: 3, capacity: 40 }

  const [form, setForm] = useState({ date: '', timeSlot: '', purpose: '', attendees: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const today = new Date().toISOString().split('T')[0]

  const validate = () => {
    const e = {}
    if (!form.date) e.date = 'กรุณาเลือกวันที่'
    else if (form.date < today) e.date = 'ไม่สามารถจองวันที่ผ่านมาแล้ว'
    if (!form.timeSlot) e.timeSlot = 'กรุณาเลือกช่วงเวลา'
    if (!form.purpose.trim()) e.purpose = 'กรุณาระบุวัตถุประสงค์'
    if (!form.attendees) e.attendees = 'กรุณาระบุจำนวนผู้เข้าร่วม'
    else if (Number(form.attendees) < 1) e.attendees = 'จำนวนผู้เข้าร่วมต้องมากกว่า 0'
    else if (Number(form.attendees) > room.capacity) e.attendees = `เกินความจุห้อง (สูงสุด ${room.capacity} คน)`
    return e
  }

  const handleChange = (field) => (e) => {
    setForm(v => ({ ...v, [field]: e.target.value }))
    setErrors(v => ({ ...v, [field]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 1000))
      setToast({ message: 'จองห้องสำเร็จ!', type: 'success' })
      setTimeout(() => navigate('/reserved'), 1500)
    } catch {
      setToast({ message: 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง', type: 'error' })
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
          <h1 className="text-xl font-bold text-gray-800">Classroom Booking {room.id}</h1>
          <p className="text-sm text-gray-400">กรอกรายละเอียดการจอง</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="relative h-44">
            <img src={heroImg} alt="Room" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-3 left-4">
              <p className="text-white font-bold text-lg">{room.name}</p>
            </div>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {[
              { label: 'ชั้น', value: `ชั้น ${room.floor}` },
              { label: 'ความจุ', value: `${room.capacity} คน` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <p className="font-semibold text-gray-800 text-sm">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">วันที่จอง</label>
              <input
                type="date"
                min={today}
                value={form.date}
                onChange={handleChange('date')}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors ${
                  errors.date ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-pink-400'
                }`}
              />
              {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
            </div>

            {/* Time slot */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ช่วงเวลา</label>
              <div className="grid grid-cols-2 gap-2">
                {TIME_SLOTS.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => { setForm(v => ({ ...v, timeSlot: slot })); setErrors(v => ({ ...v, timeSlot: '' })) }}
                    className={`py-2 px-3 text-xs rounded-xl border transition-colors text-center ${
                      form.timeSlot === slot
                        ? 'border-pink-500 bg-pink-50 text-pink-600 font-medium'
                        : 'border-gray-200 text-gray-600 hover:border-pink-200'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              {errors.timeSlot && <p className="mt-1 text-xs text-red-500">{errors.timeSlot}</p>}
            </div>

            {/* Attendees */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">จำนวนผู้เข้าร่วม</label>
              <input
                type="number"
                min="1"
                max={room.capacity}
                value={form.attendees}
                onChange={handleChange('attendees')}
                placeholder={`1–${room.capacity}`}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors ${
                  errors.attendees ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-pink-400'
                }`}
              />
              {errors.attendees && <p className="mt-1 text-xs text-red-500">{errors.attendees}</p>}
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">วัตถุประสงค์</label>
              <textarea
                rows={3}
                value={form.purpose}
                onChange={handleChange('purpose')}
                placeholder="เช่น สอนวิชา Computer Science 101..."
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors resize-none ${
                  errors.purpose ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-pink-400'
                }`}
              />
              {errors.purpose && <p className="mt-1 text-xs text-red-500">{errors.purpose}</p>}
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => navigate(-1)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                )}
                {loading ? 'กำลังจอง...' : 'ยืนยันการจอง'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
