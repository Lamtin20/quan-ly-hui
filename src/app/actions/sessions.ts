"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/server-auth"

export async function startNewSession(groupId: string) {
  const user = await requireUser()
  if (user.role !== "ADMIN") throw new Error("Chỉ có chủ hụi mới được mở kỳ mới")

  const group = await prisma.huiGroup.findUnique({
    where: { id: groupId },
    include: { sessions: true }
  })
  
  if (!group) throw new Error("Không tìm thấy dây hụi")

  if (group.sessions.length >= group.totalSlots) {
    throw new Error("Dây hụi này đã kết thúc")
  }

  const activeSession = group.sessions.find(s => s.status !== "DONE")
  if (activeSession) {
    throw new Error("Đang có một kỳ hụi chưa hoàn thành (Kỳ " + activeSession.sessionNumber + ")")
  }

  const session = await prisma.huiSession.create({
    data: {
      huiGroupId: groupId,
      sessionNumber: group.sessions.length + 1,
      status: "BIDDING",
      bidAmount: 0,
      winnerReceivedAmount: 0
    }
  })

  if (group.status === "OPEN") {
    await prisma.huiGroup.update({
      where: { id: groupId },
      data: { status: "RUNNING" }
    })
  }

  revalidatePath("/", "layout")
  return session.id
}
