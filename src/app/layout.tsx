import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { headers } from "next/headers";
import { BottomNav } from "@/components/bottom-nav";
import NextTopLoader from "nextjs-toploader";
import { prisma } from "@/lib/prisma";
import { UserHeaderMenu } from "@/components/user-header-menu";
import { PWARegister } from "@/components/pwa-register";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Hệ thống Quản lý Dây Hụi",
  description: "Phần mềm quản lý dây hụi chuyên nghiệp",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hụi Manager"
  }
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const reqHeaders = await headers()
  const userId = reqHeaders.get("x-user-id")
  const role = reqHeaders.get("x-user-role")

  const user = userId ? await prisma.user.findUnique({
    where: { id: userId }
  }) : null

  // Nếu không đăng nhập (đang ở trang Login/Register)
  if (!userId || !user) {
    return (
      <html lang="vi">
        <body className={`${inter.variable} font-sans antialiased`}>
          <NextTopLoader color="#6366f1" showSpinner={false} />
          <PWARegister />
          {children}
        </body>
      </html>
    )
  }

  return (
    <html lang="vi">
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-white to-slate-50 text-foreground pb-16 md:pb-0`}
      >
        <NextTopLoader color="#6366f1" showSpinner={false} />
        <PWARegister />
        <TooltipProvider>
          <SidebarProvider>
            {/* Sidebar cho Desktop */}
            <div className="hidden md:block">
              <AppSidebar />
            </div>

            <main className="w-full h-screen overflow-y-auto">
              <div className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-indigo-100 bg-white/70 px-4 backdrop-blur-md shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="hidden md:block"><SidebarTrigger /></div>
                  <div className="font-bold text-base md:text-lg bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    Hệ thống Quản lý Hụi
                  </div>
                </div>
                
                {/* Thông tin User Header */}
                <UserHeaderMenu user={user} />
              </div>

              <div className="p-4 md:p-6 max-w-7xl mx-auto">
                {children}
              </div>
            </main>

            {/* Bottom Nav cho Mobile */}
            <BottomNav />
            
          </SidebarProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
