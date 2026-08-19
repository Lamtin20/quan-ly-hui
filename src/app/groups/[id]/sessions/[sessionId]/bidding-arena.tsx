"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Check, 
  CheckCircle2, 
  CircleDashed, 
  ArrowLeft, 
  Trophy, 
  QrCode, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Landmark, 
  CreditCard,
  Users,
  ShieldCheck,
  Zap
} from "lucide-react"
import Link from "next/link"
import { submitBid, closeBidding, pickSphere } from "@/app/actions/bids"
import { confirmPayment, confirmAllPayments, submitPaidSelf } from "@/app/actions/payments"

export function BiddingArena({ 
  session, 
  currentUser, 
  deadIds, 
  winnerUser,
  previousSessions = []
}: any) {
  const router = useRouter()
  const [bidAmount, setBidAmount] = useState("")
  const [isWhiteTicket, setIsWhiteTicket] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sphereLoading, setSphereLoading] = useState(false)
  
  // State for Victory Popup
  const [showWinnerPopup, setShowWinnerPopup] = useState(false)

  // Tie-breaker ball selection state
  const [selectedBallIndex, setSelectedBallIndex] = useState<number | null>(null)
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`tie-breaker-ball-${session.id}-${currentUser.id}`)
      if (saved !== null) {
        setSelectedBallIndex(parseInt(saved, 10))
      }
    }
  }, [session.id, currentUser.id])

  const isAdmin = currentUser.role === "ADMIN"
  const isLiving = !deadIds.includes(currentUser.id)
  const myBid = session.bids.find((b: any) => b.userId === currentUser.id)

  const maxBid = (session.huiGroup.amount * session.huiGroup.maxBidPercentage) / 100

  // Real-time polling
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 8000)
    return () => clearInterval(interval)
  }, [router])

  // Trigger Victory Popup on Session status DONE
  useEffect(() => {
    if (session.status === "DONE" && session.winnerUserId) {
      const seenKey = `seen-winner-${session.id}-${session.winnerUserId}`
      const hasSeen = localStorage.getItem(seenKey)
      if (!hasSeen) {
        setShowWinnerPopup(true)
      }
    }
  }, [session.status, session.id, session.winnerUserId])

  const handleClosePopup = () => {
    setShowWinnerPopup(false)
    if (session.winnerUserId) {
      localStorage.setItem(`seen-winner-${session.id}-${session.winnerUserId}`, "true")
    }
  }

  const handleCTAPopup = () => {
    handleClosePopup()
    // Small delay to allow the dialog closing transition to finish
    setTimeout(() => {
      const el = document.getElementById("payment-section")
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 150)
  }

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await submitBid(session.id, Number(bidAmount), isWhiteTicket)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePickSphere = async (index: number) => {
    setSelectedBallIndex(index)
    if (typeof window !== "undefined") {
      localStorage.setItem(`tie-breaker-ball-${session.id}-${currentUser.id}`, index.toString())
    }
    setSphereLoading(true)
    try {
      await pickSphere(session.id)
    } catch(err: any) {
      alert(err.message)
    } finally {
      setSphereLoading(false)
    }
  }

  const handleCloseBidding = async () => {
    if (confirm("Bạn có chắc chắn chốt kết quả kỳ hụi này?")) {
      setLoading(true)
      try {
        await closeBidding(session.id)
      } catch(err: any) {
        alert(err.message)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleConfirmPaymentItem = async (paymentId: string) => {
    setLoading(true)
    try {
      await confirmPayment(paymentId)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmAll = async () => {
    if (confirm("Xác nhận tất cả thành viên đã đóng tiền đầy đủ cho người hốt?")) {
      setLoading(true)
      try {
        await confirmAllPayments(session.id)
      } catch (err: any) {
        alert(err.message)
      } finally {
        setLoading(false)
      }
    }
  }

  const handlePaySelfSubmit = async (paymentId: string) => {
    setLoading(true)
    try {
      await submitPaidSelf(paymentId)
      alert("Xác nhận đã chuyển tiền thành công!")
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatVND = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

  const renderPendingState = () => (
    <Card className="border-indigo-100/60 shadow-lg bg-white/90 backdrop-blur-md rounded-3xl overflow-hidden">
      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4 shadow-inner">
          <CircleDashed className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Kỳ hụi chưa bắt đầu</h3>
        <p className="text-slate-500 text-xs mt-2 max-w-sm font-medium leading-relaxed">
          Kỳ hụi này đang ở trạng thái chờ. Vui lòng quay lại hoặc liên hệ Chủ hụi mở kỳ khui hụi để bắt đầu kêu giá!
        </p>
      </CardContent>
    </Card>
  )

  const renderBiddingState = () => (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Form nhập giá */}
        {isLiving && !myBid && (
          <Card className="border-indigo-100/60 shadow-lg bg-white/90 backdrop-blur-md rounded-3xl overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Coins className="w-5 h-5 text-indigo-500" /> Bỏ Thăm Kêu Hụi
              </CardTitle>
              <CardDescription className="text-xs">Nhập mức giá bạn muốn kêu cho kỳ này.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBidSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-600 text-xs font-semibold uppercase tracking-wider block">Mức kêu tối đa: {formatVND(maxBid)}</Label>
                  <Input 
                    type="number" 
                    value={bidAmount} 
                    onChange={e => {
                      setBidAmount(e.target.value)
                      setIsWhiteTicket(false)
                    }} 
                    placeholder="VD: 150000"
                    disabled={isWhiteTicket}
                    className="rounded-2xl border-slate-200 py-6 text-lg font-semibold text-slate-800"
                  />
                </div>
                <div className="flex items-center space-x-3 p-3 bg-slate-50 border rounded-2xl">
                  <input 
                    type="checkbox" 
                    id="whiteTicket" 
                    checked={isWhiteTicket} 
                    onChange={e => {
                      setIsWhiteTicket(e.target.checked)
                      if(e.target.checked) setBidAmount("")
                    }}
                    className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <Label htmlFor="whiteTicket" className="text-xs font-bold text-slate-600 cursor-pointer flex-1">
                    Tôi bỏ Phiếu Trắng (Không kêu giá)
                  </Label>
                </div>
                <Button type="submit" disabled={loading || (!bidAmount && !isWhiteTicket)} className="w-full py-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md font-bold text-sm transition-all active:scale-[0.98]">
                  Xác nhận Bỏ Thăm
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Trạng thái của mình */}
        {myBid && (
          <Card className="border-emerald-100 shadow-lg bg-emerald-50/40 backdrop-blur-sm rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center h-full">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4 shadow-inner">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-emerald-800">Đã gửi thăm thành công!</h3>
              <p className="text-emerald-700/80 text-sm mt-2">
                Bạn đã kêu: <span className="font-bold">{myBid.isWhiteTicket ? "Phiếu Trắng" : formatVND(myBid.amount)}</span>
              </p>
              <p className="text-xs text-emerald-600/60 mt-4 flex items-center gap-1.5 font-medium">
                <CircleDashed className="w-3.5 h-3.5 animate-spin" /> Đang chờ những người khác bỏ thăm...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Danh sách người đã bỏ */}
        <Card className="border-indigo-100/60 shadow-lg bg-white/90 backdrop-blur-md rounded-3xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" /> Tiến độ Bỏ Thăm
              </CardTitle>
              <CardDescription className="text-xs">Theo dõi những người đã hoàn tất bỏ thăm.</CardDescription>
            </div>
            {isAdmin && (
              <Button onClick={handleCloseBidding} disabled={loading} size="sm" variant="destructive" className="rounded-xl px-3 font-semibold text-xs transition-all active:scale-[0.98]">
                Chốt Kết Quả Ngay
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {session.huiGroup.huiMembers.filter((hm:any) => !deadIds.includes(hm.userId)).map((hm: any) => {
                const hasBid = session.bids.some((b: any) => b.userId === hm.userId)
                return (
                  <div key={hm.userId} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-200/80 flex items-center justify-center text-xs font-semibold text-slate-700 overflow-hidden border">
                        {hm.user.avatar && hm.user.avatar.startsWith("data:image") ? (
                          <img src={hm.user.avatar} alt={hm.user.fullName} className="w-full h-full object-cover" />
                        ) : (
                          hm.user.avatar || "👤"
                        )}
                      </div>
                      <span className="font-semibold text-slate-700 text-sm">{hm.user.fullName}</span>
                    </div>
                    {hasBid ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-50 rounded-xl px-2.5 py-1 text-[11px] font-bold"><Check className="w-3 h-3 mr-1 inline"/> Đã bỏ thăm</Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-400 border-dashed rounded-xl px-2.5 py-1 text-[11px] font-semibold"><CircleDashed className="w-3 h-3 mr-1 animate-spin inline"/> Đang chờ</Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderTieBreakerState = () => {
    const data = session.tieBreakerData as any
    const amIInvolved = data.tiedUserIds.includes(currentUser.id)
    const haveIPicked = amIInvolved && data.selected[currentUser.id]

    // List of colors for glossy lottery balls
    const BALL_GRADIENTS = [
      "from-amber-400 via-amber-500 to-orange-600 shadow-orange-500/30",
      "from-blue-400 via-blue-500 to-indigo-600 shadow-blue-500/30",
      "from-emerald-400 via-emerald-500 to-teal-600 shadow-emerald-500/30",
      "from-rose-400 via-rose-500 to-pink-600 shadow-rose-500/30",
      "from-purple-400 via-purple-500 to-violet-600 shadow-purple-500/30",
      "from-cyan-400 via-cyan-500 to-blue-600 shadow-cyan-500/30",
      "from-orange-400 via-orange-500 to-red-600 shadow-orange-500/30",
      "from-fuchsia-400 via-fuchsia-500 to-purple-600 shadow-fuchsia-500/30",
    ]

    return (
      <div className="space-y-6">
        {/* Main card */}
        <Card className="border-indigo-100/60 shadow-xl bg-white/95 rounded-3xl overflow-hidden">
          <CardHeader className="text-center pb-2 bg-gradient-to-b from-indigo-50/30 to-transparent">
            <div className="flex justify-center mb-2">
              <Badge className="bg-orange-50 text-orange-600 border border-orange-100 font-bold px-3 py-1 rounded-full flex items-center gap-1.5 animate-bounce">
                <Zap className="w-3.5 h-3.5 text-orange-500 animate-pulse" /> Vòng Bốc Thăm May Mắn!
              </Badge>
            </div>
            <CardTitle className="text-2xl font-black text-slate-800">Trùng giá kêu cao nhất!</CardTitle>
            <CardDescription className="text-xs max-w-md mx-auto leading-relaxed mt-1">
              Có <span className="font-bold text-indigo-600">{data.tiedUserIds.length} thành viên</span> cùng kêu mức giá cao nhất. Mỗi người cần chọn 1 quả bóng may mắn, ai có số điểm cao nhất sẽ giành quyền hốt hụi kỳ này!
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-8">
            {/* Active Drawing Board for involved users */}
            {amIInvolved && (
              <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex flex-col items-center space-y-6">
                <h3 className="text-sm font-extrabold text-slate-700 tracking-wide uppercase text-center">
                  {haveIPicked 
                    ? "🎉 Bạn đã hoàn tất bốc thăm!" 
                    : "👉 Chọn 1 quả bóng bên dưới để bốc điểm:"
                  }
                </h3>

                <div className="grid grid-cols-4 gap-4 max-w-xs md:max-w-md">
                  {Array.from({ length: 8 }).map((_, i) => {
                    const isThisBallChosenByMe = selectedBallIndex === i
                    const isRevealed = haveIPicked && isThisBallChosenByMe
                    const score = isRevealed ? data.selected[currentUser.id] : null

                    return (
                      <motion.button
                        key={i}
                        disabled={sphereLoading || haveIPicked}
                        onClick={() => handlePickSphere(i)}
                        whileHover={!haveIPicked ? { scale: 1.15, y: -4, rotate: 6 } : {}}
                        whileTap={!haveIPicked ? { scale: 0.95 } : {}}
                        animate={
                          sphereLoading && isThisBallChosenByMe
                            ? {
                                x: [0, -5, 5, -5, 5, -5, 5, 0],
                                y: [0, -10, 0, -10, 0],
                                rotate: [0, -15, 15, -15, 15, 0],
                                transition: { repeat: Infinity, duration: 0.4 }
                              }
                            : {}
                        }
                        className={`
                          relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${BALL_GRADIENTS[i % BALL_GRADIENTS.length]}
                          flex items-center justify-center text-white shadow-md border border-white/20 select-none transition-all duration-300
                          ${!haveIPicked ? "cursor-pointer hover:shadow-xl" : "cursor-default"}
                          ${(haveIPicked && !isThisBallChosenByMe) ? "opacity-30 filter grayscale-[50%]" : ""}
                        `}
                      >
                        {/* 3D Glossy highlighting reflection */}
                        <div className="absolute top-1 left-2 w-5 h-2.5 bg-white/30 rounded-full blur-[0.5px]" />
                        <div className="absolute bottom-1 right-2 w-3 h-3 bg-black/10 rounded-full blur-[1px]" />
                        
                        {/* Inner white circle showing the sphere number */}
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white text-slate-800 font-black flex items-center justify-center shadow-inner border border-slate-100 text-sm md:text-base">
                          {score ? score : "?"}
                        </div>
                        {sphereLoading && isThisBallChosenByMe && (
                          <div className="absolute inset-0 rounded-full bg-black/20 flex items-center justify-center">
                            <CircleDashed className="w-8 h-8 animate-spin text-white" />
                          </div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>

                {haveIPicked && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-center max-w-sm">
                    <p className="text-xs font-bold text-emerald-800">
                      Điểm số bạn bốc được là: <span className="text-xl font-black text-emerald-600 block mt-1">{data.selected[currentUser.id]} điểm</span>
                    </p>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-1">Đang chờ các thành viên khác hoàn tất lượt bốc của họ...</p>
                  </div>
                )}
              </div>
            )}

            {/* Spectator/Progress view for everyone */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" /> Bảng Theo Dõi Bốc Thăm ({Object.keys(data.selected).length}/{data.tiedUserIds.length})
              </h3>

              <div className="grid gap-3 sm:grid-cols-2">
                {data.tiedUserIds.map((uid: string) => {
                  const u = session.bids.find((b: any) => b.userId === uid)?.user
                  const num = data.selected[uid]
                  const isMe = uid === currentUser.id

                  return (
                    <div 
                      key={uid} 
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between bg-white shadow-sm
                        ${isMe ? "border-indigo-200 bg-indigo-50/20" : "border-slate-100"}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border bg-slate-50">
                          {u?.avatar && u.avatar.startsWith("data:image") ? (
                            <img src={u.avatar} alt={u.fullName} className="w-full h-full object-cover" />
                          ) : (
                            u?.avatar || "👤"
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            {u?.fullName}
                            {isMe && <Badge className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0 rounded">Bạn</Badge>}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">Kêu giá: {formatVND(session.bids.find((b: any) => b.userId === uid)?.amount || 0)}</p>
                        </div>
                      </div>

                      <div>
                        {num ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-emerald-600 font-bold">Đã bốc:</span>
                            {/* Small 3D glossy mini-ball */}
                            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center font-black text-xs shadow-md border border-white/20 select-none">
                              <div className="absolute top-0.5 left-1 w-2.5 h-1.5 bg-white/35 rounded-full blur-[0.5px]" />
                              {num}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-slate-400 border-dashed rounded-xl px-2.5 py-1 text-[10px] font-semibold flex items-center gap-1">
                            <CircleDashed className="w-3.5 h-3.5 animate-spin" /> Đang bốc...
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderDoneState = () => {
    const myPayment = session.payments.find((p:any) => p.userId === currentUser.id)
    const isWinner = session.winnerUserId === currentUser.id

    // VietQR URL for Winner
    const qrUrl = winnerUser?.bankName && winnerUser?.bankAccountNumber && myPayment 
      ? `https://img.vietqr.io/image/${winnerUser.bankName}-${winnerUser.bankAccountNumber}-compact2.jpg?amount=${myPayment.amountToPay}`
      : null

    // Payment stats
    const totalPaymentsCount = session.payments.length
    const paidPaymentsCount = session.payments.filter((p: any) => p.paidStatus === "PAID").length
    const totalCollected = session.payments
      .filter((p: any) => p.paidStatus === "PAID")
      .reduce((sum: number, p: any) => sum + p.amountToPay, 0)
    const totalOutstanding = session.payments
      .filter((p: any) => p.paidStatus === "UNPAID")
      .reduce((sum: number, p: any) => sum + p.amountToPay, 0)

    return (
      <div className="space-y-6">
        
        {/* Winner Banner */}
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 via-white to-amber-50/30 shadow-md overflow-hidden relative rounded-3xl">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Trophy className="w-32 h-32 text-amber-500" />
          </div>
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-white shadow-sm border text-2xl">
                {winnerUser?.avatar && winnerUser.avatar.startsWith("data:image") ? (
                  <img src={winnerUser.avatar} alt={winnerUser.fullName} className="w-full h-full object-cover" />
                ) : (
                  winnerUser?.avatar || "🤵"
                )}
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-amber-800">🎉 Chúc mừng {winnerUser?.fullName} hốt hụi!</h2>
                <p className="text-xs text-amber-700/80 font-medium">Kỳ hốt hụi đã kết thúc và chốt kết quả.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-amber-100">
              <div className="bg-amber-50/50 p-3 rounded-2xl">
                <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Mức kêu bỏ thăm</p>
                <p className="text-lg md:text-xl font-extrabold text-slate-800 mt-1">{formatVND(session.bidAmount)}</p>
              </div>
              <div className="bg-emerald-50/50 p-3 rounded-2xl">
                <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Tổng thực nhận</p>
                <p className="text-lg md:text-xl font-extrabold text-emerald-600 mt-1">{formatVND(session.winnerReceivedAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Left Column: Payments & QR (For Payers) / Winner Stats (For Winner) */}
          <div id="payment-section" className="space-y-6">
            
            {/* If winner */}
            {isWinner && (
              <Card className="border-indigo-100/60 shadow-lg bg-white/95 rounded-3xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-500" /> Thống Kê Thu Tiền Hốt Hụi
                  </CardTitle>
                  <CardDescription className="text-xs">Theo dõi tiến độ nhận tiền đóng hụi của bạn.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">Đã thu thực tế</span>
                      <span className="text-base font-extrabold text-emerald-600 mt-0.5 block">{formatVND(totalCollected)}</span>
                      <span className="text-[9px] text-emerald-500 font-semibold block mt-0.5">{paidPaymentsCount}/{totalPaymentsCount} thành viên</span>
                    </div>
                    <div className="p-3 bg-red-50 rounded-2xl border border-red-100">
                      <span className="text-[10px] text-red-700 font-bold uppercase tracking-wider block">Còn thiếu</span>
                      <span className="text-base font-extrabold text-red-600 mt-0.5 block">{formatVND(totalOutstanding)}</span>
                      <span className="text-[9px] text-red-500 font-semibold block mt-0.5">{totalPaymentsCount - paidPaymentsCount} thành viên chưa đóng</span>
                    </div>
                  </div>
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 text-xs text-indigo-800 font-semibold leading-relaxed">
                    💡 Hãy nhắc nhở các thành viên chưa nộp tiền chuyển khoản đúng số tiền đóng để chốt kỳ.
                  </div>
                </CardContent>
              </Card>
            )}

            {/* If payer */}
            {!isWinner && myPayment && (
              <Card className="border-indigo-100/60 shadow-lg bg-white/95 rounded-3xl overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-indigo-500" /> Thanh toán cho Người hốt
                  </CardTitle>
                  <CardDescription className="text-xs">Quét mã VietQR hoặc chuyển khoản trực tiếp.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center space-y-5">
                  {qrUrl ? (
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                      <img src={qrUrl} alt="VietQR Code" className="w-52 h-52 object-contain" />
                    </div>
                  ) : (
                    <div className="w-52 h-52 bg-slate-50 border rounded-2xl flex items-center justify-center text-slate-400 text-xs font-semibold">
                      Chưa cập nhật thông tin Ngân hàng
                    </div>
                  )}
                  
                  <div className="w-full space-y-3 p-4 bg-slate-50/70 border rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Thông tin chuyển khoản</span>
                    <div className="space-y-1.5 text-xs text-slate-700 font-semibold">
                      <p className="flex justify-between"><span>Người nhận:</span> <span className="font-bold text-slate-900">{winnerUser?.fullName}</span></p>
                      <p className="flex justify-between"><span>Ngân hàng:</span> <span className="font-bold text-slate-900">{winnerUser?.bankName || "—"}</span></p>
                      <p className="flex justify-between"><span>Số tài khoản:</span> <span className="font-bold text-slate-900 font-mono">{winnerUser?.bankAccountNumber || "—"}</span></p>
                      <div className="p-3 bg-indigo-50 rounded-xl text-indigo-900 mt-3 border border-indigo-100/50 flex justify-between items-center">
                        <div>
                          <p className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider">Số tiền cần đóng:</p>
                          <p className="text-lg font-black">{formatVND(myPayment.amountToPay)}</p>
                        </div>
                        <Badge className={`${myPayment.isDead ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'} rounded-lg text-[9px] font-bold px-2 py-0.5 border border-current`}>
                          {myPayment.isDead ? "Hụi chết" : "Hụi sống"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {myPayment.paidStatus === "PAID" ? (
                    <div className="w-full p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 flex items-center justify-center gap-2 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Đã đóng tiền thành công
                    </div>
                  ) : (
                    <Button 
                      onClick={() => handlePaySelfSubmit(myPayment.id)}
                      disabled={loading}
                      className="w-full py-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 font-bold shadow-md transition-all active:scale-[0.98]"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Xác nhận đã chuyển tiền
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Profit & Loss Table Card */}
            <Card className="border-indigo-100/60 shadow-lg bg-white/95 rounded-3xl overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-500" /> Bảng kê Lời / Lỗ của kỳ hụi
                </CardTitle>
                <CardDescription className="text-xs">Hiển thị chi tiết khoản lợi nhuận, chi phí của các thành viên.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {session.huiGroup.huiMembers.map((hm: any) => {
                    const isSessionWinner = hm.userId === session.winnerUserId
                    const isDeadMember = deadIds.includes(hm.userId)
                    
                    let profitValue = 0
                    let label = "Hụi sống"
                    let statusColor = "bg-slate-100 text-slate-700"

                    if (isSessionWinner) {
                      label = "Hốt hụi"
                      statusColor = "bg-amber-100 text-amber-700"
                      // Formula: sum of past bids - (N - k) * Current Bid
                      const prevBids = previousSessions.filter((s: any) => s.sessionNumber < session.sessionNumber)
                      const prevBidsSum = prevBids.reduce((sum: number, s: any) => sum + s.bidAmount, 0)
                      profitValue = prevBidsSum - (session.huiGroup.totalSlots - session.sessionNumber) * session.bidAmount
                    } else if (isDeadMember) {
                      label = "Hụi chết"
                      statusColor = "bg-red-50 text-red-600"
                      profitValue = 0
                    } else {
                      // Living member saves B_k
                      profitValue = session.bidAmount
                    }

                    return (
                      <div key={hm.userId} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/60 border border-slate-100 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center border bg-white text-xs">
                            {hm.user.avatar && hm.user.avatar.startsWith("data:image") ? (
                              <img src={hm.user.avatar} alt={hm.user.fullName} className="w-full h-full object-cover" />
                            ) : (
                              hm.user.avatar || "👤"
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{hm.user.fullName}</p>
                            <span className={`inline-block text-[9px] font-bold rounded px-1.5 py-0.25 mt-0.5 ${statusColor}`}>
                              {label}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-semibold">
                            {isSessionWinner ? "Nhận: " : "Đóng: "}
                            <span className="font-bold text-slate-700">
                              {isSessionWinner 
                                ? formatVND(session.winnerReceivedAmount)
                                : formatVND(isDeadMember ? session.huiGroup.amount : (session.huiGroup.amount - session.bidAmount))
                              }
                            </span>
                          </p>
                          <div className={`flex items-center justify-end font-bold text-xs mt-0.5 ${
                            profitValue > 0 ? "text-emerald-600" : profitValue < 0 ? "text-red-500" : "text-slate-400"
                          }`}>
                            {profitValue > 0 ? (
                              <><TrendingUp className="w-3.5 h-3.5 mr-1" /> +{formatVND(profitValue)}</>
                            ) : profitValue < 0 ? (
                              <><TrendingDown className="w-3.5 h-3.5 mr-1" /> {formatVND(profitValue)}</>
                            ) : (
                              "—"
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column: Payments Tracker Table (For Admin & Members) */}
          <div>
            <Card className="border-indigo-100/60 shadow-lg bg-white/95 rounded-3xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-indigo-500" /> Danh Sách Đóng Hụi
                  </CardTitle>
                  <CardDescription className="text-xs">Quản lý và đối soát thông tin đóng tiền của các thành viên.</CardDescription>
                </div>
                {isAdmin && totalOutstanding > 0 && (
                  <Button 
                    onClick={handleConfirmAll} 
                    disabled={loading} 
                    size="sm" 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-all active:scale-[0.98] shadow-sm"
                  >
                    Xác nhận tất cả
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {session.payments.map((payment: any) => {
                    const isPaid = payment.paidStatus === "PAID"
                    return (
                      <div key={payment.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/50 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border bg-white text-sm">
                            {payment.user.avatar && payment.user.avatar.startsWith("data:image") ? (
                              <img src={payment.user.avatar} alt={payment.user.fullName} className="w-full h-full object-cover" />
                            ) : (
                              payment.user.avatar || "👤"
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-800 text-sm">{payment.user.fullName}</p>
                            <div className="flex items-center gap-1.5">
                              <Badge className={`${payment.isDead ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'} rounded-lg text-[9px] font-bold px-1.5 py-0.25`}>
                                {payment.isDead ? "Hụi chết" : "Hụi sống"}
                              </Badge>
                              <span className="text-[10px] text-slate-400 font-mono">{formatVND(payment.amountToPay)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isPaid ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl px-2.5 py-1 text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã đóng
                            </Badge>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50/20 rounded-xl px-2.5 py-1 text-[10px] font-bold">
                                Chưa đóng
                              </Badge>
                              {isAdmin && (
                                <Button
                                  onClick={() => handleConfirmPaymentItem(payment.id)}
                                  disabled={loading}
                                  size="sm"
                                  className="h-7 bg-white hover:bg-slate-100 text-indigo-600 border border-indigo-200 rounded-xl font-bold text-[10px]"
                                >
                                  Duyệt
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Header breadcrumb card */}
      <div className="flex items-center gap-4 bg-white/70 backdrop-blur-md border border-slate-200/50 p-4 rounded-3xl shadow-sm">
        <Link href={`/groups/${session.huiGroupId}`}>
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100"><ArrowLeft className="w-5 h-5 text-slate-600" /></Button>
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800">Kỳ Khui Hụi #{session.sessionNumber}</h1>
          <p className="text-slate-500 text-xs font-semibold">Dây hụi: {session.huiGroup.name}</p>
        </div>
        <Badge className="ml-auto rounded-xl px-3 py-1 text-[10px] md:text-xs font-bold" variant={session.status === "DONE" ? "default" : "secondary"}>
          {session.status === "PENDING" && "Chưa Khui"}
          {session.status === "BIDDING" && "Đang Kêu Giá"}
          {session.status === "TIE_BREAKER" && "Bốc Thăm"}
          {session.status === "DONE" && "Đã Chốt Kết Quả"}
        </Badge>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={session.status}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
        >
          {session.status === "PENDING" && renderPendingState()}
          {session.status === "BIDDING" && renderBiddingState()}
          {session.status === "TIE_BREAKER" && renderTieBreakerState()}
          {session.status === "DONE" && renderDoneState()}
        </motion.div>
      </AnimatePresence>

      {/* Victory Celebration Modal */}
      <Dialog open={showWinnerPopup} onOpenChange={setShowWinnerPopup}>
        <DialogContent className="max-w-md rounded-3xl border border-amber-200 p-5 sm:p-8 bg-amber-50 text-center shadow-2xl overflow-y-auto max-h-[85vh] sm:max-h-none">
          {/* Confetti decoration */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-200/20 via-transparent to-transparent pointer-events-none" />
          
          <DialogHeader className="flex flex-col items-center">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-amber-100 flex items-center justify-center mb-2 sm:mb-4 shadow-md animate-bounce">
              <Trophy className="w-7 h-7 sm:w-10 sm:h-10 text-amber-500" />
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-black text-amber-800">
              🎉 HỐT HỤI THÀNH CÔNG!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 sm:space-y-4 sm:py-4 relative z-10">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex items-center justify-center bg-white shadow-md border text-3xl sm:text-4xl mb-2">
                {winnerUser?.avatar && winnerUser.avatar.startsWith("data:image") ? (
                  <img src={winnerUser.avatar} alt={winnerUser.fullName} className="w-full h-full object-cover" />
                ) : (
                  winnerUser?.avatar || "🤵"
                )}
              </div>
              <p className="text-lg sm:text-xl font-bold text-slate-800">{winnerUser?.fullName}</p>
              <Badge className="bg-amber-100 text-amber-700 border border-amber-200 font-bold px-3 py-0.5 mt-1 rounded-lg">
                Người chiến thắng Kỳ #{session.sessionNumber}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 sm:p-4 bg-white/80 rounded-2xl border border-amber-100 shadow-sm mt-3 sm:mt-4 text-slate-700">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Mức kêu giá</p>
                <p className="text-sm font-extrabold text-slate-800 mt-0.5">{formatVND(session.bidAmount)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Tổng thực nhận</p>
                <p className="text-sm font-extrabold text-emerald-600 mt-0.5">{formatVND(session.winnerReceivedAmount)}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1 sm:pt-2 relative z-10">
            {/* If player is NOT the winner, display CTA button to scroll/transfer */}
            {session.winnerUserId !== currentUser.id && (
              <Button 
                onClick={handleCTAPopup} 
                className="w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-md transition-all active:scale-[0.98] text-xs"
              >
                <QrCode className="w-4 h-4 mr-2" /> Chuyển khoản đóng hụi ngay
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={handleClosePopup}
              className="w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl border-slate-200 hover:bg-slate-100 font-semibold text-xs"
            >
              Đóng cửa sổ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
