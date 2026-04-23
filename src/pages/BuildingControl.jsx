import { useState } from 'react'
import { Lightbulb, Wind, Zap, Thermometer } from 'lucide-react'
import Navbar from '../components/Navbar'
import AccountSettings from '../components/AccountSettings'
import { FLOORS } from '../data/mockData'

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${on ? '' : 'bg-gray-300'}`}
      style={on ? { backgroundColor: '#E91E8C' } : {}}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  )
}

export default function BuildingControl() {
  const [selectedFloor, setSelectedFloor] = useState(1)
  const [accountOpen, setAccountOpen] = useState(false)
  const [floorRooms, setFloorRooms] = useState(() =>
    FLOORS.reduce((acc, f) => {
      acc[f.floor] = f.rooms.map(r => ({ ...r }))
      return acc
    }, {})
  )

  const rooms = floorRooms[selectedFloor] || []

  const toggleRoom = (roomId, field) => {
    setFloorRooms(prev => ({
      ...prev,
      [selectedFloor]: prev[selectedFloor].map(r =>
        r.id === roomId ? { ...r, [field]: !r[field] } : r
      ),
    }))
  }

  const lightsOn = rooms.filter(r => r.light).length
  const acOn = rooms.filter(r => r.ac).length

  const allLights = rooms.every(r => r.light)
  const allAc = rooms.every(r => r.ac)

  const toggleAllLights = () => {
    const next = !allLights
    setFloorRooms(prev => ({
      ...prev,
      [selectedFloor]: prev[selectedFloor].map(r => ({ ...r, light: next })),
    }))
  }

  const toggleAllAc = () => {
    const next = !allAc
    setFloorRooms(prev => ({
      ...prev,
      [selectedFloor]: prev[selectedFloor].map(r => ({ ...r, ac: next })),
    }))
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#111827' }}>
      <Navbar onOpenAccount={() => setAccountOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — Floor selector */}
        <div className="w-20 flex flex-col items-center py-6 gap-1.5 overflow-y-auto border-r border-gray-700/50" style={{ backgroundColor: '#0f172a' }}>
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Floor</p>
          {FLOORS.map(f => (
            <button
              key={f.floor}
              onClick={() => setSelectedFloor(f.floor)}
              className={`w-12 h-12 rounded-xl text-sm font-bold transition-all duration-150 ${
                selectedFloor === f.floor
                  ? 'text-white shadow-lg scale-105'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700/40'
              }`}
              style={selectedFloor === f.floor ? { backgroundColor: '#E91E8C' } : {}}
            >
              {f.floor}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          {/* Header row */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-white">Floor {selectedFloor}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{rooms.length} rooms</p>
            </div>

            {/* Stats */}
            <div className="flex gap-4">
              <div className="bg-gray-800 rounded-xl px-4 py-2.5 flex items-center gap-2.5">
                <Lightbulb size={15} className="text-yellow-400" />
                <div>
                  <p className="text-xs text-gray-400">Lights ON</p>
                  <p className="text-sm font-bold text-white">{lightsOn}/{rooms.length}</p>
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl px-4 py-2.5 flex items-center gap-2.5">
                <Wind size={15} className="text-blue-400" />
                <div>
                  <p className="text-xs text-gray-400">AC ON</p>
                  <p className="text-sm font-bold text-white">{acOn}/{rooms.length}</p>
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl px-4 py-2.5 flex items-center gap-2.5">
                <Zap size={15} style={{ color: '#E91E8C' }} />
                <div>
                  <p className="text-xs text-gray-400">Devices ON</p>
                  <p className="text-sm font-bold text-white">{lightsOn + acOn}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Floor plan image placeholder */}
          <div className="w-full rounded-2xl overflow-hidden mb-6 border border-gray-700/50" style={{ height: 280, backgroundColor: '#1e2a3a' }}>
            <div className="h-full flex flex-col items-center justify-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-gray-700 flex items-center justify-center">
                <Thermometer size={28} className="text-gray-500" />
              </div>
              <p className="text-gray-500 text-sm font-medium">Floor {selectedFloor} Plan</p>
              <p className="text-gray-600 text-xs">[Floor plan image]</p>
            </div>
          </div>

          {/* Master controls */}
          <div className="flex gap-4 mb-5">
            <button
              onClick={toggleAllLights}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition border border-gray-600 hover:border-gray-400"
              style={allLights ? { color: '#E91E8C', borderColor: '#E91E8C' } : { color: '#9ca3af' }}
            >
              <Lightbulb size={14} />
              {allLights ? 'All Lights OFF' : 'All Lights ON'}
            </button>
            <button
              onClick={toggleAllAc}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition border border-gray-600 hover:border-gray-400"
              style={allAc ? { color: '#60a5fa', borderColor: '#60a5fa' } : { color: '#9ca3af' }}
            >
              <Wind size={14} />
              {allAc ? 'All AC OFF' : 'All AC ON'}
            </button>
          </div>

          {/* Room cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {rooms.map(room => (
              <div
                key={room.id}
                className="rounded-xl p-4 border transition-all duration-200"
                style={{ backgroundColor: '#1e293b', borderColor: room.light || room.ac ? '#374151' : '#1f2937' }}
              >
                <p className="text-white font-semibold text-sm mb-1">Room {room.name}</p>
                <p className="text-gray-500 text-xs mb-4">Cap: {room.capacity} seats</p>

                {/* Light toggle */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb size={13} className={room.light ? 'text-yellow-400' : 'text-gray-600'} />
                    <span className="text-xs text-gray-400">Light</span>
                  </div>
                  <Toggle on={room.light} onChange={() => toggleRoom(room.id, 'light')} />
                </div>

                {/* AC toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wind size={13} className={room.ac ? 'text-blue-400' : 'text-gray-600'} />
                    <span className="text-xs text-gray-400">AC</span>
                  </div>
                  <Toggle on={room.ac} onChange={() => toggleRoom(room.id, 'ac')} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AccountSettings isOpen={accountOpen} onClose={() => setAccountOpen(false)} />
    </div>
  )
}
