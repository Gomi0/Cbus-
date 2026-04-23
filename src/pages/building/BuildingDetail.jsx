import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Toast from '../../components/Toast'

const CAMERAS = [
  { id: 1, name: 'Lobby Entrance', floor: 1, status: 'online' },
  { id: 2, name: 'Seminar Hall', floor: 1, status: 'online' },
  { id: 3, name: 'Lab 101', floor: 2, status: 'offline' },
  { id: 4, name: 'Classroom A', floor: 3, status: 'online' },
  { id: 5, name: 'Classroom B', floor: 3, status: 'online' },
  { id: 6, name: 'Conference Room', floor: 5, status: 'offline' },
]

export default function BuildingDetail() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(CAMERAS[0])
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleRefresh = async () => {
    if (selected.status === 'offline') {
      setToast({ message: 'กล้องออฟไลน์ ไม่สามารถเชื่อมต่อได้', type: 'error' })
      return
    }
    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 800))
      setToast({ message: 'รีเฟรชสำเร็จ', type: 'success' })
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
          <h1 className="text-xl font-bold text-gray-800">CCTV & Building Monitor</h1>
          <p className="text-sm text-gray-400">ระบบกล้องวงจรปิด</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Camera list */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">กล้องทั้งหมด</p>
          {CAMERAS.map(cam => (
            <button
              key={cam.id}
              onClick={() => setSelected(cam)}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                selected.id === cam.id
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-100 bg-white hover:border-pink-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{cam.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">ชั้น {cam.floor}</p>
                </div>
                <span className={`flex items-center gap-1 text-xs font-medium ${
                  cam.status === 'online' ? 'text-green-600' : 'text-red-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cam.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                  {cam.status}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Main view */}
        <div className="lg:col-span-2">
          <div className={`rounded-2xl overflow-hidden border-2 ${selected.status === 'online' ? 'border-gray-100' : 'border-red-200'}`}>
            <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
              {selected.status === 'online' ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
                  <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 opacity-10">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="border border-white/20" />
                    ))}
                  </div>
                  <div className="relative text-center">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8.5A1.5 1.5 0 014.5 7h8A1.5 1.5 0 0114 8.5v7A1.5 1.5 0 0112.5 17h-8A1.5 1.5 0 013 15.5v-7z" />
                      </svg>
                    </div>
                    <p className="text-white font-medium text-sm">{selected.name}</p>
                    <p className="text-white/50 text-xs mt-0.5">Live Feed Simulation</p>
                  </div>
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/40 rounded-full px-2.5 py-1">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-white text-xs font-medium">LIVE</span>
                  </div>
                </>
              ) : (
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <p className="text-red-400 font-medium text-sm">กล้องออฟไลน์</p>
                  <p className="text-gray-500 text-xs mt-1">ไม่สามารถเชื่อมต่อได้</p>
                </div>
              )}
            </div>

            <div className="bg-white p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800 text-sm">{selected.name}</p>
                <p className="text-xs text-gray-400">ชั้น {selected.floor} · Camera #{selected.id}</p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={loading || selected.status === 'offline'}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-xs font-medium rounded-xl transition-colors"
              >
                <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                รีเฟรช
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: 'กล้องออนไลน์', value: CAMERAS.filter(c => c.status === 'online').length, total: CAMERAS.length, color: 'text-green-600' },
              { label: 'กล้องออฟไลน์', value: CAMERAS.filter(c => c.status === 'offline').length, total: CAMERAS.length, color: 'text-red-500' },
              { label: 'ชั้นที่ครอบคลุม', value: [...new Set(CAMERAS.map(c => c.floor))].length, total: 5, color: 'text-blue-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}<span className="text-xs text-gray-400 font-normal">/{s.total}</span></p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
