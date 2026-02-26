# Webhook Handler

A lightweight server that automatically updates Context Connectors indexes when pushes are made to specified repositories. Supports both **GitHub** and **Bitbucket** webhooks.

## Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values

# Run the GitHub webhook handler
node github-webhook-handler.js

# Or run the Bitbucket webhook handler
node bitbucket-webhook-handler.js
```

## GitHub Webhook Configuration

1. Go to your repository **Settings → Webhooks → Add webhook**
2. Set **Payload URL** to `https://your-server.com/webhook`
3. Set **Content type** to `application/json`
4. Set **Secret** to match your `WEBHOOK_SECRET`
5. Select **Just the push event**

### GitHub Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `WEBHOOK_SECRET` | GitHub webhook secret for signature verification | - |
| `GITHUB_TOKEN` | GitHub token for repository access | - |
| `AUGMENT_API_TOKEN` | Augment API token | - |
| `AUGMENT_API_URL` | Augment API URL | - |
| `REPO_OWNER` | Repository owner to index | `augment-solutions` |
| `TARGET_BRANCH` | Branch that triggers indexing | `main` |
| `ALLOWED_REPOS` | Comma-separated list of repos to index (empty = all) | - |

## Bitbucket Webhook Configuration

1. Go to your repository **Settings → Webhooks → Add webhook**
2. Set **URL** to `https://your-server.com/webhook`
3. Set a **Secret** to match your `WEBHOOK_SECRET`
4. Select the **Repository push** event

### Bitbucket Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `WEBHOOK_SECRET` | Bitbucket webhook secret for signature verification | - |
| `BITBUCKET_TOKEN` | Bitbucket token for repository access | - |
| `AUGMENT_API_TOKEN` | Augment API token | - |
| `AUGMENT_API_URL` | Augment API URL | - |
| `BITBUCKET_WORKSPACE` | Bitbucket workspace slug | `augment-solutions` |
| `TARGET_BRANCH` | Branch that triggers indexing | `main` |
| `ALLOWED_REPOS` | Comma-separated list of repos to index (empty = all) | - |
