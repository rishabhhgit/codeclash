import { TestCase } from './types';
import { EnrichedPackage } from './enrichment';

// =========================================================================
// ENRICHMENT PART 2: QUESTIONS 10 - 18
// - binary-search
// - reverse-linked-list
// - merge-two-sorted-lists
// - invert-binary-tree
// - maximum-depth-of-binary-tree
// - climbing-stairs
// - house-robber
// - coin-change
// - number-of-islands
// =========================================================================

export const ENRICHMENTS_PART_2: Record<string, EnrichedPackage> = {
  // 10. BINARY SEARCH
  'binary-search': {
    examples: [
      {
        input: 'nums = [-1,0,3,5,9,12], target = 9',
        expectedOutput: '4',
        explanation: '9 exists in nums and its index is 4.',
      },
      {
        input: 'nums = [-1,0,3,5,9,12], target = 2',
        expectedOutput: '-1',
        explanation: '2 does not exist in nums, so return -1.',
      },
      {
        input: 'nums = [5], target = 5',
        expectedOutput: '0',
        explanation: 'Single element array with target present at index 0.',
      },
      {
        input: 'nums = [2,5], target = 0',
        expectedOutput: '-1',
        explanation: 'Target is smaller than all elements in nums.',
      },
    ],
    testCases: [
      { input: '[-1,0,3,5,9,12], 9', expectedOutput: '4', explanation: 'Target present in upper half.' },
      { input: '[-1,0,3,5,9,12], 2', expectedOutput: '-1', explanation: 'Target absent in sorted range.' },
      { input: '[5], 5', expectedOutput: '0', explanation: 'Single element boundary match.' },
      { input: '[-10,-5,0,3,7], -10', expectedOutput: '0', explanation: 'Target at extreme left boundary.' },
    ],
    hiddenTestCases: generateBinarySearchHiddenCases(),
    editorial: {
      approach: 'Iterative Binary Search (L <= R Invariant)',
      intuition:
        'A linear scan checks elements one by one in O(n) time. Since `nums` is sorted in ascending order, we compare the target against the middle element `mid = l + (r - l) // 2`. If `nums[mid] == target`, we return `mid`. If `nums[mid] < target`, the target must reside strictly in the right subarray `[mid + 1, r]`. If `nums[mid] > target`, it must reside strictly in the left subarray `[l, mid - 1]`. Each comparison cuts the search space in half, achieving logarithmic O(log n) time.',
      walkthrough:
        '1. Initialize `l = 0` and `r = len(nums) - 1`.\n2. While `l <= r`:\n   - Compute `mid = l + (r - l) // 2` (prevents integer overflow).\n   - If `nums[mid] == target`, return `mid`.\n   - If `nums[mid] < target`, eliminate left half: `l = mid + 1`.\n   - Else, eliminate right half: `r = mid - 1`.\n3. If loop finishes without returning, the target does not exist; return `-1`.',
      timeComplexity: 'O(log n) - Search space is halved on each iteration.',
      spaceComplexity: 'O(1) - Constant auxiliary space with iterative implementation.',
      pythonSolution: `class Solution:
    def search(self, nums: List[int], target: int) -> int:
        l, r = 0, len(nums) - 1
        while l <= r:
            mid = l + (r - l) // 2
            if nums[mid] == target:
                return mid
            elif nums[mid] < target:
                l = mid + 1
            else:
                r = mid - 1
        return -1`,
      cppSolution: `#include <vector>
using namespace std;

class Solution {
public:
    int search(vector<int>& nums, int target) {
        int l = 0, r = nums.size() - 1;
        while (l <= r) {
            int mid = l + (r - l) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) l = mid + 1;
            else r = mid - 1;
        }
        return -1;
    }
};`,
      javaSolution: `class Solution {
    public int search(int[] nums, int target) {
        int l = 0, r = nums.length - 1;
        while (l <= r) {
            int mid = l + (r - l) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) l = mid + 1;
            else r = mid - 1;
        }
        return -1;
    }
}`,
    },
  },

  // 11. REVERSE LINKED LIST
  'reverse-linked-list': {
    examples: [
      {
        input: 'head = [1,2,3,4,5]',
        expectedOutput: '[5,4,3,2,1]',
        explanation: 'Pointers are reversed: 1 <- 2 <- 3 <- 4 <- 5.',
      },
      {
        input: 'head = [1,2]',
        expectedOutput: '[2,1]',
        explanation: 'Minimal two-node list reversed: 1 <- 2.',
      },
      {
        input: 'head = []',
        expectedOutput: '[]',
        explanation: 'Empty list reversed is an empty list.',
      },
      {
        input: 'head = [42]',
        expectedOutput: '[42]',
        explanation: 'Single-node list remains unchanged.',
      },
    ],
    testCases: [
      { input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]', explanation: 'Standard 5-element sequence.' },
      { input: '[1,2]', expectedOutput: '[2,1]', explanation: 'Minimal 2-element list.' },
      { input: '[]', expectedOutput: '[]', explanation: 'Boundary case: empty list.' },
      { input: '[9,8,7,6]', expectedOutput: '[6,7,8,9]', explanation: 'Strictly decreasing list inverted.' },
    ],
    hiddenTestCases: generateReverseLinkedListHiddenCases(),
    editorial: {
      approach: 'Iterative Three-Pointer Node Reversal (Prev, Curr, Next)',
      intuition:
        'To reverse a singly linked list in-place in O(n) time and O(1) space, we maintain three pointers: `prev`, `curr`, and `nxt`. Before overwriting `curr.next`, we save the reference to the upcoming node `nxt = curr.next`. We then reverse the link by pointing `curr.next = prev`. Finally, we slide our pointers forward: `prev = curr` and `curr = nxt`. When `curr` reaches null, `prev` sits at the new head of the reversed list.',
      walkthrough:
        '1. Initialize `prev = null` and `curr = head`.\n2. While `curr` is not null:\n   - Save next node: `nxt = curr.next`.\n   - Reverse pointer: `curr.next = prev`.\n   - Advance `prev`: `prev = curr`.\n   - Advance `curr`: `curr = nxt`.\n3. Return `prev` as the new head of the reversed linked list.',
      timeComplexity: 'O(n) - Single linear pass visiting each node exactly once.',
      spaceComplexity: 'O(1) - Constant auxiliary memory; pointers mutated in-place.',
      pythonSolution: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next

class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        prev = None
        curr = head
        while curr:
            nxt = curr.next
            curr.next = prev
            prev = curr
            curr = nxt
        return prev`,
      cppSolution: `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* curr = head;
        while (curr != nullptr) {
            ListNode* nxt = curr->next;
            curr->next = prev;
            prev = curr;
            curr = nxt;
        }
        return prev;
    }
};`,
      javaSolution: `/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */
class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;
        while (curr != null) {
            ListNode nxt = curr.next;
            curr.next = prev;
            prev = curr;
            curr = nxt;
        }
        return prev;
    }
}`,
    },
  },

  // 12. MERGE TWO SORTED LISTS
  'merge-two-sorted-lists': {
    examples: [
      {
        input: 'list1 = [1,2,4], list2 = [1,3,4]',
        expectedOutput: '[1,1,2,3,4,4]',
        explanation: 'Lists are spliced together in non-decreasing order: 1 -> 1 -> 2 -> 3 -> 4 -> 4.',
      },
      {
        input: 'list1 = [], list2 = []',
        expectedOutput: '[]',
        explanation: 'Both lists are empty, resulting in an empty merged list.',
      },
      {
        input: 'list1 = [], list2 = [0]',
        expectedOutput: '[0]',
        explanation: 'Merging an empty list with [0] yields [0].',
      },
      {
        input: 'list1 = [-5,1,3], list2 = [-2,0,4]',
        expectedOutput: '[-5,-2,0,1,3,4]',
        explanation: 'Handles negative values and alternating list elements.',
      },
    ],
    testCases: [
      { input: '[1,2,4], [1,3,4]', expectedOutput: '[1,1,2,3,4,4]', explanation: 'Standard interleaved sorted lists.' },
      { input: '[], []', expectedOutput: '[]', explanation: 'Both lists empty.' },
      { input: '[], [0]', expectedOutput: '[0]', explanation: 'First list empty.' },
      { input: '[1,5,9], [2,3,4]', expectedOutput: '[1,2,3,4,5,9]', explanation: 'Non-overlapping chunks.' },
    ],
    hiddenTestCases: generateMergeTwoSortedListsHiddenCases(),
    editorial: {
      approach: 'Iterative Two-Pointer Merge with Dummy Sentinel Node',
      intuition:
        'To merge two sorted linked lists without special edge cases for the head node, we allocate a dummy sentinel node `dummy`. We maintain a pointer `tail = dummy`. At each step, we compare `list1.val` and `list2.val`. Whichever node has the smaller value is appended to `tail.next`, and that list pointer advances. When one list is exhausted, we append the remaining non-null list directly in O(1) time. We return `dummy.next`.',
      walkthrough:
        '1. Create a dummy node `dummy = ListNode(0)` and `tail = dummy`.\n2. While `list1` and `list2` are both not null:\n   - If `list1.val <= list2.val`:\n     - `tail.next = list1`\n     - `list1 = list1.next`\n   - Else:\n     - `tail.next = list2`\n     - `list2 = list2.next`\n   - Advance `tail = tail.next`.\n3. Attach remaining nodes: `tail.next = list1 if list1 else list2`.\n4. Return `dummy.next`.',
      timeComplexity: 'O(n + m) - Each node from both lists is traversed at most once.',
      spaceComplexity: 'O(1) - In-place pointer manipulation with zero node reallocations.',
      pythonSolution: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next

class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        dummy = ListNode(0)
        tail = dummy
        while list1 and list2:
            if list1.val <= list2.val:
                tail.next = list1
                list1 = list1.next
            else:
                tail.next = list2
                list2 = list2.next
            tail = tail.next
        tail.next = list1 if list1 else list2
        return dummy.next`,
      cppSolution: `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {
        ListNode dummy(0);
        ListNode* tail = &dummy;
        while (list1 && list2) {
            if (list1->val <= list2->val) {
                tail->next = list1;
                list1 = list1->next;
            } else {
                tail->next = list2;
                list2 = list2->next;
            }
            tail = tail->next;
        }
        tail->next = list1 ? list1 : list2;
        return dummy.next;
    }
};`,
      javaSolution: `/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */
class Solution {
    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {
        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;
        while (list1 != null && list2 != null) {
            if (list1.val <= list2.val) {
                tail.next = list1;
                list1 = list1.next;
            } else {
                tail.next = list2;
                list2 = list2.next;
            }
            tail = tail.next;
        }
        tail.next = (list1 != null) ? list1 : list2;
        return dummy.next;
    }
}`,
    },
  },

  // 13. INVERT BINARY TREE
  'invert-binary-tree': {
    examples: [
      {
        input: 'root = [4,2,7,1,3,6,9]',
        expectedOutput: '[4,7,2,9,6,3,1]',
        explanation: 'Every node has its left and right children swapped recursively.',
      },
      {
        input: 'root = [2,1,3]',
        expectedOutput: '[2,3,1]',
        explanation: 'Children of 2 are swapped: left becomes 3, right becomes 1.',
      },
      {
        input: 'root = []',
        expectedOutput: '[]',
        explanation: 'Empty tree inversion is an empty tree.',
      },
      {
        input: 'root = [1,2]',
        expectedOutput: '[1,null,2]',
        explanation: 'Single left child moves to the right child position.',
      },
    ],
    testCases: [
      { input: '[4,2,7,1,3,6,9]', expectedOutput: '[4,7,2,9,6,3,1]', explanation: 'Full balanced 3-level tree.' },
      { input: '[2,1,3]', expectedOutput: '[2,3,1]', explanation: 'Minimal 2-level tree.' },
      { input: '[]', expectedOutput: '[]', explanation: 'Boundary case: empty tree.' },
      { input: '[1,null,2]', expectedOutput: '[1,2]', explanation: 'Right child only moves to left.' },
    ],
    hiddenTestCases: generateInvertBinaryTreeHiddenCases(),
    editorial: {
      approach: 'Recursive Depth-First Traversal (Postorder Child Swap)',
      intuition:
        'Inverting a binary tree requires that for every node in the tree, its left child pointer and right child pointer are exchanged. By applying a recursive divide-and-conquer strategy, we invert the left subtree, invert the right subtree, and swap `root.left` with `root.right`. The base case is reached when `root == null`, returning null immediately. This guarantees that every node is visited exactly once.',
      walkthrough:
        '1. Base case: If `root == null`, return `null`.\n2. Recursively invert left child: `left = invertTree(root.left)`.\n3. Recursively invert right child: `right = invertTree(root.right)`.\n4. Swap children: `root.left = right` and `root.right = left`.\n5. Return `root`.',
      timeComplexity: 'O(n) - Visits all n nodes in the tree exactly once.',
      spaceComplexity: 'O(h) - Auxiliary call stack space proportional to tree height h (O(log n) balanced, O(n) worst-case skewed).',
      pythonSolution: `# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right

class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        if not root:
            return None
        root.left, root.right = self.invertTree(root.right), self.invertTree(root.left)
        return root`,
      cppSolution: `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        if (!root) return nullptr;
        TreeNode* temp = root->left;
        root->left = invertTree(root->right);
        root->right = invertTree(temp);
        return root;
    }
};`,
      javaSolution: `/**
 * Definition for a binary tree node.
 * public class TreeNode {
 *     int val;
 *     TreeNode left;
 *     TreeNode right;
 *     TreeNode() {}
 *     TreeNode(int val) { this.val = val; }
 *     TreeNode(int val, TreeNode left, TreeNode right) {
 *         this.val = val;
 *         this.left = left;
 *         this.right = right;
 *     }
 * }
 */
class Solution {
    public TreeNode invertTree(TreeNode root) {
        if (root == null) return null;
        TreeNode temp = root.left;
        root.left = invertTree(root.right);
        root.right = invertTree(temp);
        return root;
    }
}`,
    },
  },

  // 14. MAXIMUM DEPTH OF BINARY TREE
  'maximum-depth-of-binary-tree': {
    examples: [
      {
        input: 'root = [3,9,20,null,null,15,7]',
        expectedOutput: '3',
        explanation: 'Path 3 -> 20 -> 15 has length 3, which is the maximum depth.',
      },
      {
        input: 'root = [1,null,2]',
        expectedOutput: '2',
        explanation: 'Path 1 -> 2 has length 2.',
      },
      {
        input: 'root = []',
        expectedOutput: '0',
        explanation: 'Empty tree has depth 0.',
      },
      {
        input: 'root = [0]',
        expectedOutput: '1',
        explanation: 'Single root node has depth 1.',
      },
    ],
    testCases: [
      { input: '[3,9,20,null,null,15,7]', expectedOutput: '3', explanation: 'Standard 3-level tree.' },
      { input: '[1,null,2]', expectedOutput: '2', explanation: 'Skewed right tree.' },
      { input: '[]', expectedOutput: '0', explanation: 'Boundary case: empty tree.' },
      { input: '[1,2,3,4,5]', expectedOutput: '3', explanation: 'Balanced tree with depth 3.' },
    ],
    hiddenTestCases: generateMaxDepthHiddenCases(),
    editorial: {
      approach: 'Recursive Divide & Conquer (Postorder DFS)',
      intuition:
        'The maximum depth of a binary tree rooted at `root` is defined as 1 plus the maximum depth between its left and right subtrees: `1 + max(maxDepth(root.left), maxDepth(root.right))`. If `root` is null, its depth is 0. This provides a natural, clean divide-and-conquer postorder DFS traversal that visits each node once.',
      walkthrough:
        '1. Base case: If `root == null`, return `0`.\n2. Recursively find depth of left subtree: `left_depth = maxDepth(root.left)`.\n3. Recursively find depth of right subtree: `right_depth = maxDepth(root.right)`.\n4. Combine: `return 1 + max(left_depth, right_depth)`.\n5. Handles all shapes (empty, balanced, left-skewed, right-skewed).',
      timeComplexity: 'O(n) - Every node in the tree is visited once.',
      spaceComplexity: 'O(h) - Call stack height h (O(log n) balanced, O(n) skewed).',
      pythonSolution: `class Solution:
    def maxDepth(self, root: Optional[TreeNode]) -> int:
        if not root:
            return 0
        return 1 + max(self.maxDepth(root.left), self.maxDepth(root.right))`,
      cppSolution: `class Solution {
public:
    int maxDepth(TreeNode* root) {
        if (!root) return 0;
        return 1 + max(maxDepth(root->left), maxDepth(root->right));
    }
};`,
      javaSolution: `class Solution {
    public int maxDepth(TreeNode root) {
        if (root == null) return 0;
        return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
    }
}`,
    },
  },

  // 15. CLIMBING STAIRS
  'climbing-stairs': {
    examples: [
      {
        input: 'n = 2',
        expectedOutput: '2',
        explanation: 'There are two ways to climb to the top: 1 step + 1 step, or 2 steps.',
      },
      {
        input: 'n = 3',
        expectedOutput: '3',
        explanation: 'Three ways: 1+1+1, 1+2, 2+1.',
      },
      {
        input: 'n = 1',
        expectedOutput: '1',
        explanation: 'Only one way: take 1 step.',
      },
      {
        input: 'n = 5',
        expectedOutput: '8',
        explanation: 'Fibonacci sequence value for n=5 is 8.',
      },
    ],
    testCases: [
      { input: '2', expectedOutput: '2', explanation: 'Basic 2 steps.' },
      { input: '3', expectedOutput: '3', explanation: 'Basic 3 steps.' },
      { input: '1', expectedOutput: '1', explanation: 'Boundary case n=1.' },
      { input: '4', expectedOutput: '5', explanation: 'Combinations sum to 5.' },
    ],
    hiddenTestCases: generateClimbingStairsHiddenCases(),
    editorial: {
      approach: 'Dynamic Programming (Space-Optimized Fibonacci)',
      intuition:
        'To reach step `n`, you must arrive either from step `n - 1` (by taking 1 step) or from step `n - 2` (by taking 2 steps). Therefore, the number of distinct ways to reach step `n` satisfies the recurrence relation: `dp[n] = dp[n - 1] + dp[n - 2]`. This is identical to the Fibonacci sequence with base cases `dp[1] = 1` and `dp[2] = 2`. Rather than allocating an array of size n, we maintain only two variables `prev1` and `prev2`, achieving O(n) time and O(1) space.',
      walkthrough:
        '1. If `n <= 2`, return `n`.\n2. Initialize `prev2 = 1` (ways for n=1) and `prev1 = 2` (ways for n=2).\n3. Loop `i` from `3` to `n`:\n   - `curr = prev1 + prev2`\n   - `prev2 = prev1`\n   - `prev1 = curr`\n4. Return `prev1`.',
      timeComplexity: 'O(n) - Single loop performing n - 2 additions.',
      spaceComplexity: 'O(1) - Constant auxiliary storage (two variables).',
      pythonSolution: `class Solution:
    def climbStairs(self, n: int) -> int:
        if n <= 2:
            return n
        prev2, prev1 = 1, 2
        for _ in range(3, n + 1):
            curr = prev1 + prev2
            prev2 = prev1
            prev1 = curr
        return prev1`,
      cppSolution: `class Solution {
public:
    int climbStairs(int n) {
        if (n <= 2) return n;
        int prev2 = 1, prev1 = 2;
        for (int i = 3; i <= n; i++) {
            int curr = prev1 + prev2;
            prev2 = prev1;
            prev1 = curr;
        }
        return prev1;
    }
};`,
      javaSolution: `class Solution {
    public int climbStairs(int n) {
        if (n <= 2) return n;
        int prev2 = 1, prev1 = 2;
        for (int i = 3; i <= n; i++) {
            int curr = prev1 + prev2;
            prev2 = prev1;
            prev1 = curr;
        }
        return prev1;
    }
}`,
    },
  },

  // 16. HOUSE ROBBER
  'house-robber': {
    examples: [
      {
        input: 'nums = [1,2,3,1]',
        expectedOutput: '4',
        explanation: 'Rob house 1 (money = 1) and then rob house 3 (money = 3). Total = 1 + 3 = 4.',
      },
      {
        input: 'nums = [2,7,9,3,1]',
        expectedOutput: '12',
        explanation: 'Rob house 1 (money = 2), house 3 (money = 9), house 5 (money = 1). Total = 2 + 9 + 1 = 12.',
      },
      {
        input: 'nums = [2,1,1,2]',
        expectedOutput: '4',
        explanation: 'Robbing index 0 (2) and index 3 (2) gives 4.',
      },
      {
        input: 'nums = [0]',
        expectedOutput: '0',
        explanation: 'Single house with no money yields 0.',
      },
    ],
    testCases: [
      { input: '[1,2,3,1]', expectedOutput: '4', explanation: 'Standard alternating selection.' },
      { input: '[2,7,9,3,1]', expectedOutput: '12', explanation: 'Optimal multi-hop robbery.' },
      { input: '[5]', expectedOutput: '5', explanation: 'Boundary case: single house.' },
      { input: '[4,1,2,7,5,3,1]', expectedOutput: '14', explanation: 'Non-trivial multi-choice array.' },
    ],
    hiddenTestCases: generateHouseRobberHiddenCases(),
    editorial: {
      approach: 'Dynamic Programming (Two-State Max Choice Invariant)',
      intuition:
        'Adjacent houses cannot be robbed on the same night. At each house `i`, a robber has two choices: 1) Rob house `i`: gain `nums[i]` plus the maximum money robbed up to house `i - 2`. 2) Skip house `i`: keep the maximum money robbed up to house `i - 1`. Thus the recurrence is `rob[i] = max(rob[i - 1], rob[i - 2] + nums[i])`. We can track this with two running variables `rob1` and `rob2` representing the max loot up to the previous two houses.',
      walkthrough:
        '1. Initialize `rob1 = 0` (max loot at `i - 2`) and `rob2 = 0` (max loot at `i - 1`).\n2. For each number `num` in `nums`:\n   - Compute `new_rob = max(rob2, rob1 + num)`.\n   - Update `rob1 = rob2`.\n   - Update `rob2 = new_rob`.\n3. Return `rob2`.',
      timeComplexity: 'O(n) - Single pass through the list of houses.',
      spaceComplexity: 'O(1) - Constant auxiliary memory.',
      pythonSolution: `class Solution:
    def rob(self, nums: List[int]) -> int:
        rob1, rob2 = 0, 0
        for num in nums:
            new_rob = max(rob2, rob1 + num)
            rob1 = rob2
            rob2 = new_rob
        return rob2`,
      cppSolution: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int rob(vector<int>& nums) {
        int rob1 = 0, rob2 = 0;
        for (int num : nums) {
            int newRob = max(rob2, rob1 + num);
            rob1 = rob2;
            rob2 = newRob;
        }
        return rob2;
    }
};`,
      javaSolution: `class Solution {
    public int rob(int[] nums) {
        int rob1 = 0, rob2 = 0;
        for (int num : nums) {
            int newRob = Math.max(rob2, rob1 + num);
            rob1 = rob2;
            rob2 = newRob;
        }
        return rob2;
    }
}`,
    },
  },

  // 17. COIN CHANGE
  'coin-change': {
    examples: [
      {
        input: 'coins = [1,2,5], amount = 11',
        expectedOutput: '3',
        explanation: '11 = 5 + 5 + 1 (3 coins).',
      },
      {
        input: 'coins = [2], amount = 3',
        expectedOutput: '-1',
        explanation: 'Amount 3 cannot be made with coins of denomination 2.',
      },
      {
        input: 'coins = [1], amount = 0',
        expectedOutput: '0',
        explanation: 'Amount 0 requires 0 coins.',
      },
      {
        input: 'coins = [1,3,4,5], amount = 7',
        expectedOutput: '2',
        explanation: '7 = 3 + 4 (2 coins, better than greedy 5 + 1 + 1).',
      },
    ],
    testCases: [
      { input: '[1,2,5], 11', expectedOutput: '3', explanation: 'Standard mixed denominations.' },
      { input: '[2], 3', expectedOutput: '-1', explanation: 'Unreachable amount.' },
      { input: '[1], 0', expectedOutput: '0', explanation: 'Boundary case amount 0.' },
      { input: '[186,419,83,408], 6249', expectedOutput: '20', explanation: 'Large amount requiring DP.' },
    ],
    hiddenTestCases: generateCoinChangeHiddenCases(),
    editorial: {
      approach: 'Bottom-Up Dynamic Programming (Unbounded Knapsack)',
      intuition:
        'A greedy approach (always choosing the largest coin) fails on problems like `coins = [1, 3, 4, 5], amount = 7`: greedy yields `5 + 1 + 1` (3 coins), whereas the optimal is `3 + 4` (2 coins). We define `dp[a]` as the minimum coins needed to make amount `a`. For every amount from 1 up to `amount`, we try every coin `c <= a`: `dp[a] = min(dp[a], 1 + dp[a - c])`. If `dp[amount]` remains untouched (`amount + 1`), the amount is unreachable, so return -1.',
      walkthrough:
        '1. Allocate array `dp` of size `amount + 1` filled with `amount + 1` (infinity placeholder).\n2. Set `dp[0] = 0` (0 coins make amount 0).\n3. For `a` from `1` to `amount`:\n   - For each coin `c` in `coins`:\n     - If `a - c >= 0`:\n       - `dp[a] = min(dp[a], 1 + dp[a - c])`\n4. Return `dp[amount]` if `dp[amount] != amount + 1` else `-1`.',
      timeComplexity: 'O(amount * n) where n is the number of coin denominations.',
      spaceComplexity: 'O(amount) - DP table of size amount + 1.',
      pythonSolution: `class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        dp = [amount + 1] * (amount + 1)
        dp[0] = 0
        for a in range(1, amount + 1):
            for c in coins:
                if a - c >= 0:
                    dp[a] = min(dp[a], 1 + dp[a - c])
        return dp[amount] if dp[amount] != amount + 1 else -1`,
      cppSolution: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        vector<int> dp(amount + 1, amount + 1);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++) {
            for (int c : coins) {
                if (a - c >= 0) {
                    dp[a] = min(dp[a], 1 + dp[a - c]);
                }
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
};`,
      javaSolution: `import java.util.*;

class Solution {
    public int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++) {
            for (int c : coins) {
                if (a - c >= 0) {
                    dp[a] = Math.min(dp[a], 1 + dp[a - c]);
                }
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
}`,
    },
  },

  // 18. NUMBER OF ISLANDS
  'number-of-islands': {
    examples: [
      {
        input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]',
        expectedOutput: '1',
        explanation: 'All land cells ("1") are connected horizontally and vertically into one large island.',
      },
      {
        input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]',
        expectedOutput: '3',
        explanation: 'Three separate disconnected islands exist: top-left (2x2), center (1x1), bottom-right (1x2).',
      },
      {
        input: 'grid = [["0"]]',
        expectedOutput: '0',
        explanation: 'Single water cell contains 0 islands.',
      },
      {
        input: 'grid = [["1"]]',
        expectedOutput: '1',
        explanation: 'Single land cell forms 1 island.',
      },
    ],
    testCases: [
      {
        input: '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]',
        expectedOutput: '1',
        explanation: 'Single large connected island.',
      },
      {
        input: '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]',
        expectedOutput: '3',
        explanation: 'Three distinct connected components.',
      },
      { input: '[["0"]]', expectedOutput: '0', explanation: 'Boundary: all water.' },
      { input: '[["1","0","1"],["0","1","0"],["1","0","1"]]', expectedOutput: '5', explanation: 'Diagonal non-connected land cells.' },
    ],
    hiddenTestCases: generateNumberOfIslandsHiddenCases(),
    editorial: {
      approach: 'Connected Components via Depth-First Search / Breadth-First Search',
      intuition:
        'An island is formed by horizontally or vertically adjacent land cells ("1"). We iterate over each cell `(r, c)` of the grid. Whenever we encounter a "1", we increment our island count and trigger a traversal (DFS or BFS) starting from `(r, c)`. The traversal visits all 4-directionally adjacent land cells and "sinks" them by flipping them to "0" (or marking them visited) so they are not recounted. Each connected component corresponds to exactly one island.',
      walkthrough:
        '1. If grid is empty, return 0. Let `rows = len(grid)`, `cols = len(grid[0])`, and `islands = 0`.\n2. Iterate `r` from 0 to `rows - 1`, and `c` from 0 to `cols - 1`:\n   - If `grid[r][c] == "1"`:\n     - Increment `islands += 1`.\n     - Call `dfs(r, c)`:\n       - If `(r, c)` is out of bounds or `grid[r][c] != "1"`, return.\n       - Set `grid[r][c] = "0"` (sink visited land).\n       - Recursively call DFS on 4 neighbors: `(r+1, c)`, `(r-1, c)`, `(r, c+1)`, `(r, c-1)`.\n3. Return `islands`.',
      timeComplexity: 'O(m * n) where m is row count and n is column count (each cell is visited at most once).',
      spaceComplexity: 'O(m * n) worst-case recursion call stack in a grid entirely made of land.',
      pythonSolution: `class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        if not grid:
            return 0
        rows, cols = len(grid), len(grid[0])
        islands = 0

        def dfs(r, c):
            if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] != '1':
                return
            grid[r][c] = '0'
            dfs(r + 1, c)
            dfs(r - 1, c)
            dfs(r, c + 1)
            dfs(r, c - 1)

        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == '1':
                    islands += 1
                    dfs(r, c)
        return islands`,
      cppSolution: `#include <vector>
using namespace std;

class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        if (grid.empty()) return 0;
        int rows = grid.size();
        int cols = grid[0].size();
        int islands = 0;

        auto dfs = [&](auto& self, int r, int c) -> void {
            if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] != '1') return;
            grid[r][c] = '0';
            self(self, r + 1, c);
            self(self, r - 1, c);
            self(self, r, c + 1);
            self(self, r, c - 1);
        };

        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == '1') {
                    islands++;
                    dfs(dfs, r, c);
                }
            }
        }
        return islands;
    }
};`,
      javaSolution: `class Solution {
    public int numIslands(char[][] grid) {
        if (grid == null || grid.length == 0) return 0;
        int rows = grid.length;
        int cols = grid[0].length;
        int islands = 0;

        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == '1') {
                    islands++;
                    dfs(grid, r, c, rows, cols);
                }
            }
        }
        return islands;
    }

    private void dfs(char[][] grid, int r, int c, int rows, int cols) {
        if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] != '1') return;
        grid[r][c] = '0';
        dfs(grid, r + 1, c, rows, cols);
        dfs(grid, r - 1, c, rows, cols);
        dfs(grid, r, c + 1, rows, cols);
        dfs(grid, r, c - 1, rows, cols);
    }
}`,
    },
  },
};

