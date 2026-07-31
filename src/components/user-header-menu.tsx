"use client"

import { useState, useRef, useEffect } from "react"
import { logoutAction, updateProfileAction } from "@/app/actions/auth"
import { LogOut, Settings, Landmark, CreditCard, User as UserIcon, Check, Upload } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const AVATARS = [
  "🤵", "👩", "👨", "🧑", "👧", "👦", "👵", "👴", 
  "🐼", "🦁", "🐸", "🦊", "🐹", "🐰", "🐻", "🐨"
]

export function UserHeaderMenu({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar || "👤")
  const [fullName, setFullName] = useState(user.fullName || "")
  const [bankName, setBankName] = useState(user.bankName || "")
  const [bankAccountNumber, setBankAccountNumber] = useState(user.bankAccountNumber || "")
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      alert("Họ tên không được để trống")
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
        setIsDialogOpen(false)
        setIsOpen(false)
        // Refresh page to apply changes
        window.location.reload()
      }
    } catch (err) {
      alert("Đã xảy ra lỗi khi cập nhật thông tin")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      await logoutAction()
    }
  }

  const userAvatar = user.avatar || "👤"

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const max_size = 120
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
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7)
        setSelectedAvatar(compressedBase64)
        setLoading(false)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Target User Info */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-100/80 active:scale-[0.98] transition-all cursor-pointer"
      >
        {user.role === "ADMIN" && (
          <span className="text-xs md:text-sm font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 flex items-center gap-1 shadow-sm">
            👑 Admin
          </span>
        )}
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-100 to-violet-100 border border-slate-200/80 flex items-center justify-center text-lg shadow-sm overflow-hidden">
          {userAvatar.startsWith("data:image") ? (
            <img src={userAvatar} alt={user.fullName} className="w-full h-full object-cover" />
          ) : (
            userAvatar
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-150 bg-white/95 backdrop-blur-md p-2 shadow-xl z-50 animate-in fade-in-50 slide-in-from-top-3 duration-200">
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Hồ sơ cá nhân</p>
            <p className="font-bold text-slate-800 text-sm truncate mt-0.5">{user.fullName}</p>
            <p className="text-[10px] text-slate-500 font-medium font-mono mt-0.5">{user.phone}</p>
          </div>
          
          <button
            onClick={() => {
              setIsDialogOpen(true)
              setIsOpen(false)
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            Chỉnh sửa thông tin
          </button>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            Đăng xuất
          </button>
        </div>
      )}

      {/* Edit Profile Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl border border-slate-200 p-6 bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-indigo-500" />
              Chỉnh sửa thông tin cá nhân
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-5 pt-2">
            
            {/* Choose Avatar Emoji */}
            <div className="space-y-2">
              <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider block">Chọn ảnh đại diện</Label>
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-100 via-indigo-50 to-violet-100 border-2 border-indigo-500/20 flex items-center justify-center text-4xl shadow-md overflow-hidden">
                  {selectedAvatar.startsWith("data:image") ? (
                    <img src={selectedAvatar} alt="Profile Avatar" className="w-full h-full object-cover" />
                  ) : (
                    selectedAvatar
                  )}
                </div>
              </div>

              {/* Real Image Upload Button */}
              <div className="flex justify-center gap-2 mb-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl font-bold text-xs bg-slate-50 relative cursor-pointer"
                  onClick={() => document.getElementById("header-avatar-file-input")?.click()}
                >
                  <Upload className="w-3.5 h-3.5 mr-1 text-slate-500" /> Tải ảnh thật
                </Button>
                <input
                  type="file"
                  id="header-avatar-file-input"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                {selectedAvatar.startsWith("data:image") && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-xs text-red-500 hover:text-red-650 hover:bg-red-50"
                    onClick={() => setSelectedAvatar("👤")}
                  >
                    Xóa ảnh
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-8 gap-2 p-3 bg-slate-50 border rounded-2xl max-h-36 overflow-y-auto">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedAvatar(emoji)}
                    className={`relative w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-white hover:shadow-sm transition-all active:scale-[0.9] cursor-pointer ${
                      selectedAvatar === emoji ? "bg-white border border-indigo-400 ring-2 ring-indigo-400/20" : ""
                    }`}
                  >
                    {emoji}
                    {selectedAvatar === emoji && (
                      <div className="absolute -top-1 -right-1 bg-indigo-500 text-white rounded-full p-0.5 shadow-sm">
                        <Check className="w-2 h-2" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-slate-700 font-bold text-xs uppercase tracking-wider">Họ và tên</Label>
              <Input
                id="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="rounded-xl border-slate-200"
              />
            </div>

            {/* Bank Info */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Thông tin nhận tiền hốt hụi</span>
              
              <div className="space-y-1.5">
                <Label htmlFor="bankName" className="text-slate-600 font-semibold text-xs flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-slate-400" /> Tên ngân hàng
                </Label>
                <Input
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="VD: Vietcombank, Techcombank"
                  className="rounded-xl bg-white border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bankAccountNumber" className="text-slate-600 font-semibold text-xs flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Số tài khoản
                </Label>
                <Input
                  id="bankAccountNumber"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="VD: 102394857..."
                  className="rounded-xl bg-white border-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl font-medium"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-medium px-5"
              >
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
