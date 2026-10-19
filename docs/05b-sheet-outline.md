# Sheet outline (generated from data/sheet.seed.json)

Tags: K = Kunal, S = Striver, + = added. `expanded` = subtopics written by the assistant from standard knowledge; verify.

## Phase 0: Programming and Java foundations

Language, flow of a program, OOP and the Java toolbox you will use in every later phase.

### Git and GitHub [K] (expanded)

- Version control: why and how it works [K]
- Install and configure Git [K]
- init, clone, add, commit [K]
- Remotes: push and pull [K]
- Branching and merging [K]
- Fork and pull request [K]
- Resolving merge conflicts [K]
- .gitignore and good commit messages [K]

### Introduction to programming [K][S]
Striver section: Beginner Problems

- Types of languages: compiled vs interpreted [K][S]
- Memory management: stack, heap, garbage collection [K][S]
- How to think like a programmer [S]
- Dry runs [S]
- Edge cases [S]
- Debugging [S]

### Flowcharts and pseudocode [K][S]

- Flowchart symbols and flow of a program [K][S]
- Pseudocode conventions [K][S]
- Turn a problem statement into pseudocode [+]

### Java basics [K]

- How Java works: JDK, JRE, JVM, bytecode [K]
- Setup and first program [K]
- Input and output [K]
- Conditionals: if / else [K]
- Loops: for, while, do-while [K]
- Switch statements (incl. nested) [K]
- Data types and type casting [K]
- Coding best practices [K]

### Functions [K]

- Functions: introduction [K]
- Scoping [K]
- Shadowing [K]
- Varargs [K]
- Overloading [K]
- Pass by value in Java (primitives vs references) [+]

### Object-oriented programming [K]
Note: The roadmap line lists 18 OOP items. The 5 '+' ones were added to reach the 23 the earlier Phase 0 sheet claimed. Verify against Kunal's syllabus.

- Classes and objects [K]
- this keyword [K]
- Inheritance [K]
- Polymorphism [K]
- Abstraction [K]
- Encapsulation [K]
- Interfaces [K]
- Abstract classes [K]
- static [K]
- Packages [K]
- Access control [K]
- Generics [K]
- Exceptions [K]
- Enums [K]
- Lambdas [K]
- Singleton class [K]
- Object cloning [K]
- final, finalize, finally [K]
- Constructors and constructor chaining [+]
- Object class: equals, hashCode, toString [+]
- Inner and anonymous classes [+]
- Wrapper classes and autoboxing [+]
- Default and static methods in interfaces [+]

### Java Collections Framework [K][S]
Striver section: Beginner Problems

- ArrayList [K][S]
- Vector [K][S]
- Comparable and Comparator [K][S]
- LinkedList, Stack, Queue, Deque basics [+]
- HashMap and HashSet basics [+]
- Arrays and Collections utility classes [+]

### Pattern questions [K][S]
Striver section: Beginner Problems
Note: 22 patterns per the roadmap. Pattern names are from memory and should be checked against Striver's pattern pages.

- Pattern 1: Square of stars [K][S]
- Pattern 2: Right-angled triangle [K][S]
- Pattern 3: Right-angled number triangle [K][S]
- Pattern 4: Right-angled number pyramid [K][S]
- Pattern 5: Inverted right pyramid [K][S]
- Pattern 6: Inverted numbered right pyramid [K][S]
- Pattern 7: Star pyramid [K][S]
- Pattern 8: Inverted star pyramid [K][S]
- Pattern 9: Diamond [K][S]
- Pattern 10: Half diamond [K][S]
- Pattern 11: Binary number triangle [K][S]
- Pattern 12: Number crown [K][S]
- Pattern 13: Increasing number triangle [K][S]
- Pattern 14: Increasing letter triangle [K][S]
- Pattern 15: Reverse letter triangle [K][S]
- Pattern 16: Alpha-ramp [K][S]
- Pattern 17: Alpha-hill [K][S]
- Pattern 18: Alpha-triangle [K][S]
- Pattern 19: Symmetric void [K][S]
- Pattern 20: Symmetric butterfly [K][S]
- Pattern 21: Hollow rectangle [K][S]
- Pattern 22: The number pattern [K][S]

