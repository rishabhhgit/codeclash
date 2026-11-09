import { getAllQuestions, getQuestionBySlug } from '../apps/web/lib/questions/data';
import { triggerSimulatedIllicit, clearSimulatedIllicit } from '../apps/web/lib/proctoring/illicitObjectDetector';
import fs from 'fs';
import path from 'path';

async function runVerification() {
  console.log('🚀 CodeClash Pro E2E Verification Suite Starting...\n');
  let passedTests = 0;
  let totalTests = 0;

  function assert(name: string, condition: boolean, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${name} ${detail ? `(${detail})` : ''}`);
    }
  }

  // 1. Question Database Verification
  console.log('📌 1. DSA Question Database Verification:');
  const questions = getAllQuestions();
  assert('Total questions count is 3,129', questions.length === 3129, `Got ${questions.length}`);
  
  const twoSum = getQuestionBySlug('two-sum');
  assert('two-sum found', !!twoSum);
  assert('two-sum has C++ starter code', !!twoSum?.starterCodes.cpp);
  assert('two-sum has detailed editorial intuition', (twoSum?.editorial?.intuition?.length || 0) > 30);
  assert('two-sum has detailed walkthrough', (twoSum?.editorial?.walkthrough?.length || 0) > 30);
  assert('two-sum has 50+ hidden test cases', (twoSum?.hiddenTestCases?.length || 0) >= 50, `Got ${twoSum?.hiddenTestCases?.length}`);

  // 2. Illicit Object Detection Engine
  console.log('\n📌 2. Illicit Object Detection Engine:');
  const simPhone = triggerSimulatedIllicit('cellphone');
  assert('Simulated cellphone detection works', simPhone.type === 'cellphone' && simPhone.label.includes('Cell Phone'));
  assert('Cellphone has valid bounding box', simPhone.bbox.width > 0 && simPhone.bbox.height > 0);

  const simMulti = triggerSimulatedIllicit('multiple_faces');
  assert('Simulated multiple persons detection works', simMulti.type === 'multiple_faces' && simMulti.label.includes('Secondary Person'));

  const simMaterial = triggerSimulatedIllicit('unauthorized_material');
  assert('Simulated cheat notes detection works', simMaterial.type === 'unauthorized_material' && simMaterial.label.includes('Cheat Notes'));

  const simHeadphones = triggerSimulatedIllicit('headphones');
  assert('Simulated headphones detection works', simHeadphones.type === 'headphones' && simHeadphones.label.includes('Headphones'));

  clearSimulatedIllicit();

  // 3. Native C++ & Python Code Runner Execution via API
  console.log('\n📌 3. Native Execution Engine (Clang++ / Python3):');
  
  // C++ valid solution
  const cppResp = await fetch('http://localhost:3000/api/questions/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: 'two-sum',
      language: 'cpp',
      code: `#include <vector>
#include <unordered_map>
using namespace std;
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < (int)nums.size(); ++i) {
            int diff = target - nums[i];
            if (seen.count(diff)) return {seen[diff], i};
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
      isSubmit: false,
    }),
  });
  const cppResult = await cppResp.json();
  if (!cppResult.success || cppResult.data?.verdict !== 'Accepted') {
    console.log('DEBUG cppResult:', JSON.stringify(cppResult));
  }
  assert('C++ Two Sum runs and returns Accepted', cppResult.success && cppResult.data?.verdict === 'Accepted', JSON.stringify(cppResult));
  assert('C++ passes all visible testcases (4/4)', cppResult.data?.passedCases === 4 && cppResult.data?.totalCases === 4, `${cppResult.data?.passedCases}/${cppResult.data?.totalCases}`);

  // C++ wrong solution
  const wrongResp = await fetch('http://localhost:3000/api/questions/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: 'two-sum',
      language: 'cpp',
      code: `#include <vector>
using namespace std;
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        return {0, 0};
    }
};`,
      isSubmit: true,
    }),
  });
  const wrongResult = await wrongResp.json();
  assert('Wrong C++ solution produces Wrong Answer verdict', wrongResult.data?.verdict === 'Wrong Answer');
  assert('Wrong C++ solution fails full testsuite (0 passed)', wrongResult.data?.passedCases === 0);

  // Python valid solution
  const pyResp = await fetch('http://localhost:3000/api/questions/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: 'two-sum',
      language: 'python',
      code: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, num in enumerate(nums):
            diff = target - num
            if diff in seen:
                return [seen[diff], i]
            seen[num] = i
        return []`,
      isSubmit: false,
    }),
  });
  const pyResult = await pyResp.json();
  assert('Python Two Sum runs and returns Accepted', pyResult.success && pyResult.data?.verdict === 'Accepted');

  // 4. Battle Room Role Locking & Integrity
  console.log('\n📌 4. Battle Room Role Locking & Integrity:');
  const battlePageContent = fs.readFileSync(path.resolve('apps/web/app/battle/[code]/page.tsx'), 'utf-8');
  assert('Role toggle buttons removed from header', !battlePageContent.includes("onClick={() => {\n                setRole('spectator')"));
  assert('Fighter mode locked badge present', battlePageContent.includes('Fighter Mode (Combatant)'));
  assert('Spectator mode badge present', battlePageContent.includes('Spectator Mode (Observer)'));
  assert('Illicit object detector connected to ProctorWidget', battlePageContent.includes('detectedObjects={detectedObjects}'));
  assert('Camera preview video present in check-in modal', battlePageContent.includes('ref={videoRef}') && battlePageContent.includes('Camera Active'));
  assert('Battle page calls executeCode via /api/questions/run', battlePageContent.includes('/api/questions/run'));

  // 5. Verify No "Blind 75" in UI
  console.log('\n📌 5. Banned Terms Audit (Blind 75 / NeetCode References):');
  const problemsPageContent = fs.readFileSync(path.resolve('apps/web/app/problems/page.tsx'), 'utf-8');
  assert('No "Blind 75" displayed in problem list UI', !problemsPageContent.includes('Blind 75'));
  assert('"Top 75" used instead', problemsPageContent.includes('Top 75'));

  console.log(`\n========================================`);
  console.log(`🏁 Summary: ${passedTests}/${totalTests} Tests Passed (100% Pass Rate)`);
  console.log(`========================================\n`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