// ==========================================
// HIDDEN TEST CASE BUILDERS (PART 2)
// ==========================================

function generateBinarySearchHiddenCases(): TestCase[] {
  const cases: TestCase[] = [];
  cases.push({ input: '[-10], -10', expectedOutput: '0' });
  cases.push({ input: '[-10], 10', expectedOutput: '-1' });
  cases.push({ input: '[1, 2], 1', expectedOutput: '0' });
  cases.push({ input: '[1, 2], 2', expectedOutput: '1' });
  cases.push({ input: '[1, 2], 3', expectedOutput: '-1' });

  for (let len = 3; len <= 45; len++) {
    const arr = Array.from({ length: len }, (_, i) => i * 3);
    const targetIdx = len % 3 === 0 ? 0 : Math.floor(len / 2);
    cases.push({
      input: `[${arr.join(',')}], ${arr[targetIdx]}`,
      expectedOutput: String(targetIdx),
    });
    cases.push({
      input: `[${arr.join(',')}], ${arr[targetIdx] + 1}`,
      expectedOutput: '-1',
    });
  }

  for (const size of [1000, 5000, 10000]) {
    cases.push({
      input: `[STRESS_TEST N=${size}] [1...${size}], ${size}`,
      expectedOutput: String(size - 1),
    });
  }

  return cases;
}

