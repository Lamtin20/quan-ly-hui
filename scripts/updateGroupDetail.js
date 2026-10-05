const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/groups/[id]/group-detail.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Thay thế state selectedMemberId bằng selectedMemberIds và isTransferDialogOpen
content = content.replace(
  'const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)',
  `const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)`
);

// 2. Cập nhật handleTransfer để dùng mảng
content = content.replace(
  /const handleTransfer = async \(\) => \{[\s\S]*?setIsTransferring\(false\)\n    \}\n  \}/,
  `const handleTransfer = async () => {
    if (!transferPhone.trim() || selectedMemberIds.length === 0) {
      alert("Vui lòng nhập số điện thoại và chọn ít nhất 1 chân hụi")
      return
    }
    setIsTransferring(true)
    try {
      const { transferHuiMember } = await import("../../actions/groups")
      await transferHuiMember(selectedMemberIds, transferPhone)
      alert("Chuyển nhượng chân hụi thành công!")
      setTransferPhone("")
      setSelectedMemberIds([])
      setIsTransferDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      alert(error.message || "Có lỗi xảy ra")
    } finally {
      setIsTransferring(false)
    }
  }`
);

// 3. Xoá Dialog lồng trong danh sách thành viên (Dòng 450-480) và thay bằng Dialog gọi hàm setState
// Chú ý: Regex cẩn thận
const oldTransferBtn = `                        <Dialog open={selectedMemberId === member.id} onOpenChange={(open) => setSelectedMemberId(open ? member.id : null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 rounded border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                              Bán / Chuyển nhượng
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Chuyển nhượng Chân Hụi</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <p className="text-sm text-slate-500">
                                Bạn đang bán chân hụi của <strong>{u.fullName}</strong>. Người mua sẽ kế thừa toàn bộ lịch sử đóng hụi của chân này.
                              </p>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Số điện thoại người mua:</label>
                                <input 
                                  type="text" 
                                  value={transferPhone}
                                  onChange={e => setTransferPhone(e.target.value)}
                                  placeholder="Nhập SĐT đã đăng ký trên hệ thống"
                                  className="w-full border rounded-lg p-2 text-sm"
                                />
                              </div>
                              <Button onClick={handleTransfer} disabled={isTransferring} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                                {isTransferring ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Xác nhận Chuyển Nhượng
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>`;

const newTransferBtn = `                        <Button 
                          variant="outline" size="sm" 
                          className="h-6 text-[10px] px-2 rounded border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                          onClick={() => {
                            setSelectedMemberIds([member.id]);
                            setIsTransferDialogOpen(true);
                          }}
                        >
                          Bán / Chuyển nhượng
                        </Button>`;

content = content.replace(oldTransferBtn, newTransferBtn);

// 4. Thêm nút "Bán Hụi (Tất cả)" trên Header
// Thêm vào sau phần banner (Ví dụ: sau block {isMember && !isAdmin && initialGroup.status === "OPEN" && ...})
// Đơn giản hơn: Tìm "{/* Admin Action: Start Group (OPEN -> RUNNING) */}"
// và chèn vào trước nó.
const headerActions = `{/* Header Bán Hụi & Admin Action */}
      {(isMember || isAdmin) && initialGroup.status !== "FINISHED" && (
        <Card className="border-indigo-100 bg-white/70 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="flex flex-col md:flex-row items-center justify-between p-4">
            <div className="flex items-center text-indigo-800 mb-4 md:mb-0">
              <UserCheck className="w-6 h-6 mr-3 text-indigo-600" />
              <div>
                <h3 className="font-bold text-sm">Tuỳ chọn Chân hụi</h3>
                <p className="text-xs text-indigo-700/90 font-medium">Bạn có thể bán hoặc chuyển nhượng toàn bộ các chân hụi bạn đang có.</p>
              </div>
            </div>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium px-5"
              onClick={() => {
                // Lấy tất cả chân hụi đang sống của User
                const myLivingStakes = initialGroup.huiMembers.filter(hm => hm.userId === currentUser.id && !deadMemberIds.includes(hm.id))
                setSelectedMemberIds(myLivingStakes.map(s => s.id))
                setIsTransferDialogOpen(true)
              }}
            >
              Bán / Chuyển nhượng
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Transfer Dialog Global */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chuyển nhượng Chân Hụi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-500">
              Chọn các chân hụi bạn muốn bán. Người mua sẽ kế thừa toàn bộ lịch sử đóng/nhận hụi của những chân này.
            </p>
            
            <div className="space-y-2 border rounded-xl p-3 bg-slate-50">
              <label className="text-sm font-bold text-slate-700">Các chân hụi của bạn:</label>
              {initialGroup.huiMembers.filter(hm => hm.userId === currentUser.id && !deadMemberIds.includes(hm.id)).length === 0 ? (
                <p className="text-xs text-red-500">Bạn không có chân hụi nào còn sống.</p>
              ) : (
                initialGroup.huiMembers.filter(hm => hm.userId === currentUser.id && !deadMemberIds.includes(hm.id)).map(hm => (
                  <div key={hm.id} className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id={\`transfer-\${hm.id}\`}
                      checked={selectedMemberIds.includes(hm.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMemberIds([...selectedMemberIds, hm.id])
                        } else {
                          setSelectedMemberIds(selectedMemberIds.filter(id => id !== hm.id))
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor={\`transfer-\${hm.id}\`} className="text-sm cursor-pointer font-medium text-slate-600">
                      Chân hụi {hm.name ? \`(\${hm.name})\` : \`(Mặc định)\`}
                    </label>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2 mt-4">
              <label className="text-sm font-bold text-slate-700">Số điện thoại người mua:</label>
              <input 
                type="text" 
                value={transferPhone}
                onChange={e => setTransferPhone(e.target.value)}
                placeholder="Nhập SĐT đã đăng ký trên hệ thống"
                className="w-full border rounded-lg p-2 text-sm"
              />
            </div>
            
            <Button onClick={handleTransfer} disabled={isTransferring || selectedMemberIds.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4 rounded-xl">
              {isTransferring ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Xác nhận Chuyển Nhượng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      `;

content = content.replace('{/* Admin Action: Start Group (OPEN -> RUNNING) */}', headerActions + '\n      {/* Admin Action: Start Group (OPEN -> RUNNING) */}');

fs.writeFileSync(filePath, content);
console.log('Update group-detail.tsx done!');
