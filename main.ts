// main.ts — makefun-x-reposts-02 entry (golden-condor-22)
//
// Hands in the entry's X posts: reads POSTS.json from MAKEFUN_BOT_DIR
// (default /bot), validates it, and copies it byte-identical to
// MAKEFUN_OUTPUT_DIR (default /output)/POSTS.json.
//
// POSTS.json shape: {"posts": ["https://x.com/<handle>/status/<id>", ...]}
//   - 1 to 15 addresses, each one of the entrant's own X posts
//   - each address must match https://x.com/<handle>/status/<digits>
//     (twitter.com passes too)
//   - anything else fails loud with exit code 1
//
// Node 22, standard library only. No network, no wall clock, no files
// outside the repository. The two runs of an entry write the same bytes.

import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? "/bot";
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const POST_URL = /^https:\/\/(x\.com|twitter\.com)\/[A-Za-z0-9_]+\/status\/[0-9]+$/;

function fail(message: string): never {
  console.error(`main.ts: ERROR: ${message}`);
  process.exit(1);
}

const source = join(BOT_DIR, "POSTS.json");
if (!existsSync(source)) {
  fail(`POSTS.json not found in ${BOT_DIR}`);
}

let raw: string;
try {
  raw = readFileSync(source, "utf8");
} catch (err) {
  fail(`cannot read POSTS.json: ${(err as Error).message}`);
}

let data: unknown;
try {
  data = JSON.parse(raw!);
} catch {
  fail("POSTS.json is not valid JSON");
}

if (typeof data !== "object" || data === null || Array.isArray(data)) {
  fail('POSTS.json must be a JSON object with a "posts" array');
}
const posts = (data as { posts?: unknown }).posts;
if (!Array.isArray(posts)) {
  fail('POSTS.json must be a JSON object with a "posts" array');
}
if (posts.length < 1) {
  fail('POSTS.json "posts" must name at least 1 post');
}
if (posts.length > 15) {
  fail(`POSTS.json names ${posts.length} posts, at most 15 allowed`);
}
for (const url of posts) {
  if (typeof url !== "string" || !POST_URL.test(url)) {
    fail(
      `POSTS.json post address must match https://x.com/<handle>/status/<digits>, got ${JSON.stringify(url)}`,
    );
  }
}
if (new Set(posts).size !== posts.length) {
  fail("POSTS.json names the same post address twice");
}

mkdirSync(OUTPUT_DIR, { recursive: true });
copyFileSync(source, join(OUTPUT_DIR, "POSTS.json"));
