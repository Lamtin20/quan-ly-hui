"use client"

import { useState } from "react"
import { HuiGroup, HuiMember, HuiSession, Member, Payment } from "@prisma/client"
import { createSessionAndBidding } from "../../actions/sessions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { QrCode, PlayCircle, CheckCircle2 } from "lucide-react"

type FullGroup = HuiGroup & {
  huiMembers: (HuiMember & { member: Member })[]
  sessions: (HuiSession & {
    payments: (Payment & { member: Member })[]
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

export function GroupDetail({ initialGroup }: { initialGroup: FullGroup }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [qrPayment, setQrPayment] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    winnerMemberId: "",
    bidAmount: "0"
  })

  // Tìm người chưa hốt (Hụi Sống)
  const deadMemberIds = initialGroup.sessions.map(s => s.winnerMemberId).filter(Boolean) as string[]
  const livingMembers = initialGroup.huiMembers.filter(hm => !deadMemberIds.includes(hm.memberId))

  const maxBid = (initialGroup.amount * initialGroup.maxBidPercentage) / 100

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.winnerMemberId) {
      alert("Vui lòng chọn người hốt hụi!")
      return
    }
    const bidNum = parseFloat(formData.bidAmount)
    if (bidNum > maxBid) {
      alert(`Giá kêu không được vượt quá ${initialGroup.maxBidPercentage}% (${formatVND(maxBid)})`)
      return
    }

    try {
      setIsSubmitting(true)
      await createSessionAndBidding({
        groupId: initialGroup.id,
        winnerMemberId: formData.winnerMemberId,
        bidAmount: bidNum
      })
      setIsOpen(false)
      setFormData({ winnerMemberId: "", bidAmount: "0" })
    } catch (error: any) {
      alert(error.message || "Đã xảy ra lỗi!")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const getWinnerInfo = (memberId: string | null) => {
    if (!memberId) return null
    return initialGroup.huiMembers.find(hm => hm.memberId === memberId)?.member
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Nút Khui Hụi */}
      {initialGroup.status !== "FINISHED" && (
        <div className="flex justify-end">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsOpen(true)}>
              <PlayCircle className="mr-2 h-5 w-5" /> Khui Hụi Kỳ {initialGroup.sessions.length + 1}
            </Button>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Khui Hụi Kỳ {initialGroup.sessions.length + 1}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="bg-amber-50 p-3 rounded-md border border-amber-200 mb-2">
                    <p className="text-sm text-amber-800">
                      <strong>Quy định đấu thầu:</strong> Tối đa kêu {initialGroup.maxBidPercentage}% = {formatVND(maxBid)}
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Người kêu trúng (Hốt hụi)</Label>
                    <Select value={formData.winnerMemberId} onValueChange={(v) => setFormData({...formData, winnerMemberId: v || ""})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn người thắng" />
                      </SelectTrigger>
                      <SelectContent>
                        {livingMembers.map(hm => (
                          <SelectItem key={hm.member.id} value={hm.member.id}>
                            {hm.member.fullName} - {hm.member.phone}
                          </SelectItem>
                        ))}
                        {livingMembers.length === 0 && (
                          <SelectItem value="empty" disabled>Đã hốt hết!</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bidAmount">Giá kêu (Thấp nhất là 0, Max là {formatVND(maxBid)})</Label>
                    <Input id="bidAmount" type="number" required max={maxBid} min={0} value={formData.bidAmount} onChange={(e) => setFormData({...formData, bidAmount: e.target.value})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
                  <Button type="submit" disabled={isSubmitting || livingMembers.length === 0}>Xác nhận chốt hụi</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Danh sách các kỳ hụi đã qua */}
      <div className="grid gap-4">
        <h2 className="text-xl font-semibold mt-4">Lịch sử khui hụi</h2>
        {initialGroup.sessions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Chưa có kỳ hụi nào được khui. Hãy bấm "Khui Hụi" để bắt đầu kỳ đầu tiên!
            </CardContent>
          </Card>
        ) : (
          initialGroup.sessions.map(session => {
            const winner = getWinnerInfo(session.winnerMemberId)
            return (
              <Card key={session.id} className="overflow-hidden">
                <div className="bg-muted px-4 py-3 border-b flex justify-between items-center">
                  <div className="font-semibold flex items-center">
                    <Badge variant="default" className="mr-2">Kỳ {session.sessionNumber}</Badge>
                    <span>Người hốt: <span className="text-primary">{winner?.fullName}</span></span>
                  </div>
                  <div className="text-sm">
                    Kêu giá: <span className="font-bold text-red-600">{formatVND(session.bidAmount)}</span> | 
                    Thực nhận: <span className="font-bold text-green-600 ml-1">{formatVND(session.winnerReceivedAmount)}</span>
                  </div>
                </div>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="pl-4">Người phải đóng</TableHead>
                        <TableHead>Loại Hụi</TableHead>
                        <TableHead>Số tiền</TableHead>
                        <TableHead>Thanh toán (VietQR)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {session.payments.map(payment => (
                        <TableRow key={payment.id}>
                          <TableCell className="pl-4 font-medium">{payment.member.fullName}</TableCell>
                          <TableCell>
                            {payment.isDead ? (
                              <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">Hụi Chết</Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">Hụi Sống</Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">{formatVND(payment.amountToPay)}</TableCell>
                          <TableCell>
                            {winner?.bankName && winner?.bankAccountNumber ? (
                              <Dialog>
                                <DialogTrigger>
                                  <Button variant="outline" size="sm" className="h-8" type="button">
                                    <QrCode className="w-4 h-4 mr-1"/> Hiện QR
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md flex flex-col items-center p-8">
                                  <DialogHeader>
                                    <DialogTitle className="text-center mb-4">Quét mã chuyển tiền cho {winner.fullName}</DialogTitle>
                                  </DialogHeader>
                                  <div className="bg-white p-4 rounded-xl shadow-sm border mb-4">
                                    {/* VietQR Integration */}
                                    <img 
                                      src={`https://img.vietqr.io/image/${getBankBin(winner.bankName)}-${winner.bankAccountNumber}-compact2.png?amount=${payment.amountToPay}&addInfo=Dong hui ky ${session.sessionNumber} cho ${winner.fullName}`}
                                      alt="VietQR"
                                      className="w-64 h-64 object-contain"
                                    />
                                  </div>
                                  <div className="text-center text-sm space-y-1">
                                    <p>Ngân hàng: <strong>{winner.bankName}</strong></p>
                                    <p>STK: <strong>{winner.bankAccountNumber}</strong></p>
                                    <p>Số tiền: <strong className="text-red-600">{formatVND(payment.amountToPay)}</strong></p>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <span className="text-xs text-muted-foreground">Người hốt chưa có STK</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

    </div>
  )
}
