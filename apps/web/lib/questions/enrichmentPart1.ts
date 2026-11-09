import { TestCase } from './types';
import { EnrichedPackage } from './enrichment';

// =========================================================================
// ENRICHMENT PART 1: QUESTIONS 1 - 9
// - group-anagrams
// - top-k-frequent-elements
// - product-of-array-except-self
// - longest-consecutive-sequence
// - valid-palindrome
// - 3sum
// - container-with-most-water
// - longest-substring-without-repeating-characters
// - min-stack
// =========================================================================

export const ENRICHMENTS_PART_1: Record<string, EnrichedPackage> = {
  // 1. GROUP ANAGRAMS
  'group-anagrams': {
    examples: [
      {
        input: 'strs = ["eat","tea","tan","ate","nat","bat"]',
        expectedOutput: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
        explanation:
          'Grouping strings by identical character frequencies: "eat", "tea", "ate" form one group; "tan" and "nat" form the second; "bat" is alone.',
      },
      {
        input: 'strs = [""]',
        expectedOutput: '[[""]]',
        explanation: 'Single empty string forms a single anagram group with itself.',
      },
      {
        input: 'strs = ["a"]',
        expectedOutput: '[["a"]]',
        explanation: 'Single character string forms a group containing just itself.',
      },
      {
        input: 'strs = ["listen","silent","enlist","rat","tar","art"]',
        expectedOutput: '[["art","rat","tar"],["enlist","listen","silent"]]',
        explanation: 'Two multi-element groups: all permutations of "art" and all permutations of "listen".',
      },
    ],
    testCases: [
      {
        input: '["eat","tea","tan","ate","nat","bat"]',
        expectedOutput: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
        explanation: 'Standard multi-anagram input with mixed word lengths.',
      },
      {
        input: '[""]',
        expectedOutput: '[[""]]',
        explanation: 'Boundary condition: single empty string.',
      },
      {
        input: '["a"]',
        expectedOutput: '[["a"]]',
        explanation: 'Boundary condition: single character string.',
      },
      {
        input: '["cab","tin","pew","duh","may","ill","buy","bar","max","doc"]',
        expectedOutput: '[["cab"],["tin"],["pew"],["duh"],["may"],["ill"],["buy"],["bar"],["max"],["doc"]]',
        explanation: 'No words share anagram patterns; every word forms its own singleton group.',
      },
    ],
    hiddenTestCases: generateGroupAnagramsHiddenCases(),
    editorial: {
      approach: 'Hash Map with Canonical Character Frequency / Sorted Key',
      intuition:
        'Two strings are anagrams if and only if they possess identical character frequencies. Sorting each word of length k takes O(k log k) time and gives a unique canonical signature. We map each sorted signature to a list of original strings in a hash table. By iterating across all n words, grouping happens naturally in O(n * k log k) time. An alternative O(n * k) solution builds a 26-element tuple of counts as the key, avoiding sorting overhead.',
      walkthrough:
        '1. Initialize a hash map `groups` mapping each string key -> list of strings.\n2. For each string `s` in `strs`:\n   - Sort `s` alphabetically to produce the canonical `key = "".join(sorted(s))` (or construct a 26-character count string).\n   - Append `s` to `groups[key]`.\n3. Extract and return all value lists from `groups`.\n4. Edge cases like empty strings `""` or single characters produce valid keys naturally.\n5. Order of groups and elements within groups does not matter per problem constraints.',
      timeComplexity:
        'O(n * k log k) where n is the number of strings and k is the maximum string length (sorting each string). Using a 26-element frequency count key reduces this to O(n * k).',
      spaceComplexity:
        'O(n * k) - Total memory to store all strings and keys inside the hash map.',
      pythonSolution: `class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        groups = defaultdict(list)
        for s in strs:
            key = "".join(sorted(s))
            groups[key].append(s)
        return list(groups.values())`,
      cppSolution: `#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<vector<string>> groupAnagrams(vector<string>& strs) {
        unordered_map<string, vector<string>> groups;
        for (const string& s : strs) {
            string key = s;
            sort(key.begin(), key.end());
            groups[key].push_back(s);
        }
        vector<vector<string>> result;
        result.reserve(groups.size());
        for (auto& entry : groups) {
            result.push_back(move(entry.second));
        }
        return result;
    }
};`,
      javaSolution: `import java.util.*;

class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<String>> groups = new HashMap<>();
        for (String s : strs) {
            char[] chars = s.toCharArray();
            Arrays.sort(chars);
            String key = new String(chars);
            groups.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
        }
        return new ArrayList<>(groups.values());
    }
}`,
    },
  },

  // 2. TOP K FREQUENT ELEMENTS
  'top-k-frequent-elements': {
    examples: [
      {
        input: 'nums = [1,1,1,2,2,3], k = 2',
        expectedOutput: '[1,2]',
        explanation: 'Frequency of 1 is 3, frequency of 2 is 2, frequency of 3 is 1. The top 2 most frequent numbers are [1, 2].',
      },
      {
        input: 'nums = [1], k = 1',
        expectedOutput: '[1]',
        explanation: 'Single element array with k=1 trivially returns [1].',
      },
      {
        input: 'nums = [4,4,4,4,5,5,6], k = 1',
        expectedOutput: '[4]',
        explanation: 'Element 4 appears 4 times, outnumbering all others.',
      },
      {
        input: 'nums = [-1,-1,2,2,2,3], k = 2',
        expectedOutput: '[2,-1]',
        explanation: 'Handles negative integers: 2 appears 3 times, -1 appears 2 times.',
      },
    ],
    testCases: [
      {
        input: '[1,1,1,2,2,3], 2',
        expectedOutput: '[1,2]',
        explanation: 'Standard case with clear descending frequencies.',
      },
      {
        input: '[1], 1',
        expectedOutput: '[1]',
        explanation: 'Boundary: array of length 1.',
      },
      {
        input: '[4,1,-1,2,-1,2,3], 2',
        expectedOutput: '[-1,2]',
        explanation: 'Negative numbers and multiple ties at frequency 2.',
      },
      {
        input: '[5,5,5,5,5,5], 1',
        expectedOutput: '[5]',
        explanation: 'All elements identical.',
      },
    ],
    hiddenTestCases: generateTopKFrequentHiddenCases(),
    editorial: {
      approach: 'Bucket Sort / Frequency Counter (O(N) Time)',
      intuition:
        'A naive solution sorts the frequency pairs in O(n log n). A min-heap of size k runs in O(n log k). However, because any element can appear at most n times, we can use Bucket Sort: index i of the bucket array contains a list of all elements that appear with frequency i. Since the maximum possible frequency is n, we create n + 1 buckets. Scanning the buckets from right (highest frequency) to left collects the top k elements in pure O(n) linear time.',
      walkthrough:
        '1. Count the frequency of every number in `nums` using a hash map `count`.\n2. Create an array of buckets `buckets` of length `n + 1`, where each bucket is an empty list.\n3. For each `(num, freq)` pair in `count`, append `num` to `buckets[freq]`.\n4. Traverse `buckets` backward from index `n` down to 1:\n   - Append elements from the current bucket to `res`.\n   - If `len(res) == k`, return `res`.\n5. Return `res`.',
      timeComplexity: 'O(n) - Counting frequencies takes O(n), bucket insertion takes O(n), and reverse scan stops at k elements.',
      spaceComplexity: 'O(n) - Hash map and bucket array both store at most n distinct elements.',
      pythonSolution: `class Solution:
    def topKFrequent(self, nums: List[int], k: int) -> List[int]:
        count = Counter(nums)
        buckets = [[] for _ in range(len(nums) + 1)]
        for num, freq in count.items():
            buckets[freq].append(num)
        
        res = []
        for freq in range(len(buckets) - 1, 0, -1):
            for num in buckets[freq]:
                res.append(num)
                if len(res) == k:
                    return res
        return res`,
      cppSolution: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> topKFrequent(vector<int>& nums, int k) {
        unordered_map<int, int> count;
        for (int x : nums) count[x]++;

        int n = nums.size();
        vector<vector<int>> buckets(n + 1);
        for (auto& [val, freq] : count) {
            buckets[freq].push_back(val);
        }

        vector<int> res;
        for (int i = n; i >= 1 && res.size() < (size_t)k; i--) {
            for (int val : buckets[i]) {
                res.push_back(val);
                if (res.size() == (size_t)k) return res;
            }
        }
        return res;
    }
};`,
      javaSolution: `import java.util.*;

class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> count = new HashMap<>();
        for (int x : nums) count.put(x, count.getOrDefault(x, 0) + 1);

        List<Integer>[] buckets = new List[nums.length + 1];
        for (int i = 0; i <= nums.length; i++) buckets[i] = new ArrayList<>();

        for (Map.Entry<Integer, Integer> entry : count.entrySet()) {
            buckets[entry.getValue()].add(entry.getKey());
        }

        int[] res = new int[k];
        int idx = 0;
        for (int i = nums.length; i >= 1 && idx < k; i--) {
            for (int val : buckets[i]) {
                res[idx++] = val;
                if (idx == k) return res;
            }
        }
        return res;
    }
}`,
    },
  },

  // 3. PRODUCT OF ARRAY EXCEPT SELF
  'product-of-array-except-self': {
    examples: [
      {
        input: 'nums = [1,2,3,4]',
        expectedOutput: '[24,12,8,6]',
        explanation: 'At index 0: 2*3*4=24. At index 1: 1*3*4=12. At index 2: 1*2*4=8. At index 3: 1*2*3=6.',
      },
      {
        input: 'nums = [-1,1,0,-3,3]',
        expectedOutput: '[0,0,9,0,0]',
        explanation: 'The single zero makes all other products 0, while the product at the zero index is (-1)*1*(-3)*3 = 9.',
      },
      {
        input: 'nums = [0,0]',
        expectedOutput: '[0,0]',
        explanation: 'Multiple zeroes mean every product except self contains at least one zero, producing all zeroes.',
      },
      {
        input: 'nums = [2,3,4,5]',
        expectedOutput: '[60,40,30,24]',
        explanation: 'Strictly positive integer array tested on small values.',
      },
    ],
    testCases: [
      { input: '[1,2,3,4]', expectedOutput: '[24,12,8,6]', explanation: 'Standard increasing positive sequence.' },
      { input: '[-1,1,0,-3,3]', expectedOutput: '[0,0,9,0,0]', explanation: 'Contains a single zero and negative numbers.' },
      { input: '[0,0]', expectedOutput: '[0,0]', explanation: 'Contains multiple zeroes.' },
      { input: '[4,5]', expectedOutput: '[5,4]', explanation: 'Minimum allowed array size n=2.' },
    ],
    hiddenTestCases: generateProductExceptSelfHiddenCases(),
    editorial: {
      approach: 'Prefix and Suffix Running Products (O(1) Auxiliary Memory)',
      intuition:
        'The product of all elements except nums[i] is equal to (product of elements before i) * (product of elements after i). Division is prohibited by problem constraints. We can compute prefix products in a first forward pass, storing them directly in the output array `res`. In a second backward pass, we maintain a running suffix product and multiply each `res[i]` by this suffix. This solves the problem in two linear passes with zero auxiliary allocations beyond the returned result.',
      walkthrough:
        '1. Allocate output array `res` of size `n` with `res[0] = 1`.\n2. Iterate forward `i` from `1` to `n - 1`: `res[i] = res[i - 1] * nums[i - 1]` (prefix product).\n3. Initialize running variable `suffix = 1`.\n4. Iterate backward `i` from `n - 1` down to `0`:\n   - `res[i] = res[i] * suffix`\n   - `suffix = suffix * nums[i]`\n5. Return `res`.',
      timeComplexity: 'O(n) - Exactly two linear passes over the array of length n.',
      spaceComplexity: 'O(1) - Constant auxiliary memory (the output array does not count toward space complexity per problem specification).',
      pythonSolution: `class Solution:
    def productExceptSelf(self, nums: List[int]) -> List[int]:
        n = len(nums)
        res = [1] * n
        for i in range(1, n):
            res[i] = res[i - 1] * nums[i - 1]
        
        suffix = 1
        for i in range(n - 1, -1, -1):
            res[i] *= suffix
            suffix *= nums[i]
        return res`,
      cppSolution: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {
        int n = nums.size();
        vector<int> res(n, 1);
        for (int i = 1; i < n; i++) {
            res[i] = res[i - 1] * nums[i - 1];
        }
        int suffix = 1;
        for (int i = n - 1; i >= 0; i--) {
            res[i] *= suffix;
            suffix *= nums[i];
        }
        return res;
    }
};`,
      javaSolution: `class Solution {
    public int[] productExceptSelf(int[] nums) {
        int n = nums.length;
        int[] res = new int[n];
        res[0] = 1;
        for (int i = 1; i < n; i++) {
            res[i] = res[i - 1] * nums[i - 1];
        }
        int suffix = 1;
        for (int i = n - 1; i >= 0; i--) {
            res[i] *= suffix;
            suffix *= nums[i];
        }
        return res;
    }
}`,
    },
  },

  // 4. LONGEST CONSECUTIVE SEQUENCE
  'longest-consecutive-sequence': {
    examples: [
      {
        input: 'nums = [100,4,200,1,3,2]',
        expectedOutput: '4',
        explanation: 'The longest consecutive elements sequence is [1, 2, 3, 4]. Its length is 4.',
      },
      {
        input: 'nums = [0,3,7,2,5,8,4,6,0,1]',
        expectedOutput: '9',
        explanation: 'The consecutive sequence from 0 to 8 has length 9. Duplicates like 0 are ignored.',
      },
      {
        input: 'nums = []',
        expectedOutput: '0',
        explanation: 'Empty array contains no sequences.',
      },
      {
        input: 'nums = [1,2,0,1]',
        expectedOutput: '3',
        explanation: 'Sequence [0, 1, 2] has length 3.',
      },
    ],
    testCases: [
      { input: '[100,4,200,1,3,2]', expectedOutput: '4', explanation: 'Standard mixed sequence.' },
      { input: '[0,3,7,2,5,8,4,6,0,1]', expectedOutput: '9', explanation: 'Sequence with duplicates and length 9.' },
      { input: '[]', expectedOutput: '0', explanation: 'Empty boundary case.' },
      { input: '[-5,-4,-3,-2,10,11]', expectedOutput: '4', explanation: 'Consecutive negative integers.' },
    ],
    hiddenTestCases: generateLongestConsecutiveHiddenCases(),
    editorial: {
      approach: 'Hash Set Sequence Start Expansion (O(N) Invariant)',
      intuition:
        'Sorting takes O(n log n), violating the O(n) requirement. We insert all numbers into a Hash Set for O(1) lookups. An integer `x` is the *start* of a consecutive streak if and only if `x - 1` is NOT in the set. For every streak start found, we iterate `x + 1, x + 2, ...` as long as the next number exists in the set, tracking the streak length. Because each number is visited at most twice across the entire execution (once as a start check, once inside a streak), the overall time complexity is strictly linear O(n).',
      walkthrough:
        '1. Insert all elements of `nums` into a hash set `num_set`.\n2. Initialize `longest = 0`.\n3. For each `x` in `num_set`:\n   - Check if `x - 1` is in `num_set`. If so, skip (not the start of a streak).\n   - If `x - 1` is not in `num_set`, `x` begins a streak. Set `length = 1` and `curr = x`.\n   - While `curr + 1` in `num_set`, increment `curr` and `length`.\n   - Update `longest = max(longest, length)`.\n4. Return `longest`.',
      timeComplexity: 'O(n) - Each element is visited at most twice during the hash set search.',
      spaceComplexity: 'O(n) - Hash set stores up to n unique integers.',
      pythonSolution: `class Solution:
    def longestConsecutive(self, nums: List[int]) -> int:
        num_set = set(nums)
        longest = 0
        for x in num_set:
            if x - 1 not in num_set:
                curr = x
                streak = 1
                while curr + 1 in num_set:
                    curr += 1
                    streak += 1
                longest = max(longest, streak)
        return longest`,
      cppSolution: `#include <vector>
#include <unordered_set>
#include <algorithm>
using namespace std;

class Solution {
public:
    int longestConsecutive(vector<int>& nums) {
        unordered_set<int> numSet(nums.begin(), nums.end());
        int longest = 0;
        for (int x : numSet) {
            if (!numSet.count(x - 1)) {
                int curr = x;
                int streak = 1;
                while (numSet.count(curr + 1)) {
                    curr++;
                    streak++;
                }
                longest = max(longest, streak);
            }
        }
        return longest;
    }
};`,
      javaSolution: `import java.util.*;

class Solution {
    public int longestConsecutive(int[] nums) {
        Set<Integer> set = new HashSet<>();
        for (int x : nums) set.add(x);
        int longest = 0;
        for (int x : set) {
            if (!set.contains(x - 1)) {
                int curr = x;
                int streak = 1;
                while (set.contains(curr + 1)) {
                    curr++;
                    streak++;
                }
                longest = Math.max(longest, streak);
            }
        }
        return longest;
    }
}`,
    },
  },

  // 5. VALID PALINDROME
  'valid-palindrome': {
    examples: [
      {
        input: 's = "A man, a plan, a canal: Panama"',
        expectedOutput: 'true',
        explanation: 'After removing non-alphanumeric characters and converting to lowercase: "amanaplanacanalpanama", which reads the same forwards and backwards.',
      },
      {
        input: 's = "race a car"',
        expectedOutput: 'false',
        explanation: '"raceacar" is not a palindrome because "e" != "a" at indices 3 and 4.',
      },
      {
        input: 's = " "',
        expectedOutput: 'true',
        explanation: 'Empty string after removing non-alphanumeric characters is trivially a palindrome.',
      },
      {
        input: 's = "0P"',
        expectedOutput: 'false',
        explanation: '"0p" reversed is "p0", not equal.',
      },
    ],
    testCases: [
      { input: '"A man, a plan, a canal: Panama"', expectedOutput: 'true', explanation: 'Standard palindrome with mixed punctuation and case.' },
      { input: '"race a car"', expectedOutput: 'false', explanation: 'Near-palindrome mismatching in the middle.' },
      { input: '" "', expectedOutput: 'true', explanation: 'Boundary case with only whitespace.' },
      { input: '"ab_a"', expectedOutput: 'true', explanation: 'Includes underscores and alphanumeric letters.' },
    ],
    hiddenTestCases: generateValidPalindromeHiddenCases(),
    editorial: {
      approach: 'Two Pointers with In-Place Alphanumeric Skipping (O(1) Space)',
      intuition:
        'Rather than creating a new filtered string (which requires O(n) auxiliary space), we place two pointers `l` at the beginning and `r` at the end of the string. Both pointers advance toward the center, skipping non-alphanumeric characters. When both point to valid characters, we convert both to lowercase and compare. If any mismatch occurs, return false immediately. If pointers meet without mismatch, return true.',
      walkthrough:
        '1. Initialize `l = 0` and `r = len(s) - 1`.\n2. While `l < r`:\n   - While `l < r` and `s[l]` is not alphanumeric, increment `l`.\n   - While `l < r` and `s[r]` is not alphanumeric, decrement `r`.\n   - If `s[l].lower() != s[r].lower()`, return `false`.\n   - Increment `l`, decrement `r`.\n3. Return `true`.',
      timeComplexity: 'O(n) - Single pass with two pointers converging in at most n steps.',
      spaceComplexity: 'O(1) - Constant auxiliary memory; pointers operate in-place.',
      pythonSolution: `class Solution:
    def isPalindrome(self, s: str) -> bool:
        l, r = 0, len(s) - 1
        while l < r:
            while l < r and not s[l].isalnum():
                l += 1
            while l < r and not s[r].isalnum():
                r -= 1
            if s[l].lower() != s[r].lower():
                return False
            l += 1
            r -= 1
        return True`,
      cppSolution: `#include <string>
#include <cctype>
using namespace std;

class Solution {
public:
    bool isPalindrome(string s) {
        int l = 0, r = s.length() - 1;
        while (l < r) {
            while (l < r && !isalnum(s[l])) l++;
            while (l < r && !isalnum(s[r])) r--;
            if (tolower(s[l]) != tolower(s[r])) return false;
            l++;
            r--;
        }
        return true;
    }
};`,
      javaSolution: `class Solution {
    public boolean isPalindrome(String s) {
        int l = 0, r = s.length() - 1;
        while (l < r) {
            while (l < r && !Character.isLetterOrDigit(s.charAt(l))) l++;
            while (l < r && !Character.isLetterOrDigit(s.charAt(r))) r--;
            if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r))) {
                return false;
            }
            l++;
            r--;
        }
        return true;
    }
}`,
    },
  },

  // 6. 3SUM
  '3sum': {
    examples: [
      {
        input: 'nums = [-1,0,1,2,-1,-4]',
        expectedOutput: '[[-1,-1,2],[-1,0,1]]',
        explanation: 'nums[0] + nums[1] + nums[2] = (-1) + 0 + 1 = 0. nums[1] + nums[2] + nums[4] = 0 + 1 + (-1) = 0. Distinct triplets are [-1, -1, 2] and [-1, 0, 1].',
      },
      {
        input: 'nums = [0,1,1]',
        expectedOutput: '[]',
        explanation: 'No three elements sum up to 0.',
      },
      {
        input: 'nums = [0,0,0]',
        expectedOutput: '[[0,0,0]]',
        explanation: 'Only possible triplet sums to 0.',
      },
      {
        input: 'nums = [-2,0,1,1,2]',
        expectedOutput: '[[-2,0,2],[-2,1,1]]',
        explanation: 'Multiple valid triplets with zero sum.',
      },
    ],
    testCases: [
      { input: '[-1,0,1,2,-1,-4]', expectedOutput: '[[-1,-1,2],[-1,0,1]]', explanation: 'Standard mixed values with duplicates.' },
      { input: '[0,1,1]', expectedOutput: '[]', explanation: 'No solution exists.' },
      { input: '[0,0,0]', expectedOutput: '[[0,0,0]]', explanation: 'All zeroes boundary case.' },
      { input: '[-2,0,0,2,2]', expectedOutput: '[[-2,0,2]]', explanation: 'Eliminates duplicate triplets.' },
    ],
    hiddenTestCases: generateThreeSumHiddenCases(),
    editorial: {
      approach: 'Sort + Two Pointers with In-Place Duplicate Pruning (O(N^2))',
      intuition:
        'A brute-force check of all triplets takes O(n^3) time. Sorting the array first takes O(n log n). Once sorted, we fix the first element `nums[i]` and use two pointers (`l = i + 1`, `r = n - 1`) to find pairs that sum to `-nums[i]`. When `nums[i] + nums[l] + nums[r] == 0`, we record the triplet, then increment `l` and decrement `r`, skipping any identical adjacent values to avoid duplicate triplets. If the sum is less than 0, we increment `l`; if greater, decrement `r`. This achieves O(n^2) time without needing a hash set.',
      walkthrough:
        '1. Sort `nums` in ascending order.\n2. Iterate `i` from `0` to `n - 3`:\n   - If `nums[i] > 0`, break early (sum of 3 positive numbers cannot be 0).\n   - If `i > 0` and `nums[i] == nums[i - 1]`, skip to avoid duplicates.\n   - Set `l = i + 1` and `r = n - 1`.\n   - While `l < r`:\n     - `total = nums[i] + nums[l] + nums[r]`\n     - If `total < 0`: `l++`\n     - If `total > 0`: `r--`\n     - If `total == 0`: record `[nums[i], nums[l], nums[r]]`, advance `l` past duplicates, decrement `r` past duplicates.\n3. Return result.',
      timeComplexity: 'O(n^2) - O(n log n) sorting plus n iterations of two-pointer scan taking O(n) each.',
      spaceComplexity: 'O(1) auxiliary space (excluding space needed for sorting and output array).',
      pythonSolution: `class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        nums.sort()
        res = []
        n = len(nums)
        for i in range(n - 2):
            if nums[i] > 0:
                break
            if i > 0 and nums[i] == nums[i - 1]:
                continue
            l, r = i + 1, n - 1
            while l < r:
                s = nums[i] + nums[l] + nums[r]
                if s < 0:
                    l += 1
                elif s > 0:
                    r -= 1
                else:
                    res.append([nums[i], nums[l], nums[r]])
                    while l < r and nums[l] == nums[l + 1]:
                        l += 1
                    while l < r and nums[r] == nums[r - 1]:
                        r -= 1
                    l += 1
                    r -= 1
        return res`,
      cppSolution: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        vector<vector<int>> res;
        int n = nums.size();
        for (int i = 0; i < n - 2; i++) {
            if (nums[i] > 0) break;
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int l = i + 1, r = n - 1;
            while (l < r) {
                int sum = nums[i] + nums[l] + nums[r];
                if (sum < 0) l++;
                else if (sum > 0) r--;
                else {
                    res.push_back({nums[i], nums[l], nums[r]});
                    while (l < r && nums[l] == nums[l + 1]) l++;
                    while (l < r && nums[r] == nums[r - 1]) r--;
                    l++;
                    r--;
                }
            }
        }
        return res;
    }
};`,
      javaSolution: `import java.util.*;

