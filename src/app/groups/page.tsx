import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/server-auth"
import { GroupList } from "./group-list"

export default async function GroupsPage() {
  const user = await requireUser()
  const isAdmin = user.role === "ADMIN"

  const groups = await prisma.huiGroup.findMany({
    where: isAdmin ? {} : { huiMembers: { some: { userId: user.id } } },
    include: {
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
          <h1 className="text-3xl font-bold tracking-tight">Dây Hụi Của Bạn</h1>
          <p className="text-muted-foreground mt-1">
            Theo dõi và tham gia đấu giá (kêu hụi) các kỳ đang mở.
          </p>
        </div>
      </div>

      <GroupList initialGroups={groups} members={members} isAdmin={isAdmin} />
    </div>
  )
}
