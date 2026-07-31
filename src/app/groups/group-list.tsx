"use client"

import { useState } from "react"
import { HuiGroup, Member } from "@prisma/client"
import { createHuiGroup, deleteHuiGroup } from "../actions/groups"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, PlusCircle, Users, ExternalLink } from "lucide-react"

export function GroupList({ 
  initialGroups, 
  members 
}: { 
  initialGroups: (HuiGroup & { _count: { huiMembers: number, sessions: number } })[], 
  members: Member[] 
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
  
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])

  const toggleMember = (id: string) => {
    setSelectedMemberIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedMemberIds.length < 2) {
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
      memberIds: selectedMemberIds
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
        <div className="flex justify-end mb-4">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <Button onClick={() => setIsOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Tạo Dây Hụi Mới</Button>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Tạo Dây Hụi Mới</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Tên dây hụi</Label>
                      <Input id="name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Dây 2 triệu mùng 5" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Chân hụi (Mệnh giá)</Label>
                      <Input id="amount" type="number" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Chu kỳ mở hụi</Label>
                      <Select value={formData.cycle} onValueChange={(v) => setFormData({...formData, cycle: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn chu kỳ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DAILY">Hằng ngày</SelectItem>
                          <SelectItem value="WEEKLY">Hằng tuần</SelectItem>
                          <SelectItem value="MONTHLY">Hằng tháng</SelectItem>
                          <SelectItem value="CUSTOM">Khác (Tùy chỉnh)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="maxBid">Giới hạn kêu giá tối đa (%)</Label>
                      <Input id="maxBid" type="number" step="0.1" required value={formData.maxBidPercentage} onChange={(e) => setFormData({...formData, maxBidPercentage: e.target.value})} />
                    </div>
                    <div className="grid gap-2 col-span-2">
                      <Label htmlFor="startDate">Ngày bắt đầu</Label>
                      <Input id="startDate" type="date" required value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Label className="text-base font-semibold mb-2 block">Chọn Hụi Viên Tham Gia ({selectedMemberIds.length} người)</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto p-2 border rounded-md bg-muted/20">
                      {members.map(member => (
                        <div key={member.id} className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id={`member-${member.id}`} 
                            checked={selectedMemberIds.includes(member.id)}
                            onChange={() => toggleMember(member.id)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <Label htmlFor={`member-${member.id}`} className="font-normal cursor-pointer">
                            {member.fullName} ({member.phone})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
                  <Button type="submit" disabled={isSubmitting}>Tạo Dây Hụi</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/groups/${group.id}`}>
                          <ExternalLink className="h-4 w-4 mr-1" /> Chi tiết
                        </a>
                      </Button>
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
