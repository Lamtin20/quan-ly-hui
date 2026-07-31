"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CircleDollarSign, Landmark, HelpCircle, BookOpen, ShieldCheck, CheckCircle2 } from "lucide-react"

export default function GuidePage() {
  return (
    <div className="flex flex-col gap-8 pb-10 max-w-4xl mx-auto">
      <div className="border-b border-slate-100 pb-6">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 bg-clip-text text-transparent">
          Hướng Dẫn Chơi Hụi
        </h1>
        <p className="text-slate-500 mt-1 text-sm font-medium">
          Tìm hiểu các quy tắc chơi hụi, thuật ngữ cơ bản và cách hoạt động của hệ thống.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border border-indigo-100 bg-white/70 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-2xl">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-bold text-slate-800">1. Đóng Hụi</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Landmark className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Mỗi kỳ (tuần/tháng), các thành viên góp một số tiền cố định (tiền hụi chân) để tạo thành quỹ chung.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-purple-100 bg-white/70 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-2xl">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-bold text-slate-800">2. Kêu Hụi (Đấu Giá)</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <CircleDollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Các thành viên đưa ra mức lãi muốn trả (tiền thảo). Người đưa mức lãi cao nhất sẽ được quyền hốt hụi kỳ đó.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-emerald-100 bg-white/70 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-2xl">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-bold text-slate-800">3. Hốt Hụi & Trả Lãi</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Người hốt nhận toàn bộ quỹ chung sau khi trừ lãi cho hụi sống. Các kỳ sau họ phải đóng 100% tiền gốc (hụi chết).
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main explanation card */}
      <Card className="border border-slate-200/60 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.03)] rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-5 px-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-base font-bold text-slate-900">Chi Tiết Luật Chơi & Tính Toán</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Phân Biệt Hụi Sống và Hụi Chết
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-xs font-medium">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="font-bold text-indigo-600 text-sm">Hụi Sống (Chưa Hốt)</span>
                <p className="text-slate-500 leading-relaxed">
                  Là hụi viên chưa nhận tiền hốt hụi. Trong kỳ của người khác hốt, hụi viên sống chỉ cần đóng số tiền hụi sau khi đã trừ đi phần lãi (tiền kêu) của người hốt kỳ đó.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="font-bold text-purple-600 text-sm">Hụi Chết (Đã Hốt)</span>
                <p className="text-slate-500 leading-relaxed">
                  Là hụi viên đã nhận tiền hốt hụi ở các kỳ trước. Từ kỳ sau trở đi, thành viên này phải đóng đủ 100% số tiền hụi quy định ban đầu (không được trừ lãi của các kỳ đấu giá tiếp theo).
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-500" /> Câu Hỏi Thường Gặp
            </h3>
            <div className="divide-y divide-slate-100">
              <details className="group py-4 [&_summary::-webkit-details-marker]:hidden" open>
                <summary className="flex items-center justify-between cursor-pointer list-none focus:outline-none">
                  <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                    Tại sao nên hốt hụi muộn?
                  </span>
                  <span className="text-slate-400 group-open:rotate-180 transition-transform duration-200 text-[10px]">
                    ▼
                  </span>
                </summary>
                <p className="mt-3 text-xs text-slate-500 leading-relaxed font-medium">
                  Hốt hụi muộn tương đương với việc bạn gửi tiết kiệm nhận lãi suất cao. Các kỳ đầu bạn chỉ cần đóng số tiền đã trừ lãi của người hốt trước đó, đến kỳ cuối cùng bạn sẽ nhận về toàn bộ số tiền góp gốc mà không phải trả bất kỳ khoản lãi nào.
                </p>
              </details>

              <details className="group py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer list-none focus:outline-none">
                  <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                    Hốt hụi sớm có lợi ích gì?
                  </span>
                  <span className="text-slate-400 group-open:rotate-180 transition-transform duration-200 text-[10px]">
                    ▼
                  </span>
                </summary>
                <p className="mt-3 text-xs text-slate-500 leading-relaxed font-medium">
                  Hốt hụi sớm giúp bạn huy động một khoản vốn lớn ngay lập tức mà không cần thủ tục vay thế chấp ngân hàng phức tạp. Tuy nhiên, bạn sẽ phải chịu chi phí lãi suất (tiền thảo) cho các kỳ tiếp theo.
                </p>
              </details>

              <details className="group py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer list-none focus:outline-none">
                  <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                    Vai trò của Chủ Hụi (Admin) là gì?
                  </span>
                  <span className="text-slate-400 group-open:rotate-180 transition-transform duration-200 text-[10px]">
                    ▼
                  </span>
                </summary>
                <p className="mt-3 text-xs text-slate-500 leading-relaxed font-medium">
                  Chủ Hụi là người tổ chức dây hụi, thu tiền hụi của từng thành viên và giao cho người được hốt trong kỳ. Chủ hụi có trách nhiệm đôn đốc đóng hụi đúng kỳ hạn và bảo đảm an toàn dòng tiền cho cả dây hụi.
                </p>
              </details>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