function generateReverseLinkedListHiddenCases(): TestCase[] {
  const cases: TestCase[] = [];
  cases.push({ input: '[]', expectedOutput: '[]' });
  cases.push({ input: '[1]', expectedOutput: '[1]' });
  cases.push({ input: '[1, 2]', expectedOutput: '[2,1]' });
  cases.push({ input: '[0, 0, 0]', expectedOutput: '[0,0,0]' });

  for (let len = 1; len <= 65; len++) {
    const arr = Array.from({ length: len }, (_, i) => i * 2 - 10);
    const reversed = [...arr].reverse();
    cases.push({
      input: `[${arr.join(',')}]`,
      expectedOutput: `[${reversed.join(',')}]`,
    });
  }

  for (const size of [1000, 5000]) {
    cases.push({
      input: `[STRESS_TEST N=${size}] [1...${size}]`,
      expectedOutput: `[${size}...1]`,
    });
  }

  return cases;
}

function generateMergeTwoSortedListsHiddenCases(): TestCase[] {
  const cases: TestCase[] = [];
  cases.push({ input: '[], []', expectedOutput: '[]' });
  cases.push({ input: '[1], []', expectedOutput: '[1]' });
  cases.push({ input: '[], [2]', expectedOutput: '[2]' });
  cases.push({ input: '[1], [2]', expectedOutput: '[1,2]' });

  for (let len = 2; len <= 45; len++) {
    const a = Array.from({ length: len }, (_, i) => i * 3);
    const b = Array.from({ length: len }, (_, i) => i * 2 + 1);
    const merged = [...a, ...b].sort((x, y) => x - y);
    cases.push({
      input: `[${a.join(',')}], [${b.join(',')}]`,
      expectedOutput: `[${merged.join(',')}]`,
    });
  }

  for (const size of [1000, 5000]) {
    cases.push({
      input: `[STRESS_TEST N=${size}] [1...${size}], [1...${size}]`,
      expectedOutput: `[1...2N]`,
    });
  }

  return cases;
}

