"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Users, FolderOpen } from "lucide-react"

const navItems = [
  { title: "Tổng quan", url: "/", icon: LayoutDashboard },
  { title: "Dây Hụi", url: "/groups", icon: FolderOpen },
  { title: "Thành viên", url: "/members", icon: Users },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-indigo-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url)
          const Icon = item.icon
          
          return (
            <Link
              key={item.title}
              href={item.url}
              className="relative flex flex-col items-center justify-center w-full h-full space-y-1"
            >
              {isActive && (
                <span className="absolute top-0 w-12 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-b-full" />
              )}
              <Icon 
                className={`w-6 h-6 transition-all duration-300 ${
                  isActive ? "text-indigo-600 scale-110 mb-1" : "text-slate-400"
                }`} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span 
                className={`text-[10px] font-medium transition-all duration-300 ${
                  isActive ? "text-indigo-600" : "text-slate-500"
                }`}
              >
                {item.title}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
