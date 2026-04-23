import { useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import Navbar from '../components/Navbar'
import AccountSettings from '../components/AccountSettings'

const INITIAL_SETTINGS = [
  { id: 1, name: 'Building Name',          value: 'SPU Building 11' },
  { id: 2, name: 'Admin Email',            value: 'admin@spu.ac.th' },
  { id: 3, name: 'Time Zone',              value: 'Asia/Bangkok (UTC+7)' },
  { id: 4, name: 'Max Booking per Day',    value: '3' },
  { id: 5, name: 'Booking Window (days)',  value: '30' },
  { id: 6, name: 'Min Notice (hours)',     value: '2' },
  { id: 7, name: 'Total Floors',           value: '14' },
  { id: 8, name: 'Default Time Slot',      value: '09:00-11:00' },
]

export default function Settings() {
  const [settings, setSettings] = useState(INITIAL_SETTINGS)
  const [editId, setEditId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [accountOpen, setAccountOpen] = useState(false)

  const startEdit = (s) => { setEditId(s.id); setEditValue(s.value) }
  const cancelEdit = () => { setEditId(null); setEditValue('') }
  const saveEdit = (id) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, value: editValue } : s))
    setEditId(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onOpenAccount={() => setAccountOpen(true)} />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage system configuration</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600 w-12">No.</th>
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Setting</th>
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Current Value</th>
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((s, idx) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="px-6 py-3.5 text-gray-400">{idx + 1}</td>
                  <td className="px-6 py-3.5 font-medium text-gray-800">{s.name}</td>
                  <td className="px-6 py-3.5">
                    {editId === s.id ? (
                      <input
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#E91E8C] focus:ring-2 focus:ring-[#E91E8C]/20"
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(s.id); if (e.key === 'Escape') cancelEdit() }}
                      />
                    ) : (
                      <span className="text-gray-600">{s.value}</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    {editId === s.id ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => saveEdit(s.id)} className="flex items-center gap-1 text-green-600 hover:text-green-800 text-xs font-medium">
                          <Check size={13} /> Save
                        </button>
                        <button onClick={cancelEdit} className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-xs font-medium">
                          <X size={13} /> Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(s)}
                        className="flex items-center gap-1.5 text-xs font-medium transition"
                        style={{ color: '#E91E8C' }}
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AccountSettings isOpen={accountOpen} onClose={() => setAccountOpen(false)} />
    </div>
  )
}
