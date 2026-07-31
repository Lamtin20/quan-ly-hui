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

  // Access Control: Allow view if user is admin, is member, or if the group is public
  const isMember = group.huiMembers.some(m => m.userId === user.id)
  if (!isAdmin && !group.isPublic && !isMember) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{group.name}</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Chi tiết thành viên, lịch các kỳ khui hụi và công nợ.
          </p>
        </div>
      </div>

      <GroupDetail initialGroup={group} isAdmin={isAdmin} currentUser={user} />
    </div>
  )
}
