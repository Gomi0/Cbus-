
import { useState, useRef, useMemo, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { CloudUpload, FolderOpen, CheckCircle, AlertCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Clock, FileSpreadsheet } from 'lucide-react'
import Navbar from '../components/Navbar'
import rawSchedule from '../data/scheduleData.json'
import { useToast } from '../context/ToastContext'

/* ─── Constants ─── */
const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_FULL = {
  Mon: 'จันทร์', Tue: 'อังคาร', Wed: 'พุธ', Thu: 'พฤหัสบดี',
  Fri: 'ศุกร์', Sat: 'เสาร์', Sun: 'อาทิตย์',
}
const DAY_ABBR = {
  Mon: 'จ.', Tue: 'อ.', Wed: 'พ.', Thu: 'พฤ.',
  Fri: 'ศ.', Sat: 'ส.', Sun: 'อา.',
}

/* วันนี้ */
const JS_DAY = new Date().getDay() // 0=Sun...6=Sat
const TODAY  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][JS_DAY]

const parseH  = (t) => parseInt(t.slice(0, 2)) + parseInt(t.slice(2, 4)) / 60
const fmtTime = (t) => `${t.slice(0, 2)}:${t.slice(2, 4)}`

/* ─── Thai timetable grid parser ─────────────────────────────── */
const DAY_TH = {
  'จันทร์': 'Mon', 'อังคาร': 'Tue', 'พุธ': 'Wed',
  'พฤหัสบดี': 'Thu', 'ศุกร์': 'Fri', 'เสาร์': 'Sat', 'อาทิตย์': 'Sun',
}
const DAY_TH_RE = /จันทร์|อังคาร|พุธ|พฤหัสบดี|ศุกร์|เสาร์|อาทิตย์/

const SLOT_MAP = {
  1:  ['0900', '1130'],
  3:  ['1100', '1240'],
  4:  ['1200', '1430'],
  5:  ['1300', '1440'],
  7:  ['1500', '1730'],
  9:  ['1700', '1840'],
  10: ['1800', '2030'],
  11: ['1900', '2040'],
}

function floorFromRoomCode(roomCode) {
  const after = String(roomCode).split('-')[1]
  if (!after) return 0
  return Math.floor(parseInt(after) / 100)
}

function parseThaiTimetable(wb) {
  const classes = []
  let uid = 0
  wb.SheetNames.forEach(sheetName => {
    const ws  = wb.Sheets[sheetName]
    const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false })
    let room  = null
    for (const row of aoa) {
      if (!row) continue
      const hi = row.findIndex(c => c === 'ห้อง')
      if (hi >= 0 && row[hi + 1]) { room = String(row[hi + 1]).trim(); break }
    }
    if (!room) {
      const m = sheetName.match(/(\d+-\d+)/)
      room = m ? m[1] : null
    }
    if (!room) return
    const floor = floorFromRoomCode(room)
    aoa.forEach(row => {
      if (!row || !row[0]) return
      const cell0 = String(row[0])
      if (!DAY_TH_RE.test(cell0)) return
      const dayTh = cell0.split('\n')[0].trim()
      const day   = DAY_TH[dayTh]
      if (!day) return
      Object.entries(SLOT_MAP).forEach(([colStr, [start, end]]) => {
        const col = parseInt(colStr)
        const val = row[col]
        if (!val) return
        const text = String(val).trim()
        if (!text) return
        const code = text.split(/\s+/)[0]
        if (!code) return
        classes.push({ id: `xl-${uid++}`, day, startH: parseH(start), endH: parseH(end), code, time: `${fmtTime(start)} – ${fmtTime(end)}`, room, floor, conflict: false })
      })
    })
  })
  return classes
}

function detectConflicts(items) {
  items.forEach(a => { a.conflict = false; a.conflictsWith = [] })
  items.forEach((a, i) => items.forEach((b, j) => {
    if (i !== j && a.room === b.room && a.day === b.day && a.startH < b.endH && a.endH > b.startH) {
      a.conflict = true
      b.conflict = true
      if (!a.conflictsWith.some(x => x.id === b.id))
        a.conflictsWith.push({ id: b.id, code: b.code, time: b.time })
      if (!b.conflictsWith.some(x => x.id === a.id))
        b.conflictsWith.push({ id: a.id, code: a.code, time: a.time })
    }
  }))
  return items
}

