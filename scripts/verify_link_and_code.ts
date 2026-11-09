import fs from 'fs';
import path from 'path';

function assert(description: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${description}`);
  } else {
    console.error(`  ❌ [FAIL] ${description} ${detail ? `(${detail})` : ''}`);
    process.exit(1);
  }
}

async function verifyLinkAndCode() {
  console.log('⚔️ Verifying Dual Multiplayer Joining: Link and Unique Code...\n');

  // 1. Verify Problem Page Duel Modal
  console.log('📌 1. Problem Workspace Modal (/problems/[slug]):');
  const problemPagePath = path.resolve('apps/web/app/problems/[slug]/page.tsx');
  const problemPage = fs.readFileSync(problemPagePath, 'utf-8');

  assert('Problem page has activeDuelCode state', problemPage.includes('activeDuelCode'));
  assert('Problem page has copiedRoomCode state', problemPage.includes('copiedRoomCode'));
  assert('Problem page has copiedInviteLink state', problemPage.includes('copiedInviteLink'));
  assert('Option 1: Unique Room Code is rendered', problemPage.includes('Option 1: Unique Room Code'));
  assert('Copy Code button is present with handleCopyRoomCode', problemPage.includes('onClick={handleCopyRoomCode}'));
  assert('Option 2: Direct Challenge Link is rendered', problemPage.includes('Option 2: Direct Challenge Link'));
  assert('Copy Link button is present with handleCopyInviteLink', problemPage.includes('onClick={handleCopyInviteLink}'));
  assert('Explains both options clearly to challenger', problemPage.includes('Share either the') && problemPage.includes('unique code') && problemPage.includes('direct link'));

  // 2. Verify Battle Arena (/battle/[code])
  console.log('\n📌 2. Battle Arena Room (/battle/[code]):');
  const battlePagePath = path.resolve('apps/web/app/battle/[code]/page.tsx');
  const battlePage = fs.readFileSync(battlePagePath, 'utf-8');

  assert('Battle page has handleCopyCode', battlePage.includes('handleCopyCode'));
  assert('Battle page has handleCopyInviteLink', battlePage.includes('handleCopyInviteLink'));
  assert('Header navbar has dual copy buttons (Code & Link)', battlePage.includes('onClick={handleCopyCode}') && battlePage.includes('onClick={handleCopyInviteLink}'));
  assert('Waiting banner displays Room Code clearly', battlePage.includes('Room Code:') || battlePage.includes('Share Code:'));
  assert('Waiting banner has Copy Code button', battlePage.includes('Copy Code'));
  assert('Waiting banner has Copy Link button', battlePage.includes('Copy Link'));

  // 3. Verify Lobby Join by Code or Link (/lobby)
  console.log('\n📌 3. Lobby Quick Join (/lobby):');
  const lobbyPagePath = path.resolve('apps/web/app/lobby/page.tsx');
  const lobbyPage = fs.readFileSync(lobbyPagePath, 'utf-8');

  assert('Lobby accepts room codes or full links', lobbyPage.includes('Room code (e.g. DUEL-ABCD) or paste link'));
  assert('Lobby sanitizes pasted URLs cleanly', lobbyPage.includes('clean.includes(\'/battle/\')'));
  assert('Lobby routes via router.push', lobbyPage.includes('router.push(`/battle/${clean}'));

  console.log('\n========================================');
  console.log('🏁 All Link & Unique Code Tests Passed (100%)');
  console.log('========================================\n');
}

verifyLinkAndCode().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
