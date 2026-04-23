export const INITIAL_RESERVATIONS = [
  { id: 1, user: 'Dr. Somchai',   date: '2026-02-01', time: '09:00-11:00', room: '11 - 1102', status: 'Booked' },
  { id: 2, user: 'Ms. Ananya',    date: '2026-02-01', time: '13:00-15:00', room: '11 - 0102', status: 'Pending' },
  { id: 3, user: 'Prof. Kittipong', date: '2026-02-01', time: '09:00-11:00', room: '11 - 1005', status: 'Booked' },
  { id: 4, user: 'Mr. Nattapong', date: '2026-02-01', time: '13:00-15:00', room: '11 - 0209', status: 'Booked' },
  { id: 5, user: 'Dr. Ploy',      date: '2026-02-01', time: '13:00-15:00', room: '11 - 0303', status: 'Booked' },
  { id: 6, user: 'Ms. Supansa',   date: '2026-02-01', time: '13:00-15:00', room: '11 - 1201', status: 'Pending' },
  { id: 7, user: 'Dr. Thanawat',  date: '2026-02-01', time: '13:00-15:00', room: '11 - 1308', status: 'Pending' },
  { id: 8, user: 'Dr. Somchai',   date: '2026-02-02', time: '09:00-11:00', room: '11 - 1102', status: 'Booked' },
  { id: 9, user: 'Dr. Somchai',   date: '2026-02-02', time: '17:00-19:00', room: '11 - 1005', status: 'Booked' },
]

export const CLASSROOMS = [
  '11 - 0102', '11 - 0209', '11 - 0303',
  '11 - 1005', '11 - 1102', '11 - 1201', '11 - 1308',
  '12 - 0101', '12 - 0202', '12 - 0303',
]

export const TIME_SLOTS = [
  '08:00-10:00', '09:00-11:00', '10:00-12:00',
  '13:00-15:00', '14:00-16:00', '15:00-17:00', '17:00-19:00',
]

export const FLOORS = Array.from({ length: 14 }, (_, i) => ({
  floor: i + 1,
  rooms: [
    { id: `${i + 1}01`, name: `${String(i + 1).padStart(2, '0')}01`, capacity: 30, ac: true,  light: true  },
    { id: `${i + 1}02`, name: `${String(i + 1).padStart(2, '0')}02`, capacity: 40, ac: false, light: true  },
    { id: `${i + 1}03`, name: `${String(i + 1).padStart(2, '0')}03`, capacity: 50, ac: true,  light: false },
    { id: `${i + 1}04`, name: `${String(i + 1).padStart(2, '0')}04`, capacity: 30, ac: false, light: false },
  ],
}))