const _DAY = { MON:'Mon',TUE:'Tue',WED:'Wed',THU:'Thu',FRI:'Fri',SAT:'Sat',SUN:'Sun' }

function buildClasses(source) {
  return detectConflicts(source.map(item => ({
    id:      item.id,
    day:     _DAY[item.Day] ?? item.Day,
    startH:  parseH(item.Start),
    endH:    parseH(item.End),
    code:    item.Course,
    time:    `${fmtTime(item.Start)} – ${fmtTime(item.End)}`,
    room:    item.Raw,
    floor:   item.Floor,
    conflict: false,
  })))
}

const STATIC_CLASSES = buildClasses(rawSchedule)

const DAY_TO_BACKEND = { Mon:'MON', Tue:'TUE', Wed:'WED', Thu:'THU', Fri:'FRI', Sat:'SAT', Sun:'SUN' }
const DAY_FROM_BACKEND = { MON:'Mon', TUE:'Tue', WED:'Wed', THU:'Thu', FRI:'Fri', SAT:'Sat', SUN:'Sun' }

function toHHMM(h) {
  const m = Math.round(h * 60)
  return `${String(Math.floor(m/60)).padStart(2,'0')}${String(m%60).padStart(2,'0')}`
}

function rawFromProcessed(p) {
  const parts = p.room.split('-')
  return {
    id: p.id, Sheet: p.room, Raw: p.room,
    Building: parseInt(parts[0]) || 0, Floor: p.floor, Room: parseInt(parts[1]) || 0,
    Day: DAY_TO_BACKEND[p.day] || p.day.toUpperCase(),
    Start: toHHMM(p.startH), End: toHHMM(p.endH),
    Course: p.code, Span: Math.round((p.endH - p.startH) * 2),
  }
}

function rawFromForm(form, existingId) {
  const raw = form.raw.trim()
  const floor = floorFromRoomCode(raw)
  const id = existingId ?? Date.now().toString()
  const startH = parseH(form.start), endH = parseH(form.end)
  return {
    id, Sheet: raw, Raw: raw,
    Building: parseInt(raw.split('-')[0]) || 0, Floor: floor, Room: parseInt(raw.split('-')[1]) || 0,
    Day: DAY_TO_BACKEND[form.day],
    Start: form.start, End: form.end,
    Course: form.course.trim(), Span: Math.round((endH - startH) * 2),
  }
}

const EMPTY_FORM = { raw: '', day: 'Mon', start: '0900', end: '1100', course: '' }

function groupOverlapping(classes) {
  if (!classes.length) return []
  const sorted = [...classes].sort((a, b) => a.startH - b.startH)
  const groups = []
  const assigned = new Set()
  for (const cls of sorted) {
    if (assigned.has(cls.id)) continue
    const group = [cls]
    assigned.add(cls.id)
    let changed = true
    while (changed) {
      changed = false
      for (const other of sorted) {
        if (assigned.has(other.id)) continue
        if (group.some(g => g.startH < other.endH && g.endH > other.startH)) {
          group.push(other); assigned.add(other.id); changed = true
        }
      }
    }
    groups.push(group)
  }
  return groups
}

const START_HOUR  = 9
const HOUR_LABELS = Array.from({ length: 12 }, (_, i) => `${String(START_HOUR + i).padStart(2, '0')}:00`)
const CELL_W      = 80
const DAY_ROW_H   = 80
const DAY_COL_W   = 100

/* ─── Day chip colors ───────────────────────────────────────── */
const DAY_COLOR = {
  Mon: '#3b82f6', Tue: '#8b5cf6', Wed: '#10b981',
  Thu: '#f59e0b', Fri: '#ef4444', Sat: '#06b6d4', Sun: '#E91E8C',
}

