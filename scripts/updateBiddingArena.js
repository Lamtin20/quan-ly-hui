const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/groups/[id]/sessions/[sessionId]/bidding-arena.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Thay thế useState bidAmount
content = content.replace(
  'const [bidAmount, setBidAmount] = useState("")\n  const [isWhiteTicket, setIsWhiteTicket] = useState(false)',
  `const [bidAmounts, setBidAmounts] = useState<Record<string, string>>({})
  const [isWhiteTickets, setIsWhiteTickets] = useState<Record<string, boolean>>({})`
);

// 2. Định nghĩa myStakes và myLivingStakes
content = content.replace(
  'const isLiving = !deadIds.includes(currentUser.id)\n  const myBid = session.bids.find((b: any) => b.userId === currentUser.id)',
  `const myStakes = session.huiGroup.huiMembers.filter((hm: any) => hm.userId === currentUser.id)
  const myLivingStakes = myStakes.filter((hm: any) => !deadIds.includes(hm.id))
  // Dành cho Tie-breaker
  const tieBreakerStakes = myStakes.filter((hm: any) => session.tieBreakerData?.tiedMemberIds?.includes(hm.id))`
);

// 3. Sửa handleBidSubmit
content = content.replace(
  /const handleBidSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?\}\n  \}/,
  `const handleBidSubmit = async (e: React.FormEvent, memberId: string) => {
    e.preventDefault()
    setLoading(true)
    try {
      await submitBid(session.id, memberId, Number(bidAmounts[memberId] || "0"), isWhiteTickets[memberId] || false)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }`
);

// 4. Sửa handlePickSphere
content = content.replace(
  /const handlePickSphere = async \(index: number\) => \{[\s\S]*?\}\n  \}/,
  `const handlePickSphere = async (index: number, memberId: string) => {
    setSelectedBallIndex(index)
    if (typeof window !== "undefined") {
      localStorage.setItem(\`tie-breaker-ball-\${session.id}-\${currentUser.id}\`, index.toString())
    }
    setSphereLoading(true)
    try {
      await pickSphere(session.id, memberId)
    } catch(err: any) {
      alert(err.message)
    } finally {
      setSphereLoading(false)
    }
  }`
);

// 5. Thay thế Form nhập giá (renderBiddingState)
const oldForm = `{/* Form nhập giá */}
        {isLiving && !myBid && (
          <Card className="border-indigo-100/60 shadow-lg bg-white/90 backdrop-blur-md rounded-3xl overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Coins className="w-5 h-5 text-indigo-500" /> Bỏ Thăm Kêu Hụi
              </CardTitle>
              <CardDescription className="text-xs">Nhập mức giá bạn muốn kêu cho kỳ này.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBidSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-600 text-xs font-semibold uppercase tracking-wider block">Mức kêu tối đa: {formatVND(maxBid)}</Label>
                  <Input 
                    type="number" 
                    value={bidAmount} 
                    onChange={e => {
                      setBidAmount(e.target.value)
                      setIsWhiteTicket(false)
                    }} 
                    placeholder="VD: 150000"
                    disabled={isWhiteTicket}
                    className="rounded-2xl border-slate-200 py-6 text-lg font-semibold text-slate-800"
                  />
                </div>
                <div className="flex items-center space-x-3 p-3 bg-slate-50 border rounded-2xl">
                  <input 
                    type="checkbox" 
                    id="whiteTicket" 
                    checked={isWhiteTicket} 
                    onChange={e => {
                      setIsWhiteTicket(e.target.checked)
                      if(e.target.checked) setBidAmount("")
                    }}
                    className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <Label htmlFor="whiteTicket" className="text-xs font-bold text-slate-600 cursor-pointer flex-1">
                    Tôi bỏ Phiếu Trắng (Không kêu giá)
                  </Label>
                </div>
                <Button type="submit" disabled={loading || (!bidAmount && !isWhiteTicket)} className="w-full py-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md font-bold text-sm transition-all active:scale-[0.98]">
                  Xác nhận Bỏ Thăm
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Trạng thái của mình */}
        {myBid && (
          <Card className="border-emerald-100 shadow-lg bg-emerald-50/40 backdrop-blur-sm rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center h-full">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4 shadow-inner">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-emerald-800">Đã gửi thăm thành công!</h3>
              <p className="text-emerald-700/80 text-sm mt-2">
                Bạn đã kêu: <span className="font-bold">{myBid.isWhiteTicket ? "Phiếu Trắng" : formatVND(myBid.amount)}</span>
              </p>
              <p className="text-xs text-emerald-600/60 mt-4 flex items-center gap-1.5 font-medium">
                <CircleDashed className="w-3.5 h-3.5 animate-spin" /> Đang chờ những người khác bỏ thăm...
              </p>
            </CardContent>
          </Card>
        )}`;

