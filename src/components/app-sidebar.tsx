"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Calendar, LayoutDashboard, Users, CircleDollarSign, Settings, Bell } from "lucide-react"

const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Quản lý Dây Hụi",
    url: "/groups",
    icon: CircleDollarSign,
  },
  {
    title: "Thành viên",
    url: "/members",
    icon: Users,
  },
  {
    title: "Kỳ Mở Hụi",
    url: "/sessions",
    icon: Calendar,
  },
]

export function AppSidebar() {
  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="h-16 flex items-center border-b px-4 mt-2">
        <div className="flex items-center gap-2 font-semibold text-lg text-primary truncate">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CircleDollarSign className="size-5" />
          </div>
          <span className="group-data-[collapsible=icon]:hidden">Hụi Manager</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Chính</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <a href={item.url} className="w-full block">
                    <SidebarMenuButton tooltip={item.title}>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </a>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <a href="/settings" className="w-full block">
              <SidebarMenuButton tooltip="Cài đặt">
                <Settings />
                <span>Cài đặt</span>
              </SidebarMenuButton>
            </a>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
