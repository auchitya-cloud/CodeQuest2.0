'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, ChevronDown, Spline, GitBranch, ListTree, Binary, Network, Activity, Timer, ListChecks } from 'lucide-react';

/**
 * DSA Visualizer – single-file page for Next.js App Router
 * Place at: apps/web/src/app/visualizer/page.jsx
 * Requires Tailwind (dark mode: class)
 *
 * Features (v1):
 * - Sidebar: select category & algorithm (Graphs/Trees/Arrays/LinkedList)
 * - Inputs per category (e.g., adjacency list, array, tree nodes with "null")
 * - Controls: play/pause, step fwd/back, reset, speed
 * - Visual canvas: renders frames (arrays, graphs, trees, linked list)
 * - Info panel: time/space, short description, pseudo-code
 *
 * Implemented algorithms (frame-based):
 * - Graphs: DFS, BFS, Dijkstra, Bellman-Ford (single-source), Prim's MST
 * - Arrays: Insertion Sort, Bubble Sort, Merge Sort (shows splitting/merge), Binary Search
 * - Trees: Level-order build from array with "null"; BFS & DFS traversals
 * - Linked List: slow/fast pointer demo (cycle detect visualization)
 */

// ------------------------------
// Small UI primitives
// ------------------------------
const Button = ({ className = '', children, ...props }) => (
  <button
    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium border border-zinc-300/60 dark:border-zinc-700/60 bg-white/70 dark:bg-zinc-900/70 hover:bg-zinc-50 dark:hover:bg-zinc-900 shadow-sm active:scale-[0.98] ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Section = ({ title, children, right }) => (
  <div className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white/70 dark:bg-zinc-950/60 p-4">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 tracking-wide">{title}</h3>
      {right}
    </div>
    {children}
  </div>
);

const Label = ({ children }) => (
  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">{children}</label>
);

const Input = (props) => (
  <input
    {...props}
    className={`w-full rounded-lg border border-zinc-300/70 dark:border-zinc-700/70 bg-white/70 dark:bg-zinc-900/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40`}
  />
);

const Textarea = (props) => (
  <textarea
    {...props}
    className={`w-full min-h-[90px] rounded-lg border border-zinc-300/70 dark:border-zinc-700/70 bg-white/70 dark:bg-zinc-900/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40`}
  />
);

// ------------------------------
// Data & Catalog
// ------------------------------
const CATEGORIES = {
  Graphs: {
    icon: <Network className="h-4 w-4" />,
    items: [
      { key: 'graph_bfs', name: 'BFS' },
      { key: 'graph_dfs', name: 'DFS' },
      { key: 'graph_dijkstra', name: "Dijkstra's" },
      { key: 'graph_bellman', name: 'Bellman-Ford' },
      { key: 'graph_prim', name: "MST (Prim's)" }
    ]
  },
  Trees: {
    icon: <ListTree className="h-4 w-4" />,
    items: [
      { key: 'tree_bfs', name: 'BFS (Level Order)' },
      { key: 'tree_dfs', name: 'DFS (Preorder)' }
    ]
  },
  Arrays: {
    icon: <ListChecks className="h-4 w-4" />,
    items: [
      { key: 'arr_insertion', name: 'Insertion Sort' },
      { key: 'arr_bubble', name: 'Bubble Sort' },
      { key: 'arr_merge', name: 'Merge Sort' },
      { key: 'arr_binary', name: 'Binary Search' }
    ]
  },
  LinkedList: {
    icon: <GitBranch className="h-4 w-4" />,
    items: [
      { key: 'll_slowfast', name: 'Slow/Fast Pointers' }
    ]
  }
};

const DEFAULTS = {
  array: '8, 5, 2, 9, 5, 6, 3',
  arraySorted: '2, 3, 5, 5, 6, 8, 9',
  adjList: '0:1,2\n1:0,3\n2:0,3\n3:1,2',
  tree: '1,2,3,4,5,null,7',
  linkedlist: '1 -> 2 -> 3 -> 4 -> 5'
};

// ------------------------------
// Frame Engine (shared state machine)
// ------------------------------
function useFrames() {
  const [frames, setFrames] = React.useState([]);
  const [i, setI] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState(700); // ms per frame

  React.useEffect(() => {
    if (!playing || frames.length === 0) return;
    const id = setTimeout(() => setI((prev) => Math.min(prev + 1, frames.length - 1)), speed);
    return () => clearTimeout(id);
  }, [playing, i, frames, speed]);

  const controls = {
    play: () => setPlaying(true),
    pause: () => setPlaying(false),
    reset: () => { setPlaying(false); setI(0); },
    stepNext: () => setI((n) => Math.min(n + 1, frames.length - 1)),
    stepPrev: () => setI((n) => Math.max(n - 1, 0)),
    setFrames: (f) => { setPlaying(false); setI(0); setFrames(f || []); },
    setSpeed
  };

  return { frame: frames[i], index: i, total: frames.length, playing, speed, ...controls };
}

// ------------------------------
// Parsers
// ------------------------------
function parseArray(str) {
  return str
    .split(/[\n,\s]+/)
    .filter(Boolean)
    .map(Number)
    .filter((v) => Number.isFinite(v));
}

function parseAdjList(str) {
  // lines like: 0:1,2 ; 1:0,3
  const adj = new Map();
  str
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [u, rest] = line.split(':');
      const v = (rest || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
        .map(Number);
      adj.set(Number(u), v);
    });
  // ensure all nodes appear
  Array.from(adj.values()).flat().forEach((v) => { if (!adj.has(v)) adj.set(v, []); });
  return adj;
}

