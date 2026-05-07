
import { NavLink } from 'react-router-dom'
import { Building2, Upload, LayoutDashboard, Globe } from 'lucide-react'

const navItems = [
  { to: '/building',  label: 'ควบคุมอาคาร', icon: Building2,       end: false },
  { to: '/',          label: 'นำเข้า Excel', icon: Upload,          end: true  },
  { to: '/dashboard', label: 'แดชบอร์ด',    icon: LayoutDashboard, end: true  },
]

export default function Navbar() {
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

      {/* Right: Language */}
      <div className="flex items-center">
        <button className="flex items-center gap-1.5 border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
          <Globe size={14} />
          ภาษาไทย
        </button>
      </div>
    </nav>
  )
}

