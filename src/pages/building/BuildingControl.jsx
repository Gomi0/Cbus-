import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Toast from '../../components/Toast'

const FLOORS = [1, 2, 3, 4, 5]

const ROOMS_DATA = {
  1: [
    { id: 'S1', name: 'Seminar Hall', ac: true, lights: true, temp: 25, occupancy: 60 },
    { id: 'L1', name: 'Lobby', ac: false, lights: true, temp: 28, occupancy: 15 },
  ],
  2: [
    { id: 'L101', name: 'Lab 101', ac: true, lights: true, temp: 24, occupancy: 20 },
    { id: 'L102', name: 'Lab 102', ac: false, lights: false, temp: 30, occupancy: 0 },
  ],
  3: [
    { id: 'CA', name: 'Classroom A', ac: true, lights: true, temp: 25, occupancy: 35 },
    { id: 'CB', name: 'Classroom B', ac: true, lights: false, temp: 26, occupancy: 0 },
    { id: 'CC', name: 'Classroom C', ac: false, lights: true, temp: 29, occupancy: 10 },
  ],
  4: [
    { id: 'OF1', name: 'Office 401', ac: true, lights: true, temp: 23, occupancy: 8 },
    { id: 'OF2', name: 'Office 402', ac: false, lights: false, temp: 31, occupancy: 0 },
  ],
  5: [
    { id: 'CR', name: 'Conference Room', ac: true, lights: true, temp: 22, occupancy: 12 },
    { id: 'VIP', name: 'VIP Room', ac: false, lights: false, temp: 30, occupancy: 0 },
  ],
}

export default function BuildingControl() {
  const navigate = useNavigate()
  const [floor, setFloor] = useState(3)
  const [rooms, setRooms] = useState(ROOMS_DATA)
  const [toast, setToast] = useState(null)

  const currentRooms = rooms[floor] ?? []

  const toggle = (roomId, device) => {
    setRooms(prev => ({
      ...prev,
      [floor]: prev[floor].map(r => r.id === roomId ? { ...r, [device]: !r[device] } : r),
    }))
    setToast({ message: 'อัปเดตสถานะแล้ว', type: 'info' })
  }

  const toggleAll = (device, value) => {
    setRooms(prev => ({
      ...prev,
      [floor]: prev[floor].map(r => ({ ...r, [device]: value })),
    }))
    setToast({ message: `${value ? 'เปิด' : 'ปิด'}${device === 'ac' ? 'แอร์' : 'ไฟ'}ทุกห้องชั้น ${floor} แล้ว`, type: 'success' })
  }

  const allAcOn = currentRooms.every(r => r.ac)
  const allLightsOn = currentRooms.every(r => r.lights)

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Building Control</h1>
          <p className="text-sm text-gray-400 mt-0.5">ควบคุมไฟและแอร์ทั้งตึก</p>
        </div>
        <button
          onClick={() => navigate('/building/detail')}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-xl hover:bg-pink-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8.5A1.5 1.5 0 014.5 7h8A1.5 1.5 0 0114 8.5v7A1.5 1.5 0 0112.5 17h-8A1.5 1.5 0 013 15.5v-7z" />
          </svg>
          CCTV View
        </button>
      </div>

      {/* Floor selector */}
      <div className="flex gap-2 mb-5">
        {FLOORS.map(f => (
          <button
            key={f}
            onClick={() => setFloor(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              floor === f ? 'bg-pink-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-pink-300'
            }`}
          >
            ชั้น {f}
          </button>
        ))}
      </div>

      {/* Floor summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'ห้องทั้งหมด', value: currentRooms.length, color: 'text-gray-800' },
          { label: 'มีคนใช้งาน', value: currentRooms.filter(r => r.occupancy > 0).length, color: 'text-blue-600' },
          { label: 'แอร์เปิดอยู่', value: currentRooms.filter(r => r.ac).length, color: 'text-cyan-600' },
          { label: 'ไฟเปิดอยู่', value: currentRooms.filter(r => r.lights).length, color: 'text-yellow-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Bulk controls */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex items-center gap-4 flex-wrap">
        <span className="text-sm font-medium text-gray-700">ควบคุมทั้งชั้น {floor}:</span>
        <div className="flex gap-2">
          <button onClick={() => toggleAll('ac', !allAcOn)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${allAcOn ? 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" /></svg>
            แอร์ {allAcOn ? 'ปิดทั้งหมด' : 'เปิดทั้งหมด'}
          </button>
          <button onClick={() => toggleAll('lights', !allLightsOn)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${allLightsOn ? 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m1.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            ไฟ {allLightsOn ? 'ปิดทั้งหมด' : 'เปิดทั้งหมด'}
          </button>
        </div>
      </div>

      {/* Room cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentRooms.map(room => (
          <div key={room.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-800 text-sm">{room.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {room.occupancy > 0 ? `${room.occupancy} คน` : 'ว่าง'} · {room.temp}°C
                </p>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full mt-1 ${room.occupancy > 0 ? 'bg-green-400' : 'bg-gray-300'}`} />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => toggle(room.id, 'ac')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  room.ac ? 'bg-cyan-50 border-cyan-300 text-cyan-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-cyan-200'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" /></svg>
                AC {room.ac ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => toggle(room.id, 'lights')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  room.lights ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-yellow-200'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m1.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                Light {room.lights ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
