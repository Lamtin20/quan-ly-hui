import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/server-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CircleDollarSign, TrendingUp, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function DashboardPage() {
  const user = await requireUser()
  const isAdmin = user.role === "ADMIN"

  const membersCount = await prisma.user.count()
  
  let groupsCount = 0
  let activeSessionsCount = 0

  if (isAdmin) {
    groupsCount = await prisma.huiGroup.count()
    activeSessionsCount = await prisma.huiSession.count({
      where: { status: "BIDDING" } // Thay vì PENDING
    })
  } else {
    groupsCount = await prisma.huiGroup.count({
      where: { huiMembers: { some: { userId: user.id } } }
    })
    activeSessionsCount = await prisma.huiSession.count({
      where: {
        status: "BIDDING",
        huiGroup: { huiMembers: { some: { userId: user.id } } }
      }
    })
  }

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 bg-clip-text text-transparent">Tổng quan</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Chào <span className="text-indigo-600 font-semibold">{user.fullName}</span>, đây là tình hình các dây hụi của bạn.
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-3">
            <Link href="/groups">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-[0_4px_16px_rgba(99,102,241,0.2)] border border-indigo-500/10 transition-all duration-200 active:scale-98">
                Tạo Dây Hụi Mới
              </Button>
            </Link>
            <Link href="/members">
              <Button variant="secondary" className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition-all duration-200 active:scale-98">
                Quản lý Thành Viên
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group/card border border-white/60 bg-white/70 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:-translate-y-1 rounded-2xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dây Hụi Đã Tham Gia</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover/card:bg-indigo-600 group-hover/card:text-white transition-all duration-300">
              <CircleDollarSign className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold tracking-tight text-slate-900">{groupsCount}</div>
            <p className="text-xs text-slate-400 mt-2 font-medium">
              Đang hoạt động và đã hoàn thành
            </p>
          </CardContent>
        </Card>
        
        {isAdmin && (
          <Card className="group/card border border-white/60 bg-white/70 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:-translate-y-1 rounded-2xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Thành Viên</CardTitle>
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover/card:bg-purple-600 group-hover/card:text-white transition-all duration-300">
                <Users className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-3xl font-bold tracking-tight text-slate-900">{membersCount}</div>
              <p className="text-xs text-slate-400 mt-2 font-medium">
                Người chơi trên toàn hệ thống
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="group/card border border-white/60 bg-white/70 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:-translate-y-1 rounded-2xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kỳ Hụi Đang Mở</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover/card:bg-rose-600 group-hover/card:text-white transition-all duration-300">
              <Activity className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold tracking-tight text-rose-600">{activeSessionsCount}</div>
            <p className="text-xs text-slate-400 mt-2 font-medium">
              Cần bạn tham gia bỏ thăm (kêu hụi)
            </p>
          </CardContent>
        </Card>
        
        <Card className="group/card border border-white/60 bg-white/70 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:-translate-y-1 rounded-2xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tiền Hụi Đã Đóng</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover/card:bg-emerald-600 group-hover/card:text-white transition-all duration-300">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold tracking-tight text-emerald-600">{formatVND(0)}</div>
            <p className="text-xs text-slate-400 mt-2 font-medium">
              Tổng số tiền bạn đã đóng
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-7 border border-white/60 bg-white/70 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-2xl">
          <CardHeader className="border-b border-slate-100/60 pb-5">
            <CardTitle className="text-lg font-bold text-slate-900">Dây Hụi Của Bạn</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Các dây hụi bạn đang tham gia.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-10 pb-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-4 shadow-[0_4px_12px_rgba(99,102,241,0.08)]">
                <CircleDollarSign className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Đang cập nhật...</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-[280px]">Hệ thống đang đồng bộ dữ liệu dây hụi của bạn.</p>
              <Link href="/groups" className="mt-5">
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-10 px-5 shadow-sm transition-all text-xs font-semibold">
                  Xem tất cả Dây Hụi →
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
