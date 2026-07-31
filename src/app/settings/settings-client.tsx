"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Settings, 
  Upload, 
  Bell, 
  Smartphone, 
  ShieldAlert, 
  UserCog, 
  Check, 
  Sparkles,
  SmartphoneNfc,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { updateProfileAction, updateUserRoleAction } from "@/app/actions/auth"

export function SettingsClient({ currentUser, allUsers }: { currentUser: any, allUsers: any[] }) {
  const [fullName, setFullName] = useState(currentUser.fullName || "")
  const [bankName, setBankName] = useState(currentUser.bankName || "")
  const [bankAccountNumber, setBankAccountNumber] = useState(currentUser.bankAccountNumber || "")
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser.avatar || "👤")
  
  const [loading, setLoading] = useState(false)
  const [roleLoading, setRoleLoading] = useState<string | null>(null)
  const [notificationPermission, setNotificationPermission] = useState("default")

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  // Auto-resize and convert image to lightweight Base64 Jpeg
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const max_size = 120 // keep it extremely compact for fast loads
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > max_size) {
            height *= max_size / width
            width = max_size
          }
        } else {
          if (height > max_size) {
            width *= max_size / height
            height = max_size
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        ctx?.drawImage(img, 0, 0, width, height)
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7) // 70% quality
        setSelectedAvatar(compressedBase64)
        setLoading(false)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      alert("Họ và tên không được để trống")
      return
    }
    setLoading(true)
    const formData = new FormData()
    formData.append("fullName", fullName)
    formData.append("avatar", selectedAvatar)
    formData.append("bankName", bankName)
    formData.append("bankAccountNumber", bankAccountNumber)

    try {
      const res = await updateProfileAction(formData)
      if (res.error) {
        alert(res.error)
      } else {
        alert("Cập nhật thông tin cấu hình thành công!")
        window.location.reload()
      }
    } catch (err) {
      alert("Lỗi khi cập nhật hồ sơ")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "ADMIN" ? "MEMBER" : "ADMIN"
    if (confirm(`Bạn có chắc muốn chuyển vai trò người này thành ${newRole === "ADMIN" ? "Quản trị viên" : "Thành viên"}?`)) {
      setRoleLoading(userId)
      try {
        await updateUserRoleAction(userId, newRole)
        alert("Thay đổi vai trò thành công!")
        window.location.reload()
      } catch (err: any) {
        alert(err.message)
      } finally {
        setRoleLoading(null)
      }
    }
  }

  const requestNotificationPermission = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission().then((permission) => {
        setNotificationPermission(permission)
        if (permission === "granted") {
          new Notification("Hệ thống Hụi", {
            body: "Thông báo đẩy đã được kích hoạt thành công trên thiết bị!",
            icon: "/globe.svg"
          })
        }
      })
    } else {
      alert("Trình duyệt này không hỗ trợ thông báo đẩy.")
    }
  }

  const triggerTestNotification = () => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification("Thông báo thử nghiệm 🔔", {
        body: "Hệ thống thông báo đẩy hoạt động bình thường trên thiết bị di động của bạn!",
        tag: "test-notification"
      })
    } else {
      alert("Vui lòng cho phép quyền thông báo trước khi thử nghiệm.")
    }
  }

  const isBase64Avatar = selectedAvatar.startsWith("data:image")

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      
      {/* Page Header */}
      <div className="bg-white/70 backdrop-blur-md border border-slate-200/50 p-6 rounded-3xl shadow-sm flex items-center gap-3">
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800">Cấu hình Hệ thống</h1>
          <p className="text-slate-500 text-xs font-semibold">Quản lý hồ sơ, quyền hạn và tính năng ứng dụng PWA</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Profile Card */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-indigo-100/60 shadow-lg bg-white/95 rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" /> Hồ sơ và Avatar
              </CardTitle>
              <CardDescription className="text-xs">Đổi họ tên, thông tin chuyển khoản và ảnh đại diện thật của bạn.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-5">
                
                {/* Avatar Uploader */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-100 to-violet-100 border-2 border-indigo-400/20 flex items-center justify-center text-4xl shadow-md overflow-hidden">
                      {isBase64Avatar ? (
                        <img src={selectedAvatar} alt="Profile Avatar" className="w-full h-full object-cover" />
                      ) : (
                        selectedAvatar
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 flex-1 w-full text-center sm:text-left">
                    <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider block">Ảnh Đại Diện Thực</Label>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl font-bold text-xs bg-white relative cursor-pointer active:scale-[0.98] transition-all"
                        onClick={() => document.getElementById("avatar-file-input")?.click()}
                      >
                        <Upload className="w-3.5 h-3.5 mr-1 text-slate-500" /> Tải ảnh lên
                      </Button>
                      <input
                        type="file"
                        id="avatar-file-input"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      {isBase64Avatar && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="rounded-xl text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setSelectedAvatar("👤")}
                        >
                          Xóa ảnh
                        </Button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">Hỗ trợ các file hình ảnh JPG, PNG. Ảnh sẽ được tự động tối ưu hóa dung lượng cực nhỏ.</p>
                  </div>
                </div>

                {/* Personal Inputs */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="fullName" className="text-slate-650 font-bold text-xs uppercase tracking-wider">Họ và tên</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="rounded-xl border-slate-200"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="bankName" className="text-slate-650 font-bold text-xs uppercase tracking-wider">Tên Ngân Hàng</Label>
                      <Input
                        id="bankName"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="VD: Vietcombank"
                        className="rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="bankAccountNumber" className="text-slate-650 font-bold text-xs uppercase tracking-wider">Số Tài Khoản</Label>
                      <Input
                        id="bankAccountNumber"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        placeholder="VD: 048123985"
                        className="rounded-xl border-slate-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold px-6 shadow-sm"
                  >
                    {loading ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Notifications & PWA Card */}
        <div className="space-y-6">
          
          {/* Notification Card */}
          <Card className="border-indigo-100/60 shadow-lg bg-white/95 rounded-3xl overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-500" /> Thông báo Đẩy
              </CardTitle>
              <CardDescription className="text-xs">Thông báo về điện thoại khi có kỳ khui hụi mới.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-slate-50 border rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-700">Trạng thái quyền</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{notificationPermission.toUpperCase()}</p>
                </div>
                {notificationPermission === "granted" ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[9px] font-bold"><CheckCircle2 className="w-3 h-3 mr-1 inline"/> Cho phép</Badge>
                ) : notificationPermission === "denied" ? (
                  <Badge className="bg-red-50 text-red-700 border border-red-100 rounded-lg text-[9px] font-bold"><AlertCircle className="w-3 h-3 mr-1 inline"/> Bị từ chối</Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-500 border-amber-200 rounded-lg text-[9px] font-bold">Chờ cấp quyền</Badge>
                )}
              </div>

              {notificationPermission !== "granted" ? (
                <Button
                  onClick={requestNotificationPermission}
                  className="w-full py-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold text-xs border border-indigo-200 shadow-sm"
                >
                  Yêu cầu kích hoạt thông báo
                </Button>
              ) : (
                <Button
                  onClick={triggerTestNotification}
                  className="w-full py-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs border border-emerald-200 shadow-sm"
                >
                  ⚡ Thử nghiệm thông báo đẩy
                </Button>
              )}
            </CardContent>
          </Card>

          {/* PWA iPhone Install Card */}
          <Card className="border-indigo-100/60 shadow-lg bg-white/95 rounded-3xl overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-500" /> Cài đặt ứng dụng (PWA)
              </CardTitle>
              <CardDescription className="text-xs">Hướng dẫn cài làm Mini App trên màn hình chính.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs text-slate-600">
              <div className="flex gap-2">
                <div className="w-5 h-5 bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center rounded-lg text-[10px]">1</div>
                <p className="flex-1">Trên **iPhone (iOS)**, mở trang này bằng trình duyệt **Safari**.</p>
              </div>
              <div className="flex gap-2">
                <div className="w-5 h-5 bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center rounded-lg text-[10px]">2</div>
                <p className="flex-1">Bấm vào biểu tượng **Chia sẻ (Share)** ở thanh công cụ dưới cùng.</p>
              </div>
              <div className="flex gap-2">
                <div className="w-5 h-5 bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center rounded-lg text-[10px]">3</div>
                <p className="flex-1">Chọn **"Thêm vào MH chính" (Add to Home Screen)**.</p>
              </div>
              <p className="text-[10px] text-slate-400 bg-slate-50 border p-2 rounded-xl">📱 Trên Android: Bấm vào dấu 3 chấm góc phải trình duyệt Chrome và chọn "Cài đặt ứng dụng".</p>
            </CardContent>
          </Card>

        </div>

      </div>

      {/* Admin Panel: Permissions & User Roles */}
      {currentUser.role === "ADMIN" && (
        <Card className="border-indigo-100/60 shadow-lg bg-white/95 rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <UserCog className="w-5 h-5 text-indigo-500" /> Quản Lý Quyền Thành Viên (Admin)
            </CardTitle>
            <CardDescription className="text-xs">Chỉ Admin mới có quyền truy cập. Nâng cấp hoặc thu hồi quyền quản trị của người chơi.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {allUsers.map((u) => {
                const isMe = u.id === currentUser.id
                return (
                  <div key={u.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border">
                        {u.avatar && u.avatar.startsWith("data:image") ? (
                          <img src={u.avatar} alt={u.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg">{u.avatar || "👤"}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          {u.fullName}
                          {isMe && <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 rounded-lg text-[9px]">Bạn</Badge>}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{u.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={`rounded-xl text-[10px] font-bold px-2 py-0.5 border ${
                        u.role === "ADMIN" ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-100 text-slate-600 border-slate-250'
                      }`}>
                        {u.role === "ADMIN" ? "Admin" : "Thành viên"}
                      </Badge>
                      
                      {!isMe && (
                        <Button
                          disabled={roleLoading === u.id}
                          onClick={() => handleToggleRole(u.id, u.role)}
                          variant="outline"
                          size="sm"
                          className="h-8 border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl font-bold text-xs"
                        >
                          {roleLoading === u.id ? "Đang xử lý..." : u.role === "ADMIN" ? "Hạ quyền" : "Lên Admin"}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
