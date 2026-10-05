"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { User, HuiGroup, HuiMember, HuiSession, Payment, Bid } from "@prisma/client"
import { startNewSession } from "../../actions/sessions"
import { startHuiGroup, joinHuiGroup } from "../../actions/groups"
import { adminQuickBid } from "../../actions/bids"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { QrCode, PlayCircle, ArrowRight, Loader2, AlertCircle, UserPlus, CalendarDays, CheckCircle2, UserCheck, ShieldAlert, Users, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { hasPassedJoinDeadline, getJoinDeadlineDate, formatDate, getWinnerMemberId } from "@/lib/utils"

type FullGroup = HuiGroup & {
  huiMembers: (HuiMember & { user: User })[]
  sessions: (HuiSession & {
    payments: (Payment & { user: User })[]
    bids: Bid[]
  })[]
  transferHistories: (any)[]
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
  const searchParams = useSearchParams()
  const [isStarting, setIsStarting] = useState(false)
  const [isActivating, setIsActivating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)

  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({})
  const toggleSession = (id: string) => {
    setExpandedSessions(prev => ({ ...prev, [id]: !prev[id] }))
  }
  const [sessionFilter, setSessionFilter] = useState<"ALL" | "DONE" | "CURRENT" | "PENDING">("CURRENT")
  const [transferPhone, setTransferPhone] = useState("")
  const [isTransferring, setIsTransferring] = useState(false)
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)

  // Real-time polling for updates
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 10000)
    return () => clearInterval(interval)
  }, [router])
  
  const isMember = initialGroup.huiMembers.some(hm => hm.userId === currentUser.id)
  
  // Find which sessions are done to track dead members
  const deadMemberIds = useMemo(() => {
    return initialGroup.sessions
      .filter(s => s.status === "DONE")
      .map(s => getWinnerMemberId(s, initialGroup))
      .filter(Boolean) as string[]
  }, [initialGroup])

  const handleTransferOpenChange = (open: boolean) => {
    setIsTransferDialogOpen(open)
    if (!open && searchParams.get("action") === "transfer") {
      router.replace(`/groups/${initialGroup.id}`, { scroll: false })
    }
  }

  // Auto open transfer dialog once if url has ?action=transfer
  const autoOpenedRef = useRef(false)
  useEffect(() => {
    if (!autoOpenedRef.current && searchParams.get("action") === "transfer" && (isMember || isAdmin) && initialGroup.status !== "FINISHED") {
      autoOpenedRef.current = true
      const myLivingStakes = initialGroup.huiMembers.filter(hm => hm.userId === currentUser.id && !deadMemberIds.includes(hm.id))
      if (myLivingStakes.length > 0) {
        setSelectedMemberIds(myLivingStakes.map(s => s.id))
        setIsTransferDialogOpen(true)
      } else if (isAdmin) {
        setIsTransferDialogOpen(true)
      }
    }
  }, [searchParams, isMember, isAdmin, initialGroup, currentUser.id, deadMemberIds])


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

  const handleTransfer = async () => {
    if (!transferPhone.trim() || selectedMemberIds.length === 0) {
      alert("Vui lòng nhập số điện thoại và chọn ít nhất 1 chân hụi")
      return
    }
    setIsTransferring(true)
    try {
      const { transferHuiMember } = await import("../../actions/groups")
      await transferHuiMember(selectedMemberIds, transferPhone)
      alert("Chuyển nhượng chân hụi thành công!")
      setTransferPhone("")
      setSelectedMemberIds([])
      handleTransferOpenChange(false)
      router.refresh()
    } catch (error: any) {
      alert(error.message || "Có lỗi xảy ra")
    } finally {
      setIsTransferring(false)
    }
  }

  const handleAdminQuickBid = async (sessionId: string) => {
    if (!isAdmin) return;
    
    // Tìm chân hụi đang sống của Admin
    const session = initialGroup.sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    const previousSessions = initialGroup.sessions.filter(s => s.status === "DONE" && s.sessionNumber < session.sessionNumber);
    const deadMemberIds = previousSessions.map(s => s.winnerMemberId).filter(Boolean) as string[];
    const adminLivingStakes = initialGroup.huiMembers.filter(hm => hm.userId === currentUser.id && !deadMemberIds.includes(hm.id));
    
    if (adminLivingStakes.length === 0) {
      alert("Admin không có chân hụi nào còn sống trong kỳ này!");
      return;
    }
    
    const memberId = adminLivingStakes[0].id; // Lấy chân đầu tiên
    
    if (confirm("Chốt nhanh với giá Cao Nhất + 500đ ngay bây giờ?")) {
      setIsActivating(true)
      try {
        await adminQuickBid(sessionId, memberId)
        router.refresh()
      } catch (error: any) {
        alert(error.message || "Có lỗi xảy ra")
      } finally {
        setIsActivating(false)
      }
    }
  }

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const getMemberMetrics = (memberOrUserId: any) => {
    let totalPaid = 0
    let totalReceived = 0
    
    const userId = typeof memberOrUserId === "string" ? memberOrUserId : memberOrUserId.userId
    const memberId = typeof memberOrUserId === "object" ? memberOrUserId.id : null

    initialGroup.sessions.forEach(s => {
      if (s.status === "DONE") {
        const winnerMemId = getWinnerMemberId(s, initialGroup)
        const isWinnerOfThisSession = memberId ? winnerMemId === memberId : s.winnerUserId === userId

        if (isWinnerOfThisSession) {
          totalReceived += s.winnerReceivedAmount || 0
        } else {
          const userPayments = s.payments?.filter((p: any) => 
            memberId ? p.huiMemberId === memberId : p.userId === userId
          ) || []

          if (userPayments.length > 0) {
            userPayments.forEach((p: any) => {
              totalPaid += p.amountToPay
            })
          } else {
            const wonEarlierSession = initialGroup.sessions.some(prevS => {
              if (prevS.status !== "DONE" || prevS.sessionNumber >= s.sessionNumber) return false
              const prevWinnerMemId = getWinnerMemberId(prevS, initialGroup)
              return memberId ? prevWinnerMemId === memberId : prevS.winnerUserId === userId
            })
            const isDead = wonEarlierSession
            const amountToPay = isDead ? initialGroup.amount : Math.max(0, initialGroup.amount - (s.bidAmount || 0))
            totalPaid += amountToPay
          }
        }
      }
    })

    const wonSession = initialGroup.sessions.find(s => {
      if (s.status !== "DONE") return false
      const winnerMemId = getWinnerMemberId(s, initialGroup)
      return memberId ? winnerMemId === memberId : s.winnerUserId === userId
    })

    const netBalance = totalReceived - totalPaid

    let expectedProfit = 0
    const totalSlots = initialGroup.totalSlots
    const slotAmount = initialGroup.amount

    if (wonSession) {
      const completedSessionsCount = initialGroup.sessions.filter(s => s.status === "DONE").length
      const remainingSessionsCount = Math.max(0, totalSlots - completedSessionsCount)
      const futurePayments = slotAmount * remainingSessionsCount
      const totalCost = totalPaid + futurePayments
      expectedProfit = totalReceived - totalCost
    } else {
      initialGroup.sessions.forEach(s => {
        if (s.status === "DONE") {
          expectedProfit += s.bidAmount || 0
        }
      })
    }

    return { totalPaid, totalReceived, netBalance, expectedProfit, wonSession }
  }

  const getWinnerInfo = (userId: string | null) => {
    if (!userId) return null
    return initialGroup.huiMembers.find(hm => hm.userId === userId)?.user
  }

  const activeSession = initialGroup.sessions.find(s => s.status === "BIDDING" || s.status === "TIE_BREAKER")
  const nextPendingSession = initialGroup.sessions
    .filter(s => s.status === "PENDING")
    .sort((a, b) => a.sessionNumber - b.sessionNumber)[0]

  const filteredSessions = initialGroup.sessions.filter(s => {
    if (sessionFilter === "ALL") return true;
    if (sessionFilter === "DONE") return s.status === "DONE";
    if (sessionFilter === "PENDING") return s.status === "PENDING";
    if (sessionFilter === "CURRENT") return s.status === "BIDDING" || s.status === "TIE_BREAKER";
    return true;
  })

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

      {/* Header Bán Hụi & Admin Action */}
      {(isMember || isAdmin) && initialGroup.status !== "FINISHED" && (
        <Card className="border-indigo-100 bg-white/70 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="flex flex-col md:flex-row items-center justify-between p-4">
            <div className="flex items-center text-indigo-800 mb-4 md:mb-0">
              <UserCheck className="w-6 h-6 mr-3 text-indigo-600" />
              <div>
                <h3 className="font-bold text-sm">Tuỳ chọn Chân hụi</h3>
                <p className="text-xs text-indigo-700/90 font-medium">Bạn có thể bán hoặc chuyển nhượng toàn bộ các chân hụi bạn đang có.</p>
              </div>
            </div>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium px-5"
              onClick={() => {
                // Lấy tất cả chân hụi đang sống của User
                const myLivingStakes = initialGroup.huiMembers.filter(hm => hm.userId === currentUser.id && !deadMemberIds.includes(hm.id))
                setSelectedMemberIds(myLivingStakes.map(s => s.id))
                setIsTransferDialogOpen(true)
              }}
            >
              Bán / Chuyển nhượng
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Transfer Dialog Global */}
      <Dialog open={isTransferDialogOpen} onOpenChange={handleTransferOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chuyển nhượng Chân Hụi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-500">
              Chọn các chân hụi bạn muốn bán. Người mua sẽ kế thừa toàn bộ lịch sử đóng/nhận hụi của những chân này.
            </p>
            
            <div className="space-y-2 border rounded-xl p-3 bg-slate-50">
              <label className="text-sm font-bold text-slate-700">Các chân hụi của bạn:</label>
              {initialGroup.huiMembers.filter(hm => hm.userId === currentUser.id && !deadMemberIds.includes(hm.id)).length === 0 ? (
                <p className="text-xs text-red-500">Bạn không có chân hụi nào còn sống.</p>
              ) : (
                initialGroup.huiMembers.filter(hm => hm.userId === currentUser.id && !deadMemberIds.includes(hm.id)).map(hm => (
                  <div key={hm.id} className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id={`transfer-${hm.id}`}
                      checked={selectedMemberIds.includes(hm.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMemberIds([...selectedMemberIds, hm.id])
                        } else {
                          setSelectedMemberIds(selectedMemberIds.filter(id => id !== hm.id))
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor={`transfer-${hm.id}`} className="text-sm cursor-pointer font-medium text-slate-600">
                      Chân hụi {hm.name ? `(${hm.name})` : `(Mặc định)`}
                    </label>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2 mt-4">
              <label className="text-sm font-bold text-slate-700">Số điện thoại người mua:</label>
              <input 
                type="text" 
                value={transferPhone}
                onChange={e => setTransferPhone(e.target.value)}
                placeholder="Nhập SĐT đã đăng ký trên hệ thống"
                className="w-full border rounded-lg p-2 text-sm"
              />
            </div>
            
            <Button onClick={handleTransfer} disabled={isTransferring || selectedMemberIds.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4 rounded-xl">
              {isTransferring ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Xác nhận Chuyển Nhượng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
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

      {/* Progress Timeline Card */}
      {initialGroup.status !== "OPEN" && initialGroup.sessions.length > 0 && (
        <Card className="border border-indigo-100 bg-white shadow-md rounded-2xl p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>📊 Tiến Độ Dây Hụi</span>
                <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-150 font-black rounded-lg px-2 text-[10px]">
                  Kỳ {initialGroup.sessions.filter(s => s.status === "DONE").length}/{initialGroup.totalSlots}
                </Badge>
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Đã hoàn thành {initialGroup.sessions.filter(s => s.status === "DONE").length} kỳ khui hụi trên tổng số {initialGroup.totalSlots} kỳ.
              </p>
            </div>
            <div className="w-full md:max-w-xs space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-650">
                <span>Hoàn tất</span>
                <span>{Math.round((initialGroup.sessions.filter(s => s.status === "DONE").length / initialGroup.totalSlots) * 100)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500" 
                  style={{ width: `${Math.round((initialGroup.sessions.filter(s => s.status === "DONE").length / initialGroup.totalSlots) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

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
            <CardContent className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {initialGroup.huiMembers.map((member) => {
                const metrics = getMemberMetrics(member)
                const u = member.user
                const userAvatar = u.avatar || "👤"
                const transferNotice = initialGroup.transferHistories?.find((th: any) => th.memberId === member.id)
                
                return (
                  <div 
                    key={member.id} 
                    className={`p-3 rounded-2xl border transition-all flex flex-col gap-3 bg-white
                      ${metrics.wonSession ? "border-slate-100 bg-slate-50/20" : "border-indigo-50 bg-indigo-50/5"}
                    `}
                  >
                    {/* Top part: Avatar, Name, Badge */}
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        {/* 3D Ring around Avatar based on Live/Dead */}
                        <div className={`relative w-9 h-9 rounded-full flex items-center justify-center text-sm shadow-sm overflow-hidden flex-shrink-0 border-2
                          ${metrics.wonSession 
                            ? "ring-2 ring-slate-100 border-slate-300 opacity-80" 
                            : "ring-2 ring-emerald-500/20 border-emerald-450 animate-pulse-slow"}
                        `}>
                          {userAvatar.startsWith("data:image") ? (
                            <img src={userAvatar} alt={u.fullName} className="w-full h-full object-cover" />
                          ) : (
                            userAvatar
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">{u.fullName}</span>
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5">{u.phone}</span>
                          {transferNotice && (
                            <span className="text-[8.5px] font-bold text-amber-700 mt-0.5">
                              (Nhận từ {transferNotice.fromUser.fullName})
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        {metrics.wonSession ? (
                          <div className="flex flex-col items-end">
                            <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-50 border border-rose-150 text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow-none">
                              Hụi Chết
                            </Badge>
                            <span className="text-[8px] text-slate-400 font-bold mt-0.5">Kỳ {metrics.wonSession.sessionNumber}</span>
                          </div>
                        ) : (
                          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-150 text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow-none">
                            Hụi Sống
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Transfer Button */}
                    {(isAdmin || u.id === currentUser.id) && initialGroup.status !== "FINISHED" && (
                      <div className="mt-1 flex justify-end">
                        <Button 
                          variant="outline" size="sm" 
                          className="h-6 text-[10px] px-2 rounded border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                          onClick={() => {
                            setSelectedMemberIds([member.id]);
                            setIsTransferDialogOpen(true);
                          }}
                        >
                          Bán / Chuyển nhượng
                        </Button>
                      </div>
                    )}

                    {/* Member balance details & expected profits */}
                    {initialGroup.status !== "OPEN" && (
                      <div className="pt-2 border-t border-slate-100/80 grid grid-cols-2 gap-2 text-[9px] font-semibold text-slate-500">
                        <div>
                          <span className="text-slate-400 block font-bold uppercase tracking-wider text-[7.5px]">Đã tích lũy</span>
                          <span className="font-extrabold text-slate-700 text-[10px]">{formatVND(metrics.totalPaid)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block font-bold uppercase tracking-wider text-[7.5px]">
                            {metrics.wonSession ? "Thực nhận hốt" : "Lợi dự kiến"}
                          </span>
                          <span className={`font-extrabold text-[10px] ${metrics.wonSession ? "text-indigo-650" : "text-emerald-650"}`}>
                            {formatVND(metrics.wonSession ? metrics.totalReceived : metrics.expectedProfit)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Former members who transferred/sold their stakes */}
              {(() => {
                const activeUserIds = new Set(initialGroup.huiMembers.map((m: any) => m.userId))
                const formerSellersMap = new Map<string, any>()
                if (initialGroup.transferHistories) {
                  initialGroup.transferHistories.forEach((hist: any) => {
                    if (!activeUserIds.has(hist.fromUserId) && !formerSellersMap.has(hist.fromUserId)) {
                      formerSellersMap.set(hist.fromUserId, hist)
                    }
                  })
                }
                const formerSellers = Array.from(formerSellersMap.values())
                if (formerSellers.length === 0) return null

                return (
                  <div className="pt-3 border-t border-slate-200/80 space-y-2">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block px-1">
                      Đã bán hụi / Dừng chơi ({formerSellers.length})
                    </span>
                    {formerSellers.map((hist: any) => {
                      const seller = hist.fromUser
                      const sellerMetrics = getMemberMetrics(seller.id)
                      const sellerAvatar = seller.avatar || "👤"

                      return (
                        <div key={hist.id} className="p-3 rounded-2xl border border-amber-200 bg-amber-50/20 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-xs overflow-hidden flex-shrink-0">
                                {sellerAvatar.startsWith("data:image") ? (
                                  <img src={sellerAvatar} alt={seller.fullName} className="w-full h-full object-cover" />
                                ) : (
                                  sellerAvatar
                                )}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-800">{seller.fullName}</div>
                                <div className="text-[9px] text-amber-700 font-medium">
                                  Đã bán cho {hist.toUser.fullName} {hist.sessionNumber ? `(Kỳ ${hist.sessionNumber})` : ""}
                                </div>
                              </div>
                            </div>
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[8px] font-black px-1.5 py-0.5 shadow-none">
                              Đã bán
                            </Badge>
                          </div>

                          <div className="pt-1.5 border-t border-amber-200/60 flex justify-between text-[9px] font-semibold">
                            <span className="text-slate-500">Đã tích lũy trước khi bán:</span>
                            <strong className="text-slate-800 font-extrabold">{formatVND(sellerMetrics.totalPaid)}</strong>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          {/* Lịch sử Bán Hụi */}
          {initialGroup.transferHistories && initialGroup.transferHistories.length > 0 && (
            <Card className="border border-slate-200/60 bg-amber-50/50 shadow-sm rounded-2xl overflow-hidden mt-4">
              <CardHeader className="border-b border-amber-100/50 bg-amber-100/30 py-3 px-4">
                <CardTitle className="text-xs font-bold text-amber-800 flex items-center gap-2">
                  Lịch sử Bán Hụi ({initialGroup.transferHistories.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
                {initialGroup.transferHistories.map((hist: any) => (
                  <div key={hist.id} className="text-[10px] text-slate-600 p-2.5 bg-white rounded-xl border border-amber-200 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span><strong>{hist.fromUser.fullName}</strong> ➔ <strong>{hist.toUser.fullName}</strong></span>
                      <Badge className="bg-amber-100 text-amber-800 text-[8px] font-black px-1.5 py-0.5 shadow-none border-none">
                        {hist.sessionNumber ? `Kỳ ${hist.sessionNumber}` : "Đã bán"}
                      </Badge>
                    </div>
                    <div className="text-slate-400 text-[9px] flex justify-between">
                      <span>Thời gian: {formatDate(new Date(hist.transferDate))}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sessions Panel */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 px-1">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
              Danh Sách Kỳ Khui Hụi
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <Button onClick={() => setSessionFilter("CURRENT")} variant="ghost" size="sm" className={`h-8 rounded-lg text-xs font-bold ${sessionFilter === "CURRENT" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Kỳ Hiện Tại</Button>
              <Button onClick={() => setSessionFilter("DONE")} variant="ghost" size="sm" className={`h-8 rounded-lg text-xs font-bold ${sessionFilter === "DONE" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Hoàn Tất</Button>
              <Button onClick={() => setSessionFilter("PENDING")} variant="ghost" size="sm" className={`h-8 rounded-lg text-xs font-bold ${sessionFilter === "PENDING" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Chưa Đến Kỳ</Button>
              <Button onClick={() => setSessionFilter("ALL")} variant="ghost" size="sm" className={`h-8 rounded-lg text-xs font-bold ${sessionFilter === "ALL" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Tất Cả</Button>
            </div>
          </div>

          {filteredSessions.length === 0 ? (
            <Card className="border border-slate-200/60 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.03)] rounded-2xl">
              <CardContent className="p-12 text-center text-slate-400 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                  <PlayCircle className="w-8 h-8 text-slate-300" />
                </div>
                <p className="font-semibold text-sm">Không tìm thấy kỳ hụi nào phù hợp.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredSessions.map((session) => {
                const winner = getWinnerInfo(session.winnerUserId)
                return (
                  <Card key={session.id} className="overflow-hidden border border-slate-200/60 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] rounded-2xl hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all duration-200">
                    <div 
                      className={`bg-slate-50/50 px-5 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-colors ${session.status === "DONE" ? "cursor-pointer hover:bg-slate-100/70" : ""} ${expandedSessions[session.id] ? "border-b border-slate-100" : ""}`}
                      onClick={() => { if(session.status === "DONE") toggleSession(session.id) }}
                    >
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
                        <p className="text-[10px] text-slate-400 font-medium mt-1">
                          Ngày khui dự kiến: <span className="font-bold text-slate-600">{formatDate(session.openDate)}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end mt-2 md:mt-0">
                        {session.status === "BIDDING" && isAdmin && (
                          <div className="flex items-center gap-2">
                            <div className="text-right text-xs bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100 flex flex-col gap-0.5">
                              <div>
                                <span className="text-slate-500 font-medium">Giá cao nhất: </span>
                                <strong className="text-indigo-700 text-sm ml-1">
                                  {session.bids?.length > 0 ? formatVND(Math.max(...session.bids.map(b => b.amount))) : "0 đ"}
                                </strong>
                              </div>
                            </div>
                            <Button 
                              onClick={(e) => { e.stopPropagation(); handleAdminQuickBid(session.id) }} 
                              disabled={isActivating}
                              size="sm" 
                              className="h-[42px] px-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-lg font-bold shadow-sm"
                            >
                              Hốt Nhanh (+500đ)
                            </Button>
                          </div>
                        )}

                        {session.status === "DONE" && winner && (
                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                            <div className="text-right text-xs bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100 flex flex-col">
                              <div><span className="text-slate-500 font-medium">Người hốt: </span><strong className="text-indigo-700 text-sm ml-1">{winner.fullName}</strong></div>
                              <span className="text-[10px] text-slate-400 font-medium mt-0.5">{winner.bankName || 'Chưa cập nhật Bank'} - {winner.bankAccountNumber || ''}</span>
                            </div>
                            <Dialog>
                              <DialogTrigger render={
                                <Button variant="outline" size="sm" className="h-[42px] px-3 bg-white border-indigo-100 text-indigo-600 hover:bg-indigo-50 shadow-sm rounded-lg" onClick={(e) => e.stopPropagation()}>
                                  <QrCode className="w-4 h-4 mr-1.5" /> Chuyển khoản
                                </Button>
                              } />
                              <DialogContent className="sm:max-w-md flex flex-col items-center p-6 rounded-3xl border-indigo-100 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                                <DialogHeader>
                                  <DialogTitle className="text-center font-black text-slate-900 mb-2 text-xl">Thông Tin Chuyển Khoản</DialogTitle>
                                </DialogHeader>
                                <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-4 ring-4 ring-indigo-50/50">
                                  <img 
                                    src={`https://img.vietqr.io/image/${getBankBin(winner.bankName || '')}-${winner.bankAccountNumber}-compact2.png`}
                                    alt="VietQR"
                                    className="w-56 h-56 object-contain"
                                  />
                                </div>
                                <div className="text-center text-xs space-y-3 w-full bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                  <div className="flex justify-between border-b border-slate-100 pb-2.5"><span className="text-slate-500 font-medium">Người nhận:</span> <strong className="text-indigo-700 font-bold uppercase">{winner.fullName}</strong></div>
                                  <div className="flex justify-between border-b border-slate-100 pb-2.5"><span className="text-slate-500 font-medium">Ngân hàng:</span> <strong className="text-slate-700 font-bold">{winner.bankName || 'Chưa cập nhật'}</strong></div>
                                  <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Số tài khoản:</span> <strong className="text-slate-800 font-mono font-bold text-sm">{winner.bankAccountNumber || 'Chưa cập nhật'}</strong></div>
                                </div>
                                {(() => {
                                  const livingPayers = session.payments.filter(p => !p.isDead)
                                  const deadPayers = session.payments.filter(p => p.isDead)
                                  const livingAmount = livingPayers[0]?.amountToPay || 0
                                  const deadAmount = deadPayers[0]?.amountToPay || 0
                                  return (
                                    <div className="w-full flex flex-col gap-2 mt-4 pt-4 border-t border-slate-100 px-2">
                                      {livingPayers.length > 0 && (
                                        <div className="flex justify-between items-center text-xs">
                                          <span className="text-slate-600 font-medium">Hụi sống đóng:</span>
                                          <strong className="text-rose-600 font-bold text-sm">{formatVND(livingAmount)}</strong>
                                        </div>
                                      )}
                                      {deadPayers.length > 0 && (
                                        <div className="flex justify-between items-center text-xs">
                                          <span className="text-slate-600 font-medium">Hụi chết đóng:</span>
                                          <strong className="text-rose-600 font-bold text-sm">{formatVND(deadAmount)}</strong>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })()}
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}

                        {session.status !== "DONE" && (
                          <Link href={`/groups/${initialGroup.id}/sessions/${session.id}`}>
                            <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs">
                              Chi Tiết <ArrowRight className="w-3.5 h-3.5 ml-1.5"/>
                            </Button>
                          </Link>
                        )}
                        
                        {session.status === "DONE" && (
                          <div className="bg-white p-1 rounded-full shadow-sm border border-slate-100">
                            {expandedSessions[session.id] ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                          </div>
                        )}
                      </div>
                    </div>

                    {session.status === "DONE" && expandedSessions[session.id] && (
                      <CardContent className="p-4 bg-slate-50/50 border-t border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {session.payments.map(payment => {
                            const bid = session.bids?.find(b => b.userId === payment.userId)
                            return (
                              <div key={payment.id} className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow relative overflow-hidden flex flex-col h-full">
                                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-50">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                                      {payment.user.avatar && payment.user.avatar.startsWith("data:image") ? (
                                        <img src={payment.user.avatar} alt={payment.user.fullName} className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="text-xs">{payment.user.avatar || "👤"}</span>
                                      )}
                                    </div>
                                    <span className="font-bold text-slate-800 text-sm">{payment.user.fullName}</span>
                                  </div>
                                  <Badge className={`border-none shadow-none text-[10px] font-bold px-2 py-0.5 rounded-lg ${payment.isDead ? 'bg-rose-50 text-rose-700 hover:bg-rose-50' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50'}`}>
                                    {payment.isDead ? "Hụi Chết" : "Hụi Sống"}
                                  </Badge>
                                </div>
                                <div className="space-y-2 mb-4">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-medium">Tiền Kêu:</span>
                                    <span className="font-semibold text-slate-700">{bid ? (bid.amount > 0 ? formatVND(bid.amount) : "Phiếu trắng") : "-"}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-medium">Tiền Đóng:</span>
                                    <span className="font-black text-rose-600 text-sm">{formatVND(payment.amountToPay)}</span>
                                  </div>
                                </div>
                                <div className="pt-3 border-t border-slate-100 flex justify-end mt-auto">
                                  {winner?.bankName && winner?.bankAccountNumber ? (
                                    <Dialog>
                                      <DialogTrigger
                                        render={
                                          <Button variant="outline" size="sm" className="w-full h-8 text-[11px] font-semibold border-indigo-100 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 rounded-xl shadow-none transition-colors" type="button" onClick={(e) => e.stopPropagation()}>
                                            <QrCode className="w-3.5 h-3.5 mr-1.5 text-indigo-500"/> Quét Mã QR Thanh Toán
                                          </Button>
                                        }
                                      />
                                      <DialogContent className="sm:max-w-md flex flex-col items-center p-6 rounded-3xl border-indigo-100 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                                        <DialogHeader>
                                          <DialogTitle className="text-center font-black text-slate-900 mb-2 text-xl">Thanh Toán Trực Tiếp</DialogTitle>
                                        </DialogHeader>
                                        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-4 ring-4 ring-indigo-50/50">
                                          <img 
                                            src={`https://img.vietqr.io/image/${getBankBin(winner.bankName)}-${winner.bankAccountNumber}-compact2.png`}
                                            alt="VietQR"
                                            className="w-56 h-56 object-contain"
                                          />
                                        </div>
                                        <div className="text-center text-xs space-y-3 w-full bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                          <div className="flex justify-between border-b border-slate-100 pb-2.5"><span className="text-slate-500 font-medium">Người nhận:</span> <strong className="text-indigo-700 font-bold uppercase">{winner.fullName}</strong></div>
                                          <div className="flex justify-between border-b border-slate-100 pb-2.5"><span className="text-slate-500 font-medium">Ngân hàng:</span> <strong className="text-slate-700 font-bold">{winner.bankName}</strong></div>
                                          <div className="flex justify-between border-b border-slate-100 pb-2.5"><span className="text-slate-500 font-medium">Số tài khoản:</span> <strong className="text-slate-800 font-mono font-bold text-sm">{winner.bankAccountNumber}</strong></div>
                                          <div className="flex justify-between pt-1.5 items-center"><span className="text-slate-500 font-medium">Số tiền đóng:</span> <strong className="text-rose-600 text-lg font-black">{formatVND(payment.amountToPay)}</strong></div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-medium italic w-full text-center py-1.5 bg-slate-50 rounded-lg">Người hốt chưa cập nhật Ngân hàng</span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
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
