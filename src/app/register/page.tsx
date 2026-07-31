"use client"

import { useState } from "react"
import { registerAction } from "../actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Coins, Loader2, Phone, User, Landmark, CreditCard } from "lucide-react"
import { useRouter } from "next/navigation"

const banks = ["Vietcombank", "Techcombank", "MBBank", "ACB", "VietinBank", "BIDV", "Agribank", "VPBank", "TPBank", "Sacombank", "VIB"]

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [bankName, setBankName] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      const formData = new FormData(e.currentTarget)
      formData.set("bankName", bankName) // append from state
      
      const res = await registerAction(formData)
      
      if (res?.error) {
        setError(res.error)
        setLoading(false)
      } else if (res?.success) {
        router.push("/")
      } else {
        setError("Không nhận được phản hồi từ hệ thống.")
        setLoading(false)
      }
    } catch (err: any) {
      console.error(err)
      setError("Đã xảy ra lỗi khi kết nối máy chủ. Vui lòng thử lại.")
      setLoading(false)
    }
  }

  return (
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-50/80 font-sans">
      {/* Ambient background light like Apple/Google marketing pages */}
      <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      
      <Card className="w-full max-w-[450px] border border-slate-200/60 bg-white/80 backdrop-blur-2xl shadow-[0_24px_48px_-12px_rgba(168,85,247,0.08)] rounded-3xl overflow-hidden transition-all duration-300">
        <CardHeader className="text-center space-y-6 pt-10 pb-6 px-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-[0_8px_20px_rgba(168,85,247,0.15)] border border-purple-400/10">
            <Coins className="text-white w-7 h-7" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Đăng ký thành viên</CardTitle>
            <CardDescription className="text-slate-500 text-sm font-medium">Điền thông tin của bạn để bắt đầu tham gia Dây Hụi</CardDescription>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 px-8 pb-4">
            {error && (
              <div className="bg-red-550/10 text-red-600 text-xs p-3.5 rounded-xl border border-red-200 text-center font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                {error}
              </div>
            )}
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Họ và Tên</Label>
                <div className="relative">
                  <Input 
                    id="fullName" 
                    name="fullName" 
                    placeholder="Nguyễn Văn A" 
                    required 
                    className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-11 pl-10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/35 transition-all duration-200" 
                  />
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Số điện thoại</Label>
                <div className="relative">
                  <Input 
                    id="phone" 
                    name="phone" 
                    type="tel" 
                    placeholder="0901234567" 
                    required 
                    className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-11 pl-10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/35 transition-all duration-200" 
                  />
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Ngân hàng nhận tiền hốt hụi</Label>
              <div className="relative">
                <Select value={bankName} onValueChange={(v) => setBankName(v || "")}>
                  <SelectTrigger className="bg-white border-slate-200 text-slate-900 rounded-xl h-11 pl-10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/35 transition-all duration-200 text-left">
                    <SelectValue placeholder="Chọn ngân hàng" className="text-slate-400" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900 rounded-xl">
                    {banks.map(b => (
                      <SelectItem key={b} value={b} className="focus:bg-slate-100 rounded-lg">{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Landmark className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 z-10" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bankAccountNumber" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Số tài khoản</Label>
              <div className="relative">
                <Input 
                  id="bankAccountNumber" 
                  name="bankAccountNumber" 
                  placeholder="Nhập số tài khoản ngân hàng của bạn" 
                  className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-11 pl-10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/35 transition-all duration-200" 
                />
                <CreditCard className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 px-8 pb-10">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl h-11 font-medium transition-all duration-200 active:scale-[0.98] shadow-[0_4px_16px_rgba(147,51,234,0.2)] disabled:opacity-60 cursor-pointer" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </div>
              ) : "Đăng ký ngay"}
            </Button>
            
            <div className="text-xs text-center text-slate-500 font-medium">
              Đã có tài khoản?{" "}
              <Link href="/login" className="text-purple-600 hover:text-purple-500 hover:underline transition-colors duration-200">
                Đăng nhập
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