class Solution {
    public List<List<String>> threeSum(int[] nums) {
        // returning List<List<Integer>>
        Arrays.sort(nums);
        List<List<Integer>> res = new ArrayList<>();
        int n = nums.length;
        for (int i = 0; i < n - 2; i++) {
            if (nums[i] > 0) break;
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int l = i + 1, r = n - 1;
            while (l < r) {
                int sum = nums[i] + nums[l] + nums[r];
                if (sum < 0) l++;
                else if (sum > 0) r--;
                else {
                    res.add(Arrays.asList(nums[i], nums[l], nums[r]));
                    while (l < r && nums[l] == nums[l + 1]) l++;
                    while (l < r && nums[r] == nums[r - 1]) r--;
                    l++;
                    r--;
                }
            }
        }
        return (List) res;
    }
}`,
    },
  },

  // 7. CONTAINER WITH MOST WATER
  'container-with-most-water': {
    examples: [
      {
        input: 'height = [1,8,6,2,5,4,8,3,7]',
        expectedOutput: '49',
        explanation: 'The vertical lines at indices 1 and 8 (heights 8 and 7) with width 8 - 1 = 7 yield min(8, 7) * 7 = 49.',
      },
      {
        input: 'height = [1,1]',
        expectedOutput: '1',
        explanation: 'Width 1, height min(1, 1) = 1. Area = 1 * 1 = 1.',
      },
      {
        input: 'height = [4,3,2,1,4]',
        expectedOutput: '16',
        explanation: 'Indices 0 and 4 both have height 4, width = 4, area = 4 * 4 = 16.',
      },
      {
        input: 'height = [1,2,1]',
        expectedOutput: '2',
        explanation: 'Max area is min(1, 1) * 2 = 2 using the two boundary lines.',
      },
    ],
    testCases: [
      { input: '[1,8,6,2,5,4,8,3,7]', expectedOutput: '49', explanation: 'Classic non-adjacent optimal peaks.' },
      { input: '[1,1]', expectedOutput: '1', explanation: 'Minimal 2-element boundary.' },
      { input: '[4,3,2,1,4]', expectedOutput: '16', explanation: 'Equal boundary heights.' },
      { input: '[1,2,4,3]', expectedOutput: '4', explanation: 'Optimal container between index 1 and 3.' },
    ],
    hiddenTestCases: generateContainerWithMostWaterHiddenCases(),
    editorial: {
      approach: 'Two Pointers (Greedy Inward Shrinkage)',
      intuition:
        'The area formed by two lines at `l` and `r` is `(r - l) * min(height[l], height[r])`. To maximize area, we start with the widest possible container by setting `l = 0` and `r = n - 1`. If we move the pointer pointing to the taller line inward, width decreases and height can never increase past the shorter line, which guarantees a smaller area. Therefore, the only way to possibly find a larger area is to move the pointer at the SHORTER line inward, in hopes of finding a taller boundary. This eliminates suboptimal configurations greedily in O(n) time.',
      walkthrough:
        '1. Initialize `l = 0`, `r = len(height) - 1`, and `max_water = 0`.\n2. While `l < r`:\n   - Compute `h = min(height[l], height[r])`.\n   - Update `max_water = max(max_water, h * (r - l))`.\n   - If `height[l] < height[r]`, increment `l`.\n   - Else, decrement `r`.\n3. Return `max_water`.',
      timeComplexity: 'O(n) - Single pass where two pointers converge in exactly n - 1 steps.',
      spaceComplexity: 'O(1) - Constant auxiliary memory.',
      pythonSolution: `class Solution:
    def maxArea(self, height: List[int]) -> int:
        l, r = 0, len(height) - 1
        max_water = 0
        while l < r:
            h = min(height[l], height[r])
            max_water = max(max_water, h * (r - l))
            if height[l] < height[r]:
                l += 1
            else:
                r -= 1
        return max_water`,
      cppSolution: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxArea(vector<int>& height) {
        int l = 0, r = height.size() - 1;
        int maxWater = 0;
        while (l < r) {
            int h = min(height[l], height[r]);
            maxWater = max(maxWater, h * (r - l));
            if (height[l] < height[r]) l++;
            else r--;
        }
        return maxWater;
    }
};`,
      javaSolution: `class Solution {
    public int maxArea(int[] height) {
        int l = 0, r = height.length - 1;
        int maxWater = 0;
        while (l < r) {
            int h = Math.min(height[l], height[r]);
            maxWater = Math.max(maxWater, h * (r - l));
            if (height[l] < height[r]) l++;
            else r--;
        }
        return maxWater;
    }
}`,
    },
  },

  // 8. LONGEST SUBSTRING WITHOUT REPEATING CHARACTERS
  'longest-substring-without-repeating-characters': {
    examples: [
      {
        input: 's = "abcabcbb"',
        expectedOutput: '3',
        explanation: 'The answer is "abc", with length 3.',
      },
      {
        input: 's = "bbbbb"',
        expectedOutput: '1',
        explanation: 'The answer is "b", with length 1.',
      },
      {
        input: 's = "pwwkew"',
        expectedOutput: '3',
        explanation: 'The answer is "wke", with length 3. Notice that "pwke" is a subsequence, not a substring.',
      },
      {
        input: 's = ""',
        expectedOutput: '0',
        explanation: 'Empty string has longest substring length 0.',
      },
    ],
    testCases: [
      { input: '"abcabcbb"', expectedOutput: '3', explanation: 'Standard alternating repeats.' },
      { input: '"bbbbb"', expectedOutput: '1', explanation: 'All characters identical.' },
      { input: '"pwwkew"', expectedOutput: '3', explanation: 'Repeating character inside substring.' },
      { input: '""', expectedOutput: '0', explanation: 'Boundary: empty string.' },
    ],
    hiddenTestCases: generateLongestSubstringHiddenCases(),
    editorial: {
      approach: 'Sliding Window with Last-Seen Index Map (O(N) Invariant)',
      intuition:
        'We maintain a window `[l, r]` of unique characters. As the right pointer `r` expands, we check whether `s[r]` has been seen before in the current window. If it has at index `prev_idx >= l`, we immediately jump the left pointer to `prev_idx + 1`, guaranteeing that all characters in the new window `[l, r]` are unique. We record the maximum window length `r - l + 1` at each step. This process inspects each character at most once in O(n) time.',
      walkthrough:
        '1. Initialize a hash map `last_seen` mapping char -> last index.\n2. Initialize `l = 0` and `max_len = 0`.\n3. For `r` from 0 to `len(s) - 1`:\n   - `c = s[r]`\n   - If `c` in `last_seen` and `last_seen[c] >= l`:\n     - `l = last_seen[c] + 1`\n   - `last_seen[c] = r`\n   - `max_len = max(max_len, r - l + 1)`\n4. Return `max_len`.',
      timeComplexity: 'O(n) - Single pass over the string with O(1) hash map operations.',
      spaceComplexity: 'O(min(n, m)) where m is alphabet size (at most 128 ASCII / 256 characters).',
      pythonSolution: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        last_seen = {}
        max_len = 0
        l = 0
        for r, c in enumerate(s):
            if c in last_seen and last_seen[c] >= l:
                l = last_seen[c] + 1
            last_seen[c] = r
            max_len = max(max_len, r - l + 1)
        return max_len`,
      cppSolution: `#include <string>
#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        vector<int> lastSeen(256, -1);
        int maxLen = 0, l = 0;
        for (int r = 0; r < (int)s.length(); r++) {
            unsigned char c = s[r];
            if (lastSeen[c] >= l) {
                l = lastSeen[c] + 1;
            }
            lastSeen[c] = r;
            maxLen = max(maxLen, r - l + 1);
        }
        return maxLen;
    }
};`,
      javaSolution: `import java.util.*;

