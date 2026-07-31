"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getUser } from "@/lib/server-auth"

// Admin xác nhận một người chơi đã đóng tiền
export async function confirmPayment(paymentId: string) {
  const user = await getUser()
  if (!user || user.role !== "ADMIN") throw new Error("Chỉ Admin mới có quyền xác nhận thanh toán")

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      paidStatus: "PAID",
      paidAt: new Date()
    }
  })

  revalidatePath("/", "layout")
}

// Admin xác nhận TẤT CẢ người chơi đã đóng tiền trong kỳ này
export async function confirmAllPayments(sessionId: string) {
  const user = await getUser()
  if (!user || user.role !== "ADMIN") throw new Error("Chỉ Admin mới có quyền xác nhận thanh toán")

  await prisma.payment.updateMany({
    where: { 
      sessionId,
      paidStatus: "UNPAID"
    },
    data: {
      paidStatus: "PAID",
      paidAt: new Date()
    }
  })

  revalidatePath("/", "layout")
}

// Thành viên tự xác nhận đã đóng tiền
export async function submitPaidSelf(paymentId: string) {
  const user = await getUser()
  if (!user) throw new Error("Bạn chưa đăng nhập")

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId }
  })

  if (!payment) throw new Error("Không tìm thấy thông tin đóng hụi")
  if (payment.userId !== user.id) throw new Error("Bạn không có quyền xác nhận đóng tiền cho người khác")

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      paidStatus: "PAID",
      paidAt: new Date()
    }
  })

  revalidatePath("/", "layout")
}
