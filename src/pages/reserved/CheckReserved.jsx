import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Toast from '../../components/Toast'

const INITIAL = [
  { id: 1, room: 'Classroom A', date: '2026-04-21', time: '08:00–10:00', status: 'Available', bookedBy: 'อาจารย์สมชาย' },
  { id: 2, room: 'Classroom B', date: '2026-04-21', time: '10:00–12:00', status: 'Unavailable', bookedBy: 'อาจารย์สมหญิง' },
  { id: 3, room: 'Lab 101', date: '2026-04-22', time: '13:00–15:00', status: 'Available', bookedBy: 'อาจารย์วิชัย' },
  { id: 4, room: 'Conference Room', date: '2026-04-22', time: '09:00–11:00', status: 'Unavailable', bookedBy: 'ผู้บริหาร' },
  { id: 5, room: 'Seminar Hall', date: '2026-04-23', time: '14:00–16:00', status: 'Available', bookedBy: 'อาจารย์ทดสอบ' },
]

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'Available' ? 'bg-green-500' : 'bg-red-500'}`} />
    {status}
  </span>
)

export default function CheckReserved() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState(INITIAL)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [toast, setToast] = useState(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return rooms.filter(r =>
      r.room.toLowerCase().includes(q) ||
      r.bookedBy.toLowerCase().includes(q) ||
      r.date.includes(q)
    )
  }, [rooms, search])

  const confirmDelete = (id) => setDeleteId(id)

  const handleDelete = () => {
    setRooms(prev => prev.filter(r => r.id !== deleteId))
    setDeleteId(null)
    setToast({ message: 'ลบการจองเรียบร้อย', type: 'success' })
  }

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-center font-bold text-gray-800 mb-1">ยืนยันการลบ</h3>
            <p className="text-center text-sm text-gray-400 mb-5">คุณต้องการลบการจองนี้ใช่ไหม?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">ยกเลิก</button>
              <button onClick={handleDelete} className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">ลบ</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Available Rooms</h1>
          <p className="text-sm text-gray-400 mt-0.5">ตรวจสอบและจัดการการจองห้อง</p>
        </div>
        <button
          onClick={() => navigate('/booking')}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-xl hover:bg-pink-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          จองห้อง
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาห้อง, ผู้จอง, วันที่..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-pink-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ห้อง</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">วันที่</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">เวลา</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ผู้จอง</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">สถานะ</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                  {search ? `ไม่พบผลการค้นหา "${search}"` : 'ไม่มีข้อมูลการจอง'}
                </td>
              </tr>
            ) : (
              filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-800">{r.room}</td>
                  <td className="px-5 py-3.5 text-gray-500">{r.date}</td>
                  <td className="px-5 py-3.5 text-gray-500">{r.time}</td>
                  <td className="px-5 py-3.5 text-gray-500">{r.bookedBy}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => confirmDelete(r.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label={`ลบ ${r.room}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
          แสดง {filtered.length} จาก {rooms.length} รายการ
        </div>
      </div>
    </div>
  )
}
