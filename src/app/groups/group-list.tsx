"use client"

import { useState, useEffect } from "react"
import { HuiGroup, User, HuiMember } from "@prisma/client"
import { createHuiGroup, deleteHuiGroup, joinHuiGroup, findHuiGroupById, getHuiGroups } from "../actions/groups"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, PlusCircle, Users, ExternalLink, Globe, Lock, UserPlus, Loader2, Search, Compass, ShieldCheck, AlertCircle, CalendarRange, FolderOpen } from "lucide-react"
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
  
  // Realtime & search states
  const [activeTab, setActiveTab] = useState<"my-groups" | "find-groups">("my-groups")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResult, setSearchResult] = useState<GroupWithMembers | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [groupsList, setGroupsList] = useState<GroupWithMembers[]>(initialGroups)

  useEffect(() => {
    setGroupsList(initialGroups)
  }, [initialGroups])

  // Polling data every 4 seconds to make the UI realtime
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const updated = await getHuiGroups()
        setGroupsList(updated as GroupWithMembers[])
      } catch (err) {
        console.error("Lỗi đồng bộ danh sách hụi:", err)
      }
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Auto-search when query is 24 chars (ObjectId)
  useEffect(() => {
    const cleanQuery = searchQuery.trim()
    if (cleanQuery.length === 24) {
      const performIdSearch = async () => {
        setIsSearching(true)
        try {
          const result = await findHuiGroupById(cleanQuery)
          setSearchResult(result as GroupWithMembers | null)
        } catch (e) {
          setSearchResult(null)
        } finally {
          setIsSearching(false)
        }
      }
      performIdSearch()
    } else {
      setSearchResult(null)
    }
  }, [searchQuery])

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
  const myGroups = groupsList.filter(group => {
    if (isAdmin) return true
    return currentUserId ? group.huiMembers.some(m => m.userId === currentUserId) : false
  })

  const publicOpenGroupsFiltered = groupsList.filter(group => {
    const isMember = currentUserId ? group.huiMembers.some(m => m.userId === currentUserId) : false
    const matchesQuery = group.name.toLowerCase().includes(searchQuery.toLowerCase()) || group.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Check if it is public, open, not a member yet, and not passed deadline
    const isOpenAndNotMember = group.isPublic && group.status === "OPEN" && !isMember && !hasPassedJoinDeadline(group.startDate)
    
    if (searchQuery.trim().length === 24) {
      return isOpenAndNotMember // Don't filter list by ID, ID is shown in searchResult card
    }
    return isOpenAndNotMember && matchesQuery
  })

  return (
    <Card className="border border-slate-200/60 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.03)] rounded-2xl overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex p-1 bg-slate-100/80 backdrop-blur-sm rounded-xl border border-slate-200/30">
              <button
                onClick={() => setActiveTab("my-groups")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "my-groups"
                    ? "bg-white text-indigo-600 shadow-[0_2px_8px_rgba(99,102,241,0.15)]"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                Dây hụi của tôi
              </button>
              <button
                onClick={() => setActiveTab("find-groups")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "find-groups"
                    ? "bg-white text-indigo-600 shadow-[0_2px_8px_rgba(99,102,241,0.15)]"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                Tìm dây hụi
              </button>
            </div>
          </div>
          {isAdmin && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <Button onClick={() => setIsOpen(true)} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-md transition-all active:scale-[0.98] w-full sm:w-auto">
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

        {activeTab === "my-groups" && (
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
                {myGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-400 font-medium">
                      Bạn chưa tham gia dây hụi nào. Hãy chuyển sang tab "Tìm dây hụi" để đăng ký!
                    </TableCell>
                  </TableRow>
                ) : (
                  myGroups.map(group => {
                    const isMember = currentUserId ? group.huiMembers.some(m => m.userId === currentUserId) : false
                    return (
                      <TableRow key={group.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-bold text-slate-800">
                          <div>{group.name}</div>
                          <div className="text-[10px] text-slate-400 font-medium mt-1 font-mono">
                            ID: {group.id}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
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
        )}

        {activeTab === "find-groups" && (
          <div className="space-y-6">
            {/* Search input section */}
            <div className="p-5 bg-gradient-to-br from-indigo-50/40 via-purple-50/20 to-slate-50 border border-indigo-100/50 rounded-2xl">
              <div className="flex flex-col gap-2">
                <Label htmlFor="search-input" className="text-slate-800 font-bold text-sm">Tìm kiếm Dây Hụi</Label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nhập ID dây hụi (24 ký tự) hoặc Tên dây hụi..."
                    className="pl-10 pr-4 py-5 rounded-xl bg-white border-slate-200 focus-visible:ring-indigo-500 shadow-sm text-sm"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => { setSearchQuery(""); setSearchResult(null); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-all"
                    >
                      Xóa
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-indigo-600/80 font-semibold mt-1">
                  💡 Hệ thống sẽ tự động quét khi bạn nhập đủ 24 ký tự ID dây hụi. Hoặc bạn có thể gõ tên để lọc nhanh danh sách bên dưới.
                </p>
              </div>
            </div>

            {/* ID lookup status */}
            {isSearching && (
              <div className="flex flex-col items-center justify-center p-10 border border-slate-100 bg-slate-50/50 rounded-2xl">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-xs font-semibold text-slate-500 mt-2">Đang tìm dây hụi theo ID...</span>
              </div>
            )}

            {!isSearching && searchQuery.trim().length === 24 && !searchResult && (
              <div className="flex flex-col items-center justify-center p-8 border border-rose-100 bg-rose-50/20 rounded-2xl text-center">
                <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
                <span className="text-sm font-bold text-rose-800">Không tìm thấy dây hụi nào</span>
                <p className="text-xs text-rose-600/80 mt-1">Mã ID này không tồn tại trong cơ sở dữ liệu. Hãy xác minh lại từ Admin.</p>
              </div>
            )}

            {/* Search Result Card */}
            {!isSearching && searchResult && (
              <div className="p-6 border-2 border-indigo-500/20 bg-indigo-50/10 rounded-2xl relative overflow-hidden shadow-[0_8px_30px_rgb(99,102,241,0.04)]">
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-bold px-3 py-1.5 rounded-bl-xl uppercase tracking-wider">
                  Kết quả ID
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">{searchResult.name}</h3>
                <p className="text-[10px] font-mono text-slate-400 font-semibold">ID: {searchResult.id}</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mt-4">
                  <div className="space-y-1">
                    <span className="text-slate-400 font-semibold">Mệnh giá:</span>
                    <p className="font-bold text-indigo-600">{formatVND(searchResult.amount)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-semibold">Số chân hụi:</span>
                    <p className="font-semibold text-slate-700">{searchResult.huiMembers.length} / {searchResult.totalSlots}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-semibold">Chu kỳ:</span>
                    <p className="font-semibold text-slate-700">
                      {searchResult.cycle === 'MONTHLY' ? 'Hằng tháng' : 
                       searchResult.cycle === 'WEEKLY' ? 'Hằng tuần' : 
                       searchResult.cycle === 'DAILY' ? 'Hằng ngày' : `Ngày ${searchResult.biddingDays} hàng tháng`}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-semibold">Trạng thái:</span>
                    <div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        searchResult.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        searchResult.status === 'RUNNING' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 
                        'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {searchResult.status === 'OPEN' ? 'Đang tuyển' : searchResult.status === 'RUNNING' ? 'Đang Khui' : 'Hoàn Thành'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-6 pt-4 border-t border-slate-100">
                  <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
                    <CalendarRange className="w-3.5 h-3.5 text-slate-400" />
                    <span>Hạn chốt tham gia: {formatDate(getJoinDeadlineDate(searchResult.startDate))}</span>
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    {currentUserId && searchResult.huiMembers.some(m => m.userId === currentUserId) ? (
                      <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border border-indigo-200 py-1.5 px-3 rounded-lg text-xs font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Đã tham gia
                      </Badge>
                    ) : searchResult.status === "OPEN" && !hasPassedJoinDeadline(searchResult.startDate) ? (
                      <Button 
                        onClick={() => handleJoin(searchResult.id)} 
                        disabled={joiningGroupId === searchResult.id}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                      >
                        {joiningGroupId === searchResult.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <UserPlus className="h-4 w-4 mr-1" />
                        )}
                        Tham gia ngay
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="py-1.5 px-3 text-xs text-slate-500 rounded-lg">
                        Đăng ký đã đóng
                      </Badge>
                    )}
                    <a href={`/groups/${searchResult.id}`}>
                      <Button variant="outline" size="sm" className="rounded-lg border-slate-200">
                        Chi tiết
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Public list */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 flex items-center gap-2 uppercase tracking-wider">
                <Globe className="w-4 h-4 text-emerald-500 animate-pulse" />
                Dây hụi công khai đang mở ({publicOpenGroupsFiltered.length})
              </h3>
              
              {publicOpenGroupsFiltered.length === 0 ? (
                <div className="p-8 border border-slate-100 rounded-2xl bg-slate-50/50 text-center">
                  <span className="text-xs font-medium text-slate-400">Không tìm thấy dây hụi công khai nào mở đăng ký.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {publicOpenGroupsFiltered.map(group => {
                    const deadline = getJoinDeadlineDate(group.startDate)
                    return (
                      <div key={group.id} className="p-5 border border-slate-200/60 hover:border-indigo-200/80 bg-white hover:bg-indigo-50/5 hover:shadow-md rounded-2xl transition-all duration-300 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{group.name}</h4>
                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">Mở</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mt-3">
                            <div>Mệnh giá: <span className="font-bold text-indigo-600">{formatVND(group.amount)}</span></div>
                            <div>Số chân: <span className="font-semibold text-slate-800">{group.huiMembers.length} / {group.totalSlots}</span></div>
                            <div className="col-span-2 text-[10px] text-slate-400 font-semibold mt-1 flex items-center gap-1">
                              <CalendarRange className="w-3 h-3 text-slate-400" />
                              <span>Hạn chốt: <span className="text-rose-500">{formatDate(deadline)}</span></span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2">
                          <Button 
                            onClick={() => handleJoin(group.id)} 
                            disabled={joiningGroupId === group.id}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs"
                          >
                            {joiningGroupId === group.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                            ) : (
                              <UserPlus className="h-3.5 w-3.5 mr-1" />
                            )}
                            Tham gia
                          </Button>
                          <a href={`/groups/${group.id}`}>
                            <Button variant="outline" size="sm" className="rounded-lg border-slate-200 text-xs">Chi tiết</Button>
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
