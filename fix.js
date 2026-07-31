const fs = require('fs');
const path = require('path');

const replaceInFile = (file, replacements) => {
  const p = path.join('d:/CHƠI HỤI', file);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');
  replacements.forEach(([from, to]) => {
    content = content.replaceAll(from, to);
  });
  fs.writeFileSync(p, content, 'utf8');
};

replaceInFile('src/app/actions/groups.ts', [
  ['memberId', 'userId'],
  ['memberIds', 'userIds']
]);

replaceInFile('src/app/actions/members.ts', [
  ['prisma.member', 'prisma.user'],
  ['fullName: data.fullName,', 'fullName: data.fullName,\n      password: "123456",\n      role: "MEMBER",']
]);

replaceInFile('src/app/actions/sessions.ts', [
  ['winnerMemberId', 'winnerUserId'],
  ['memberId', 'userId'],
  ['include: { member: true }', 'include: { user: true }'],
  ['deadMemberIds', 'deadUserIds']
]);

replaceInFile('src/app/groups/[id]/group-detail.tsx', [
  ['import { Member, HuiGroup', 'import { User, HuiGroup'],
  ['member: Member', 'user: User'],
  ['winnerMemberId', 'winnerUserId'],
  ['memberId', 'userId'],
  ['hm.member.', 'hm.user.']
]);

replaceInFile('src/app/groups/[id]/page.tsx', [
  ['import { Member }', 'import { User }'],
  ['include: { member: true }', 'include: { user: true }'],
  ['member: Member', 'user: User']
]);

replaceInFile('src/app/groups/group-list.tsx', [
  ['import { Member, HuiGroup', 'import { User, HuiGroup'],
  ['members: Member[]', 'members: User[]'],
  ['selectedMemberIds', 'selectedUserIds'],
  ['member.id', 'user.id'],
  ['member.fullName', 'user.fullName'],
  ['members.map(member =>', 'members.map(user =>'],
  ['members.length', 'members.length']
]);

replaceInFile('src/app/groups/page.tsx', [
  ['prisma.member.', 'prisma.user.']
]);

replaceInFile('src/app/members/member-list.tsx', [
  ['import { Member }', 'import { User }'],
  ['initialMembers: Member[]', 'initialMembers: User[]'],
  ['member.id', 'user.id'],
  ['member.fullName', 'user.fullName'],
  ['member.phone', 'user.phone'],
  ['member.bank', 'user.bank'],
  ['initialMembers.map(member =>', 'initialMembers.map(user =>']
]);

replaceInFile('src/app/members/page.tsx', [
  ['prisma.member.', 'prisma.user.']
]);

replaceInFile('src/app/page.tsx', [
  ['prisma.member.', 'prisma.user.']
]);

replaceInFile('src/app/register/page.tsx', [
  ['onValueChange={setBankName}', 'onValueChange={(v) => setBankName(v || "")}']
]);
