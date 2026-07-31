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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tổng quan</h1>
          <p className="text-muted-foreground mt-1">
            Chào {user.fullName}, đây là tình hình các dây hụi của bạn.
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Link href="/groups"><Button>Tạo Dây Hụi Mới</Button></Link>
            <Link href="/members"><Button variant="secondary">Quản lý Thành Viên</Button></Link>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow border-indigo-100 bg-white/70 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dây Hụi Đã Tham Gia</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Đang hoạt động và đã hoàn thành
            </p>
          </CardContent>
        </Card>
        
        {isAdmin && (
          <Card className="hover:shadow-md transition-shadow border-indigo-100 bg-white/70 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng Thành Viên</CardTitle>
              <Users className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{membersCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Người chơi trên toàn hệ thống
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="hover:shadow-md transition-shadow border-indigo-100 bg-white/70 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kỳ Hụi Đang Mở</CardTitle>
            <Activity className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{activeSessionsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cần bạn tham gia bỏ thăm (kêu hụi)
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow border-indigo-100 bg-white/70 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiền Hụi Đã Đóng</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatVND(0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tổng số tiền bạn đã đóng
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 hover:shadow-md transition-shadow border-indigo-100 bg-white/70 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Dây Hụi Của Bạn</CardTitle>
            <CardDescription>
              Các dây hụi bạn đang tham gia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CircleDollarSign className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold">Đang cập nhật...</h3>
              <Link href="/groups" className="mt-4 text-indigo-600 font-medium hover:underline">
                Xem tất cả Dây Hụi →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