### File handling [K] (expanded)

- Read and write text files [K]
- Java I/O streams [K]
- Scanner vs BufferedReader [K]
- try-with-resources [K]

## Phase 1: Complexity and math

How to measure an algorithm, plus the number theory and bit tricks used everywhere.

### Time and space complexity [K][S]
Striver section: Beginner Problems

- Big-O, Big-Omega, Big-Theta [K][S]
- little-o [K][S]
- Best, average and worst case [K][S]
- Recurrence relations: linear [K][S]
- Recurrence relations: divide and conquer [K][S]
- Space complexity and auxiliary space [K][S]
- Comparing cases [K][S]
- Analysing loops and recursive calls (practice) [+]

### NP-completeness (intro) [K] (expanded)

- P vs NP [K]
- NP-hard [K]
- NP-complete and classic examples [K]

### Basic math [S]
Striver section: Beginner Problems

- Count digits [S]
- Reverse a number [S]
- Palindrome number [S]
- Armstrong number [S]
- Perfect number [S]
- Factorial [S]
- Print all divisors [S]
- Check prime [S]
- Practice (candidates): Reverse Integer; Palindrome Number

### Primes and square roots [K][S]
Striver section: Maths

- Primality test up to sqrt(n) [K][S]
- Sieve of Eratosthenes [K][S]
- Prime factorisation [+]
- Newton's square root method [K][S]
- Practice (candidates): Count Primes; Sqrt(x)

### GCD and LCM [K][S]
Striver section: Maths

- Euclidean algorithm [K][S]
- LCM from GCD [K][S]
- GCD of an array [+]
- Practice (candidates): Greatest Common Divisor of Strings

### Modulo and number theory basics [K]

- Modulo properties [K]
- Modular arithmetic for large results [K]
- BigInteger [K]
- BigDecimal [K]
- Practice (candidates): Pow(x, n)

### Bit manipulation [K][S]
Striver section: Bit Manipulation

- Bitwise operators [K][S]
- Range of numbers and two's complement [K][S]
- Check, set, clear, toggle the i-th bit [K][S]
- Power of two [K][S]
- Count set bits [K][S]
- XOR tricks (swap, single number) [K][S]
- Common bit tricks [K][S]
- Practice (candidates): Single Number; Number of 1 Bits; Power of Two; Divide Two Integers; Counting Bits; Subsets (bitmask)

## Phase 2: Core structures and techniques

The bread-and-butter toolkit: arrays, strings, hashing, search, sort, recursion, greedy.

### Arrays [K][S]
Striver section: Arrays

- Array basics and logic building [K][S]
- Largest, second largest, check sorted [K][S]
- Remove duplicates, move zeros [K][S]
- Rotation [K][S]
- FAQs: medium [K][S]
- FAQs: hard [K][S]
- Kadane's algorithm [K][S]
- Prefix sum [K][S]
- 2D arrays and matrices [K][S]
- Dutch national flag (sort 0/1/2) [+]
- Two-sum and its variants [+]
- Practice (candidates): Two Sum; Maximum Subarray; Best Time to Buy and Sell Stock; Rotate Array; Move Zeroes; Sort Colors; Majority Element; Next Permutation; Set Matrix Zeroes; Rotate Image; Spiral Matrix; Merge Intervals; Subarray Sum Equals K; 3Sum; Pascal's Triangle

### Strings [K][S]
Striver section: Strings (Basic and Medium)

- How strings work (immutability, string pool) [K][S]
- StringBuilder and StringBuffer [K][S]
- Basic problems [K][S]
- Medium problems [K][S]
- Practice (candidates): Valid Palindrome; Reverse Words in a String; Longest Common Prefix; Valid Anagram; Roman to Integer; String to Integer (atoi)

### Hashing [K][S]
Striver section: Hashing

- Basic hashing and frequency counting [K][S]
- Frequency maps [K][S]
- HashMap internals [K][S]
- Practice (candidates): Group Anagrams; Contains Duplicate; Longest Consecutive Sequence; Top K Frequent Elements

