"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { createSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function loginAction(formData: FormData) {
  const phone = formData.get("phone") as string
  const password = formData.get("password") as string

  if (!phone || !password) return { error: "Vui lòng nhập đầy đủ thông tin" }

  const user = await prisma.user.findUnique({ where: { phone } })
  if (!user) return { error: "Số điện thoại chưa được đăng ký" }

  const isValidPassword = await bcrypt.compare(password, user.password)
  if (!isValidPassword) return { error: "Mật khẩu không chính xác" }

  await createSession(user.id, user.role)
  redirect("/")
}

export async function registerAction(formData: FormData) {
  const phone = formData.get("phone") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string
  const bankName = formData.get("bankName") as string
  const bankAccountNumber = formData.get("bankAccountNumber") as string

  if (!phone || !password || !fullName) return { error: "Vui lòng nhập đầy đủ thông tin bắt buộc" }

  const existing = await prisma.user.findUnique({ where: { phone } })
  if (existing) return { error: "Số điện thoại đã được đăng ký" }

  // Nếu là user đầu tiên, auto cấp quyền ADMIN
  const userCount = await prisma.user.count()
  const role = userCount === 0 ? "ADMIN" : "MEMBER"

  const hashedPassword = await bcrypt.hash(password, 10)

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
  redirect("/")
}

export async function logoutAction() {
  const { destroySession } = await import("@/lib/auth")
  await destroySession()
  redirect("/login")
}
