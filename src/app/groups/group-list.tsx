"use client"

import { useState } from "react"
import { HuiGroup, User, HuiMember } from "@prisma/client"
import { createHuiGroup, deleteHuiGroup, joinHuiGroup } from "../actions/groups"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, PlusCircle, Users, ExternalLink, Globe, Lock, UserPlus, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { hasPassedJoinDeadline, getJoinDeadlineDate, formatDate } from "@/lib/utils"

type GroupWithMembers = HuiGroup & {
  huiMembers: HuiMember[]
  _count: { huiMembers: number, sessions: number }
}

export function GroupList({ 
  initialGroups, 
  members,
  isAdmin = true,
  currentUserId
}: { 
  initialGroups: GroupWithMembers[], 
  members: User[],
  isAdmin?: boolean,
  currentUserId?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    amount: "1000000",
    cycle: "MONTHLY",
    biddingDays: "5, 20",
    isPublic: false,
    maxBidPercentage: "10",
    startDate: new Date().toISOString().split("T")[0]
  })
  
  const [selectedUserIds, setSelectedMemberIds] = useState<string[]>([])

  const toggleMember = (id: string) => {
    setSelectedMemberIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Non-public groups must have members
    if (!formData.isPublic && selectedUserIds.length < 2) {
      alert("Dây hụi riêng tư cần chọn ít nhất 2 thành viên ban đầu!")
      return
    }
    
    setIsSubmitting(true)
    try {
      await createHuiGroup({
        name: formData.name,
        amount: parseFloat(formData.amount),
        cycle: formData.cycle,
        biddingDays: formData.cycle === "MONTHLY_5_20" ? "5, 20" : (formData.cycle === "CUSTOM" ? formData.biddingDays : undefined),
        isPublic: formData.isPublic,
        maxBidPercentage: parseFloat(formData.maxBidPercentage),
        startDate: new Date(formData.startDate),
        userIds: selectedUserIds
      })
      
      setIsOpen(false)
      setFormData({
        name: "",
        amount: "1000000",
        cycle: "MONTHLY",
        biddingDays: "5, 20",
        isPublic: false,
        maxBidPercentage: "10",
        startDate: new Date().toISOString().split("T")[0]
      })
      setSelectedMemberIds([])
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi khi tạo dây hụi!")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleJoin = async (groupId: string) => {
    try {
      setJoiningGroupId(groupId)
      await joinHuiGroup(groupId)
      alert("Đăng ký tham gia chân hụi thành công!")
    } catch (error: any) {
      alert(error.message || "Lỗi khi đăng ký tham gia hụi!")
    } finally {
      setJoiningGroupId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa dây hụi này? Việc này sẽ xóa toàn bộ các kỳ hụi liên quan!")) {
      await deleteHuiGroup(id)
    }
  }

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  return (
    <Card className="border border-slate-200/60 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.03)] rounded-2xl overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-800">Danh sách Dây Hụi</h2>
          {isAdmin && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <Button onClick={() => setIsOpen(true)} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-md transition-all active:scale-[0.98]">
                <PlusCircle className="mr-2 h-4 w-4" /> Tạo Dây Hụi Mới
              </Button>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900">Tạo Dây Hụi Mới</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="grid gap-2">
                      <Label htmlFor="name" className="text-slate-700 font-semibold">Tên Dây Hụi</Label>
                      <Input id="name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="VD: Hụi 2 Triệu Tháng" className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="amount" className="text-slate-700 font-semibold">Mệnh giá (VND)</Label>
                      <Input id="amount" type="number" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="2000000" className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-slate-700 font-semibold">Chu kỳ mở hụi</Label>
                      <Select value={formData.cycle} onValueChange={(v) => setFormData({...formData, cycle: v || "MONTHLY"})}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Chọn chu kỳ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DAILY">Hàng Ngày (Hụi Ngày)</SelectItem>
                          <SelectItem value="WEEKLY">Hàng Tuần (Hụi Tuần)</SelectItem>
                          <SelectItem value="MONTHLY">Hàng Tháng (Hụi Tháng)</SelectItem>
                          <SelectItem value="MONTHLY_5_20">Ngày 5 & 20 Hàng Tháng (2 kỳ/tháng)</SelectItem>
                          <SelectItem value="CUSTOM">Chọn ngày trong tháng tùy chỉnh</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.cycle === "CUSTOM" && (
                      <div className="grid gap-2 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                        <Label htmlFor="biddingDays" className="text-indigo-900 font-semibold">Các ngày khui hụi trong tháng</Label>
                        <Input id="biddingDays" required value={formData.biddingDays} onChange={(e) => setFormData({...formData, biddingDays: e.target.value})} placeholder="VD: 5, 20 (cách nhau bằng dấu phẩy)" className="rounded-xl bg-white border-indigo-200" />
                        <span className="text-[10px] text-indigo-600 font-medium">Hệ thống sẽ tự sinh lịch khui vào các ngày này hàng tháng dựa theo số thành viên.</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 p-1">
                      <Checkbox 
                        id="isPublic" 
                        checked={formData.isPublic}
                        onCheckedChange={(checked) => setFormData({...formData, isPublic: !!checked})}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="isPublic" className="text-slate-700 font-semibold cursor-pointer">Công khai dây hụi</Label>
                        <p className="text-[10px] text-slate-500 font-medium">Bất kỳ người dùng nào cũng có thể nhìn thấy dây hụi và tự bấm đăng ký tham gia.</p>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="maxBidPercentage" className="text-slate-700 font-semibold">Giới hạn kêu giá tối đa (%)</Label>
                      <Input id="maxBidPercentage" type="number" required value={formData.maxBidPercentage} onChange={(e) => setFormData({...formData, maxBidPercentage: e.target.value})} placeholder="VD: 10" className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="startDate" className="text-slate-700 font-semibold">Ngày khui kỳ đầu tiên</Label>
                      <Input id="startDate" type="date" required value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="rounded-xl" />
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                      <Label className="text-slate-700 font-semibold mb-2 block">Chọn Hụi Viên Ban Đầu (Đã chọn {selectedUserIds.length} người)</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto p-3 border rounded-xl bg-slate-50">
                        {members.map(user => (
                          <div key={user.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`member-${user.id}`} 
                              checked={selectedUserIds.includes(user.id)}
                              onCheckedChange={() => toggleMember(user.id)}
                            />
                            <Label htmlFor={`member-${user.id}`} className="font-normal text-xs text-slate-600 cursor-pointer truncate">
                              {user.fullName}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl">Hủy</Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl">
                      {isSubmitting ? "Đang tạo..." : "Lưu Dây Hụi"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <Table>
            <TableHeader className="bg-slate-50/70">
              <TableRow>
                <TableHead className="font-semibold text-slate-700">Tên Dây Hụi</TableHead>
                <TableHead className="font-semibold text-slate-700">Mệnh Giá</TableHead>
                <TableHead className="font-semibold text-slate-700">Số Chân</TableHead>
                <TableHead className="font-semibold text-slate-700">Chu Kỳ</TableHead>
                <TableHead className="font-semibold text-slate-700">Loại Dây</TableHead>
                <TableHead className="font-semibold text-slate-700">Trạng Thái</TableHead>
                <TableHead className="w-[180px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-400 font-medium">
                    Chưa có dây hụi nào được tìm thấy.
                  </TableCell>
                </TableRow>
              ) : (
                initialGroups.map(group => {
                  const isMember = currentUserId ? group.huiMembers.some(m => m.userId === currentUserId) : false
                  return (
                    <TableRow key={group.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold text-slate-800">
                        <div>{group.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium mt-1">
                          Khui: {formatDate(group.startDate)} | Hạn chốt: {formatDate(getJoinDeadlineDate(group.startDate))}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-indigo-600">{formatVND(group.amount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <Users className="h-3.5 w-3.5 text-slate-400" /> 
                          <span>{group.huiMembers.length} / {group.totalSlots}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 font-medium">
                        {group.cycle === 'MONTHLY' ? 'Hằng tháng' : 
                         group.cycle === 'WEEKLY' ? 'Hằng tuần' : 
                         group.cycle === 'DAILY' ? 'Hằng ngày' : `Ngày ${group.biddingDays} hàng tháng`}
                      </TableCell>
                      <TableCell>
                        {group.isPublic ? (
                          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 shadow-none font-medium gap-1 rounded-lg">
                            <Globe className="h-3 w-3" /> Công khai
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-50 text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-none font-medium gap-1 rounded-lg">
                            <Lock className="h-3 w-3" /> Riêng tư
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          group.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          group.status === 'RUNNING' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {group.status === 'OPEN' ? 'Đang nhận đăng ký' : group.status === 'RUNNING' ? 'Đang Khui' : 'Hoàn Thành'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2 pr-2">
                          {/* Join button for public open groups */}
                          {!isMember && group.isPublic && group.status === "OPEN" && currentUserId && (
                            hasPassedJoinDeadline(group.startDate) ? (
                              <Button 
                                disabled
                                size="sm" 
                                className="bg-slate-100 text-slate-400 border border-slate-200 rounded-lg gap-1 font-medium cursor-not-allowed"
                              >
                                Hết hạn
                              </Button>
                            ) : (
                              <Button 
                                onClick={() => handleJoin(group.id)} 
                                disabled={joiningGroupId === group.id}
                                size="sm" 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1 font-medium"
                              >
                                {joiningGroupId === group.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <UserPlus className="h-3 w-3" />
                                )}
                                Tham gia
                              </Button>
                            )
                          )}
                          
                          {(isMember || isAdmin) && (
                            <a href={`/groups/${group.id}`}>
                              <Button variant="outline" size="sm" className="rounded-lg border-slate-200 hover:bg-slate-50 font-medium text-slate-700">
                                Chi tiết
                              </Button>
                            </a>
                          )}
                          
                          {isAdmin && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(group.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
