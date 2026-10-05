"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getUser } from "@/lib/server-auth"

export async function submitBid(sessionId: string, memberId: string, amount: number, isWhiteTicket: boolean) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  const session = await prisma.huiSession.findUnique({
    where: { id: sessionId },
    include: { huiGroup: { include: { huiMembers: true } } }
  })

  if (!session || session.status !== "BIDDING") {
    throw new Error("Kỳ hụi không trong thời gian kêu giá")
  }

  const member = session.huiGroup.huiMembers.find(hm => hm.id === memberId)
  if (!member || member.userId !== user.id) {
    throw new Error("Chân hụi không hợp lệ hoặc bạn không có quyền")
  }

  // Kiểm tra chân hụi cụ thể này đã hốt (hụi chết) chưa
  let deadSession = await prisma.huiSession.findFirst({
    where: { 
      huiGroupId: session.huiGroupId, 
      status: "DONE", 
      winnerMemberId: memberId
    }
  })

  if (!deadSession) {
    const legacySession = await prisma.huiSession.findFirst({
      where: {
        huiGroupId: session.huiGroupId,
        status: "DONE",
        winnerMemberId: null,
        winnerUserId: member.userId
      }
    })
    if (legacySession) {
      deadSession = legacySession
    }
  }

  if (deadSession) {
    throw new Error(`Chân hụi này đã hốt ở Kỳ #${deadSession.sessionNumber} (Hụi Chết), không thể bỏ thăm nữa!`)
  }

  const maxBid = (session.huiGroup.amount * session.huiGroup.maxBidPercentage) / 100
  if (!isWhiteTicket && amount > maxBid) {
    throw new Error(`Giá kêu không được vượt quá ${session.huiGroup.maxBidPercentage}% (${maxBid} đ)`)
  }

  const existingBid = await prisma.bid.findUnique({
    where: { sessionId_huiMemberId: { sessionId, huiMemberId: memberId } }
  })

  if (existingBid) {
    const hoursSinceBid = (Date.now() - existingBid.createdAt.getTime()) / (1000 * 60 * 60)
    if (hoursSinceBid > 2) {
      throw new Error("Đã hết thời gian 2 tiếng để sửa phiếu")
    }
  }

  const newBid = await prisma.bid.upsert({
    where: {
      sessionId_huiMemberId: { sessionId, huiMemberId: memberId }
    },
    update: {
      amount: isWhiteTicket ? 0 : amount,
      isWhiteTicket
    },
    create: {
      sessionId,
      userId: user.id,
      huiMemberId: memberId,
      amount: isWhiteTicket ? 0 : amount,
      isWhiteTicket
    }
  })

  // Tính toán tiến độ bỏ thăm để báo Telegram
  const previousSessions = await prisma.huiSession.findMany({
    where: { huiGroupId: session.huiGroupId, status: "DONE" },
    select: { winnerMemberId: true, winnerUserId: true }
  })
  
  // Hỗ trợ cả dữ liệu cũ (chưa có winnerMemberId) và dữ liệu mới
  const deadMemberIds = previousSessions.map(s => s.winnerMemberId).filter(Boolean) as string[]
  
  const livingMembers = session.huiGroup.huiMembers.filter(hm => !deadMemberIds.includes(hm.id))
  const livingMemberIds = livingMembers.map(hm => hm.id)
    
  const currentBids = await prisma.bid.findMany({
    where: { sessionId }
  })
  
  const biddedLivingMemberIds = currentBids
    .filter(b => b.huiMemberId && livingMemberIds.includes(b.huiMemberId))
    .map(b => b.huiMemberId)
    
  const totalLiving = livingMemberIds.length
  const biddedCount = biddedLivingMemberIds.length
  const pendingCount = totalLiving - biddedCount
  
  const moneyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
  const bidAmountText = isWhiteTicket ? "Phiếu Trắng" : moneyFormatter.format(amount);
  
  const msgText = `📢 <b>CÓ NGƯỜI VỪA BỎ THĂM</b>\n\n` +
    `📍 <b>Dây hụi:</b> ${session.huiGroup.name}\n` +
    `📅 <b>Kỳ số:</b> ${session.sessionNumber}\n` +
    `👤 <b>Người bỏ:</b> ${user.fullName} ${member.name ? `(${member.name})` : ''}\n` +
    `💰 <b>Giá kêu:</b> ${bidAmountText}\n\n` +
    `📊 <b>Tiến độ:</b>\n` +
    `✅ Đã bỏ: ${biddedCount}/${totalLiving} phần\n` +
    `⏳ Chưa bỏ: ${pendingCount} phần`;
    
  const { sendTelegramMessage } = await import("@/lib/telegram");
  sendTelegramMessage(msgText).catch(console.error);

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
    select: { winnerMemberId: true }
  })
  const deadMemberIds = previousSessions.map(s => s.winnerMemberId).filter(Boolean) as string[]

  const validBids = session.bids.filter(b => b.huiMemberId && !deadMemberIds.includes(b.huiMemberId))
  
  if (validBids.length === 0) {
    throw new Error("Chưa có chân hụi sống nào kêu giá")
  }
  
  const maxAmount = Math.max(...validBids.map(b => b.amount))
  const topBids = validBids.filter(b => b.amount === maxAmount)
  
  if (topBids.length === 1) {
    await finalizeSession(sessionId, topBids[0].huiMemberId!, maxAmount)
  } else {
    const tiedMemberIds = topBids.map(b => b.huiMemberId!)
    await prisma.huiSession.update({
      where: { id: sessionId },
      data: {
        status: "TIE_BREAKER",
        tieBreakerData: { tiedMemberIds, selected: {} }
      }
    })
  }
  revalidatePath("/", "layout")
}

