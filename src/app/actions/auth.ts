"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { createSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function loginAction(formData: FormData) {
  try {
    const phone = formData.get("phone") as string

    if (!phone) return { error: "Vui lòng nhập số điện thoại" }

    const user = await prisma.user.findUnique({ where: { phone } })
    if (!user) return { error: "Số điện thoại chưa được đăng ký" }

    await createSession(user.id, user.role)
    return { success: true }
  } catch (err: any) {
    console.error("Lỗi đăng nhập:", err)
    return { error: "Đã xảy ra lỗi kết nối cơ sở dữ liệu. Vui lòng kiểm tra kết nối mạng." }
  }
}

export async function registerAction(formData: FormData) {
  try {
    const phone = formData.get("phone") as string
    const fullName = formData.get("fullName") as string
    const bankName = formData.get("bankName") as string
    const bankAccountNumber = formData.get("bankAccountNumber") as string

    if (!phone || !fullName) return { error: "Vui lòng nhập đầy đủ thông tin bắt buộc" }

    const existing = await prisma.user.findUnique({ where: { phone } })
    if (existing) return { error: "Số điện thoại đã được đăng ký" }

    // Nếu là số điện thoại đặc biệt 0838789096 hoặc là user đầu tiên, auto cấp quyền ADMIN
    const userCount = await prisma.user.count()
    const role = (phone === "0838789096" || userCount === 0) ? "ADMIN" : "MEMBER"

    const hashedPassword = await bcrypt.hash("passwordless", 10)

    const user = await prisma.user.create({
      data: {
        phone,
        password: hashedPassword,
        fullName,
        bankName,
        bankAccountNumber,
        role,
      }
    })

    await createSession(user.id, user.role)
    return { success: true }
  } catch (err: any) {
    console.error("Lỗi đăng ký:", err)
    return { error: "Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại." }
  }
}

export async function logoutAction() {
  try {
    const { destroySession } = await import("@/lib/auth")
    await destroySession()
  } catch (err) {
    console.error("Lỗi đăng xuất:", err)
  }
  redirect("/login")
}
