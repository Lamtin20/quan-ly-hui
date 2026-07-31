"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Play, 
  RotateCcw, 
  ArrowRight, 
  Trophy, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  TrendingUp, 
  UserCheck, 
  ShieldAlert, 
  CircleDollarSign, 
  Info,
  ChevronRight,
  Activity,
  ArrowRightLeft
} from "lucide-react"

// Types for Simulation
interface BidDetail {
  member: string
  amount: number
  isWinner?: boolean
}

interface SimulationDataPoint {
  cycle: number
  winner: string
  bid: number
  aliveCount: number
  deadCount: number
  liveContribution: number
  deadContribution: number
  totalReceived: number
  bids: BidDetail[]
  winnerText: string
}

// 10-Cycle Bidding simulation data
const SIMULATION_DATA: SimulationDataPoint[] = [
  {
    cycle: 0,
    winner: "",
    bid: 0,
    aliveCount: 10,
    deadCount: 0,
    liveContribution: 1000000,
    deadContribution: 0,
    totalReceived: 0,
    bids: [],
    winnerText: "Dây hụi vừa thành lập. Cả 10 thành viên đều ở trạng thái Hụi Sống."
  },
  {
    cycle: 1,
    winner: "C",
    bid: 100000,
    aliveCount: 9,
    deadCount: 0,
    liveContribution: 900000,
    deadContribution: 0,
    totalReceived: 8100000,
    bids: [
      { member: "A", amount: 20000 },
      { member: "B", amount: 50000 },
      { member: "C", amount: 100000, isWinner: true },
      { member: "D", amount: 80000 }
    ],
    winnerText: "C thắng đấu giá kỳ 1 với mức kêu 100.000đ. Nhận về 8.100.000đ từ 9 người hụi sống."
  },
  {
    cycle: 2,
    winner: "G",
    bid: 80000,
    aliveCount: 8,
    deadCount: 1,
    liveContribution: 920000,
    deadContribution: 1000000,
    totalReceived: 8360000,
    bids: [
      { member: "A", amount: 30000 },
      { member: "E", amount: 45000 },
      { member: "G", amount: 80000, isWinner: true },
      { member: "H", amount: 60000 }
    ],
    winnerText: "G thắng đấu giá kỳ 2 với mức kêu 80.000đ. Nhận về 8.360.000đ (C đóng 1.000.000đ, 8 hụi sống còn lại đóng 920.000đ/người)."
  },
  {
    cycle: 3,
    winner: "F",
    bid: 70000,
    aliveCount: 7,
    deadCount: 2,
    liveContribution: 930000,
    deadContribution: 1000000,
    totalReceived: 8510000,
    bids: [
      { member: "B", amount: 40000 },
      { member: "D", amount: 50000 },
      { member: "F", amount: 70000, isWinner: true },
      { member: "I", amount: 30000 }
    ],
    winnerText: "F thắng đấu giá kỳ 3 với mức kêu 70.000đ. Nhận về 8.510.000đ (C, G đóng 1.000.000đ/người, 7 hụi sống đóng 930.000đ/người)."
  },
  {
    cycle: 4,
    winner: "A",
    bid: 60000,
    aliveCount: 6,
    deadCount: 3,
    liveContribution: 940000,
    deadContribution: 1000000,
    totalReceived: 8640000,
    bids: [
      { member: "A", amount: 60000, isWinner: true },
      { member: "D", amount: 40000 },
      { member: "E", amount: 50000 },
      { member: "H", amount: 30000 }
    ],
    winnerText: "A thắng đấu giá kỳ 4 với mức kêu 60.000đ. Nhận về 8.640.000đ (3 hụi chết đóng 3.000.000đ, 6 hụi sống đóng 940.000đ/người)."
  },
  {
    cycle: 5,
    winner: "E",
    bid: 50000,
    aliveCount: 5,
    deadCount: 4,
    liveContribution: 950000,
    deadContribution: 1000000,
    totalReceived: 8750000,
    bids: [
      { member: "B", amount: 30000 },
      { member: "D", amount: 40000 },
      { member: "E", amount: 50000, isWinner: true },
      { member: "I", amount: 20000 }
    ],
    winnerText: "E thắng đấu giá kỳ 5 với mức kêu 50.000đ. Nhận về 8.750.000đ (4 hụi chết đóng 4.000.000đ, 5 hụi sống đóng 950.000đ/người)."
  },
  {
    cycle: 6,
    winner: "B",
    bid: 40000,
    aliveCount: 4,
    deadCount: 5,
    liveContribution: 960000,
    deadContribution: 1000000,
    totalReceived: 8840000,
    bids: [
      { member: "B", amount: 40000, isWinner: true },
      { member: "D", amount: 20000 },
      { member: "H", amount: 30000 },
      { member: "J", amount: 10000 }
    ],
    winnerText: "B thắng đấu giá kỳ 6 với mức kêu 40.000đ. Nhận về 8.840.000đ (5 hụi chết đóng 5.000.000đ, 4 hụi sống đóng 960.000đ/người)."
  },
  {
    cycle: 7,
    winner: "D",
    bid: 30000,
    aliveCount: 3,
    deadCount: 6,
    liveContribution: 970000,
    deadContribution: 1000000,
    totalReceived: 8910000,
    bids: [
      { member: "D", amount: 30000, isWinner: true },
      { member: "H", amount: 20000 },
      { member: "I", amount: 15000 }
    ],
    winnerText: "D thắng đấu giá kỳ 7 với mức kêu 30.000đ. Nhận về 8.910.000đ (6 hụi chết đóng 6.000.000đ, 3 hụi sống đóng 970.000đ/người)."
  },
  {
    cycle: 8,
    winner: "H",
    bid: 20000,
    aliveCount: 2,
    deadCount: 7,
    liveContribution: 980000,
    deadContribution: 1000000,
    totalReceived: 8960000,
    bids: [
      { member: "H", amount: 20000, isWinner: true },
      { member: "I", amount: 10000 },
      { member: "J", amount: 5000 }
    ],
    winnerText: "H thắng đấu giá kỳ 8 với mức kêu 20.000đ. Nhận về 8.960.000đ (7 hụi chết đóng 7.000.000đ, 2 hụi sống đóng 980.000đ/người)."
  },
  {
    cycle: 9,
    winner: "I",
    bid: 10000,
    aliveCount: 1,
    deadCount: 8,
    liveContribution: 990000,
    deadContribution: 1000000,
    totalReceived: 8990000,
    bids: [
      { member: "I", amount: 10000, isWinner: true },
      { member: "J", amount: 0 }
    ],
    winnerText: "I thắng đấu giá kỳ 9 với mức kêu 10.000đ. Nhận về 8.990.000đ (8 hụi chết đóng 8.000.000đ, 1 hụi sống còn lại đóng 990.000đ)."
  },
  {
    cycle: 10,
    winner: "J",
    bid: 0,
    aliveCount: 0,
    deadCount: 9,
    liveContribution: 0,
    deadContribution: 1000000,
    totalReceived: 10000000,
    bids: [],
    winnerText: "Kỳ cuối cùng. J là người duy nhất chưa hốt. Không cần đấu giá, J nhận về đủ 10.000.000đ. Dây hụi kết thúc tốt đẹp."
  }
]

