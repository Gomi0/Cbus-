import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

const USERS_KEY = 'spu_users'
const SESSION_KEY = 'spu_user'

const defaultAdmin = { id: 1, firstName: 'Anna', lastName: 'Taylor', email: 'admin@spu.ac.th', phone: '0876548972', avatar: null, role: 'admin' }

function getUsers() {
  try {
    const stored = localStorage.getItem(USERS_KEY)
    if (!stored) return [defaultAdmin]
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed) || parsed.length === 0) return [defaultAdmin]
    const adminIdx = parsed.findIndex(u => u.email === 'admin@spu.ac.th')
    if (adminIdx === -1) return [defaultAdmin, ...parsed]
    parsed[adminIdx] = { ...parsed[adminIdx], role: 'admin' }
    return parsed
  } catch {
    return [defaultAdmin]
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem(SESSION_KEY)
      if (s) return JSON.parse(s)
    } catch { /* ignore */ }
    localStorage.setItem(SESSION_KEY, JSON.stringify(defaultAdmin))
    return defaultAdmin
  })

  const logout = useCallback(() => {
    setUser(defaultAdmin)
    localStorage.setItem(SESSION_KEY, JSON.stringify(defaultAdmin))
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
    <AuthContext.Provider value={{ user, logout, updateProfile }}>
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
