# Smart Grocery Shopping Assistant - Backend Architecture Document

## 1. Executive Summary

This document outlines the backend architecture for the Smart Grocery Shopping Assistant, a comprehensive grocery management platform. The backend is designed using Node.js/Express.js with MongoDB, following microservices principles and RESTful API design patterns.

## 2. System Architecture Overview

### 2.1 High-Level Architecture
```
Frontend (React.js) → API Gateway → Microservices → Database Layer → External APIs
```

### 2.2 Core Technology Stack
- **Runtime**: Node.js 18.x LTS
- **Framework**: Express.js 4.x
- **Database**: MongoDB 6.x with Mongoose ODM
- **Authentication**: JWT + Refresh Tokens
- **Caching**: Redis 7.x
- **File Storage**: AWS S3 / Cloudinary
- **Message Queue**: Redis Bull Queue
- **Hosting**: Render/Railway (Production), Docker containers

## 3. Database Design

### 3.1 MongoDB Collections Schema

#### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  profile: {
    firstName: String,
    lastName: String,
    householdSize: Number,
    dietaryPreferences: [String], // ['vegetarian', 'gluten-free']
    budgetRange: {
      min: Number,
      max: Number
    },
    primaryStores: [String] // Store IDs
  },
  preferences: {
    notifications: {
      lowStock: Boolean,
      expiry: Boolean,
      deals: Boolean
    },
    measurementUnit: String // 'metric' | 'imperial'
  },
  loyaltyPrograms: [{
    storeId: String,
    programId: String,
    accountNumber: String,
    encryptedCredentials: String
  }],
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date,
  isActive: Boolean
}
```

#### Households Collection
```javascript
{
  _id: ObjectId,
  name: String,
  adminUserId: ObjectId,
  members: [{
    userId: ObjectId,
    role: String, // 'admin' | 'member'
    permissions: [String], // ['edit_lists', 'manage_inventory']
    joinedAt: Date
  }],
  sharedSettings: {
    budgetLimit: Number,
    allowMemberInvites: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### GroceryLists Collection
```javascript
{
  _id: ObjectId,
  householdId: ObjectId,
  createdBy: ObjectId,
  name: String,
  status: String, // 'active' | 'completed' | 'archived'
  items: [{
    _id: ObjectId,
    name: String,
    category: String,
    quantity: Number,
    unit: String,
    priority: String, // 'high' | 'medium' | 'low'
    isCompleted: Boolean,
    completedBy: ObjectId,
    completedAt: Date,
    estimatedPrice: Number,
    actualPrice: Number,
    notes: String,
    addedBy: ObjectId,
    addedAt: Date
  }],
  metadata: {
    estimatedTotal: Number,
    actualTotal: Number,
    estimatedTime: Number, // minutes
    stores: [String] // Store IDs for multi-store trips
  },
  sharedWith: [ObjectId], // User IDs
  createdAt: Date,
  updatedAt: Date,
  completedAt: Date
}
```

#### Inventory Collection
```javascript
{
  _id: ObjectId,
  householdId: ObjectId,
  items: [{
    _id: ObjectId,
    productId: ObjectId, // Reference to Products collection
    name: String,
    category: String,
    currentStock: Number,
    unit: String,
    minStockLevel: Number,
    maxStockLevel: Number,
    averageConsumption: Number, // per week
    locations: [String], // ['pantry', 'fridge', 'freezer']
    expiryDate: Date,
    purchaseDate: Date,
    price: Number,
    barcode: String,
    imageUrl: String,
    lastUpdated: Date,
    updatedBy: ObjectId
  }],
  lowStockAlerts: [{
    itemId: ObjectId,
    alertDate: Date,
    acknowledged: Boolean
  }],
  expiryAlerts: [{
    itemId: ObjectId,
    expiryDate: Date,
    daysUntilExpiry: Number,
    acknowledged: Boolean
  }],
  createdAt: Date,
  updatedAt: Date
}
```

#### Products Collection (Master Product Database)
```javascript
{
  _id: ObjectId,
  name: String,
  brand: String,
  category: String,
  subcategory: String,
  barcode: String (unique),
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    sugar: Number
  },
  allergens: [String],
  averagePrice: Number,
  commonSizes: [String],
  averageShelfLife: Number, // days
  tags: [String], // ['organic', 'gluten-free']
  imageUrl: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Recipes Collection
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  cuisine: String,
  difficulty: String, // 'easy' | 'medium' | 'hard'
  prepTime: Number, // minutes
  cookTime: Number, // minutes
  servings: Number,
  ingredients: [{
    productId: ObjectId,
    name: String,
    quantity: Number,
    unit: String,
    optional: Boolean
  }],
  instructions: [String],
  nutritionalInfo: {
    totalCalories: Number,
    caloriesPerServing: Number
  },
  tags: [String], // ['vegetarian', 'quick', 'healthy']
  imageUrl: String,
  rating: Number,
  reviewCount: Number,
  createdBy: String, // 'system' | 'community'
  isPublic: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Stores Collection
```javascript
{
  _id: ObjectId,
  name: String,
  chain: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  hours: [{
    day: String,
    open: String,
    close: String
  }],
  layout: {
    aisles: [{
      number: Number,
      name: String,
      categories: [String]
    }]
  },
  services: [String], // ['pickup', 'delivery', 'pharmacy']
  loyaltyProgram: {
    name: String,
    apiEndpoint: String,
    supported: Boolean
  },
  averagePrices: [{
    productId: ObjectId,
    price: Number,
    lastUpdated: Date
  }],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### ShoppingTrips Collection
```javascript
{
  _id: ObjectId,
  householdId: ObjectId,
  groceryListId: ObjectId,
  plannedBy: ObjectId,
  status: String, // 'planned' | 'in-progress' | 'completed' | 'cancelled'
  stores: [{
    storeId: ObjectId,
    estimatedTime: Number,
    actualTime: Number,
    estimatedCost: Number,
    actualCost: Number,
    items: [ObjectId], // Item IDs from grocery list
    optimizedRoute: [String] // Aisle order
  }],
  route: {
    startLocation: {
      latitude: Number,
      longitude: Number
    },
    estimatedDuration: Number,
    estimatedDistance: Number,
    transportMode: String // 'driving' | 'walking' | 'transit'
  },
  receipts: [{
    storeId: ObjectId,
    imageUrl: String,
    totalAmount: Number,
    uploadedAt: Date,
    processedItems: [{
      name: String,
      quantity: Number,
      price: Number,
      matchedProductId: ObjectId
    }]
  }],
  startedAt: Date,
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 3.2 Database Indexing Strategy

```javascript
// Users Collection
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "createdAt": 1 })

// GroceryLists Collection
db.grocerylists.createIndex({ "householdId": 1, "status": 1 })
db.grocerylists.createIndex({ "createdBy": 1 })
db.grocerylists.createIndex({ "updatedAt": -1 })

// Inventory Collection
db.inventory.createIndex({ "householdId": 1 })
db.inventory.createIndex({ "items.barcode": 1 })
db.inventory.createIndex({ "items.expiryDate": 1 })

// Products Collection
db.products.createIndex({ "barcode": 1 }, { unique: true })
db.products.createIndex({ "category": 1, "subcategory": 1 })
db.products.createIndex({ "name": "text", "brand": "text" })

// Stores Collection
db.stores.createIndex({ "address.coordinates": "2dsphere" })
db.stores.createIndex({ "chain": 1, "isActive": 1 })
```

## 4. API Architecture

### 4.1 RESTful API Design

#### Base URL Structure
```
Production: https://api.smartgrocery.com/v1
Development: https://dev-api.smartgrocery.com/v1
```

#### API Versioning Strategy
- URL-based versioning: `/v1/`, `/v2/`
- Backward compatibility maintained for 2 major versions
- Deprecation notices 6 months before removal

### 4.2 Authentication & Authorization

#### JWT Token Structure
```javascript
// Access Token (15 minutes expiry)
{
  "userId": "ObjectId",
  "email": "user@example.com",
  "householdId": "ObjectId",
  "role": "admin|member",
  "permissions": ["edit_lists", "manage_inventory"],
  "iat": timestamp,
  "exp": timestamp
}

// Refresh Token (30 days expiry)
{
  "userId": "ObjectId",
  "tokenId": "unique_token_id",
  "iat": timestamp,
  "exp": timestamp
}
```

#### Security Middleware Stack
1. **Rate Limiting**: 100 requests/minute per IP
2. **CORS**: Configured for allowed origins
3. **Helmet**: Security headers
4. **Input Validation**: Joi/Express-validator
5. **SQL Injection Protection**: Mongoose sanitization

### 4.3 API Endpoints Structure

#### Authentication Module (`/auth`)
```
POST   /auth/register          - User registration
POST   /auth/login             - User login
POST   /auth/refresh           - Refresh access token
POST   /auth/logout            - User logout
POST   /auth/forgot-password   - Password reset request
POST   /auth/reset-password    - Password reset confirmation
GET    /auth/verify-email      - Email verification
```

#### Users Module (`/users`)
```
GET    /users/profile          - Get user profile
PUT    /users/profile          - Update user profile
GET    /users/preferences      - Get user preferences
PUT    /users/preferences      - Update user preferences
DELETE /users/account          - Delete user account
GET    /users/household        - Get household info
POST   /users/invite           - Invite household member
```

#### Grocery Lists Module (`/lists`)
```
GET    /lists                  - Get all lists for household
POST   /lists                  - Create new grocery list
GET    /lists/:id              - Get specific list
PUT    /lists/:id              - Update list
DELETE /lists/:id              - Delete list
POST   /lists/:id/items        - Add items to list
PUT    /lists/:id/items/:itemId - Update list item
DELETE /lists/:id/items/:itemId - Remove item from list
POST   /lists/:id/share        - Share list with users
GET    /lists/:id/suggestions  - Get smart suggestions
```

#### Inventory Module (`/inventory`)
```
GET    /inventory              - Get household inventory
POST   /inventory/items        - Add items to inventory
PUT    /inventory/items/:id    - Update inventory item
DELETE /inventory/items/:id    - Remove item from inventory
POST   /inventory/scan         - Add item via barcode scan
POST   /inventory/receipt      - Process receipt scan
GET    /inventory/alerts       - Get low stock/expiry alerts
PUT    /inventory/alerts/:id   - Acknowledge alert
GET    /inventory/analytics    - Get inventory analytics
```

#### Products Module (`/products`)
```
GET    /products               - Search products
GET    /products/:id           - Get product details
POST   /products               - Create new product (admin)
PUT    /products/:id           - Update product (admin)
GET    /products/barcode/:code - Get product by barcode
GET    /products/suggestions   - Get product suggestions
```

#### Recipes Module (`/recipes`)
```
GET    /recipes                - Get recipes with filters
GET    /recipes/:id            - Get recipe details
GET    /recipes/suggestions    - Get personalized recipe suggestions
POST   /recipes/:id/to-list    - Add recipe ingredients to list
GET    /recipes/possible       - Get recipes from available ingredients
```

#### Stores Module (`/stores`)
```
GET    /stores                 - Get stores by location
GET    /stores/:id             - Get store details
GET    /stores/:id/layout      - Get store layout/aisles
GET    /stores/nearby          - Get nearby stores
GET    /stores/:id/prices      - Get store prices for items
```

#### Shopping Module (`/shopping`)
```
POST   /shopping/trips         - Plan shopping trip
GET    /shopping/trips/:id     - Get trip details
PUT    /shopping/trips/:id     - Update trip status
POST   /shopping/route         - Optimize shopping route
GET    /shopping/deals         - Get available deals/coupons
POST   /shopping/deals/apply   - Apply deals to list
```

#### Analytics Module (`/analytics`)
```
GET    /analytics/dashboard    - Get dashboard metrics
GET    /analytics/spending     - Get spending analytics
GET    /analytics/waste        - Get food waste metrics
GET    /analytics/savings      - Get savings from deals
GET    /analytics/trends       - Get shopping trends
```

## 5. Service Architecture

### 5.1 Microservices Structure

#### Core Services
1. **Authentication Service** (`auth-service`)
   - User registration/login
   - JWT token management
   - Password reset functionality

2. **User Management Service** (`user-service`)
   - Profile management
   - Household management
   - Preferences handling

3. **Grocery List Service** (`list-service`)
   - CRUD operations for lists
   - Real-time collaboration
   - Smart suggestions

4. **Inventory Service** (`inventory-service`)
   - Stock tracking
   - Expiry monitoring
   - Consumption analytics

5. **Product Service** (`product-service`)
   - Product catalog management
   - Barcode resolution
   - Price tracking

6. **Recipe Service** (`recipe-service`)
   - Recipe recommendations
   - Ingredient matching
   - Meal planning

7. **Store Service** (`store-service`)
   - Store information
   - Layout management
   - Price comparisons

8. **Shopping Service** (`shopping-service`)
   - Trip planning
   - Route optimization
   - Deal integration

9. **Notification Service** (`notification-service`)
   - Alert management
   - Email/SMS notifications
   - Push notifications

10. **Analytics Service** (`analytics-service`)
    - Usage metrics
    - Spending analysis
    - Recommendation engine

### 5.2 External API Integrations

#### Google Maps API Integration
```javascript
// Route Optimization Service
class RouteOptimizationService {
  async optimizeMultiStoreRoute(startLocation, stores, preferences) {
    // Implementation for multi-store route optimization
  }
  
  async getStoreDirections(origin, destination, mode) {
    // Get directions between locations
  }
}
```

#### Barcode Scanner API Integration
```javascript
// Barcode Resolution Service
class BarcodeService {
  async resolveBarcode(barcodeValue) {
    // Try internal product database first
    // Fallback to external APIs (UPC Database, Open Food Facts)
  }
}
```

#### Loyalty Program APIs
```javascript
// Loyalty Integration Service
class LoyaltyService {
  async connectProgram(userId, storeId, credentials) {
    // Secure credential storage and API integration
  }
  
  async fetchDeals(userId, storeId) {
    // Fetch personalized deals and coupons
  }
}
```

## 6. Data Flow Architecture

### 6.1 Real-time Collaboration Flow
```
User Action → WebSocket Server → Database Update → Broadcast to Household Members
```

### 6.2 Inventory Update Flow
```
Barcode Scan → Product Resolution → Inventory Update → Stock Level Check → Notifications
```

### 6.3 Smart Suggestions Flow
```
User Behavior → ML Analytics → Recommendation Engine → Personalized Suggestions
```

## 7. Caching Strategy

### 7.1 Redis Cache Implementation
```javascript
// Cache Keys Structure
const CACHE_KEYS = {
  USER_PROFILE: 'user:profile:{userId}',
  GROCERY_LIST: 'list:{listId}',
  STORE_LAYOUT: 'store:layout:{storeId}',
  PRODUCT_INFO: 'product:{barcode}',
  DEALS: 'deals:{storeId}:{userId}',
  ROUTE: 'route:{hash}'
};

// Cache TTL Settings
const CACHE_TTL = {
  USER_PROFILE: 3600,      // 1 hour
  GROCERY_LIST: 1800,      // 30 minutes
  STORE_LAYOUT: 86400,     // 24 hours
  PRODUCT_INFO: 604800,    // 7 days
  DEALS: 7200,             // 2 hours
  ROUTE: 3600              // 1 hour
};
```

### 7.2 Cache Invalidation Strategy
- Time-based expiration for static data
- Event-driven invalidation for dynamic data
- Write-through caching for frequently accessed data

## 8. Error Handling & Logging

### 8.1 Error Response Format
```javascript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### 8.2 Logging Strategy
```javascript
// Winston Logger Configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'grocery-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console()
  ]
});
```

## 9. Testing Strategy

### 9.1 Testing Pyramid
1. **Unit Tests** (70%)
   - Service layer logic
   - Utility functions
   - Data transformations

2. **Integration Tests** (20%)
   - API endpoint testing
   - Database operations
   - External API integration

3. **End-to-End Tests** (10%)
   - Critical user journeys
   - Cross-service workflows

### 9.2 Testing Tools
- **Jest**: Unit testing framework
- **Supertest**: API testing
- **MongoDB Memory Server**: Database testing
- **Nock**: External API mocking

## 10. Performance Optimization

### 10.1 Database Optimization
- Connection pooling (10-20 connections)
- Query optimization with proper indexing
- Aggregation pipeline for complex queries
- Read replicas for analytics queries

### 10.2 API Performance
- Response compression (gzip)
- Request/response caching
- Database query optimization
- Lazy loading for large datasets
- Pagination for list endpoints

### 10.3 Monitoring & Metrics
```javascript
// Performance Metrics
const metrics = {
  apiResponseTime: 'avg < 200ms',
  databaseQueryTime: 'avg < 100ms',
  errorRate: '< 1%',
  uptime: '99.9%',
  memoryUsage: '< 512MB',
  cpuUsage: '< 70%'
};
```

## 11. Security Implementation

### 11.1 Data Protection
- Password hashing with bcrypt (12 rounds)
- Sensitive data encryption at rest
- HTTPS enforcement
- Input sanitization and validation
- SQL injection prevention

### 11.2 API Security
- Rate limiting per endpoint
- Request size limits
- CORS configuration
- Authentication required for all endpoints
- Role-based access control

### 11.3 Privacy Compliance
- GDPR compliance for EU users
- Data anonymization for analytics
- User consent management
- Right to deletion implementation

## 12. Deployment Architecture

### 12.1 Production Environment
```yaml
# Docker Compose Production Setup
version: '3.8'
services:
  api:
    image: smartgrocery/api:latest
    replicas: 3
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - REDIS_URI=${REDIS_URI}
    ports:
      - "3000:3000"
  
  mongodb:
    image: mongo:6.0
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${DB_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=${DB_PASSWORD}
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
```

### 12.2 CI/CD Pipeline
1. **Development**: Feature branches → PR review
2. **Staging**: Auto-deploy to staging environment
3. **Production**: Manual approval → Blue-green deployment
4. **Monitoring**: Health checks and rollback capabilities

## 13. Scalability Considerations

### 13.1 Horizontal Scaling Strategy
- Stateless API design
- Database sharding by household_id
- Load balancer configuration
- Auto-scaling based on CPU/memory metrics

### 13.2 Future Architecture Evolution
- Microservices containerization with Kubernetes
- Event-driven architecture with message queues
- CQRS pattern for read/write separation
- GraphQL API for flexible frontend queries

## 14. Maintenance & Monitoring

### 14.1 Health Check Endpoints
```javascript
// Health Check Implementation
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      redis: 'connected',
      external_apis: 'operational'
    },
    version: process.env.APP_VERSION
  };
  res.status(200).json(health);
});
```

### 14.2 Monitoring Stack
- **Application**: New Relic / DataDog
- **Infrastructure**: Prometheus + Grafana
- **Logs**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Alerts**: PagerDuty integration

This backend architecture provides a solid foundation for the Smart Grocery Shopping Assistant, designed to handle the complexity of grocery management while maintaining performance, security, and scalability.