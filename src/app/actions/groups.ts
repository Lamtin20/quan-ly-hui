"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createHuiGroup(data: {
  name: string
  amount: number
  cycle: string
  maxBidPercentage: number
  startDate: Date
  userIds: string[]
}) {
  const { name, amount, cycle, maxBidPercentage, startDate, userIds } = data
  
  await prisma.huiGroup.create({
    data: {
      name,
      amount,
      cycle,
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

export async function deleteHuiGroup(id: string) {
  await prisma.huiGroup.delete({
    where: { id }
  })
  revalidatePath("/", "layout")
}
