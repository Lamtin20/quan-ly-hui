"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/server-auth"
import { hasPassedJoinDeadline, getJoinDeadlineDate, formatDate } from "@/lib/utils"

// Helper function to calculate session dates based on cycle and custom days
function calculateSessionDates(startDate: Date, cycle: string, customDaysStr: string, count: number): Date[] {
  if (cycle === "CUSTOM" || cycle === "MONTHLY_5_20") {
    const daysStr = cycle === "MONTHLY_5_20" ? "5,20" : customDaysStr
    const days = daysStr.split(",").map(d => parseInt(d.trim())).filter(d => !isNaN(d) && d >= 1 && d <= 31).sort((a, b) => a - b)
    if (days.length > 0) {
      const dates: Date[] = []
      let currentYear = startDate.getFullYear()
      let currentMonth = startDate.getMonth() // 0-indexed
      
      while (dates.length < count) {
        for (const day of days) {
          const candidate = new Date(currentYear, currentMonth, day)
          // Make sure it is >= startDate
          if (candidate.getTime() >= startDate.getTime()) {
            if (dates.length > 0 && dates[dates.length - 1].getTime() === candidate.getTime()) {
              continue
            }
            dates.push(candidate)
            if (dates.length === count) break
          }
        }
        currentMonth++
        if (currentMonth > 11) {
          currentMonth = 0
          currentYear++
        }
      }
      return dates
    }
  }

  // Default cycles
  const dates: Date[] = []
  let current = new Date(startDate)
  for (let i = 0; i < count; i++) {
    dates.push(new Date(current))
    if (cycle === "DAILY") {
      current.setDate(current.getDate() + 1)
    } else if (cycle === "WEEKLY") {
      current.setDate(current.getDate() + 7)
    } else {
      // Monthly
      current.setMonth(current.getMonth() + 1)
    }
  }
  return dates
}

export async function createHuiGroup(data: {
  name: string
  amount: number
  cycle: string
  biddingDays?: string
  isPublic?: boolean
  maxBidPercentage: number
  startDate: Date
  userIds: string[]
}) {
  const { name, amount, cycle, biddingDays, isPublic = false, maxBidPercentage, startDate, userIds } = data
  
  await prisma.huiGroup.create({
    data: {
      name,
      amount,
      cycle,
      biddingDays,
      isPublic,
      maxBidPercentage,
      totalSlots: userIds.length,
      startDate,
      huiMembers: {
        create: userIds.map(userId => ({
          userId,
          slots: 1
        }))
      }
    }
  })
  revalidatePath("/", "layout")
}

export async function joinHuiGroup(groupId: string) {
  const user = await requireUser()
  
  const group = await prisma.huiGroup.findUnique({
    where: { id: groupId },
    include: { huiMembers: true }
  })
  
  if (!group) throw new Error("Không tìm thấy dây hụi")
  if (group.status !== "OPEN") throw new Error("Dây hụi đã bắt đầu hoạt động, không thể tham gia")
  
  if (hasPassedJoinDeadline(group.startDate)) {
    throw new Error(`Đã hết hạn đăng ký tham gia (Hạn chốt: ${formatDate(getJoinDeadlineDate(group.startDate))})`)
  }
  
  // Check if already a member
  const isMember = group.huiMembers.some(m => m.userId === user.id)
  if (isMember) return
  
  // Add member
  await prisma.huiMember.create({
    data: {
      huiGroupId: groupId,
      userId: user.id,
      slots: 1
    }
  })
  
  // Update totalSlots count
  await prisma.huiGroup.update({
    where: { id: groupId },
    data: {
      totalSlots: group.totalSlots + 1
    }
  })
  
  revalidatePath("/", "layout")
}

export async function startHuiGroup(groupId: string) {
  const user = await requireUser()
  if (user.role !== "ADMIN") throw new Error("Chỉ có chủ hụi mới được bắt đầu dây hụi")
  
  const group = await prisma.huiGroup.findUnique({
    where: { id: groupId },
    include: { huiMembers: true, sessions: true }
  })
  
  if (!group) throw new Error("Không tìm thấy dây hụi")
  if (group.status !== "OPEN") throw new Error("Dây hụi đã hoạt động")
  if (group.huiMembers.length < 2) throw new Error("Dây hụi cần tối thiểu 2 thành viên mới có thể bắt đầu")
  
  const N = group.huiMembers.length
  
  // Calculate session dates
  const sessionDates = calculateSessionDates(group.startDate, group.cycle, group.biddingDays || "", N)
  
  // Delete any auto-generated sessions to start clean
  await prisma.huiSession.deleteMany({
    where: { huiGroupId: groupId }
  })
  
  // Create all N sessions
  for (let i = 0; i < N; i++) {
    await prisma.huiSession.create({
      data: {
        huiGroupId: groupId,
        sessionNumber: i + 1,
        openDate: sessionDates[i],
        status: i === 0 ? "BIDDING" : "PENDING",
        bidAmount: 0,
        winnerReceivedAmount: 0
      }
    })
  }
  
  // Update group status to RUNNING
  await prisma.huiGroup.update({
    where: { id: groupId },
    data: {
      status: "RUNNING",
      totalSlots: N
    }
  })
  
  revalidatePath("/", "layout")
}

export async function deleteHuiGroup(id: string) {
  await prisma.huiGroup.delete({
    where: { id }
  })
  revalidatePath("/", "layout")
}
