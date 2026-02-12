cd ..

# Check required environment variables
if [ -z "$AUGMENT_API_TOKEN" ]; then
    echo "Error: AUGMENT_API_TOKEN is not set"
    exit 1
fi

if [ -z "$AUGMENT_API_URL" ]; then
    echo "Error: AUGMENT_API_URL is not set"
    exit 1
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN is not set"
    exit 1
fi

echo "Installing Context Connectors and dependencies..."
# installing context connectors
npm install @augmentcode/context-connectors
# dependency needed for GitHub
npm install @octokit/rest

echo "Indexing repositories..."
npx ctxc index github --owner augment-solutions --repo cross-repo-demo-core -i cross-repo-demo-core
npx ctxc index github --owner augment-solutions --repo cross-repo-demo-product-service -i cross-repo-demo-product-service
npx ctxc index github --owner augment-solutions --repo cross-repo-demo-catalog-service -i cross-repo-demo-catalog-service
npx ctxc index github --owner augment-solutions --repo cross-repo-demo-inventory-service -i cross-repo-demo-inventory-service
npx ctxc index github --owner augment-solutions --repo cross-repo-demo-ui-components -i cross-repo-demo-ui-components
npx ctxc index github --owner augment-solutions --repo cross-repo-demo-storefront-web -i cross-repo-demo-storefront-web
npx ctxc index github --owner augment-solutions --repo cross-repo-demo-admin-dashboard -i cross-repo-demo-admin-dashboard