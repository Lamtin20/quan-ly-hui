import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"

export default async function ActiveGroupPage() {
  const user = await requireUser()
  
  // Find the most recent active (RUNNING) or register-open (OPEN) group this user is a member of
  const activeMemberGroup = await prisma.huiGroup.findFirst({
    where: {
      status: { in: ["RUNNING", "OPEN"] },
      huiMembers: { some: { userId: user.id } }
    },
    orderBy: { createdAt: "desc" }
  })
  
  if (activeMemberGroup) {
    redirect(`/groups/${activeMemberGroup.id}`)
  } else {
    redirect(`/groups`)
  }
}
