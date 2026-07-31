"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Users, FolderOpen, HelpCircle, Eye } from "lucide-react"

const navItems = [
  { title: "Tổng quan", url: "/", icon: LayoutDashboard },
  { title: "Dây Hụi", url: "/groups", icon: FolderOpen },
  { title: "Xem Hụi", url: "/groups/active", icon: Eye },
  { title: "Thành viên", url: "/members", icon: Users },
  { title: "Hướng dẫn", url: "/guide", icon: HelpCircle },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 bg-slate-900/90 backdrop-blur-xl border border-white/[0.08] shadow-[0_16px_36px_rgba(0,0,0,0.3)] rounded-2xl overflow-visible">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isSpecial = item.title === "Xem Hụi"
          const isActive = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url)
          const Icon = item.icon
          
          return (
            <Link
              key={item.title}
              href={item.url}
              className="relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-transform duration-200 active:scale-95"
            >
              {isActive && !isSpecial && (
                <span className="absolute top-0 w-8 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-b-full shadow-[0_2px_10px_rgba(99,102,241,0.5)]" />
              )}
              {isSpecial ? (
                <div className={`p-2.5 rounded-full bg-gradient-to-tr shadow-lg transition-all duration-300 -mt-6 border ${
                  isActive 
                    ? 'from-indigo-600 to-purple-600 border-indigo-400 text-white scale-110 shadow-[0_8px_20px_rgba(99,102,241,0.4)]' 
                    : 'from-slate-800 to-slate-900 border-slate-700/60 text-indigo-400 hover:scale-105'
                }`}>
                  <Icon className="w-5.5 h-5.5" strokeWidth={2.5} />
                </div>
              ) : (
                <Icon 
                  className={`w-5.5 h-5.5 transition-all duration-300 ${
                    isActive ? "text-indigo-400 scale-110 mb-0.5" : "text-slate-400"
                  }`} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
              )}
              <span 
                className={`text-[9px] font-semibold tracking-wide transition-all duration-300 ${
                  isActive ? "text-indigo-400" : "text-slate-500"
                } ${isSpecial ? "pt-1 text-indigo-300" : ""}`}
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
