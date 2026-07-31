import { redirect } from "next/navigation"

export default function SessionsPage() {
  // Thay vì 404, chúng ta chuyển hướng về trang Quản lý Dây Hụi
  // Nơi người dùng có thể chọn từng dây để xem kỳ khui hụi
  redirect("/groups")
}