export async function pickSphere(sessionId: string, memberId: string) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  const session = await prisma.huiSession.findUnique({
    where: { id: sessionId },
    include: { huiGroup: { include: { huiMembers: true } } }
  })
  
  if (!session || session.status !== "TIE_BREAKER") throw new Error("Kỳ hụi không ở trạng thái bốc thăm")
  
  const member = session.huiGroup.huiMembers.find(hm => hm.id === memberId)
  if (!member || member.userId !== user.id) throw new Error("Bạn không có quyền")
  
  const data = session.tieBreakerData as any
  if (!data || !data.tiedMemberIds.includes(memberId)) throw new Error("Chân hụi này không nằm trong danh sách bốc thăm")
  if (data.selected[memberId]) throw new Error("Chân hụi này đã chọn quả cầu rồi")

  let randomNum = Math.floor(Math.random() * 100) + 1
  while (Object.values(data.selected).includes(randomNum)) {
    randomNum = Math.floor(Math.random() * 100) + 1
  }

  data.selected[memberId] = randomNum

  if (Object.keys(data.selected).length === data.tiedMemberIds.length) {
    let winnerId = data.tiedMemberIds[0]
    let maxNum = data.selected[winnerId]
    for (const uid of data.tiedMemberIds) {
      if (data.selected[uid] > maxNum) {
        maxNum = data.selected[uid]
        winnerId = uid
      }
    }
    
    await prisma.huiSession.update({
      where: { id: sessionId },
      data: { tieBreakerData: data } 
    })
    
    const bid = await prisma.bid.findUnique({
      where: { sessionId_huiMemberId: { sessionId, huiMemberId: winnerId } }
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

async function finalizeSession(sessionId: string, winnerMemberId: string, bidAmount: number) {
  const session = await prisma.huiSession.findUnique({
    where: { id: sessionId },
    include: { huiGroup: { include: { huiMembers: true } } }
  })
  
  if (!session) return
  
  const group = session.huiGroup
  const winnerMember = group.huiMembers.find(m => m.id === winnerMemberId)
  if (!winnerMember) return
  
  const previousSessions = await prisma.huiSession.findMany({
    where: { huiGroupId: group.id, status: "DONE" },
    select: { winnerMemberId: true }
  })
  const deadMemberIds = previousSessions.map(s => s.winnerMemberId).filter(Boolean) as string[]

  const N = group.totalSlots
  const A = group.amount
  const B = bidAmount
  const D = deadMemberIds.length

  const livingPayers = N - D - 1
  const winnerReceivedAmount = (A - B) * livingPayers + (A * D)

  const winnerUser = await prisma.user.findUnique({ where: { id: winnerMember.userId } });

  await prisma.$transaction(async (tx) => {
    await tx.huiSession.update({
      where: { id: sessionId },
      data: {
        winnerUserId: winnerMember.userId,
        winnerMemberId,
        bidAmount,
        winnerReceivedAmount,
        status: "DONE"
      }
    })

    const payments = group.huiMembers.map(hm => {
      const isDead = deadMemberIds.includes(hm.id)
      if (hm.id === winnerMemberId) return null
      
      const amountToPay = isDead ? A : (A - B)
      return {
        sessionId,
        userId: hm.userId,
        huiMemberId: hm.id,
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

  // Bắn thông báo Telegram
  const { sendTelegramMessage } = await import("@/lib/telegram");
  
  const getBankBin = (name: string) => {
    const map: Record<string, string> = {
      "Vietcombank": "VCB", "Techcombank": "TCB", "MBBank": "MB", 
      "ACB": "ACB", "VietinBank": "CTG", "BIDV": "BIDV",
      "Agribank": "VBA", "VPBank": "VPB", "TPBank": "TPB",
      "Sacombank": "STB", "VIB": "VIB"
    }
    return map[name] || name;
  };

  const bin = winnerUser?.bankName ? getBankBin(winnerUser.bankName) : '';
  const qrUrl = bin && winnerUser?.bankAccountNumber 
    ? `https://img.vietqr.io/image/${bin}-${winnerUser.bankAccountNumber}-compact2.png` 
    : '';

  const moneyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
  const msgText = `🎉 <b>KẾT QUẢ KHUI HỤI</b> 🎉\n\n` +
    `📍 <b>Dây hụi:</b> ${group.name}\n` +
    `📅 <b>Kỳ số:</b> ${session.sessionNumber}\n` +
    `🏆 <b>Người hốt:</b> ${winnerUser?.fullName} ${winnerMember.name ? `(${winnerMember.name})` : ''}\n` +
    `💰 <b>Thực nhận:</b> ${moneyFormatter.format(winnerReceivedAmount)}\n\n` +
    `🏦 <b>Thông tin chuyển khoản:</b>\n` +
    `- Ngân hàng: ${winnerUser?.bankName || 'Chưa cập nhật'}\n` +
    `- STK: <code>${winnerUser?.bankAccountNumber || 'Chưa cập nhật'}</code>\n` +
    (qrUrl ? `\n<a href="${qrUrl}">Mở mã QR chuyển khoản</a>` : '');

  await sendTelegramMessage(msgText);
}

export async function autoCloseIfAllBidded(sessionId: string) {
  const session = await prisma.huiSession.findUnique({
    where: { id: sessionId },
    include: { bids: true, huiGroup: { include: { huiMembers: true } } }
  })
  if (!session || session.status !== "BIDDING") return

  const previousSessions = await prisma.huiSession.findMany({
    where: { huiGroupId: session.huiGroupId, status: "DONE" },
    select: { winnerMemberId: true }
  })
  const deadMemberIds = previousSessions.map(s => s.winnerMemberId).filter(Boolean) as string[]

  const livingMemberIds = session.huiGroup.huiMembers
    .map(hm => hm.id)
    .filter(id => !deadMemberIds.includes(id))

  const biddedLivingMemberIds = session.bids
    .filter(b => b.huiMemberId && livingMemberIds.includes(b.huiMemberId))
    .map(b => b.huiMemberId)

  const allLivingHaveBidded = livingMemberIds.every(id => biddedLivingMemberIds.includes(id))
  if (allLivingHaveBidded && livingMemberIds.length > 0) {
    const validBids = session.bids.filter(b => b.huiMemberId && livingMemberIds.includes(b.huiMemberId))
    const maxAmount = Math.max(...validBids.map(b => b.amount))
    const topBids = validBids.filter(b => b.amount === maxAmount)
    
    if (topBids.length === 1) {
      await finalizeSession(sessionId, topBids[0].huiMemberId!, maxAmount)
    } else {
      const tiedMemberIds = topBids.map(b => b.huiMemberId!)
      await prisma.huiSession.update({
        where: { id: sessionId },
        data: {
          status: "TIE_BREAKER",
          tieBreakerData: { tiedMemberIds, selected: {} }
        }
      })
    }
  }
}

export async function adminQuickBid(sessionId: string, memberId: string) {
  const user = await getUser()
  if (!user || user.role !== "ADMIN") throw new Error("Unauthorized")

  const session = await prisma.huiSession.findUnique({
    where: { id: sessionId },
    include: { 
      huiGroup: { include: { huiMembers: true } },
      bids: true
    }
  })

  if (!session || session.status !== "BIDDING") {
    throw new Error("Kỳ hụi không trong thời gian kêu giá")
  }

  const member = session.huiGroup.huiMembers.find(hm => hm.id === memberId)
  if (!member || member.userId !== user.id) {
    throw new Error("Admin không sở hữu chân hụi này, không thể hốt nhanh.")
  }

  const highestBid = session.bids.length > 0 ? Math.max(...session.bids.map(b => b.amount)) : 0
  let newBid = highestBid + 500
  
  const maxBid = (session.huiGroup.amount * session.huiGroup.maxBidPercentage) / 100
  if (newBid > maxBid) newBid = maxBid

  await prisma.bid.upsert({
    where: {
      sessionId_huiMemberId: { sessionId, huiMemberId: memberId }
    },
    update: {
      amount: newBid,
      isWhiteTicket: false
    },
    create: {
      sessionId,
      userId: user.id,
      huiMemberId: memberId,
      amount: newBid,
      isWhiteTicket: false
    }
  })

  await autoCloseIfAllBidded(sessionId)
  revalidatePath("/", "layout")
}