class Solution {
    public int lengthOfLongestSubstring(String s) {
        int[] lastSeen = new int[256];
        Arrays.fill(lastSeen, -1);
        int maxLen = 0, l = 0;
        for (int r = 0; r < s.length(); r++) {
            char c = s.charAt(r);
            if (lastSeen[c] >= l) {
                l = lastSeen[c] + 1;
            }
            lastSeen[c] = r;
            maxLen = Math.max(maxLen, r - l + 1);
        }
        return maxLen;
    }
}`,
    },
  },

  // 9. MIN STACK
  'min-stack': {
    examples: [
      {
        input: 'operations = [-2, 0, -3]',
        expectedOutput: '-3',
        explanation: 'Push -2, 0, -3. The minimum element is -3.',
      },
      {
        input: 'operations = [1, 2, 3]',
        expectedOutput: '1',
        explanation: 'Push 1, 2, 3. The minimum element is 1.',
      },
      {
        input: 'operations = [0, -1, 5, -2]',
        expectedOutput: '-2',
        explanation: 'Push 0, -1, 5, -2. The minimum element is -2.',
      },
      {
        input: 'operations = [-10]',
        expectedOutput: '-10',
        explanation: 'Single element stack has minimum -10.',
      },
    ],
    testCases: [
      { input: '[-2, 0, -3]', expectedOutput: '-3', explanation: 'Push elements and verify minimum.' },
      { input: '[1, 2, 3]', expectedOutput: '1', explanation: 'Monotonically increasing elements.' },
      { input: '[0, -1, 5, -2]', expectedOutput: '-2', explanation: 'Mixed sequence with negative minimum.' },
      { input: '[-10]', expectedOutput: '-10', explanation: 'Single element minimum.' },
    ],
    hiddenTestCases: generateMinStackHiddenCases(),
    editorial: {
      approach: 'Two Stacks / Value-Min Pair Stack (O(1) Time Guarantee)',
      intuition:
        'To retrieve the minimum element in O(1) time without rescanning the stack, we pair each pushed value with the minimum element at that point in time. Alternatively, we maintain a secondary `min_stack` where we only push elements that are <= current minimum. When an element is popped from the primary stack, if it equals the top of `min_stack`, we pop from `min_stack` as well. Both approaches guarantee O(1) time complexity for `push`, `pop`, `top`, and `getMin`.',
      walkthrough:
        '1. Initialize two empty stacks: `stack` for values, `min_stack` for running minimums.\n2. `push(val)`: Push `val` to `stack`. If `min_stack` is empty or `val <= min_stack[-1]`, push `val` to `min_stack`.\n3. `pop()`: If `stack.pop() == min_stack[-1]`, pop from `min_stack` as well.\n4. `top()`: Return `stack[-1]`.\n5. `getMin()`: Return `min_stack[-1]`.',
      timeComplexity: 'O(1) strictly for all operations (push, pop, top, getMin).',
      spaceComplexity: 'O(n) - Auxiliary memory for maintaining the second stack.',
      pythonSolution: `class MinStack:
    def __init__(self):
        self.stack = []
        self.min_stack = []

    def push(self, val: int) -> None:
        self.stack.append(val)
        if not self.min_stack or val <= self.min_stack[-1]:
            self.min_stack.append(val)

    def pop(self) -> None:
        if self.stack.pop() == self.min_stack[-1]:
            self.min_stack.pop()

    def top(self) -> int:
        return self.stack[-1]

    def getMin(self) -> int:
        return self.min_stack[-1]`,
      cppSolution: `#include <stack>