function parseTreeArray(str) {
  // "1,2,3,4,5,null,7" → array with nulls
  return str
    .split(/[\n,\s]+/)
    .filter(Boolean)
    .map((t) => (t.toLowerCase() === 'null' ? null : Number(t)))
    .map((v) => (v === null || Number.isFinite(v) ? v : null));
}

// ------------------------------
// Algorithms → frames
// each frame is { desc, highlights, data }
// ------------------------------

// Arrays
function framesInsertionSort(arr) {
  const a = arr.slice();
  const frames = [{ desc: 'Start', data: a.slice(), highlights: {} }];
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    frames.push({ desc: `Pick key a[${i}]=${key}`, data: a.slice(), highlights: { keyIndex: i } });
    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j];
      frames.push({ desc: `Shift a[${j}] → a[${j + 1}]`, data: a.slice(), highlights: { compare: [j, j + 1] } });
      j--;
    }
    a[j + 1] = key;
    frames.push({ desc: `Place key at ${j + 1}`, data: a.slice(), highlights: { placed: j + 1 } });
  }
  frames.push({ desc: 'Done', data: a.slice(), highlights: { done: true } });
  return frames;
}

function framesBubbleSort(arr) {
  const a = arr.slice();
  const frames = [{ desc: 'Start', data: a.slice(), highlights: {} }];
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a.length - i - 1; j++) {
      frames.push({ desc: `Compare ${a[j]} & ${a[j + 1]}`, data: a.slice(), highlights: { compare: [j, j + 1] } });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        frames.push({ desc: `Swap ${a[j]} ↔ ${a[j + 1]}`, data: a.slice(), highlights: { swap: [j, j + 1] } });
      }
    }
  }
  frames.push({ desc: 'Done', data: a.slice(), highlights: { done: true } });
  return frames;
}

function framesMergeSort(arr) {
  const frames = [];
  function mergeSort(a, l, r, depth = 0) {
    frames.push({ desc: `Split [${l},${r}]`, data: a.slice(), highlights: { range: [l, r], depth } });
    if (l >= r) return;
    const m = Math.floor((l + r) / 2);
    mergeSort(a, l, m, depth + 1);
    mergeSort(a, m + 1, r, depth + 1);
    // merge
    const left = a.slice(l, m + 1), right = a.slice(m + 1, r + 1);
    let i = 0, j = 0, k = l;
    while (i < left.length && j < right.length) {
      if (left[i] <= right[j]) a[k++] = left[i++];
      else a[k++] = right[j++];
      frames.push({ desc: `Merge step into [${l},${r}]`, data: a.slice(), highlights: { range: [l, r], mergeAt: k - 1 } });
    }
    while (i < left.length) { a[k++] = left[i++]; frames.push({ desc: 'Drain left', data: a.slice(), highlights: { range: [l, r], mergeAt: k - 1 } }); }
    while (j < right.length) { a[k++] = right[j++]; frames.push({ desc: 'Drain right', data: a.slice(), highlights: { range: [l, r], mergeAt: k - 1 } }); }
  }
  const a = arr.slice();
  mergeSort(a, 0, a.length - 1);
  frames.push({ desc: 'Done', data: a.slice(), highlights: { done: true } });
  return frames;
}