### Searching and binary search [K][S]
Striver section: Binary Search

- Linear search [K][S]
- Binary search [K][S]
- Modified binary search [K][S]
- Binary search on 2D arrays [K][S]
- Binary search on the answer [K][S]
- Practice (candidates): Binary Search; Search in Rotated Sorted Array; Find Peak Element; Koko Eating Bananas; Median of Two Sorted Arrays; Search a 2D Matrix

### Sorting [K][S]
Striver section: Sorting

- Selection sort [K][S]
- Bubble sort [K][S]
- Insertion sort [K][S]
- Merge sort [K][S]
- Quick sort [K][S]
- Cyclic sort [K][S]
- Counting sort [K][S]
- Radix sort [K][S]
- Heap sort [K]
- Practice (candidates): Sort an Array; Find the Duplicate Number; Missing Number; Kth Largest Element

### Recursion [K][S]
Striver section: Recursion

- Call stack [K][S]
- Tree of calls [K][S]
- Tail recursion [K][S]
- Subsets and subsequences [K][S]
- String problems [K][S]
- Array problems [K][S]
- Pattern problems [K][S]
- Practice (candidates): Subsets; Combination Sum; Permutations; Generate Parentheses

### Backtracking [K][S]
Striver section: Recursion
Note: Striver files backtracking inside the Recursion section.

- N-Queens [K][S]
- N-Knights [K][S]
- Sudoku solver [K][S]
- Maze problems [K][S]
- Practice (candidates): N-Queens; Sudoku Solver; Word Search; Rat in a Maze

### Two pointers and sliding window [K][S]
Striver section: Sliding Window / 2 Pointer

- Two pointers [K][S]
- Fixed-size sliding window [K][S]
- Variable-size sliding window [K][S]
- Practice (candidates): Longest Substring Without Repeating Characters; Container With Most Water; Minimum Window Substring; Max Consecutive Ones III

### Greedy algorithms [K][S]
Striver section: Greedy Algorithms

- Greedy choice and proof sketches [K][S]
- Scheduling and intervals [K][S]
- Classic greedy problems [K][S]
- Practice (candidates): Assign Cookies; Jump Game; Non-overlapping Intervals; Gas Station; Activity Selection

### Divide and conquer [+] (expanded)

- Divide-and-conquer pattern [+]
- Merge-sort style problems [+]
- Master theorem in practice [+]
- Practice (candidates): Count of Smaller Numbers After Self; Maximum Subarray (D&C version)

## Phase 3: Linked structures and trees

Pointer-based structures, then trees, heaps, tries and range-query structures.

### Linked list [K][S]
Striver section: Linked-List

- Singly linked list [K][S]
- Doubly linked list [K][S]
- Circular linked list [K][S]
- Fast and slow pointers [K][S]
- Cycle detection [K][S]
- Reversal [K][S]
- Recursion on linked lists [K][S]
- Practice (candidates): Reverse Linked List; Linked List Cycle; Middle of the Linked List; Merge Two Sorted Lists; Remove Nth Node From End; Palindrome Linked List; LRU Cache; Copy List with Random Pointer

### Stacks [K][S]
Striver section: Stack / Queues

- Stack: efficient push and pop [K][S]
- Monotonic stack [K][S]
- Practice (candidates): Valid Parentheses; Min Stack; Next Greater Element; Largest Rectangle in Histogram; Daily Temperatures

### Queues [K][S]
Striver section: Stack / Queues

- Queue using stacks and the reverse [K][S]
- Circular queue [K][S]
- Deque [K][S]
- Monotonic deque [K][S]
- Practice (candidates): Implement Queue using Stacks; Sliding Window Maximum; Design Circular Queue

### Binary trees [K][S]
Striver section: Binary Trees

- Traversals: inorder, preorder, postorder [K][S]
- BFS (level order) [K][S]
- DFS [K][S]
- Interview questions [K][S]
- Practice (candidates): Maximum Depth of Binary Tree; Diameter of Binary Tree; Lowest Common Ancestor; Binary Tree Level Order Traversal; Serialize and Deserialize Binary Tree

