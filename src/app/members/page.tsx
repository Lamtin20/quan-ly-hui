import { prisma } from "@/lib/prisma"
import { MemberList } from "./member-list"
import { headers } from "next/headers"

export default async function MembersPage() {
  const reqHeaders = await headers()
  const role = reqHeaders.get("x-user-role") || "MEMBER"

  const members = await prisma.user.findMany({
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Thành Viên Hệ Thống</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Danh sách người chơi hụi và thông tin thanh toán ngân hàng.
          </p>
        </div>
      </div>

      <MemberList initialMembers={members} currentUserRole={role} />
    </div>
  )
}