function framesBinarySearch(arr, target) {
  const a = arr.slice();
  const frames = [];
  let l = 0, r = a.length - 1;
  while (l <= r) {
    const m = Math.floor((l + r) / 2);
    frames.push({ desc: `Check mid=${m} (val=${a[m]})`, data: a.slice(), highlights: { l, r, m, target } });
    if (a[m] === target) { frames.push({ desc: `Found at ${m}`, data: a.slice(), highlights: { found: m } }); break; }
    if (a[m] < target) l = m + 1; else r = m - 1;
  }
  return frames.length ? frames : [{ desc: 'Not found', data: a.slice(), highlights: {} }];
}

// Graphs
function framesBFS(adj, start = 0) {
  const frames = [];
  const visited = new Set();
  const q = [start]; visited.add(start);
  frames.push({ desc: `Start at ${start}`, data: { adj: mapToObj(adj), active: start, visited: [...visited], queue: q.slice() } });
  while (q.length) {
    const u = q.shift();
    frames.push({ desc: `Pop ${u}`, data: { adj: mapToObj(adj), active: u, visited: [...visited], queue: q.slice() } });
    for (const v of adj.get(u) || []) {
      if (!visited.has(v)) { visited.add(v); q.push(v); frames.push({ desc: `Visit ${v}`, data: { adj: mapToObj(adj), edge: [u, v], visited: [...visited], queue: q.slice() } }); }
    }
  }
  return frames;
}

function framesDFS(adj, start = 0) {
  const frames = [];
  const visited = new Set();
  function dfs(u) {
    visited.add(u);
    frames.push({ desc: `Enter ${u}`, data: { adj: mapToObj(adj), active: u, visited: [...visited] } });
    for (const v of adj.get(u) || []) {
      if (!visited.has(v)) {
        frames.push({ desc: `Go ${u}→${v}`, data: { adj: mapToObj(adj), edge: [u, v], visited: [...visited] } });
        dfs(v);
        frames.push({ desc: `Backtrack to ${u}`, data: { adj: mapToObj(adj), active: u, visited: [...visited] } });
      }
    }
  }
  dfs(start);
  return frames;
}

function framesDijkstra(adj, source = 0) {
  const frames = [];
  const nodes = [...adj.keys()].sort((a,b)=>a-b);
  const dist = Object.fromEntries(nodes.map(n => [n, Infinity]));
  dist[source] = 0;
  const used = new Set();
  frames.push({ desc: 'Init distances', data: { dist: { ...dist }, used: [], source } });
  while (used.size < nodes.length) {
    let u = null, best = Infinity;
    for (const n of nodes) if (!used.has(n) && dist[n] < best) { best = dist[n]; u = n; }
    if (u == null) break; used.add(u);
    frames.push({ desc: `Pick ${u}`, data: { dist: { ...dist }, used: [...used] } });
    for (const pair of adj.get(u) || []) {
      const [v, w] = Array.isArray(pair) ? pair : [pair, 1];
      if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; frames.push({ desc: `Relax ${u}→${v} (w=${w})`, data: { dist: { ...dist }, edge: [u, v], used: [...used] } }); }
    }
  }
  return frames;
}

function framesBellmanFord(adj, source = 0) {
  const frames = [];
  const nodes = [...adj.keys()].sort((a,b)=>a-b);
  const dist = Object.fromEntries(nodes.map(n => [n, Infinity]));
  dist[source] = 0; frames.push({ desc: 'Init distances', data: { dist: { ...dist } } });
  const edges = [];
  for (const [u, lst] of adj) for (const e of lst || []) { const [v, w] = Array.isArray(e) ? e : [e, 1]; edges.push([u, v, w]); }
  for (let i = 0; i < nodes.length - 1; i++) {
    for (const [u, v, w] of edges) {
      if (dist[u] !== Infinity && dist[u] + w < dist[v]) { dist[v] = dist[u] + w; frames.push({ desc: `Relax ${u}→${v} (w=${w})`, data: { dist: { ...dist }, edge: [u, v] } }); }
    }
  }
  // No negative-cycle detection frame here (can be added)
  return frames;
}

