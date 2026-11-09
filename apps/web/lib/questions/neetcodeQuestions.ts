import { LeetCodeQuestion } from './types';
import rawNeetcodeAll from './neetcodeAllData.json';

export const NEETCODE_ROADMAP_CATEGORIES = [
  'Arrays & Hashing',
  'Two Pointers',
  'Sliding Window',
  'Stack',
  'Binary Search',
  'Linked List',
  'Trees',
  'Tries',
  'Heap / Priority Queue',
  'Backtracking',
  'Graphs',
  'Advanced Graphs',
  '1-D Dynamic Programming',
  '2-D Dynamic Programming',
  'Greedy',
  'Intervals',
  'Math & Geometry',
  'Bit Manipulation',
  'JavaScript',
] as const;

const HANDCRAFTED_NEETCODE_QUESTIONS: LeetCodeQuestion[] = [
  // ==========================================
  // ARRAYS & HASHING
  // ==========================================
  {
    id: 'lc-1929',
    number: 1929,
    slug: 'concatenation-of-array',
    title: 'Concatenation of Array',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    topics: ['Array', 'Simulation'],
    acceptanceRate: '89.8%',
    likes: 3626,
    dislikes: 426,
    description: `Given an integer array \`nums\` of length \`n\`, you want to create an array \`ans\` of length \`2n\` where \`ans[i] == nums[i]\` and \`ans[i + n] == nums[i]\` for \`0 <= i < n\` (0-indexed).

Specifically, \`ans\` is the **concatenation** of two \`nums\` arrays.

Return the array \`ans\`.`,
    examples: [
      {
        input: 'nums = [1,2,1]',
        expectedOutput: '[1,2,1,1,2,1]',
        explanation: 'The array ans is formed as follows:\n- ans = [nums[0],nums[1],nums[2],nums[0],nums[1],nums[2]]\n- ans = [1,2,1,1,2,1]',
      },
      {
        input: 'nums = [1,3,2,1]',
        expectedOutput: '[1,3,2,1,1,3,2,1]',
        explanation: 'The array ans is formed as follows:\n- ans = [nums[0],nums[1],nums[2],nums[3],nums[0],nums[1],nums[2],nums[3]]\n- ans = [1,3,2,1,1,3,2,1]',
      },
    ],
    constraints: ['n == nums.length', '1 <= n <= 1000', '1 <= nums[i] <= 1000'],
    hints: [
      'Build an array of size 2 * n.',
      'Loop through the original array and assign ans[i] = nums[i] and ans[i + n] = nums[i].',
      'Alternatively in Python or JavaScript, you can use built-in array concatenation like nums + nums or [...nums, ...nums].',
    ],
    starterCodes: {
      python: `class Solution:
    def getConcatenation(self, nums: List[int]) -> List[int]:
        # Write your code here
        pass
`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
var getConcatenation = function(nums) {
    // Write your code here
    
};
`,
      typescript: `function getConcatenation(nums: number[]): number[] {
    // Write your code here
    
}
`,
      cpp: `class Solution {
public:
    vector<int> getConcatenation(vector<int>& nums) {
        // Write your code here
        
    }
};
`,
      java: `class Solution {
    public int[] getConcatenation(int[] nums) {
        // Write your code here
        return new int[0];
    }
}
`,
    },
    functionName: 'getConcatenation',
    paramNames: ['nums'],
    testCases: [
      { input: '[1,2,1]', expectedOutput: '[1,2,1,1,2,1]' },
      { input: '[1,3,2,1]', expectedOutput: '[1,3,2,1,1,3,2,1]' },
      { input: '[7]', expectedOutput: '[7,7]' },
    ],
    hiddenTestCases: [
      { input: '[10,20,30,40]', expectedOutput: '[10,20,30,40,10,20,30,40]' },
      { input: '[5,5,5]', expectedOutput: '[5,5,5,5,5,5]' },
      { input: '[0]', expectedOutput: '[0,0]' },
    ],
    editorial: {
      approach: 'Single Pass Array Duplication',
      intuition: 'We need to concatenate two identical copies of the array nums. An array of length 2n is created, and we copy each element nums[i] into ans[i] and ans[i + n].',
      timeComplexity: 'O(n) - We iterate over the array once of length n.',
      spaceComplexity: 'O(n) - Auxiliary space for output array of size 2n.',
      pythonSolution: `class Solution:
    def getConcatenation(self, nums: List[int]) -> List[int]:
        return nums + nums`,
      javascriptSolution: `var getConcatenation = function(nums) {
    return [...nums, ...nums];
};`,
      walkthrough: 'Both the spread operator in modern JS/TS and list repetition in Python perform the concatenation in linear time O(n). In lower-level languages like C++ or Java, allocate a new array of capacity 2 * n and populate both halves.',
    },
  },
  {
    id: 'lc-217',
    number: 217,
    slug: 'contains-duplicate',
    title: 'Contains Duplicate',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    topics: ['Array', 'Hash Table', 'Sorting'],
    acceptanceRate: '61.8%',
    likes: 12500,
    dislikes: 1200,
    description: `Given an integer array \`nums\`, return \`true\` if any value appears **at least twice** in the array, and return \`false\` if every element is distinct.`,
    examples: [
      { input: 'nums = [1,2,3,1]', expectedOutput: 'true' },
      { input: 'nums = [1,2,3,4]', expectedOutput: 'false' },
      { input: 'nums = [1,1,1,3,3,4,3,2,4,2]', expectedOutput: 'true' },
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    hints: ['Can you use a Set or Hash Set to track numbers you have already visited?'],
    starterCodes: {
      python: `class Solution:
    def containsDuplicate(self, nums: List[int]) -> bool:
        pass
`,
      javascript: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
var containsDuplicate = function(nums) {
    
};
`,
      typescript: `function containsDuplicate(nums: number[]): boolean {
    
}
`,
      cpp: `class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        
    }
};
`,
      java: `class Solution {
    public boolean containsDuplicate(int[] nums) {
        return false;
    }
}
`,
    },
    functionName: 'containsDuplicate',
    paramNames: ['nums'],
    testCases: [
      { input: '[1,2,3,1]', expectedOutput: 'true' },
      { input: '[1,2,3,4]', expectedOutput: 'false' },
      { input: '[1,1,1,3,3,4,3,2,4,2]', expectedOutput: 'true' },
    ],
    editorial: {
      approach: 'Hash Set Lookup',
      intuition: 'Store seen numbers in a Hash Set. If any number is already present, return true.',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      pythonSolution: `class Solution:
    def containsDuplicate(self, nums: List[int]) -> bool:
        return len(nums) != len(set(nums))`,
      javascriptSolution: `var containsDuplicate = function(nums) {
    return new Set(nums).size !== nums.length;
};`,
      walkthrough: 'A Hash Set provides O(1) average lookup and insertion.',
    },
  },
  {
    id: 'lc-242',
    number: 242,
    slug: 'valid-anagram',
    title: 'Valid Anagram',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    topics: ['Hash Table', 'String', 'Sorting'],
    acceptanceRate: '64.2%',
    likes: 12000,
    dislikes: 390,
    description: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
    examples: [
      { input: 's = "anagram", t = "nagaram"', expectedOutput: 'true' },
      { input: 's = "rat", t = "car"', expectedOutput: 'false' },
    ],
    constraints: ['1 <= s.length, t.length <= 5 * 10^4', 's and t consist of lowercase English letters.'],
    hints: ['If lengths differ, return false immediately.', 'Count frequencies of each character and check if both match.'],
    starterCodes: {
      python: `class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        pass
`,
      javascript: `/**
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
var isAnagram = function(s, t) {
    
};
`,
      typescript: `function isAnagram(s: string, t: string): boolean {
    
}
`,
      cpp: `class Solution {
public:
    bool isAnagram(string s, string t) {
        
    }
};
`,
      java: `class Solution {
    public boolean isAnagram(String s, String t) {
        return false;
    }
}
`,
    },
    functionName: 'isAnagram',
    paramNames: ['s', 't'],
    testCases: [
      { input: '"anagram", "nagaram"', expectedOutput: 'true' },
      { input: '"rat", "car"', expectedOutput: 'false' },
    ],
    editorial: {
      approach: 'Frequency Counter Array',
      intuition: 'Two strings are anagrams if and only if they have the same character frequencies.',
      timeComplexity: 'O(n) - Single pass through both strings.',
      spaceComplexity: 'O(1) - Constant auxiliary space for 26 alphabet characters.',
      pythonSolution: `class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        return collections.Counter(s) == collections.Counter(t)`,
      javascriptSolution: `var isAnagram = function(s, t) {
    if (s.length !== t.length) return false;
    const count = {};
    for (const c of s) count[c] = (count[c] || 0) + 1;
    for (const c of t) {
        if (!count[c]) return false;
        count[c]--;
    }
    return true;
};`,
      walkthrough: 'Track character counts or sort characters and compare.',
    },
  },
  {
    id: 'lc-1',
    number: 1,
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    topics: ['Array', 'Hash Table'],
    acceptanceRate: '56.1%',
    likes: 63512,
    dislikes: 2313,
    description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have ***exactly* one solution**, and you may not use the *same* element twice.

You can return the answer in any order.`,
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', expectedOutput: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', expectedOutput: '[1,2]', explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].' },
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9', 'Only one valid answer exists.'],
    hints: ['Can we use a hash map to check if the complement (target - nums[i]) exists in O(1) time?'],
    starterCodes: {
      python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        pass
`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    
};
`,
      typescript: `function twoSum(nums: number[], target: number): number[] {
    
}
`,
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        
    }
};
`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        return new int[0];
    }
}
`,
    },
    functionName: 'twoSum',
    paramNames: ['nums', 'target'],
    testCases: [
      { input: '[2,7,11,15], 9', expectedOutput: '[0,1]' },
      { input: '[3,2,4], 6', expectedOutput: '[1,2]' },
      { input: '[3,3], 6', expectedOutput: '[0,1]' },
    ],
    editorial: {
      approach: 'One-Pass Hash Table',
      intuition: 'Store previous numbers and their indices in a hash map. At each element, check if target - nums[i] is already in the map.',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      pythonSolution: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, n in enumerate(nums):
            diff = target - n
            if diff in seen:
                return [seen[diff], i]
            seen[n] = i
        return []`,
      javascriptSolution: `var twoSum = function(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) return [map.get(diff), i];
        map.set(nums[i], i);
    }
    return [];
};`,
      walkthrough: 'Single pass lookup with O(1) complement check.',
    },
  },
  {
    id: 'lc-49',
    number: 49,
    slug: 'group-anagrams',
    title: 'Group Anagrams',
    difficulty: 'Medium',
    category: 'Arrays & Hashing',
    topics: ['Array', 'Hash Table', 'String', 'Sorting'],
    acceptanceRate: '68.9%',
    likes: 18400,
    dislikes: 540,
    description: `Given an array of strings \`strs\`, group **the anagrams** together. You can return the answer in **any order**.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
    examples: [
      { input: 'strs = ["eat","tea","tan","ate","nat","bat"]', expectedOutput: '[["bat"],["nat","tan"],["ate","eat","tea"]]' },
      { input: 'strs = [""]', expectedOutput: '[[""]]' },
      { input: 'strs = ["a"]', expectedOutput: '[["a"]]' },
    ],
    constraints: ['1 <= strs.length <= 10^4', '0 <= strs[i].length <= 100', 'strs[i] consists of lowercase English letters.'],
    hints: ['Two strings are anagrams if their sorted representations are identical.'],
    starterCodes: {
      python: `class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        pass
`,
      javascript: `/**
 * @param {string[]} strs
 * @return {string[][]}
 */
var groupAnagrams = function(strs) {
    
};
`,
      typescript: `function groupAnagrams(strs: string[]): string[][] {
    
}
`,
      cpp: `class Solution {
public:
    vector<vector<string>> groupAnagrams(vector<string>& strs) {
        
    }
};
`,
      java: `class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
        return new ArrayList<>();
    }
}
`,
    },
    functionName: 'groupAnagrams',
    paramNames: ['strs'],
    testCases: [
      { input: '["eat","tea","tan","ate","nat","bat"]', expectedOutput: '[["eat","tea","ate"],["tan","nat"],["bat"]]' },
      { input: '[""]', expectedOutput: '[[""]]' },
      { input: '["a"]', expectedOutput: '[["a"]]' },
    ],
    editorial: {
      approach: 'Hash Map with Sorted Key / Frequency Tuple',
      intuition: 'Sort each string to use as the canonical dictionary key for that anagram family.',
      timeComplexity: 'O(m * n log n) where m is number of strings, n is max string length.',
      spaceComplexity: 'O(m * n)',
      pythonSolution: `class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        ans = collections.defaultdict(list)
        for s in strs:
            ans[tuple(sorted(s))].append(s)
        return list(ans.values())`,
      javascriptSolution: `var groupAnagrams = function(strs) {
    const map = {};
    for (const s of strs) {
        const key = s.split('').sort().join('');
        if (!map[key]) map[key] = [];
        map[key].push(s);
    }
    return Object.values(map);
};`,
      walkthrough: 'Canonicalize each anagram family by sorted character key.',
    },
  },
  {
    id: 'lc-347',
    number: 347,
    slug: 'top-k-frequent-elements',
    title: 'Top K Frequent Elements',
    difficulty: 'Medium',
    category: 'Arrays & Hashing',
    topics: ['Array', 'Hash Table', 'Divide and Conquer', 'Sorting', 'Heap', 'Bucket Sort'],
    acceptanceRate: '63.2%',
    likes: 17200,
    dislikes: 620,
    description: `Given an integer array \`nums\` and an integer \`k\`, return *the* \`k\` *most frequent elements*. You may return the answer in **any order**.`,
    examples: [
      { input: 'nums = [1,1,1,2,2,3], k = 2', expectedOutput: '[1,2]' },
      { input: 'nums = [1], k = 1', expectedOutput: '[1]' },
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4', 'k is in the range [1, the number of unique elements in the array].'],
    hints: ['Count frequencies with a hash map, then use Bucket Sort in O(n) or a Min-Heap of size k.'],
    starterCodes: {
      python: `class Solution:
    def topKFrequent(self, nums: List[int], k: int) -> List[int]:
        pass
`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number[]}
 */
var topKFrequent = function(nums, k) {
    
};
`,
      typescript: `function topKFrequent(nums: number[], k: number): number[] {
    
}
`,
      cpp: `class Solution {
public:
    vector<int> topKFrequent(vector<int>& nums, int k) {
        
    }
};
`,
      java: `class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        return new int[0];
    }
}
`,
    },
    functionName: 'topKFrequent',
    paramNames: ['nums', 'k'],
    testCases: [
      { input: '[1,1,1,2,2,3], 2', expectedOutput: '[1,2]' },
      { input: '[1], 1', expectedOutput: '[1]' },
    ],
    editorial: {
      approach: 'Bucket Sort O(n)',
      intuition: 'Index an array by frequency count (0 to n). Elements with frequency f go into bucket[f]. Collect top k elements from the highest bucket downwards.',
      timeComplexity: 'O(n) linear time with bucket sort.',
      spaceComplexity: 'O(n)',
      pythonSolution: `class Solution:
    def topKFrequent(self, nums: List[int], k: int) -> List[int]:
        count = Counter(nums)
        buckets = [[] for _ in range(len(nums) + 1)]
        for n, c in count.items():
            buckets[c].append(n)
        res = []
        for i in range(len(buckets) - 1, 0, -1):
            for n in buckets[i]:
                res.append(n)
                if len(res) == k:
                    return res`,
      javascriptSolution: `var topKFrequent = function(nums, k) {
    const map = new Map();
    for (const n of nums) map.set(n, (map.get(n) || 0) + 1);
    return [...map.entries()].sort((a,b) => b[1] - a[1]).slice(0, k).map(e => e[0]);
};`,
      walkthrough: 'Bucket sort or max-frequency traversal.',
    },
  },
  {
    id: 'lc-238',
    number: 238,
    slug: 'product-of-array-except-self',
    title: 'Product of Array Except Self',
    difficulty: 'Medium',
    category: 'Arrays & Hashing',
    topics: ['Array', 'Prefix Sum'],
    acceptanceRate: '65.4%',
    likes: 21500,
    dislikes: 1250,
    description: `Given an integer array \`nums\`, return *an array* \`answer\` *such that* \`answer[i]\` *is equal to the product of all the elements of* \`nums\` *except* \`nums[i]\`.

The product of any prefix or suffix of \`nums\` is **guaranteed** to fit in a **32-bit** integer.

You must write an algorithm that runs in \`O(n)\` time and without using the division operation.`,
    examples: [
      { input: 'nums = [1,2,3,4]', expectedOutput: '[24,12,8,6]' },
      { input: 'nums = [-1,1,0,-3,3]', expectedOutput: '[0,0,9,0,0]' },
    ],
    constraints: ['2 <= nums.length <= 10^5', '-30 <= nums[i] <= 30'],
    hints: ['Think of prefix products and suffix products.'],
    starterCodes: {
      python: `class Solution:
    def productExceptSelf(self, nums: List[int]) -> List[int]:
        pass
`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
var productExceptSelf = function(nums) {
    
};
`,
      typescript: `function productExceptSelf(nums: number[]): number[] {
    
}
`,
      cpp: `class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {
        
    }
};
`,
      java: `class Solution {
    public int[] productExceptSelf(int[] nums) {
        return new int[0];
    }
}
`,
    },
    functionName: 'productExceptSelf',
    paramNames: ['nums'],
    testCases: [
      { input: '[1,2,3,4]', expectedOutput: '[24,12,8,6]' },
      { input: '[-1,1,0,-3,3]', expectedOutput: '[0,0,9,0,0]' },
    ],
    editorial: {
      approach: 'Prefix and Suffix Accumulator',
      intuition: 'Each index answer[i] is prefix product of elements before i multiplied by postfix product of elements after i.',
      timeComplexity: 'O(n) two-pass solution.',
      spaceComplexity: 'O(1) excluding output array.',
      pythonSolution: `class Solution:
    def productExceptSelf(self, nums: List[int]) -> List[int]:
        res = [1] * len(nums)
        prefix = 1
        for i in range(len(nums)):
            res[i] = prefix
            prefix *= nums[i]
        postfix = 1
        for i in range(len(nums) - 1, -1, -1):
            res[i] *= postfix
            postfix *= nums[i]
        return res`,
      javascriptSolution: `var productExceptSelf = function(nums) {
    const n = nums.length;
    const res = new Array(n).fill(1);
    let prefix = 1;
    for (let i = 0; i < n; i++) {
        res[i] = prefix;
        prefix *= nums[i];
    }
    let postfix = 1;
    for (let i = n - 1; i >= 0; i--) {
        res[i] *= postfix;
        postfix *= nums[i];
    }
    return res;
};`,
      walkthrough: 'Calculate prefix products forward, then multiply postfix products backward.',
    },
  },
  {
    id: 'lc-128',
    number: 128,
    slug: 'longest-consecutive-sequence',
    title: 'Longest Consecutive Sequence',
    difficulty: 'Medium',
    category: 'Arrays & Hashing',
    topics: ['Array', 'Hash Table', 'Union Find'],
    acceptanceRate: '47.8%',
    likes: 19800,
    dislikes: 950,
    description: `Given an unsorted array of integers \`nums\`, return *the length of the longest consecutive elements sequence*.

You must write an algorithm that runs in \`O(n)\` time.`,
    examples: [
      { input: 'nums = [100,4,200,1,3,2]', expectedOutput: '4', explanation: 'The longest consecutive elements sequence is [1, 2, 3, 4]. Its length is 4.' },
      { input: 'nums = [0,3,7,2,5,8,4,6,0,1]', expectedOutput: '9' },
    ],
    constraints: ['0 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    hints: ['Store elements in a set. Only start counting consecutive streak when num - 1 is not in the set.'],
    starterCodes: {
      python: `class Solution:
    def longestConsecutive(self, nums: List[int]) -> int:
        pass
`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var longestConsecutive = function(nums) {
    
};
`,
      typescript: `function longestConsecutive(nums: number[]): number {
    
}
`,
      cpp: `class Solution {
public:
    int longestConsecutive(vector<int>& nums) {
        
    }
};
`,
      java: `class Solution {
    public int longestConsecutive(int[] nums) {
        return 0;
    }
}
`,
    },
    functionName: 'longestConsecutive',
    paramNames: ['nums'],
    testCases: [
      { input: '[100,4,200,1,3,2]', expectedOutput: '4' },
      { input: '[0,3,7,2,5,8,4,6,0,1]', expectedOutput: '9' },
    ],
    editorial: {
      approach: 'Hash Set Sequence Start Check',
      intuition: 'Only numbers where num - 1 does NOT exist in the set can be the beginning of a sequence. For those, count upward.',
      timeComplexity: 'O(n) - Each number is visited at most twice.',
      spaceComplexity: 'O(n)',
      pythonSolution: `class Solution:
    def longestConsecutive(self, nums: List[int]) -> int:
        num_set = set(nums)
        longest = 0
        for n in num_set:
            if (n - 1) not in num_set:
                length = 1
                while (n + length) in num_set:
                    length += 1
                longest = max(length, longest)
        return longest`,
      javascriptSolution: `var longestConsecutive = function(nums) {
    const set = new Set(nums);
    let longest = 0;
    for (const n of set) {
        if (!set.has(n - 1)) {
            let len = 1;
            while (set.has(n + len)) len++;
            longest = Math.max(longest, len);
        }
    }
    return longest;
};`,
      walkthrough: 'Use hash set to detect streak starts and traverse linear streaks.',
    },
  },

  // ==========================================
  // TWO POINTERS
  // ==========================================
  {
    id: 'lc-125',
    number: 125,
    slug: 'valid-palindrome',
    title: 'Valid Palindrome',
    difficulty: 'Easy',
    category: 'Two Pointers',
    topics: ['Two Pointers', 'String'],
    acceptanceRate: '46.7%',
    likes: 9200,
    dislikes: 8100,
    description: `A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string \`s\`, return \`true\` *if it is a **palindrome**, or* \`false\` *otherwise*.`,
    examples: [
      { input: 's = "A man, a plan, a canal: Panama"', expectedOutput: 'true', explanation: '"amanaplanacanalpanama" is a palindrome.' },
      { input: 's = "race a car"', expectedOutput: 'false' },
      { input: 's = " "', expectedOutput: 'true' },
    ],
    constraints: ['1 <= s.length <= 2 * 10^5', 's consists only of printable ASCII characters.'],
    hints: ['Use two pointers left and right, moving inwards.'],
    starterCodes: {
      python: `class Solution:
    def isPalindrome(self, s: str) -> bool:
        pass
`,
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
var isPalindrome = function(s) {
    
};
`,
      typescript: `function isPalindrome(s: string): boolean {
    
}
`,
      cpp: `class Solution {
public:
    bool isPalindrome(string s) {
        
    }
};
`,
      java: `class Solution {
    public boolean isPalindrome(String s) {
        return false;
    }
}
`,
    },
    functionName: 'isPalindrome',
    paramNames: ['s'],
    testCases: [
      { input: '"A man, a plan, a canal: Panama"', expectedOutput: 'true' },
      { input: '"race a car"', expectedOutput: 'false' },
      { input: '" "', expectedOutput: 'true' },
    ],
    editorial: {
      approach: 'Two Pointers Inward Scan',
      intuition: 'Skip non-alphanumeric characters with two pointers at left and right extremes.',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      pythonSolution: `class Solution:
    def isPalindrome(self, s: str) -> bool:
        l, r = 0, len(s) - 1
        while l < r:
            while l < r and not s[l].isalnum(): l += 1
            while l < r and not s[r].isalnum(): r -= 1
            if s[l].lower() != s[r].lower(): return False
            l += 1; r -= 1
        return True`,
      javascriptSolution: `var isPalindrome = function(s) {
    const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
    let l = 0, r = clean.length - 1;
    while (l < r) {
        if (clean[l++] !== clean[r--]) return false;
    }
    return true;
};`,
      walkthrough: 'Two pointers converging from ends.',
    },
  },
  {
    id: 'lc-15',
    number: 15,
    slug: '3sum',
    title: '3Sum',
    difficulty: 'Medium',
    category: 'Two Pointers',
    topics: ['Array', 'Two Pointers', 'Sorting'],
    acceptanceRate: '34.8%',
    likes: 31200,
    dislikes: 2800,
    description: `Given an integer array nums, return all the triplets \`[nums[i], nums[j], nums[k]]\` such that \`i != j\`, \`i != k\`, and \`j != k\`, and \`nums[i] + nums[j] + nums[k] == 0\`.

Notice that the solution set must not contain duplicate triplets.`,
    examples: [
      { input: 'nums = [-1,0,1,2,-1,-4]', expectedOutput: '[[-1,-1,2],[-1,0,1]]' },
      { input: 'nums = [0,1,1]', expectedOutput: '[]' },
      { input: 'nums = [0,0,0]', expectedOutput: '[[0,0,0]]' },
    ],
    constraints: ['3 <= nums.length <= 3000', '-10^5 <= nums[i] <= 10^5'],
    hints: ['Sort the array, then for each element nums[i], run Two Sum with two pointers.'],
    starterCodes: {
      python: `class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        pass
`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var threeSum = function(nums) {
    
};
`,
      typescript: `function threeSum(nums: number[]): number[][] {
    
}
`,
      cpp: `class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        
    }
};
`,
      java: `class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        return new ArrayList<>();
    }
}
`,
    },
    functionName: 'threeSum',
    paramNames: ['nums'],
    testCases: [
      { input: '[-1,0,1,2,-1,-4]', expectedOutput: '[[-1,-1,2],[-1,0,1]]' },
      { input: '[0,1,1]', expectedOutput: '[]' },
      { input: '[0,0,0]', expectedOutput: '[[0,0,0]]' },
    ],
    editorial: {
      approach: 'Sort + Two Pointers',
      intuition: 'Sorting allows using two pointers to find pairs adding up to -nums[i] in O(n) per element.',
      timeComplexity: 'O(n^2)',
      spaceComplexity: 'O(1) extra space.',
      pythonSolution: `class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        nums.sort()
        res = []
        for i in range(len(nums)):
            if i > 0 and nums[i] == nums[i - 1]: continue
            l, r = i + 1, len(nums) - 1
            while l < r:
                s = nums[i] + nums[l] + nums[r]
                if s < 0: l += 1
                elif s > 0: r -= 1
                else:
                    res.append([nums[i], nums[l], nums[r]])
                    l += 1
                    while nums[l] == nums[l - 1] and l < r: l += 1
        return res`,
      javascriptSolution: `var threeSum = function(nums) {
    nums.sort((a,b) => a - b);
    const res = [];
    for (let i = 0; i < nums.length; i++) {
        if (i > 0 && nums[i] === nums[i - 1]) continue;
        let l = i + 1, r = nums.length - 1;
        while (l < r) {
            const sum = nums[i] + nums[l] + nums[r];
            if (sum === 0) {
                res.push([nums[i], nums[l], nums[r]]);
                while (l < r && nums[l] === nums[l + 1]) l++;
                while (l < r && nums[r] === nums[r - 1]) r--;
                l++; r--;
            } else if (sum < 0) l++;
            else r--;
        }
    }
    return res;
};`,
      walkthrough: 'Sort array and sweep with two pointers while skipping duplicates.',
    },
  },
  {
    id: 'lc-11',
    number: 11,
    slug: 'container-with-most-water',
    title: 'Container With Most Water',
    difficulty: 'Medium',
    category: 'Two Pointers',
    topics: ['Array', 'Two Pointers', 'Greedy'],
    acceptanceRate: '55.3%',
    likes: 29000,
    dislikes: 1700,
    description: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i\`-th line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return *the maximum amount of water a container can store*.`,
    examples: [
      { input: 'height = [1,8,6,2,5,4,8,3,7]', expectedOutput: '49', explanation: 'The above vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. The max area is 49.' },
      { input: 'height = [1,1]', expectedOutput: '1' },
    ],
    constraints: ['n == height.length', '2 <= n <= 10^5', '0 <= height[i] <= 10^4'],
    hints: ['Start with the widest container (left = 0, right = n-1) and move the pointer pointing to the shorter line.'],
    starterCodes: {
      python: `class Solution:
    def maxArea(self, height: List[int]) -> int:
        pass
`,
      javascript: `/**
 * @param {number[]} height
 * @return {number}
 */
var maxArea = function(height) {
    
};
`,
      typescript: `function maxArea(height: number[]): number {
    
}
`,
      cpp: `class Solution {
public:
    int maxArea(vector<int>& height) {
        
    }
};
`,
      java: `class Solution {
    public int maxArea(int[] height) {
        return 0;
    }
}
`,
    },
    functionName: 'maxArea',
    paramNames: ['height'],
    testCases: [
      { input: '[1,8,6,2,5,4,8,3,7]', expectedOutput: '49' },
      { input: '[1,1]', expectedOutput: '1' },
    ],
    editorial: {
      approach: 'Two Pointers Greedy Squeeze',
      intuition: 'Always move the pointer with the smaller height, since the area is constrained by the minimum of the two heights.',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      pythonSolution: `class Solution:
    def maxArea(self, height: List[int]) -> int:
        l, r = 0, len(height) - 1
        res = 0
        while l < r:
            res = max(res, (r - l) * min(height[l], height[r]))
            if height[l] < height[r]: l += 1
            else: r -= 1
        return res`,
      javascriptSolution: `var maxArea = function(height) {
    let l = 0, r = height.length - 1, max = 0;
    while (l < r) {
        max = Math.max(max, Math.min(height[l], height[r]) * (r - l));
        if (height[l] < height[r]) l++;
        else r--;
    }
    return max;
};`,
      walkthrough: 'Greedy choice to shift inward from shorter vertical boundary.',
    },
  },

  // ==========================================
  // SLIDING WINDOW
  // ==========================================
  {
    id: 'lc-121',
    number: 121,
    slug: 'best-time-to-buy-and-sell-stock',
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'Easy',
    category: 'Sliding Window',
    topics: ['Array', 'Dynamic Programming'],
    acceptanceRate: '54.1%',
    likes: 31000,
    dislikes: 1100,
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i\`-th day.

You want to maximize your profit by choosing a **single day** to buy one stock and choosing a **different day in the future** to sell that stock.

Return *the maximum profit you can achieve from this transaction*. If you cannot achieve any profit, return \`0\`.`,
    examples: [
      { input: 'prices = [7,1,5,3,6,4]', expectedOutput: '5', explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.' },
      { input: 'prices = [7,6,4,3,1]', expectedOutput: '0' },
    ],
    constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^4'],
    hints: ['Track minimum price so far and maximum profit.'],
    starterCodes: {
      python: `class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        pass
`,
      javascript: `/**
 * @param {number[]} prices
 * @return {number}
 */
var maxProfit = function(prices) {
    
};
`,
      typescript: `function maxProfit(prices: number[]): number {
    
}
`,
      cpp: `class Solution {
public:
    int maxProfit(vector<int>& prices) {
        
    }
};
`,
      java: `class Solution {
    public int maxProfit(int[] prices) {
        return 0;
    }
}
`,
    },
    functionName: 'maxProfit',
    paramNames: ['prices'],
    testCases: [
      { input: '[7,1,5,3,6,4]', expectedOutput: '5' },
      { input: '[7,6,4,3,1]', expectedOutput: '0' },
    ],
    editorial: {
      approach: 'Running Minimum',
      intuition: 'Store the minimum price seen so far. At each step, calculate the potential profit.',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      pythonSolution: `class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        min_p = float('inf')
        max_p = 0
        for p in prices:
            if p < min_p: min_p = p
            elif p - min_p > max_p: max_p = p - min_p
        return max_p`,
      javascriptSolution: `var maxProfit = function(prices) {
    let minPrice = Infinity, maxProfit = 0;
    for (const p of prices) {
        if (p < minPrice) minPrice = p;
        else if (p - minPrice > maxProfit) maxProfit = p - minPrice;
    }
    return maxProfit;
};`,
      walkthrough: 'Track lowest buy point and maximum spread.',
    },
  },
  {
    id: 'lc-3',
    number: 3,
    slug: 'longest-substring-without-repeating-characters',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    category: 'Sliding Window',
    topics: ['Hash Table', 'String', 'Sliding Window'],
    acceptanceRate: '35.4%',
    likes: 39400,
    dislikes: 1850,
    description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.`,
    examples: [
      { input: 's = "abcabcbb"', expectedOutput: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', expectedOutput: '1' },
      { input: 's = "pwwkew"', expectedOutput: '3' },
    ],
    constraints: ['0 <= s.length <= 5 * 10^4', 's consists of English letters, digits, symbols and spaces.'],
    hints: ['Use a sliding window with a set. When a duplicate enters right, shrink left until duplicate is gone.'],
    starterCodes: {
      python: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        pass
`,
      javascript: `/**
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstring = function(s) {
    
};
`,
      typescript: `function lengthOfLongestSubstring(s: string): number {
    
}
`,
      cpp: `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        
    }
};
`,
      java: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        return 0;
    }
}
`,
    },
    functionName: 'lengthOfLongestSubstring',
    paramNames: ['s'],
    testCases: [
      { input: '"abcabcbb"', expectedOutput: '3' },
      { input: '"bbbbb"', expectedOutput: '1' },
      { input: '"pwwkew"', expectedOutput: '3' },
    ],
    editorial: {
      approach: 'Sliding Window with Hash Set',
      intuition: 'Maintain a window of unique characters. If s[r] is already in the set, advance l until it is removed.',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(min(m, n))',
      pythonSolution: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        char_set = set()
        l = 0
        res = 0
        for r in range(len(s)):
            while s[r] in char_set:
                char_set.remove(s[l])
                l += 1
            char_set.add(s[r])
            res = max(res, r - l + 1)
        return res`,
      javascriptSolution: `var lengthOfLongestSubstring = function(s) {
    const set = new Set();
    let l = 0, max = 0;
    for (let r = 0; r < s.length; r++) {
        while (set.has(s[r])) {
            set.delete(s[l]);
            l++;
        }
        set.add(s[r]);
        max = Math.max(max, r - l + 1);
    }
    return max;
};`,
      walkthrough: 'Dynamic sliding window with hash set tracking.',
    },
  },

  // ==========================================
  // STACK
  // ==========================================
  {
    id: 'lc-20',
    number: 20,
    slug: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    category: 'Stack',
    topics: ['String', 'Stack'],
    acceptanceRate: '40.6%',
    likes: 24500,
    dislikes: 1450,
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      { input: 's = "()"', expectedOutput: 'true' },
      { input: 's = "()[]{}"', expectedOutput: 'true' },
      { input: 's = "(]"', expectedOutput: 'false' },
    ],
    constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only \'()[]{}\'.'],
    hints: ['Push opening brackets onto stack. For closing brackets, check if top matches.'],
    starterCodes: {
      python: `class Solution:
    def isValid(self, s: str) -> bool:
        pass
`,
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
var isValid = function(s) {
    
};
`,
      typescript: `function isValid(s: string): boolean {
    
}
`,
      cpp: `class Solution {
public:
    bool isValid(string s) {
        
    }
};
`,
      java: `class Solution {
    public boolean isValid(String s) {
        return false;
    }
}
`,
    },
    functionName: 'isValid',
    paramNames: ['s'],
    testCases: [
      { input: '"()"', expectedOutput: 'true' },
      { input: '"()[]{}"', expectedOutput: 'true' },
      { input: '"(]"', expectedOutput: 'false' },
    ],
    editorial: {
      approach: 'LIFO Stack',
      intuition: 'Each closing bracket must pair with the most recently unclosed opening bracket.',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      pythonSolution: `class Solution:
    def isValid(self, s: str) -> bool:
        stack = []
        mapping = {")": "(", "}": "{", "]": "["}
        for c in s:
            if c in mapping:
                if not stack or stack.pop() != mapping[c]: return False
            else:
                stack.append(c)
        return not stack`,
      javascriptSolution: `var isValid = function(s) {
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    for (const ch of s) {
        if (map[ch]) {
            if (stack.pop() !== map[ch]) return false;
        } else stack.push(ch);
    }
    return stack.length === 0;
};`,
      walkthrough: 'Standard stack matching algorithm.',
    },
  },
  {
    id: 'lc-155',
    number: 155,
    slug: 'min-stack',
    title: 'Min Stack',
    difficulty: 'Medium',
    category: 'Stack',
    topics: ['Stack', 'Design'],
    acceptanceRate: '54.2%',
    likes: 14100,
    dislikes: 850,
    description: `Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.

Implement the \`MinStack\` class:
- \`MinStack()\` initializes the stack object.
- \`void push(int val)\` pushes the element \`val\` onto the stack.
- \`void pop()\` removes the element on the top of the stack.
- \`int top()\` gets the top element of the stack.
- \`int getMin()\` retrieves the minimum element in the stack.

You must implement a solution with \`O(1)\` time complexity for each function.`,
    examples: [
      { input: '["MinStack","push","push","push","getMin","pop","top","getMin"], [[],[-2],[0],[-3],[],[],[],[]]', expectedOutput: '[null,null,null,null,-3,null,0,-2]' },
    ],
    constraints: ['-2^31 <= val <= 2^31 - 1', 'Methods pop, top and getMin operations will always be called on non-empty stacks.'],
    hints: ['Store pairs of (value, min_so_far) in your stack or use an auxiliary min stack.'],
    starterCodes: {
      python: `class MinStack:
    def __init__(self):
        self.stack = []
        self.min_stack = []

    def push(self, val: int) -> None:
        pass

    def pop(self) -> None:
        pass

    def top(self) -> int:
        pass

    def getMin(self) -> int:
        pass
`,
      javascript: `var MinStack = function() {
    this.stack = [];
    this.minStack = [];
};

MinStack.prototype.push = function(val) {
    
};

MinStack.prototype.pop = function() {
    
};

MinStack.prototype.top = function() {
    
};

MinStack.prototype.getMin = function() {
    
};
`,
      typescript: `class MinStack {
    constructor() {}
    push(val: number): void {}
    pop(): void {}
    top(): number { return 0; }
    getMin(): number { return 0; }
}
`,
      cpp: `class MinStack {
public:
    MinStack() {}
    void push(int val) {}
    void pop() {}
    int top() { return 0; }
    int getMin() { return 0; }
};
`,
      java: `class MinStack {
    public MinStack() {}
    public void push(int val) {}
    public void pop() {}
    public int top() { return 0; }
    public int getMin() { return 0; }
}
`,
    },
    functionName: 'MinStack',
    paramNames: ['operations'],
    testCases: [
      { input: '[-2, 0, -3]', expectedOutput: '-3' },
    ],
    editorial: {
      approach: 'Two Stacks / Min Pair Stack',
      intuition: 'Maintain a secondary stack whose top element is always the minimum of the main stack up to that height.',
      timeComplexity: 'O(1) for all operations.',
      spaceComplexity: 'O(n)',
      pythonSolution: `class MinStack:
    def __init__(self):
        self.stack = []
        self.min_stack = []
    def push(self, val: int) -> None:
        self.stack.append(val)
        val = min(val, self.min_stack[-1] if self.min_stack else val)
        self.min_stack.append(val)
    def pop(self) -> None:
        self.stack.pop()
        self.min_stack.pop()
    def top(self) -> int:
        return self.stack[-1]
    def getMin(self) -> int:
        return self.min_stack[-1]`,
      javascriptSolution: `var MinStack = function() {
    this.stack = [];
    this.min = [];
};
MinStack.prototype.push = function(val) {
    this.stack.push(val);
    const m = this.min.length ? Math.min(val, this.min[this.min.length - 1]) : val;
    this.min.push(m);
};
MinStack.prototype.pop = function() {
    this.stack.pop();
    this.min.pop();
};
MinStack.prototype.top = function() {
    return this.stack[this.stack.length - 1];
};
MinStack.prototype.getMin = function() {
    return this.min[this.min.length - 1];
};`,
      walkthrough: 'Track running minimum in auxiliary stack.',
    },
  },

  // ==========================================
  // BINARY SEARCH
  // ==========================================
  {
    id: 'lc-704',
    number: 704,
    slug: 'binary-search',
    title: 'Binary Search',
    difficulty: 'Easy',
    category: 'Binary Search',
    topics: ['Array', 'Binary Search'],
    acceptanceRate: '57.9%',
    likes: 11400,
    dislikes: 230,
    description: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return \`-1\`.

You must write an algorithm with \`O(log n)\` runtime complexity.`,
    examples: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', expectedOutput: '4' },
      { input: 'nums = [-1,0,3,5,9,12], target = 2', expectedOutput: '-1' },
    ],
    constraints: ['1 <= nums.length <= 10^4', '-10^4 < nums[i], target < 10^4', 'nums is sorted in ascending order.'],
    hints: ['Check the midpoint element and halve the search window.'],
    starterCodes: {
      python: `class Solution:
    def search(self, nums: List[int], target: int) -> int:
        pass
`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var search = function(nums, target) {
    
};
`,
      typescript: `function search(nums: number[], target: number): number {
    
}
`,
      cpp: `class Solution {
public:
    int search(vector<int>& nums, int target) {
        
    }
};
`,
      java: `class Solution {
    public int search(int[] nums, int target) {
        return -1;
    }
}
`,
    },
    functionName: 'search',
    paramNames: ['nums', 'target'],
    testCases: [
      { input: '[-1,0,3,5,9,12], 9', expectedOutput: '4' },
      { input: '[-1,0,3,5,9,12], 2', expectedOutput: '-1' },
    ],
    editorial: {
      approach: 'Classic Binary Search',
      intuition: 'Calculate midpoint mid = Math.floor((l + r)/2). Move boundaries according to comparison with target.',
      timeComplexity: 'O(log n)',
      spaceComplexity: 'O(1)',
      pythonSolution: `class Solution:
    def search(self, nums: List[int], target: int) -> int:
        l, r = 0, len(nums) - 1
        while l <= r:
            mid = (l + r) // 2
            if nums[mid] == target: return mid
            elif nums[mid] < target: l = mid + 1
            else: r = mid - 1
        return -1`,
      javascriptSolution: `var search = function(nums, target) {
    let l = 0, r = nums.length - 1;
    while (l <= r) {
        const mid = Math.floor((l + r) / 2);
        if (nums[mid] === target) return mid;
        if (nums[mid] < target) l = mid + 1;
        else r = mid - 1;
    }
    return -1;
};`,
      walkthrough: 'Halve search space each loop.',
    },
  },

  // ==========================================
  // LINKED LIST
  // ==========================================
  {
    id: 'lc-206',
    number: 206,
    slug: 'reverse-linked-list',
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    category: 'Linked List',
    topics: ['Linked List', 'Recursion'],
    acceptanceRate: '76.1%',
    likes: 21800,
    dislikes: 420,
    description: `Given the \`head\` of a singly linked list, reverse the list, and return *the reversed list*.`,
    examples: [
      { input: 'head = [1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]' },
      { input: 'head = [1,2]', expectedOutput: '[2,1]' },
      { input: 'head = []', expectedOutput: '[]' },
    ],
    constraints: ['The number of nodes in the list is the range [0, 5000].', '-5000 <= Node.val <= 5000'],
    hints: ['Keep three pointers: prev, curr, next.'],
    starterCodes: {
      python: `class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        pass
`,
      javascript: `/**
 * @param {ListNode} head
 * @return {ListNode}
 */
var reverseList = function(head) {
    
};
`,
      typescript: `function reverseList(head: ListNode | null): ListNode | null {
    
}
`,
      cpp: `class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        
    }
};
`,
      java: `class Solution {
    public ListNode reverseList(ListNode head) {
        return null;
    }
}
`,
    },
    functionName: 'reverseList',
    paramNames: ['head'],
    testCases: [
      { input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]' },
      { input: '[1,2]', expectedOutput: '[2,1]' },
    ],
    editorial: {
      approach: 'Iterative Three Pointers',
      intuition: 'Store next node, flip curr.next to prev, then advance prev and curr.',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      pythonSolution: `class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        prev, curr = None, head
        while curr:
            nxt = curr.next
            curr.next = prev
            prev = curr
            curr = nxt
        return prev`,
      javascriptSolution: `var reverseList = function(head) {
    let prev = null, curr = head;
    while (curr) {
        const next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
};`,
      walkthrough: 'Flip pointers iteratively in O(n) time.',
    },
  },
  {
    id: 'lc-21',
    number: 21,
    slug: 'merge-two-sorted-lists',
    title: 'Merge Two Sorted Lists',
    difficulty: 'Easy',
    category: 'Linked List',
    topics: ['Linked List', 'Recursion'],
    acceptanceRate: '64.1%',
    likes: 22100,
    dislikes: 1950,
    description: `You are given the heads of two sorted linked lists \`list1\` and \`list2\`.

Merge the two lists into one **sorted** list. The list should be made by splicing together the nodes of the first two lists.

Return *the head of the merged linked list*.`,
    examples: [
      { input: 'list1 = [1,2,4], list2 = [1,3,4]', expectedOutput: '[1,1,2,3,4,4]' },
      { input: 'list1 = [], list2 = []', expectedOutput: '[]' },
    ],
    constraints: ['The number of nodes in both lists is in the range [0, 50].', '-100 <= Node.val <= 100'],
    hints: ['Use a dummy node to simplify list building.'],
    starterCodes: {
      python: `class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        pass
`,
      javascript: `/**
 * @param {ListNode} list1
 * @param {ListNode} list2
 * @return {ListNode}
 */
var mergeTwoLists = function(list1, list2) {
    
};
`,
      typescript: `function mergeTwoLists(list1: ListNode | null, list2: ListNode | null): ListNode | null {
    
}
`,
      cpp: `class Solution {
public:
    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {
        
    }
};
`,
      java: `class Solution {
    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {
        return null;
    }
}
`,
    },
    functionName: 'mergeTwoLists',
    paramNames: ['list1', 'list2'],
    testCases: [
      { input: '[1,2,4], [1,3,4]', expectedOutput: '[1,1,2,3,4,4]' },
    ],
    editorial: {
      approach: 'Dummy Node & Splice',
      intuition: 'Compare list1 and list2 heads, attach the smaller node to tail, and advance.',
      timeComplexity: 'O(n + m)',
      spaceComplexity: 'O(1)',
      pythonSolution: `class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        dummy = ListNode()
        tail = dummy
        while list1 and list2:
            if list1.val < list2.val:
                tail.next = list1
                list1 = list1.next
            else:
                tail.next = list2
                list2 = list2.next
            tail = tail.next
        tail.next = list1 or list2
        return dummy.next`,
      javascriptSolution: `var mergeTwoLists = function(list1, list2) {
    const dummy = { val: 0, next: null };
    let tail = dummy;
    while (list1 && list2) {
        if (list1.val < list2.val) {
            tail.next = list1;
            list1 = list1.next;
        } else {
            tail.next = list2;
            list2 = list2.next;
        }
        tail = tail.next;
    }
    tail.next = list1 || list2;
    return dummy.next;
};`,
      walkthrough: 'Iterative merge with sentinel node.',
    },
  },

  // ==========================================
  // TREES
  // ==========================================
  {
    id: 'lc-226',
    number: 226,
    slug: 'invert-binary-tree',
    title: 'Invert Binary Tree',
    difficulty: 'Easy',
    category: 'Trees',
    topics: ['Tree', 'Depth-First Search', 'Breadth-First Search', 'Binary Tree'],
    acceptanceRate: '77.8%',
    likes: 14200,
    dislikes: 210,
    description: `Given the \`root\` of a binary tree, invert the tree, and return *its root*.`,
    examples: [
      { input: 'root = [4,2,7,1,3,6,9]', expectedOutput: '[4,7,2,9,6,3,1]' },
      { input: 'root = [2,1,3]', expectedOutput: '[2,3,1]' },
    ],
    constraints: ['The number of nodes in the tree is in the range [0, 100].', '-100 <= Node.val <= 100'],
    hints: ['Swap root.left and root.right, then recursively invert both subtrees.'],
    starterCodes: {
      python: `class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        pass
`,
      javascript: `/**
 * @param {TreeNode} root
 * @return {TreeNode}
 */
var invertTree = function(root) {
    
};
`,
      typescript: `function invertTree(root: TreeNode | null): TreeNode | null {
    
}
`,
      cpp: `class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        
    }
};
`,
      java: `class Solution {
    public TreeNode invertTree(TreeNode root) {
        return null;
    }
}
`,
    },
    functionName: 'invertTree',
    paramNames: ['root'],
    testCases: [
      { input: '[4,2,7,1,3,6,9]', expectedOutput: '[4,7,2,9,6,3,1]' },
      { input: '[2,1,3]', expectedOutput: '[2,3,1]' },
    ],
    editorial: {
      approach: 'Recursive DFS',
      intuition: 'At each node, swap left and right pointers and invert children.',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(h) where h is tree height.',
      pythonSolution: `class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        if not root: return None
        root.left, root.right = root.right, root.left
        self.invertTree(root.left)
        self.invertTree(root.right)
        return root`,
      javascriptSolution: `var invertTree = function(root) {
    if (!root) return null;
    const temp = root.left;
    root.left = invertTree(root.right);
    root.right = invertTree(temp);
    return root;
};`,
      walkthrough: 'Post-order or pre-order swap.',
    },
  },
  {
    id: 'lc-104',
    number: 104,
    slug: 'maximum-depth-of-binary-tree',
    title: 'Maximum Depth of Binary Tree',
    difficulty: 'Easy',
    category: 'Trees',
    topics: ['Tree', 'Depth-First Search', 'Breadth-First Search', 'Binary Tree'],
    acceptanceRate: '75.9%',
    likes: 13500,
    dislikes: 240,
    description: `Given the \`root\` of a binary tree, return *its maximum depth*.

A binary tree's **maximum depth** is the number of nodes along the longest path from the root node down to the farthest leaf node.`,
    examples: [
      { input: 'root = [3,9,20,null,null,15,7]', expectedOutput: '3' },
      { input: 'root = [1,null,2]', expectedOutput: '2' },
    ],
    constraints: ['The number of nodes in the tree is in the range [0, 10^4].', '-100 <= Node.val <= 100'],
    hints: ['1 + max(depth(left), depth(right)).'],
    starterCodes: {
      python: `class Solution:
    def maxDepth(self, root: Optional[TreeNode]) -> int:
        pass
`,
      javascript: `/**
 * @param {TreeNode} root
 * @return {number}
 */
var maxDepth = function(root) {
    
};
`,
      typescript: `function maxDepth(root: TreeNode | null): number {
    
}
`,
      cpp: `class Solution {
public:
    int maxDepth(TreeNode* root) {
        
    }
};
`,
      java: `class Solution {
    public int maxDepth(TreeNode root) {
        return 0;
    }
}
`,
    },
    functionName: 'maxDepth',
    paramNames: ['root'],
    testCases: [
      { input: '[3,9,20,null,null,15,7]', expectedOutput: '3' },
      { input: '[1,null,2]', expectedOutput: '2' },
    ],
    editorial: {
      approach: 'DFS Depth Calculation',
      intuition: 'Depth of any node is 1 + max(leftDepth, rightDepth).',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      pythonSolution: `class Solution:
    def maxDepth(self, root: Optional[TreeNode]) -> int:
        if not root: return 0
        return 1 + max(self.maxDepth(root.left), self.maxDepth(root.right))`,
      javascriptSolution: `var maxDepth = function(root) {
    if (!root) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
};`,
      walkthrough: 'Recursive post-order traversal.',
    },
  },

  // ==========================================
  // 1-D DYNAMIC PROGRAMMING
  // ==========================================
  {
    id: 'lc-70',
    number: 70,
    slug: 'climbing-stairs',
    title: 'Climbing Stairs',
    difficulty: 'Easy',
    category: '1-D Dynamic Programming',
    topics: ['Math', 'Dynamic Programming', 'Memoization'],
    acceptanceRate: '53.1%',
    likes: 21500,
    dislikes: 850,
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?`,
    examples: [
      { input: 'n = 2', expectedOutput: '2', explanation: 'There are two ways: 1 step + 1 step, or 2 steps.' },
      { input: 'n = 3', expectedOutput: '3', explanation: 'There are three ways: 1+1+1, 1+2, 2+1.' },
    ],
    constraints: ['1 <= n <= 45'],
    hints: ['To reach step n, you must arrive from step n - 1 or step n - 2 (Fibonacci sequence).'],
    starterCodes: {
      python: `class Solution:
    def climbStairs(self, n: int) -> int:
        pass
`,
      javascript: `/**
 * @param {number} n
 * @return {number}
 */
var climbStairs = function(n) {
    
};
`,
      typescript: `function climbStairs(n: number): number {
    
}
`,
      cpp: `class Solution {
public:
    int climbStairs(int n) {
        
    }
};
`,
      java: `class Solution {
    public int climbStairs(int n) {
        return 0;
    }
}
`,
    },
    functionName: 'climbStairs',
    paramNames: ['n'],
    testCases: [
      { input: '2', expectedOutput: '2' },
      { input: '3', expectedOutput: '3' },
      { input: '5', expectedOutput: '8' },
    ],
    editorial: {
      approach: 'Bottom-up Fibonacci',
      intuition: 'ways(n) = ways(n-1) + ways(n-2) with base cases ways(1) = 1, ways(2) = 2.',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      pythonSolution: `class Solution:
    def climbStairs(self, n: int) -> int:
        one, two = 1, 1
        for _ in range(n - 1):
            temp = one
            one = one + two
            two = temp
        return one`,
      javascriptSolution: `var climbStairs = function(n) {
    if (n <= 2) return n;
    let prev2 = 1, prev1 = 2;
    for (let i = 3; i <= n; i++) {
        const cur = prev1 + prev2;
        prev2 = prev1;
        prev1 = cur;
    }
    return prev1;
};`,
      walkthrough: 'Constant space Fibonacci accumulation.',
    },
  },
  {
    id: 'lc-198',
    number: 198,
    slug: 'house-robber',
    title: 'House Robber',
    difficulty: 'Medium',
    category: '1-D Dynamic Programming',
    topics: ['Array', 'Dynamic Programming'],
    acceptanceRate: '51.4%',
    likes: 20400,
    dislikes: 420,
    description: `You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed, the only constraint stopping you from robbing each of them is that adjacent houses have security systems connected and **it will automatically contact the police if two adjacent houses were broken into on the same night**.

Given an integer array \`nums\` representing the amount of money of each house, return *the maximum amount of money you can rob tonight **without alerting the police***.`,
    examples: [
      { input: 'nums = [1,2,3,1]', expectedOutput: '4', explanation: 'Rob house 1 (money = 1) and rob house 3 (money = 3). Total = 1 + 3 = 4.' },
      { input: 'nums = [2,7,9,3,1]', expectedOutput: '12', explanation: 'Rob house 1, 3, and 5. Total = 2 + 9 + 1 = 12.' },
    ],
    constraints: ['1 <= nums.length <= 100', '0 <= nums[i] <= 400'],
    hints: ['rob = max(rob[i-1], rob[i-2] + nums[i]).'],
    starterCodes: {
      python: `class Solution:
    def rob(self, nums: List[int]) -> int:
        pass
`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var rob = function(nums) {
    
};
`,
      typescript: `function rob(nums: number[]): number {
    
}
`,
      cpp: `class Solution {
public:
    int rob(vector<int>& nums) {
        
    }
};
`,
      java: `class Solution {
    public int rob(int[] nums) {
        return 0;
    }
}
`,
    },
    functionName: 'rob',
    paramNames: ['nums'],
    testCases: [
      { input: '[1,2,3,1]', expectedOutput: '4' },
      { input: '[2,7,9,3,1]', expectedOutput: '12' },
    ],
    editorial: {
      approach: '1-D DP Recurrence',
      intuition: 'At each house, either rob this house and house i-2, or skip this house and take max up to house i-1.',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      pythonSolution: `class Solution:
    def rob(self, nums: List[int]) -> int:
        rob1, rob2 = 0, 0
        for n in nums:
            new_rob = max(rob1 + n, rob2)
            rob1 = rob2
            rob2 = new_rob
        return rob2`,
      javascriptSolution: `var rob = function(nums) {
    let rob1 = 0, rob2 = 0;
    for (const n of nums) {
        const temp = Math.max(n + rob1, rob2);
        rob1 = rob2;
        rob2 = temp;
    }
    return rob2;
};`,
      walkthrough: 'Track two variables rob1 and rob2 to achieve O(1) space.',
    },
  },
  {
    id: 'lc-322',
    number: 322,
    slug: 'coin-change',
    title: 'Coin Change',
    difficulty: 'Medium',
    category: '1-D Dynamic Programming',
    topics: ['Array', 'Dynamic Programming', 'Breadth-First Search'],
    acceptanceRate: '44.8%',
    likes: 19100,
    dislikes: 420,
    description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return *the fewest number of coins that you need to make up that amount*. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.`,
    examples: [
      { input: 'coins = [1,2,5], amount = 11', expectedOutput: '3', explanation: '11 = 5 + 5 + 1' },
      { input: 'coins = [2], amount = 3', expectedOutput: '-1' },
      { input: 'coins = [1], amount = 0', expectedOutput: '0' },
    ],
    constraints: ['1 <= coins.length <= 12', '1 <= coins[i] <= 2^31 - 1', '0 <= amount <= 10^4'],
    hints: ['dp[i] = min(dp[i], 1 + dp[i - coin]) for each coin.'],
    starterCodes: {
      python: `class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        pass
`,
      javascript: `/**
 * @param {number[]} coins
 * @param {number} amount
 * @return {number}
 */
var coinChange = function(coins, amount) {
    
};
`,
      typescript: `function coinChange(coins: number[], amount: number): number {
    
}
`,
      cpp: `class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        
    }
};
`,
      java: `class Solution {
    public int coinChange(int[] coins, int amount) {
        return -1;
    }
}
`,
    },
    functionName: 'coinChange',
    paramNames: ['coins', 'amount'],
    testCases: [
      { input: '[1,2,5], 11', expectedOutput: '3' },
      { input: '[2], 3', expectedOutput: '-1' },
      { input: '[1], 0', expectedOutput: '0' },
    ],
    editorial: {
      approach: 'Bottom-up Knapsack DP',
      intuition: 'Compute min coins for every value from 1 to amount.',
      timeComplexity: 'O(amount * len(coins))',
      spaceComplexity: 'O(amount)',
      pythonSolution: `class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        dp = [float('inf')] * (amount + 1)
        dp[0] = 0
        for a in range(1, amount + 1):
            for c in coins:
                if a - c >= 0:
                    dp[a] = min(dp[a], 1 + dp[a - c])
        return dp[amount] if dp[amount] != float('inf') else -1`,
      javascriptSolution: `var coinChange = function(coins, amount) {
    const dp = new Array(amount + 1).fill(Infinity);
    dp[0] = 0;
    for (let a = 1; a <= amount; a++) {
        for (const c of coins) {
            if (a - c >= 0) dp[a] = Math.min(dp[a], 1 + dp[a - c]);
        }
    }
    return dp[amount] === Infinity ? -1 : dp[amount];
};`,
      walkthrough: 'Bottom-up DP table of size amount + 1.',
    },
  },
  {
    id: 'lc-53',
    number: 53,
    slug: 'maximum-subarray',
    title: 'Maximum Subarray',
    difficulty: 'Medium',
    category: 'Greedy',
    topics: ['Array', 'Divide and Conquer', 'Dynamic Programming'],
    acceptanceRate: '50.8%',
    likes: 33800,
    dislikes: 1400,
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return *its sum*.`,
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' },
      { input: 'nums = [1]', expectedOutput: '1' },
      { input: 'nums = [5,4,-1,7,8]', expectedOutput: '23' },
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    hints: ['Kadane\'s algorithm.'],
    starterCodes: {
      python: `class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        pass
`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var maxSubArray = function(nums) {
    
};
`,
      typescript: `function maxSubArray(nums: number[]): number {
    
}
`,
      cpp: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        
    }
};
`,
      java: `class Solution {
    public int maxSubArray(int[] nums) {
        return 0;
    }
}
`,
    },
    functionName: 'maxSubArray',
    paramNames: ['nums'],
    testCases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6' },
      { input: '[1]', expectedOutput: '1' },
      { input: '[5,4,-1,7,8]', expectedOutput: '23' },
    ],
    editorial: {
      approach: "Kadane's Algorithm",
      intuition: 'Maintain running sum; if running sum falls below 0, reset to 0.',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      pythonSolution: `class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        cur_sum = 0
        max_sum = nums[0]
        for n in nums:
            if cur_sum < 0: cur_sum = 0
            cur_sum += n
            max_sum = max(max_sum, cur_sum)
        return max_sum`,
      javascriptSolution: `var maxSubArray = function(nums) {
    let maxSoFar = nums[0], currMax = nums[0];
    for (let i = 1; i < nums.length; i++) {
        currMax = Math.max(nums[i], currMax + nums[i]);
        maxSoFar = Math.max(maxSoFar, currMax);
    }
    return maxSoFar;
};`,
      walkthrough: 'Kadane single-pass dynamic accumulator.',
    },
  },
  {
    id: 'lc-200',
    number: 200,
    slug: 'number-of-islands',
    title: 'Number of Islands',
    difficulty: 'Medium',
    category: 'Graphs',
    topics: ['Array', 'Depth-First Search', 'Breadth-First Search', 'Union Find', 'Matrix'],
    acceptanceRate: '58.7%',
    likes: 22400,
    dislikes: 490,
    description: `Given an \`m x n\` 2D binary grid \`grid\` which represents a map of \`'1'\`s (land) and \`'0'\`s (water), return *the number of islands*.

An **island** is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.`,
    examples: [
      { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', expectedOutput: '1' },
      { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', expectedOutput: '3' },
    ],
    constraints: ['m == grid.length', 'n == grid[i].length', '1 <= m, n <= 300', 'grid[i][j] is \'0\' or \'1\'.'],
    hints: ['Iterate through each cell; when hitting \'1\', increment islands count and flood-fill (sink) it with DFS/BFS.'],
    starterCodes: {
      python: `class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        pass
`,
      javascript: `/**
 * @param {character[][]} grid
 * @return {number}
 */
var numIslands = function(grid) {
    
};
`,
      typescript: `function numIslands(grid: string[][]): number {
    
}
`,
      cpp: `class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        
    }
};
`,
      java: `class Solution {
    public int numIslands(char[][] grid) {
        return 0;
    }
}
`,
    },
    functionName: 'numIslands',
    paramNames: ['grid'],
    testCases: [
      { input: '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', expectedOutput: '1' },
      { input: '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', expectedOutput: '3' },
    ],
    editorial: {
      approach: 'DFS / BFS Flood Fill',
      intuition: 'Whenever we see an unvisited land cell \'1\', start a DFS flood fill to mark all connected land as \'0\' (or visited) and increment island count.',
      timeComplexity: 'O(m * n)',
      spaceComplexity: 'O(m * n)',
      pythonSolution: `class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        if not grid: return 0
        rows, cols = len(grid), len(grid[0])
        islands = 0
        def dfs(r, c):
            if r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] != '1': return
            grid[r][c] = '0'
            dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1)
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == '1':
                    islands += 1
                    dfs(r, c)
        return islands`,
      javascriptSolution: `var numIslands = function(grid) {
    if (!grid.length) return 0;
    let count = 0;
    const dfs = (r, c) => {
        if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] !== '1') return;
        grid[r][c] = '0';
        dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);
    };
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[0].length; c++) {
            if (grid[r][c] === '1') {
                count++;
                dfs(r, c);
            }
        }
    }
    return count;
};`,
      walkthrough: 'Traverse grid and sink islands via 4-directional DFS.',
    },
  },
];

