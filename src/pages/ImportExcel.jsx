
import { useState, useRef, useMemo, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { CloudUpload, FolderOpen, CheckCircle, AlertCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Clock, FileSpreadsheet } from 'lucide-react'
import Navbar from '../components/Navbar'
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

function floorFromRoomCode(roomCode) {
  const after = String(roomCode).split('-')[1]
  if (!after) return 0
  return Math.floor(parseInt(after) / 100)
}

function parseHeaderRow(row) {
  // Given a header row (วัน/เวลา row), extract all slots with col index and time
  const slots = []
  if (!row) return slots
  for (let ci = 0; ci < row.length; ci++) {
    const cell = row[ci]
    if (!cell) continue
    const s = String(cell)
    const m = s.match(/(\d{4})-(\d{4})/)
    if (!m) continue
    slots.push({ col: ci, start: m[1], end: m[2] })
  }
  // Compute colEnd for each slot = next slot's col - 1 (to handle merged cells)
  return slots.map((s, i) => ({
    ...s,
    colEnd: i + 1 < slots.length ? slots[i + 1].col - 1 : s.col + 3
  }))
}

function getHeaderTimeForCol(aoa, headerMerges, headerRi, col) {
  for (const mg of headerMerges) {
    if (mg.s.r <= headerRi && headerRi <= mg.e.r && mg.s.c <= col && col <= mg.e.c) {
      const cellVal = aoa[mg.s.r]?.[mg.s.c]
      if (cellVal) return parseSlotTimeText(String(cellVal))
    }
  }
  for (let c = col; c >= 1; c--) {
    const cellVal = aoa[headerRi]?.[c]
    if (cellVal) return parseSlotTimeText(String(cellVal))
  }
  return null
}

function parseSlotTimeText(text) {
  const m = text.match(/(\d{3,4})\s*-\s*(\d{3,4})/)
  if (!m) return null
  return { start: m[1].padStart(4, '0'), end: m[2].padStart(4, '0') }
}

function parseThaiTimetableWithDates(wb, holidaySet = new Set()) {
  const classes = []
  let uid = 0

  wb.SheetNames.forEach(sheetName => {
    const roomMatch = sheetName.match(/(\d+-\w+)/)
    if (!roomMatch) return
    const room = roomMatch[1]
    const floor = floorFromRoomCode(room)

    const ws  = wb.Sheets[sheetName]
    const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false })
    const merges = ws['!merges'] || []
    const allMerges = merges
    const mergeMap = {}
    merges.forEach(({ s, e }) => {
      for (let r = s.r; r <= e.r; r++) {
        for (let c = s.c; c <= e.c; c++) {
          mergeMap[`${r},${c}`] = { startCol: s.c, endCol: e.c }
        }
      }
    })

    // Build a map of rowIndex → slots for every header row (วัน/เวลา rows)
    const headerSlotMap = {}
    for (let ri = 0; ri < aoa.length; ri++) {
      const row = aoa[ri]
      if (row && String(row[0]).trim() === 'วัน/เวลา') {
        const slots = parseHeaderRow(row)
        if (slots.length > 0) headerSlotMap[ri] = slots
      }
    }
    if (Object.keys(headerSlotMap).length === 0) return
    const headerRowIndices = Object.keys(headerSlotMap).map(Number).sort((a, b) => a - b)
    // Flat colTimeMap: col → { start, end } from ALL headers combined
    // Each col maps to the slot time of the header that "owns" that col range
    const colTimeMap = {}
    headerRowIndices.forEach(hri => {
      headerSlotMap[hri].forEach(({ col, colEnd, start, end }) => {
        for (let c = col; c <= colEnd; c++) {
          // Only set if not already set, or if this slot's start is earlier
          colTimeMap[c] = { start, end }
        }
      })
    })

    aoa.forEach((row, ri) => {
      if (!row || !row[0]) return
      const cell0 = String(row[0])
      if (!DAY_TH_RE.test(cell0)) return
      const dayTh = cell0.split('\n')[0].trim()
      const day   = DAY_TH[dayTh]
      if (!day) return

      // Find nearest header row above this day row
      const nearestHeaderRi = headerRowIndices.filter(h => h < ri).pop()
      if (nearestHeaderRi === undefined) return
      const activeSlots = headerSlotMap[nearestHeaderRi]

      activeSlots.forEach(({ col, colEnd, start: slotStart, end: slotEnd }) => {
        // Scan col..colEnd to handle merged cells shifting data
        let val = null
        let foundCol = col
        for (let c = col; c <= colEnd; c++) {
          if (row[c] && String(row[c]).trim()) { val = row[c]; foundCol = c; break }
        }
        if (!val) return
        const text = String(val).trim()
        if (!text) return
        const tokens = text.split(/\s+/)
        const code = tokens.length >= 2 ? `${tokens[0]} ${tokens[1]}` : tokens[0]
        if (!code) return

        // Determine actual start/end time using merged cell range
        let start = slotStart
        let end   = slotEnd
        const mergeKey = `${ri},${foundCol}`
        if (mergeMap[mergeKey]) {
          const { startCol, endCol } = mergeMap[mergeKey]
          const colSpan = endCol - startCol + 1
          let targetHeaderRi
          if (colSpan % 2 === 1 && headerRowIndices[0] !== undefined) {
            targetHeaderRi = headerRowIndices[0]
          } else if (colSpan % 2 === 0 && headerRowIndices[1] !== undefined) {
            targetHeaderRi = headerRowIndices[1]
          } else {
            targetHeaderRi = nearestHeaderRi
          }
          const startTime = getHeaderTimeForCol(aoa, allMerges, targetHeaderRi, startCol)
          const endTime   = getHeaderTimeForCol(aoa, allMerges, targetHeaderRi, endCol)
          if (startTime) start = startTime.start
          if (endTime)   end   = endTime.end
        }

        classes.push({ id: `xl-${uid++}`, day, date: null, week: null, startH: parseH(start), endH: parseH(end), code, time: `${fmtTime(start)} – ${fmtTime(end)}`, room, floor, conflict: false })
      })
    })
  })

  const toHHMM = h => {
    const hh = Math.floor(h)
    const mm = Math.round((h - hh) * 60)
    return `${String(hh).padStart(2,'0')}${String(mm).padStart(2,'0')}`
  }

  const groupMap = {}
  // Group by date|room|code, then find matching slot (adjacent or overlapping)
  const slotCountMap = {}
  classes.forEach(c => {
    const baseKey = `${c.date}|${c.room}|${c.code}`
    let matched = null
    let matchedKey = null
    const count = slotCountMap[baseKey] || 0
    for (let i = 0; i < count; i++) {
      const k = `${baseKey}|${i}`
      const ex = groupMap[k]
      if (ex && c.startH <= ex.endH + 0.1 && c.endH >= ex.startH - 0.1) {
        matched = ex
        matchedKey = k
        break
      }
    }
    if (matched) {
      const newStartH = Math.min(matched.startH, c.startH)
      const newEndH   = Math.max(matched.endH,   c.endH)
      groupMap[matchedKey] = {
        ...matched,
        startH: newStartH,
        endH:   newEndH,
        time:   `${fmtTime(toHHMM(newStartH))} – ${fmtTime(toHHMM(newEndH))}`
      }
    } else {
      const idx = count
      slotCountMap[baseKey] = idx + 1
      const k = `${baseKey}|${idx}`
      groupMap[k] = { ...c }
    }
  })
  return Object.values(groupMap)
}

