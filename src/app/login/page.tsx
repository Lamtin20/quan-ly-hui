"use client"

import { useState } from "react"
import { loginAction } from "../actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { CircleDollarSign, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    const formData = new FormData(e.currentTarget)
    const res = await loginAction(formData)
    
    if (res?.error) {
      setError(res.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-white to-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm backdrop-blur-md bg-white/70 shadow-xl border-indigo-100">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-gradient-to-tr from-indigo-600 to-violet-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
            <CircleDollarSign className="text-white w-10 h-10" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Đăng nhập</CardTitle>
            <CardDescription>Hệ thống Quản lý Dây Hụi Siêu Tốc</CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input id="phone" name="phone" type="tel" placeholder="0901234567" required className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required className="bg-white" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Đăng nhập ngay"}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="text-indigo-600 hover:underline font-semibold">
                Đăng ký thành viên
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
