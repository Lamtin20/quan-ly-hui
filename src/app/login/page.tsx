"use client"

import { useState } from "react"
import { loginAction } from "../actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Coins, Loader2, Phone } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      const formData = new FormData(e.currentTarget)
      const res = await loginAction(formData)
      
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
      setError("Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-50/80 font-sans">
      {/* Ambient background light like Apple/Google marketing pages */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />
      
      <Card className="w-full max-w-[400px] border border-slate-200/60 bg-white/80 backdrop-blur-2xl shadow-[0_24px_48px_-12px_rgba(99,102,241,0.08)] rounded-3xl overflow-hidden transition-all duration-300">
        <CardHeader className="text-center space-y-5 pt-10 pb-6 px-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_8px_20px_rgba(99,102,241,0.15)] border border-indigo-400/10">
            <Coins className="text-white w-7 h-7" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Đăng nhập</CardTitle>
            <CardDescription className="text-slate-500 text-sm font-medium">Hệ thống Quản lý Dây Hụi Thông Minh</CardDescription>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 px-8 pb-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-xs p-3.5 rounded-xl border border-red-200 text-center font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                {error}
              </div>
            )}
            
            <div className="space-y-2.5">
              <Label htmlFor="phone" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Số điện thoại</Label>
              <div className="relative">
                <Input 
                  id="phone" 
                  name="phone" 
                  type="tel" 
                  placeholder="Nhập số điện thoại đăng nhập" 
                  required 
                  className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-11 pl-10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/35 transition-all duration-200" 
                />
                <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 px-8 pb-10">
            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-11 font-medium transition-all duration-200 active:scale-[0.98] shadow-[0_4px_16px_rgba(99,102,241,0.2)] disabled:opacity-60 cursor-pointer" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang kết nối...</span>
                </div>
              ) : "Đăng nhập ngay"}
            </Button>
            
            <div className="text-xs text-center text-slate-500 font-medium">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="text-indigo-600 hover:text-indigo-500 hover:underline transition-colors duration-200">
                Đăng ký thành viên
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
