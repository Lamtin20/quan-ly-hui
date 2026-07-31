import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/server-auth"
import { GroupList } from "./group-list"

export default async function GroupsPage() {
  const user = await requireUser()
  const isAdmin = user.role === "ADMIN"

  const groups = await prisma.huiGroup.findMany({
    where: isAdmin ? {} : {
      OR: [
        { huiMembers: { some: { userId: user.id } } },
        { isPublic: true }
      ]
    },
    include: {
      huiMembers: true,
      _count: {
        select: { huiMembers: true, sessions: true }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  const members = isAdmin ? await prisma.user.findMany({
    orderBy: { fullName: "asc" }
  }) : []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dây Hụi Của Bạn</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Theo dõi, đăng ký tham gia hoặc đấu giá kêu hụi các kỳ.
          </p>
        </div>
      </div>

      <GroupList initialGroups={groups} members={members} isAdmin={isAdmin} currentUserId={user.id} />
    </div>
  )
}
