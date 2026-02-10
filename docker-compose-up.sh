docker compose -f ../cross-repo-demo-core/docker-compose.yml up -d
docker compose -f ../cross-repo-demo-product-service/docker-compose.yml up -d
docker compose -f ../cross-repo-demo-inventory-service/docker-compose.yml up -d
docker compose -f ../cross-repo-demo-catalog-service/docker-compose.yml up -d
docker compose -f ../cross-repo-demo-storefront-web/docker-compose.yml up -d