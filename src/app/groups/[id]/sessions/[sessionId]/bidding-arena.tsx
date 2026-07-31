"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, CheckCircle2, CircleDashed, ArrowLeft, Trophy, QrCode } from "lucide-react"
import Link from "next/link"
import { submitBid, closeBidding, pickSphere } from "@/app/actions/bids"

export function BiddingArena({ session, currentUser, deadIds, winnerUser }: any) {
  const router = useRouter()
  const [bidAmount, setBidAmount] = useState("")
  const [isWhiteTicket, setIsWhiteTicket] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sphereLoading, setSphereLoading] = useState(false)

  const isAdmin = currentUser.role === "ADMIN"
  const isLiving = !deadIds.includes(currentUser.id)
  const myBid = session.bids.find((b: any) => b.userId === currentUser.id)

  const maxBid = (session.huiGroup.amount * session.huiGroup.maxBidPercentage) / 100

  // Real-time polling
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 3000)
    return () => clearInterval(interval)
  }, [router])

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

  const handlePickSphere = async () => {
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

  const formatVND = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

  const renderBiddingState = () => (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Form nhập giá */}
        {isLiving && !myBid && (
          <Card className="border-indigo-100 shadow-lg bg-white/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Bỏ Thăm Kêu Hụi</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBidSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Số tiền kêu (Tối đa: {formatVND(maxBid)})</Label>
                  <Input 
                    type="number" 
                    value={bidAmount} 
                    onChange={e => {
                      setBidAmount(e.target.value)
                      setIsWhiteTicket(false)
                    }} 
                    placeholder="VD: 150000"
                    disabled={isWhiteTicket}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="whiteTicket" 
                    checked={isWhiteTicket} 
                    onChange={e => {
                      setIsWhiteTicket(e.target.checked)
                      if(e.target.checked) setBidAmount("")
                    }}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="whiteTicket" className="text-muted-foreground">Tôi bỏ Phiếu Trắng (Không kêu)</Label>
                </div>
                <Button type="submit" disabled={loading || (!bidAmount && !isWhiteTicket)} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600">
                  Xác nhận Bỏ Thăm
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Trạng thái của mình */}
        {myBid && (
          <Card className="border-emerald-100 shadow-lg bg-emerald-50/50 backdrop-blur-md">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center h-full">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
              <h3 className="text-xl font-bold text-emerald-700">Đã gửi thăm thành công!</h3>
              <p className="text-emerald-600/80 mt-2">
                Bạn đã kêu: {myBid.isWhiteTicket ? "Phiếu Trắng" : formatVND(myBid.amount)}
              </p>
              <p className="text-sm text-emerald-600/60 mt-4">Đang chờ những người khác...</p>
            </CardContent>
          </Card>
        )}

        {/* Danh sách người đã bỏ */}
        <Card className="border-indigo-100 shadow-lg bg-white/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Tiến độ Bỏ Thăm</CardTitle>
            {isAdmin && (
              <Button onClick={handleCloseBidding} disabled={loading} size="sm" variant="destructive">
                Chốt Kết Quả Ngay
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {session.huiGroup.huiMembers.filter((hm:any) => !deadIds.includes(hm.userId)).map((hm: any) => {
                const hasBid = session.bids.some((b: any) => b.userId === hm.userId)
                return (
                  <div key={hm.userId} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border">
                    <span className="font-medium">{hm.user.fullName}</span>
                    {hasBid ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><Check className="w-3 h-3 mr-1"/> Đã bỏ thăm</Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-400"><CircleDashed className="w-3 h-3 mr-1 animate-spin"/> Đang chờ</Badge>
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

    return (
      <div className="flex flex-col items-center py-10 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent animate-pulse">
            Vòng Bốc Thăm May Mắn!
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Có {data.tiedUserIds.length} người cùng kêu giá cao nhất. Những người này cần chọn 1 quả cầu, ai mở ra số lớn nhất sẽ hốt hụi!
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          <AnimatePresence>
            {data.tiedUserIds.map((uid: string) => {
              const u = session.bids.find((b:any)=>b.userId === uid)?.user
              const num = data.selected[uid]
              const isMe = uid === currentUser.id

              return (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  key={uid}
                  className="flex flex-col items-center"
                >
                  <button 
                    disabled={!isMe || haveIPicked}
                    onClick={handlePickSphere}
                    className={`
                      relative w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold shadow-2xl transition-all
                      ${num ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:scale-110 cursor-pointer'}
                      ${(!isMe && !num) && 'opacity-50 cursor-not-allowed'}
                    `}
                  >
                    {num ? num : "?"}
                    {sphereLoading && isMe && !num && <CircleDashed className="absolute w-8 h-8 animate-spin" />}
                  </button>
                  <span className="mt-4 font-semibold">{isMe ? "Bạn" : u?.fullName}</span>
                  <span className="text-xs text-muted-foreground">{num ? "Đã chọn" : "Đang chờ..."}</span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  const renderDoneState = () => {
    const myPayment = session.payments.find((p:any) => p.userId === currentUser.id)
    // Tự sinh URL VietQR
    const qrUrl = winnerUser?.bankName && winnerUser?.bankAccountNumber && myPayment 
      ? `https://img.vietqr.io/image/${winnerUser.bankName}-${winnerUser.bankAccountNumber}-compact2.jpg?amount=${myPayment.amountToPay}&addInfo=Hui%20Ky%20${session.sessionNumber}`
      : null

    return (
      <div className="space-y-6">
        <Card className="border-amber-200 bg-amber-50 shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy className="w-32 h-32" />
          </div>
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-amber-700 mb-2">🎉 Chúc mừng {winnerUser?.fullName} đã hốt hụi!</h2>
            <div className="grid grid-cols-2 gap-4 mt-6 text-amber-900">
              <div>
                <p className="text-sm opacity-80">Số tiền kêu (Bỏ thăm)</p>
                <p className="text-xl font-bold">{formatVND(session.bidAmount)}</p>
              </div>
              <div>
                <p className="text-sm opacity-80">Tổng thực nhận</p>
                <p className="text-xl font-bold text-emerald-600">{formatVND(session.winnerReceivedAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {myPayment && (
          <Card className="border-indigo-100 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><QrCode className="mr-2" /> Thanh toán cho Người hốt</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-8 items-center justify-center">
              {qrUrl ? (
                <div className="p-4 bg-white rounded-xl shadow-sm border">
                  <img src={qrUrl} alt="QR Code" className="w-64 h-64 object-contain" />
                </div>
              ) : (
                <div className="w-64 h-64 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                  Không có dữ liệu QR
                </div>
              )}
              
              <div className="space-y-4 max-w-sm text-center md:text-left">
                <h3 className="text-lg font-semibold">Thông tin chuyển khoản</h3>
                <div className="space-y-2 text-sm">
                  <p>Người nhận: <span className="font-bold">{winnerUser?.fullName}</span></p>
                  <p>Ngân hàng: <span className="font-bold">{winnerUser?.bankName || "—"}</span></p>
                  <p>Số TK: <span className="font-bold">{winnerUser?.bankAccountNumber || "—"}</span></p>
                  <div className="p-3 bg-indigo-50 rounded-lg text-indigo-700 mt-4 border border-indigo-100">
                    <p className="text-xs mb-1">Số tiền bạn cần đóng kỳ này:</p>
                    <p className="text-2xl font-bold">{formatVND(myPayment.amountToPay)}</p>
                  </div>
                </div>
                <Button className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Xác nhận đã chuyển tiền
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/groups/${session.huiGroupId}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Kỳ Khui Hụi #{session.sessionNumber}</h1>
          <p className="text-muted-foreground text-sm">Dây hụi: {session.huiGroup.name}</p>
        </div>
        <Badge className="ml-auto" variant={session.status === "DONE" ? "default" : "secondary"}>
          {session.status === "BIDDING" && "Đang Kêu Giá"}
          {session.status === "TIE_BREAKER" && "Bốc Thăm"}
          {session.status === "DONE" && "Đã Chốt Kết Quả"}
        </Badge>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={session.status}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {session.status === "BIDDING" && renderBiddingState()}
          {session.status === "TIE_BREAKER" && renderTieBreakerState()}
          {session.status === "DONE" && renderDoneState()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
