import { requireUser } from "@/lib/server-auth"
import { prisma } from "@/lib/prisma"
import { BiddingArena } from "./bidding-arena"
import { redirect } from "next/navigation"

export default async function SessionPage(props: { params: Promise<{ id: string, sessionId: string }> }) {
  const user = await requireUser()
  const { id, sessionId } = await props.params

  const session = await prisma.huiSession.findUnique({
    where: { id: sessionId },
    include: {
      huiGroup: {
        include: { huiMembers: true }
      },
      bids: {
        include: { user: true }
      },
      payments: {
        include: { user: true }
      }
    }
  })

  if (!session) return redirect(`/groups/${id}`)

  const previousSessions = await prisma.huiSession.findMany({
    where: { huiGroupId: id, status: "DONE" },
    select: { winnerUserId: true }
  })
  const deadIds = previousSessions.map(s => s.winnerUserId).filter(Boolean) as string[]

  const winnerUser = session.winnerUserId 
    ? await prisma.user.findUnique({ where: { id: session.winnerUserId } }) 
    : null

  return (
    <BiddingArena 
      session={session} 
      currentUser={user} 
      deadIds={deadIds}
      winnerUser={winnerUser}
    />
  )
}