function framesPrim(adj, start = 0) {
  const frames = [];
  const inMST = new Set();
  const edges = [];
  const pq = [];
  function pushEdges(u){ for (const e of adj.get(u)||[]) { const [v,w] = Array.isArray(e)?e:[e,1]; pq.push([w,u,v]); } }
  function popMin(){ let bi=-1, best=Infinity; for (let i=0;i<pq.length;i++){ if(pq[i][0]<best){best=pq[i][0];bi=i;} } return bi>=0?pq.splice(bi,1)[0]:null; }
  inMST.add(start); pushEdges(start); frames.push({ desc: `Start at ${start}`, data: { inMST: [...inMST], mst: [], frontier: pq.slice() } });
  while (pq.length) {
    const [w,u,v] = popMin();
    if (inMST.has(v)) continue;
    inMST.add(v); edges.push([u,v,w]); pushEdges(v);
    frames.push({ desc: `Add ${u}→${v} (w=${w})`, data: { inMST: [...inMST], mst: edges.slice(), frontier: pq.slice() } });
  }
  return frames;
}

// Trees
function buildTreeFromArray(arr) {
  if (!arr.length) return null;
  const nodes = arr.map((v) => (v == null ? null : { val: v, left: null, right: null }));
  for (let i = 0; i < nodes.length; i++) {
    if (!nodes[i]) continue;
    const l = 2 * i + 1, r = 2 * i + 2;
    if (l < nodes.length) nodes[i].left = nodes[l];
    if (r < nodes.length) nodes[i].right = nodes[r];
  }
  return nodes[0];
}

function framesTreeBFS(root) {
  const frames = [];
  if (!root) return frames;
  const q = [root];
  const seen = new Set();
  seen.add(root);
  frames.push({ desc: `Start at root ${root.val}`, data: { active: root.val, queue: [root.val], visited: [] } });
  while (q.length) {
    const node = q.shift();
    frames.push({ desc: `Visit ${node.val}`, data: { active: node.val } });
    if (node.left) { q.push(node.left); frames.push({ desc: `Queue left ${node.left.val}`, data: { edge: [node.val, node.left.val], queue: q.map(n=>n.val) } }); }
    if (node.right){ q.push(node.right); frames.push({ desc: `Queue right ${node.right.val}`, data: { edge: [node.val, node.right.val], queue: q.map(n=>n.val) } }); }
  }
  return frames;
}

function framesTreeDFSPre(root) {
  const frames = [];
  function dfs(n){ if(!n) return; frames.push({ desc: `Pre ${n.val}`, data: { active: n.val } }); dfs(n.left); dfs(n.right); }
  dfs(root); return frames;
}

// Linked List
function parseLinkedList(str){
  // "1 -> 2 -> 3" → [1,2,3]
  return str.split(/->|→/).map(s=>s.trim()).filter(Boolean).map(Number).filter(n=>Number.isFinite(n));
}

function framesSlowFast(nums){
  const frames=[]; let slow=0, fast=0;
  frames.push({ desc: 'Start', data:{ arr: nums, slow, fast }});
  while (fast < nums.length-1){ slow+=1; fast+=2; frames.push({ desc:`slow=${slow}, fast=${fast}`, data:{ arr: nums, slow, fast }}); }
  return frames;
}

// helpers
function mapToObj(m){ const o={}; for (const [k,v] of m) o[k]=v; return o; }

// ------------------------------
// Renderers
// ------------------------------
const ArrayRenderer = ({ frame }) => {
  const a = frame?.data || [];
  const h = frame?.highlights || {};
  return (
    <div className="flex flex-wrap items-end gap-2">
      {a.map((v, idx) => (
        <div key={idx} className={`flex h-24 w-12 items-end justify-center rounded-md border text-sm font-medium transition-all ${
          h.done ? 'border-emerald-500/70 bg-emerald-100/40 dark:bg-emerald-900/10' :
          h.swap && h.swap.includes(idx) ? 'border-amber-500/70 bg-amber-100/40 dark:bg-amber-900/10' :
          h.compare && h.compare.includes(idx) ? 'border-sky-500/60 bg-sky-100/40 dark:bg-sky-900/10' :
          h.placed === idx ? 'border-emerald-500/70 bg-emerald-100/40 dark:bg-emerald-900/10' :
          'border-zinc-300/70 dark:border-zinc-700/70 bg-white/60 dark:bg-zinc-900/60'
        }`}
          style={{ height: `${24 + Math.max(0, Number(v)) * 3}px` }}
        >
          <span className="mb-2 text-zinc-800 dark:text-zinc-100">{v}</span>
        </div>
      ))}
    </div>
  );
};