function detectConflicts(items) {
  items.forEach(a => { a.conflict = false; a.conflictsWith = [] })
  items.forEach((a, i) => items.forEach((b, j) => {
    const sameSlot = a.day === b.day
    if (i !== j && a.room === b.room && sameSlot && a.startH < b.endH && a.endH > b.startH) {
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
    date:    item.Date ?? null,
    week:    item.Week ?? null,
    startH:  parseH(item.Start),
    endH:    parseH(item.End),
    code:    item.Course,
    time:    `${fmtTime(item.Start)} – ${fmtTime(item.End)}`,
    room:    item.Raw,
    floor:   item.Floor,
    conflict: false,
  })))
}

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
    Date: p.date ?? null,
    Week: p.week ?? null,
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
    Date: null, Week: null,
    Start: form.start, End: form.end,
    Course: form.course.trim(), Span: Math.round((endH - startH) * 2),
  }
}

const EMPTY_FORM = { raw: '', day: 'Mon', start: '0900', end: '1100', course: '' }
const MERGE_GAP_MIN = 30

function buildRoomSessions(classes) {
  const sorted = [...classes].sort((a, b) => a.startH - b.startH)
  const sessions = []
  for (const cls of sorted) {
    const last = sessions[sessions.length - 1]
    if (!last || cls.startH >= last.endH) {
      sessions.push({ startH: cls.startH, endH: cls.endH })
    } else {
      last.endH = Math.max(last.endH, cls.endH)
    }
  }
  return sessions
}

