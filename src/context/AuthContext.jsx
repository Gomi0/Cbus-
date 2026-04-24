import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

const USERS_KEY = 'spu_users'
const SESSION_KEY = 'spu_user'

const defaultUsers = [
  { id: 1, firstName: 'Anna', lastName: 'Taylor', email: 'admin@spu.ac.th', phone: '0876548972', password: '', avatar: null, role: 'admin' },
]

function getUsers() {
  try {
    const stored = localStorage.getItem(USERS_KEY)
    if (!stored) return defaultUsers
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultUsers
    // Always ensure default admin exists with admin role
    const adminIdx = parsed.findIndex(u => u.email === 'admin@spu.ac.th')
    if (adminIdx === -1) return [...defaultUsers, ...parsed]
    parsed[adminIdx] = { ...parsed[adminIdx], role: 'admin' }
    return parsed
  } catch {
    return defaultUsers
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem(SESSION_KEY)
      return s ? JSON.parse(s) : null
    } catch {
      return null
    }
  })

  const login = useCallback(async (email, password) => {
    await new Promise(r => setTimeout(r, 700))
    const users = getUsers()
    const found = users.find(u => u.email === email && u.password === password)
    if (!found) return { success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }
    const { password: _, ...userData } = found
    setUser(userData)
    localStorage.setItem(SESSION_KEY, JSON.stringify(userData))
    return { success: true }
  }, [])

  const register = useCallback(async ({ firstName, lastName, email, password }) => {
    await new Promise(r => setTimeout(r, 700))
    const users = getUsers()
    if (users.find(u => u.email === email)) return { success: false, error: 'อีเมลนี้ถูกใช้งานแล้ว' }
    const newUser = { id: Date.now(), firstName, lastName, email, phone: '', password, avatar: null, role: 'user' }
    const updated = [...users, newUser]
    saveUsers(updated)
    const { password: _, ...userData } = newUser
    setUser(userData)
    localStorage.setItem(SESSION_KEY, JSON.stringify(userData))
    return { success: true }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(SESSION_KEY)
  }, [])

  const forgotPassword = useCallback(async (email) => {
    await new Promise(r => setTimeout(r, 700))
    const users = getUsers()
    if (!users.find(u => u.email === email)) return { success: false, error: 'ไม่พบอีเมลนี้ในระบบ' }
    return { success: true }
  }, [])

  const updateProfile = useCallback((updates) => {
    const users = getUsers()
    const idx = users.findIndex(u => u.id === user.id)
    if (idx === -1) return
    users[idx] = { ...users[idx], ...updates }
    saveUsers(users)
    const { password: _, ...userData } = users[idx]
    setUser(userData)
    localStorage.setItem(SESSION_KEY, JSON.stringify(userData))
  }, [user])

  return (
    <AuthContext.Provider value={{ user, login, register, logout, forgotPassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
