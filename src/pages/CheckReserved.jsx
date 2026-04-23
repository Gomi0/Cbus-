import { useState } from 'react'
import { Search, Trash2, X, Pencil, List, LayoutGrid, Calendar } from 'lucide-react'
import Navbar from '../components/Navbar'
import AccountSettings from '../components/AccountSettings'
import ConfirmModal from '../components/ConfirmModal'
import { INITIAL_RESERVATIONS } from '../data/mockData'

const STATUS_STYLE = {
  Booked:   'bg-green-100 text-green-600',
  Pending:  'bg-orange-100 text-orange-500',
  Rejected: 'bg-red-100 text-red-500',
}

const ITEMS_PER_PAGE = 7

export default function CheckReserved() {
  const [reservations, setReservations] = useState(INITIAL_RESERVATIONS)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchActive, setSearchActive] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [selected, setSelected] = useState([])
  const [page, setPage] = useState(1)

  const filtered = reservations.filter(r => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return r.user.toLowerCase().includes(q) || r.room.toLowerCase().includes(q) || r.date.includes(q)
  })

  const paginated = filtered.slice(0, ITEMS_PER_PAGE)

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleDeleteSelected = () => {
    setReservations(prev => prev.filter(r => !selected.includes(r.id)))
    setSelected([])
  }

  const handleDeleteOne = () => {
    setReservations(prev => prev.filter(r => r.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar onOpenAccount={() => setAccountOpen(true)} />

      <div className="max-w-7xl mx-auto px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Available Rooms</h1>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          {/* View toggle */}
          <div className="flex items-center gap-0.5">
            <button className="flex items-center gap-1.5 border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700 bg-white shadow-sm">
              <List size={14} /> List
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-400 hover:text-gray-600">
              Table <LayoutGrid size={14} />
            </button>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {searchActive ? (
              <div className="flex items-center border border-gray-200 rounded-full px-4 py-2 gap-2 bg-white">
                <Search size={13} className="text-gray-400" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="text-sm outline-none w-28 text-gray-700"
                  onBlur={() => { if (!searchQuery) setSearchActive(false) }}
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setSearchActive(false) }}>
                    <X size={12} className="text-gray-400" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => setSearchActive(true)}
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
              >
                <Search size={15} className="text-gray-500" />
              </button>
            )}

            <div className="flex items-center gap-1.5 border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-600">
              <Calendar size={13} className="text-gray-400" />
              Jun 1 th &nbsp;–&nbsp; Feb 31 th
            </div>

            <button className="flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              All Room <span className="text-gray-400 text-xs">▾</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-14 px-5 py-4" />
                <th className="text-left px-5 py-4 font-semibold text-gray-700">User</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700">Date</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700">Time</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700">Room</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700">Status</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400">No reservations found</td>
                </tr>
              ) : (
                paginated.map(r => (
                  <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50/40 transition">
                    <td className="px-5 py-5">
                      <input
                        type="checkbox"
                        checked={selected.includes(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        className="w-4 h-4 rounded cursor-pointer accent-[#E91E8C]"
                      />
                    </td>
                    <td className="px-5 py-5 text-gray-800">{r.user}</td>
                    <td className="px-5 py-5 text-gray-600">{r.date}</td>
                    <td className="px-5 py-5 text-gray-600">{r.time}</td>
                    <td className="px-5 py-5 text-gray-600">{r.room}</td>
                    <td className="px-5 py-5">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[r.status] || 'bg-gray-100 text-gray-600'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-3">
                        <button className="text-gray-300 hover:text-gray-500 transition">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setDeleteTarget(r)} className="text-red-400 hover:text-red-600 transition">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-400">Showing 1–{paginated.length} of 245 entries</p>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
              ‹ Previous
            </button>
            {[1, 2, 3].map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition ${page === p ? 'text-white' : 'text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
                style={page === p ? { backgroundColor: '#E91E8C' } : {}}
              >
                {p}
              </button>
            ))}
            <span className="px-1 text-gray-300 text-sm">. . . .</span>
            <button onClick={() => setPage(8)} className={`w-8 h-8 rounded-lg text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 ${page === 8 ? 'text-white' : ''}`} style={page === 8 ? { backgroundColor: '#E91E8C' } : {}}>
              8
            </button>
            <button className="px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
              Next ›
            </button>
          </div>
        </div>
      </div>

      {/* Bulk delete floating bar */}
      {selected.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-full shadow-xl px-6 py-3 flex items-center gap-4 z-40">
          <button onClick={() => setSelected([])} className="text-gray-400 hover:text-gray-600 transition">
            <X size={16} />
          </button>
          <span className="text-sm text-gray-700 font-medium">{selected.length} selected</span>
          <button onClick={handleDeleteSelected} className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-700 transition">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Reservation"
        message={`Delete booking for ${deleteTarget?.user} in room ${deleteTarget?.room}?`}
        confirmLabel="Delete"
        danger={true}
        onConfirm={handleDeleteOne}
        onCancel={() => setDeleteTarget(null)}
      />

      <AccountSettings isOpen={accountOpen} onClose={() => setAccountOpen(false)} />
    </div>
  )
}
