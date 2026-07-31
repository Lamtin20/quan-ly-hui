"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createHuiGroup(data: {
  name: string
  amount: number
  cycle: string
  maxBidPercentage: number
  startDate: Date
  memberIds: string[]
}) {
  const { name, amount, cycle, maxBidPercentage, startDate, memberIds } = data
  
  await prisma.huiGroup.create({
    data: {
      name,
      amount,
      cycle,
      maxBidPercentage,
      totalSlots: memberIds.length,
      startDate,
      huiMembers: {
        create: memberIds.map(memberId => ({
          memberId,
          slots: 1
        }))
      }
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
