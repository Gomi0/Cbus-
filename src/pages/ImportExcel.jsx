import { useState, useRef, useMemo } from 'react'
import { CloudUpload, FolderOpen, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react'
import Navbar from '../components/Navbar'
import AccountSettings from '../components/AccountSettings'
import rawSchedule from '../data/scheduleData.json'
import testSchedule from '../data/scheduleDataTest.json' /* TODO: delete when done */

/* ─── Data transformation ─── */
const DAY_MAP = { MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun' }
const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_FULL = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
  Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
}

const parseH  = (t) => parseInt(t.slice(0, 2)) + parseInt(t.slice(2, 4)) / 60
const fmtTime = (t) => `${t.slice(0, 2)}:${t.slice(2, 4)}`

const ALL_CLASSES = (() => {
  const items = [...rawSchedule, ...testSchedule].map(item => ({
    id:      item.id,
    day:     DAY_MAP[item.Day] ?? item.Day,
    startH:  parseH(item.Start),
    endH:    parseH(item.End),
    code:    item.Course,
    time:    `${fmtTime(item.Start)} – ${fmtTime(item.End)}`,
    room:    item.Raw,
    floor:   item.Floor,
    conflict: false,
  }))
  /* detect conflicts: same room + same day + overlapping time */
  items.forEach((a, i) => items.forEach((b, j) => {
    if (i !== j && a.room === b.room && a.day === b.day && a.startH < b.endH && a.endH > b.startH)
      a.conflict = b.conflict = true
  }))
  return items
})()

const START_HOUR  = 9
const HOUR_LABELS = Array.from({ length: 12 }, (_, i) => {
  const h = START_HOUR + i
  return `${String(h).padStart(2, '0')}:00`
}) /* 09:00 – 20:00 */
const CELL_W     = 80  /* px per hour column */
const DAY_ROW_H  = 80  /* px per day row */
const DAY_COL_W  = 100 /* px for the day-label column */

export default function ImportExcel() {
  const [accountOpen, setAccountOpen] = useState(false)
  const [dragging, setDragging]       = useState(false)
  const [fileName, setFileName]       = useState(null)
  const [activeDays, setActiveDays]   = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
  const [activeFloor, setActiveFloor] = useState(() =>
    [...new Set(ALL_CLASSES.map(s => s.floor))].sort((a, b) => a - b)[0]
  )
  const [activeRoom, setActiveRoom] = useState(null)
  const fileRef = useRef()

  const floors = useMemo(() =>
    [...new Set(ALL_CLASSES.map(s => s.floor))].sort((a, b) => a - b), []
  )

  const rooms = useMemo(() =>
    [...new Set(ALL_CLASSES.filter(s => s.floor === activeFloor).map(s => s.room))].sort(),
    [activeFloor]
  )

  const currentRoom   = (activeRoom && rooms.includes(activeRoom)) ? activeRoom : rooms[0]
  const visibleClasses = ALL_CLASSES.filter(s => s.room === currentRoom)
  const visibleDays   = ALL_DAYS.filter(d => activeDays.includes(d))

  const toggleDay = (d) =>
    setActiveDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d])

  const handleFloorChange = (f) => {
    setActiveFloor(Number(f))
    setActiveRoom(null)
  }

  const handleFile = (file) => {
    if (!file) return
    if (!file.name.match(/\.xlsx$/i)) {
      alert('กรุณาเลือกไฟล์ .xlsx เท่านั้น')
      return
    }
    setFileName(file.name)
  }

  const conflictCount = visibleClasses.filter(c => c.conflict).length

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar onOpenAccount={() => setAccountOpen(true)} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">

        {/* ── Page header ── */}
        <h1 className="text-4xl font-bold text-gray-900 mb-1">Import Excel</h1>
        <p className="text-gray-400 text-sm mb-8">Upload and validate academic timetables for the upcoming semester.</p>

        {/* ── Drop zone ── */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
          onClick={() => fileRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed flex flex-col items-center py-14 mb-10 cursor-pointer transition-colors select-none ${
            dragging ? 'border-[#E91E8C] bg-pink-50' : 'border-pink-200 hover:border-pink-300'
          }`}
        >
          <div className="w-14 h-14 rounded-full bg-pink-100 flex items-center justify-center mb-4">
            <CloudUpload size={26} style={{ color: '#E91E8C' }} />
          </div>
          <p className="text-lg font-semibold text-gray-800 mb-1">
            {fileName ? fileName : 'Drop files here to upload'}
          </p>
          <p className="text-sm text-gray-400 mb-6">Supports .XLSX academic exports</p>
          <button
            onClick={e => { e.stopPropagation(); fileRef.current?.click() }}
            className="flex items-center gap-2 px-7 py-3 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#9B1B5A' }}
          >
            <FolderOpen size={16} />
            Browse Files
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={e => handleFile(e.target.files[0])}
          />
        </div>

        {/* ── Import Preview ── */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-gray-900">Import Preview</h2>
          {conflictCount > 0 && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-[#E91E8C]">
              <AlertCircle size={15} />
              {conflictCount} conflict{conflictCount > 1 ? 's' : ''} detected
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-start gap-x-6 gap-y-3 mb-5">

          {/* Day toggles */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase">View Days:</span>
            <div className="flex gap-1.5 flex-wrap">
              {ALL_DAYS.map(d => {
                const on = activeDays.includes(d)
                return (
                  <button
                    key={d}
                    onClick={() => toggleDay(d)}
                    className={`w-11 h-9 rounded-full text-sm font-semibold transition-all ${
                      on ? 'text-white' : 'text-gray-500 border border-gray-200 hover:border-pink-300'
                    }`}
                    style={on ? { backgroundColor: '#E91E8C' } : {}}
                  >{d}</button>
                )
              })}
            </div>
          </div>

          {/* Floor selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase">Floor:</span>
            <div className="relative">
              <select
                value={activeFloor}
                onChange={e => handleFloorChange(e.target.value)}
                className="appearance-none border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-700 focus:outline-none focus:border-pink-300 bg-white cursor-pointer"
              >
                {floors.map(f => (
                  <option key={f} value={f}>Floor {f}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Room selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase">Room:</span>
            <div className="relative">
              <select
                value={currentRoom}
                onChange={e => setActiveRoom(e.target.value)}
                className="appearance-none border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-700 focus:outline-none focus:border-pink-300 bg-white cursor-pointer"
              >
                {rooms.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Room info badge */}
          <div className="flex flex-col gap-1.5 justify-end">
            <span className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase invisible">-</span>
            <span className="text-sm text-gray-500 py-2">
              <span className="font-semibold text-gray-800">{visibleClasses.length}</span> classes this week
            </span>
          </div>
        </div>

        {/* ── Timetable ── */}
        <div className="rounded-2xl border border-gray-100 overflow-x-auto">
          <div style={{ minWidth: DAY_COL_W + HOUR_LABELS.length * CELL_W }}>

            {/* Column headers: Time */}
            <div className="flex bg-pink-50 border-b border-gray-100">
              <div
                className="py-3 px-3 text-sm font-semibold text-gray-500 border-r border-gray-100 shrink-0 flex items-center"
                style={{ width: DAY_COL_W, minWidth: DAY_COL_W }}
              >
                วัน / เวลา
              </div>
              {HOUR_LABELS.map(h => (
                <div
                  key={h}
                  className="py-3 text-xs font-semibold text-gray-500 text-center border-r border-gray-100 last:border-r-0 shrink-0"
                  style={{ width: CELL_W, minWidth: CELL_W }}
                >
                  {h}
                </div>
              ))}
            </div>

            {/* Row body: one row per day */}
            {visibleDays.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-gray-300 text-sm">
                Select at least one day
              </div>
            ) : visibleDays.map(day => (
              <div
                key={day}
                className="flex relative border-b border-gray-100 last:border-b-0"
                style={{ height: DAY_ROW_H }}
              >
                {/* Row header: Day name */}
                <div
                  className="flex items-center px-3 border-r border-gray-100 shrink-0 bg-pink-50"
                  style={{ width: DAY_COL_W, minWidth: DAY_COL_W }}
                >
                  <span className="text-sm font-bold text-gray-800">{DAY_FULL[day]}</span>
                </div>

                {/* Hour grid cells (background) */}
                {HOUR_LABELS.map(h => (
                  <div
                    key={h}
                    className="border-r border-gray-100 last:border-r-0 h-full shrink-0"
                    style={{ width: CELL_W, minWidth: CELL_W }}
                  />
                ))}

                {/* Class cards (absolutely positioned along the time axis) */}
                {visibleClasses.filter(c => c.day === day).map(cls => {
                  const left  = DAY_COL_W + (cls.startH - START_HOUR) * CELL_W + 2
                  const width = (cls.endH - cls.startH) * CELL_W - 4
                  return (
                    <div
                      key={cls.id}
                      className={`absolute top-2 rounded-lg px-2 py-1 border-l-4 overflow-hidden ${
                        cls.conflict
                          ? 'bg-pink-100 border-[#E91E8C]'
                          : 'bg-pink-50 border-pink-300'
                      }`}
                      style={{ left, width, height: DAY_ROW_H - 16 }}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className={`text-xs font-bold leading-tight truncate ${cls.conflict ? 'text-[#E91E8C]' : 'text-gray-800'}`}>
                          {cls.code}
                        </span>
                        {cls.conflict && (
                          <AlertCircle size={12} style={{ color: '#E91E8C' }} className="shrink-0 mt-0.5" />
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{cls.time}</div>
                      <div className={`text-[10px] font-semibold mt-0.5 leading-tight ${cls.conflict ? 'text-[#E91E8C]' : 'text-gray-600'}`}>
                        {cls.room}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="flex items-center justify-center gap-4 mt-10 pb-4">
          <button className="px-8 py-3 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            Discard Draft
          </button>
          <button
            className="flex items-center gap-2 px-8 py-3 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#9B1B5A' }}
          >
            <CheckCircle size={16} />
            Generate Schedule
          </button>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 px-6 py-4 flex items-center justify-between text-xs text-gray-400">
        <span className="font-medium text-gray-600">SPU Admin</span>
        <span>© 2024 SPU Academic Administration. All rights reserved.</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-gray-600 transition-colors">Support</a>
          <a href="#" className="hover:text-gray-600 transition-colors">Privacy</a>
          <a href="#" className="hover:text-gray-600 transition-colors">System Status</a>
        </div>
      </footer>

      <AccountSettings isOpen={accountOpen} onClose={() => setAccountOpen(false)} />
    </div>
  )
}
