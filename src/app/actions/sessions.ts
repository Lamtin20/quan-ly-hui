"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createSessionAndBidding(data: {
  groupId: string
  winnerMemberId: string
  bidAmount: number
}) {
  const { groupId, winnerMemberId, bidAmount } = data

  const group = await prisma.huiGroup.findUnique({
    where: { id: groupId },
    include: { huiMembers: { include: { member: true } } }
  })

  if (!group) throw new Error("Không tìm thấy dây hụi")

  const maxBid = (group.amount * group.maxBidPercentage) / 100
  if (bidAmount > maxBid) {
    throw new Error(`Giá kêu không được vượt quá ${group.maxBidPercentage}% (${maxBid.toLocaleString()} đ)`)
  }

  // Get previous sessions to know who is dead (đã hốt)
  const previousSessions = await prisma.huiSession.findMany({
    where: { huiGroupId: groupId, status: "DONE" },
    select: { winnerMemberId: true }
  })

  const deadMemberIds = previousSessions.map(s => s.winnerMemberId).filter(Boolean) as string[]
  
  if (deadMemberIds.includes(winnerMemberId)) {
    throw new Error("Hụi viên này đã hốt rồi, không thể hốt lại trong dây này!")
  }

  // Tính tiền
  const N = group.totalSlots // Số phần (ví dụ 12)
  const A = group.amount // Chân hụi (ví dụ 2tr)
  const B = bidAmount // Kêu giá (ví dụ 200k)
  const D = deadMemberIds.length // Số hụi chết hiện tại

  // Số người sống (chưa hốt) trừ đi người thắng hiện tại (winner)
  const livingPayers = N - D - 1

  // Tính tổng nhận
  const winnerReceivedAmount = (A - B) * livingPayers + (A * D)

  // Transaction
  const sessionNumber = previousSessions.length + 1
  
  const result = await prisma.$transaction(async (tx) => {
    // 1. Tạo session
    const session = await tx.huiSession.create({
      data: {
        huiGroupId: groupId,
        sessionNumber,
        winnerMemberId,
        bidAmount,
        winnerReceivedAmount,
        status: "DONE" // Tự động Done khi đã chốt hụi
      }
    })

    // 2. Tạo payments cho các hụi viên khác
    const payments = group.huiMembers.map(hm => {
      const isDead = deadMemberIds.includes(hm.memberId)
      // Người thắng không phải đóng tiền trong chính kỳ mình hốt (trừ khi có rule khác, nhưng theo truyền thống là không đóng)
      if (hm.memberId === winnerMemberId) return null
      
      const amountToPay = isDead ? A : (A - B)
      
      return {
        sessionId: session.id,
        memberId: hm.memberId,
        isDead,
        amountToPay,
        paidStatus: "UNPAID"
      }
    }).filter(Boolean) as any[]

    await tx.payment.createMany({ data: payments })
    
    // Nếu dây hụi kết thúc (đã hốt hết phần)
    if (sessionNumber >= N) {
      await tx.huiGroup.update({
        where: { id: groupId },
        data: { status: "FINISHED" }
      })
    } else if (group.status === "OPEN") {
      await tx.huiGroup.update({
        where: { id: groupId },
        data: { status: "RUNNING" }
      })
    }

    return session.id
  })

  revalidatePath("/", "layout")
  return result
}
