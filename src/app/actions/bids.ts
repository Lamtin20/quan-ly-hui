"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getUser } from "@/lib/server-auth"

export async function submitBid(sessionId: string, amount: number, isWhiteTicket: boolean) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  const session = await prisma.huiSession.findUnique({
    where: { id: sessionId },
    include: { huiGroup: { include: { huiMembers: true } } }
  })

  if (!session || session.status !== "BIDDING") {
    throw new Error("Kỳ hụi không trong thời gian kêu giá")
  }

  if (!session.huiGroup.huiMembers.some(hm => hm.userId === user.id)) {
    throw new Error("Bạn không nằm trong dây hụi này")
  }

  const maxBid = (session.huiGroup.amount * session.huiGroup.maxBidPercentage) / 100
  if (!isWhiteTicket && amount > maxBid) {
    throw new Error(`Giá kêu không được vượt quá ${session.huiGroup.maxBidPercentage}% (${maxBid} đ)`)
  }

  await prisma.bid.upsert({
    where: {
      sessionId_userId: { sessionId, userId: user.id }
    },
    update: {
      amount: isWhiteTicket ? 0 : amount,
      isWhiteTicket
    },
    create: {
      sessionId,
      userId: user.id,
      amount: isWhiteTicket ? 0 : amount,
      isWhiteTicket
    }
  })

  // Tự động đóng kỳ hụi nếu tất cả thành viên sống đã bỏ thăm xong
  await autoCloseIfAllBidded(sessionId)

  revalidatePath("/", "layout")
}

export async function closeBidding(sessionId: string) {
  const user = await getUser()
  if (!user || user.role !== "ADMIN") throw new Error("Unauthorized")
  
  const session = await prisma.huiSession.findUnique({
    where: { id: sessionId },
    include: { bids: true, huiGroup: true }
  })
  
  if (!session || session.status !== "BIDDING") return
  
  const previousSessions = await prisma.huiSession.findMany({
    where: { huiGroupId: session.huiGroupId, status: "DONE" },
    select: { winnerUserId: true }
  })
  const deadIds = previousSessions.map(s => s.winnerUserId).filter(Boolean) as string[]

  const validBids = session.bids.filter(b => !deadIds.includes(b.userId))
  
  if (validBids.length === 0) {
    throw new Error("Chưa có hụi viên sống nào kêu giá")
  }
  
  const maxAmount = Math.max(...validBids.map(b => b.amount))
  const topBids = validBids.filter(b => b.amount === maxAmount)
  
  if (topBids.length === 1) {
    await finalizeSession(sessionId, topBids[0].userId, maxAmount)
  } else {
    const tiedUserIds = topBids.map(b => b.userId)
    await prisma.huiSession.update({
      where: { id: sessionId },
      data: {
        status: "TIE_BREAKER",
        tieBreakerData: { tiedUserIds, selected: {} }
      }
    })
  }
  revalidatePath("/", "layout")
}

export async function pickSphere(sessionId: string) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  const session = await prisma.huiSession.findUnique({
    where: { id: sessionId }
  })
  
  if (!session || session.status !== "TIE_BREAKER") throw new Error("Kỳ hụi không ở trạng thái bốc thăm")
  
  const data = session.tieBreakerData as any
  if (!data || !data.tiedUserIds.includes(user.id)) throw new Error("Bạn không nằm trong danh sách bốc thăm")
  if (data.selected[user.id]) throw new Error("Bạn đã chọn quả cầu rồi")

  let randomNum = Math.floor(Math.random() * 100) + 1
  while (Object.values(data.selected).includes(randomNum)) {
    randomNum = Math.floor(Math.random() * 100) + 1
  }

  data.selected[user.id] = randomNum

  if (Object.keys(data.selected).length === data.tiedUserIds.length) {
    let winnerId = data.tiedUserIds[0]
    let maxNum = data.selected[winnerId]
    for (const uid of data.tiedUserIds) {
      if (data.selected[uid] > maxNum) {
        maxNum = data.selected[uid]
        winnerId = uid
      }
    }
    
    await prisma.huiSession.update({
      where: { id: sessionId },
      data: { tieBreakerData: data } // Lưu kết quả
    })
    
    const bid = await prisma.bid.findUnique({
      where: { sessionId_userId: { sessionId, userId: winnerId } }
    })
    
    await finalizeSession(sessionId, winnerId, bid!.amount)
  } else {
    await prisma.huiSession.update({
      where: { id: sessionId },
      data: { tieBreakerData: data }
    })
  }
  revalidatePath("/", "layout")
}

