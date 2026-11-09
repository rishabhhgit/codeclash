import { io, Socket } from 'socket.io-client';

const API_URL = 'http://localhost:3001';
const WEB_URL = 'http://localhost:3000';

async function run() {
  console.log('⚔️ TESTING MULTIPLAYER BATTLE JOIN & COMPETITION FLOW...');

  // 1. Check /battle/join HTTP page
  const pageRes = await fetch(`${WEB_URL}/battle/join`);
  if (pageRes.status === 200) {
    console.log('✅ [PASS] /battle/join route is accessible and returns HTTP 200');
  } else {
    throw new Error(`/battle/join returned ${pageRes.status}`);
  }

  // 2. Simulate User A creating a battle
  const battleCode = 'ARENA-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  console.log(`\n📌 Testing 2 independent players joining battle room: ${battleCode}`);

  const userA_id = 'guest-userA-' + Date.now();
  const userB_id = 'guest-userB-' + Date.now();

  const socketA: Socket = io(API_URL, {
    transports: ['websocket'],
    auth: { token: userA_id, candidateId: 'AlphaCoder' },
  });

  const socketB: Socket = io(API_URL, {
    transports: ['websocket'],
    auth: { token: userB_id, candidateId: 'BetaHacker' },
  });

  await Promise.all([
    new Promise((resolve) => socketA.on('connect', resolve)),
    new Promise((resolve) => socketB.on('connect', resolve)),
  ]);
  console.log('✅ [PASS] Both sockets connected with unique guest credentials');

  // Player 1 joins battle
  const joinPromiseA = new Promise<any>((resolve) => {
    socketA.on('battle:state_sync', (state) => {
      resolve(state);
    });
  });

  socketA.emit('battle:join', {
    battleCode,
    role: 'fighter',
    username: 'AlphaCoder',
    questionSlug: 'two-sum',
  });

  const state1 = await joinPromiseA;
  const p1Keys = Object.keys(state1.players);
  if (p1Keys.length === 1) {
    console.log(`✅ [PASS] Player 1 joined battle. Waiting status confirmed: ${state1.status}`);
  } else {
    throw new Error(`Expected 1 player, found: ${p1Keys.length}`);
  }

  // Player 2 joins battle via code
  const joinPromiseB = new Promise<any>((resolve) => {
    socketB.on('battle:state_sync', (state) => {
      if (Object.keys(state.players).length >= 2) {
        resolve(state);
      }
    });
  });

  socketB.emit('battle:join', {
    battleCode,
    role: 'fighter',
    username: 'BetaHacker',
    questionSlug: 'two-sum',
  });

  const state2 = await joinPromiseB;
  const p2Keys = Object.keys(state2.players);
  if (p2Keys.length === 2) {
    console.log(`✅ [PASS] Player 2 successfully joined the battle! Total fighters: ${p2Keys.length}`);
  } else {
    throw new Error(`Expected 2 fighters, found: ${p2Keys.length}`);
  }

  if (state2.status === 'ready_check') {
    console.log('✅ [PASS] Ready Check automatically initiated upon 2nd player joining');
  } else {
    console.log(`ℹ️ Current status: ${state2.status}`);
  }

  // Both players confirm ready
  const activePromise = new Promise<any>((resolve) => {
    socketA.on('battle:countdown_complete', () => {
      resolve(true);
    });
  });

  socketA.emit('battle:toggle_ready', { battleCode, isReady: true });
  socketB.emit('battle:toggle_ready', { battleCode, isReady: true });
  console.log('✅ [PASS] Both players toggled ready. Awaiting synchronized countdown...');

  await activePromise;
  console.log('✅ [PASS] 3-2-1 Synchronized countdown finished. Match is ACTIVE!');

  // Player 1 submits code and wins
  const winPromise = new Promise<any>((resolve) => {
    socketB.on('battle:match_won', (data) => {
      resolve(data);
    });
  });

  const acceptedCpp = `#include <vector>
#include <unordered_map>
using namespace std;
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); ++i) {
            int diff = target - nums[i];
            if (seen.count(diff)) return {seen[diff], i};
            seen[nums[i]] = i;
        }
        return {};
    }
};`;

  socketA.emit('battle:submit_solution', {
    battleCode,
    code: acceptedCpp,
    language: 'cpp',
  });

  const winData = await winPromise;
  if (winData.winner === 'AlphaCoder') {
    console.log(`✅ [PASS] Authoritative server declared ${winData.winner} as winner!`);
  } else {
    throw new Error(`Unexpected winner: ${winData.winner}`);
  }

  socketA.disconnect();
  socketB.disconnect();

  console.log('\n🏁 ALL MULTIPLAYER JOIN & COMPETE VERIFICATIONS PASSED!\n');
}

run().catch((e) => {
  console.error('❌ Test failed:', e);
  process.exit(1);
});