const ALL_NC_RAW = rawNeetcodeAll as unknown as LeetCodeQuestion[];

// Map to ensure handcrafted questions take priority
const combinedMap = new Map<string, LeetCodeQuestion>();
const rawInfoMap = new Map<string, LeetCodeQuestion>();
for (const q of ALL_NC_RAW) {
  rawInfoMap.set(q.slug.toLowerCase(), q);
}

for (const q of HANDCRAFTED_NEETCODE_QUESTIONS) {
  const raw = rawInfoMap.get(q.slug.toLowerCase());
  combinedMap.set(q.slug.toLowerCase(), {
    ...q,
    description: (raw?.description && raw.description.length > 50) ? raw.description : q.description,
    starterCodes: {
      python: q.starterCodes.python,
      cpp: q.starterCodes.cpp,
      java: q.starterCodes.java,
    },
    editorial: {
      ...q.editorial,
      cppSolution: raw?.editorial?.cppSolution || q.starterCodes.cpp,
      javaSolution: raw?.editorial?.javaSolution || q.starterCodes.java,
    },
    core150: Boolean(raw?.neetcode150 ?? q.neetcode150 ?? (raw as any)?.core150 ?? q.core150),
    mastery250: Boolean(raw?.neetcode250 ?? q.neetcode250 ?? (raw as any)?.mastery250 ?? q.mastery250),
    neetcode150: Boolean(raw?.neetcode150 ?? q.neetcode150),
    neetcode250: Boolean(raw?.neetcode250 ?? q.neetcode250),
    blind75: Boolean(raw?.blind75 ?? q.blind75),
    ncLink: raw?.ncLink ?? q.ncLink,
  });
}
for (const q of ALL_NC_RAW) {
  const s = q.slug.toLowerCase();
  if (!combinedMap.has(s)) {
    combinedMap.set(s, {
      ...q,
      core150: Boolean(q.neetcode150 || (q as any).core150),
      mastery250: Boolean(q.neetcode250 || (q as any).mastery250),
      blind75: Boolean(q.blind75),
    });
  }
}

export const NEETCODE_ALL_QUESTIONS: LeetCodeQuestion[] = Array.from(combinedMap.values());
export const CURATED_ALL_QUESTIONS: LeetCodeQuestion[] = NEETCODE_ALL_QUESTIONS;
export const LIST_OF_QUESTIONS: LeetCodeQuestion[] = NEETCODE_ALL_QUESTIONS;
export const ROADMAP_CATEGORIES = NEETCODE_ROADMAP_CATEGORIES;


