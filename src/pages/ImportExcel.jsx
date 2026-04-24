import { useState, useRef, useMemo, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { CloudUpload, FolderOpen, CheckCircle, AlertCircle, ChevronDown, ChevronLeft, ChevronRight, Clock, FileSpreadsheet } from 'lucide-react'
import Navbar from '../components/Navbar'
import AccountSettings from '../components/AccountSettings'
import rawSchedule from '../data/scheduleData.json'

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

const parseH  = (t) => parseInt(t.slice(0, 2)) + parseInt(t.slice(2, 4)) / 60
const fmtTime = (t) => `${t.slice(0, 2)}:${t.slice(2, 4)}`

/* ─── Thai timetable grid parser ─────────────────────────────
   Format (คณะเทคโน 2-68):
   - แต่ละ sheet = 1 ห้อง
   - แถว 4  : header คาบ 3 หน่วยกิต  (col 1=0900-1130, 4=1200-1430, 7=1500-1730, 10=1800-2030)
   - แถว 6-12: วัน จันทร์–อาทิตย์  (ข้อมูลวิชาอยู่ตาม col ด้านบน)
   - แถว 13 : header คาบ 2 หน่วยกิต (col 1=0900-1040, 3=1100-1240, 5=1300-1440,
                                        7=1500-1640, 9=1700-1840, 11=1900-2040)
   col ที่ไม่ซ้อนทับ (3,5,9,11) สามารถมีข้อมูล 2-หน่วยกิต ในแถววัน 6-12 ได้ด้วย
──────────────────────────────────────────────────────────── */
const DAY_TH = {
  'จันทร์': 'Mon', 'อังคาร': 'Tue', 'พุธ': 'Wed',
  'พฤหัสบดี': 'Thu', 'ศุกร์': 'Fri', 'เสาร์': 'Sat', 'อาทิตย์': 'Sun',
}
const DAY_TH_RE = /จันทร์|อังคาร|พุธ|พฤหัสบดี|ศุกร์|เสาร์|อาทิตย์/

/*
  col index → [start, end] (HHMM strings)
  3-credit cols: 1, 4, 7, 10
  2-credit cols: 3, 5, 9, 11
  col 1 และ 7 ซ้อนทับ → ใช้ 3-credit เวลา (แถววันที่อยู่ใต้ header 3-หน่วยกิต)
*/
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

/* แปลง floor จากเลขห้อง: "5-309"→3, "5-702"→7, "5-1010"→10 */
function floorFromRoomCode(roomCode) {
  const after = String(roomCode).split('-')[1]
  if (!after) return 0
  return Math.floor(parseInt(after) / 100)
}

function parseThaiTimetable(wb) {
  const classes = []
  let uid = 0

  wb.SheetNames.forEach(sheetName => {
    const ws = wb.Sheets[sheetName]
    /* อ่านเป็น array-of-arrays (row × col), header:1 = ใช้ตัวเลข index */
    const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false })

    /* หาชื่อห้องจากแถว summary (มีคำว่า 'ห้อง') */
    let room = null
    for (const row of aoa) {
      if (!row) continue
      const hi = row.findIndex(c => c === 'ห้อง')
      if (hi >= 0 && row[hi + 1]) {
        room = String(row[hi + 1]).trim()
        break
      }
    }
    /* fallback: ดึงจากชื่อ sheet */
    if (!room) {
      const m = sheetName.match(/(\d+-\d+)/)
      room = m ? m[1] : null
    }
    if (!room) return

    const floor = floorFromRoomCode(room)

    /* วนทุกแถว หาแถวที่เป็นวัน */
    aoa.forEach(row => {
      if (!row || !row[0]) return
      const cell0 = String(row[0])
      if (!DAY_TH_RE.test(cell0)) return

      const dayTh = cell0.split('\n')[0].trim()
      const day = DAY_TH[dayTh]
      if (!day) return

      /* วนทุก slot col */
      Object.entries(SLOT_MAP).forEach(([colStr, [start, end]]) => {
        const col = parseInt(colStr)
        const val = row[col]
        if (!val) return
        const text = String(val).trim()
        if (!text) return

        /* รหัสวิชา = token แรก (ตัดช่องว่างและ section ออก) */
        const code = text.split(/\s+/)[0]
        if (!code) return

        classes.push({
          id:      `xl-${uid++}`,
          day,
          startH:  parseH(start),
          endH:    parseH(end),
          code,
          time:    `${fmtTime(start)} – ${fmtTime(end)}`,
          room,
          floor,
          conflict: false,
        })
      })
    })
  })

  return classes
}

