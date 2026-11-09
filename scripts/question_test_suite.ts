import { getQuestionBySlug, getAllQuestions } from './lib/questions/data';
import { runCode } from './lib/execution/runner';

async function main() {
  console.log('=== STARTING DETAILED TEST SUITE ===\n');

  // 1. Verify Problem Enrichment & Testcase counts
  console.log('[1/5] Checking Question Data & Testcases...');
  const twoSum = getQuestionBySlug('two-sum');
  if (!twoSum) throw new Error('Two Sum not found');

  const visibleCases = twoSum.testCases;
  const hiddenCases = twoSum.hiddenTestCases || [];
  const fullSuite = [...visibleCases, ...hiddenCases];

  console.log(`- Two Sum visible testcases: ${visibleCases.length}`);
  console.log(`- Two Sum hidden testcases: ${hiddenCases.length}`);
  console.log(`- Two Sum total testcases in full suite: ${fullSuite.length}`);
  console.log(`- Two Sum editorial present: ${Boolean(twoSum.editorial)}`);
  console.log(`- Two Sum default language in starterCodes: cpp=${Boolean(twoSum.starterCodes.cpp)}`);

  if (visibleCases.length < 3 || visibleCases.length > 5) {
    throw new Error(`Visible cases count expected 3-5, got ${visibleCases.length}`);
  }
  if (hiddenCases.length < 50 || hiddenCases.length > 100) {
    throw new Error(`Hidden cases count expected 50-100, got ${hiddenCases.length}`);
  }

  // 2. Check universal question enrichment across other questions
  console.log('\n[2/5] Checking Universal Fallback Enrichment on other questions...');
  const allQuestions = getAllQuestions();
  console.log(`- Total questions loaded: ${allQuestions.length}`);
  const sampleQ = allQuestions[12];
  const sampleVisible = sampleQ.testCases;
  const sampleHidden = sampleQ.hiddenTestCases || [];
  console.log(`- Sample "${sampleQ.title}" (${sampleQ.slug}) testcases: ${sampleVisible.length} visible, ${sampleHidden.length} hidden, editorial: ${Boolean(sampleQ.editorial)}`);
  
  if (sampleVisible.length < 3 || sampleHidden.length < 50) {
    throw new Error(`Sample question failed to have 3-4 visible and 50+ hidden cases!`);
  }

  // 3. Test Optimal C++ Solution on full suite (Should pass all ~74 cases fast)
  console.log('\n[3/5] Testing Optimal C++ Solution on Two-Sum (Full Suite)...');
  const optimalCppCode = `
#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (seen.count(complement)) {
                return {seen[complement], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};
`;

  const optimalResult = await runCode(optimalCppCode, 'cpp', twoSum, fullSuite);

  console.log(`- Verdict: ${optimalResult.verdict}`);
  console.log(`- Passed: ${optimalResult.passedCases} / ${optimalResult.totalCases}`);
  console.log(`- Runtime: ${optimalResult.totalRuntimeMs}ms, Memory: ${optimalResult.memoryMb}MB`);

  if (optimalResult.verdict !== 'Accepted' || optimalResult.passedCases !== fullSuite.length) {
    throw new Error(`Optimal C++ failed: ${optimalResult.verdict}, passed ${optimalResult.passedCases}/${fullSuite.length}`);
  }

  // 4. Test Quadratic O(N^2) C++ Solution (Should trigger TLE on stress cases)
  console.log('\n[4/5] Testing O(N^2) Brute Force C++ Solution (Time Limit Exceeded check)...');
  const quadraticCppCode = `
#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        for (int i = 0; i < nums.size(); i++) {
            for (int j = i + 1; j < nums.size(); j++) {
                if (nums[i] + nums[j] == target) {
                    return {i, j};
                }
            }
        }
        return {};
    }
};
`;

  const quadraticResult = await runCode(quadraticCppCode, 'cpp', twoSum, fullSuite);

  console.log(`- Verdict: ${quadraticResult.verdict}`);
  console.log(`- Error: ${quadraticResult.globalError || 'None'}`);
  console.log(`- Runtime: ${quadraticResult.totalRuntimeMs}ms`);

  if (quadraticResult.verdict !== 'Time Limit Exceeded') {
    throw new Error(`Expected Time Limit Exceeded, but got: ${quadraticResult.verdict}`);
  }

  // 5. Test Optimal Python Solution
  console.log('\n[5/5] Testing Optimal Python Solution...');
  const optimalPyCode = `
class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []
`;

  const pyResult = await runCode(optimalPyCode, 'python', twoSum, fullSuite);

  console.log(`- Verdict: ${pyResult.verdict}`);
  console.log(`- Passed: ${pyResult.passedCases} / ${pyResult.totalCases}`);

  if (pyResult.verdict !== 'Accepted') {
    throw new Error(`Python solution failed: ${pyResult.verdict}`);
  }

  // 6. Test Optimal Java Solution
  console.log('\n[6/6] Testing Optimal Java Solution...');
  const optimalJavaCode = `
import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }
}
`;

  const javaResult = await runCode(optimalJavaCode, 'java', twoSum, fullSuite);

  console.log(`- Verdict: ${javaResult.verdict}`);
  console.log(`- Passed: ${javaResult.passedCases} / ${javaResult.totalCases}`);

  if (javaResult.verdict !== 'Accepted') {
    throw new Error(`Java solution failed: ${javaResult.verdict}`);
  }

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The platform is 100% verified.');
}

main().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
