# Cross-Repo Context Demo: E-Commerce Microservices Platform

An example e-commerce application built with a microservices architecture, demonstrating **Augment's Context Engine** and its ability to index and search across multiple repositories.

## 🎯 Purpose

This demo showcases how Augment's Context Engine can seamlessly work across a multi-repository codebase, enabling developers to:
- **Search across repositories** - Find code, patterns, and implementations across all services
- **Understand cross-service dependencies** - Navigate between services written in different languages
- **Maintain consistency** - Discover similar patterns and implementations across the platform
- **Accelerate development** - Quickly locate relevant code regardless of which repo it lives in

## 🏗️ Architecture

The platform consists of **5 separate repositories**, each representing a different microservice or component:

### 1. **cross-repo-demo-core** (TypeScript/Node.js)
Core infrastructure and shared services
- **API Gateway** - Request routing, rate limiting, authentication, and service orchestration
- **PostgreSQL** - Shared database infrastructure (16-alpine)
- **Redis** - Caching and event streaming (7-alpine)
- **Port**: 8064

### 2. **cross-repo-demo-product-service** (TypeScript/Node.js)
Product catalog and management
- **Framework**: Express.js with Prisma ORM
- **Features**: Product CRUD, search, caching with Redis
- **Events**: Publishes product events to Redis Streams
- **Port**: 8010

### 3. **cross-repo-demo-catalog-service** (Go)
Advanced catalog features with full-text search
- **Framework**: Gin with GORM
- **Features**: Products, categories, brands, variants, media, attributes
- **Search**: Full-text search with PostgreSQL
- **Import/Export**: Bulk operations and data migration
- **Port**: 8080

### 4. **cross-repo-demo-inventory-service** (Rust)
Stock management and inventory operations
- **Framework**: Actix-web with Diesel ORM
- **Features**: Stock reservations, inventory tracking, low stock alerts
- **Events**: Publishes inventory events to Redis Streams
- **Port**: 8004

### 5. **cross-repo-demo-storefront-web** (TypeScript/Next.js)
Customer-facing e-commerce storefront
- **Framework**: Next.js 14 with App Router
- **UI**: React with Tailwind CSS and shared UI components
- **Features**: Product browsing, cart, checkout, user accounts, wishlist
- **Port**: 3000

## 🛠️ Technology Stack

| Service | Language | Framework | Database | Key Libraries |
|---------|----------|-----------|----------|---------------|
| API Gateway | TypeScript | Express.js | Redis | http-proxy-middleware, ioredis |
| Product Service | TypeScript | Express.js | PostgreSQL | Prisma, ioredis |
| Catalog Service | Go | Gin | PostgreSQL | GORM, go-redis |
| Inventory Service | Rust | Actix-web | PostgreSQL | Diesel, redis-rs |
| Storefront Web | TypeScript | Next.js 14 | - | React, Tailwind CSS |

**Shared Infrastructure:**
- PostgreSQL 16 (multi-database setup)
- Redis 7 (caching + event streaming)
- OpenTelemetry (distributed tracing)
- Docker & Docker Compose

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Running the Platform

1. **Clone all repositories** (if not already in workspace):
```bash
# All repos should be in the same parent directory
ls
# cross-repo-demo/
# cross-repo-demo-core/
# cross-repo-demo-product-service/
# cross-repo-demo-catalog-service/
# cross-repo-demo-inventory-service/
# cross-repo-demo-storefront-web/
```

2. **Start all services**:
```bash
cd cross-repo-demo
./docker-compose-up.sh
```

This script starts services in the correct order:
- Core infrastructure (PostgreSQL, Redis, API Gateway)
- Product Service
- Inventory Service
- Catalog Service
- Storefront Web

3. **Access the application**:
- **Storefront**: http://localhost:3000
- **API Gateway**: http://localhost:8064
- **Catalog Service**: http://localhost:8080
- **Product Service**: http://localhost:8010
- **Inventory Service**: http://localhost:8004

4. **Stop all services**:
```bash
cd cross-repo-demo
./docker-compose-down.sh
```

## 📡 API Endpoints

### API Gateway (Port 8064)
Routes requests to appropriate microservices:
- `/api/products` → Product Service
- `/api/v1/products` → Catalog Service
- `/api/v1/categories` → Catalog Service
- `/api/inventory` → Inventory Service
- `/api/cart`, `/api/orders`, `/api/auth` → (Placeholder routes)

### Catalog Service (Port 8080)
- `GET /api/v1/products` - List products with filtering
- `POST /api/v1/products` - Create product
- `GET /api/v1/products/:id` - Get product details
- `GET /api/v1/categories` - List categories
- `GET /api/v1/search` - Full-text search
- `POST /api/v1/import` - Bulk import
- `GET /api/v1/export` - Export catalog data

### Product Service (Port 8010)
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `GET /api/products/search` - Search products

### Inventory Service (Port 8004)
- `POST /api/v1/inventory/reserve` - Reserve stock
- `POST /api/v1/inventory/release` - Release reservation
- `GET /api/v1/inventory/:productId` - Get inventory levels
- `PUT /api/v1/inventory/:productId` - Update inventory
- `GET /api/v1/products` - List products with inventory
