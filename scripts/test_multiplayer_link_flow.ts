import { io } from 'socket.io-client';

async function testMultiplayerFlow() {
  console.log('⚔️ Testing Multiplayer Direct Link Challenge & Synchronization Flow...');

  const wsUrl = 'http://localhost:3001';
  const duelCode = 'DUEL-MULTI-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const questionSlug = 'two-sum';

  const clientA = io(wsUrl, {
    transports: ['websocket'],
    auth: { candidateId: 'AliceHost' },
  });

  const clientB = io(wsUrl, {
    transports: ['websocket'],
    auth: { candidateId: 'BobFriend' },
  });

  try {
    // Wait for both to connect
    await Promise.all([
      new Promise<void>((res) => clientA.on('connect', () => res())),
      new Promise<void>((res) => clientB.on('connect', () => res())),
    ]);
    console.log('  ✅ Both Fighter A and Fighter B connected to Socket.IO server');

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Flow step timeout')), 10000);

      let step = 0;

      // 1. Fighter A joins room DUEL-XXXX
      clientA.emit('battle:join', {
        battleCode: duelCode,
        role: 'fighter',
        username: 'AliceHost',
        questionSlug,
      });

      const handleStateSync = (stateA: any) => {
        if (step === 0 && Object.keys(stateA.players).length === 1) {
          step = 1;
          console.log(`  ✅ Fighter A created & joined room ${stateA.code}, status="${stateA.status}", players=${Object.keys(stateA.players).length}`);

          // 2. Fighter B (Friend) opens the exact same link and joins the room
          console.log(`  🔗 Fighter B opening challenge link for room ${duelCode}...`);
          clientB.emit('battle:join', {
            battleCode: duelCode,
            role: 'fighter',
            username: 'BobFriend',
            questionSlug,
          });
        }

        if (step === 1 && Object.keys(stateA.players).length === 2 && stateA.status === 'ready_check') {
          step = 2;
          console.log(`  ✅ Both fighters in session! Lifecycle status transitioned to READY_CHECK!`);
          console.log(`     Players in room:`, Object.values(stateA.players).map((p: any) => p.username));
          console.log(`     Preserved question slug: "${stateA.questionSlug}"`);

          // Both fighters confirm ready
          console.log(`  ⚡ Confirming Ready Check from both fighters...`);
          clientA.emit('battle:toggle_ready', { battleCode: duelCode, isReady: true });
          clientB.emit('battle:toggle_ready', { battleCode: duelCode, isReady: true });
        }

        if (step === 2 && stateA.status === 'active') {
          step = 3;
          console.log(`  ✅ Countdown finished! Battle is now ACTIVE!`);

          // 3. Fighter A streams live code
          console.log(`  📝 Fighter A streaming code...`);
          clientA.emit('battle:code_stream', {
            battleCode: duelCode,
            code: '// C++ Two Sum Hash Map\nclass Solution { public: vector<int> twoSum() {} };',
            language: 'cpp',
          });
        }
      };

      clientA.on('battle:state_sync', handleStateSync);
      clientA.on('battle:state_update', handleStateSync);

      clientB.on('battle:opponent_typing', (typingData: any) => {
        if (step === 3 && typingData.isTyping) {
          step = 4;
          console.log(`  ✅ Fighter B received live typing telemetry indicator: isTyping=${typingData.isTyping}`);

          // 4. Fighter B streams testcase progress (e.g. 2/4 passed)
          console.log(`  🧪 Fighter B streaming testcase progress...`);
          clientB.emit('battle:testcase_progress', {
            battleCode: duelCode,
            passed: 2,
            total: 4,
          });
        }
      });

      clientA.on('battle:progress_sync', (progressData: any) => {
        if (step === 4) {
          step = 5;
          console.log(`  ✅ Fighter A received opponent testcase progress: ${progressData.passed}/${progressData.total}`);

          // 5. Fighter A submits full solution and wins
          console.log(`  🏆 Fighter A submitting winning solution...`);
          const realTwoSum = `
#include <vector>
#include <unordered_map>
using namespace std;
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> m;
        for (int i = 0; i < (int)nums.size(); ++i) {
            int comp = target - nums[i];
            if (m.count(comp)) return {m[comp], i};
            m[nums[i]] = i;
        }
        return {};
    }
};`;
          clientA.emit('battle:submit_solution', {
            battleCode: duelCode,
            code: realTwoSum,
            language: 'cpp',
          });
        }
      });

      clientB.on('battle:match_won', (winData: any) => {
        if (step === 5) {
          step = 6;
          console.log(`  ✅ Fighter B received authoritative match win: Winner = "${winData.winner}"`);
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    console.log('\n🎉 MULTIPLAYER LINK CHALLENGE & LIVE SYNC TEST COMPLETED WITH 100% SUCCESS!\n');
  } finally {
    clientA.disconnect();
    clientB.disconnect();
  }
}

testMultiplayerFlow().catch((err) => {
  console.error('❌ Multiplayer flow test failed:', err);
  process.exit(1);
});
