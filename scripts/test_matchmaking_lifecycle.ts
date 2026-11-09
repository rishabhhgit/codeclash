import { io } from 'socket.io-client';
import { getQuestionBySlug } from '../apps/web/lib/questions/data';

async function main() {
  console.log('=== MULTIPLAYER MATCHMAKING & BATTLE LIFECYCLE E2E TEST ===\n');

  const API_URL = 'http://localhost:3001';
  const WS_URL = 'http://localhost:3001';

  // 1. Player A and Player B credentials
  const tokenA = 'guest-token-fighter-alpha-' + Date.now();
  const tokenB = 'guest-token-fighter-bravo-' + Date.now();

  console.log('1. Connecting Player A & Player B WebSockets...');
  const socketA = io(WS_URL, {
    auth: { token: tokenA },
    transports: ['websocket'],
  });

  const socketB = io(WS_URL, {
    auth: { token: tokenB },
    transports: ['websocket'],
  });

  await new Promise<void>((resolve, reject) => {
    let connected = 0;
    const check = () => {
      connected++;
      if (connected === 2) resolve();
    };
    socketA.on('connect', check);
    socketB.on('connect', check);
    setTimeout(() => reject(new Error('WebSocket connection timeout')), 4000);
  });
  console.log('   ✓ Player A & Player B connected to WebSocket.');

  // Set up match:found listeners
  let matchFoundA: any = null;
  let matchFoundB: any = null;

  const matchPromise = new Promise<{ matchA: any; matchB: any }>((resolve, reject) => {
    socketA.on('match:found', (data) => {
      matchFoundA = data;
      if (matchFoundA && matchFoundB) resolve({ matchA: matchFoundA, matchB: matchFoundB });
    });
    socketB.on('match:found', (data) => {
      matchFoundB = data;
      if (matchFoundA && matchFoundB) resolve({ matchA: matchFoundA, matchB: matchFoundB });
    });
    setTimeout(() => reject(new Error('Matchmaking pairing timed out')), 6000);
  });

  // 2. Player A enters matchmaking
  console.log('2. Player A entering matchmaking queue...');
  const resA = await fetch(`${API_URL}/api/matchmaking/quick`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ preferredDifficulty: 'easy', mode: 'quick' }),
  });
  const dataA = await resA.json();
  if (!dataA.success || dataA.data.status !== 'searching') {
    throw new Error(`Player A matchmaking failed: ${JSON.stringify(dataA)}`);
  }
  console.log('   ✓ Player A queued into search band.');

  // 3. Player B enters matchmaking
  console.log('3. Player B entering matchmaking queue...');
  const resB = await fetch(`${API_URL}/api/matchmaking/quick`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ preferredDifficulty: 'easy', mode: 'quick' }),
  });
  const dataB = await resB.json();
  if (!dataB.success || dataB.data.status !== 'matched') {
    throw new Error(`Player B matchmaking match failed: ${JSON.stringify(dataB)}`);
  }
  console.log('   ✓ Player B instantly matched with Player A!');

  const { matchA, matchB } = await matchPromise;
  console.log(`   ✓ Match Found! Room Code: ${matchB.battleCode}, Problem: ${matchB.questionSlug}`);

  if (matchA.battleCode !== matchB.battleCode) {
    throw new Error('Battle codes do not match between players!');
  }

  const roomCode = matchA.battleCode;

  // 4. Test Battle Room Lifecycle
  console.log('\n4. Testing Battle Room Lifecycle...');
  socketA.emit('battle:join', { battleCode: roomCode, role: 'fighter', username: 'FighterAlpha' });
  socketB.emit('battle:join', { battleCode: roomCode, role: 'fighter', username: 'FighterBravo' });

  // Connect spectator
  const spectatorSocket = io(WS_URL, {
    auth: { token: 'spectator-test-token' },
    transports: ['websocket'],
  });
  await new Promise<void>((res) => spectatorSocket.on('connect', res));
  spectatorSocket.emit('battle:join', { battleCode: roomCode, role: 'spectator', username: 'SpectatorBot' });

  // Wait for ready_check status
  await new Promise<void>((resolve, reject) => {
    socketA.on('battle:state_sync', (battle) => {
      if (battle.status === 'ready_check') {
        resolve();
      }
    });
    setTimeout(() => reject(new Error('Ready check status transition timeout')), 4000);
  });
  console.log('   ✓ Room entered READY_CHECK state. Both fighters verified.');

  // 5. Test Ready Check Toggle & Countdown
  console.log('\n5. Testing Ready Check & Countdown...');
  let countdownStarted = false;
  socketA.on('battle:countdown_tick', (tick) => {
    countdownStarted = true;
  });

  socketA.emit('battle:toggle_ready', { battleCode: roomCode, isReady: true });
  socketB.emit('battle:toggle_ready', { battleCode: roomCode, isReady: true });

  await new Promise<void>((resolve, reject) => {
    socketA.on('battle:state_sync', (battle) => {
      if (battle.status === 'active') {
        resolve();
      }
    });
    setTimeout(() => reject(new Error('Countdown to ACTIVE state timeout')), 6000);
  });
  console.log('   ✓ Countdown finished, battle is now ACTIVE!');

  // 6. Test Opponent Code Privacy
  console.log('\n6. Testing Opponent Code Privacy & Telemetry...');
  let opponentReceivedCode = false;
  let opponentReceivedTyping = false;
  let spectatorReceivedCode = false;

  socketB.on('battle:player_code_stream', (data) => {
    if (data.userId.includes('alpha') || data.username === 'FighterAlpha') {
      opponentReceivedCode = true;
    }
  });

  socketB.on('battle:opponent_typing', (data) => {
    if (data.username === 'FighterAlpha' && data.isTyping) {
      opponentReceivedTyping = true;
    }
  });

  spectatorSocket.on('battle:player_code_stream', (data) => {
    if (data.username === 'FighterAlpha') {
      spectatorReceivedCode = true;
    }
  });

  const secretCode = 'int mySecretTwoSum() { return 42; }';
  socketA.emit('battle:code_stream', {
    battleCode: roomCode,
    code: secretCode,
    language: 'cpp',
  });

  await new Promise((r) => setTimeout(r, 800));

  if (opponentReceivedCode) {
    throw new Error('FAILED: Opponent received raw private code during active combat!');
  }
  if (!opponentReceivedTyping) {
    throw new Error('FAILED: Opponent did not receive typing telemetry indicator!');
  }
  if (!spectatorReceivedCode) {
    throw new Error('FAILED: Spectator did not receive live code stream!');
  }
  console.log('   ✓ Code privacy strictly preserved! Opponent saw typing telemetry, spectator watched live stream.');

  // 7. Test Authoritative Submission & Post-Match Code Reveal
  console.log('\n7. Testing Authoritative Submission & Victory...');
  let matchWonEvent: any = null;
  let revealedCodesEvent: any = null;

  socketB.on('battle:match_won', (data) => {
    console.log('   -> socketB received battle:match_won:', data?.winner);
    matchWonEvent = data;
  });

  socketB.on('battle:reveal_codes', (solutions) => {
    console.log('   -> socketB received battle:reveal_codes');
    revealedCodesEvent = solutions;
  });

  socketA.on('battle:submission_result', (data) => {
    console.log('   -> socketA received battle:submission_result:', data?.verdict, data?.passed, '/', data?.total, data?.error);
  });

  const matchedQ = getQuestionBySlug(matchB.questionSlug);
  const solutionCode = matchedQ?.editorial?.cppSolution || matchedQ?.editorial?.pythonSolution;
  const solutionLang = matchedQ?.editorial?.cppSolution ? 'cpp' : 'python';

  socketA.emit('battle:submit_solution', {
    battleCode: roomCode,
    code: solutionCode,
    language: solutionLang,
  });

  await new Promise<void>((resolve, reject) => {
    const interval = setInterval(() => {
      if (matchWonEvent && revealedCodesEvent) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
    setTimeout(() => {
      clearInterval(interval);
      reject(new Error('Victory / Reveal codes event timed out'));
    }, 4000);
  });

  console.log(`   ✓ Match Won Event Received! Victor: ${matchWonEvent.winner}`);
  console.log('   ✓ Post-match solutions unlocked for review.');

  socketA.disconnect();
  socketB.disconnect();
  spectatorSocket.disconnect();

  console.log('\n=== ALL MULTIPLAYER & LIFECYCLE TESTS PASSED PERFECTLY (100%) ===\n');
}

main().catch((err) => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
