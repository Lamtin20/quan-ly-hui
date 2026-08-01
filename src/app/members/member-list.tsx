"use client"

import { useState } from "react"
import { User } from "@prisma/client"
import { createMember, deleteMember } from "../actions/members"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash2, UserPlus, Phone, CreditCard, Landmark, Search, User as UserIcon } from "lucide-react"

const banks = [
  "Vietcombank", "Techcombank", "MBBank", "ACB", "VietinBank", 
  "BIDV", "Agribank", "VPBank", "TPBank", "Sacombank", "VIB"
]

export function MemberList({ 
  initialMembers, 
  currentUserRole 
}: { 
  initialMembers: User[], 
  currentUserRole: string 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    bankName: "",
    bankAccountNumber: ""
  })

  const isAdmin = currentUserRole === "ADMIN"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createMember(formData)
      setIsOpen(false)
      setFormData({ fullName: "", phone: "", bankName: "", bankAccountNumber: "" })
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa thành viên này?")) {
      try {
        await deleteMember(id)
      } catch (err: any) {
        alert(err.message)
      }
    }
  }

  // Filter members by search term
  const filteredMembers = initialMembers.filter(m => 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.phone.includes(searchTerm)
  )

  return (
    <div className="space-y-6">
      {/* Search and action bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Tìm theo tên hoặc số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-2xl border-indigo-100 bg-white shadow-sm focus-visible:ring-indigo-500"
          />
        </div>

        {isAdmin && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <Button 
              onClick={() => setIsOpen(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-md font-bold text-sm px-5 py-2.5 flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
            >
              <UserPlus className="h-4 w-4" /> Thêm Thành Viên
            </Button>
            <DialogContent className="max-w-md rounded-3xl border border-slate-200 p-6 bg-white max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-5">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-indigo-500" />
                    Thêm Thành Viên Mới
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-slate-700 font-bold text-xs uppercase tracking-wider">Họ và tên</Label>
                    <Input 
                      id="fullName" 
                      required 
                      value={formData.fullName} 
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
                      placeholder="Nguyễn Văn A" 
                      className="rounded-xl border-slate-200"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-slate-700 font-bold text-xs uppercase tracking-wider">Số điện thoại</Label>
                    <Input 
                      id="phone" 
                      required 
                      value={formData.phone} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                      placeholder="0901234567" 
                      className="rounded-xl border-slate-200"
                    />
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tài khoản nhận tiền (Ngân hàng)</span>
                    
                    <div className="space-y-1.5">
                      <Label className="text-slate-600 font-semibold text-xs flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-slate-400" /> Ngân hàng
                      </Label>
                      <Select value={formData.bankName} onValueChange={(v) => setFormData({...formData, bankName: v || ""})}>
                        <SelectTrigger className="rounded-xl bg-white border-slate-200">
                          <SelectValue placeholder="Chọn ngân hàng" />
                        </SelectTrigger>
                        <SelectContent className="z-[120]">
                          {banks.map(bank => (
                            <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="bankAccountNumber" className="text-slate-600 font-semibold text-xs flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Số tài khoản
                      </Label>
                      <Input 
                        id="bankAccountNumber" 
                        value={formData.bankAccountNumber} 
                        onChange={(e) => setFormData({...formData, bankAccountNumber: e.target.value})} 
                        placeholder="Nhập số tài khoản" 
                        className="rounded-xl bg-white border-slate-200"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl font-medium">Hủy</Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium px-5">
                    {isSubmitting ? "Đang lưu..." : "Lưu Thành Viên"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Grid List for Members */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white/60 backdrop-blur-sm rounded-3xl border border-indigo-50 border-dashed">
            <UserIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-500 text-sm">Không tìm thấy thành viên nào phù hợp.</p>
          </div>
        ) : (
          filteredMembers.map((member) => {
            const memberAvatar = member.avatar || "👤"
            return (
              <Card 
                key={member.id} 
                className="border-indigo-100/50 shadow-sm hover:shadow-md transition-all duration-300 rounded-3xl overflow-hidden bg-white/90 backdrop-blur-sm flex flex-col justify-between"
              >
                <CardContent className="p-5 space-y-4">
                  {/* Top section: Avatar and basic info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-100 to-violet-100 border border-slate-200/80 flex items-center justify-center text-xl shadow-inner overflow-hidden flex-shrink-0">
                        {memberAvatar.startsWith("data:image") ? (
                          <img src={memberAvatar} alt={member.fullName} className="w-full h-full object-cover" />
                        ) : (
                          memberAvatar
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-base leading-snug flex items-center gap-1.5 flex-wrap">
                          {member.fullName}
                        </h4>
                        <div className="flex gap-1.5 mt-1">
                          {member.role === "ADMIN" ? (
                            <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-sm">
                              👑 Chủ hụi
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-50 text-slate-600 border border-slate-100 text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                              👤 Thành viên
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {isAdmin && member.role !== "ADMIN" && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(member.id)}
                        className="text-red-400 hover:text-red-650 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2.5 text-xs text-slate-500 font-semibold">
                      <Phone className="w-3.5 h-3.5 text-indigo-550" />
                      <span>{member.phone || "—"}</span>
                    </div>

                    {/* Bank Info Container */}
                    <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-2xl space-y-1.5">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Landmark className="w-3 h-3 text-slate-400" /> Tài khoản nhận tiền
                      </div>
                      {member.bankName ? (
                        <div className="text-xs font-bold text-slate-700 flex justify-between items-center">
                          <span>{member.bankName}</span>
                          <span className="font-mono text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/50">{member.bankAccountNumber}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Chưa cập nhật thông tin ngân hàng</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
