"use server"

import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/server-auth"
import { revalidatePath } from "next/cache"

export async function updateSystemSettings(settings: { key: string; value: string }[]) {
  const user = await getUser()
  if (!user || user.role !== "ADMIN") throw new Error("Unauthorized")

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value }
    })
  }
  
  revalidatePath("/", "layout")
}