const MEMBERS_LIST = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]

export default function GuidePage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  // Calculate circular coordinates for members (Radius: 95px, Center: 120px)
  const getAvatarCoords = (index: number) => {
    const total = 10
    const radius = 95
    const centerX = 120
    const centerY = 120
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    return { x: Math.round(x), y: Math.round(y) }
  }

  // Check status of member at step
  const getMemberStatus = (member: string, step: number) => {
    if (step === 0) return "ALIVE"
    const currentData = SIMULATION_DATA[step]
    
    // If we are showing a completed step, the current winner has turned dead
    // In our manual walkthrough steps:
    // S=1: winner C is highlighted, but we show the state transition.
    // Let's mark anyone who won in cycles 1 to S-1 as dead.
    // If the step is fully completed (we are displaying step S details), the current winner is highlighted.
    for (let i = 1; i < step; i++) {
      if (SIMULATION_DATA[i].winner === member) return "DEAD"
    }
    
    if (SIMULATION_DATA[step].winner === member) {
      return "WINNER"
    }
    return "ALIVE"
  }

  // Calculate total paid, total received and net profit for a member at a specific simulation step
  const getMemberStatsAtStep = (member: string, step: number) => {
    let totalPaid = 0
    let totalReceived = 0
    
    // Find which cycle this member wins
    const winCycle = SIMULATION_DATA.findIndex(d => d.winner === member)
    
    for (let i = 1; i <= step; i++) {
      const cycleData = SIMULATION_DATA[i]
      if (!cycleData) continue
      
      if (cycleData.winner === member) {
        totalReceived = cycleData.totalReceived
      } else if (winCycle !== -1 && winCycle < i) {
        // Already won in a previous cycle, so they are a dead member contributing 1,000,000đ
        totalPaid += 1000000
      } else {
        // Haven't won yet, so they are a living member contributing 1,000,000đ - Bid
        totalPaid += (1000000 - cycleData.bid)
      }
    }
    
    return {
      totalPaid,
      totalReceived,
      profit: totalReceived > 0 ? (totalReceived - totalPaid) : -totalPaid
    }
  }

  const handleNextStep = () => {
    if (currentStep >= 10) return
    setAnimating(true)
    // Run flying money animation for 1.2s then update state
    setTimeout(() => {
      setAnimating(false)
      setCurrentStep(prev => prev + 1)
    }, 1200)
  }

  const handlePrevStep = () => {
    if (currentStep <= 0) return
    setCurrentStep(prev => prev - 1)
  }

  const handleReset = () => {
    setCurrentStep(0)
    setIsPlaying(false)
  }

  // Auto-play simulator
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      if (currentStep >= 10) {
        setIsPlaying(false)
      } else {
        interval = setInterval(() => {
          handleNextStep()
        }, 3000) // Trigger next step every 3 seconds (1.2s animation + 1.8s pause)
      }
    }
    return () => clearInterval(interval)
  }, [isPlaying, currentStep])

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
  }

  // Setup sample bids for Card 2
  const sampleBids = [
    { name: "C", bid: 100000, percent: 100, isWinner: true },
    { name: "D", bid: 80000, percent: 80, isWinner: false },
    { name: "B", bid: 50000, percent: 50, isWinner: false },
    { name: "A", bid: 20000, percent: 20, isWinner: false }
  ]

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16 px-4 sm:px-6">
      
      {/* Dynamic Keyframes for Money Fly */}
      <style>{`
        @keyframes money-fly {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          80% {
            opacity: 0.9;
          }
          100% {
            transform: translate(var(--target-x), var(--target-y)) scale(1.3) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-money-fly {
          animation: money-fly 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-dash-line {
          stroke-dasharray: 6 4;
          animation: dash 1.5s linear infinite;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        .navy-header {
          background: linear-gradient(135deg, #0B192C 0%, #1E3E62 100%);
        }
      `}</style>

      {/* HEADER SECTION */}
      <div className="relative overflow-hidden rounded-[20px] navy-header text-white p-8 md:p-12 shadow-2xl border border-slate-800">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative z-10 space-y-4 max-w-3xl mx-auto text-center">
          <Badge className="bg-emerald-500 hover:bg-emerald-500 text-slate-950 font-bold uppercase tracking-wider text-xs px-3 py-1 rounded-full shadow-sm">
            Cơ Chế Hụi Không Có Chủ Hụi
          </Badge>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mt-2 leading-tight">
            HƯỚNG DẪN CHƠI HỤI KHÔNG CHỦ
          </h1>
          <p className="text-slate-300 font-medium text-sm md:text-lg">
            Hụi sống • Hụi chết • Tự do đấu giá mỗi kỳ minh bạch
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-white/10 mt-8 text-left max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold text-xs">✕</div>
              <span className="text-xs text-slate-300 font-bold">Không có chủ hụi</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold text-xs">✕</div>
              <span className="text-xs text-slate-300 font-bold">Không tốn hoa hồng</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">✓</div>
              <span className="text-xs text-slate-300 font-bold">Đấu giá tự động</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">✓</div>
              <span className="text-xs text-slate-300 font-bold">Giá cao nhất được hốt</span>
            </div>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: GUIDES & TIMELINE (60%) */}
        <div className="lg:col-span-7 space-y-8 relative pl-2 sm:pl-8">
          
          {/* Vertical Timeline Connection Line */}
          <div className="absolute left-6 sm:left-12 top-6 bottom-6 w-0.5 bg-gradient-to-b from-indigo-500 via-emerald-400 to-slate-200" />

          {/* CARD 1: Bước 1: Thành lập dây hụi */}
          <div className="relative group transition-all duration-300">
            <div className="absolute left-0 sm:left-6 w-8 h-8 sm:w-12 sm:h-12 rounded-full border border-indigo-200 bg-white flex items-center justify-center shadow-md text-indigo-600 font-bold z-10 transition-transform group-hover:scale-110">
              1
            </div>
            <Card className="ml-10 sm:ml-20 rounded-[20px] glass-card shadow-sm hover:shadow-md transition-all duration-300 border-indigo-100">
              <CardHeader className="pb-3">
                <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border border-indigo-100 rounded-md w-fit text-[10px] font-bold uppercase tracking-wider">
                  Bước 1
                </Badge>
                <CardTitle className="text-xl font-bold text-slate-800 mt-2">Thành lập dây hụi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Một nhóm người tin cậy cùng nhau thiết lập một dây hụi với số chân hụi (phần tham gia), mệnh giá đóng góp, và chu kỳ khui rõ ràng.
                </p>
                
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-2 text-xs font-semibold text-indigo-950">
                  <span className="text-indigo-600 uppercase font-black text-[10px]">Ví dụ thực tế</span>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="bg-white p-2 rounded-lg border border-indigo-100/50">
                      <div className="text-[10px] text-slate-400 font-bold">Thành viên</div>
                      <div className="text-sm font-black text-slate-800">10 Người</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-indigo-100/50">
                      <div className="text-[10px] text-slate-400 font-bold">Mệnh giá</div>
                      <div className="text-sm font-black text-slate-800">1.000.000đ</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-indigo-100/50">
                      <div className="text-[10px] text-slate-400 font-bold">Tổng kỳ chơi</div>
                      <div className="text-sm font-black text-slate-800">10 Kỳ</div>
                    </div>
                  </div>
                </div>

                {/* Circular Network Diagram Illustration */}
                <div className="pt-2">
                  <div className="relative w-48 h-48 mx-auto bg-slate-50/50 border border-slate-100 rounded-full flex items-center justify-center shadow-inner">
                    <svg className="absolute inset-0 w-full h-full text-indigo-100" viewBox="0 0 200 200">
                      <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" className="text-indigo-200/50" />
                      <path d="M 100 30 L 100 170" stroke="currentColor" strokeWidth="0.8" className="text-indigo-100" />
                      <path d="M 30 100 L 170 100" stroke="currentColor" strokeWidth="0.8" className="text-indigo-100" />
                      <path d="M 50 50 L 150 150" stroke="currentColor" strokeWidth="0.8" className="text-indigo-100" />
                      <path d="M 150 50 L 50 150" stroke="currentColor" strokeWidth="0.8" className="text-indigo-100" />
                    </svg>
                    
                    {MEMBERS_LIST.map((m, idx) => {
                      const angle = (idx * 2 * Math.PI) / 10 - Math.PI / 2
                      const x = 100 + 72 * Math.cos(angle)
                      const y = 100 + 72 * Math.sin(angle)
                      return (
                        <div
                          key={m}
                          className="absolute w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center shadow-sm text-xs font-black text-slate-700"
                          style={{
                            left: `${x - 16}px`,
                            top: `${y - 16}px`
                          }}
                        >
                          {m}
                        </div>
                      )
                    })}
                    <div className="relative z-10 text-center px-4 bg-white py-1 rounded-full shadow-md border border-slate-200/50">
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider">Phi Tập Trung</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CARD 2: Bước 2: Đến kỳ góp hụi */}
          <div className="relative group transition-all duration-300">
            <div className="absolute left-0 sm:left-6 w-8 h-8 sm:w-12 sm:h-12 rounded-full border border-indigo-200 bg-white flex items-center justify-center shadow-md text-indigo-600 font-bold z-10 transition-transform group-hover:scale-110">
              2
            </div>
            <Card className="ml-10 sm:ml-20 rounded-[20px] glass-card shadow-sm hover:shadow-md transition-all duration-300 border-indigo-100">
              <CardHeader className="pb-3">
                <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border border-indigo-100 rounded-md w-fit text-[10px] font-bold uppercase tracking-wider">
                  Bước 2
                </Badge>
                <CardTitle className="text-xl font-bold text-slate-800 mt-2">Đến kỳ góp & Đấu giá</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Đầu mỗi kỳ, tất cả thành viên hụi sống (chưa hốt) muốn rút tiền sẽ tham gia đấu giá kín (kêu giá). Mức kêu giá thể hiện số tiền lãi chấp nhận chia sẻ để đổi lấy quyền nhận vốn sớm.
                </p>

                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-3">Ví dụ mức kêu giá các thành viên:</span>
                  <div className="space-y-2.5">
                    {sampleBids.map((b) => (
                      <div key={b.name} className="flex items-center gap-3">
                        <span className="w-5 text-xs font-black text-slate-500">{b.name}</span>
                        <div className="flex-1 bg-white border border-slate-100 rounded-lg p-2 flex justify-between items-center shadow-sm">
                          <div className="w-full bg-slate-100 h-2 rounded-full mr-4 overflow-hidden relative">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${b.isWinner ? 'bg-emerald-500' : 'bg-indigo-400/50'}`}
                              style={{ width: `${b.percent}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold shrink-0 ${b.isWinner ? 'text-emerald-600' : 'text-slate-600'}`}>
                            {formatVND(b.bid)}
                          </span>
                        </div>
                        {b.isWinner && <Badge className="bg-emerald-500 text-white font-bold text-[9px] hover:bg-emerald-500 py-0.5 shadow-none rounded">Thắng</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CARD 3: Bước 3: Xác định giá hốt */}
          <div className="relative group transition-all duration-300">
            <div className="absolute left-0 sm:left-6 w-8 h-8 sm:w-12 sm:h-12 rounded-full border border-indigo-200 bg-white flex items-center justify-center shadow-md text-indigo-600 font-bold z-10 transition-transform group-hover:scale-110">
              3
            </div>
            <Card className="ml-10 sm:ml-20 rounded-[20px] glass-card shadow-sm hover:shadow-md transition-all duration-300 border-indigo-100">
              <CardHeader className="pb-3">
                <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border border-indigo-100 rounded-md w-fit text-[10px] font-bold uppercase tracking-wider">
                  Bước 3
                </Badge>
                <CardTitle className="text-xl font-bold text-slate-800 mt-2">Xác định người hốt hụi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Người kêu giá cao nhất kỳ đó sẽ giành quyền hốt hụi. Mức giá cao nhất này gọi là <strong>Giá Hốt</strong> của kỳ.
                </p>

                <div className="bg-emerald-50 border border-emerald-200/50 rounded-xl p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider">Kết quả kỳ 1</span>
                    <h4 className="text-sm font-bold text-slate-800">C kêu giá cao nhất: <span className="text-emerald-600 font-extrabold">100.000đ</span></h4>
                    <p className="text-[10px] text-slate-500">C trở thành người hốt kỳ đầu tiên.</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-sm animate-bounce">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <Badge className="bg-emerald-600 text-white text-[9px] hover:bg-emerald-600 py-0.5 rounded shadow-none font-bold">🏆 Người hốt</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CARD 4: Cách tính tiền góp */}
          <div className="relative group transition-all duration-300">
            <div className="absolute left-0 sm:left-6 w-8 h-8 sm:w-12 sm:h-12 rounded-full border border-indigo-200 bg-white flex items-center justify-center shadow-md text-indigo-600 font-bold z-10 transition-transform group-hover:scale-110">
              $
            </div>
            <Card className="ml-10 sm:ml-20 rounded-[20px] glass-card shadow-sm hover:shadow-md transition-all duration-300 border-indigo-100">
              <CardHeader className="pb-3">
                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-md w-fit text-[10px] font-bold uppercase tracking-wider">
                  Quy Tắc Tính Tiền
                </Badge>
                <CardTitle className="text-xl font-bold text-slate-800 mt-2">Cách tính tiền góp cực kỳ quan trọng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Living Member Card */}
                  <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/20 flex flex-col justify-between">
                    <div>
                      <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-none text-[9px] font-bold mb-2">Hụi Sống (Chưa Hốt)</Badge>
                      <h4 className="text-xs font-black text-slate-700 mb-2 uppercase tracking-wide">Tiền góp của hụi sống:</h4>
                      <div className="bg-white border border-emerald-100/50 p-2 rounded-lg text-center font-bold text-xs text-slate-800 space-y-1 mb-2">
                        <div>Mệnh giá - Giá hốt</div>
                        <div className="text-[10px] text-slate-400">1.000.000đ - 100.000đ</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      Ví dụ: Hạn chốt 100k → Bạn chỉ cần đóng <span className="font-bold text-emerald-600 text-sm">900.000đ</span>
                    </div>
                  </div>

                  {/* Dead Member Card */}
                  <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/20 flex flex-col justify-between">
                    <div>
                      <Badge className="bg-rose-100 text-rose-800 border border-rose-200 shadow-none text-[9px] font-bold mb-2">Hụi Chết (Đã Hốt)</Badge>
                      <h4 className="text-xs font-black text-slate-700 mb-2 uppercase tracking-wide">Tiền góp của hụi chết:</h4>
                      <div className="bg-white border border-rose-100/50 p-2 rounded-lg text-center font-bold text-xs text-slate-800 space-y-1 mb-2">
                        <div className="text-rose-600 font-black">Luôn đóng 100% Mệnh giá</div>
                        <div className="text-[10px] text-slate-400">Không giảm giá</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      Dù kỳ này giá hốt là bao nhiêu → Bạn luôn phải góp đủ <span className="font-bold text-rose-600 text-sm">1.000.000đ</span>
                    </div>
                  </div>
                </div>

                {/* Profit Formula Card Section */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2 mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">💡</span>
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Cách tính Lợi nhuận (Lời / Lỗ):</span>
                  </div>
                  <div className="bg-white border border-slate-100 p-3 rounded-lg text-center font-bold text-xs text-slate-800 space-y-1">
                    <div className="text-indigo-600 font-black">Lợi nhuận = Tổng thực nhận − Tổng tiền đã đóng</div>
                    <div className="text-[10px] text-slate-400">Được hiển thị trực quan trong bộ giả lập bên phải</div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    - <strong>Người hốt sớm (Hụi chết sớm)</strong>: Có lợi thế nhận vốn lớn ngay lập tức nhưng có lợi nhuận âm (chịu chi phí lãi - tiền thảo).
                    <br />
                    - <strong>Người hốt muộn (Hụi sống lâu)</strong>: Đóng vai trò là người tiết kiệm, nhận lợi nhuận dương lớn (hưởng phần lãi tích lũy từ những người hốt trước).
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CARD 5: Ví dụ Kỳ 1 */}
          <div className="relative group transition-all duration-300">
            <div className="absolute left-0 sm:left-6 w-8 h-8 sm:w-12 sm:h-12 rounded-full border border-indigo-200 bg-white flex items-center justify-center shadow-md text-indigo-600 font-bold z-10 transition-transform group-hover:scale-110">
              K1
            </div>
            <Card className="ml-10 sm:ml-20 rounded-[20px] glass-card shadow-sm hover:shadow-md transition-all duration-300 border-indigo-100">
              <CardHeader className="pb-3">
                <Badge className="bg-slate-100 text-indigo-700 hover:bg-slate-100 border border-slate-200 rounded-md w-fit text-[10px] font-bold uppercase tracking-wider">
                  Kỳ 1
                </Badge>
                <CardTitle className="text-xl font-bold text-slate-800 mt-2">Ví dụ thực tế Kỳ 1</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Hụi sống</span>
                    <div className="font-extrabold text-indigo-600 mt-1">9 Người</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Hụi chết</span>
                    <div className="font-extrabold text-rose-600 mt-1">0 Người</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Giá hốt C</span>
                    <div className="font-extrabold text-emerald-600 mt-1">100.000đ</div>
                  </div>
                  <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                    <span className="text-[9px] font-bold text-amber-500 uppercase">C thực nhận</span>
                    <div className="font-extrabold text-amber-700 mt-1">8.100.000đ</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border rounded-lg text-xs leading-relaxed text-slate-600 font-medium">
                  <strong>Công thức:</strong> 9 hụi sống × (1.000.000đ − 100.000đ) = <span className="text-amber-700 font-bold">8.100.000đ</span>. Sau kỳ này, C chính thức trở thành <strong>HỤI CHẾT</strong> (không được đấu giá các kỳ sau nữa).
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CARD 6: Ví dụ Kỳ 2 */}
          <div className="relative group transition-all duration-300">
            <div className="absolute left-0 sm:left-6 w-8 h-8 sm:w-12 sm:h-12 rounded-full border border-indigo-200 bg-white flex items-center justify-center shadow-md text-indigo-600 font-bold z-10 transition-transform group-hover:scale-110">
              K2
            </div>
            <Card className="ml-10 sm:ml-20 rounded-[20px] glass-card shadow-sm hover:shadow-md transition-all duration-300 border-indigo-100">
              <CardHeader className="pb-3">
                <Badge className="bg-slate-100 text-indigo-700 hover:bg-slate-100 border border-slate-200 rounded-md w-fit text-[10px] font-bold uppercase tracking-wider">
                  Kỳ 2
                </Badge>
                <CardTitle className="text-xl font-bold text-slate-800 mt-2">Ví dụ thực tế Kỳ 2</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Hụi sống</span>
                    <div className="font-extrabold text-indigo-600 mt-1">8 Người</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Hụi chết</span>
                    <div className="font-extrabold text-rose-600 mt-1">1 Người (C)</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Giá hốt G</span>
                    <div className="font-extrabold text-emerald-600 mt-1">80.000đ</div>
                  </div>
                  <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                    <span className="text-[9px] font-bold text-amber-500 uppercase">G thực nhận</span>
                    <div className="font-extrabold text-amber-700 mt-1">8.360.000đ</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border rounded-lg text-xs leading-relaxed text-slate-600 font-medium">
                  <strong>Công thức:</strong> (8 hụi sống × 920.000đ) + (1 hụi chết × 1.000.000đ) = <span className="text-amber-700 font-bold">8.360.000đ</span>. G nhận tiền và trở thành <strong>HỤI CHẾT</strong> từ kỳ sau.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CARD 7: Ví dụ Kỳ 3 */}
          <div className="relative group transition-all duration-300">
            <div className="absolute left-0 sm:left-6 w-8 h-8 sm:w-12 sm:h-12 rounded-full border border-indigo-200 bg-white flex items-center justify-center shadow-md text-indigo-600 font-bold z-10 transition-transform group-hover:scale-110">
              K3
            </div>
            <Card className="ml-10 sm:ml-20 rounded-[20px] glass-card shadow-sm hover:shadow-md transition-all duration-300 border-indigo-100">
              <CardHeader className="pb-3">
                <Badge className="bg-slate-100 text-indigo-700 hover:bg-slate-100 border border-slate-200 rounded-md w-fit text-[10px] font-bold uppercase tracking-wider">
                  Kỳ 3
                </Badge>
                <CardTitle className="text-xl font-bold text-slate-800 mt-2">Ví dụ thực tế Kỳ 3</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Hụi sống</span>
                    <div className="font-extrabold text-indigo-600 mt-1">7 Người</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Hụi chết</span>
                    <div className="font-extrabold text-rose-600 mt-1">2 Người</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Giá hốt F</span>
                    <div className="font-extrabold text-emerald-600 mt-1">70.000đ</div>
                  </div>
                  <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                    <span className="text-[9px] font-bold text-amber-500 uppercase">F thực nhận</span>
                    <div className="font-extrabold text-amber-700 mt-1">8.510.000đ</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border rounded-lg text-xs leading-relaxed text-slate-600 font-medium">
                  <strong>Công thức:</strong> (7 hụi sống × 930.000đ) + (2 hụi chết × 2.000.000đ) = <span className="text-amber-700 font-bold">8.510.000đ</span>. F hốt hụi và trở thành hụi chết.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CARD 8: Chu trình hoạt động */}
          <div className="relative group transition-all duration-300">
            <div className="absolute left-0 sm:left-6 w-8 h-8 sm:w-12 sm:h-12 rounded-full border border-indigo-200 bg-white flex items-center justify-center shadow-md text-indigo-600 font-bold z-10 transition-transform group-hover:scale-110">
              🔄
            </div>
            <Card className="ml-10 sm:ml-20 rounded-[20px] glass-card shadow-sm hover:shadow-md transition-all duration-300 border-indigo-100">
              <CardHeader className="pb-3">
                <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border border-indigo-100 rounded-md w-fit text-[10px] font-bold uppercase tracking-wider">
                  Sơ đồ
                </Badge>
                <CardTitle className="text-xl font-bold text-slate-800 mt-2">Chu trình hoạt động</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Chu trình khui hụi lặp đi lặp lại qua các giai đoạn đấu giá, tính toán tiền góp và nhận tiền cho đến khi hết tất cả thành viên.
                </p>

                {/* Flow Diagram */}
                <div className="flex flex-col items-center gap-3 py-4 bg-slate-50/50 rounded-xl border">
                  {[
                    { label: "Đấu giá bí mật mỗi kỳ", icon: "🗳️" },
                    { label: "Xác định người thắng (Kêu giá cao nhất)", icon: "🏆" },
                    { label: "Hốt hụi (Thực nhận quỹ đóng góp)", icon: "💰" },
                    { label: "Trở thành Hụi Chết từ kỳ tiếp theo", icon: "⚡" },
                    { label: "Góp đủ 100% mệnh giá ở các kỳ sau", icon: "🔒" },
                    { label: "Những người còn lại tiếp tục đấu giá", icon: "👥" }
                  ].map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center w-full max-w-[280px]">
                      <div className="bg-white border border-slate-100 rounded-xl p-3 flex items-center gap-3 shadow-sm w-full transition-transform hover:-translate-y-0.5">
                        <span className="text-lg">{step.icon}</span>
                        <span className="text-xs font-bold text-slate-700">{step.label}</span>
                      </div>
                      {idx < 5 && (
                        <div className="h-6 flex items-center justify-center">
                          <svg className="w-4 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 13l-7 7-7-7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CARD 9: Khi nào kết thúc? */}
          <div className="relative group transition-all duration-300">
            <div className="absolute left-0 sm:left-6 w-8 h-8 sm:w-12 sm:h-12 rounded-full border border-indigo-200 bg-white flex items-center justify-center shadow-md text-indigo-600 font-bold z-10 transition-transform group-hover:scale-110">
              🏁
            </div>
            <Card className="ml-10 sm:ml-20 rounded-[20px] glass-card shadow-sm hover:shadow-md transition-all duration-300 border-indigo-100">
              <CardHeader className="pb-3">
                <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border border-indigo-100 rounded-md w-fit text-[10px] font-bold uppercase tracking-wider">
                  Kết thúc
                </Badge>
                <CardTitle className="text-xl font-bold text-slate-800 mt-2">Khi nào dây hụi kết thúc?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 text-3xl shadow-sm">
                    🎉
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Dây hụi kết thúc ở kỳ cuối cùng khi chỉ còn duy nhất 1 người chưa hốt hụi.
                    </p>
                    <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-xl text-xs font-semibold text-amber-950">
                      Người cuối cùng <strong>không cần đấu giá</strong>, không cần giảm giá, mà trực tiếp nhận về đủ 100% mệnh giá góp của tất cả thành viên chết: <span className="text-amber-700 font-extrabold text-sm">10.000.000đ</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CARD 10: Quy tắc vàng */}
          <div className="relative group transition-all duration-300">
            <div className="absolute left-0 sm:left-6 w-8 h-8 sm:w-12 sm:h-12 rounded-full border border-indigo-200 bg-white flex items-center justify-center shadow-md text-indigo-600 font-bold z-10 transition-transform group-hover:scale-110">
              👑
            </div>
            <Card className="ml-10 sm:ml-20 rounded-[20px] glass-card shadow-sm hover:shadow-md transition-all duration-300 border-indigo-100">
              <CardHeader className="pb-3">
                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-100 rounded-md w-fit text-[10px] font-bold uppercase tracking-wider">
                  Quy Tắc Vàng
                </Badge>
                <CardTitle className="text-xl font-bold text-slate-800 mt-2">Quy tắc vàng cần nhớ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {[
                    "Không có chủ hụi trung gian làm chênh lệch hoa hồng.",
                    "Không ai hưởng hoa hồng thu phí dây hụi.",
                    "Thành viên nào cần tiền gấp sẽ kêu giá đấu.",
                    "Ai kêu lãi cao nhất (giảm giá nhiều nhất) được nhận tiền.",
                    "Hụi sống đóng = Mệnh giá ban đầu − Giá hốt kỳ này.",
                    "Hụi chết luôn đóng đủ 100% mệnh giá ban đầu.",
                    "Người đã hốt hụi không được phép tham gia đấu giá tiếp.",
                    "Thành viên hốt kỳ cuối nhận đủ 100% tổng số tiền gốc."
                  ].map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-100/50 hover:bg-slate-50 transition-colors">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-600 font-bold text-[10px]">
                        ✓
                      </div>
                      <span className="text-xs font-bold text-slate-700">{rule}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CARD 11: Ví dụ trực quan */}
          <div className="relative group transition-all duration-300">
            <div className="absolute left-0 sm:left-6 w-8 h-8 sm:w-12 sm:h-12 rounded-full border border-indigo-200 bg-white flex items-center justify-center shadow-md text-indigo-600 font-bold z-10 transition-transform group-hover:scale-110">
              📊
            </div>
            <Card className="ml-10 sm:ml-20 rounded-[20px] glass-card shadow-sm hover:shadow-md transition-all duration-300 border-indigo-100">
              <CardHeader className="pb-3">
                <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border border-indigo-100 rounded-md w-fit text-[10px] font-bold uppercase tracking-wider">
                  Bảng Tổng Hợp
                </Badge>
                <CardTitle className="text-xl font-bold text-slate-800 mt-2">Bảng tổng hợp ví dụ kỳ hốt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto border border-slate-100 rounded-xl bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-3 text-[10px] font-black text-slate-400 uppercase">Kỳ</th>
                        <th className="p-3 text-[10px] font-black text-slate-400 uppercase">Người hốt</th>
                        <th className="p-3 text-[10px] font-black text-slate-400 uppercase">Giá hốt</th>
                        <th className="p-3 text-[10px] font-black text-slate-400 uppercase text-right">Tổng đóng</th>
                        <th className="p-3 text-[10px] font-black text-slate-400 uppercase text-right">Thực nhận</th>
                        <th className="p-3 text-[10px] font-black text-slate-400 uppercase text-right">Lợi nhuận</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3 font-extrabold text-slate-400">1</td>
                        <td className="p-3"><Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 shadow-none font-bold">C</Badge></td>
                        <td className="p-3 font-semibold text-slate-800">100.000đ</td>
                        <td className="p-3 text-right text-slate-600 font-medium">9.000.000đ</td>
                        <td className="p-3 text-right font-black text-amber-600">8.100.000đ</td>
                        <td className="p-3 text-right font-black text-rose-600">-900.000đ</td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3 font-extrabold text-slate-400">2</td>
                        <td className="p-3"><Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 shadow-none font-bold">G</Badge></td>
                        <td className="p-3 font-semibold text-slate-800">80.000đ</td>
                        <td className="p-3 text-right text-slate-600 font-medium">8.900.000đ</td>
                        <td className="p-3 text-right font-black text-amber-600">8.360.000đ</td>
                        <td className="p-3 text-right font-black text-rose-600">-540.000đ</td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3 font-extrabold text-slate-400">3</td>
                        <td className="p-3"><Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 shadow-none font-bold">F</Badge></td>
                        <td className="p-3 font-semibold text-slate-800">70.000đ</td>
                        <td className="p-3 text-right text-slate-600 font-medium">8.820.000đ</td>
                        <td className="p-3 text-right font-black text-amber-600">8.510.000đ</td>
                        <td className="p-3 text-right font-black text-rose-600">-310.000đ</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* RIGHT COLUMN: STICKY INTERACTIVE SIMULATOR (40%) */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-6">
          
          <Card className="rounded-[20px] border border-indigo-150 bg-slate-900 text-white shadow-xl overflow-hidden relative">
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />
            
            {/* Simulator Header */}
            <CardHeader className="border-b border-white/10 bg-slate-950/40 py-4 px-5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Giả Lập Tương Tác</span>
                </div>
                <Badge className="bg-indigo-600 text-white font-bold text-[10px] hover:bg-indigo-600 border border-indigo-500/20 px-2 py-0.5 rounded shadow-sm">
                  10 Thành Viên
                </Badge>
              </div>
              <CardTitle className="text-base font-bold text-white mt-1.5 flex items-center gap-1.5">
                <Activity className="h-4.5 w-4.5 text-emerald-400" />
                Mô phỏng chu kỳ dây hụi
              </CardTitle>
            </CardHeader>
            
            {/* Simulator Body */}
            <CardContent className="p-6 space-y-6 relative">
              
              {/* Circular Network Visualization */}
              <div className="relative w-60 h-60 mx-auto bg-slate-950/50 border border-white/5 rounded-full flex items-center justify-center shadow-inner">
                
                {/* SVG connection lines */}
                <svg className="absolute inset-0 w-full h-full text-white/5" viewBox="0 0 240 240">
                  <circle cx="120" cy="120" r="95" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                  
                  {/* Connect active winner to others when animating */}
                  {animating && SIMULATION_DATA[currentStep]?.winner && (
                    <>
                      {MEMBERS_LIST.map((m, idx) => {
                        const winner = SIMULATION_DATA[currentStep].winner
                        if (m === winner) return null
                        const start = getAvatarCoords(idx)
                        const wIdx = MEMBERS_LIST.indexOf(winner)
                        const end = getAvatarCoords(wIdx)
                        return (
                          <line
                            key={m}
                            x1={start.x}
                            y1={start.y}
                            x2={end.x}
                            y2={end.y}
                            stroke="rgba(16, 185, 129, 0.4)"
                            strokeWidth="1.5"
                            className="animate-dash-line"
                          />
                        )
                      })}
                    </>
                  )}
                </svg>
                
                {/* Money Flying Animation Components */}
                {animating && (
                  <div className="absolute inset-0 pointer-events-none z-20">
                    {MEMBERS_LIST.map((m, idx) => {
                      const winner = SIMULATION_DATA[currentStep]?.winner
                      if (!winner || m === winner) return null
                      
                      const startPos = getAvatarCoords(idx)
                      const wIdx = MEMBERS_LIST.indexOf(winner)
                      const endPos = getAvatarCoords(wIdx)
                      
                      const dx = endPos.x - startPos.x
                      const dy = endPos.y - startPos.y
                      
                      return (
                        <div
                          key={m}
                          className="absolute text-xl animate-money-fly"
                          style={{
                            left: `${startPos.x - 10}px`,
                            top: `${startPos.y - 10}px`,
                            "--target-x": `${dx}px`,
                            "--target-y": `${dy}px`
                          } as React.CSSProperties}
                        >
                          💵
                        </div>
                      )
                    })}
                  </div>
                )}
                
                {/* Circular Nodes */}
                {MEMBERS_LIST.map((m, idx) => {
                  const { x, y } = getAvatarCoords(idx)
                  const status = getMemberStatus(m, currentStep)
                  const isWinner = status === "WINNER"
                  const isDead = status === "DEAD"
                  
                  return (
                    <div
                      key={m}
                      className={`absolute w-11 h-11 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-500 z-10 ${
                        isWinner
                          ? "border-amber-400 ring-4 ring-amber-400/40 bg-amber-500 text-slate-950 scale-110 shadow-lg font-black"
                          : isDead
                          ? "border-rose-800 bg-rose-950/80 text-rose-300 shadow-sm opacity-60"
                          : "border-emerald-600 bg-emerald-950/80 text-emerald-300 shadow-sm font-bold"
                      }`}
                      style={{
                        left: `${x - 22}px`,
                        top: `${y - 22}px`
                      }}
                    >
                      <span className="text-xs leading-none">{m}</span>
                      <span className="text-[6.5px] font-bold tracking-wider uppercase mt-0.5 scale-90">
                        {isWinner ? "Hốt" : isDead ? "Chết" : "Sống"}
                      </span>
                    </div>
                  )
                })}
                
                {/* Center dial displaying current cycle */}
                <div className="relative z-0 text-center w-16 h-16 rounded-full bg-slate-950 border border-white/10 flex flex-col items-center justify-center shadow-2xl">
                  <span className="text-[7.5px] text-slate-500 font-black uppercase tracking-wider">KỲ HỌI</span>
                  <span className="text-xl font-black text-emerald-400 leading-none mt-1">
                    {currentStep === 0 ? "Bắt đầu" : `${currentStep}`}
                  </span>
                </div>
              </div>

              {/* Status & Simulation Log Text */}
              <div className="bg-slate-950/70 border border-white/5 rounded-xl p-4 min-h-[80px] flex flex-col justify-between">
                <p className="text-xs text-slate-300 leading-relaxed font-medium transition-all duration-300">
                  {SIMULATION_DATA[currentStep].winnerText}
                </p>
                {currentStep > 0 && (
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold border-t border-white/5 pt-2 mt-2">
                    <span className="flex items-center gap-1"><ArrowRightLeft className="h-3 w-3 text-indigo-400" /> Giá hốt: {formatVND(SIMULATION_DATA[currentStep].bid)}</span>
                    <span className="flex items-center gap-1"><Trophy className="h-3 w-3 text-amber-400" /> Người thắng: {SIMULATION_DATA[currentStep].winner}</span>
                  </div>
                )}
              </div>

              {/* Control Panel Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  onClick={handlePrevStep} 
                  disabled={currentStep === 0 || animating}
                  variant="outline" 
                  className="bg-transparent border-white/10 hover:bg-white/5 hover:text-white rounded-xl text-xs font-bold text-slate-400 disabled:opacity-40"
                >
                  Kỳ trước
                </Button>
                <Button 
                  onClick={handleReset} 
                  variant="outline" 
                  className="bg-transparent border-white/10 hover:bg-white/5 hover:text-white rounded-xl text-xs font-bold text-slate-400"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Đặt lại
                </Button>
                <Button 
                  onClick={handleNextStep} 
                  disabled={currentStep >= 10 || animating}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-40"
                >
                  {animating ? (
                    <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 animate-spin" /> Đang chuyển...</span>
                  ) : (
                    <span className="flex items-center gap-0.5">Kỳ tiếp theo <ChevronRight className="h-3.5 w-3.5 inline" /></span>
                  )}
                </Button>
              </div>

              {/* Calculation Summary box for current Step */}
              {currentStep > 0 && (
                <div className="border border-white/10 bg-slate-950/30 rounded-xl p-4 space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-slate-400 font-bold">Số người đã hốt (Chết):</span>
                    <span className="font-extrabold text-rose-400">{SIMULATION_DATA[currentStep].deadCount} người</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-slate-400 font-bold">Số người chưa hốt (Sống):</span>
                    <span className="font-extrabold text-indigo-400">{SIMULATION_DATA[currentStep].aliveCount} người</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 py-1 text-[11px] font-semibold">
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                      <span className="text-slate-500 block text-[9px] font-bold">HỤI SỐNG GÓP</span>
                      <span className="text-indigo-300 font-bold block mt-1">{formatVND(SIMULATION_DATA[currentStep].liveContribution)}</span>
                      <span className="text-[8px] text-slate-500 block mt-0.5">Mỗi người (1M - {formatVND(SIMULATION_DATA[currentStep].bid)})</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                      <span className="text-slate-500 block text-[9px] font-bold">HỤI CHẾT GÓP</span>
                      <span className="text-rose-300 font-bold block mt-1">1.000.000đ</span>
                      <span className="text-[8px] text-slate-500 block mt-0.5">Mỗi người (Gốc 1M)</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-white/5 text-sm">
                    <span className="text-slate-300 font-black flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      Tổng tiền thực nhận:
                    </span>
                    <span className="font-black text-amber-400 text-base">{formatVND(SIMULATION_DATA[currentStep].totalReceived)}</span>
                  </div>
                </div>
              )}

              {/* Simulation Progress bar */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                  <span>Tiến độ dây hụi</span>
                  <span>{currentStep} / 10 kỳ</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 via-emerald-400 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${currentStep * 10}%` }}
                  />
                </div>
              </div>

              {/* Dynamic Member Stats Table */}
              <div className="border border-white/10 bg-slate-950/40 rounded-xl overflow-hidden mt-4">
                <div className="bg-slate-950/80 px-3 py-2 flex justify-between items-center border-b border-white/5">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    Dòng tiền & Lợi nhuận thành viên (Theo kỳ hội)
                  </span>
                  <span className="text-[9px] text-emerald-400 font-bold">(Mệnh giá 1M)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-white/5 text-slate-500 border-b border-white/5">
                        <th className="p-2 font-bold">Mã</th>
                        <th className="p-2 font-bold text-center">Trạng thái</th>
                        <th className="p-2 font-bold text-right">Tổng đóng</th>
                        <th className="p-2 font-bold text-right">Thực nhận</th>
                        <th className="p-2 font-bold text-right">Lợi nhuận</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {MEMBERS_LIST.map(m => {
                        const stats = getMemberStatsAtStep(m, currentStep)
                        const status = getMemberStatus(m, currentStep)
                        const isWinner = status === "WINNER"
                        const isDead = status === "DEAD"
                        
                        return (
                          <tr key={m} className={`hover:bg-white/5 transition-colors ${isWinner ? 'bg-amber-500/10' : ''}`}>
                            <td className="p-2 font-bold flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                isWinner ? 'bg-amber-400 animate-pulse' :
                                isDead ? 'bg-rose-500' : 'bg-emerald-500'
                              }`} />
                              {m}
                            </td>
                            <td className="p-2 text-center">
                              {isWinner ? (
                                <Badge className="bg-amber-500/20 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 text-[8px] px-1 py-0.5 rounded shadow-none leading-none font-bold">HỐT</Badge>
                              ) : isDead ? (
                                <Badge className="bg-rose-500/20 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30 text-[8px] px-1 py-0.5 rounded shadow-none leading-none font-bold">CHẾT</Badge>
                              ) : (
                                <Badge className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 text-[8px] px-1 py-0.5 rounded shadow-none leading-none font-bold">SỐNG</Badge>
                              )}
                            </td>
                            <td className="p-2 text-right font-medium text-slate-300">{formatVND(stats.totalPaid)}</td>
                            <td className="p-2 text-right font-medium text-slate-300">{formatVND(stats.totalReceived)}</td>
                            <td className={`p-2 text-right font-black ${
                              stats.profit > 0 ? 'text-emerald-400' : stats.profit < 0 ? 'text-rose-400' : 'text-slate-400'
                            }`}>
                              {stats.profit > 0 ? `+${formatVND(stats.profit)}` : formatVND(stats.profit)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
          
        </div>

      </div>
    </div>
  )
}
