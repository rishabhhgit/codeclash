import { io, Socket } from 'socket.io-client';
import { pickQuestionForBattle, getQuestionsByTopics, getQuestionBySlug } from '../apps/web/lib/questions/data';

const API_URL = 'http://localhost:3001';

async function runTopicTests() {
  console.log('🧪 VERIFYING TOPIC-WISE QUESTION MATCHING AND BATTLE ENFORCEMENT...\n');

  // Test 1: Unit level topic matching
  const testTopics = ['trees', 'dynamic_programming', 'graphs', 'linked_lists', 'binary_search'];
  for (const t of testTopics) {
    const questions = getQuestionsByTopics([t]);
    if (questions.length === 0) {
      throw new Error(`Expected questions for topic ${t}, got 0`);
    }
    const picked = pickQuestionForBattle({ topics: [t] });
    console.log(`✅ [PASS] Topic '${t}' has ${questions.length} questions. Sample picked: "${picked.title}" (Category: ${picked.category})`);
  }

  // Test 2: Verify Trees question is assigned when creating a battle
  console.log('\n📌 Testing REST & Socket creation with topic: trees');
  const treeQuestion = pickQuestionForBattle({ topics: ['trees'], difficulty: 'easy' });
  console.log(`Picked Trees problem for test: ${treeQuestion.title} (${treeQuestion.slug})`);

  const createRes = await fetch(`${API_URL}/api/battles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'deathmatch',
      maxPlayers: 2,
      difficulty: 'easy',
      topics: ['trees'],
      slug: treeQuestion.slug,
      questionSlug: treeQuestion.slug,
      timeControl: 10,
      isPublic: true,
    }),
  });

  const createData = await createRes.json();
  if (!createRes.ok || !createData.success) {
    throw new Error(`Failed to create battle: ${JSON.stringify(createData)}`);
  }

  const roomCode = createData.data.code;
  const returnedSlug = createData.data.questionSlug || createData.data.problem?.slug;
  console.log(`✅ [PASS] Battle created via REST. Code: ${roomCode}, Question Slug: ${returnedSlug}`);

  if (returnedSlug !== treeQuestion.slug) {
    throw new Error(`Expected question slug '${treeQuestion.slug}', got '${returnedSlug}'`);
  }

  // Test 3: Verify GET /api/battles/:code returns the topic problem
  const getRes = await fetch(`${API_URL}/api/battles/${roomCode}`);
  const getData = await getRes.json();
  if (!getRes.ok || !getData.success) {
    throw new Error(`Failed to fetch battle: ${JSON.stringify(getData)}`);
  }

  const fetchedSlug = getData.data.questionSlug || getData.data.problem?.slug;
  console.log(`✅ [PASS] GET /api/battles/${roomCode} returned Question: "${getData.data.problem?.title}" (Slug: ${fetchedSlug})`);
  if (fetchedSlug !== treeQuestion.slug) {
    throw new Error(`Expected GET slug '${treeQuestion.slug}', got '${fetchedSlug}'`);
  }

  // Test 4: Verify Socket join syncs the topic question
  const socket: Socket = io(API_URL, {
    transports: ['websocket'],
    auth: { candidateId: 'TreeMaster' },
  });

  await new Promise((resolve) => socket.on('connect', resolve));
  console.log('✅ [PASS] Socket connected to API');

  const statePromise = new Promise<any>((resolve) => {
    socket.on('battle:state_sync', (state) => {
      resolve(state);
    });
  });

  socket.emit('battle:join', {
    battleCode: roomCode,
    role: 'fighter',
    username: 'TreeMaster',
    questionSlug: treeQuestion.slug,
  });

  const syncedState = await statePromise;
  console.log(`✅ [PASS] Socket battle:state_sync received. QuestionSlug: ${syncedState.questionSlug}`);
  if (syncedState.questionSlug !== treeQuestion.slug) {
    throw new Error(`Expected socket state questionSlug '${treeQuestion.slug}', got '${syncedState.questionSlug}'`);
  }

  socket.disconnect();
  console.log('\n🎉 ALL TOPIC BATTLE ENFORCEMENT TESTS PASSED!');
}

runTopicTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