function generateInvertBinaryTreeHiddenCases(): TestCase[] {
  const cases: TestCase[] = [];
  cases.push({ input: '[]', expectedOutput: '[]' });
  cases.push({ input: '[1]', expectedOutput: '[1]' });
  cases.push({ input: '[1,2]', expectedOutput: '[1,null,2]' });
  cases.push({ input: '[1,null,2]', expectedOutput: '[1,2]' });
  cases.push({ input: '[1,2,3]', expectedOutput: '[1,3,2]' });

  for (let i = 1; i <= 45; i++) {
    const root = i;
    const left = i * 2;
    const right = i * 2 + 1;
    cases.push({
      input: `[${root},${left},${right}]`,
      expectedOutput: `[${root},${right},${left}]`,
    });
  }

  for (const size of [500, 1000]) {
    cases.push({
      input: `[STRESS_TEST N=${size}] [1...${size}]`,
      expectedOutput: `[${size}...1]`,
    });
  }

  return cases;
}

function generateMaxDepthHiddenCases(): TestCase[] {
  const cases: TestCase[] = [];
  cases.push({ input: '[]', expectedOutput: '0' });
  cases.push({ input: '[1]', expectedOutput: '1' });
  cases.push({ input: '[1,2]', expectedOutput: '2' });
  cases.push({ input: '[1,null,2]', expectedOutput: '2' });
  cases.push({ input: '[1,2,3,4,5,null,null]', expectedOutput: '3' });

  for (let depth = 2; depth <= 45; depth++) {
    // Generate linear skew of given depth
    const nodes: (number | null)[] = [];
    for (let k = 1; k <= depth; k++) {
      nodes.push(k);
      if (k < depth) nodes.push(null);
    }
    cases.push({
      input: `[${nodes.map((v) => (v === null ? 'null' : v)).join(',')}]`,
      expectedOutput: String(Math.min(depth, 10)),
    });
  }

  for (const size of [500, 1000]) {
    cases.push({
      input: `[STRESS_TEST N=${size}]`,
      expectedOutput: '10',
    });
  }

  return cases;
}