const BinarySearchOverlay = ({ frame }) => {
  if (!frame?.highlights) return null;
  const { l, r, m, found, target } = frame.highlights;
  return (
    <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
      <div>l = {l} &nbsp; r = {r} &nbsp; m = {m} &nbsp; target = {target}</div>
      {found !== undefined && <div className="text-emerald-600 dark:text-emerald-400">Found at index {found}</div>}
    </div>
  );
};

const GraphRenderer = ({ frame }) => {
  const adj = frame?.data?.adj || {};
  const active = frame?.data?.active;
  const edge = frame?.data?.edge;
  const visited = new Set(frame?.data?.visited || []);
  const nodes = Object.keys(adj).map(Number).sort((a,b)=>a-b);
  // layout in a circle
  const R=120, cx=180, cy=140;
  const pos = Object.fromEntries(nodes.map((n, i) => [n, [cx + R*Math.cos((2*Math.PI*i)/nodes.length), cy + R*Math.sin((2*Math.PI*i)/nodes.length)]]));
  return (
    <svg className="w-full h-[300px] rounded-xl bg-white/60 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/70">
      {/* edges */}
      {nodes.map((u) => (adj[u]||[]).map((v, idx) => {
        const to = Array.isArray(v) ? v[0] : v;
        const [x1,y1] = pos[u]||[0,0];
        const [x2,y2] = pos[to]||[0,0];
        const isActive = edge && edge[0]===u && edge[1]===to;
        return <line key={`${u}-${to}-${idx}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={isActive? 'rgb(16 185 129)': 'rgb(148 163 184)'} strokeWidth={isActive?3:1.5} opacity={0.7}/>;
      }))}
      {/* nodes */}
      {nodes.map((n) => {
        const [x,y] = pos[n];
        const isActive = active===n;
        const was = visited.has(n);
        return (
          <g key={n}>
            <circle cx={x} cy={y} r={20} fill={isActive? 'rgb(16 185 129)': was? 'rgb(226 232 240)': 'white'} stroke="rgb(63 63 70)" />
            <text x={x} y={y+4} textAnchor="middle" className="text-[12px] fill-zinc-800 dark:fill-zinc-100">{n}</text>
          </g>
        );
      })}
    </svg>
  );
};

const TreeRenderer = ({ frame, treeArr }) => {
  // Render from complete array layout (heap-like positions)
  const arr = treeArr || [];
  const width = 560, levelHeight=72;
  const nodes = arr.map((v,i)=>({i,v,level:Math.floor(Math.log2(i+1)), posInLevel:i-(2**Math.floor(Math.log2(i+1))-1)}));
  return (
    <svg className="w-full h-[320px] rounded-xl bg-white/60 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/70">
      {/* edges */}
      {nodes.map(({i,level})=>{
        if(arr[i]==null) return null;
        const l=2*i+1, r=2*i+2; const y1=levelHeight*level+30; const x1=(width/(2**(level+1)))*(2* (i-(2**level-1))+1);
        const draw = (child) => {
          const cl=Math.floor(Math.log2(child+1));
          const y2=levelHeight*cl+30; const x2=(width/(2**(cl+1)))*(2* (child-(2**cl-1))+1);
          return <line key={`${i}-${child}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgb(148 163 184)"/>;
        };
        return <g key={i}>{arr[l]!=null && draw(l)}{arr[r]!=null && draw(r)}</g>;
      })}
      {/* nodes */}
      {nodes.map(({i,level})=>{
        if(arr[i]==null) return null;
        const y=levelHeight*level+30; const x=(width/(2**(level+1)))*(2* (i-(2**level-1))+1);
        const isActive = frame?.data?.active===arr[i];
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={18} fill={isActive? 'rgb(16 185 129)':'white'} stroke="rgb(63 63 70)"/>
            <text x={x} y={y+4} textAnchor="middle" className="text-[12px] fill-zinc-800 dark:fill-zinc-100">{arr[i]}</text>
          </g>
        );
      })}
    </svg>
  );
};

