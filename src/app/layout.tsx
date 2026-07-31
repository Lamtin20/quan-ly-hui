import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hệ thống Quản lý Dây Hụi",
  description: "Phần mềm quản lý dây hụi chuyên nghiệp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-white to-slate-50 text-foreground`}
      >
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar />
            <main className="w-full h-screen overflow-y-auto">
              <div className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-indigo-100 bg-white/70 px-4 backdrop-blur-md shadow-sm">
                <SidebarTrigger />
                <div className="font-semibold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  Hệ thống Quản lý Hụi
                </div>
              </div>
              <div className="p-6 max-w-7xl mx-auto">{children}</div>
            </main>
          </SidebarProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
