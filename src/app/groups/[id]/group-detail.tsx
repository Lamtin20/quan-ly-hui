"use client"

import { useState, useEffect } from "react"
import { User, HuiGroup, HuiMember, HuiSession, Payment } from "@prisma/client"
import { startNewSession } from "../../actions/sessions"
import { startHuiGroup, joinHuiGroup } from "../../actions/groups"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { QrCode, PlayCircle, ArrowRight, Loader2, AlertCircle, UserPlus, CalendarDays, CheckCircle2, UserCheck, ShieldAlert, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { hasPassedJoinDeadline, getJoinDeadlineDate, formatDate } from "@/lib/utils"

type FullGroup = HuiGroup & {
  huiMembers: (HuiMember & { user: User })[]
  sessions: (HuiSession & {
    payments: (Payment & { user: User })[]
  })[]
}

const getBankBin = (bankName: string) => {
  const map: Record<string, string> = {
    "Vietcombank": "VCB", "Techcombank": "TCB", "MBBank": "MB", 
    "ACB": "ACB", "VietinBank": "CTG", "BIDV": "BIDV",
    "Agribank": "VBA", "VPBank": "VPB", "TPBank": "TPB",
    "Sacombank": "STB", "VIB": "VIB"
  }
  return map[bankName] || bankName
}

export function GroupDetail({ 
  initialGroup, 
  isAdmin, 
  currentUser 
}: { 
  initialGroup: FullGroup
  isAdmin: boolean
  currentUser: User
}) {
  const router = useRouter()
  const [isStarting, setIsStarting] = useState(false)
  const [isActivating, setIsActivating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)

  // Real-time polling for updates
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 4000)
    return () => clearInterval(interval)
  }, [router])
  
  const isMember = initialGroup.huiMembers.some(hm => hm.userId === currentUser.id)
  
  // Find which sessions are done to track dead members
  const deadMemberIds = initialGroup.sessions
    .filter(s => s.status === "DONE")
    .map(s => s.winnerUserId)
    .filter(Boolean) as string[]

  const handleJoin = async () => {
    try {
      setIsJoining(true)
      await joinHuiGroup(initialGroup.id)
      alert("Bạn đã tham gia dây hụi này thành công!")
      window.location.reload()
    } catch (error: any) {
      alert(error.message || "Đã xảy ra lỗi!")
    } finally {
      setIsJoining(false)
    }
  }

  const handleStartHui = async () => {
    if (initialGroup.huiMembers.length < 2) {
      alert("Cần có tối thiểu 2 thành viên tham gia mới có thể bắt đầu!")
      return
    }
    
    try {
      setIsStarting(true)
      await startHuiGroup(initialGroup.id)
      alert("Dây hụi đã bắt đầu hoạt động! Các kỳ hụi đã được tự động khởi tạo.")
      window.location.reload()
    } catch (error: any) {
      alert(error.message || "Đã xảy ra lỗi!")
    } finally {
      setIsStarting(false)
    }
  }

  const handleStartSession = async () => {
    try {
      setIsActivating(true)
      const sessionId = await startNewSession(initialGroup.id)
      router.push(`/groups/${initialGroup.id}/sessions/${sessionId}`)
    } catch (error: any) {
      alert(error.message || "Đã xảy ra lỗi!")
      setIsActivating(false)
    }
  }

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const getWinnerInfo = (userId: string | null) => {
    if (!userId) return null
    return initialGroup.huiMembers.find(hm => hm.userId === userId)?.user
  }

  const activeSession = initialGroup.sessions.find(s => s.status === "BIDDING" || s.status === "TIE_BREAKER")
  const nextPendingSession = initialGroup.sessions
    .filter(s => s.status === "PENDING")
    .sort((a, b) => a.sessionNumber - b.sessionNumber)[0]

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-10">
      
      {/* Banner: User is not a member of a public open group */}
      {!isMember && !isAdmin && initialGroup.status === "OPEN" && (
        hasPassedJoinDeadline(initialGroup.startDate) ? (
          <Card className="border-amber-200 bg-amber-50/70 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="flex flex-col md:flex-row items-center justify-between p-6">
              <div className="flex items-center text-amber-800 mb-4 md:mb-0">
                <ShieldAlert className="w-8 h-8 mr-3 text-amber-600" />
                <div>
                  <h3 className="font-bold text-base">Đã hết hạn đăng ký tham gia</h3>
                  <p className="text-xs text-amber-700/90 font-medium">Dây hụi này đã đóng đăng ký tự động vào ngày {formatDate(getJoinDeadlineDate(initialGroup.startDate))}.</p>
                </div>
              </div>
              <Button disabled className="bg-slate-100 text-slate-400 border border-slate-200 rounded-xl font-medium px-5 cursor-not-allowed">
                Hết hạn đăng ký
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-emerald-200 bg-emerald-50/70 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="flex flex-col md:flex-row items-center justify-between p-6">
              <div className="flex items-center text-emerald-800 mb-4 md:mb-0">
                <UserPlus className="w-8 h-8 mr-3 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-base">Bạn chưa tham gia dây hụi này</h3>
                  <p className="text-xs text-emerald-700/90 font-medium">
                    Đây là dây hụi công khai. Hạn chốt đăng ký: {formatDate(getJoinDeadlineDate(initialGroup.startDate))}.
                  </p>
                </div>
              </div>
              <Button onClick={handleJoin} disabled={isJoining} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium px-5">
                {isJoining ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Tham gia ngay
              </Button>
            </CardContent>
          </Card>
        )
      )}

      {/* Banner: Active Session for bidding */}
      {activeSession && (
        <Card className="border-rose-100 bg-rose-50/70 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="flex flex-col md:flex-row items-center justify-between p-6">
            <div className="flex items-center text-rose-800 mb-4 md:mb-0">
              <AlertCircle className="w-8 h-8 mr-3 text-rose-600 animate-pulse" />
              <div>
                <h3 className="font-bold text-base">Đang có kỳ hụi chờ đấu giá (Kỳ {activeSession.sessionNumber})</h3>
                <p className="text-xs text-rose-700/90 font-medium">Kỳ hụi đang diễn ra kêu hụi. Vui lòng bấm vào chi tiết để đấu giá!</p>
              </div>
            </div>
            <Link href={`/groups/${initialGroup.id}/sessions/${activeSession.id}`}>
              <Button className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium px-5">
                Vào Đấu Giá <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Admin Action: Start Group (OPEN -> RUNNING) */}
      {initialGroup.status === "OPEN" && isAdmin && (
        <Card className="border-indigo-100 bg-indigo-50/60 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="flex flex-col md:flex-row items-center justify-between p-6">
            <div className="flex items-center text-indigo-900 mb-4 md:mb-0">
              <PlayCircle className="w-8 h-8 mr-3 text-indigo-600" />
              <div>
                <h3 className="font-bold text-base">Dây hụi đang mở đăng ký ({initialGroup.huiMembers.length} thành viên)</h3>
                <p className="text-xs text-indigo-700/90 font-medium">Bấm "Bắt đầu dây hụi" để chốt danh sách thành viên và tự động sinh lịch các kỳ hốt.</p>
              </div>
            </div>
            <Button onClick={handleStartHui} disabled={isStarting} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium px-5">
              {isStarting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PlayCircle className="w-4 h-4 mr-2" />}
              Bắt đầu dây hụi
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Admin Action: Activate next pending session */}
      {!activeSession && initialGroup.status === "RUNNING" && nextPendingSession && isAdmin && (
        <div className="flex justify-end">
          <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md rounded-xl font-medium active:scale-[0.98] transition-transform" onClick={handleStartSession} disabled={isActivating}>
            {isActivating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CalendarDays className="mr-2 h-5 w-5" />}
            Mở Kỳ Khui Hụi {nextPendingSession.sessionNumber}
          </Button>
        </div>
      )}

      {/* Group General Information Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-slate-200/60 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.015)] rounded-2xl">
          <CardContent className="p-4 flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mệnh giá hụi</span>
            <span className="text-base font-black text-indigo-600 mt-1">{formatVND(initialGroup.amount)}</span>
          </CardContent>
        </Card>
        <Card className="border border-slate-200/60 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.015)] rounded-2xl">
          <CardContent className="p-4 flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Chu kỳ khui</span>
            <span className="text-xs font-bold text-slate-700 mt-2">
              {initialGroup.cycle === 'MONTHLY' ? 'Hằng tháng' : 
               initialGroup.cycle === 'WEEKLY' ? 'Hằng tuần' : 
               initialGroup.cycle === 'DAILY' ? 'Hằng ngày' : `Ngày ${initialGroup.biddingDays} hằng tháng`}
            </span>
          </CardContent>
        </Card>
        <Card className="border border-slate-200/60 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.015)] rounded-2xl">
          <CardContent className="p-4 flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kỳ khui đầu tiên</span>
            <span className="text-xs font-bold text-slate-700 mt-2">{formatDate(initialGroup.startDate)}</span>
          </CardContent>
        </Card>
        <Card className="border border-slate-200/60 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.015)] rounded-2xl">
          <CardContent className="p-4 flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hạn chốt tham gia</span>
            <span className={`text-xs font-bold mt-2 ${hasPassedJoinDeadline(initialGroup.startDate) ? 'text-amber-600' : 'text-emerald-600'}`}>
              {formatDate(getJoinDeadlineDate(initialGroup.startDate))}
              {hasPassedJoinDeadline(initialGroup.startDate) && <span className="block text-[9px] font-semibold text-amber-500 mt-0.5">(Đã khóa)</span>}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Layout Grid: Members list & Sessions status */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Members Status Panel */}
        <div className="md:col-span-1 space-y-4">
          <Card className="border border-slate-200/60 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.03)] rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4 px-5">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Thành Viên Dây Hụi ({initialGroup.huiMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 max-h-[450px] overflow-y-auto">
              {initialGroup.huiMembers.map((member) => {
                // Find if this member won a completed session
                const wonSession = initialGroup.sessions.find(s => s.status === "DONE" && s.winnerUserId === member.userId)
                
                return (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-slate-800">{member.user.fullName}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{member.user.phone}</span>
                    </div>
                    <div>
                      {wonSession ? (
                        <div className="flex flex-col items-end">
                          <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-50 border border-rose-200 text-[10px] rounded-lg shadow-none font-bold">
                            Hụi Chết
                          </Badge>
                          <span className="text-[9px] text-slate-400 mt-1 font-semibold">Kỳ {wonSession.sessionNumber}</span>
                        </div>
                      ) : (
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 text-[10px] rounded-lg shadow-none font-bold">
                          Hụi Sống
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Sessions Panel */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 px-1">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
            Danh Sách Kỳ Khui Hụi
          </h2>

          {initialGroup.sessions.length === 0 ? (
            <Card className="border border-slate-200/60 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.03)] rounded-2xl">
              <CardContent className="p-12 text-center text-slate-400 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                  <PlayCircle className="w-8 h-8 text-slate-300" />
                </div>
                <p className="font-semibold text-sm">Chưa có lịch kỳ hụi nào được sinh.</p>
                <p className="text-xs text-slate-400 mt-1">Admin cần bấm "Bắt đầu dây hụi" để khởi tạo.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {initialGroup.sessions.map((session) => {
                const winner = getWinnerInfo(session.winnerUserId)
                return (
                  <Card key={session.id} className="overflow-hidden border border-slate-200/60 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] rounded-2xl hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all duration-200">
                    <div className="bg-slate-50/50 px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-indigo-600 text-white rounded-lg shadow-sm font-semibold">Kỳ {session.sessionNumber}</Badge>
                          
                          {session.status === "DONE" && (
                            <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-semibold rounded-lg">
                              Đã Hoàn Thành
                            </Badge>
                          )}
                          {session.status === "BIDDING" && (
                            <Badge variant="outline" className="bg-rose-50 border-rose-200 text-rose-700 font-semibold rounded-lg animate-pulse">
                              Đang Khui Hụi
                            </Badge>
                          )}
                          {session.status === "PENDING" && (
                            <Badge variant="outline" className="bg-indigo-50/50 border-indigo-100 text-indigo-700 font-semibold rounded-lg">
                              Sắp Diễn Ra
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Ngày khui dự kiến: <span className="font-bold text-slate-600">{formatDate(session.openDate)}</span>
                        </p>
                      </div>

                      {session.status === "DONE" && winner && (
                        <div className="text-right text-xs">
                          <p className="text-slate-500 font-medium">Người hốt: <strong className="text-indigo-700">{winner.fullName}</strong></p>
                        </div>
                      )}

                      {session.status !== "DONE" && (
                        <Link href={`/groups/${initialGroup.id}/sessions/${session.id}`}>
                          <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs">
                            Chi Tiết <ArrowRight className="w-3.5 h-3.5 ml-1.5"/>
                          </Button>
                        </Link>
                      )}
                    </div>

                    {session.status === "DONE" && (
                      <CardContent className="p-0 overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-slate-50/20">
                            <TableRow>
                              <TableHead className="pl-5 text-xs text-slate-500 font-semibold">Thành Viên</TableHead>
                              <TableHead className="text-xs text-slate-500 font-semibold">Loại</TableHead>
                              <TableHead className="text-xs text-slate-500 font-semibold">Tiền Đóng</TableHead>
                              <TableHead className="text-right pr-5 text-xs text-slate-500 font-semibold">Thanh Toán</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {session.payments.map(payment => (
                              <TableRow key={payment.id} className="hover:bg-slate-50/20">
                                <TableCell className="pl-5 font-bold text-slate-700 text-xs">{payment.user.fullName}</TableCell>
                                <TableCell>
                                  {payment.isDead ? (
                                    <Badge variant="destructive" className="bg-rose-50 text-rose-700 hover:bg-rose-50 border border-rose-100 text-[9px] rounded-lg font-bold shadow-none">Hụi Chết</Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-100 text-[9px] rounded-lg font-bold shadow-none">Hụi Sống</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="font-bold text-slate-800 text-xs">{formatVND(payment.amountToPay)}</TableCell>
                                <TableCell className="text-right pr-5">
                                  {winner?.bankName && winner?.bankAccountNumber ? (
                                    <Dialog>
                                      <DialogTrigger
                                        render={
                                          <Button variant="outline" size="sm" className="h-7 text-[10px] font-medium border-slate-200 text-slate-600 rounded-lg shadow-none" type="button">
                                            <QrCode className="w-3 h-3 mr-1 text-indigo-600"/> Quét QR
                                          </Button>
                                        }
                                      />
                                      <DialogContent className="sm:max-w-md flex flex-col items-center p-6 rounded-2xl">
                                        <DialogHeader>
                                          <DialogTitle className="text-center font-bold text-slate-900 mb-2">Chuyển Tiền Hụi Kỳ {session.sessionNumber}</DialogTitle>
                                        </DialogHeader>
                                        <div className="bg-white p-3 rounded-2xl shadow-md border mb-4">
                                          <img 
                                            src={`https://img.vietqr.io/image/${getBankBin(winner.bankName)}-${winner.bankAccountNumber}-compact2.png?amount=${payment.amountToPay}&addInfo=Hui Ky ${session.sessionNumber}`}
                                            alt="VietQR"
                                            className="w-56 h-56 object-contain"
                                          />
                                        </div>
                                        <div className="text-center text-xs space-y-2 w-full bg-slate-50 p-4 rounded-xl border border-slate-100">
                                          <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-medium">Người nhận:</span> <strong className="text-indigo-700 font-bold">{winner.fullName}</strong></div>
                                          <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-medium">Ngân hàng:</span> <strong className="text-slate-700">{winner.bankName}</strong></div>
                                          <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-medium">Số TK:</span> <strong className="text-slate-700">{winner.bankAccountNumber}</strong></div>
                                          <div className="flex justify-between pt-1"><span className="text-slate-400 font-medium">Số tiền:</span> <strong className="text-rose-600 text-base font-bold">{formatVND(payment.amountToPay)}</strong></div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-medium italic">Không có TKNH</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