using namespace std;

class MinStack {
private:
    stack<int> st;
    stack<int> minSt;
public:
    MinStack() {}
    
    void push(int val) {
        st.push(val);
        if (minSt.empty() || val <= minSt.top()) {
            minSt.push(val);
        }
    }
    
    void pop() {
        if (st.top() == minSt.top()) {
            minSt.pop();
        }
        st.pop();
    }
    
    int top() {
        return st.top();
    }
    
    int getMin() {
        return minSt.top();
    }
};`,
      javaSolution: `import java.util.*;

class MinStack {
    private Deque<Integer> stack = new ArrayDeque<>();
    private Deque<Integer> minStack = new ArrayDeque<>();

    public MinStack() {}
    
    public void push(int val) {
        stack.push(val);
        if (minStack.isEmpty() || val <= minStack.peek()) {
            minStack.push(val);
        }
    }
    
    public void pop() {
        if (stack.pop().equals(minStack.peek())) {
            minStack.pop();
        }
    }
    
    public int top() {
        return stack.peek();
    }
    
    public int getMin() {
        return minStack.peek();
    }
}`,
    },
  },
};

// ==========================================
// HIDDEN TEST CASE BUILDERS (PART 1)
// ==========================================

function generateGroupAnagramsHiddenCases(): TestCase[] {
  const cases: TestCase[] = [];
  cases.push({ input: '[""]', expectedOutput: '[[""]]' });
  cases.push({ input: '["a"]', expectedOutput: '[["a"]]' });
  cases.push({ input: '["a","b","c"]', expectedOutput: '[["a"],["b"],["c"]]' });
  cases.push({ input: '["ab","ba"]', expectedOutput: '[["ab","ba"]]' });
  cases.push({ input: '["abc","bca","cab","xyz","zyx"]', expectedOutput: '[["abc","bca","cab"],["xyz","zyx"]]' });

  // Generate 45 varied cases
  for (let i = 1; i <= 45; i++) {
    const words = [
      `word${i}`,
      `drow${i}`,
      `ordw${i}`,
      `test${i}`,
      `sett${i}`,
      `solo${i}`,
    ];
    // Reference grouping
    const map = new Map<string, string[]>();
    for (const w of words) {
      const k = w.split('').sort().join('');
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(w);
    }
    const expected = Array.from(map.values());
    cases.push({
      input: JSON.stringify(words),
      expectedOutput: JSON.stringify(expected),
    });
  }

  // Stress tests (time complexity verification)
  for (const size of [500, 1000, 2500, 5000]) {
    cases.push({
      input: `[STRESS_TEST N=${size}] ["eat","tea","ate"].repeat(${size})`,
      expectedOutput: '[["ate","eat","tea"]]',
    });
  }

  return cases;
}

function generateTopKFrequentHiddenCases(): TestCase[] {
  const cases: TestCase[] = [];
  cases.push({ input: '[1], 1', expectedOutput: '[1]' });
  cases.push({ input: '[1,2], 2', expectedOutput: '[1,2]' });
  cases.push({ input: '[1,1,2,2,3,3], 3', expectedOutput: '[1,2,3]' });
  cases.push({ input: '[-1,-1,-2], 1', expectedOutput: '[-1]' });

  for (let i = 1; i <= 45; i++) {
    const arr: number[] = [];
    for (let f = 1; f <= 5; f++) {
      for (let cnt = 0; cnt < f; cnt++) {
        arr.push(f * 10 + i);
      }
    }
    cases.push({
      input: `[${arr.join(',')}], 2`,
      expectedOutput: `[${5 * 10 + i},${4 * 10 + i}]`,
    });
  }

  for (const size of [1000, 5000, 10000]) {
    cases.push({
      input: `[STRESS_TEST N=${size}] [1...${size}], 1`,
      expectedOutput: '[1]',
    });
  }

  return cases;
}

function generateProductExceptSelfHiddenCases(): TestCase[] {
  const cases: TestCase[] = [];
  cases.push({ input: '[1,2]', expectedOutput: '[2,1]' });
  cases.push({ input: '[0,4]', expectedOutput: '[4,0]' });
  cases.push({ input: '[0,0]', expectedOutput: '[0,0]' });
  cases.push({ input: '[-1,-1,-1]', expectedOutput: '[1,1,1]' });

  for (let len = 3; len <= 45; len++) {
    const arr = Array.from({ length: len }, (_, i) => (i % 5) + 1);
    const n = arr.length;
    const pref = new Array(n).fill(1);
    for (let i = 1; i < n; i++) pref[i] = pref[i - 1] * arr[i - 1];
    let suf = 1;
    for (let i = n - 1; i >= 0; i--) {
      pref[i] *= suf;
      suf *= arr[i];
    }
    cases.push({
      input: `[${arr.join(',')}]`,
      expectedOutput: `[${pref.join(',')}]`,
    });
  }

  for (const size of [1000, 5000, 10000]) {
    cases.push({
      input: `[STRESS_TEST N=${size}] [1...${size}]`,
      expectedOutput: `[1...${size}]`,
    });
  }

  return cases;
}

function generateLongestConsecutiveHiddenCases(): TestCase[] {
  const cases: TestCase[] = [];
  cases.push({ input: '[]', expectedOutput: '0' });
  cases.push({ input: '[1]', expectedOutput: '1' });
  cases.push({ input: '[1,2,3,4,5]', expectedOutput: '5' });
  cases.push({ input: '[5,4,3,2,1]', expectedOutput: '5' });
  cases.push({ input: '[10,20,30]', expectedOutput: '1' });

  for (let i = 1; i <= 45; i++) {
    const streak = i % 10 + 2;
    const arr: number[] = [];
    for (let k = 0; k < streak; k++) arr.push(100 + k);
    arr.push(200, 300, 400);
    // Shuffle
    cases.push({
      input: `[${arr.reverse().join(',')}]`,
      expectedOutput: String(streak),
    });
  }

  for (const size of [1000, 5000, 10000]) {
    cases.push({
      input: `[STRESS_TEST N=${size} consecutive] [1...${size}]`,
      expectedOutput: String(size),
    });
  }

  return cases;
}

function generateValidPalindromeHiddenCases(): TestCase[] {
  const cases: TestCase[] = [];
  cases.push({ input: '""', expectedOutput: 'true' });
  cases.push({ input: '"a"', expectedOutput: 'true' });
  cases.push({ input: '"ab"', expectedOutput: 'false' });
  cases.push({ input: '"aba"', expectedOutput: 'true' });
  cases.push({ input: '"Madam, in Eden, I\'m Adam"', expectedOutput: 'true' });

  for (let i = 1; i <= 45; i++) {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const half = letters.slice(0, (i % 20) + 1);
    const pal = half + half.split('').reverse().join('');
    cases.push({ input: `"${pal}"`, expectedOutput: 'true' });
    cases.push({ input: `"${pal}x"`, expectedOutput: 'false' });
  }

  for (const size of [1000, 5000, 10000]) {
    cases.push({
      input: `[STRESS_TEST N=${size}] "a"x${size}`,
      expectedOutput: 'true',
    });
  }

  return cases;
}

function generateThreeSumHiddenCases(): TestCase[] {
  const cases: TestCase[] = [];
  cases.push({ input: '[0,0,0]', expectedOutput: '[[0,0,0]]' });
  cases.push({ input: '[0,0,0,0]', expectedOutput: '[[0,0,0]]' });
  cases.push({ input: '[-1,0,1]', expectedOutput: '[[-1,0,1]]' });
  cases.push({ input: '[-2,0,2]', expectedOutput: '[[-2,0,2]]' });

  for (let i = 1; i <= 45; i++) {
    const a = -i;
    const b = Math.floor(i / 2);
    const c = i - b;
    cases.push({
      input: `[${a},${b},${c},1000,2000]`,
      expectedOutput: `[[${a},${b},${c}]]`,
    });
  }

  for (const size of [500, 1000, 2000]) {
    cases.push({
      input: `[STRESS_TEST N=${size} all zeroes] [0...0]`,
      expectedOutput: '[[0,0,0]]',
    });
  }

  return cases;
}

function generateContainerWithMostWaterHiddenCases(): TestCase[] {
  const cases: TestCase[] = [];
  cases.push({ input: '[1,1]', expectedOutput: '1' });
  cases.push({ input: '[1,2]', expectedOutput: '1' });
  cases.push({ input: '[2,1]', expectedOutput: '1' });
  cases.push({ input: '[10,10]', expectedOutput: '10' });

  for (let len = 2; len <= 65; len++) {
    const arr = Array.from({ length: len }, (_, i) => ((i * 17) % 30) + 1);
    let l = 0, r = arr.length - 1;
    let maxA = 0;
    while (l < r) {
      maxA = Math.max(maxA, Math.min(arr[l], arr[r]) * (r - l));
      if (arr[l] < arr[r]) l++;
      else r--;
    }
    cases.push({
      input: `[${arr.join(',')}]`,
      expectedOutput: String(maxA),
    });
  }

  for (const size of [1000, 5000, 10000]) {
    cases.push({
      input: `[STRESS_TEST N=${size} uniform 5] [5...5]`,
      expectedOutput: String(5 * (size - 1)),
    });
  }

  return cases;
}

function generateLongestSubstringHiddenCases(): TestCase[] {
  const cases: TestCase[] = [];
  cases.push({ input: '""', expectedOutput: '0' });
  cases.push({ input: '"a"', expectedOutput: '1' });
  cases.push({ input: '"aa"', expectedOutput: '1' });
  cases.push({ input: '"ab"', expectedOutput: '2' });
  cases.push({ input: '"abcdef"', expectedOutput: '6' });

  for (let i = 1; i <= 45; i++) {
    const str = 'abcdefghijklmnopqrstuvwxyz'.slice(0, (i % 25) + 1);
    cases.push({
      input: `"${str + str}"`,
      expectedOutput: String(str.length),
    });
  }

  for (const size of [1000, 5000, 10000]) {
    cases.push({
      input: `[STRESS_TEST N=${size} "a"xN]`,
      expectedOutput: '1',
    });
  }

  return cases;
}

function generateMinStackHiddenCases(): TestCase[] {
  const cases: TestCase[] = [];
  cases.push({ input: '[5]', expectedOutput: '5' });
  cases.push({ input: '[5, 4, 3, 2, 1]', expectedOutput: '1' });
  cases.push({ input: '[1, 2, 3, 4, 5]', expectedOutput: '1' });
  cases.push({ input: '[-10, 0, -20, 5]', expectedOutput: '-20' });

  for (let i = 1; i <= 45; i++) {
    const arr = Array.from({ length: 5 + (i % 10) }, (_, k) => (k * 13 + i) % 50 - 25);
    const minVal = Math.min(...arr);
    cases.push({
      input: `[${arr.join(',')}]`,
      expectedOutput: String(minVal),
    });
  }

  for (const size of [1000, 5000]) {
    cases.push({
      input: `[STRESS_TEST N=${size}] [1...${size}]`,
      expectedOutput: '1',
    });
  }

  return cases;
}