function detectConflicts(items) {
  items.forEach(a => { a.conflict = false })
  items.forEach((a, i) => items.forEach((b, j) => {
    if (i !== j && a.room === b.room && a.day === b.day && a.startH < b.endH && a.endH > b.startH)
      a.conflict = b.conflict = true
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
  const [importStatus, setImportStatus] = useState(null) // null | 'loading' | 'ok' | 'error'
  const [importError, setImportError]   = useState('')
  const [importedClasses, setImportedClasses] = useState(null) // null = ใช้ static data

  const ALL_CLASSES = importedClasses ?? STATIC_CLASSES

  const [activeDays, setActiveDays]   = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
  const [activeFloor, setActiveFloor] = useState(() =>
    [...new Set(STATIC_CLASSES.map(s => s.floor))].sort((a, b) => a - b)[0]
  )
  const [activeRoom, setActiveRoom] = useState(null)
  const [minutesBefore, setMinutesBefore] = useState(0)
  const [selectedIds, setSelectedIds]     = useState(new Set())
  const fileRef    = useRef()
  const dragModeRef = useRef(null) // 'add' | 'remove' | null

  useEffect(() => {
    const up = () => { dragModeRef.current = null }
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  }, [])

  const clearTable = () => {
    setImportedClasses(null)
    setImportStatus(null)
    setImportError('')
    setFileName(null)
    setSelectedIds(new Set())
    setActiveFloor([...new Set(STATIC_CLASSES.map(s => s.floor))].sort((a, b) => a - b)[0])
    setActiveRoom(null)
    if (fileRef.current) fileRef.current.value = ''
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
        /* 1. อ่าน workbook */
        const wb = XLSX.read(e.target.result, { type: 'array' })

        /* 2. parse ด้วย Thai timetable grid parser */
        const classes = parseThaiTimetable(wb)

        if (classes.length === 0)
          throw new Error('ไม่พบข้อมูลในไฟล์ — ตรวจสอบว่าไฟล์เป็น format ตารางห้องเรียนคณะเทคโน')

        /* 3. detect conflicts แล้ว set state */
        setImportedClasses(detectConflicts(classes))
        setImportStatus('ok')

        /* รีเซ็ต floor/room ให้ตรงกับข้อมูลใหม่ */
        const floors = [...new Set(classes.map(c => c.floor))].sort((a, b) => a - b)
        setActiveFloor(floors[0] ?? 1)
        setActiveRoom(null)
        setSelectedIds(new Set())
      } catch (err) {
        setImportStatus('error')
        setImportError(err.message)
      }
    }
    reader.onerror = () => {
      setImportStatus('error')
      setImportError('อ่านไฟล์ไม่ได้ กรุณาลองอีกครั้ง')
    }
    reader.readAsArrayBuffer(file)
  }

  const conflictCount = visibleClasses.filter(c => c.conflict).length

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar onOpenAccount={() => setAccountOpen(true)} />

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
            dragging
              ? 'border-[#E91E8C] bg-pink-50'
              : importStatus === 'ok'
              ? 'border-green-300 bg-green-50'
              : importStatus === 'error'
              ? 'border-red-300 bg-red-50'
              : 'border-pink-200 hover:border-pink-300'
          }`}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
            importStatus === 'ok' ? 'bg-green-100' : importStatus === 'error' ? 'bg-red-100' : 'bg-pink-100'
          }`}>
            {importStatus === 'ok'
              ? <CheckCircle size={26} className="text-green-500" />
              : importStatus === 'error'
              ? <AlertCircle size={26} className="text-red-400" />
              : importStatus === 'loading'
              ? <FileSpreadsheet size={26} style={{ color: '#E91E8C' }} className="animate-pulse" />
              : <CloudUpload size={26} style={{ color: '#E91E8C' }} />
            }
          </div>
          <p className="text-lg font-semibold text-gray-800 mb-1">
            {importStatus === 'loading'
              ? 'กำลังอ่านไฟล์...'
              : importStatus === 'ok'
              ? fileName
              : importStatus === 'error'
              ? fileName ?? 'อัพโหลดไม่สำเร็จ'
              : fileName ?? 'วางไฟล์ที่นี่เพื่ออัพโหลด'
            }
          </p>
          {importStatus === 'ok' && (
            <p className="text-sm text-green-600 mb-6">
              โหลดสำเร็จ — {ALL_CLASSES.length} คาบเรียน
            </p>
          )}
          {importStatus === 'error' && (
            <p className="text-sm text-red-500 mb-6">{importError}</p>
          )}
          {!importStatus && (
            <p className="text-sm text-gray-400 mb-6">รองรับ .XLSX, .XLS, .CSV</p>
          )}
          {importStatus === 'ok' && (
            <p className="text-xs text-gray-400 mb-6">คลิกเพื่อเปลี่ยนไฟล์</p>
          )}
          <button
            onClick={e => { e.stopPropagation(); fileRef.current?.click() }}
            className="flex items-center gap-2 px-7 py-3 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#9B1B5A' }}
          >
            <FolderOpen size={16} />
            เลือกไฟล์
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={e => handleFile(e.target.files[0])}
          />
        </div>

        {/* ── Format hint ── */}
        <div className="mb-8 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-700">Format ที่รองรับ — </span>
          ตารางห้องเรียนคณะเทคโน (แต่ละ sheet = 1 ห้อง) ·
          อ่านแถววัน จันทร์–อาทิตย์ คาบ 3 หน่วยกิต (09:00, 12:00, 15:00, 18:00)
          และ 2 หน่วยกิต (09:00, 11:00, 13:00, 15:00, 17:00, 19:00) อัตโนมัติ
        </div>

        {/* ── Import Preview ── */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-gray-900">ตัวอย่างการนำเข้า</h2>
          <div className="flex items-center gap-3">
            {conflictCount > 0 && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-[#E91E8C]">
                <AlertCircle size={15} />
                {conflictCount} ความขัดแย้งที่พบ
              </span>
            )}
            {importedClasses && (
              <button
                onClick={clearTable}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
              >
                ล้างตาราง
              </button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-start gap-x-6 gap-y-3 mb-5">

          {/* Day toggles */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase">แสดงวัน:</span>
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
                  >{DAY_ABBR[d]}</button>
                )
              })}
            </div>
          </div>

          {/* Floor selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase">ชั้น:</span>
            <div className="relative">
              <select
                value={activeFloor}
                onChange={e => handleFloorChange(e.target.value)}
                className="appearance-none border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-700 focus:outline-none focus:border-pink-300 bg-white cursor-pointer"
              >
                {floors.map(f => (
                  <option key={f} value={f}>ชั้น {f}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Room selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase">ห้อง:</span>
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
              <span className="font-semibold text-gray-800">{visibleClasses.length}</span> คาบเรียนสัปดาห์นี้
            </span>
          </div>

          {/* Start Time carousel */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase">เวลาเริ่ม:</span>
            <div className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-2 py-1.5 bg-white">
              <button
                onClick={() => setMinutesBefore(m => Math.max(0, m - 5))}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-sm text-gray-400 w-6 text-center select-none">
                {minutesBefore > 0 ? minutesBefore - 5 : 0}
              </span>
              <div className="px-4 py-1 rounded-lg bg-pink-100 min-w-[64px] text-center">
                <span className="text-sm font-bold" style={{ color: '#E91E8C' }}>
                  {minutesBefore} min
                </span>
              </div>
              <span className="text-sm text-gray-400 w-6 text-center select-none">
                {minutesBefore < 20 ? minutesBefore + 5 : 20}
              </span>
              <button
                onClick={() => setMinutesBefore(m => Math.min(20, m + 5))}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
              >
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
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
                >
                  ล้าง
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Timetable ── */}
        <div className="rounded-2xl border border-gray-100 overflow-x-auto select-none">
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
                เลือกอย่างน้อยหนึ่งวัน
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
                  const left     = DAY_COL_W + (cls.startH - START_HOUR) * CELL_W + 2
                  const width    = (cls.endH - cls.startH) * CELL_W - 4
                  const selected = selectedIds.has(cls.id)
                  return (
                    <div
                      key={cls.id}
                      onMouseDown={e => handleCardMouseDown(e, cls.id)}
                      onMouseEnter={() => handleCardMouseEnter(cls.id)}
                      className={`absolute top-2 rounded-lg px-2 py-1 border-l-4 overflow-hidden cursor-pointer select-none transition-all ${
                        selected
                          ? 'ring-2 ring-offset-1 shadow-md'
                          : 'hover:brightness-95'
                      } ${
                        cls.conflict
                          ? 'bg-pink-100 border-[#E91E8C]'
                          : 'bg-pink-50 border-pink-300'
                      }`}
                      style={{
                        left, width, height: DAY_ROW_H - 16,
                        ...(selected ? { ringColor: '#E91E8C', boxShadow: '0 0 0 2px #E91E8C' } : {}),
                      }}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className={`text-xs font-bold leading-tight truncate ${cls.conflict ? 'text-[#E91E8C]' : 'text-gray-800'}`}>
                          {cls.code}
                        </span>
                        {cls.conflict
                          ? <AlertCircle size={12} style={{ color: '#E91E8C' }} className="shrink-0 mt-0.5" />
                          : selected && <CheckCircle size={12} style={{ color: '#E91E8C' }} className="shrink-0 mt-0.5" />
                        }
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{cls.time}</div>
                      {selected && minutesBefore > 0 && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <Clock size={9} style={{ color: '#E91E8C' }} />
                          <span className="text-[9px] font-semibold" style={{ color: '#E91E8C' }}>
                            เปิด {adjustedStart(cls.startH)}
                          </span>
                        </div>
                      )}
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
            ยกเลิกแบบร่าง
          </button>
          <button
            className="flex items-center gap-2 px-8 py-3 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#9B1B5A' }}
          >
            <CheckCircle size={16} />
            สร้างตารางเรียน
          </button>
        </div>
      </main>

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

      <AccountSettings isOpen={accountOpen} onClose={() => setAccountOpen(false)} />
    </div>
  )
}
