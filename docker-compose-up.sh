docker compose -f ../cross-repo-demo-core/docker-compose.yml up -d --build
docker compose -f ../cross-repo-demo-product-service/docker-compose.yml up -d --build
docker compose -f ../cross-repo-demo-inventory-service/docker-compose.yml up -d --build
docker compose -f ../cross-repo-demo-catalog-service/docker-compose.yml up -d --build
docker buildx build \
  --build-context ui-components=../cross-repo-demo-ui-components \
  -f ../cross-repo-demo-storefront-web/services/storefront-web/Dockerfile \
  ../cross-repo-demo-storefront-web
docker compose -f ../cross-repo-demo-storefront-web/docker-compose.yml up -d