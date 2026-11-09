import { io, Socket } from 'socket.io-client';

const API_URL = 'http://localhost:3001';

interface BattlePlayerState {
  userId: string;
  username: string;
  role: string;
  isReady: boolean;
  score: number;
  passedCases: number;
  totalCases: number;
  trustScore: number;
  hp: number;
  shield: number;
  status: 'alive' | 'downed' | 'eliminated' | 'champion';
  placement?: number;
  kills?: number;
}

interface BattleState {
  code: string;
  mode: string;
  status: string;
  maxPlayers: number;
  aliveCount?: number;
  winner?: string;
  players: Record<string, BattlePlayerState>;
  storm?: {
    phase: number;
    phaseName: string;
    safeZoneRequirement: string;
    damagePerCycle: number;
  };
  airdrop?: {
    id: string;
    active: boolean;
    name: string;
    claimedBy?: string;
  };
  feed: Array<{ id: string; text: string }>;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('🪂 ========================================================');
  console.log('🪂  CODECLASH BATTLE ROYALE FULL INTEGRATION TEST SUITE   ');
  console.log('🪂 ========================================================\n');

  const battleCode = 'BR-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  console.log(`🎯 Initializing Battle Royale arena: ${battleCode}\n`);

  const fighters = [
    { name: 'ApexCoder', token: 'user-br-1-' + Date.now() },
    { name: 'Storm_Chaser', token: 'user-br-2-' + Date.now() },
    { name: 'Drop_Looter', token: 'user-br-3-' + Date.now() },
    { name: 'Camp_Coder', token: 'user-br-4-' + Date.now() },
  ];

  const sockets: Socket[] = [];

  // Step 1: Connect 4 independent player sockets
  console.log('1️⃣  Connecting 4 combatants to authoritative server...');
  for (const f of fighters) {
    const s = io(API_URL, {
      transports: ['websocket'],
      auth: { token: f.token, candidateId: f.name },
    });
    sockets.push(s);
  }

  await Promise.all(
    sockets.map(
      (s) =>
        new Promise((resolve) => {
          s.on('connect', resolve);
        })
    )
  );
  console.log('   ✅ All 4 combatant sockets connected successfully.\n');

  // Step 2: Join Battle Royale room
  console.log('2️⃣  Deploying combatants into Battle Royale arena...');
  const latestStates: BattleState[] = [];

  sockets.forEach((s, idx) => {
    s.on('battle:state_sync', (state: BattleState) => {
      latestStates[idx] = state;
    });
  });

  for (let i = 0; i < sockets.length; i++) {
    sockets[i].emit('battle:join', {
      battleCode,
      role: 'fighter',
      username: fighters[i].name,
      questionSlug: 'concatenation-of-array',
      mode: 'battle_royale',
    });
    await sleep(150);
  }

  // Wait for sync to stabilize with 4 players
  let state: BattleState = latestStates[0];
  for (let attempt = 0; attempt < 20; attempt++) {
    state = latestStates[0];
    if (state && Object.keys(state.players).length === 4) break;
    await sleep(200);
  }

  const playerCount = Object.keys(state.players).length;
  console.log(`   Combatants in arena: ${playerCount} / ${state.maxPlayers}`);
  if (playerCount !== 4) {
    throw new Error(`Expected 4 combatants, got ${playerCount}`);
  }
  if (state.mode !== 'battle_royale') {
    throw new Error(`Expected mode 'battle_royale', got ${state.mode}`);
  }
  console.log('   ✅ Battle Royale arena verified with mode = "battle_royale".');

  // Verify HP & Shield vitality systems
  for (const p of Object.values(state.players)) {
    if (p.hp !== 100 || p.shield !== 50 || p.status !== 'alive') {
      throw new Error(`Player ${p.username} initialized with invalid vitality: HP=${p.hp}, Shield=${p.shield}, Status=${p.status}`);
    }
  }
  console.log('   ✅ All 4 combatants spawned with 100 HP, 50 Shield, and status: "alive".');

  // Verify Storm and Airdrop initialized
  if (!state.storm || state.storm.phase !== 1) {
    throw new Error('Storm circle phase 1 not initialized');
  }
  console.log(`   ✅ Storm Zone Phase 1 active: "${state.storm.phaseName}" | Safe rule: "${state.storm.safeZoneRequirement}".`);

  if (!state.airdrop || !state.airdrop.active) {
    throw new Error('Tactical Airdrop not initialized');
  }
  console.log(`   ✅ Tactical Airdrop detected: "${state.airdrop.name}".\n`);

  // Step 3: Ready Check & Countdown
  console.log('3️⃣  Combatants locking in READY status...');
  const matchStartedPromise = new Promise<void>((resolve) => {
    sockets[0].on('battle:countdown_complete', () => {
      resolve();
    });
  });

  sockets.forEach((s) => {
    s.emit('battle:toggle_ready', { battleCode, isReady: true });
  });

  console.log('   ⏳ 3-2-1 Synchronized countdown initiated...');
  await matchStartedPromise;
  await sleep(300);

  state = latestStates[0];
  if (state.status !== 'active') {
    throw new Error(`Expected battle status 'active', got '${state.status}'`);
  }
  console.log('   ✅ Match is ACTIVE! Battle Royale safe perimeter shrinking.\n');

  // Step 4: Claim Tactical Airdrop
  console.log('4️⃣  Player 3 (Drop_Looter) sprinting to claim tactical supply drop...');
  sockets[2].emit('battle:claim_airdrop', { battleCode });
  await sleep(300);

