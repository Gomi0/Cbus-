import { useState } from 'react'
import Navbar from '../components/Navbar'
import AccountSettings from '../components/AccountSettings'
import lightbulbOff from '../assets/lightbulb.png'
import lightbulbOn  from '../assets/lightbulb (1).png'
import snowflakeOff from '../assets/snow-flake.png'
import snowflakeOn  from '../assets/snow-flake (1).png'

// ─── floor data ───────────────────────────────────────────
const FLOOR_LIST = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

const FLOOR_DATA = {
  1: {
    code: '01FL-ZA · 2,830 m²',
    image: '/assets/floor1-plan-dark.png',
    aspect: '16 / 7',
    rooms: [
      { id: '0101', cap: 30, x: 16,    y: 38,    w: 12,    h: 24,    light: true,  ac: true  },
      { id: '0102', cap: 40, x: 33,    y: 28,    w: 14,    h: 24,    light: true,  ac: false },
      { id: '0103', cap: 36, x: 50,    y: 32,    w: 14,    h: 24,    light: false, ac: true  },
      { id: '0104', cap: 28, x: 69,    y: 26,    w: 14,    h: 24,    light: false, ac: false },
    ],
  },
  5: {
    code: '05FL-ZA · 3,240 m²',
    image: '/assets/floor5-plan-dark.png',
    aspect: '734 / 226',
    rooms: [
      { id: '504',   cap: 64, x:  2.6,  y:  5.3,  w: 16.2,  h: 28.8,  light: true,  ac: true  },
      { id: 'STR-N', cap: 0,  x: 18.8,  y:  5.3,  w:  4.4,  h: 28.8,  light: false, ac: false, kind: 'svc' },
      { id: '505',   cap: 48, x: 23.3,  y:  5.3,  w: 11.0,  h: 28.8,  light: true,  ac: false },
      { id: '506',   cap: 44, x: 34.3,  y:  5.3,  w: 10.1,  h: 28.8,  light: false, ac: true  },
      { id: 'WC-S',  cap: 0,  x:  2.6,  y: 43.4,  w: 10.7,  h: 25.6,  light: false, ac: false, kind: 'wc' },
      { id: '503',   cap: 60, x: 11.4,  y: 43.4,  w: 11.9,  h: 25.6,  light: true,  ac: true  },
      { id: '502',   cap: 54, x: 23.3,  y: 43.4,  w: 11.0,  h: 25.6,  light: false, ac: true  },
      { id: '501',   cap: 54, x: 34.3,  y: 43.4,  w: 11.5,  h: 25.6,  light: true,  ac: true  },
      { id: 'WC-N',  cap: 0,  x: 44.5,  y:  5.3,  w:  6.7,  h: 29.7,  light: false, ac: false, kind: 'wc' },
    ],
  },
  6: {
    code: '06FL-ZA · 3,240 m²',
    image: '/assets/floor6-plan-dark.png',
    aspect: '738 / 220',
    rooms: [
      { id: '604',   cap: 48, x:  2.85, y: 10.45, w:  9.62, h: 25.0,  light: true,  ac: true  },
      { id: '605',   cap: 48, x: 12.47, y: 10.45, w: 11.11, h: 25.0,  light: true,  ac: false },
      { id: '606',   cap: 48, x: 23.58, y: 10.45, w: 10.98, h: 25.0,  light: false, ac: true  },
      { id: '607',   cap: 44, x: 34.55, y: 10.45, w: 10.70, h: 25.0,  light: true,  ac: true  },
      { id: 'STR-S', cap: 0,  x:  2.85, y: 45.45, w:  8.81, h: 25.9,  light: false, ac: false, kind: 'svc' },
      { id: '603',   cap: 60, x: 11.65, y: 45.45, w: 11.92, h: 25.9,  light: true,  ac: true  },
      { id: '602',   cap: 54, x: 23.58, y: 45.45, w: 10.98, h: 25.9,  light: false, ac: true  },
      { id: '601',   cap: 54, x: 34.55, y: 45.45, w: 11.25, h: 25.9,  light: true,  ac: true  },
    ],
  },
  7: {
    code: '07FL-ZA · 3,240 m²',
    image: '/assets/floor7-plan-dark.png',
    aspect: '738 / 220',
    rooms: [
      { id: '704',   cap: 48, x:  2.85, y: 10.45, w:  9.62, h: 25.0,  light: true,  ac: true  },
      { id: '705',   cap: 48, x: 12.47, y: 10.45, w: 11.11, h: 25.0,  light: true,  ac: false },
      { id: '706',   cap: 48, x: 23.58, y: 10.45, w: 10.98, h: 25.0,  light: false, ac: true  },
      { id: '707',   cap: 44, x: 34.55, y: 10.45, w: 10.70, h: 25.0,  light: true,  ac: true  },
      { id: 'STR-S', cap: 0,  x:  2.85, y: 45.45, w:  6.23, h: 25.9,  light: false, ac: false, kind: 'svc' },
      { id: '703',   cap: 60, x: 11.65, y: 45.45, w: 11.92, h: 25.9,  light: true,  ac: true  },
      { id: '702',   cap: 54, x: 23.58, y: 45.45, w: 10.98, h: 25.9,  light: false, ac: true  },
      { id: '701',   cap: 54, x: 34.55, y: 45.45, w: 11.25, h: 25.9,  light: true,  ac: true  },
    ],
  },
  9: {
    code: '09FL-ZA · 3,960 m²',
    image: '/assets/floor9-plan-dark.png',
    aspect: '1330 / 308',
    rooms: [
      // ปีกซ้าย — แถวบน (4 ห้องเรียน)
      { id: '904', cap: 48, x:  1.43, y:  6.49, w: 10.30, h: 42.21, light: true,  ac: true  },
      { id: '905', cap: 48, x: 11.73, y:  6.49, w: 11.65, h: 42.21, light: false, ac: true  },
      { id: '906', cap: 48, x: 23.38, y:  6.49, w: 11.73, h: 42.21, light: true,  ac: false },
      { id: '907', cap: 48, x: 35.11, y:  6.49, w: 11.58, h: 42.21, light: true,  ac: true  },
      // ปีกซ้าย — แถวล่าง (บันได + WC + 3 ห้อง)
      { id: 'STR-W', cap: 0, kind: 'svc', x:  1.43, y: 48.70, w:  6.62, h: 29.22, light: false, ac: false },
      { id: 'WC-W',  cap: 0, kind: 'wc',  x:  8.05, y: 48.70, w:  3.00, h: 29.22, light: false, ac: false },
      { id: '901', cap: 60, x: 11.05, y: 48.70, w: 12.33, h: 29.22, light: true,  ac: true  },
      { id: '902', cap: 60, x: 23.38, y: 48.70, w: 11.73, h: 29.22, light: false, ac: true  },
      { id: '903', cap: 60, x: 35.11, y: 48.70, w: 11.58, h: 29.22, light: true,  ac: true  },
      // ปีกขวา — แถวบน (4 ห้องเรียน)
      { id: '908', cap: 48, x: 55.94, y:  6.49, w: 10.90, h: 42.21, light: true,  ac: true  },
      { id: '909', cap: 48, x: 66.84, y:  6.49, w: 11.36, h: 42.21, light: false, ac: true  },
      { id: '910', cap: 48, x: 78.20, y:  6.49, w: 11.27, h: 42.21, light: true,  ac: false },
      { id: '911', cap: 48, x: 89.47, y:  6.49, w:  9.18, h: 42.21, light: true,  ac: true  },
      // ปีกขวา — แถวล่าง (3 ห้อง + WC + บันได)
      { id: '912', cap: 60, x: 55.94, y: 48.70, w: 10.38, h: 29.22, light: true,  ac: true  },
      { id: '913', cap: 60, x: 66.32, y: 48.70, w: 11.88, h: 29.22, light: false, ac: true  },
      { id: '914', cap: 60, x: 78.20, y: 48.70, w: 11.27, h: 29.22, light: true,  ac: true  },
      { id: 'WC-E',  cap: 0, kind: 'wc',  x: 89.47, y: 48.70, w:  4.36, h: 29.22, light: false, ac: false },
      { id: 'STR-E', cap: 0, kind: 'svc', x: 93.83, y: 48.70, w:  4.82, h: 29.22, light: false, ac: false },
    ],
  },
  8: {
    code: '08FL-ZA · 2,980 m²',
    image: '/assets/floor8-plan-dark.png',
    aspect: '735 / 211',
    rooms: [
      { id: '804',  cap: 42, x:  1.7,  y:  5.7,  w:  9.8,  h: 31.3,  light: true,  ac: true  },
      { id: '805',  cap: 48, x: 11.5,  y:  5.7,  w: 11.2,  h: 31.3,  light: true,  ac: false },
      { id: '806',  cap: 48, x: 22.7,  y:  5.7,  w: 11.2,  h: 31.3,  light: false, ac: true  },
      { id: '807',  cap: 48, x: 33.8,  y:  5.7,  w: 10.9,  h: 31.3,  light: true,  ac: true  },
      { id: 'WC-N', cap: 0,  x: 44.7,  y:  5.7,  w:  9.5,  h: 31.3,  light: false, ac: false, kind: 'wc' },
      { id: 'SVR',  cap: 0,  x:  1.7,  y: 45.5,  w:  6.39, h: 29.4,  light: false, ac: true,  kind: 'svc' },
      { id: '803',  cap: 60, x: 10.6,  y: 47.4,  w: 12.1,  h: 27.5,  light: true,  ac: true  },
      { id: '802',  cap: 54, x: 22.7,  y: 47.4,  w: 11.2,  h: 27.5,  light: false, ac: true  },
      { id: '801',  cap: 72, x: 33.8,  y: 47.4,  w: 11.2,  h: 27.5,  light: true,  ac: false },
    ],
  },
  10: {
    code: '10FL-ZA · 4,120 m²',
    image: '/assets/floor10-plan-dark.png',
    aspect: '1579 / 471',
    rooms: [
      { id: 'A01',   cap: 54, x:  1.58, y:  9.98, w: 10.20, h: 26.1,  light: true,  ac: true  },
      { id: 'A02',   cap: 54, x: 11.78, y:  9.98, w: 11.65, h: 26.1,  light: true,  ac: false },
      { id: 'A03',   cap: 54, x: 23.43, y:  9.98, w: 11.66, h: 26.1,  light: false, ac: true  },
      { id: 'A04',   cap: 48, x: 35.09, y:  9.98, w: 11.27, h: 26.1,  light: true,  ac: true  },
      { id: 'STR-S', cap: 0,  x:  1.58, y: 47.13, w:  6.59, h: 27.6,  light: false, ac: false, kind: 'svc' },
      { id: 'B01',   cap: 72, x: 10.96, y: 47.13, w: 12.48, h: 27.6,  light: true,  ac: true  },
      { id: 'B02',   cap: 72, x: 23.43, y: 47.13, w: 11.65, h: 27.6,  light: false, ac: true  },
      { id: 'WC-S',  cap: 0,  x: 35.09, y: 47.13, w: 11.53, h: 27.6,  light: false, ac: false, kind: 'wc' },
    ],
  },
  11: {
    code: '11FL-ZA · 3,240 m²',
    image: '/assets/floor11-plan-dark.png',
    aspect: '740 / 221',
    rooms: [
      { id: '1105',  cap: 24, x:  2.03, y: 10.41, w:  6.22, h: 26.24, light: true,  ac: true  },
      { id: '1104',  cap: 32, x:  8.24, y: 10.41, w:  7.70, h: 26.24, light: true,  ac: false },
      { id: '1103',  cap: 32, x: 15.95, y: 10.41, w:  7.70, h: 26.24, light: false, ac: true  },
      { id: '1102',  cap: 48, x: 23.65, y: 10.41, w: 11.62, h: 26.24, light: true,  ac: true  },
      { id: '1101',  cap: 48, x: 35.27, y: 10.41, w: 11.08, h: 26.24, light: false, ac: true  },
      { id: 'STR-S', cap: 0,  x:  2.03, y: 47.06, w:  6.70, h: 27.15, light: false, ac: false, kind: 'svc' },
      { id: '1106',  cap: 60, x: 11.22, y: 47.06, w: 12.43, h: 27.15, light: true,  ac: true  },
      { id: '1107',  cap: 54, x: 23.65, y: 47.06, w: 11.62, h: 27.15, light: false, ac: true  },
      { id: '1108',  cap: 54, x: 35.27, y: 47.06, w: 11.76, h: 27.15, light: true,  ac: true  },
    ],
  },
  12: {
    code: '12FL-ZA · 3,480 m²',
    image: '/assets/floor12-plan-dark.png',
    aspect: '739 / 221',
    rooms: [
      { id: '1205',  cap: 24, x:  2.03, y: 10.41, w:  6.23, h: 26.24, light: true,  ac: true  },
      { id: '1204',  cap: 32, x:  8.26, y: 10.41, w:  7.71, h: 26.24, light: true,  ac: false },
      { id: '1203',  cap: 32, x: 15.97, y: 10.41, w:  7.71, h: 26.24, light: false, ac: true  },
      { id: '1202',  cap: 48, x: 23.68, y: 10.41, w: 12.18, h: 26.24, light: true,  ac: true  },
      { id: '1201',  cap: 40, x: 35.86, y: 10.41, w: 10.55, h: 26.24, light: true,  ac: true  },
      { id: 'STR-S', cap: 0,  x:  2.03, y: 47.06, w:  9.20, h: 27.15, light: false, ac: false, kind: 'svc' },
      { id: '1206',  cap: 48, x: 11.23, y: 47.06, w: 12.45, h: 27.15, light: true,  ac: true  },
      { id: '1207',  cap: 44, x: 23.68, y: 47.06, w: 11.64, h: 27.15, light: false, ac: true  },
      { id: '1208',  cap: 44, x: 35.32, y: 47.06, w: 11.77, h: 27.15, light: true,  ac: true  },
      { id: '1211',  cap: 20, x: 66.31, y: 10.41, w:  7.71, h: 26.24, light: false, ac: true  },
      { id: '1212',  cap: 20, x: 74.02, y: 10.41, w:  7.71, h: 26.24, light: true,  ac: false },
      { id: '1213',  cap: 20, x: 81.73, y: 10.41, w:  7.44, h: 26.24, light: true,  ac: true  },
      { id: '1214',  cap: 20, x: 89.17, y: 10.41, w:  6.50, h: 26.24, light: false, ac: true  },
      { id: 'WC-E',  cap: 0,  x: 64.00, y: 47.06, w: 34.10, h: 27.15, light: false, ac: false, kind: 'wc' },
    ],
  },
  14: {
    code: '14FL-ZA · 2,520 m²',
    image: '/assets/floor14-plan-dark.png',
    aspect: '1346 / 260',
    rooms: [
      // ปีกซ้าย — สตูดิโอใหญ่ + WC + บันได
      { id: '1401', cap: 80, x:  1.63, y:  8.08, w: 18, h: 82.31, light: true,  ac: true  },
      { id: 'WC-S',  cap: 0, kind: 'wc',  x: 24.51, y:  6, w: 10.40, h: 82.31, light: false, ac: false },
      { id: 'STR-S', cap: 0, kind: 'svc', x: 34.92, y:  8.08, w:  3.05, h: 82.31, light: false, ac: false },
      // ปีกขวา — สตูดิโอ 2 ห้อง + บันได
      { id: '1402', cap: 72, x: 45.69, y:  8.08, w: 20.06, h: 82.31, light: true,  ac: true  },
      { id: '1403', cap: 72, x: 65.75, y:  8.08, w: 26.30, h: 82.31, light: false, ac: true  },
      { id: 'STR-E', cap: 0, kind: 'svc', x: 92.05, y:  8.08, w:  5.28, h: 82.31, light: false, ac: false },
    ],
  },
  13: {
    code: '13FL-ZA · 3,480 m²',
    image: '/assets/floor13-plan-dark.png',
    aspect: '740 / 231',
    rooms: [
      { id: '1305',  cap: 24, x:  2.03, y:  9.96, w:  6.22, h: 25.11, light: true,  ac: true  },
      { id: '1304',  cap: 32, x:  8.24, y:  9.96, w:  7.71, h: 25.11, light: true,  ac: false },
      { id: '1303',  cap: 32, x: 15.95, y:  9.96, w:  7.71, h: 25.11, light: false, ac: true  },
      { id: '1302',  cap: 32, x: 23.65, y:  9.96, w:  7.71, h: 25.11, light: true,  ac: true  },
      { id: '1301',  cap: 48, x: 31.35, y:  9.96, w: 15.00, h: 25.11, light: false, ac: true  },
      { id: 'STR-S', cap: 0,  x:  2.03, y: 45.02, w:  9.19, h: 25.97, light: false, ac: false, kind: 'svc' },
      { id: '1306',  cap: 60, x: 11.22, y: 45.02, w: 12.43, h: 25.97, light: true,  ac: true  },
      { id: '1307',  cap: 54, x: 23.65, y: 45.02, w: 11.49, h: 25.97, light: false, ac: true  },
      { id: '1308',  cap: 54, x: 35.14, y: 45.02, w: 11.22, h: 25.97, light: true,  ac: true  },
      { id: 'MR1',   cap: 16, x: 66.22, y: 35.50, w:  8.11, h: 15.00, light: true,  ac: true,  kind: 'svc' },
      { id: 'MR2',   cap: 16, x: 74.59, y: 35.50, w:  7.84, h: 15.00, light: false, ac: true,  kind: 'svc' },
      { id: 'MR3',   cap: 16, x: 82.70, y: 35.50, w:  7.84, h: 15.00, light: true,  ac: false, kind: 'svc' },
      { id: 'MR4',   cap: 16, x: 66.22, y: 51.00, w:  8.11, h: 15.00, light: false, ac: true,  kind: 'svc' },
      { id: 'MR5',   cap: 16, x: 74.59, y: 51.00, w:  7.84, h: 15.00, light: true,  ac: true,  kind: 'svc' },
      { id: 'MR6',   cap: 16, x: 82.70, y: 51.00, w:  7.84, h: 15.00, light: false, ac: false, kind: 'svc' },
      { id: 'WC-E',  cap: 0,  x: 91.35, y: 35.50, w:  6.78, h: 30.50, light: false, ac: false, kind: 'wc' },
    ],
  },
}