function generateClimbingStairsHiddenCases(): TestCase[] {
  const cases: TestCase[] = [];
  // Reference DP for first 55
  const fib = [0, 1, 2];
  for (let i = 3; i <= 55; i++) {
    fib[i] = fib[i - 1] + fib[i - 2];
  }

  for (let n = 1; n <= 55; n++) {
    cases.push({
      input: String(n),
      expectedOutput: String(fib[n]),
    });
  }

  for (const size of [30, 35, 40, 45]) {
    cases.push({
      input: `[STRESS_TEST N=${size}] ${size}`,
      expectedOutput: String(fib[size]),
    });
  }

  return cases;
}

function generateHouseRobberHiddenCases(): TestCase[] {
  const cases: TestCase[] = [];
  cases.push({ input: '[0]', expectedOutput: '0' });
  cases.push({ input: '[1]', expectedOutput: '1' });
  cases.push({ input: '[1,2]', expectedOutput: '2' });
  cases.push({ input: '[2,1]', expectedOutput: '2' });

  for (let len = 1; len <= 65; len++) {
    const arr = Array.from({ length: len }, (_, i) => ((i * 7) % 20) + 1);
    let rob1 = 0, rob2 = 0;
    for (const x of arr) {
      const nRob = Math.max(rob2, rob1 + x);
      rob1 = rob2;
      rob2 = nRob;
    }
    cases.push({
      input: `[${arr.join(',')}]`,
      expectedOutput: String(rob2),
    });
  }

  for (const size of [1000, 5000]) {
    cases.push({
      input: `[STRESS_TEST N=${size} uniform 1s] [1...${size}]`,
      expectedOutput: String(Math.ceil(size / 2)),
    });
  }

  return cases;
}

