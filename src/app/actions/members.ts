"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getUser } from "@/lib/server-auth"

export async function createMember(data: {
  fullName: string
  phone: string
  bankName?: string
  bankAccountNumber?: string
}) {
  const user = await getUser()
  if (!user || user.role !== "ADMIN") {
    throw new Error("Chỉ quản trị viên mới có quyền thêm thành viên")
  }

  await prisma.user.create({
    data: {
      fullName: data.fullName,
      password: "123456",
      role: "MEMBER",
      phone: data.phone,
      bankName: data.bankName,
      bankAccountNumber: data.bankAccountNumber,
    }
  })
  revalidatePath("/", "layout")
}

export async function deleteMember(id: string) {
  const user = await getUser()
  if (!user || user.role !== "ADMIN") {
    throw new Error("Chỉ quản trị viên mới có quyền xóa thành viên")
  }

  await prisma.user.delete({
    where: { id }
  })
  revalidatePath("/", "layout")
}
