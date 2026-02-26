#!/usr/bin/env node
/**
 * Bitbucket Webhook Handler for Context Connectors
 *
 * This script handles incoming Bitbucket webhooks and triggers index updates
 * when pushes are made to the `main` branch.
 *
 * Usage:
 *   node bitbucket-webhook-handler.js
 *
 * Environment Variables (can be set in .env file):
 *   PORT                 - Server port (default: 3000)
 *   BITBUCKET_WORKSPACE  - Bitbucket workspace slug (default: augment-solutions)
 *   TARGET_BRANCH        - Branch to trigger indexing on (default: main)
 *   WEBHOOK_SECRET       - Bitbucket webhook secret for signature verification
 *   BITBUCKET_TOKEN      - Bitbucket token for accessing repositories
 *   AUGMENT_API_TOKEN    - Augment API token for indexing
 *   AUGMENT_API_URL      - Augment API URL
 *
 * Setup:
 *   1. Copy .env.example to .env and fill in your values
 *   2. Create a webhook in your Bitbucket repository settings
 *   3. Set the URL to your server's URL (e.g., https://your-server.com/webhook)
 *   4. Set a secret and configure WEBHOOK_SECRET env var
 *   5. Select "Repository push" event
 */

import "dotenv/config";
import http from "node:http";
import crypto from "node:crypto";
import { Indexer } from "@augmentcode/context-connectors";
import { BitBucketSource } from "@augmentcode/context-connectors/sources";
import { FilesystemStore } from "@augmentcode/context-connectors/stores";

const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const BITBUCKET_WORKSPACE = process.env.BITBUCKET_WORKSPACE || "augment-solutions";
const TARGET_BRANCH = process.env.TARGET_BRANCH || "main";
const ALLOWED_REPOS = process.env.ALLOWED_REPOS
  ? process.env.ALLOWED_REPOS.split(",").map((r) => r.trim())
  : [];

/**
 * Verify Bitbucket webhook signature
 */
/**
 * Verify Bitbucket webhook signature
 */
function verifySignature(payload, signature) {
  if (!WEBHOOK_SECRET) {
    console.warn("WARNING: WEBHOOK_SECRET not set - skipping signature verification");
    return true;
  }

  if (!signature) {
    return false;
  }

  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  const digest = "sha256=" + hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

/**
 * Index a repository using the context-connectors API
 */
async function indexRepository(repoSlug, ref, isForced = false) {
  const indexName = repoSlug;

  console.log(`Starting index update for ${BITBUCKET_WORKSPACE}/${repoSlug} (ref: ${ref})`);

  const source = new BitBucketSource({
    workspace: BITBUCKET_WORKSPACE,
    repo: repoSlug,
    ref: ref,
  });

  // Override the library's force-push detection with the authoritative value
  // from the webhook payload. The library's isForcePush() method can produce
  // false positives (e.g., when the diffstat API errors out), whereas the
  // webhook's `forced` flag is set by Bitbucket itself.
  source.isForcePush = async () => isForced;

  const store = new FilesystemStore();
  const indexer = new Indexer();

  const result = await indexer.index(source, store, indexName);

  console.log(`Indexing complete for ${repoSlug}!`);
  console.log(`  Type: ${result.type}`);
  console.log(`  Duration: ${result.duration}ms`);
  console.log(`  Total files: ${result.filesIndexed}`);
  if (result.filesNewOrModified > 0) {
    console.log(`    - New/modified: ${result.filesNewOrModified}`);
  }
  if (result.filesUnchanged > 0) {
    console.log(`    - Unchanged: ${result.filesUnchanged}`);
  }
  if (result.filesRemoved > 0) {
    console.log(`    - Removed: ${result.filesRemoved}`);
  }

  return result;
}

/**
 * Handle incoming webhook requests
 */
async function handleRequest(req, res) {
  // Only accept POST requests to /webhook
  if (req.method !== "POST" || req.url !== "/webhook") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  // Read the request body
  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }

  // Verify signature
  const signature = req.headers["x-hub-signature"];
  if (!verifySignature(body, signature)) {
    console.error("Invalid webhook signature");
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid signature" }));
    return;
  }

  // Parse the payload
  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid JSON" }));
    return;
  }

  // Check event type
  const event = req.headers["x-event-key"];
  if (event !== "repo:push") {
    console.log(`Ignoring event: ${event}`);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: `Ignoring event: ${event}` }));
    return;
  }

  // Extract push changes
  const changes = payload.push?.changes || [];
  const repoSlug = payload.repository?.name;

  if (!repoSlug) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Missing repository name" }));
    return;
  }

  // Find changes targeting the configured branch
  const targetChange = changes.find((change) => change.new?.name === TARGET_BRANCH);

  if (!targetChange) {
    console.log(`Ignoring push: no changes to branch ${TARGET_BRANCH}`);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: `No changes to branch: ${TARGET_BRANCH}` }));
    return;
  }

  const commitHash = targetChange.new?.target?.hash;
  const isForced = targetChange.forced === true;

  console.log(`Received push event for ${repoSlug} on ${TARGET_BRANCH} (${commitHash})`);

  // Respond immediately, process indexing asynchronously
  res.writeHead(202, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Indexing started", repo: repoSlug, ref: TARGET_BRANCH }));

  // Trigger indexing in the background
  // Pass the branch name instead of commit hash, as BitBucketSource resolves
  // the ref via the branches API which doesn't accept raw commit SHAs.
  try {
    await indexRepository(repoSlug, TARGET_BRANCH, isForced);
  } catch (err) {
    console.error(`Failed to index ${repoSlug}:`, err.message);
  }
}

// Create and start the server
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`Bitbucket Webhook Handler listening on port ${PORT}`);
  console.log(`Webhook endpoint: POST /webhook`);
  console.log(`Watching for pushes to '${TARGET_BRANCH}' branch`);
  console.log(`Workspace: ${BITBUCKET_WORKSPACE}`);
  console.log(`Allowed repositories: ${ALLOWED_REPOS.length > 0 ? ALLOWED_REPOS.join(", ") : "(all)"}`);
  console.log();
  console.log("Required environment variables:");
  console.log(`  BITBUCKET_TOKEN: ${process.env.BITBUCKET_TOKEN ? "✓ set" : "✗ not set"}`);
  console.log(`  AUGMENT_API_TOKEN: ${process.env.AUGMENT_API_TOKEN ? "✓ set" : "✗ not set"}`);
  console.log(`  AUGMENT_API_URL: ${process.env.AUGMENT_API_URL ? "✓ set" : "✗ not set"}`);
  console.log(`  WEBHOOK_SECRET: ${WEBHOOK_SECRET ? "✓ set" : "⚠ not set (signature verification disabled)"}`);
});
