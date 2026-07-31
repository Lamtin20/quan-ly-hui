import { headers } from "next/headers"
import { prisma } from "./prisma"

export async function getUser() {
  const reqHeaders = await headers()
  const userId = reqHeaders.get("x-user-id")
  
  if (!userId) return null
  
  const user = await prisma.user.findUnique({ 
    where: { id: userId } 
  })
  
  return user
}

export async function requireUser() {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")
  return user
}
