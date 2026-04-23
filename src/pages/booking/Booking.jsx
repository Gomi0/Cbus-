import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import heroImg from '../../assets/hero.png'

const ROOMS = [
  { id: 'A', name: 'Classroom A', capacity: 40, floor: 3, features: ['Projector', 'AC', 'Whiteboard'] },
  { id: 'B', name: 'Classroom B', capacity: 30, floor: 3, features: ['Projector', 'AC'] },
  { id: 'L', name: 'Lab 101', capacity: 25, floor: 2, features: ['Computers', 'AC', 'Projector'] },
  { id: 'C', name: 'Conference Room', capacity: 15, floor: 5, features: ['TV Screen', 'AC', 'Whiteboard'] },
  { id: 'S', name: 'Seminar Hall', capacity: 80, floor: 1, features: ['Stage', 'AC', 'Sound System'] },
]

export default function Booking() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">Classroom Booking & Scheduling</h1>
        <p className="text-sm text-gray-400 mt-0.5">เลือกห้องที่ต้องการจอง</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Room list */}
        <div className="space-y-3">
          {ROOMS.map(room => (
            <button
              key={room.id}
              onClick={() => setSelected(room)}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                selected?.id === room.id
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-100 bg-white hover:border-pink-200 hover:bg-pink-50/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{room.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">ชั้น {room.floor} · ความจุ {room.capacity} คน</p>
                </div>
                {selected?.id === room.id && (
                  <div className="w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {room.features.map(f => (
                  <span key={f} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">{f}</span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="relative h-48 bg-gray-100">
            <img src={heroImg} alt="Room" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            {selected && (
              <div className="absolute bottom-3 left-4">
                <p className="text-white font-bold text-lg">{selected.name}</p>
                <p className="text-white/80 text-xs">ชั้น {selected.floor}</p>
              </div>
            )}
          </div>

          <div className="p-5">
            {selected ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">ความจุ</p>
                    <p className="font-semibold text-gray-800">{selected.capacity} คน</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">ชั้น</p>
                    <p className="font-semibold text-gray-800">ชั้น {selected.floor}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/booking/form', { state: { room: selected } })}
                  className="w-full py-2.5 bg-pink-600 text-white text-sm font-semibold rounded-xl hover:bg-pink-700 transition-colors"
                >
                  จองห้องนี้
                </button>
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <svg className="w-10 h-10 mx-auto mb-2 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">เลือกห้องเพื่อดูรายละเอียด</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
