"use client"

import { useState } from "react"
import { HuiGroup, User } from "@prisma/client"
import { createHuiGroup, deleteHuiGroup } from "../actions/groups"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, PlusCircle, Users, ExternalLink } from "lucide-react"

export function GroupList({ 
  initialGroups, 
  members,
  isAdmin = true 
}: { 
  initialGroups: (HuiGroup & { _count: { huiMembers: number, sessions: number } })[], 
  members: User[],
  isAdmin?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    amount: "1000000",
    cycle: "MONTHLY",
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
    if (selectedUserIds.length < 2) {
      alert("Cần chọn ít nhất 2 thành viên để tạo dây hụi!")
      return
    }
    
    setIsSubmitting(true)
    await createHuiGroup({
      name: formData.name,
      amount: parseFloat(formData.amount),
      cycle: formData.cycle,
      maxBidPercentage: parseFloat(formData.maxBidPercentage),
      startDate: new Date(formData.startDate),
      userIds: selectedUserIds
    })
    
    setIsSubmitting(false)
    setIsOpen(false)
    setFormData({
      name: "",
      amount: "1000000",
      cycle: "MONTHLY",
      maxBidPercentage: "10",
      startDate: new Date().toISOString().split("T")[0]
    })
    setSelectedMemberIds([])
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
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Danh sách Dây Hụi</h2>
          {isAdmin && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <Button onClick={() => setIsOpen(true)} className="bg-gradient-to-r from-indigo-600 to-violet-600"><PlusCircle className="mr-2 h-4 w-4" /> Tạo Dây Hụi Mới</Button>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>Tạo Dây Hụi Mới</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Tên Dây Hụi</Label>
                      <Input id="name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="VD: Hụi 2 Triệu Tháng" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Mệnh giá (VND)</Label>
                      <Input id="amount" type="number" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="2000000" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Chu kỳ mở hụi</Label>
                      <Select value={formData.cycle} onValueChange={(v) => setFormData({...formData, cycle: v || "MONTHLY"})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn chu kỳ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DAILY">Hàng Ngày (Hụi Ngày)</SelectItem>
                          <SelectItem value="WEEKLY">Hàng Tuần (Hụi Tuần)</SelectItem>
                          <SelectItem value="MONTHLY">Hàng Tháng (Hụi Tháng)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="maxBidPercentage">Giới hạn kêu giá tối đa (%)</Label>
                      <Input id="maxBidPercentage" type="number" required value={formData.maxBidPercentage} onChange={(e) => setFormData({...formData, maxBidPercentage: e.target.value})} placeholder="VD: 10 (tương đương 200k cho dây 2tr)" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="startDate">Ngày khui kỳ đầu tiên</Label>
                      <Input id="startDate" type="date" required value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                    </div>

                    <div className="border-t pt-4">
                      <Label className="text-base font-semibold mb-2 block">Chọn Hụi Viên Tham Gia (Đã chọn {selectedUserIds.length} / Tổng {members.length} người)</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto p-2 border rounded-md bg-muted/20">
                        {members.map(user => (
                          <div key={user.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`member-${user.id}`} 
                              checked={selectedUserIds.includes(user.id)}
                              onCheckedChange={() => toggleMember(user.id)}
                            />
                            <Label htmlFor={`member-${user.id}`} className="font-normal cursor-pointer">
                              {user.fullName} ({user.phone})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-indigo-600 to-violet-600">Lưu Dây Hụi</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên Dây Hụi</TableHead>
              <TableHead>Chân Hụi</TableHead>
              <TableHead>Số Phần</TableHead>
              <TableHead>Chu Kỳ</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead className="w-[150px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Chưa có dây hụi nào.
                </TableCell>
              </TableRow>
            ) : (
              initialGroups.map(group => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell>{formatVND(group.amount)}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-muted-foreground">
                      <Users className="mr-1 h-3 w-3" /> {group.totalSlots}
                    </div>
                  </TableCell>
                  <TableCell>
                    {group.cycle === 'MONTHLY' ? 'Hằng tháng' : group.cycle === 'WEEKLY' ? 'Hằng tuần' : group.cycle === 'DAILY' ? 'Hằng ngày' : group.cycle}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      group.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                      group.status === 'RUNNING' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {group.status === 'OPEN' ? 'Đang Mở' : group.status === 'RUNNING' ? 'Đang Chạy' : 'Hoàn Thành'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <a href={`/groups/${group.id}`}>
                        <Button variant="outline" size="sm" type="button">
                          <ExternalLink className="h-4 w-4 mr-1" /> Chi tiết
                        </Button>
                      </a>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(group.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