function computeTokenSchedule(classes, mergeGapMin = MERGE_GAP_MIN) {
  const grouped = {}
  classes.forEach(cls => {
    const key = `${cls.room}|${cls.day}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(cls)
  })

  let totalTokens = 0
  let savedTokens = 0

  Object.values(grouped).forEach(clsList => {
    const sessions = buildRoomSessions(clsList)
    totalTokens += sessions.length * 2
    for (let i = 0; i + 1 < sessions.length; i++) {
      const gapMin = (sessions[i + 1].startH - sessions[i].endH) * 60
      if (gapMin > 0 && gapMin <= mergeGapMin) {
        totalTokens -= 2
        savedTokens += 2
      }
    }
  })

  return { totalTokens, savedTokens }
}

function buildSchedulePayload(classes, mergeGapMin, minutesBefore) {
  const grouped = {}
  classes.forEach(cls => {
    const key = `${cls.room}|${cls.day}`
    if (!grouped[key]) grouped[key] = { room: cls.room, day: cls.day, list: [] }
    grouped[key].list.push(cls)
  })

  const schedule = []
  Object.values(grouped).forEach(({ room, day, list }) => {
    const sorted = [...list].sort((a, b) => a.startH - b.startH)

    // merge overlapping sessions
    const sessions = []
    for (const cls of sorted) {
      const last = sessions[sessions.length - 1]
      if (!last || cls.startH >= last.endH) {
        sessions.push({ startH: cls.startH, endH: cls.endH })
      } else {
        last.endH = Math.max(last.endH, cls.endH)
      }
    }

    // merge sessions ที่ gap ≤ mergeGapMin → เปิดไฟต่อเนื่อง
    const merged = [{ ...sessions[0] }]
    for (let i = 1; i < sessions.length; i++) {
      const last = merged[merged.length - 1]
      const gapMin = (sessions[i].startH - last.endH) * 60
      if (gapMin <= mergeGapMin) {
        last.endH = sessions[i].endH
      } else {
        merged.push({ ...sessions[i] })
      }
    }

    merged.forEach(s => {
      const onH = Math.max(0, s.startH - minutesBefore / 60)
      schedule.push({
        room,
        day: DAY_TO_BACKEND[day] ?? day.toUpperCase(),
        on:  toHHMM(onH),
        off: toHHMM(s.endH),
      })
    })
  })

  return { mergeGapMinutes: mergeGapMin, schedule }
}

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

  /* ── Semester state ── */
  const [dragging,     setDragging]     = useState(false)
  const [fileName,     setFileName]     = useState(null)
  const [importStatus, setImportStatus] = useState(null)
  const [importError,  setImportError]  = useState('')
  const [rawData,      setRawData]      = useState([])
  const [isModified,   setIsModified]   = useState(false)
  const [modal,        setModal]        = useState(null)   // null | 'add' | rawItem
  const [form,         setForm]         = useState(EMPTY_FORM)
  const [submitting,   setSubmitting]   = useState(false)
  const [conflictTooltip, setConflictTooltip] = useState(null)
  const [showConflictPanel, setShowConflictPanel] = useState(false)
  // { x, y, cls } — cls is the class with conflict info

  const ALL_CLASSES = useMemo(() => detectConflicts(buildClasses(rawData)), [rawData])
  const tokenInfo   = useMemo(() => computeTokenSchedule(ALL_CLASSES), [ALL_CLASSES])

  const [activeDays,    setActiveDays]    = useState(ALL_DAYS)          // เปิดทุกวัน
  const [activeFloor,   setActiveFloor]   = useState(null)
  const [activeRoom,    setActiveRoom]    = useState(null)
  const [minutesBefore, setMinutesBefore] = useState(0)
  const [selectedIds,   setSelectedIds]   = useState(new Set())
  const [expandedKeys,   setExpandedKeys]   = useState(new Set())
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
    setRawData(null)
    setIsModified(false)
    setImportStatus(null)
    setImportError('')
    setFileName(null)
    setSelectedIds(new Set())
    setActiveFloor(null)
    setActiveRoom(null)
    setShowConflictPanel(false)
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
    [...new Set(ALL_CLASSES.filter(s => activeFloor == null || s.floor === activeFloor).map(s => s.room))].sort((a, b) => {
      const [aB, aR] = a.split('-').map(Number)
      const [bB, bR] = b.split('-').map(Number)
      return aB !== bB ? aB - bB : aR - bR
    }),
  [ALL_CLASSES, activeFloor])

  const currentRoom    = (activeRoom && rooms.includes(activeRoom)) ? activeRoom : null
  const _byRoom = currentRoom
    ? ALL_CLASSES.filter(s => s.room === currentRoom)
    : activeFloor != null
      ? ALL_CLASSES.filter(s => s.floor === activeFloor)
      : ALL_CLASSES
  const visibleClasses = _byRoom
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
        const wb       = XLSX.read(e.target.result, { type: 'array' })
        const classes = parseThaiTimetableWithDates(wb)
        if (classes.length === 0)
          throw new Error('ไม่พบข้อมูลในไฟล์ — ตรวจสอบว่าไฟล์เป็น format ตารางห้องเรียนคณะเทคโน')
        const rawItems = classes.map(rawFromProcessed)
        setRawData(rawItems)
        setActiveDays(ALL_DAYS)
        setIsModified(false)
        setImportStatus('ok')
        setActiveFloor(null)
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
    setSubmitting(true)
    try {
      const payload = buildSchedulePayload(ALL_CLASSES, MERGE_GAP_MIN, minutesBefore)
      await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      toast.success('สร้างตารางเรียนสำเร็จ')
    } catch {
      toast.error('ส่งข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง')
    } finally {
      setSubmitting(false)
    }
  }

  const conflictCount = visibleClasses.filter(c => c.conflict).length

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 w-full px-14 xl:px-26 2xl:px-48 py-10">

        {/* ── Page header ── */}
        <h1 className="text-4xl font-bold text-gray-900 mb-1">นำเข้าตารางเรียน</h1>
        <p className="text-gray-400 text-sm mb-8">อัพโหลดและตรวจสอบตารางเรียนสำหรับภาคการศึกษาที่กำลังจะมาถึง</p>

        {/* ── Semester + Drop zone ── */}
        <div className="grid grid-cols-5 gap-6 mb-4 items-stretch">

          {/* Drop zone */}
          {(() => {
            return (
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
                onClick={() => fileRef.current?.click()}
                className={`col-span-5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-14 transition-colors select-none ${
                  dragging
                      ? 'border-[#E91E8C] bg-pink-50 cursor-pointer'
                      : importStatus === 'ok'    ? 'border-green-300 bg-green-50 cursor-pointer'
                      : importStatus === 'error' ? 'border-red-300 bg-red-50 cursor-pointer'
                      : 'border-pink-200 hover:border-pink-300 cursor-pointer'
                }`}
              >
                <>
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
                      importStatus === 'ok' ? 'bg-green-100' : importStatus === 'error' ? 'bg-red-100' : 'bg-pink-100'
                    }`}>
                      {importStatus === 'ok'       ? <CheckCircle size={26} className="text-green-500" />
                      : importStatus === 'error'   ? <AlertCircle size={26} className="text-red-400" />
                      : importStatus === 'loading' ? <FileSpreadsheet size={26} style={{ color: '#E91E8C' }} className="animate-pulse" />
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
                  </>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
              </div>
            )
          })()}
        </div>{/* end grid */}

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            {conflictCount > 0 && (
              <button
                onClick={() => setShowConflictPanel(true)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border hover:opacity-80 transition-opacity"
                style={{ color: '#E91E8C', borderColor: '#E91E8C', backgroundColor: '#fdf2f8' }}
              >
                <AlertCircle size={13} />
                {conflictCount} ความขัดแย้งที่พบ
                <span className="text-[10px] opacity-60">กดเพื่อดู</span>
              </button>
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
              <span className="font-semibold text-gray-800">{visibleClasses.length}</span> คาบทั้งหมด
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

                  {/* Merge connectors — ใช้เฉพาะ primary card ของแต่ละ visual group */}
                  {(() => {
                    const byRoom = {}
                    groups.forEach(group => {
                      const p = group[0]
                      if (!byRoom[p.room]) byRoom[p.room] = []
                      byRoom[p.room].push(p)
                    })
                    const result = []
                    Object.entries(byRoom).forEach(([room, primaries]) => {
                      const sessions = buildRoomSessions(primaries)
                      for (let i = 0; i + 1 < sessions.length; i++) {
                        const gapMin = (sessions[i + 1].startH - sessions[i].endH) * 60
                        if (gapMin > 0 && gapMin <= MERGE_GAP_MIN) {
                          const fullH  = DAY_ROW_H - 16
                          const ch     = fullH * 0.52
                          const topOff = (fullH - ch) / 2
                          const cx     = DAY_COL_W + (sessions[i].endH - START_HOUR) * CELL_W - 2
                          const cw     = (sessions[i + 1].startH - sessions[i].endH) * CELL_W + 4
                          const W = cw, H = ch
                          const d = `M 0 0 C ${W*0.35} ${H*0.4},${W*0.65} ${H*0.4},${W} 0 L ${W} ${H} C ${W*0.65} ${H*0.6},${W*0.35} ${H*0.6},0 ${H} Z`
                          result.push(
                            <div key={`conn-${room}-${i}`} style={{ position: 'absolute', left: cx, top: 8 + topOff, width: cw, height: ch, pointerEvents: 'none', zIndex: 2 }}>
                              <svg width={cw} height={ch} viewBox={`0 0 ${cw} ${ch}`}>
                                <path d={d} fill="#3b82f6" fillOpacity="0.5" />
                              </svg>
                            </div>
                          )
                        }
                      }
                    })
                    return result
                  })()}

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
                              <div className="shrink-0 mt-0.5">
                                <AlertCircle
                                  size={12}
                                  style={{ color: '#E91E8C' }}
                                  className="cursor-help"
                                  onMouseEnter={e => {
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    setConflictTooltip({ x: rect.left, y: rect.top, cls })
                                  }}
                                  onMouseLeave={() => setConflictTooltip(null)}
                                />
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
                <label className="block text-sm font-medium text-gray-700 mb-1"></label>
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

      {/* Conflict list modal */}
      {showConflictPanel && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.3)' }}
          onClick={() => setShowConflictPanel(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
            style={{ width: 360, maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-pink-50 border-b border-pink-100 shrink-0">
              <span className="text-sm font-semibold text-pink-600">รายการที่ขัดแย้งกัน</span>
              <button onClick={() => setShowConflictPanel(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
            </div>
            <div className="overflow-y-auto flex-1">
              {(() => {
                const seen = new Set()
                const pairs = []
                ALL_CLASSES.filter(c => c.conflict).forEach(a => {
                  (a.conflictsWith || []).forEach(b => {
                    const key = [a.code, b.code].sort().join('|') + '|' + a.room
                    if (!seen.has(key)) {
                      seen.add(key)
                      pairs.push({ a, b })
                    }
                  })
                })
                return pairs.map(({ a, b }) => (
                  <div key={`${a.id}-${b.id}`} className="px-4 py-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold truncate" style={{ color: '#E91E8C' }}>{a.code}</span>
                      <span className="text-[10px] text-gray-300 shrink-0">vs</span>
                      <span className="text-xs font-bold truncate" style={{ color: '#E91E8C' }}>{b.code}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {a.room === b.room
                        ? <>ห้อง {a.room} · {a.time} / {b.time}</>
                        : <>{a.room} ({a.time}) vs {b.room} ({b.time})</>
                      }
                    </div>
                  </div>
                ))
              })()}
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