const newForm = `{/* Danh sách Form nhập giá (Hỗ trợ 1 người nhiều chân hụi) */}
        {myLivingStakes.map((stake: any) => {
          const myBid = session.bids.find((b: any) => b.huiMemberId === stake.id)
          const canEdit = myBid ? (Date.now() - new Date(myBid.createdAt).getTime() <= 2 * 60 * 60 * 1000) : false
          const hoursLeft = myBid ? Math.max(0, 2 - (Date.now() - new Date(myBid.createdAt).getTime()) / (1000 * 60 * 60)) : 0

          if (myBid && !canEdit) {
            return (
              <Card key={stake.id} className="border-emerald-100 shadow-lg bg-emerald-50/40 backdrop-blur-sm rounded-3xl">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center h-full">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4 shadow-inner">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-800">Đã gửi thăm thành công!</h3>
                  <p className="text-emerald-700/80 text-sm mt-2">
                    {stake.name ? \`[\${stake.name}] \` : ''}Bạn đã kêu: <span className="font-bold">{myBid.isWhiteTicket ? "Phiếu Trắng" : formatVND(myBid.amount)}</span>
                  </p>
                  <p className="text-xs text-emerald-600/60 mt-4 flex items-center gap-1.5 font-medium">
                    <CircleDashed className="w-3.5 h-3.5 animate-spin" /> Đang chờ...
                  </p>
                </CardContent>
              </Card>
            )
          }

          return (
            <Card key={stake.id} className="border-indigo-100/60 shadow-lg bg-white/90 backdrop-blur-md rounded-3xl overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-indigo-500" /> {myBid ? "Sửa Phiếu Kêu Hụi" : "Bỏ Thăm Kêu Hụi"} {stake.name ? \`(\${stake.name})\` : ''}
                </CardTitle>
                <CardDescription className="text-xs">
                  {myBid ? \`Bạn còn \${Math.floor(hoursLeft * 60)} phút để sửa phiếu.\` : "Nhập mức giá bạn muốn kêu cho kỳ này."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => handleBidSubmit(e, stake.id)} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-600 text-xs font-semibold uppercase tracking-wider block">Mức kêu tối đa: {formatVND(maxBid)}</Label>
                    <Input 
                      type="number" 
                      value={bidAmounts[stake.id] !== undefined ? bidAmounts[stake.id] : (myBid ? myBid.amount.toString() : "")} 
                      onChange={e => {
                        setBidAmounts(prev => ({...prev, [stake.id]: e.target.value}))
                        setIsWhiteTickets(prev => ({...prev, [stake.id]: false}))
                      }} 
                      placeholder="VD: 150000"
                      disabled={isWhiteTickets[stake.id]}
                      className="rounded-2xl border-slate-200 py-6 text-lg font-semibold text-slate-800"
                    />
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-slate-50 border rounded-2xl">
                    <input 
                      type="checkbox" 
                      id={\`whiteTicket-\${stake.id}\`} 
                      checked={isWhiteTickets[stake.id] !== undefined ? isWhiteTickets[stake.id] : (myBid ? myBid.isWhiteTicket : false)} 
                      onChange={e => {
                        setIsWhiteTickets(prev => ({...prev, [stake.id]: e.target.checked}))
                        if(e.target.checked) setBidAmounts(prev => ({...prev, [stake.id]: ""}))
                      }}
                      className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <Label htmlFor={\`whiteTicket-\${stake.id}\`} className="text-xs font-bold text-slate-600 cursor-pointer flex-1">
                      Tôi bỏ Phiếu Trắng
                    </Label>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full py-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md font-bold text-sm transition-all active:scale-[0.98]">
                    {myBid ? "Cập nhật Thăm" : "Xác nhận Bỏ Thăm"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )
        })}`;

content = content.replace(oldForm, newForm);

// 6. Thay thế Tie-breaker (renderTieBreakerState)
content = content.replace(
  /\{session\.tieBreakerData\?\.tiedUserIds\?\.includes\(currentUser\.id\) \?\s*\([\s\S]*?\) : \(/,
  `{tieBreakerStakes.length > 0 ? (
          <div className="space-y-4">
            {tieBreakerStakes.map((stake: any) => {
               const hasSelected = !!session.tieBreakerData?.selected[stake.id]
               return (
                  <Card key={stake.id} className="border-rose-100 shadow-lg bg-rose-50/50 backdrop-blur-md rounded-3xl overflow-hidden mb-4">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl font-bold text-rose-800 flex items-center justify-center gap-2">
                        <Zap className="w-6 h-6 text-rose-600 animate-pulse" /> Bốc Thăm Vòng Phụ {stake.name ? \`(\${stake.name})\` : ''}
                      </CardTitle>
                      <CardDescription className="text-center text-rose-700/80 text-sm">
                        Chân hụi này hòa giá. Chọn 1 quả cầu may mắn.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {hasSelected ? (
                        <div className="flex flex-col items-center justify-center p-6 space-y-4">
                          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                          <h4 className="font-bold text-lg text-emerald-800">Đã chọn quả số: {session.tieBreakerData.selected[stake.id]}</h4>
                          <p className="text-sm text-emerald-600 text-center animate-pulse">Đang chờ người khác chọn...</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-5 gap-3 max-w-md mx-auto relative">
                          {sphereLoading && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                              <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
                            </div>
                          )}
                          {Array.from({ length: 15 }).map((_, i) => (
                            <motion.button
                              key={i}
                              whileHover={{ scale: 1.1, rotate: [-5, 5, 0] }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handlePickSphere(i, stake.id)}
                              className={\`w-full aspect-square rounded-full flex items-center justify-center font-black text-lg shadow-[inset_0_-4px_6px_rgba(0,0,0,0.2),0_4px_6px_rgba(0,0,0,0.1)] transition-colors \${selectedBallIndex === i ? 'bg-gradient-to-br from-rose-400 to-rose-600 text-white ring-4 ring-rose-200' : 'bg-gradient-to-br from-slate-100 to-slate-300 text-slate-700 hover:from-rose-100 hover:to-rose-200'}\`}
                            >
                              ?
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
               )
            })}
          </div>
        ) : (`
);

// 7. Sửa hàm tính deadIds list trong renderBiddingState "Danh sách người đã bỏ"
content = content.replace(
  'session.huiGroup.huiMembers.filter((hm:any) => !deadIds.includes(hm.userId)).map((hm: any) => {',
  'session.huiGroup.huiMembers.filter((hm:any) => !deadIds.includes(hm.id)).map((hm: any) => {'
);

fs.writeFileSync(filePath, content);
console.log('Done rewriting bidding-arena.tsx');
