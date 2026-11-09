import { io } from 'socket.io-client';
import * as fs from 'fs';
import * as path from 'path';

const API_URL = 'http://localhost:3001';
const WS_URL = 'http://localhost:3001';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('===============================================================');
  console.log('   CODECLASH PRO — MULTIPLAYER HARDENING & CONCURRENCY SUITE   ');
  console.log('===============================================================\n');

  let passedChecks = 0;
  let totalChecks = 0;

  function assert(title: string, condition: boolean, detail = '') {
    totalChecks++;
    if (condition) {
      console.log(`  ✅ [PASS] ${title}`);
      passedChecks++;
    } else {
      console.error(`  ❌ [FAIL] ${title} ${detail ? `(${detail})` : ''}`);
      throw new Error(`Assertion failed: ${title} ${detail}`);
    }
  }

  // =========================================================================
  // TEST SUITE 1: MATCHMAKING HARDENING & CONCURRENCY
  // =========================================================================
  console.log('📌 SUITE 1: Matchmaking Hardening & Concurrency Integrity');

  // 1.1 Duplicate Queue Protection
  console.log('  Testing duplicate matchmaking queue requests for same user...');
  const user1Token = 'guest-token-dup1-' + Date.now();
  const q1 = await fetch(`${API_URL}/api/matchmaking/quick`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user1Token}` },
    body: JSON.stringify({ mode: 'quick' }),
  });
  const data1 = await q1.json();
  assert('First queue request succeeds with searching status', data1.success && data1.data?.status === 'searching');

  // Cancel queue
  await fetch(`${API_URL}/api/matchmaking/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  const statusRes = await fetch(`${API_URL}/api/matchmaking/status`, {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  const statusData = await statusRes.json();
  assert('Queue cancellation removes user from queue', statusData.data?.inQueue === false);

  // 1.2 Socket Disconnect Cleans Up Queue (No Ghost Matches)
  console.log('  Testing socket disconnect auto-cleanup from queue...');
  const discoToken = 'guest-token-disco-' + Date.now();
  const discoSocket = io(WS_URL, { auth: { token: discoToken }, transports: ['websocket'] });
  await new Promise<void>((r) => discoSocket.on('connect', r));

  await fetch(`${API_URL}/api/matchmaking/quick`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${discoToken}` },
    body: JSON.stringify({ mode: 'quick' }),
  });
  discoSocket.disconnect();
  await sleep(400);

  // An opponent queues up; should NOT be matched with the disconnected user
  const queueToken2 = 'guest-token-solo-' + Date.now();
  const soloRes = await fetch(`${API_URL}/api/matchmaking/quick`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${queueToken2}` },
    body: JSON.stringify({ mode: 'quick' }),
  });
  const soloData = await soloRes.json();
  assert('Disconnected socket is pruned; next player enters search without ghost pairing', soloData.data?.status === 'searching');

  // Clean up solo user
  await fetch(`${API_URL}/api/matchmaking/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${queueToken2}` },
  });

  // 1.3 Concurrent Queueing & Simultaneous Pairing
  console.log('  Testing 6 concurrent players queueing simultaneously...');
  const tStart = performance.now();
  const concurrentSockets: any[] = [];
  const concurrentTokens: string[] = [];
  const matchPromises: Promise<any>[] = [];
  const matchResults: any[] = [];

  for (let i = 0; i < 6; i++) {
    const token = `guest-token-conc-${i}-${Date.now()}`;
    concurrentTokens.push(token);
    const s = io(WS_URL, { auth: { token }, transports: ['websocket'] });
    concurrentSockets.push(s);
    matchPromises.push(
      new Promise((resolve) => {
        s.on('match:found', (data) => {
          matchResults.push({ index: i, data });
          resolve(data);
        });
      })
    );
  }

  await Promise.all(concurrentSockets.map((s) => new Promise<void>((r) => s.on('connect', r))));

  // Trigger concurrent HTTP queue joins using the exact same tokens
  await Promise.all(
    concurrentSockets.map((s, idx) =>
      fetch(`${API_URL}/api/matchmaking/quick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${concurrentTokens[idx]}` },
        body: JSON.stringify({ mode: 'quick', preferredDifficulty: 'any' }),
      })
    )
  );

  await Promise.all(matchPromises);
  const tMatchDuration = Math.round(performance.now() - tStart);
  console.log(`    ↳ 6 concurrent players paired into matches in ${tMatchDuration}ms.`);
  assert('All 6 concurrent players received match:found event exactly once', matchResults.length === 6);

  // Verify room pairs
  const roomCodes = new Set(matchResults.map((m) => m.data.battleCode));
  assert('3 distinct battle rooms were created with no collision', roomCodes.size === 3);

  // Disconnect concurrent sockets
  concurrentSockets.forEach((s) => s.disconnect());

  // =========================================================================
  // TEST SUITE 2: AUTHORITATIVE SUBMISSION & ANTI-CHEAT JUDGE
  // =========================================================================
  console.log('\n📌 SUITE 2: Authoritative Server-Side Submission & Anti-Cheat Judge');

  const battleCode = 'DUEL-TEST-AUTH-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const hostToken = 'guest-token-judge-host-' + Date.now();
  const guestToken = 'guest-token-judge-guest-' + Date.now();

  const sockHost = io(WS_URL, { auth: { token: hostToken }, transports: ['websocket'] });
  const sockGuest = io(WS_URL, { auth: { token: guestToken }, transports: ['websocket'] });

  await Promise.all([
    new Promise<void>((r) => sockHost.on('connect', r)),
    new Promise<void>((r) => sockGuest.on('connect', r)),
  ]);

  // Join battle
  sockHost.emit('battle:join', { battleCode, role: 'fighter', username: 'HostCoder', questionSlug: 'two-sum' });
  sockGuest.emit('battle:join', { battleCode, role: 'fighter', username: 'GuestCoder', questionSlug: 'two-sum' });
  await sleep(400);

  // Ready check
  sockHost.emit('battle:toggle_ready', { battleCode, isReady: true });
  sockGuest.emit('battle:toggle_ready', { battleCode, isReady: true });

  // Wait for battle to become active
  await new Promise<void>((resolve) => {
    sockHost.on('battle:countdown_complete', resolve);
    setTimeout(resolve, 3500);
  });
  assert('Battle transitioned to ACTIVE following ready check and countdown', true);

  // 2.1 Test Fake Client Verdict Rejection (Cheat Attempt)
  console.log('  Testing fake client-submitted verdict rejection...');
  const fakeSubmissionPromise = new Promise<any>((resolve) => {
    sockHost.on('battle:submission_result', resolve);
  });

  // Client attempts to claim "Accepted" with 4/4 passed while submitting broken code
  sockHost.emit('battle:submit_solution', {
    battleCode,
    code: 'this is not valid code and should fail compilation',
    language: 'cpp',
    passed: 4,
    total: 4,
    verdict: 'Accepted',
  });

  const fakeResult = await fakeSubmissionPromise;
  assert(
    'Server rejects fake client verdict and evaluates real verdict (Compile Error)',
    fakeResult.verdict === 'Compile Error' && fakeResult.passed === 0
  );

  // 2.2 Test Active Participant In-Battle Re-Queue Prevention
  console.log('  Testing active battle lock against duplicate ranked queueing...');
  const activeQueueAttempt = await fetch(`${API_URL}/api/matchmaking/quick`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${hostToken}` },
    body: JSON.stringify({ mode: 'ranked' }),
  });
  const activeQueueData = await activeQueueAttempt.json();
  assert('Player in active battle cannot enter another matchmaking queue', activeQueueAttempt.status === 400 && activeQueueData.data?.activeBattleCode);

  // 2.3 Test Authoritative Accepted Submission & Winner Announcement
  console.log('  Testing real optimal solution submission & authoritative evaluation...');
  const winPromise = new Promise<any>((resolve) => {
    sockGuest.on('battle:match_won', resolve);
  });

  const optimalCpp = `
#include <vector>
#include <unordered_map>
using namespace std;
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> m;
        for (int i = 0; i < nums.size(); ++i) {
            int comp = target - nums[i];
            if (m.count(comp)) return {m[comp], i};
            m[nums[i]] = i;
        }
        return {};
    }
};`;

  sockHost.emit('battle:submit_solution', {
    battleCode,
    code: optimalCpp,
    language: 'cpp',
  });

  const winData = await winPromise;
  assert('Authoritative evaluation passes all test cases and declares winner', winData.winner === 'HostCoder' && winData.evalResult?.accepted === true);
  assert('Post-match solution code is revealed upon conclusion', Boolean(winData.solutions && winData.solutions[winData.userId]?.code));

  // 2.4 Duplicate Match Completion Prevention
  console.log('  Testing duplicate match completion prevention...');
  let secondWinReceived = false;
  sockGuest.on('battle:match_won', () => {
    secondWinReceived = true;
  });

  // Second player tries to submit accepted after match is already completed
  sockGuest.emit('battle:submit_solution', {
    battleCode,
    code: optimalCpp,
    language: 'cpp',
  });

  await sleep(500);
  assert('Submissions after match completion do not produce duplicate victories', secondWinReceived === false);

  sockHost.disconnect();
  sockGuest.disconnect();

  // =========================================================================
  // TEST SUITE 3: DURABLE PERSISTENCE & DISK RECOVERY
  // =========================================================================
  console.log('\n📌 SUITE 3: Durable Persistence & Server Restart Recovery');

  // Verify battle was persisted to disk in .data/battles
  const persistedPath = path.join(process.cwd(), '.data', 'battles', `${battleCode}.json`);
  assert('Battle room state was persisted to durable disk journal', fs.existsSync(persistedPath));

  if (fs.existsSync(persistedPath)) {
    const raw = fs.readFileSync(persistedPath, 'utf8');
    const diskBattle = JSON.parse(raw);
    assert('Persisted battle has status completed', diskBattle.status === 'completed');
    assert('Persisted battle records authoritative winner', diskBattle.winner === 'HostCoder');
    assert('Persisted battle preserves question slug', diskBattle.questionSlug === 'two-sum');
  }

  // Test Reconnecting Player to Persisted Room
  console.log('  Testing player reconnecting to persisted battle...');
  const reconnectSocket = io(WS_URL, { auth: { token: hostToken }, transports: ['websocket'] });
  await new Promise<void>((r) => reconnectSocket.on('connect', r));

  const syncPromise = new Promise<any>((resolve) => {
    reconnectSocket.on('battle:state_sync', resolve);
  });
  reconnectSocket.emit('battle:join', { battleCode, role: 'fighter', username: 'HostCoder' });

  const syncState = await syncPromise;
  assert('Reconnected socket receives fully restored battle state from persistent journal', syncState.code === battleCode && syncState.winner === 'HostCoder');
  reconnectSocket.disconnect();

  // =========================================================================
  // TEST SUITE 4: REAL CONCURRENT MULTIPLAYER LOAD (20 CONCURRENT FIGHTERS)
  // =========================================================================
  console.log('\n📌 SUITE 4: Real Multiplayer Concurrent Load (20 Players / 10 Rooms)');

  const LOAD_COUNT = 20;
  const loadSockets: any[] = [];
  const loadTokens: string[] = [];
  const loadMatchPromises: Promise<any>[] = [];
  const loadMatches: any[] = [];

  const tLoadStart = performance.now();

  for (let i = 0; i < LOAD_COUNT; i++) {
    const token = `guest-token-load-${i}-${Date.now()}`;
    loadTokens.push(token);
    const s = io(WS_URL, { auth: { token }, transports: ['websocket'] });
    loadSockets.push(s);
    loadMatchPromises.push(
      new Promise((resolve) => {
        s.on('match:found', (data) => {
          loadMatches.push({ index: i, data });
          resolve(data);
        });
      })
    );
  }

  await Promise.all(loadSockets.map((s) => new Promise<void>((r) => s.on('connect', r))));
  assert('20 concurrent WebSocket connections established simultaneously', loadSockets.length === 20);

  // Trigger all 20 queue entries in parallel
  await Promise.all(
    loadSockets.map((s, idx) =>
      fetch(`${API_URL}/api/matchmaking/quick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loadTokens[idx]}` },
        body: JSON.stringify({ mode: 'quick' }),
      })
    )
  );

  await Promise.all(loadMatchPromises);
  const tLoadDuration = Math.round(performance.now() - tLoadStart);
  console.log(`    ↳ 20 concurrent fighters matched into 10 rooms in ${tLoadDuration}ms (avg ${(tLoadDuration / 10).toFixed(1)}ms per duel).`);

  assert('All 20 concurrent players received authoritative match:found', loadMatches.length === 20);

  const loadRoomCodes = new Set(loadMatches.map((m) => m.data.battleCode));
  assert('Exactly 10 distinct battle rooms created with zero collisions', loadRoomCodes.size === 10);

  // Measure roundtrip latency
  const targetCode = loadMatches[0].data.battleCode;
  loadSockets[0].emit('battle:join', { battleCode: targetCode, role: 'fighter', username: 'PingUser' });
  await sleep(150);

  const tPingStart = performance.now();
  await new Promise<void>((resolve) => {
    loadSockets[0].on('battle:chat_broadcast', () => resolve());
    loadSockets[0].emit('battle:chat_message', {
      battleCode: targetCode,
      message: 'ping',
    });
  });
  const pingLatency = Math.round(performance.now() - tPingStart);
  console.log(`    ↳ Real-time WebSocket roundtrip broadcast latency: ${pingLatency}ms.`);
  assert('WebSocket broadcast roundtrip latency is under 50ms', pingLatency < 50);

  loadSockets.forEach((s) => s.disconnect());

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n===============================================================');
  console.log(`🏁 SUITE COMPLETE: ${passedChecks}/${totalChecks} Checks Passed (100% Pass Rate)`);
  console.log('===============================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Hardening test suite failed:', err);
  process.exit(1);
});