// ─── helpers ──────────────────────────────────────────────
function statusOf(r) {
  if (r.light && r.ac) return 'on'
  if (!r.light && !r.ac) return 'off'
  return 'mix'
}

function gboxColor(st, selected) {
  if (selected) return '#E91E8C'
  if (st === 'on')  return '#22c55e'
  if (st === 'mix') return '#f59e0b'
  return '#6b7280'
}

function gboxBg(st, selected) {
  if (selected) return 'rgba(233,30,140,0.18)'
  if (st === 'on')  return 'rgba(34,197,94,0.14)'
  if (st === 'mix') return 'rgba(245,158,11,0.16)'
  return 'rgba(255,255,255,0.04)'
}

// ─── Toggle ───────────────────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      style={{
        position: 'relative', flexShrink: 0,
        width: 38, height: 22, borderRadius: 999,
        background: on ? '#E91E8C' : '#e5e7eb',
        border: `1px solid ${on ? 'transparent' : '#d1d5db'}`,
        cursor: 'pointer', transition: 'background .18s',
      }}
    >
      <span style={{
        position: 'absolute', top: 2,
        left: on ? 18 : 2,
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
        transition: 'left .18s',
      }} />
    </button>
  )
}

// ─── GroupBox (floor plan overlay — dark canvas) ──────────
function GroupBox({ room, selected, onClick }) {
  const st    = statusOf(room)
  const isWC  = room.kind === 'wc'
  const isSvc = room.kind === 'svc'
  const color = gboxColor(st, selected)
  const bg    = gboxBg(st, selected)
  const br    = 6

  const corner = {
    position: 'absolute', width: 14, height: 14,
    border: `2px solid ${color}`, pointerEvents: 'none',
  }

  const label      = isWC ? 'WC' : isSvc ? 'SVR' : `RM ${room.id}`
  const liveText   = st === 'on' ? 'เปิด' : st === 'mix' ? 'บางส่วน' : 'ปิด'
  const onCount    = (room.light ? 1 : 0) + (room.ac ? 1 : 0)
  const centerText = isWC ? 'ห้องน้ำ' : isSvc ? 'ซ่อมบำรุง' : `${onCount}/2 ใช้งาน · ${room.cap}`

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        left: `${room.x}%`, top: `${room.y}%`,
        width: `${room.w}%`, height: `${room.h}%`,
        borderRadius: br, cursor: 'pointer',
        background: bg, color,
        transition: 'background .18s, box-shadow .18s',
        boxShadow: selected ? '0 0 0 1px rgba(233,30,140,0.4), 0 0 28px -6px rgba(233,30,140,0.55)' : undefined,
      }}
    >
      <span style={{ ...corner, top: -2, left: -2, borderRight: 'none', borderBottom: 'none', borderTopLeftRadius: br }} />
      <span style={{ ...corner, top: -2, right: -2, borderLeft: 'none', borderBottom: 'none', borderTopRightRadius: br }} />
      <span style={{ ...corner, bottom: -2, left: -2, borderRight: 'none', borderTop: 'none', borderBottomLeftRadius: br }} />
      <span style={{ ...corner, bottom: -2, right: -2, borderLeft: 'none', borderTop: 'none', borderBottomRightRadius: br }} />

      <span style={{
        position: 'absolute', top: -9, left: 10,
        fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
        color, letterSpacing: 1,
        background: '#111', padding: '1px 6px', borderRadius: 3,
      }}>{label}</span>

      <span style={{
        position: 'absolute', top: -9, right: 10,
        display: 'flex', gap: 3,
        background: '#111', padding: '2px 5px', borderRadius: 3,
      }}>
        <img src={room.light ? lightbulbOn : lightbulbOff} style={{ width: 12, height: 12, opacity: room.light ? 1 : 0.35 }} />
        <img src={room.ac    ? snowflakeOn : snowflakeOff} style={{ width: 12, height: 12, opacity: room.ac    ? 1 : 0.35 }} />
      </span>

      <span style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%,-50%)',
        background: 'rgba(0,0,0,0.78)',
        border: `1px solid ${color}`,
        padding: '4px 8px', borderRadius: 6,
        fontSize: 10, fontWeight: 600, letterSpacing: 0.5,
        whiteSpace: 'nowrap', pointerEvents: 'none',
        color, opacity: selected ? 1 : 0,
        transition: 'opacity .15s',
      }}>{centerText}</span>

      <span style={{
        position: 'absolute', bottom: -9, left: 10,
        display: 'flex', alignItems: 'center', gap: 5,
        background: '#111', padding: '1px 6px', borderRadius: 3,
        fontSize: 9, fontFamily: 'monospace', letterSpacing: 1,
        color, opacity: st === 'off' ? 0.4 : 1,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
        {liveText}
      </span>
    </div>
  )
}

