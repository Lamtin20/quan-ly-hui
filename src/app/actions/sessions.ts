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

  const doneSessions = group.sessions.filter(s => s.status === "DONE")
  if (doneSessions.length >= group.totalSlots) {
    throw new Error("Dây hụi này đã kết thúc")
  }

  const activeSession = group.sessions.find(s => s.status === "BIDDING" || s.status === "TIE_BREAKER")
  if (activeSession) {
    throw new Error("Đang có một kỳ hụi chưa hoàn thành (Kỳ " + activeSession.sessionNumber + ")")
  }

  const nextSession = group.sessions
    .filter(s => s.status === "PENDING")
    .sort((a, b) => a.sessionNumber - b.sessionNumber)[0]

  if (!nextSession) {
    throw new Error("Không tìm thấy kỳ hụi tiếp theo")
  }

  await prisma.huiSession.update({
    where: { id: nextSession.id },
    data: {
      status: "BIDDING"
    }
  })

  if (group.status === "OPEN") {
    await prisma.huiGroup.update({
      where: { id: groupId },
      data: { status: "RUNNING" }
    })
  }

  revalidatePath("/", "layout")
  return nextSession.id
}
