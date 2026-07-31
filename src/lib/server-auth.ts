import { headers } from "next/headers"
import { prisma } from "./prisma"
import { redirect } from "next/navigation"

export async function getUser() {
  try {
    const reqHeaders = await headers()
    const userId = reqHeaders.get("x-user-id")
    
    if (!userId) return null
    
    const user = await prisma.user.findUnique({ 
      where: { id: userId } 
    })
    
    return user
  } catch (error) {
    console.error("Lỗi lấy thông tin người dùng:", error)
    return null
  }
}

export async function requireUser() {
  const user = await getUser()
  if (!user) {
    redirect("/login")
  }
  return user
}