function generateCoinChangeHiddenCases(): TestCase[] {
  const cases: TestCase[] = [];
  cases.push({ input: '[1], 0', expectedOutput: '0' });
  cases.push({ input: '[1], 1', expectedOutput: '1' });
  cases.push({ input: '[1], 10', expectedOutput: '10' });
  cases.push({ input: '[2], 3', expectedOutput: '-1' });
  cases.push({ input: '[2, 5], 11', expectedOutput: '4' }); // 5 + 2 + 2 + 2

  for (let amt = 5; amt <= 50; amt++) {
    const coins = [1, 2, 5];
    const dp = new Array(amt + 1).fill(amt + 1);
    dp[0] = 0;
    for (let a = 1; a <= amt; a++) {
      for (const c of coins) {
        if (a - c >= 0) dp[a] = Math.min(dp[a], 1 + dp[a - c]);
      }
    }
    cases.push({
      input: `[${coins.join(',')}], ${amt}`,
      expectedOutput: String(dp[amt]),
    });
  }

  for (const amt of [500, 1000, 2500]) {
    cases.push({
      input: `[STRESS_TEST N=${amt}] [1,2,5], ${amt}`,
      expectedOutput: String(Math.floor(amt / 5)),
    });
  }

  return cases;
}

function generateNumberOfIslandsHiddenCases(): TestCase[] {
  const cases: TestCase[] = [];
  cases.push({ input: '[["0"]]', expectedOutput: '0' });
  cases.push({ input: '[["1"]]', expectedOutput: '1' });
  cases.push({ input: '[["1","0"],["0","1"]]', expectedOutput: '2' });
  cases.push({ input: '[["1","1"],["1","1"]]', expectedOutput: '1' });
  cases.push({ input: '[["1","0","1"],["1","0","1"]]', expectedOutput: '2' });

  // 45 diverse grid cases
  for (let i = 1; i <= 45; i++) {
    const rCount = 3 + (i % 4);
    const cCount = 3 + (i % 5);
    const grid: string[][] = [];
    for (let r = 0; r < rCount; r++) {
      const row: string[] = [];
      for (let c = 0; c < cCount; c++) {
        row.push((r + c + i) % 2 === 0 ? '1' : '0');
      }
      grid.push(row);
    }

    // Reference DFS to count islands
    const copy = grid.map((row) => [...row]);
    let islands = 0;
    const dfs = (r: number, c: number) => {
      if (r < 0 || r >= rCount || c < 0 || c >= cCount || copy[r][c] !== '1') return;
      copy[r][c] = '0';
      dfs(r + 1, c);
      dfs(r - 1, c);
      dfs(r, c + 1);
      dfs(r, c - 1);
    };
    for (let r = 0; r < rCount; r++) {
      for (let c = 0; c < cCount; c++) {
        if (copy[r][c] === '1') {
          islands++;
          dfs(r, c);
        }
      }
    }

    cases.push({
      input: JSON.stringify(grid),
      expectedOutput: String(islands),
    });
  }

  for (const size of [500, 1000]) {
    cases.push({
      input: `[STRESS_TEST N=${size} all water] [0...0]`,
      expectedOutput: '0',
    });
  }

  return cases;
}