async function finalizeSession(sessionId: string, winnerUserId: string, bidAmount: number) {
  const session = await prisma.huiSession.findUnique({
    where: { id: sessionId },
    include: { huiGroup: { include: { huiMembers: true } } }
  })
  
  if (!session) return
  
  const group = session.huiGroup
  
  const previousSessions = await prisma.huiSession.findMany({
    where: { huiGroupId: group.id, status: "DONE" },
    select: { winnerUserId: true }
  })
  const deadIds = previousSessions.map(s => s.winnerUserId).filter(Boolean) as string[]

  const N = group.totalSlots
  const A = group.amount
  const B = bidAmount
  const D = deadIds.length

  const livingPayers = N - D - 1
  const winnerReceivedAmount = (A - B) * livingPayers + (A * D)

  await prisma.$transaction(async (tx) => {
    const updatedSession = await tx.huiSession.update({
      where: { id: sessionId },
      data: {
        winnerUserId,
        bidAmount,
        winnerReceivedAmount,
        status: "DONE"
      }
    })

    const payments = group.huiMembers.map(hm => {
      const isDead = deadIds.includes(hm.userId)
      if (hm.userId === winnerUserId) return null
      
      const amountToPay = isDead ? A : (A - B)
      return {
        sessionId,
        userId: hm.userId,
        isDead,
        amountToPay,
        paidStatus: "UNPAID"
      }
    }).filter(Boolean) as any[]

    await tx.payment.createMany({ data: payments })
    
    if (session.sessionNumber >= N) {
      await tx.huiGroup.update({
        where: { id: group.id },
        data: { status: "FINISHED" }
      })
    } else if (group.status === "OPEN") {
      await tx.huiGroup.update({
        where: { id: group.id },
        data: { status: "RUNNING" }
      })
    }
  })
}

export async function autoCloseIfAllBidded(sessionId: string) {
  const session = await prisma.huiSession.findUnique({
    where: { id: sessionId },
    include: { bids: true, huiGroup: { include: { huiMembers: true } } }
  })
  if (!session || session.status !== "BIDDING") return

  const previousSessions = await prisma.huiSession.findMany({
    where: { huiGroupId: session.huiGroupId, status: "DONE" },
    select: { winnerUserId: true }
  })
  const deadIds = previousSessions.map(s => s.winnerUserId).filter(Boolean) as string[]

  const livingUserIds = session.huiGroup.huiMembers
    .map(hm => hm.userId)
    .filter(id => !deadIds.includes(id))

  const biddedLivingUserIds = session.bids
    .filter(b => livingUserIds.includes(b.userId))
    .map(b => b.userId)

  const allLivingHaveBidded = livingUserIds.every(id => biddedLivingUserIds.includes(id))
  if (allLivingHaveBidded && livingUserIds.length > 0) {
    const validBids = session.bids.filter(b => livingUserIds.includes(b.userId))
    const maxAmount = Math.max(...validBids.map(b => b.amount))
    const topBids = validBids.filter(b => b.amount === maxAmount)
    
    if (topBids.length === 1) {
      await finalizeSession(sessionId, topBids[0].userId, maxAmount)
    } else {
      const tiedUserIds = topBids.map(b => b.userId)
      await prisma.huiSession.update({
        where: { id: sessionId },
        data: {
          status: "TIE_BREAKER",
          tieBreakerData: { tiedUserIds, selected: {} }
        }
      })
    }
  }
}
