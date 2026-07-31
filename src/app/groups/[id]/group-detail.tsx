"use client"

import { useState } from "react"
import { User, HuiGroup, HuiMember, HuiSession, Payment } from "@prisma/client"
import { startNewSession } from "../../actions/sessions"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { QrCode, PlayCircle, ArrowRight, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

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

export function GroupDetail({ initialGroup, isAdmin }: { initialGroup: FullGroup, isAdmin: boolean }) {
  const router = useRouter()
  const [isStarting, setIsStarting] = useState(false)
  
  const deadMemberIds = initialGroup.sessions.map(s => s.winnerUserId).filter(Boolean) as string[]
  const livingMembers = initialGroup.huiMembers.filter(hm => !deadMemberIds.includes(hm.userId))

  const handleStartSession = async () => {
    try {
      setIsStarting(true)
      const sessionId = await startNewSession(initialGroup.id)
      router.push(`/groups/${initialGroup.id}/sessions/${sessionId}`)
    } catch (error: any) {
      alert(error.message || "Đã xảy ra lỗi!")
      setIsStarting(false)
    }
  }

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const getWinnerInfo = (userId: string | null) => {
    if (!userId) return null
    return initialGroup.huiMembers.find(hm => hm.userId === userId)?.user
  }

  const activeSession = initialGroup.sessions.find(s => s.status !== "DONE")

  return (
    <div className="flex flex-col gap-6">
      {activeSession && (
        <Card className="border-rose-200 bg-rose-50 shadow-md">
          <CardContent className="flex flex-col md:flex-row items-center justify-between p-6">
            <div className="flex items-center text-rose-700 mb-4 md:mb-0">
              <AlertCircle className="w-8 h-8 mr-3" />
              <div>
                <h3 className="font-bold text-lg">Đang có kỳ hụi chờ đấu giá (Kỳ {activeSession.sessionNumber})</h3>
                <p className="text-sm opacity-90">Hãy vào kêu giá hoặc chốt kết quả ngay!</p>
              </div>
            </div>
            <Link href={`/groups/${initialGroup.id}/sessions/${activeSession.id}`}>
              <Button className="bg-rose-600 hover:bg-rose-700">Vào Kỳ Hụi <ArrowRight className="ml-2 w-4 h-4" /></Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!activeSession && initialGroup.status !== "FINISHED" && isAdmin && (
        <div className="flex justify-end">
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:scale-105 transition-transform" onClick={handleStartSession} disabled={isStarting}>
            {isStarting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlayCircle className="mr-2 h-5 w-5" />}
            Mở Kỳ Khui Hụi {initialGroup.sessions.length + 1}
          </Button>
        </div>
      )}

      <div className="grid gap-6">
        <h2 className="text-xl font-semibold mt-2">Danh sách kỳ hụi</h2>
        {initialGroup.sessions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <PlayCircle className="w-8 h-8 text-slate-300" />
              </div>
              <p>Chưa có kỳ hụi nào được khui.</p>
            </CardContent>
          </Card>
        ) : (
          initialGroup.sessions.slice().reverse().map(session => {
            const winner = getWinnerInfo(session.winnerUserId)
            return (
              <Card key={session.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-indigo-600 text-white">Kỳ {session.sessionNumber}</Badge>
                      <Badge variant={session.status === "DONE" ? "outline" : "secondary"}>
                        {session.status === "DONE" ? "Đã Hoàn Thành" : "Đang Tiến Hành"}
                      </Badge>
                    </div>
                    {session.status === "DONE" && (
                      <p className="mt-2 text-sm">Người hốt: <span className="font-bold text-indigo-700">{winner?.fullName}</span></p>
                    )}
                  </div>

                  {session.status === "DONE" ? (
                    <div className="text-sm bg-white p-3 rounded-lg border shadow-sm flex flex-col items-end">
                      <span className="text-muted-foreground">Kêu giá: <span className="font-bold text-rose-600">{formatVND(session.bidAmount)}</span></span>
                      <span className="text-muted-foreground mt-1">Thực nhận: <span className="font-bold text-emerald-600">{formatVND(session.winnerReceivedAmount)}</span></span>
                    </div>
                  ) : (
                    <Link href={`/groups/${initialGroup.id}/sessions/${session.id}`}>
                      <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">Chi Tiết Kỳ Hụi <ArrowRight className="w-4 h-4 ml-2"/></Button>
                    </Link>
                  )}
                </div>

                {session.status === "DONE" && (
                  <CardContent className="p-0 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50">
                          <TableHead className="pl-6 w-[200px]">Hụi Viên</TableHead>
                          <TableHead>Loại Hụi</TableHead>
                          <TableHead>Số tiền cần đóng</TableHead>
                          <TableHead className="text-right pr-6">Mã QR Thanh Toán</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {session.payments.map(payment => (
                          <TableRow key={payment.id}>
                            <TableCell className="pl-6 font-medium">{payment.user.fullName}</TableCell>
                            <TableCell>
                              {payment.isDead ? (
                                <Badge variant="destructive" className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200">Hụi Chết</Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Hụi Sống</Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-bold text-slate-700">{formatVND(payment.amountToPay)}</TableCell>
                            <TableCell className="text-right pr-6">
                              {winner?.bankName && winner?.bankAccountNumber ? (
                                <Dialog>
                                  <DialogTrigger>
                                    <Button variant="outline" size="sm" className="h-8 shadow-sm" type="button">
                                      <QrCode className="w-4 h-4 mr-2 text-indigo-600"/> QR Code
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-md flex flex-col items-center p-8">
                                    <DialogHeader>
                                      <DialogTitle className="text-center mb-4">Chuyển Tiền Hụi Kỳ {session.sessionNumber}</DialogTitle>
                                    </DialogHeader>
                                    <div className="bg-white p-4 rounded-xl shadow-md border mb-4">
                                      <img 
                                        src={`https://img.vietqr.io/image/${getBankBin(winner.bankName)}-${winner.bankAccountNumber}-compact2.png?amount=${payment.amountToPay}&addInfo=Hui Ky ${session.sessionNumber}`}
                                        alt="VietQR"
                                        className="w-64 h-64 object-contain"
                                      />
                                    </div>
                                    <div className="text-center text-sm space-y-2 w-full bg-slate-50 p-4 rounded-lg border">
                                      <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Người nhận:</span> <strong className="text-indigo-700">{winner.fullName}</strong></div>
                                      <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Ngân hàng:</span> <strong>{winner.bankName}</strong></div>
                                      <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Số TK:</span> <strong>{winner.bankAccountNumber}</strong></div>
                                      <div className="flex justify-between pt-1"><span className="text-muted-foreground">Số tiền:</span> <strong className="text-rose-600 text-lg">{formatVND(payment.amountToPay)}</strong></div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Chưa cấu hình Ngân Hàng</span>
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
          })
        )}
      </div>
    </div>
  )
}