### Binary search trees [K][S]
Striver section: Binary Search Trees

- BST basics: search, insert, delete [K][S]
- BST interview problems [K][S]
- Practice (candidates): Validate Binary Search Tree; Kth Smallest Element in a BST; Lowest Common Ancestor of a BST

### AVL trees [K] (expanded)

- Balance factor [K]
- Rotations [K]

### Heaps and priority queue [K][S]
Striver section: Heaps

- Priority queue [K][S]
- Heap sort [K][S]
- Two heaps [K][S]
- K-way merge [K][S]
- Top-K problems [K][S]
- Interval problems [K][S]
- Practice (candidates): Kth Largest Element in an Array; Merge k Sorted Lists; Find Median from Data Stream; Top K Frequent Elements; Task Scheduler

### Tries [K][S]
Striver section: Tries

- Trie basics [K][S]
- Insert, search, prefix search [K][S]
- Trie problems [K][S]
- Practice (candidates): Implement Trie; Word Search II; Maximum XOR of Two Numbers in an Array

### Segment tree and Fenwick tree (BIT) [K] (expanded)

- Segment tree: build and query [K]
- Segment tree: updates and lazy propagation [K]
- Fenwick tree (BIT) [K]

### Disjoint Set Union [+] (expanded)
Striver section: Graphs

- Union by rank and path compression [+]
- DSU applications [+]
- Practice (candidates): Number of Provinces; Redundant Connection

## Phase 4: Graphs and dynamic programming

The two big interview topics: graph traversal/shortest paths, and DP.

### Graphs [K][S]
Striver section: Graphs

- Representation: adjacency list and matrix [K][S]
- BFS [K][S]
- DFS [K][S]
- Connected components [K][S]
- Topological sort [K][S]
- Dijkstra [K][S]
- Bellman-Ford [K][S]
- A* search [K]
- MST: Prim [K][S]
- MST: Kruskal [K][S]
- Floyd-Warshall [S]
- Cycle detection [S]
- Bipartite check [S]
- Strongly connected components [S]
- Bridges and articulation points [S]
- Practice (candidates): Number of Islands; Course Schedule; Rotting Oranges; Clone Graph; Network Delay Time; Word Ladder; Is Graph Bipartite?; Min Cost to Connect All Points

### Dynamic programming [K][S]
Striver section: Dynamic Programming

- Recursion to memoization [K][S]
- Tabulation [K][S]
- Space optimisation [K][S]
- 1D DP [K][S]
- 2D DP and grids [K][S]
- 0/1 knapsack [K][S]
- Unbounded knapsack [K][S]
- Subsets and partition [K][S]
- Subsequences [K][S]
- String DP [K][S]
- LIS [K][S]
- LCS [K][S]
- DP on trees [K][S]
- Bitmask DP [K][S]
- Stocks [K][S]
- Practice (candidates): Climbing Stairs; House Robber; Coin Change; Longest Increasing Subsequence; Longest Common Subsequence; Edit Distance; Partition Equal Subset Sum; Unique Paths; Best Time to Buy and Sell Stock III

## Phase 5: Advanced and optional

Only after the first five phases feel solid.

### String algorithms [K][S]
Striver section: Strings (Advanced Algo)

- KMP [K][S]
- Z-function [K][S]
- Rabin-Karp [K][S]
- Manacher [K][S]
- Huffman coding [K][S]
- Practice (candidates): Find the Index of the First Occurrence in a String; Longest Palindromic Substring

### Hashing extras [K]

- Chaining [K]
- Probing [K]
- Map using a linked list [K]

### Number theory extras [K]

- Extended Euclid [K]
- Modular inverse [K]
- Diophantine equations [K]
- Matrix exponentiation [K]
- Catalan numbers [K]
- Fermat, Wilson, Euler and Lucas theorems [K]
- Chinese Remainder Theorem [K]
- Euler's totient [K]

### Range-query and offline techniques [K][+]

- Square root decomposition [K]
- Sparse table [+]
- Mo's algorithm [+]
- Intervals and sweep line [+]

### Multithreading [K] (expanded)

- Threads in Java [K]
- Synchronisation basics [K]
