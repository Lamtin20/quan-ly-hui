import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getVietnamLocalDateString(date: Date | string): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ""
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  
  const parts = formatter.formatToParts(d)
  const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]))
  return `${partMap.year}-${partMap.month}-${partMap.day}`
}

export function getJoinDeadlineDate(startDate: Date | string): Date {
  const date = new Date(startDate)
  // Deadline is the day before the start date
  date.setDate(date.getDate() - 1)
  return date
}

export function hasPassedJoinDeadline(startDate: Date | string): boolean {
  const nowStr = getVietnamLocalDateString(new Date())
  const startStr = getVietnamLocalDateString(startDate)
  return nowStr >= startStr
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  })
}

export function getWinnerMemberId(session: any, group: any): string | null {
  if (session.winnerMemberId) return session.winnerMemberId
  if (!session.winnerUserId) return null

  const candidateMembers = group.huiMembers.filter((m: any) => {
    const transferredToWinnerLater = group.transferHistories?.some((th: any) => 
      th.memberId === m.id && 
      th.toUserId === session.winnerUserId && 
      th.sessionNumber && 
      th.sessionNumber >= session.sessionNumber
    )
    if (transferredToWinnerLater) return false
    return m.userId === session.winnerUserId || group.transferHistories?.some((th: any) => th.memberId === m.id && th.fromUserId === session.winnerUserId)
  })

  candidateMembers.sort((a: any, b: any) => {
    const aIsOriginal = !group.transferHistories?.some((th: any) => th.memberId === a.id)
    const bIsOriginal = !group.transferHistories?.some((th: any) => th.memberId === b.id)
    if (aIsOriginal && !bIsOriginal) return -1
    if (!aIsOriginal && bIsOriginal) return 1
    return 0
  })

  return candidateMembers[0]?.id || null
}

export function getMemberOwnerAtSession(member: any, sessionNumber: number, group: any): string {
  const transfers = group.transferHistories
    ?.filter((th: any) => th.memberId === member.id)
    ?.sort((a: any, b: any) => (a.sessionNumber || 0) - (b.sessionNumber || 0)) || []

  if (transfers.length === 0) {
    return member.userId
  }

  for (let i = transfers.length - 1; i >= 0; i--) {
    const th = transfers[i]
    if (th.sessionNumber && sessionNumber >= th.sessionNumber) {
      return th.toUserId
    }
  }
  return transfers[0].fromUserId
}


