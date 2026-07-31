import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { GroupDetail } from "./group-detail"
import { requireUser } from "@/lib/server-auth"

export default async function GroupDetailPage(props: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const isAdmin = user.role === "ADMIN"

  const params = await props.params;
  const groupId = params.id
  
  const group = await prisma.huiGroup.findUnique({
    where: { id: groupId },
    include: {
      huiMembers: {
        include: { user: true }
      },
      sessions: {
        include: {
          payments: {
            include: { user: true }
          }
        },
        orderBy: { sessionNumber: "asc" }
      }
    }
  })

  if (!group) notFound()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
          <p className="text-muted-foreground mt-1">
            Chi tiết các kỳ khui hụi và công nợ của dây hụi này.
          </p>
        </div>
      </div>

      <GroupDetail initialGroup={group} isAdmin={isAdmin} />
    </div>
  )
}
