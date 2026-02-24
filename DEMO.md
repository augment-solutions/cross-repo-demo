# Cross-Repo Context Demo: E-Commerce Microservices Platform

This demo showcases how Augment's Context Engine can seamlessly work across a multi-repository codebase, enabling developers to:
- **Search across repositories** - Find code, patterns, and implementations across all services
- **Understand cross-service dependencies** - Navigate between services written in different languages
- **Maintain consistency** - Discover similar patterns and implementations across the platform
- **Accelerate development** - Quickly locate relevant code regardless of which repo it lives in

## Steps

### 1. Clone the `cross-repo-demo-product-service` repository:
```sh
git clone https://github.com/augment-solutions/cross-repo-demo.git
```

### 2. Add the Remote MCP server in your IDE or CLI:
```sh
auggie mcp add cross-repo-search-remote --transport http https://api.augmentcode.com/mcp
```

### 3. Authenticate the MCP server:
- Run `auggie`
- List the configured MCP servers: `/mcp`
- Select the `cross-repo-search-remote` server
- Select **Authenticate**, then complete the browser login.

### 4. Apply changes to the `product-service`:
- Copy the [product-service-changes.patch](https://raw.githubusercontent.com/augment-solutions/cross-repo-demo/refs/heads/main/product-service-changes.patch) file and apply it to the `product-service`:
```sh
wget https://raw.githubusercontent.com/augment-solutions/cross-repo-demo/refs/heads/main/product-service-changes.patch
git apply product-service-changes.patch
```

### 5. **Main demo** — Show how API changes impact dependent services:
In the IDE or CLI, open the `product-service` repo and enter the following prompt: 
```
What services could be impacted by changes to the product API?
```
It should return a response that there is impact to the `storefront-web` and `admin-dashboard` services, even though these repos are not present in the workspace (or even present on the local machine). This shows how Augment's Context Engine can understand the impact of changes across repositories.

### 6. Other demos:

#### What services are using this component?
- Clone the [ui-components](https://github.com/augment-solutions/cross-repo-demo-ui-components) repo: `git clone https://github.com/augment-solutions/cross-repo-demo-ui-components.git`
- In the IDE or CLI, use the following prompt: *Which frontends are using the ProductCard component?*

#### Data-flow from service to service?
- Clone the [storefront-web](https://github.com/augment-solutions/cross-repo-demo-storefront-web) repo: `git clone https://github.com/augment-solutions/cross-repo-demo-storefront-web.git`
- In the IDE or CLI, use the following prompt: *How is data flowing from the backend services all the way to the ProductCard component in the frontend?*