export default function ImportExcel() {
  const { toast } = useToast()
  const [dragging,     setDragging]     = useState(false)
  const [fileName,     setFileName]     = useState(null)
  const [importStatus, setImportStatus] = useState(null)
  const [importError,  setImportError]  = useState('')
  const [rawData,      setRawData]      = useState(rawSchedule)
  const [isModified,   setIsModified]   = useState(false)
  const [modal,        setModal]        = useState(null)   // null | 'add' | rawItem
  const [form,         setForm]         = useState(EMPTY_FORM)
  const [submitting,   setSubmitting]   = useState(false)

  const ALL_CLASSES = useMemo(() => detectConflicts(buildClasses(rawData)), [rawData])

  const [activeDays,    setActiveDays]    = useState(ALL_DAYS)          // เปิดทุกวัน
  const [activeFloor,   setActiveFloor]   = useState(null)
  const [activeRoom,    setActiveRoom]    = useState(null)
  const [minutesBefore, setMinutesBefore] = useState(0)
  const [selectedIds,   setSelectedIds]   = useState(new Set())
  const [expandedKeys,  setExpandedKeys]  = useState(new Set())

  const toggleGroupKey = (key) => setExpandedKeys(prev => {
    const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next
  })

  const fileRef     = useRef()
  const dragModeRef = useRef(null)

  useEffect(() => {
    const up = () => { dragModeRef.current = null }
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  }, [])

  const clearTable = () => {
    setRawData(rawSchedule)
    setIsModified(false)
    setImportStatus(null)
    setImportError('')
    setFileName(null)
    setSelectedIds(new Set())
    setActiveFloor(null)
    setActiveRoom(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const openAdd = () => { setForm(EMPTY_FORM); setModal('add') }
  const openEdit = (cls) => {
    const raw = rawData.find(r => r.id === cls.id)
    if (!raw) return
    setForm({ raw: raw.Raw, day: DAY_FROM_BACKEND[raw.Day] || cls.day, start: raw.Start, end: raw.End, course: raw.Course })
    setModal(raw)
  }
  const handleDelete = (id) => {
    setRawData(prev => prev.filter(r => r.id !== id))
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next })
    setIsModified(true)
  }
  const handleSave = () => {
    const isEdit = modal !== 'add'
    const newRaw = rawFromForm(form, isEdit ? modal.id : undefined)
    setRawData(prev => isEdit ? prev.filter(r => r.id !== modal.id).concat(newRaw) : [...prev, newRaw])
    setIsModified(true)
    setModal(null)
  }

  const handleCardMouseDown = (e, id) => {
    e.preventDefault()
    const adding = !selectedIds.has(id)
    dragModeRef.current = adding ? 'add' : 'remove'
    setSelectedIds(prev => {
      const next = new Set(prev)
      adding ? next.add(id) : next.delete(id)
      return next
    })
  }

  const handleCardMouseEnter = (id) => {
    if (!dragModeRef.current) return
    setSelectedIds(prev => {
      const next = new Set(prev)
      dragModeRef.current === 'add' ? next.add(id) : next.delete(id)
      return next
    })
  }

  const adjustedStart = (startH) => {
    const totalMin = Math.round(startH * 60) - minutesBefore
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
  }

  const floors = useMemo(() =>
    [...new Set(ALL_CLASSES.map(s => s.floor))].sort((a, b) => a - b),
  [ALL_CLASSES])

  const rooms = useMemo(() =>
    [...new Set(ALL_CLASSES.filter(s => activeFloor == null || s.floor === activeFloor).map(s => s.room))].sort(),
  [ALL_CLASSES, activeFloor])

  const currentRoom    = (activeRoom && rooms.includes(activeRoom)) ? activeRoom : null
  const visibleClasses = currentRoom
    ? ALL_CLASSES.filter(s => s.room === currentRoom)
    : activeFloor != null
      ? ALL_CLASSES.filter(s => s.floor === activeFloor)
      : ALL_CLASSES
  const visibleDays    = ALL_DAYS.filter(d => activeDays.includes(d))

  const toggleDay = (d) =>
    setActiveDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d])

  const handleFloorChange = (f) => {
    setActiveFloor(f === '' ? null : Number(f))
    setActiveRoom(null)
  }

  const handleFile = (file) => {
    if (!file) return
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setImportStatus('error')
      setImportError('รองรับเฉพาะไฟล์ .xlsx, .xls หรือ .csv เท่านั้น')
      return
    }
    setFileName(file.name)
    setImportStatus('loading')
    setImportError('')
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb      = XLSX.read(e.target.result, { type: 'array' })
        const classes = parseThaiTimetable(wb)
        if (classes.length === 0)
          throw new Error('ไม่พบข้อมูลในไฟล์ — ตรวจสอบว่าไฟล์เป็น format ตารางห้องเรียนคณะเทคโน')
        const rawItems = classes.map(rawFromProcessed)
        setRawData(rawItems)
        setIsModified(false)
        setImportStatus('ok')
        const fl = [...new Set(rawItems.map(c => c.Floor))].sort((a, b) => a - b)
        setActiveFloor(fl[0] ?? null)
        setActiveRoom(null)
        setSelectedIds(new Set())
      } catch (err) {
        setImportStatus('error')
        setImportError(err.message)
      }
    }
    reader.onerror = () => { setImportStatus('error'); setImportError('อ่านไฟล์ไม่ได้ กรุณาลองอีกครั้ง') }
    reader.readAsArrayBuffer(file)
  }

  const handleSubmit = async () => {
    if (rawData.length === 0) { toast.warning('ไม่มีข้อมูลคาบเรียน'); return }
    toast.success('สร้างตารางเรียนสำเร็จ')
  }

  const conflictCount = visibleClasses.filter(c => c.conflict).length

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">

        {/* ── Page header ── */}
        <h1 className="text-4xl font-bold text-gray-900 mb-1">นำเข้า Excel</h1>
        <p className="text-gray-400 text-sm mb-8">อัพโหลดและตรวจสอบตารางเรียนสำหรับภาคการศึกษาที่กำลังจะมาถึง</p>

        {/* ── Drop zone ── */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
          onClick={() => fileRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed flex flex-col items-center py-14 mb-4 cursor-pointer transition-colors select-none ${
            dragging        ? 'border-[#E91E8C] bg-pink-50'
            : importStatus === 'ok'    ? 'border-green-300 bg-green-50'
            : importStatus === 'error' ? 'border-red-300 bg-red-50'
            : 'border-pink-200 hover:border-pink-300'
          }`}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
            importStatus === 'ok' ? 'bg-green-100' : importStatus === 'error' ? 'bg-red-100' : 'bg-pink-100'
          }`}>
            {importStatus === 'ok'      ? <CheckCircle size={26} className="text-green-500" />
            : importStatus === 'error'  ? <AlertCircle size={26} className="text-red-400" />
            : importStatus === 'loading'? <FileSpreadsheet size={26} style={{ color: '#E91E8C' }} className="animate-pulse" />
            : <CloudUpload size={26} style={{ color: '#E91E8C' }} />}
          </div>
          <p className="text-lg font-semibold text-gray-800 mb-1">
            {importStatus === 'loading' ? 'กำลังอ่านไฟล์...'
            : importStatus === 'ok'     ? fileName
            : importStatus === 'error'  ? (fileName ?? 'อัพโหลดไม่สำเร็จ')
            : (fileName ?? 'วางไฟล์ที่นี่เพื่ออัพโหลด')}
          </p>
          {importStatus === 'ok'    && <p className="text-sm text-green-600 mb-6">โหลดสำเร็จ — {ALL_CLASSES.length} คาบเรียน</p>}
          {importStatus === 'error' && <p className="text-sm text-red-500 mb-6">{importError}</p>}
          {!importStatus            && <p className="text-sm text-gray-400 mb-6">รองรับ .XLSX, .XLS, .CSV</p>}
          {importStatus === 'ok'    && <p className="text-xs text-gray-400 mb-6">คลิกเพื่อเปลี่ยนไฟล์</p>}
          <button
            onClick={e => { e.stopPropagation(); fileRef.current?.click() }}
            className="flex items-center gap-2 px-7 py-3 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#9B1B5A' }}
          >
            <FolderOpen size={16} />เลือกไฟล์
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        </div>

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            {conflictCount > 0 && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-[#E91E8C]">
                <AlertCircle size={15} />{conflictCount} ความขัดแย้งที่พบ
              </span>
            )}
            {(importStatus === 'ok' || isModified) && (
              <button
                onClick={clearTable}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
              >
                ล้างตาราง
              </button>
            )}
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: '#E91E8C' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            เพิ่มคาบเรียน
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-start gap-x-6 gap-y-3 mb-5">

          {/* Day toggles */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase">แสดงวัน:</span>
            <div className="flex gap-1.5 flex-wrap">
              {ALL_DAYS.map(d => {
                const on      = activeDays.includes(d)
                const isToday = d === TODAY
                return (
                  <button
                    key={d}
                    onClick={() => toggleDay(d)}
                    className={`w-11 h-9 rounded-full text-sm font-semibold transition-all ${
                      on ? 'text-white' : 'text-gray-500 border border-gray-200 hover:border-pink-300'
                    } ${isToday && !on ? 'border-[#E91E8C] text-[#E91E8C]' : ''}`}
                    style={on ? { backgroundColor: '#E91E8C' } : {}}
                    title={`${DAY_FULL[d]}${isToday ? ' (วันนี้)' : ''}`}
                  >
                    {DAY_ABBR[d]}
                    {isToday && <span className="block w-1 h-1 rounded-full bg-current mx-auto -mt-0.5 opacity-70" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Floor */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase">ชั้น:</span>
            <div className="relative">
              <select
                value={activeFloor ?? ''}
                onChange={e => handleFloorChange(e.target.value)}
                className="appearance-none border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-700 focus:outline-none focus:border-pink-300 bg-white cursor-pointer"
              >
                <option value="">ทุกชั้น</option>
                {floors.map(f => <option key={f} value={f}>ชั้น {f}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Room */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase">ห้อง:</span>
            <div className="relative">
              <select
                value={currentRoom ?? ''}
                onChange={e => setActiveRoom(e.target.value || null)}
                className="appearance-none border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-700 focus:outline-none focus:border-pink-300 bg-white cursor-pointer"
              >
                <option value="">ทุกห้อง</option>
                {rooms.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Room info */}
          <div className="flex flex-col gap-1.5 justify-end">
            <span className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase invisible">-</span>
            <span className="text-sm text-gray-500 py-2">
              <span className="font-semibold text-gray-800">{visibleClasses.length}</span> คาบเรียนสัปดาห์นี้
            </span>
          </div>

          {/* Start Time */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase">เวลาเริ่ม:</span>
            <div className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-2 py-1.5 bg-white">
              <button onClick={() => setMinutesBefore(m => Math.max(0, m - 5))} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                <ChevronLeft size={15} />
              </button>
              <span className="text-sm text-gray-400 w-6 text-center select-none">{minutesBefore > 0 ? minutesBefore - 5 : 0}</span>
              <div className="px-4 py-1 rounded-lg bg-pink-100 min-w-[64px] text-center">
                <span className="text-sm font-bold" style={{ color: '#E91E8C' }}>{minutesBefore} min</span>
              </div>
              <span className="text-sm text-gray-400 w-6 text-center select-none">{minutesBefore < 20 ? minutesBefore + 5 : 20}</span>
              <button onClick={() => setMinutesBefore(m => Math.min(20, m + 5))} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* Selected count */}
          {selectedIds.size > 0 && (
            <div className="flex flex-col gap-1.5 justify-end">
              <span className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase invisible">-</span>
              <div className="flex items-center gap-2 py-2">
                <span className="text-sm text-gray-500">
                  เลือก <span className="font-bold" style={{ color: '#E91E8C' }}>{selectedIds.size}</span> วิชา
                  {minutesBefore > 0 && <span className="text-gray-400"> · เปิดก่อน {minutesBefore} นาที</span>}
                </span>
                <button onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors">ล้าง</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Timetable ── */}
        <div className="rounded-2xl border border-gray-100 overflow-x-auto select-none">
          <div style={{ minWidth: DAY_COL_W + HOUR_LABELS.length * CELL_W }}>

            {/* Column headers */}
            <div className="flex bg-pink-50 border-b border-gray-100">
              <div className="py-3 px-3 text-sm font-semibold text-gray-500 border-r border-gray-100 shrink-0 flex items-center" style={{ width: DAY_COL_W, minWidth: DAY_COL_W }}>
                วัน / เวลา
              </div>
              {HOUR_LABELS.map(h => (
                <div key={h} className="py-3 text-xs font-semibold text-gray-500 text-center border-r border-gray-100 last:border-r-0 shrink-0" style={{ width: CELL_W, minWidth: CELL_W }}>
                  {h}
                </div>
              ))}
            </div>

            {/* Row body */}
            {visibleDays.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-gray-300 text-sm">เลือกอย่างน้อยหนึ่งวัน</div>
            ) : visibleDays.map(day => {
              const isToday = day === TODAY
              const groups  = groupOverlapping(visibleClasses.filter(c => c.day === day))
              const rowH    = Math.max(DAY_ROW_H, ...groups.map(group => {
                const key      = `${day}-${group[0].id}`
                const expanded = expandedKeys.has(key)
                const btnH     = group.length > 1 ? 20 : 0
                const panelH   = expanded ? (group.length - 1) * 36 : 0
                return 8 + (DAY_ROW_H - 16) + btnH + panelH + 8
              }))
              return (
                <div
                  key={day}
                  className={`flex relative border-b border-gray-100 last:border-b-0 ${isToday ? 'bg-pink-50/40' : ''}`}
                  style={{ height: rowH }}
                >
                  {/* Row header */}
                  <div
                    className="flex items-center px-3 border-r border-gray-100 shrink-0"
                    style={{
                      width: DAY_COL_W, minWidth: DAY_COL_W,
                      background: isToday ? DAY_COLOR[day] + '18' : '#fdf2f8',
                      borderLeft: isToday ? `3px solid ${DAY_COLOR[day]}` : '3px solid transparent',
                    }}
                  >
                    <div>
                      <span className="text-sm font-bold text-gray-800 block">{DAY_FULL[day]}</span>
                      {isToday && <span className="text-[10px] font-semibold" style={{ color: DAY_COLOR[day] }}>วันนี้</span>}
                    </div>
                  </div>

                  {/* Hour grid */}
                  {HOUR_LABELS.map(h => (
                    <div key={h} className="border-r border-gray-100 last:border-r-0 h-full shrink-0" style={{ width: CELL_W, minWidth: CELL_W }} />
                  ))}

                  {/* Class cards */}
                  {groups.map(group => {
                    const cls       = group[0]
                    const key       = `${day}-${cls.id}`
                    const expanded  = expandedKeys.has(key)
                    const left      = DAY_COL_W + (cls.startH - START_HOUR) * CELL_W + 2
                    const width     = (cls.endH - cls.startH) * CELL_W - 4
                    const selected  = selectedIds.has(cls.id)
                    const hasHidden = group.length > 1
                    return (
                      <div key={cls.id} style={{ position: 'absolute', left, top: 8, width }} className={expanded ? 'z-[10] hover:z-[50]' : 'z-[1] hover:z-[50]'}>
                        {/* Primary card */}
                        <div
                          onMouseDown={e => handleCardMouseDown(e, cls.id)}
                          onMouseEnter={() => handleCardMouseEnter(cls.id)}
                          className={`group relative rounded-lg px-2 py-1 border-l-4 cursor-pointer select-none transition-all ${
                            selected ? 'ring-2 ring-offset-1 shadow-md' : 'hover:brightness-95'
                          } ${cls.conflict ? 'bg-pink-100 border-[#E91E8C]' : 'bg-pink-50 border-pink-300'}`}
                          style={{ height: DAY_ROW_H - 16, ...(selected ? { boxShadow: '0 0 0 2px #E91E8C' } : {}) }}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className={`text-xs font-bold leading-tight truncate ${cls.conflict ? 'text-[#E91E8C]' : 'text-gray-800'}`}>{cls.code}</span>
                            {cls.conflict ? (
                              <div className="relative shrink-0 mt-0.5 group/tip">
                                <AlertCircle size={12} style={{ color: '#E91E8C' }} className="cursor-help" />
                                <div className="absolute right-0 bottom-full mb-2 hidden group-hover/tip:block bg-gray-800 rounded-lg px-2.5 py-2 shadow-xl pointer-events-none" style={{ minWidth: 160, zIndex: 999 }}>
                                  <p className="text-[10px] font-semibold text-white mb-1">ทับกับ:</p>
                                  {(cls.conflictsWith || []).map(c => (
                                    <p key={c.id} className="text-[10px] text-gray-300 whitespace-nowrap">{c.code} · {c.time}</p>
                                  ))}
                                  <div className="absolute right-1.5 top-full -mt-1 w-0 h-0" style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #1f2937' }} />
                                </div>
                              </div>
                            ) : selected && <CheckCircle size={12} style={{ color: '#E91E8C' }} className="shrink-0 mt-0.5" />}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{cls.time}</div>
                          {selected && minutesBefore > 0 && (
                            <div className="flex items-center gap-0.5 mt-0.5">
                              <Clock size={9} style={{ color: '#E91E8C' }} />
                              <span className="text-[9px] font-semibold" style={{ color: '#E91E8C' }}>เปิด {adjustedStart(cls.startH)}</span>
                            </div>
                          )}
                          <div className={`text-[10px] font-semibold mt-0.5 leading-tight ${cls.conflict ? 'text-[#E91E8C]' : 'text-gray-600'}`}>{cls.room}</div>
                          <div className="absolute bottom-1 right-1 hidden group-hover:flex gap-1">
                            <button onClick={e => { e.stopPropagation(); openEdit(cls) }} className="w-6 h-6 flex items-center justify-center rounded-md bg-white shadow-sm hover:bg-blue-50 text-gray-500 hover:text-blue-500 border border-gray-200">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button onClick={e => { e.stopPropagation(); handleDelete(cls.id) }} className="w-6 h-6 flex items-center justify-center rounded-md bg-white shadow-sm hover:bg-red-50 text-gray-500 hover:text-red-500 border border-gray-200">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                            </button>
                          </div>
                        </div>

                        {/* Expand toggle */}
                        {hasHidden && (
                          <button
                            onClick={() => toggleGroupKey(key)}
                            className="w-full flex items-center justify-center gap-1 py-1 text-[10px] rounded-b-md transition-colors"
                            style={{
                              background: expanded ? 'rgba(233,30,140,0.08)' : 'rgba(0,0,0,0.04)',
                              color: expanded ? '#E91E8C' : '#6b7280',
                            }}
                          >
                            {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                            {expanded ? 'ซ่อน' : `+${group.length - 1} วิชา`}
                          </button>
                        )}

                        {/* Expanded list */}
                        {expanded && (
                          <div className="bg-white border border-gray-200 rounded-lg shadow-md mt-0.5">
                            {group.slice(1).map((hidden, hiddenIdx) => (
                              <div
                                key={hidden.id}
                                onMouseDown={e => handleCardMouseDown(e, hidden.id)}
                                onMouseEnter={() => handleCardMouseEnter(hidden.id)}
                                className={`flex items-center justify-between px-2 py-1.5 border-b border-gray-100 last:border-b-0 cursor-pointer select-none transition-colors ${hiddenIdx === 0 ? 'rounded-t-lg' : ''} ${hiddenIdx === group.length - 2 ? 'rounded-b-lg' : ''} ${
                                  hidden.conflict ? 'bg-pink-50' : 'bg-white hover:bg-gray-50'
                                } ${selectedIds.has(hidden.id) ? 'bg-pink-50' : ''}`}
                              >
                                <span className={`text-[10px] font-bold truncate ${hidden.conflict ? 'text-[#E91E8C]' : 'text-gray-800'}`}>{hidden.code}</span>
                                <div className="flex items-center gap-1 ml-1 shrink-0">
                                  {hidden.conflict && (
                                    <div className="relative group/tip">
                                      <AlertCircle size={11} style={{ color: '#E91E8C' }} className="cursor-help" />
                                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover/tip:block bg-gray-800 rounded-lg px-2.5 py-2 shadow-xl pointer-events-none" style={{ minWidth: 160, zIndex: 999 }}>
                                        <p className="text-[10px] font-semibold text-white mb-1">ทับกับ:</p>
                                        {(hidden.conflictsWith || []).map(c => (
                                          <p key={c.id} className="text-[10px] text-gray-300 whitespace-nowrap">{c.code} · {c.time}</p>
                                        ))}
                                        <div className="absolute right-1.5 top-full -mt-1 w-0 h-0" style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #1f2937' }} />
                                      </div>
                                    </div>
                                  )}
                                  <span className="text-[10px] text-gray-400">{hidden.room}</span>
                                  <button onClick={e => { e.stopPropagation(); openEdit(hidden) }} className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-blue-50 text-gray-400 hover:text-blue-500">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                  </button>
                                  <button onClick={e => { e.stopPropagation(); handleDelete(hidden.id) }} className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="flex items-center justify-center gap-4 mt-10 pb-4">
          <button className="px-8 py-3 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            ยกเลิกแบบร่าง
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-3 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#9B1B5A' }}
          >
            <CheckCircle size={16} />{submitting ? 'กำลังส่ง...' : 'สร้างตารางเรียน'}
          </button>
        </div>
      </main>

      {/* ── Add / Edit Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-96" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 mb-4">{modal === 'add' ? 'เพิ่มคาบเรียน' : 'แก้ไขคาบเรียน'}</h3>
            <div className="space-y-3">
              {/* ห้อง */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ห้อง <span className="text-gray-400 font-normal">(เช่น 5-309)</span></label>
                <input value={form.raw} onChange={e => setForm(v => ({ ...v, raw: e.target.value }))}
                  placeholder="5-309" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-pink-400" />
              </div>
              {/* วัน */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วัน</label>
                <select value={form.day} onChange={e => setForm(v => ({ ...v, day: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-pink-400">
                  {[['Mon','จันทร์'],['Tue','อังคาร'],['Wed','พุธ'],['Thu','พฤหัสบดี'],['Fri','ศุกร์'],['Sat','เสาร์'],['Sun','อาทิตย์']].map(([v,l]) =>
                    <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              {/* เวลา */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เริ่ม</label>
                  <input type="time" value={`${form.start.slice(0,2)}:${form.start.slice(2,4)}`}
                    onChange={e => setForm(v => ({ ...v, start: e.target.value.replace(':','') }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-pink-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">สิ้นสุด</label>
                  <input type="time" value={`${form.end.slice(0,2)}:${form.end.slice(2,4)}`}
                    onChange={e => setForm(v => ({ ...v, end: e.target.value.replace(':','') }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-pink-400" />
                </div>
              </div>
              {/* วิชา */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสวิชา</label>
                <input value={form.course} onChange={e => setForm(v => ({ ...v, course: e.target.value }))}
                  placeholder="EGR11567 T302" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-pink-400" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal(null)} className="flex-1 py-2 border border-gray-200 text-sm text-gray-600 rounded-xl hover:bg-gray-50">ยกเลิก</button>
              <button onClick={handleSave} className="flex-1 py-2 text-white text-sm font-medium rounded-xl hover:opacity-90"
                style={{ backgroundColor: '#E91E8C' }}>
                {modal === 'add' ? 'เพิ่ม' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 px-6 py-4 flex items-center justify-between text-xs text-gray-400">
        <span className="font-medium text-gray-600">SPU ผู้ดูแลระบบ</span>
        <span>© 2024 SPU ฝ่ายบริหารวิชาการ สงวนลิขสิทธิ์ทั้งหมด</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-gray-600 transition-colors">ช่วยเหลือ</a>
          <a href="#" className="hover:text-gray-600 transition-colors">ความเป็นส่วนตัว</a>
          <a href="#" className="hover:text-gray-600 transition-colors">สถานะระบบ</a>
        </div>
      </footer>
    </div>
  )
}

