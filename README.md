# Smart Grocery Shopping Assistant

A comprehensive grocery management platform designed to streamline grocery planning, shopping, and inventory management.

## Project Overview

The Smart Grocery Shopping Assistant is a full-stack web application that helps users manage their grocery shopping experience efficiently. It provides features for creating intelligent shopping lists, tracking household inventory, receiving personalized recommendations, optimizing shopping routes, and integrating with loyalty programs.

## Features

- **User Authentication & Profile Management**
  - Email/password and social login options
  - Household management with shared access
  - Preference settings for dietary needs and budget

- **Intelligent Grocery Lists**
  - Create, edit, and share shopping lists
  - Smart suggestions based on purchase history
  - Real-time collaboration with household members

- **Household Inventory Tracking**
  - Barcode scanning for easy item addition
  - Stock level monitoring and expiry tracking
  - Low stock and expiry notifications

- **Personalized Recommendations**
  - Smart item suggestions based on usage patterns
  - Recipe recommendations using available ingredients
  - Budget-friendly alternatives

- **Optimized Shopping Routes**
  - Multi-store trip planning
  - Aisle-based navigation
  - Store-specific layout optimization

- **Loyalty & Rewards Integration**
  - Connect store loyalty programs
  - Automatic coupon matching
  - Deal notifications

## Technology Stack

### Frontend
- React.js
- Redux for state management
- Material-UI for component library
- Axios for API requests

### Backend
- Node.js 18.x LTS
- Express.js 4.x framework
- MongoDB 6.x with Mongoose ODM
- JWT authentication
- Redis for caching

### External Services
- Google Maps API for route optimization
- Barcode scanning API
- Loyalty program APIs

## Project Structure

The project follows a microservices architecture with the following components:

```
Smart_Grocery_Shopping_Assistant/
├── frontend/                # React frontend application
├── backend/                 # Node.js/Express backend services
│   ├── auth-service/        # Authentication service
│   ├── user-service/        # User management service
│   ├── list-service/        # Grocery list service
│   ├── inventory-service/   # Inventory tracking service
│   ├── product-service/     # Product catalog service
│   ├── recipe-service/      # Recipe recommendations service
│   ├── store-service/       # Store information service
│   ├── shopping-service/    # Shopping trip planning service
│   ├── notification-service/# Alert management service
│   └── analytics-service/   # Usage metrics service
└── docs/                    # Project documentation
```

## Getting Started

### Prerequisites
- Node.js 18.x or higher
- MongoDB 6.x
- Redis 7.x

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/Smart_Grocery_Shopping_Assistant.git
   cd Smart_Grocery_Shopping_Assistant
   ```

2. Set up the backend services
   ```bash
   cd backend
   npm install
   # Configure environment variables
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Set up the frontend application
   ```bash
   cd ../frontend
   npm install
   # Configure environment variables
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start MongoDB and Redis
   ```bash
   # Using Docker (recommended)
   docker-compose up -d mongodb redis
   # Or use your local installations
   ```

5. Start the development servers
   ```bash
   # Start backend services
   cd ../backend
   npm run dev
   
   # In a new terminal, start frontend
   cd ../frontend
   npm start
   ```

The application should now be running at http://localhost:3000

## Development Roadmap

1. **Phase 1**: Core functionality - Authentication, User Profiles, Basic List Management
2. **Phase 2**: Inventory Tracking and Product Catalog
3. **Phase 3**: Recipe Recommendations and Smart Suggestions
4. **Phase 4**: Shopping Route Optimization
5. **Phase 5**: Loyalty Program Integration

## Contributing

Contribution guidelines will be provided once the initial project setup is complete.

## License

This project is licensed under the MIT License.