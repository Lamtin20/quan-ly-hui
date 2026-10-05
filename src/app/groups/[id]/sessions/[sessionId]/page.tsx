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
        include: { 
          huiMembers: {
            include: { user: true }
          },
          transferHistories: {
            include: { fromUser: true, toUser: true }
          }
        }
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
    select: { winnerUserId: true, winnerMemberId: true, bidAmount: true, winnerReceivedAmount: true, sessionNumber: true }
  })
  const deadSet = new Set<string>()
  previousSessions.forEach(s => {
    if (s.winnerMemberId) {
      deadSet.add(s.winnerMemberId)
    } else if (s.winnerUserId) {
      const candidateMembers = session.huiGroup.huiMembers.filter((m: any) => {
        const transferredToWinnerLater = session.huiGroup.transferHistories?.some((th: any) => 
          th.memberId === m.id && 
          th.toUserId === s.winnerUserId && 
          th.sessionNumber && 
          th.sessionNumber >= s.sessionNumber
        )
        if (transferredToWinnerLater) return false
        return m.userId === s.winnerUserId || session.huiGroup.transferHistories?.some((th: any) => th.memberId === m.id && th.fromUserId === s.winnerUserId)
      })
      if (candidateMembers.length > 0) {
        deadSet.add(candidateMembers[0].id)
      }
    }
  })
  const deadIds = Array.from(deadSet)

  const winnerUser = session.winnerUserId 
    ? await prisma.user.findUnique({ where: { id: session.winnerUserId } }) 
    : null

  return (
    <BiddingArena 
      session={session} 
      currentUser={user} 
      deadIds={deadIds}
      winnerUser={winnerUser}
      previousSessions={previousSessions}
    />
  )
}