// ─── RoomCard (light theme) ────────────────────────────────
function RoomCard({ room, selected, onClick, onToggle }) {
  const st    = statusOf(room)
  const isWC  = room.kind === 'wc'
  const isSvc = room.kind === 'svc'
  const title = isWC ? 'ห้องน้ำ' : isSvc ? 'ห้องซ่อมบำรุง' : `ห้อง ${room.id}`

  const statusLabel = st === 'on' ? 'เปิดทั้งหมด' : st === 'mix' ? 'บางส่วน' : 'ปิด'
  const statusCls   = st === 'on'
    ? 'bg-green-50 text-green-600 border-green-200'
    : st === 'mix'
    ? 'bg-amber-50 text-amber-600 border-amber-200'
    : 'bg-gray-50 text-gray-400 border-gray-200'

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-4 cursor-pointer transition-all bg-white ${
        selected
          ? 'border-[#E91E8C] shadow-lg shadow-pink-100/60 ring-1 ring-[#E91E8C]/20'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-gray-800 text-sm truncate pr-2">{title}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${statusCls}`}>
          {statusLabel}
        </span>
      </div>

      {/* Light row */}
      <div className="flex items-center justify-between py-2.5 border-t border-gray-100">
        <div className={`flex items-center gap-2 text-sm ${room.light ? 'text-gray-800' : 'text-gray-400'}`}>
          <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${room.light ? 'bg-amber-50' : 'bg-gray-50'}`}>
            <img src={room.light ? lightbulbOn : lightbulbOff} className="w-3.5 h-3.5" style={{ opacity: room.light ? 1 : 0.4 }} />
          </span>
          ไฟ
        </div>
        <Toggle on={room.light} onChange={e => { e.stopPropagation(); onToggle('light') }} />
      </div>

      {/* AC row */}
      <div className="flex items-center justify-between py-2.5 border-t border-gray-100">
        <div className={`flex items-center gap-2 text-sm ${room.ac ? 'text-gray-800' : 'text-gray-400'}`}>
          <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${room.ac ? 'bg-blue-50' : 'bg-gray-50'}`}>
            <img src={room.ac ? snowflakeOn : snowflakeOff} className="w-3.5 h-3.5" style={{ opacity: room.ac ? 1 : 0.4 }} />
          </span>
          แอร์
        </div>
        <Toggle on={room.ac} onChange={e => { e.stopPropagation(); onToggle('ac') }} />
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────
export default function BuildingControl() {
  const [currentFloor, setCurrentFloor] = useState(13)
  const [floorRooms, setFloorRooms] = useState(() => {
    const state = {}
    Object.entries(FLOOR_DATA).forEach(([f, data]) => {
      state[+f] = data.rooms.map(r => ({ ...r }))
    })
    return state
  })
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [accountOpen, setAccountOpen] = useState(false)

  const floorData = FLOOR_DATA[currentFloor]
  const rooms     = floorRooms[currentFloor] || []

  const lightsOn  = rooms.filter(r => r.light).length
  const acOn      = rooms.filter(r => r.ac).length
  const devicesOn = rooms.filter(r => r.light || r.ac).length

  function toggleRoom(idx, field) {
    setFloorRooms(prev => ({
      ...prev,
      [currentFloor]: prev[currentFloor].map((r, i) =>
        i === idx ? { ...r, [field]: !r[field] } : r
      ),
    }))
  }

  function allLights() {
    const allOn = rooms.every(r => r.light)
    setFloorRooms(prev => ({
      ...prev,
      [currentFloor]: prev[currentFloor].map(r => ({ ...r, light: !allOn })),
    }))
  }

  function allAC() {
    const allOn = rooms.every(r => r.ac)
    setFloorRooms(prev => ({
      ...prev,
      [currentFloor]: prev[currentFloor].map(r => ({ ...r, ac: !allOn })),
    }))
  }

  function allOff() {
    setFloorRooms(prev => ({
      ...prev,
      [currentFloor]: prev[currentFloor].map(r => ({ ...r, light: false, ac: false })),
    }))
  }

  function selectFloor(n) {
    if (!FLOOR_DATA[n]) return
    setCurrentFloor(n)
    setSelectedIdx(null)
  }

  function selectRoom(idx) {
    setSelectedIdx(prev => prev === idx ? null : idx)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar onOpenAccount={() => setAccountOpen(true)} />

      <div className="flex flex-1 overflow-hidden">

        {/* ── Floor rail ── */}
        <aside className="w-16 bg-white border-r border-gray-100 flex flex-col items-center py-4 overflow-y-auto shrink-0">
          <span className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-3">ชั้น</span>
          <div className="flex flex-col gap-1 items-center">
            {FLOOR_LIST.map((n, idx) => {
              const hasDivider = idx > 0 && n - FLOOR_LIST[idx - 1] > 1
              const active  = n === currentFloor
              const hasData = !!FLOOR_DATA[n]
              return (
                <div key={n}>
                  {hasDivider && <div className="w-6 h-px bg-gray-200 my-1.5" />}
                  <button
                    onClick={() => selectFloor(n)}
                    className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                      active
                        ? 'text-white'
                        : hasData
                        ? 'text-gray-500 hover:bg-gray-100'
                        : 'text-gray-300 cursor-default'
                    }`}
                    style={active ? {
                      backgroundColor: '#E91E8C',
                      boxShadow: '0 4px 14px -2px rgba(233,30,140,0.45)',
                    } : {}}
                  >{n}</button>
                </div>
              )
            })}
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto px-7 py-6 min-w-0">

          {/* Header */}
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ชั้น {currentFloor}</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {rooms.length} ห้อง · อาคาร A · ซิงค์ล่าสุด 14:32
              </p>
            </div>

            {/* Stats chips */}
            <div className="flex gap-2.5">
              {[
                {
                  label:  'ไฟเปิดอยู่',
                  val:    `${lightsOn} / ${rooms.length}`,
                  icon:   <img src={lightbulbOn} className="w-4 h-4" />,
                  iconBg: 'bg-amber-50',
                },
                {
                  label:  'แอร์เปิดอยู่',
                  val:    `${acOn} / ${rooms.length}`,
                  icon:   <img src={snowflakeOn} className="w-4 h-4" />,
                  iconBg: 'bg-blue-50',
                },
                {
                  label:  'อุปกรณ์ที่ทำงาน',
                  val:    `${devicesOn} รายการ`,
                  icon:   '⚡',
                  iconBg: 'bg-pink-50',
                },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm min-w-[128px]">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${s.iconBg}`}>
                    {s.icon}
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide leading-none">{s.label}</div>
                    <div className="text-sm font-semibold text-gray-800 mt-1">{s.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floor plan — black canvas */}
          <section className="relative rounded-2xl overflow-hidden mb-5" style={{
            background: '#000',
            border: '1px solid rgba(233,30,140,0.25)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.8), 0 20px 40px -12px rgba(0,0,0,0.5)',
          }}>
            {/* Line grid */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }} />

            {/* Top meta bar */}
            <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
              {[`แผนผังชั้น ${currentFloor}`, floorData?.code || '—'].map((txt, i) => (
                <span key={i} style={{
                  fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase',
                  background: i === 0 ? 'rgba(233,30,140,0.12)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${i === 0 ? 'rgba(233,30,140,0.35)' : 'rgba(255,255,255,0.12)'}`,
                  color: i === 0 ? '#E91E8C' : '#94a3b8',
                  padding: '4px 10px', borderRadius: 999,
                }}>{txt}</span>
              ))}
            </div>

            {/* Tool icons */}
            <div className="absolute top-3 right-4 z-10 flex gap-1.5">
              {[
                { title: 'จุดพิเศษ',        active: true,  svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 6 8 12 8 12s8-6 8-12a8 8 0 0 0-8-8z"/></svg> },
                { title: 'แผนที่ความร้อน', active: false, svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15h18"/><path d="M9 3v18"/></svg> },
                { title: 'ซูม',             active: false, svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M16 16l5 5"/></svg> },
                { title: 'แก้ไขเลย์เอาต์', active: false, svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg> },
                { title: 'เต็มจอ',          active: false, svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9V4h5"/><path d="M20 9V4h-5"/><path d="M4 15v5h5"/><path d="M20 15v5h-5"/></svg> },
              ].map(tool => (
                <div key={tool.title} title={tool.title} style={{
                  width: 28, height: 28, borderRadius: 7,
                  display: 'grid', placeItems: 'center', cursor: 'pointer',
                  background: tool.active ? 'rgba(233,30,140,0.18)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${tool.active ? 'rgba(233,30,140,0.55)' : 'rgba(255,255,255,0.10)'}`,
                  color: tool.active ? '#E91E8C' : '#4b5563',
                }}>{tool.svg}</div>
              ))}
            </div>

            {/* Stage */}
            <div className="relative mx-4 mb-6" style={{
              aspectRatio: floorData?.aspect || '16 / 7',
              marginTop: 44,
              borderRadius: 10,
              overflow: 'hidden',
            }}>
              {floorData?.image && (
                <img
                  src={floorData.image}
                  alt={`แผนผังชั้น ${currentFloor}`}
                  className="absolute inset-0 w-full h-full object-contain"
                />
              )}
              {rooms.map((room, idx) => (
                <GroupBox
                  key={room.id}
                  room={room}
                  selected={selectedIdx === idx}
                  onClick={() => selectRoom(idx)}
                />
              ))}
            </div>

            {/* Compass */}
            <div className="absolute bottom-3 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center border" style={{
              background: 'rgba(20,20,20,0.9)',
              borderColor: 'rgba(233,30,140,0.3)',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24">
                <path d="M12 3 L14 12 L12 11 L10 12 Z" fill="#E91E8C" stroke="none"/>
                <path d="M12 21 L14 12 L12 13 L10 12 Z" fill="#333" stroke="none"/>
              </svg>
              <span className="absolute top-1 text-[9px] font-bold font-mono" style={{ color: '#E91E8C' }}>N</span>
            </div>
          </section>

          {/* Bulk controls */}
          <div className="flex gap-2 mb-4">
            {[
              { label: 'เปิดไฟทั้งหมด',  icon: <img src={lightbulbOn}  className="w-4 h-4" />, action: allLights },
              { label: 'เปิดแอร์ทั้งหมด', icon: <img src={snowflakeOn} className="w-4 h-4" />, action: allAC     },
            ].map(b => (
              <button
                key={b.label}
                onClick={b.action}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                {b.icon}
                {b.label}
              </button>
            ))}
            <button
              onClick={allOff}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm ml-auto"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="9"/><path d="M12 7v5"/>
              </svg>
              ปิดทั้งหมด
            </button>
          </div>

          {/* Room cards */}
          <div className="grid grid-cols-4 gap-3 pb-8">
            {rooms.map((room, idx) => (
              <RoomCard
                key={room.id}
                room={room}
                selected={selectedIdx === idx}
                onClick={() => selectRoom(idx)}
                onToggle={field => toggleRoom(idx, field)}
              />
            ))}
          </div>
        </main>
      </div>

      <AccountSettings isOpen={accountOpen} onClose={() => setAccountOpen(false)} />
    </div>
  )
}