  state = latestStates[2];
  if (!state.airdrop?.claimedBy || state.airdrop.claimedBy !== 'Drop_Looter') {
    throw new Error(`Airdrop claim failed: claimedBy is ${state.airdrop?.claimedBy}`);
  }
  const looter = Object.values(state.players).find((p) => p.username === 'Drop_Looter');
  if (!looter || looter.shield !== 100) {
    throw new Error(`Expected Drop_Looter shield 100 after airdrop perk, got ${looter?.shield}`);
  }
  console.log(`   ✅ Drop_Looter claimed tactical airdrop! Shield reinforced to ${looter.shield}/100.`);
  console.log(`   📡 Feed announcement: "${state.feed[0]?.text}"\n`);

  // Step 5: Recoil Damage & Elimination
  console.log('5️⃣  Testing recoil damage and combat elimination on Player 2 (Storm_Chaser)...');
  const wrongCode = `class Solution { public: vector<int> getConcatenation(vector<int>& nums) { return {}; } };`;

  // Submit wrong answers to deplete shield (50) and HP (100)
  // Each wrong answer does 25 recoil damage:
  // Sub 1: 50 shield -> 25 shield, 100 HP
  // Sub 2: 25 shield -> 0 shield, 100 HP
  // Sub 3: 0 shield -> 0 shield, 75 HP
  // Sub 4: 0 shield -> 0 shield, 50 HP
  // Sub 5: 0 shield -> 0 shield, 25 HP
  // Sub 6: 0 shield -> 0 shield, 0 HP -> ELIMINATED!
  for (let sub = 1; sub <= 6; sub++) {
    sockets[1].emit('battle:submit_solution', {
      battleCode,
      code: wrongCode,
      language: 'cpp',
    });
    await sleep(400);
  }

  // Wait for all evaluations to conclude and elimination to register
  for (let waitIdx = 0; waitIdx < 20; waitIdx++) {
    state = latestStates[1];
    const candidate = Object.values(state.players).find((p) => p.username === 'Storm_Chaser');
    if (candidate?.status === 'eliminated' && candidate?.hp === 0) break;
    await sleep(250);
  }

  state = latestStates[1];
  const eliminatedPlayer = Object.values(state.players).find((p) => p.username === 'Storm_Chaser');
  if (!eliminatedPlayer || eliminatedPlayer.status !== 'eliminated') {
    throw new Error(`Expected Storm_Chaser to be eliminated, got status: ${eliminatedPlayer?.status}, HP: ${eliminatedPlayer?.hp}`);
  }
  if (eliminatedPlayer.hp !== 0) {
    throw new Error(`Expected 0 HP, got ${eliminatedPlayer.hp}`);
  }
  if (eliminatedPlayer.placement !== 4) {
    throw new Error(`Expected placement #4, got #${eliminatedPlayer.placement}`);
  }
  console.log(`   ☠️ Storm_Chaser eliminated! HP: 0/100 | Placement: #${eliminatedPlayer.placement}`);
  const remainingAlive = Object.values(state.players).filter((p) => p.status === 'alive').length;
  console.log(`   🪂 Remaining survivors in arena: ${remainingAlive} / 4`);
  if (remainingAlive !== 3) {
    throw new Error(`Expected 3 survivors, found ${remainingAlive}`);
  }
  console.log('   ✅ Authoritative recoil damage and player elimination verified!\n');

  // Step 6: Post-match Code Reveal & Victory Royale
  console.log('6️⃣  Player 1 (ApexCoder) locks in optimal solution for #1 Victory Royale...');
  const optimalCpp = `
#include <vector>
using namespace std;
class Solution {
public:
    vector<int> getConcatenation(vector<int>& nums) {
        int n = nums.size();
        vector<int> ans(2 * n);
        for (int i = 0; i < n; i++) {
            ans[i] = nums[i];
            ans[i + n] = nums[i];
        }
        return ans;
    }
};
`;

  let victoryRoyaleEvent: any = null;
  sockets[0].on('battle:match_won', (payload) => {
    victoryRoyaleEvent = payload;
  });

  sockets[0].emit('battle:submit_solution', {
    battleCode,
    code: optimalCpp,
    language: 'cpp',
  });

  for (let i = 0; i < 20; i++) {
    if (victoryRoyaleEvent) break;
    await sleep(250);
  }

  if (!victoryRoyaleEvent) {
    throw new Error('Victory Royale event was not triggered');
  }

  if (!victoryRoyaleEvent.isVictoryRoyale) {
    throw new Error('Expected isVictoryRoyale to be true');
  }
  if (victoryRoyaleEvent.winner !== 'ApexCoder') {
    throw new Error(`Expected winner 'ApexCoder', got '${victoryRoyaleEvent.winner}'`);
  }

  state = latestStates[0];
  const champ = Object.values(state.players).find((p) => p.username === 'ApexCoder');
  if (champ?.status !== 'champion' || champ?.placement !== 1) {
    throw new Error(`Expected champion with placement 1, got ${champ?.status} #${champ?.placement}`);
  }
  console.log('   🏆 #1 VICTORY ROYALE CONFIRMED!');
  console.log(`   👑 Champion: ${champ.username} [Placement: #${champ.placement}]`);
  console.log(`   ⚡ Evaluation Runtime: ${victoryRoyaleEvent.evalResult?.runtimeMs || 0}ms`);
  console.log(`   📜 Verified Feed Announcement: "${state.feed[0]?.text}"\n`);

  // Step 7: Clean up sockets
  sockets.forEach((s) => s.disconnect());

  console.log('========================================================');
  console.log('🎉 ALL BATTLE ROYALE INTEGRATION TESTS PASSED (100%)!');
  console.log('========================================================\n');
}

run().catch((err) => {
  console.error('\n❌ BATTLE ROYALE TEST FAILED:', err);
  process.exit(1);
});
