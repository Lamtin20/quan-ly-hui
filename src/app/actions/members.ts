"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createMember(data: {
  fullName: string
  phone: string
  bankName?: string
  bankAccountNumber?: string
}) {
  await prisma.member.create({
    data: {
      fullName: data.fullName,
      phone: data.phone,
      bankName: data.bankName,
      bankAccountNumber: data.bankAccountNumber,
    }
  })
  revalidatePath("/", "layout")
}

export async function deleteMember(id: string) {
  await prisma.member.delete({
    where: { id }
  })
  revalidatePath("/", "layout")
}
