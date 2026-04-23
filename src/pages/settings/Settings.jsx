import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Toast from '../../components/Toast'

const INITIAL_ROOMS = [
  { id: 1, name: 'Classroom A', floor: 3, capacity: 40, ac: true, lights: true, status: 'Active' },
  { id: 2, name: 'Classroom B', floor: 3, capacity: 30, ac: true, lights: false, status: 'Active' },
  { id: 3, name: 'Lab 101', floor: 2, capacity: 25, ac: true, lights: true, status: 'Maintenance' },
  { id: 4, name: 'Conference Room', floor: 5, capacity: 15, ac: false, lights: true, status: 'Active' },
  { id: 5, name: 'Seminar Hall', floor: 1, capacity: 80, ac: true, lights: true, status: 'Active' },
]

const StatusBadge = ({ status }) => {
  const map = {
    Active: 'bg-green-100 text-green-700',
    Maintenance: 'bg-yellow-100 text-yellow-700',
    Inactive: 'bg-gray-100 text-gray-500',
  }
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] ?? map.Inactive}`}>{status}</span>
}

export default function Settings() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState(INITIAL_ROOMS)
  const [toast, setToast] = useState(null)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editErrors, setEditErrors] = useState({})

  const openEdit = (room) => {
    setEditId(room.id)
    setEditForm({ name: room.name, capacity: String(room.capacity), floor: String(room.floor), status: room.status })
    setEditErrors({})
  }

  const validateEdit = () => {
    const e = {}
    if (!editForm.name.trim()) e.name = 'กรุณากรอกชื่อห้อง'
    if (!editForm.capacity || Number(editForm.capacity) < 1) e.capacity = 'ความจุต้องมากกว่า 0'
    if (!editForm.floor || Number(editForm.floor) < 1) e.floor = 'ชั้นต้องมากกว่า 0'
    return e
  }

  const saveEdit = () => {
    const errs = validateEdit()
    if (Object.keys(errs).length) { setEditErrors(errs); return }
    setRooms(prev => prev.map(r =>
      r.id === editId ? { ...r, name: editForm.name, capacity: Number(editForm.capacity), floor: Number(editForm.floor), status: editForm.status } : r
    ))
    setEditId(null)
    setToast({ message: 'บันทึกข้อมูลห้องเรียบร้อย', type: 'success' })
  }

  const toggleDevice = (id, device) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, [device]: !r[device] } : r))
    setToast({ message: 'อัปเดตสถานะอุปกรณ์แล้ว', type: 'info' })
  }

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Edit modal */}
      {editId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-96">
            <h3 className="font-bold text-gray-800 mb-4">แก้ไขข้อมูลห้อง</h3>
            <div className="space-y-3">
              {[
                { key: 'name', label: 'ชื่อห้อง', type: 'text' },
                { key: 'floor', label: 'ชั้น', type: 'number' },
                { key: 'capacity', label: 'ความจุ (คน)', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={editForm[f.key]}
                    onChange={e => { setEditForm(v => ({ ...v, [f.key]: e.target.value })); setEditErrors(v => ({ ...v, [f.key]: '' })) }}
                    className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${editErrors[f.key] ? 'border-red-400' : 'border-gray-200 focus:border-pink-400'}`}
                  />
                  {editErrors[f.key] && <p className="mt-0.5 text-xs text-red-500">{editErrors[f.key]}</p>}
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm(v => ({ ...v, status: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-pink-400"
                >
                  {['Active', 'Maintenance', 'Inactive'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditId(null)} className="flex-1 py-2 border border-gray-200 text-sm text-gray-600 rounded-xl hover:bg-gray-50">ยกเลิก</button>
              <button onClick={saveEdit} className="flex-1 py-2 bg-pink-600 text-white text-sm font-medium rounded-xl hover:bg-pink-700">บันทึก</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Building Rooms</h1>
          <p className="text-sm text-gray-400 mt-0.5">จัดการห้องและอุปกรณ์</p>
        </div>
        <button
          onClick={() => navigate('/settings/account')}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Account Settings
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['ห้อง', 'ชั้น', 'ความจุ', 'แอร์', 'ไฟ', 'สถานะ', 'Action'].map(h => (
                <th key={h} className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h === 'Action' ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rooms.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-gray-800">{r.name}</td>
                <td className="px-5 py-3.5 text-gray-500">ชั้น {r.floor}</td>
                <td className="px-5 py-3.5 text-gray-500">{r.capacity} คน</td>
                <td className="px-5 py-3.5">
                  <button onClick={() => toggleDevice(r.id, 'ac')} className={`w-10 h-5 rounded-full transition-colors relative ${r.ac ? 'bg-green-400' : 'bg-gray-200'}`} aria-label="toggle AC">
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${r.ac ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </td>
                <td className="px-5 py-3.5">
                  <button onClick={() => toggleDevice(r.id, 'lights')} className={`w-10 h-5 rounded-full transition-colors relative ${r.lights ? 'bg-green-400' : 'bg-gray-200'}`} aria-label="toggle Lights">
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${r.lights ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </td>
                <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                <td className="px-5 py-3.5 text-right">
                  <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors" aria-label={`แก้ไข ${r.name}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
