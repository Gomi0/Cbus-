import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Building2, Upload, LayoutDashboard, Globe, User, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const navItems = [
  { to: '/building',  label: 'ควบคุมอาคาร', icon: Building2,       end: false },
  { to: '/',          label: 'นำเข้า Excel', icon: Upload,          end: true  },
  { to: '/dashboard', label: 'แดชบอร์ด',    icon: LayoutDashboard, end: true  },
]

export default function Navbar({ onOpenAccount }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleSignOut = () => {
    logout()
    toast.success('ออกจากระบบสำเร็จ')
    navigate('/login')
  }

  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : 'U'

  return (
    <nav className="h-16 bg-white border-b border-gray-100 flex items-center px-6 relative z-40">
      {/* SPU Logo */}
      <div className="flex items-end gap-2 mr-10 select-none">
        <span className="text-3xl font-black text-gray-900 leading-none tracking-tight">SPU</span>
        <div className="mb-0.5">
          <div className="text-[7px] text-gray-500 leading-tight tracking-widest font-medium">SRIPATUM</div>
          <div className="text-[7px] text-gray-500 leading-tight tracking-widest font-medium">UNIVERSITY</div>
          <div className="h-[2px] mt-0.5 w-full rounded-full" style={{ backgroundColor: '#E91E8C' }} />
        </div>
      </div>

      {/* Nav links */}
      <div className="flex-1 flex items-center justify-center gap-8">
        {navItems.map((item, idx) => (
          <NavLink
            key={`${item.to}-${idx}`}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-1.5 text-sm font-medium pb-0.5 border-b-2 transition-colors ${
                isActive ? 'border-[#E91E8C] text-[#E91E8C]' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`
            }
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* Right: Language + Avatar */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-1.5 border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
          <Globe size={14} />
          ภาษาไทย
        </button>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 flex items-center justify-center bg-gray-100 text-sm font-semibold text-gray-600"
          >
            {user?.avatar
              ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
              : initials
            }
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 top-12 bg-white border border-gray-100 rounded-xl shadow-lg w-44 z-50 overflow-hidden">
                <button
                  onClick={() => { setDropdownOpen(false); onOpenAccount?.() }}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <User size={15} className="text-gray-400" />
                  บัญชีผู้ใช้
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); handleSignOut() }}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <LogOut size={15} className="text-gray-400" />
                  ออกจากระบบ
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
