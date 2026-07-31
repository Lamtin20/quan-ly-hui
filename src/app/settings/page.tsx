import { requireUser } from "@/lib/server-auth"
import { prisma } from "@/lib/prisma"
import { SettingsClient } from "./settings-client"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
  const currentUser = await requireUser()
  if (!currentUser) return redirect("/login")

  // Fetch full user data from db to ensure it's up to date
  const dbUser = await prisma.user.findUnique({
    where: { id: currentUser.id }
  })
  if (!dbUser) return redirect("/login")

  let allUsers: any[] = []
  if (dbUser.role === "ADMIN") {
    allUsers = await prisma.user.findMany({
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        phone: true,
        fullName: true,
        role: true,
        avatar: true
      }
    })
  }

  return (
    <SettingsClient currentUser={dbUser} allUsers={allUsers} />
  )
}
