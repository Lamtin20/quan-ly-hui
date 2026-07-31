"use client"

import { useState } from "react"
import { registerAction } from "../actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { CircleDollarSign, Loader2 } from "lucide-react"

const banks = ["Vietcombank", "Techcombank", "MBBank", "ACB", "VietinBank", "BIDV", "Agribank", "VPBank", "TPBank", "Sacombank", "VIB"]

export default function RegisterPage() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [bankName, setBankName] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    const formData = new FormData(e.currentTarget)
    formData.set("bankName", bankName) // append from state
    
    const res = await registerAction(formData)
    
    if (res?.error) {
      setError(res.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-white to-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md backdrop-blur-md bg-white/70 shadow-xl border-indigo-100">
        <CardHeader className="text-center space-y-4 pb-4">
          <div className="mx-auto bg-gradient-to-tr from-indigo-600 to-violet-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transform -rotate-6">
            <CircleDollarSign className="text-white w-7 h-7" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Đăng ký tham gia</CardTitle>
            <CardDescription>Nhập đầy đủ thông tin để tham gia Dây Hụi</CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center">
                {error}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và Tên</Label>
                <Input id="fullName" name="fullName" placeholder="Nguyễn Văn A" required className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" name="phone" type="tel" placeholder="0901234567" required className="bg-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input id="password" name="password" type="password" placeholder="Tạo mật khẩu đăng nhập" required className="bg-white" />
            </div>

            <div className="space-y-2">
              <Label>Ngân hàng nhận tiền hốt hụi</Label>
              <Select value={bankName} onValueChange={(v) => setBankName(v || "")}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Chọn ngân hàng" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map(b => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bankAccountNumber">Số tài khoản</Label>
              <Input id="bankAccountNumber" name="bankAccountNumber" placeholder="Nhập số tài khoản" className="bg-white" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Tạo Tài Khoản"}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link href="/login" className="text-indigo-600 hover:underline font-semibold">
                Đăng nhập
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
