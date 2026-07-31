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

