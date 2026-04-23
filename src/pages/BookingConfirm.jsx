import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, Calendar, Clock, MapPin } from 'lucide-react'
import Navbar from '../components/Navbar'
import AccountSettings from '../components/AccountSettings'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function BookingConfirm() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [accountOpen, setAccountOpen] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const booking = state?.booking

  if (!booking) {
    navigate('/booking')
    return null
  }

  const handleConfirm = () => {
    setConfirmed(true)
    toast.success('Booking confirmed successfully!')
    setTimeout(() => navigate('/'), 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar onOpenAccount={() => setAccountOpen(true)} />

      <div className="flex-1 flex">
        {/* Left — Confirm Panel */}
        <div className="w-full md:w-[50%] lg:w-[45%] flex flex-col justify-center px-10 lg:px-16 py-10 bg-white">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Classroom Booking</h2>
          <p className="text-sm text-gray-500 mb-7">& Scheduling — Confirm Booking</p>

          {confirmed ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CheckCircle2 size={56} className="mb-4" style={{ color: '#E91E8C' }} />
              <p className="text-lg font-semibold text-gray-800">Booking Confirmed!</p>
              <p className="text-sm text-gray-500 mt-1">Redirecting to reservations...</p>
            </div>
          ) : (
            <>
              {/* Summary card */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-3 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Booking Summary</h3>

                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin size={15} style={{ color: '#E91E8C' }} />
                  <span>Floor {booking.floor} — Room {booking.room}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Calendar size={15} style={{ color: '#E91E8C' }} />
                  <span>{booking.date}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock size={15} style={{ color: '#E91E8C' }} />
                  <span>{booking.time}</span>
                </div>
                {booking.purpose && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-0.5">Purpose</p>
                    <p className="text-sm text-gray-700">{booking.purpose}</p>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-0.5">Booked by</p>
                  <p className="text-sm text-gray-700">{user?.firstName} {user?.lastName}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/booking')}
                  className="flex-1 py-2.5 rounded-full border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-2.5 rounded-full text-white font-semibold text-sm transition"
                  style={{ backgroundColor: '#E91E8C' }}
                >
                  Confirm Booking
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right — Room Photo Placeholder */}
        <div className="hidden md:flex flex-1 bg-gray-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
            <span className="text-white/40 text-lg font-medium select-none">[Room Photo]</span>
          </div>
        </div>
      </div>

      <AccountSettings isOpen={accountOpen} onClose={() => setAccountOpen(false)} />
    </div>
  )
}
