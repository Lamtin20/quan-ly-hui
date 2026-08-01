import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/server-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CircleDollarSign, TrendingUp, Activity, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default async function DashboardPage() {
  const user = await requireUser()
  const isAdmin = user.role === "ADMIN"

  // Fetch admin stats if applicable
  const membersCount = isAdmin ? await prisma.user.count() : 0
  const systemGroupsCount = isAdmin ? await prisma.huiGroup.count() : 0
  const systemActiveBiddingCount = isAdmin ? await prisma.huiSession.count({ where: { status: "BIDDING" } }) : 0

  // Fetch groups where user is a participant
  const userGroups = await prisma.huiGroup.findMany({
    where: {
      huiMembers: { some: { userId: user.id } }
    },
    include: {
      huiMembers: {
        include: { user: true }
      },
      sessions: {
        include: {
          payments: {
            include: { user: true }
          }
        },
        orderBy: { sessionNumber: "asc" }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  // Calculate user hụi statistics
  let totalPaid = 0
  let totalReceived = 0
  let totalExpectedProfit = 0
  let activeBiddingCount = 0

  const groupsDetails = userGroups.map(group => {
    let groupPaid = 0
    let groupReceived = 0
    let groupExpectedProfit = 0
    
    // Check if user won any session in this group
    const wonSession = group.sessions.find(s => s.status === "DONE" && s.winnerUserId === user.id)
    if (wonSession) {
      groupReceived = wonSession.winnerReceivedAmount || 0
    }

    group.sessions.forEach(s => {
      if (s.status === "DONE") {
        const payment = s.payments.find(p => p.userId === user.id)
        if (payment) {
          groupPaid += payment.amountToPay
        }
      } else if (s.status === "BIDDING" || s.status === "TIE_BREAKER") {
        // Count active sessions where this user participates
        activeBiddingCount++
      }
    })

    // Expected profit calculation
    const totalSlots = group.totalSlots
    const slotAmount = group.amount

    if (wonSession) {
      const completedSessionsCount = group.sessions.filter(s => s.status === "DONE").length
      const remainingSessionsCount = Math.max(0, totalSlots - completedSessionsCount)
      const futurePayments = slotAmount * remainingSessionsCount
      const totalCost = groupPaid + futurePayments
      groupExpectedProfit = groupReceived - totalCost
    } else {
      group.sessions.forEach(s => {
        if (s.status === "DONE") {
          groupExpectedProfit += s.bidAmount || 0
        }
      })
    }

    totalPaid += groupPaid
    totalReceived += groupReceived
    totalExpectedProfit += groupExpectedProfit

    const completedSessions = group.sessions.filter(s => s.status === "DONE").length
    const progressPercent = totalSlots > 0 ? Math.round((completedSessions / totalSlots) * 100) : 0

    return {
      id: group.id,
      name: group.name,
      amount: group.amount,
      status: group.status,
      totalSlots,
      completedSessions,
      progressPercent,
      groupPaid,
      groupReceived,
      groupExpectedProfit,
      isDead: !!wonSession,
      wonSessionNumber: wonSession?.sessionNumber || null
    }
  })

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const getFriendlyName = (name: string) => {
    const parts = name.trim().split(/\s+/)
    if (parts.length <= 1) return name
    return parts.slice(1).join(" ")
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-indigo-50 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800">Tổng Quan Tài Khoản</h1>
          <p className="text-slate-500 mt-1 text-sm font-semibold flex items-center gap-1">
            <span>Chào mừng quay trở lại,</span>
            <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/50">{getFriendlyName(user.fullName)}</span>
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          {isAdmin && (
            <>
              <Link href="/groups" prefetch={true} className="w-full sm:w-auto">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md border border-indigo-500/10 transition-all font-bold text-xs py-2 px-4 h-10 cursor-pointer">
                  Tạo Dây Hụi Mới
                </Button>
              </Link>
              <Link href="/members" prefetch={true} className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition-all font-semibold text-xs h-10 cursor-pointer">
                  Thành Viên
                </Button>
              </Link>
            </>
          )}
          {!isAdmin && (
            <Link href="/groups" prefetch={true} className="w-full sm:w-auto">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md border border-indigo-500/10 transition-all font-bold text-xs py-2 px-4 h-10 cursor-pointer">
                Xem Tất Cả Dây Hụi
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Admin Quick Metrics Panel */}
      {isAdmin && (
        <div className="bg-slate-550/5 border border-slate-200/50 rounded-3xl p-5 mb-1 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4.5 h-4.5 text-indigo-500" /> Hệ thống chủ hụi (Admin)
          </div>
          <div className="grid gap-4 grid-cols-3">
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tổng số dây hụi</span>
              <span className="text-xl md:text-2xl font-black text-slate-800 mt-1 block">{systemGroupsCount}</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Kỳ hụi đang mở</span>
              <span className="text-xl md:text-2xl font-black text-indigo-600 mt-1 block">{systemActiveBiddingCount}</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tổng thành viên</span>
              <span className="text-xl md:text-2xl font-black text-purple-600 mt-1 block">{membersCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Player Metrics Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Groups Joined */}
        <Card className="group/card border border-white/60 bg-white/70 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-lg rounded-3xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dây Hụi Tham Gia</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-650 group-hover/card:bg-indigo-600 group-hover/card:text-white transition-all duration-350">
              <CircleDollarSign className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800">{userGroups.length}</div>
            <p className="text-[10px] text-slate-450 mt-1.5 font-semibold">
              Các dây hụi bạn tham gia chơi
            </p>
          </CardContent>
        </Card>

        {/* Total Money Paid */}
        <Card className="group/card border border-white/60 bg-white/70 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-lg rounded-3xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tích Lũy Đã Đóng</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-650 group-hover/card:bg-amber-600 group-hover/card:text-white transition-all duration-350">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-600">{formatVND(totalPaid)}</div>
            <p className="text-[10px] text-slate-450 mt-1.5 font-semibold">
              Tổng số tiền hụi tích lũy đã đóng
            </p>
          </CardContent>
        </Card>

        {/* Total Money Received */}
        <Card className="group/card border border-white/60 bg-white/70 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-lg rounded-3xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng Thực Nhận Hốt</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-650 group-hover/card:bg-purple-600 group-hover/card:text-white transition-all duration-350">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-purple-650">{formatVND(totalReceived)}</div>
            <p className="text-[10px] text-slate-450 mt-1.5 font-semibold">
              Số tiền bạn đã hốt hụi thành công
            </p>
          </CardContent>
        </Card>

        {/* Net / Cumulative Profit */}
        <Card className="group/card border border-white/60 bg-white/70 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-lg rounded-3xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng Lời Tích Lũy</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-650 group-hover/card:bg-emerald-600 group-hover/card:text-white transition-all duration-350">
              <Activity className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-black ${totalExpectedProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {formatVND(totalExpectedProfit)}
            </div>
            <p className="text-[10px] text-slate-450 mt-1.5 font-semibold">
              Tiền lời dự kiến hoặc lời/lỗ thực tế
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detail list of participant's groups */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 px-1">
          <CircleDollarSign className="w-5 h-5 text-indigo-500" />
          Tiến Trình Dây Hụi Tham Gia ({groupsDetails.length})
        </h2>

        {groupsDetails.length === 0 ? (
          <div className="text-center py-14 bg-white/70 backdrop-blur-md rounded-3xl border border-indigo-50 border-dashed">
            <CircleDollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-500 text-sm">Bạn chưa tham gia dây hụi nào.</p>
            <p className="text-xs text-slate-400 mt-1 mb-5">Đăng ký tham gia các dây hụi đang mở để bắt đầu.</p>
            <Link href="/groups" prefetch={true}>
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs px-5 h-9 font-medium cursor-pointer">
                Khám phá Dây Hụi
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {groupsDetails.map((group) => (
              <Card 
                key={group.id} 
                className="border-indigo-50 hover:border-indigo-150 shadow-sm hover:shadow-md transition-all duration-300 rounded-3xl bg-white/95 backdrop-blur-sm overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5 space-y-4">
                  {/* Top section: Title and slot info */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base leading-snug hover:text-indigo-600 transition-colors">
                        <Link href={`/groups/${group.id}`} prefetch={true}>
                          {group.name}
                        </Link>
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mệnh giá:</span>
                        <span className="text-xs font-extrabold text-indigo-650">{formatVND(group.amount)}</span>
                      </div>
                    </div>

                    <div>
                      {group.isDead ? (
                        <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-50 border border-rose-150 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-none">
                          Hụi Chết (Kỳ {group.wonSessionNumber})
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-150 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-none">
                          Hụi Sống
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Progress timeline */}
                  {group.status !== "OPEN" && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span>Hoàn thành kỳ {group.completedSessions}/{group.totalSlots}</span>
                        <span>{group.progressPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-550 to-purple-605" 
                          style={{ width: `${group.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Ledger stats for this group */}
                  {group.status !== "OPEN" && (
                    <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-[10px] font-semibold text-slate-500">
                      <div>
                        <span className="text-slate-400 block text-[8px] font-bold uppercase tracking-wider">Đã đóng</span>
                        <span className="font-extrabold text-slate-700 text-[11px]">{formatVND(group.groupPaid)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[8px] font-bold uppercase tracking-wider">{group.isDead ? "Thực nhận hốt" : "Lợi dự kiến"}</span>
                        <span className={`font-extrabold text-[11px] ${group.isDead ? "text-indigo-650" : "text-emerald-650"}`}>
                          {formatVND(group.isDead ? group.groupReceived : group.groupExpectedProfit)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[8px] font-bold uppercase tracking-wider">Lời ròng</span>
                        <span className={`font-extrabold text-[11px] ${group.groupExpectedProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {formatVND(group.groupExpectedProfit)}
                        </span>
                      </div>
                    </div>
                  )}
                  {group.status === "OPEN" && (
                    <div className="bg-indigo-50/20 text-indigo-650 rounded-xl p-3 border border-indigo-50/60 text-xs font-semibold text-center">
                      Dây hụi đang mở đăng ký. Đang có {group.completedSessions} thành viên.
                    </div>
                  )}
                </div>

                <div className="bg-slate-50/60 px-5 py-2.5 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Trạng thái: {group.status}</span>
                  <Link href={`/groups/${group.id}`} prefetch={true} className="text-xs font-bold text-indigo-650 hover:text-indigo-850 flex items-center gap-1 active:scale-[0.98]">
                    Vào chi tiết <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
