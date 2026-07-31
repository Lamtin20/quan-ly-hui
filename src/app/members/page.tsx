import { prisma } from "@/lib/prisma"
import { MemberList } from "./member-list"

export default async function MembersPage() {
  const members = await prisma.member.findMany({
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Thành Viên</h1>
          <p className="text-muted-foreground mt-1">
            Danh sách người chơi hụi và thông tin thanh toán (ngân hàng).
          </p>
        </div>
      </div>

      <MemberList initialMembers={members} />
    </div>
  )
}
