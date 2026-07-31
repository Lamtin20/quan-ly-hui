import { prisma } from "@/lib/prisma"
import { GroupList } from "./group-list"

export default async function GroupsPage() {
  const groups = await prisma.huiGroup.findMany({
    include: {
      _count: {
        select: { huiMembers: true, sessions: true }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  const members = await prisma.member.findMany({
    orderBy: { fullName: "asc" }
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Dây Hụi</h1>
          <p className="text-muted-foreground mt-1">
            Tạo và theo dõi các dây hụi hiện tại.
          </p>
        </div>
      </div>

      <GroupList initialGroups={groups} members={members} />
    </div>
  )
}
