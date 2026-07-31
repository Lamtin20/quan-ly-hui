import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CircleDollarSign, TrendingUp, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const membersCount = await prisma.member.count()
  const groupsCount = await prisma.huiGroup.count()
  const activeSessionsCount = await prisma.huiSession.count({
    where: { status: "PENDING" }
  })

  // Format currency
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tổng quan</h1>
          <p className="text-muted-foreground mt-1">
            Theo dõi tình hình các dây hụi và thành viên của bạn.
          </p>
        </div>
        <div className="flex gap-2">
          <Button>Tạo Dây Hụi Mới</Button>
          <Button variant="secondary">Thêm Thành Viên</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Dây Hụi</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Đang hoạt động và đã hoàn thành
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thành Viên</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{membersCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tổng số người tham gia chơi
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kỳ Hụi Đang Mở</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSessionsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Các kỳ đang chờ khui hụi
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Doanh Thu Ước Tính</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatVND(0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tiền thảo (hoa hồng)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Dây Hụi Gần Đây</CardTitle>
            <CardDescription>
              Bạn chưa có dây hụi nào được tạo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CircleDollarSign className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold">Chưa có dữ liệu</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2">
                Bắt đầu bằng cách tạo một dây hụi mới để theo dõi kỳ khui hụi và quản lý thành viên tham gia.
              </p>
              <Button className="mt-6">Tạo Dây Hụi Ngay</Button>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Thành Viên Mới</CardTitle>
            <CardDescription>
              Các thành viên vừa được thêm vào hệ thống.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">Chưa có thành viên nào.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
