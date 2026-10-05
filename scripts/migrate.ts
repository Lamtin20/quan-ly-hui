import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🚀 Bắt đầu quá trình đồng bộ (Migration) dữ liệu cũ sang cấu trúc Nhiều Chân Hụi...")

  // 1. Lấy tất cả HuiMember trên hệ thống
  const members = await prisma.huiMember.findMany({
    include: { huiGroup: true }
  })

  console.log(`Tìm thấy ${members.length} chân hụi đang có.`)

  let updatedBids = 0
  let updatedPayments = 0
  let updatedSessions = 0

  for (const member of members) {
    const groupId = member.huiGroupId
    const userId = member.userId

    // 2. Tìm tất cả các Bid của user này thuộc các kỳ hụi trong nhóm này
    const bids = await prisma.bid.findMany({
      where: {
        userId: userId,
        session: { huiGroupId: groupId }
      }
    })

    for (const bid of bids) {
      if (!bid.huiMemberId) {
        await prisma.bid.update({
          where: { id: bid.id },
          data: { huiMemberId: member.id }
        })
        updatedBids++
      }
    }

    // 3. Tìm tất cả Payment của user này trong nhóm
    const payments = await prisma.payment.findMany({
      where: {
        userId: userId,
        session: { huiGroupId: groupId }
      }
    })

    for (const payment of payments) {
      if (!payment.huiMemberId) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { huiMemberId: member.id }
        })
        updatedPayments++
      }
    }

    // 4. Tìm các Session mà user này trúng hụi trong nhóm
    const sessions = await prisma.huiSession.findMany({
      where: {
        huiGroupId: groupId,
        winnerUserId: userId
      }
    })

    for (const session of sessions) {
      if (!session.winnerMemberId) {
        await prisma.huiSession.update({
          where: { id: session.id },
          data: { winnerMemberId: member.id }
        })
        updatedSessions++
      }
    }
  }

  console.log(`✅ Đã cập nhật xong dữ liệu:`)
  console.log(`  - Bids: ${updatedBids} records`)
  console.log(`  - Payments: ${updatedPayments} records`)
  console.log(`  - Sessions: ${updatedSessions} records`)
  console.log("Hoàn tất Migration!")
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
