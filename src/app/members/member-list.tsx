"use client"

import { useState } from "react"
import { Member } from "@prisma/client"
import { createMember, deleteMember } from "../actions/members"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, UserPlus } from "lucide-react"

// Danh sách ngân hàng cơ bản ở VN
const banks = [
  "Vietcombank", "Techcombank", "MBBank", "ACB", "VietinBank", 
  "BIDV", "Agribank", "VPBank", "TPBank", "Sacombank", "VIB"
]

export function MemberList({ initialMembers }: { initialMembers: Member[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    bankName: "",
    bankAccountNumber: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await createMember(formData)
    setIsSubmitting(false)
    setIsOpen(false)
    setFormData({ fullName: "", phone: "", bankName: "", bankAccountNumber: "" })
  }

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa thành viên này?")) {
      await deleteMember(id)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-end mb-4">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <Button onClick={() => setIsOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> Thêm Thành Viên</Button>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Thêm Thành Viên Mới</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Họ và tên</Label>
                    <Input id="fullName" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Nguyễn Văn A" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input id="phone" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="0901234567" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Ngân hàng (Để nhận tiền hốt hụi)</Label>
                    <Select value={formData.bankName} onValueChange={(v) => setFormData({...formData, bankName: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn ngân hàng" />
                      </SelectTrigger>
                      <SelectContent>
                        {banks.map(bank => (
                          <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bankAccountNumber">Số tài khoản</Label>
                    <Input id="bankAccountNumber" value={formData.bankAccountNumber} onChange={(e) => setFormData({...formData, bankAccountNumber: e.target.value})} placeholder="Nhập số tài khoản" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
                  <Button type="submit" disabled={isSubmitting}>Lưu Thành Viên</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Họ Tên</TableHead>
              <TableHead>Số Điện Thoại</TableHead>
              <TableHead>Ngân Hàng</TableHead>
              <TableHead>Số Tài Khoản</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Chưa có thành viên nào.
                </TableCell>
              </TableRow>
            ) : (
              initialMembers.map(member => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.fullName}</TableCell>
                  <TableCell>{member.phone}</TableCell>
                  <TableCell>{member.bankName || "—"}</TableCell>
                  <TableCell>{member.bankAccountNumber || "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(member.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