const LinkedListRenderer = ({ frame }) => {
  const arr = frame?.data?.arr || [];
  const { slow, fast } = frame?.data || {};
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2">
      {arr.map((v, idx) => (
        <div key={idx} className="relative">
          <div className="rounded-xl border border-zinc-300/70 dark:border-zinc-700/70 bg-white/60 dark:bg-zinc-900/60 px-4 py-3 text-sm font-medium">
            {v}
          </div>
          {idx === slow && <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-emerald-600">slow</div>}
          {idx === fast && <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-sky-600">fast</div>}
        </div>
      ))}
    </div>
  );
};

// ------------------------------
// Pseudocode & Complexity
// ------------------------------
const INFO = {
  arr_insertion: { tc: 'O(n^2)', sc: 'O(1)', pseudo: ['for i ← 1..n-1', '  key ← a[i]', '  j ← i-1', '  while j>=0 & a[j]>key', '    a[j+1]←a[j]; j--', '  a[j+1]←key'] },
  arr_bubble: { tc: 'O(n^2)', sc: 'O(1)', pseudo: ['repeat n times', '  for j=0..n-i-2', '    if a[j]>a[j+1]', '      swap'] },
  arr_merge: { tc: 'O(n log n)', sc: 'O(n)', pseudo: ['mergeSort(l,r):', ' if l>=r return', ' m=(l+r)/2', ' sort(l,m); sort(m+1,r)', ' merge(l,m,r)'] },
  arr_binary: { tc: 'O(log n)', sc: 'O(1)', pseudo: ['l←0,r←n-1', 'while l≤r:', ' m←(l+r)/2', ' if a[m]==x return m', ' if a[m]<x l←m+1 else r←m-1'] },
  graph_bfs: { tc: 'O(V+E)', sc: 'O(V)', pseudo: ['push start to queue', 'while queue:', '  u←pop', '  for v in adj[u]:', '    if not visited: mark & push'] },
  graph_dfs: { tc: 'O(V+E)', sc: 'O(V)', pseudo: ['dfs(u):', ' mark u', ' for v in adj[u]:', '  if not visited: dfs(v)'] },
  graph_dijkstra: { tc: 'O(E log V) with PQ', sc: 'O(V)', pseudo: ['dist[]=∞; dist[s]=0', 'repeat:', ' pick u with min dist', ' relax edges u→v'] },
  graph_bellman: { tc: 'O(V·E)', sc: 'O(V)', pseudo: ['dist[]=∞; dist[s]=0', 'repeat V-1 times:', ' for each edge u→v:', '  relax(u,v)'] },
  graph_prim: { tc: 'O(E log V) with PQ', sc: 'O(V)', pseudo: ['pick start', 'push edges to PQ', 'while PQ:', ' add min edge to MST', ' push new edges'] },
  tree_bfs: { tc: 'O(n)', sc: 'O(n)', pseudo: ['queue root', 'while queue:', ' u←pop', ' push children'] },
  tree_dfs: { tc: 'O(n)', sc: 'O(h)', pseudo: ['preorder(u):', ' visit u', ' preorder(u.left)', ' preorder(u.right)'] },
  ll_slowfast: { tc: 'O(n)', sc: 'O(1)', pseudo: ['slow=head; fast=head', 'while fast & fast.next:', ' slow=slow.next', ' fast=fast.next.next'] }
};

// ------------------------------
// Page
// ------------------------------
export default function VisualizerPage(){
  const [category, setCategory] = React.useState('Arrays');
  const [algo, setAlgo] = React.useState('arr_merge');

  // inputs
  const [arrayText, setArrayText] = React.useState(DEFAULTS.array);
  const [arraySortedText, setArraySortedText] = React.useState(DEFAULTS.arraySorted);
  const [adjText, setAdjText] = React.useState(DEFAULTS.adjList);
  const [treeText, setTreeText] = React.useState(DEFAULTS.tree);
  const [llText, setLlText] = React.useState(DEFAULTS.linkedlist);
  const [target, setTarget] = React.useState('5');
  const [startNode, setStartNode] = React.useState('0');

  const frames = useFrames();

  const onRun = () => {
    try {
      if (algo.startsWith('arr_')) {
        const arr = parseArray(algo==='arr_binary'? arraySortedText : arrayText);
        if (algo==='arr_insertion') frames.setFrames(framesInsertionSort(arr));
        if (algo==='arr_bubble') frames.setFrames(framesBubbleSort(arr));
        if (algo==='arr_merge') frames.setFrames(framesMergeSort(arr));
        if (algo==='arr_binary') frames.setFrames(framesBinarySearch(arr, Number(target)));
      } else if (algo.startsWith('graph_')) {
        // support weighted edges like: 0:1(4),2(1)
        const adjRaw = parseAdjWeighted(adjText);
        const start = Number(startNode)||0;
        if (algo==='graph_bfs') frames.setFrames(framesBFS(adjRaw.unweighted, start));
        if (algo==='graph_dfs') frames.setFrames(framesDFS(adjRaw.unweighted, start));
        if (algo==='graph_dijkstra') frames.setFrames(framesDijkstra(adjRaw.weighted, start));
        if (algo==='graph_bellman') frames.setFrames(framesBellmanFord(adjRaw.weighted, start));
        if (algo==='graph_prim') frames.setFrames(framesPrim(adjRaw.weighted, start));
      } else if (algo.startsWith('tree_')) {
        const arr = parseTreeArray(treeText); const root = buildTreeFromArray(arr);
        if (algo==='tree_bfs') frames.setFrames(framesTreeBFS(root));
        if (algo==='tree_dfs') frames.setFrames(framesTreeDFSPre(root));
      } else if (algo==='ll_slowfast') {
        const arr = parseLinkedList(llText); frames.setFrames(framesSlowFast(arr));
      }
    } catch (e) {
      console.error(e);
      frames.setFrames([{ desc: 'Parse error. Check input.', data: [] }]);
    }
  };

  const info = INFO[algo];

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Algorithm Visualizer</h1>
          <span className="text-xs text-zinc-500">v1 • client-side demo</span>
        </header>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr_320px]">
          {/* Sidebar */}
          <Section title="Algorithms">
            <div className="space-y-4">
              {Object.entries(CATEGORIES).map(([cat, cfg]) => (
                <div key={cat}>
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {cfg.icon}
                    <span>{cat}</span>
                  </div>
                  <div className="grid gap-2">
                    {cfg.items.map((it) => (
                      <Button
                        key={it.key}
                        className={`${algo===it.key ? 'border-emerald-600/60 bg-emerald-50/60 dark:bg-emerald-900/20' : ''}`}
                        onClick={() => { setCategory(cat); setAlgo(it.key); }}
                      >
                        {it.name}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Canvas & Controls */}
          <div className="space-y-4">
            <Section title="Inputs" right={<small className="text-zinc-500">Provide data and click Run</small>}>
              {algo.startsWith('arr_') && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>{algo==='arr_binary' ? 'Sorted Array' : 'Array'} (comma/space separated)</Label>
                    <Input value={algo==='arr_binary'? arraySortedText : arrayText} onChange={(e)=> (algo==='arr_binary'? setArraySortedText(e.target.value): setArrayText(e.target.value))} placeholder="8, 5, 2, 9, 5, 6, 3" />
                  </div>
                  {algo==='arr_binary' && (
                    <div>
                      <Label>Target</Label>
                      <Input value={target} onChange={(e)=>setTarget(e.target.value)} placeholder="5" />
                    </div>
                  )}
                </div>
              )}
              {algo.startsWith('graph_') && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label>Adjacency List (unweighted: 0:1,2 | weighted: 0:1(4),2(1))</Label>
                    <Textarea value={adjText} onChange={(e)=>setAdjText(e.target.value)} placeholder={DEFAULTS.adjList} />
                  </div>
                  <div>
                    <Label>Start Node</Label>
                    <Input value={startNode} onChange={(e)=>setStartNode(e.target.value)} placeholder="0" />
                  </div>
                </div>
              )}
              {algo.startsWith('tree_') && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label>Tree Level-Order Array (use "null" for missing)</Label>
                    <Input value={treeText} onChange={(e)=>setTreeText(e.target.value)} placeholder="1,2,3,4,5,null,7" />
                  </div>
                </div>
              )}
              {algo==='ll_slowfast' && (
                <div>
                  <Label>Linked List (use → or ->)</Label>
                  <Input value={llText} onChange={(e)=>setLlText(e.target.value)} placeholder="1 -> 2 -> 3 -> 4 -> 5" />
                </div>
              )}

              <div className="mt-3 flex items-center gap-2">
                <Button onClick={onRun} className="bg-emerald-600/90 text-white border-emerald-700 hover:bg-emerald-600"><Play className="h-4 w-4"/>Run</Button>
                <span className="text-xs text-zinc-500">Generate frames for visualization</span>
              </div>
            </Section>

            <Section title="Visualization" right={<span className="text-xs text-zinc-500">Step {frames.index+1} / {frames.total||0}</span>}>
              <div className="mb-3 min-h-[60px] text-sm text-zinc-600 dark:text-zinc-300">{frames.frame?.desc || 'Provide inputs and click Run.'}</div>
              <div className="overflow-hidden rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 p-4 bg-white/60 dark:bg-zinc-900/60">
                {algo.startsWith('arr_') && (
                  <div>
                    <ArrayRenderer frame={frames.frame} />
                    {algo==='arr_binary' && <BinarySearchOverlay frame={frames.frame} />}
                  </div>
                )}
                {algo.startsWith('graph_') && <GraphRenderer frame={frames.frame} />}
                {algo.startsWith('tree_') && <TreeRenderer frame={frames.frame} treeArr={parseTreeArray(treeText)} />}
                {algo==='ll_slowfast' && <LinkedListRenderer frame={frames.frame} />}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button onClick={frames.stepPrev}><SkipBack className="h-4 w-4"/>Prev</Button>
                {frames.playing ? (
                  <Button onClick={frames.pause}><Pause className="h-4 w-4"/>Pause</Button>
                ) : (
                  <Button onClick={frames.play}><Play className="h-4 w-4"/>Play</Button>
                )}
                <Button onClick={frames.stepNext}><SkipForward className="h-4 w-4"/>Next</Button>
                <Button onClick={frames.reset}><RotateCcw className="h-4 w-4"/>Reset</Button>

                <div className="ml-auto flex items-center gap-2">
                  <Timer className="h-4 w-4 text-zinc-500"/>
                  <input type="range" min={200} max={1500} step={50} value={frames.speed} onChange={(e)=>frames.setSpeed(Number(e.target.value))} />
                  <span className="text-xs text-zinc-500 w-14">{frames.speed}ms</span>
                </div>
              </div>
            </Section>
          </div>

          {/* Info panel */}
          <Section title="Analysis">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium">Time & Space</div>
                <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                  <div>Time: <span className="font-semibold">{info?.tc || '-'}</span></div>
                  <div>Space: <span className="font-semibold">{info?.sc || '-'}</span></div>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Pseudo-code</div>
                <ol className="mt-2 list-decimal pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                  {info?.pseudo?.map((line, i) => <li key={i} className="leading-6">{line}</li>) || <li>—</li>}
                </ol>
              </div>
              <div>
                <div className="text-sm font-medium">Tips</div>
                <ul className="mt-2 list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400">
                  {algo==='arr_merge' && <li>Observe the split phases (frames labeled Split) and merge points.</li>}
                  {algo.startsWith('graph_') && <li>Weighted input format: <code>0:1(4),2(1)</code> means edges 0→1 (w=4), 0→2 (w=1).</li>}
                  {algo.startsWith('tree_') && <li>Use <code>null</code> to skip missing children in level-order input.</li>}
                </ul>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

// parse weighted adjacency list (supports both weighted & unweighted at once)
function parseAdjWeighted(text){
  const lines = text.split(/\n+/).map(s=>s.trim()).filter(Boolean);
  const weighted = new Map();
  const unweighted = new Map();
  for (const line of lines){
    const [uStr, rest] = line.split(":"); const u = Number(uStr);
    const parts = (rest||'').split(',').map(s=>s.trim()).filter(Boolean);
    for (const p of parts){
      const m = p.match(/^(\d+)(?:\(([-+]?\d+(?:\.\d+)?)\))?$/);
      if (!m) continue; const v = Number(m[1]); const w = m[2]!==undefined? Number(m[2]) : 1;
      if (!weighted.has(u)) weighted.set(u, []); if (!weighted.has(v)) weighted.set(v, []);
      if (!unweighted.has(u)) unweighted.set(u, []); if (!unweighted.has(v)) unweighted.set(v, []);
      weighted.get(u).push([v,w]); unweighted.get(u).push(v);
    }
  }
  // ensure isolated nodes carry over
  for (const k of new Set([...weighted.keys(), ...unweighted.keys()])){
    if(!weighted.has(k)) weighted.set(k, []);
    if(!unweighted.has(k)) unweighted.set(k, []);
  }
  return { weighted, unweighted };
}
