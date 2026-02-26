#!/usr/bin/env node
/**
 * GitHub Webhook Handler for Context Connectors
 *
 * This script handles incoming GitHub webhooks and triggers index updates
 * when pushes are made to the `main` branch.
 *
 * Usage:
 *   node github-webhook-handler.js
 *
 * Environment Variables (can be set in .env file):
 *   PORT                 - Server port (default: 3000)
 *   REPO_OWNER           - Repository owner to index (default: augment-solutions)
 *   TARGET_BRANCH        - Branch to trigger indexing on (default: main)
 *   WEBHOOK_SECRET       - GitHub webhook secret for signature verification
 *   GITHUB_TOKEN         - GitHub token for accessing repositories
 *   AUGMENT_API_TOKEN    - Augment API token for indexing
 *   AUGMENT_API_URL      - Augment API URL
 *
 * Setup:
 *   1. Copy .env.example to .env and fill in your values
 *   2. Create a webhook in your GitHub repository settings
 *   3. Set the Payload URL to your server's URL (e.g., https://your-server.com/webhook)
 *   4. Set Content type to application/json
 *   5. Set a secret and configure WEBHOOK_SECRET env var
 *   6. Select "Just the push event"
 */

import "dotenv/config";
import http from "node:http";
import crypto from "node:crypto";
import { Indexer } from "@augmentcode/context-connectors";
import { GitHubSource } from "@augmentcode/context-connectors/sources";
import { FilesystemStore } from "@augmentcode/context-connectors/stores";

const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const REPO_OWNER = process.env.REPO_OWNER || "augment-solutions";
const TARGET_BRANCH = process.env.TARGET_BRANCH || "main";
const ALLOWED_REPOS = process.env.ALLOWED_REPOS
  ? process.env.ALLOWED_REPOS.split(",").map((r) => r.trim())
  : [];

/**
 * Verify GitHub webhook signature
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
async function indexRepository(repoName, ref) {
  const indexName = repoName;

  console.log(`Starting index update for ${REPO_OWNER}/${repoName} (ref: ${ref})`);

  const source = new GitHubSource({
    owner: REPO_OWNER,
    repo: repoName,
    ref: ref,
  });

  const store = new FilesystemStore();
  const indexer = new Indexer();

  const result = await indexer.index(source, store, indexName);

  console.log(`Indexing complete for ${repoName}!`);
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
  const signature = req.headers["x-hub-signature-256"];
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
  const event = req.headers["x-github-event"];
  if (event !== "push") {
    console.log(`Ignoring event: ${event}`);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: `Ignoring event: ${event}` }));
    return;
  }

  // Extract branch from ref (refs/heads/main -> main)
  const ref = payload.ref;
  const branch = ref?.replace("refs/heads/", "");

  // Only process pushes to the target branch
  if (branch !== TARGET_BRANCH) {
    console.log(`Ignoring push to branch: ${branch}`);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: `Ignoring push to branch: ${branch}` }));
    return;
  }

  const repoName = payload.repository?.name;
  const commitSha = payload.after;

  if (!repoName) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Missing repository name" }));
    return;
  }

  // Only process pushes to allowed repositories
  if (ALLOWED_REPOS.length > 0 && !ALLOWED_REPOS.includes(repoName)) {
    console.log(`Ignoring push to non-allowed repository: ${repoName}`);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: `Repository not in allowed list: ${repoName}` }));
    return;
  }

  console.log(`Received push event for ${repoName} on ${branch} (${commitSha})`);

  // Respond immediately, process indexing asynchronously
  res.writeHead(202, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Indexing started", repo: repoName, ref: commitSha }));

  // Trigger indexing in the background
  try {
    await indexRepository(repoName, commitSha);
  } catch (err) {
    console.error(`Failed to index ${repoName}:`, err.message);
  }
}

// Create and start the server
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`GitHub Webhook Handler listening on port ${PORT}`);
  console.log(`Webhook endpoint: POST /webhook`);
  console.log(`Watching for pushes to '${TARGET_BRANCH}' branch`);
  console.log(`Repository owner: ${REPO_OWNER}`);
  console.log(`Allowed repositories: ${ALLOWED_REPOS.length > 0 ? ALLOWED_REPOS.join(", ") : "(all)"}`);
  console.log();
  console.log("Required environment variables:");
  console.log(`  GITHUB_TOKEN: ${process.env.GITHUB_TOKEN ? "✓ set" : "✗ not set"}`);
  console.log(`  AUGMENT_API_TOKEN: ${process.env.AUGMENT_API_TOKEN ? "✓ set" : "✗ not set"}`);
  console.log(`  AUGMENT_API_URL: ${process.env.AUGMENT_API_URL ? "✓ set" : "✗ not set"}`);
  console.log(`  WEBHOOK_SECRET: ${WEBHOOK_SECRET ? "✓ set" : "⚠ not set (signature verification disabled)"}`);
});
