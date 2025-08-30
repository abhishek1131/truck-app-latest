# TruxkToK API Documentation

## Overview
The TruxkToK API provides RESTful endpoints for managing truck inventory, orders, and user operations. All endpoints require authentication and implement role-based access control.

## Authentication

### Login
\`\`\`http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com" },
    "profile": { "role": "admin", "first_name": "John" },
    "session": { "access_token": "...", "expires_at": "..." }
  }
}
\`\`\`

## Admin APIs

### Dashboard Statistics
\`\`\`http
GET /api/admin/dashboard
Authorization: Bearer <token>
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "totalUsers": 25,
    "totalTrucks": 12,
    "totalOrders": 150,
    "pendingOrders": 8,
    "totalRevenue": 45000.00,
    "activeUsers": 20,
    "trucksInService": 10,
    "lowStockItems": 15
  }
}
\`\`\`

### User Management

#### Get Users
\`\`\`http
GET /api/admin/users?page=1&limit=10&role=technician
Authorization: Bearer <token>
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "tech@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "technician",
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
\`\`\`

#### Create User
\`\`\`http
POST /api/admin/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "technician",
  "phone": "+1234567890"
}
\`\`\`

### Truck Management

#### Get Trucks
\`\`\`http
GET /api/admin/trucks?page=1&limit=10&status=active
Authorization: Bearer <token>
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "truck_number": "TRK-001",
      "make": "Ford",
      "model": "Transit 350",
      "year": 2023,
      "status": "active",
      "assigned_to": "uuid",
      "assigned_user": {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com"
      }
    }
  ]
}
\`\`\`

#### Create Truck
\`\`\`http
POST /api/admin/trucks
Authorization: Bearer <token>
Content-Type: application/json

{
  "truck_number": "TRK-002",
  "make": "Ford",
  "model": "Transit 250",
  "year": 2024,
  "license_plate": "ABC-123",
  "vin": "1FTBW2CM8HKA12345"
}
\`\`\`

#### Assign Truck
\`\`\`http
PUT /api/admin/trucks/{truckId}/assign
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "technician-uuid"
}
\`\`\`

### Order Management

#### Get All Orders
\`\`\`http
GET /api/admin/orders?page=1&limit=10&status=pending&technician_id=uuid
Authorization: Bearer <token>
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "order_number": "20240101-001",
      "status": "pending",
      "priority": "high",
      "total_amount": 250.00,
      "technician": {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com"
      },
      "truck": {
        "truck_number": "TRK-001",
        "make": "Ford",
        "model": "Transit 350"
      },
      "order_items": [
        {
          "id": "uuid",
          "quantity": 5,
          "unit_price": 25.00,
          "total_price": 125.00,
          "item": {
            "name": "Copper Pipe 1/2\"",
            "part_number": "PLB-001"
          },
          "bin": {
            "bin_code": "A1-B2-S3",
            "name": "Main Storage"
          }
        }
      ]
    }
  ]
}
\`\`\`

#### Confirm Order
\`\`\`http
PUT /api/admin/orders/{orderId}/confirm
Authorization: Bearer <token>
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "confirmed",
    "confirmed_by": "admin-uuid",
    "confirmed_at": "2024-01-01T12:00:00Z"
  }
}
\`\`\`

## Technician APIs

### Order Management

#### Get My Orders
\`\`\`http
GET /api/technician/orders?page=1&limit=10&status=pending
Authorization: Bearer <token>
\`\`\`

**Response:** Same format as admin orders but filtered to current technician

#### Create Order
\`\`\`http
POST /api/technician/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderData": {
    "truck_id": "truck-uuid",
    "priority": "medium",
    "notes": "Urgent repair needed",
    "requested_delivery_date": "2024-01-15"
  },
  "items": [
    {
      "item_id": "item-uuid",
      "bin_id": "bin-uuid",
      "quantity": 3,
      "unit_price": 25.00,
      "notes": "For main line repair"
    }
  ]
}
\`\`\`

### Inventory Management

#### Get Truck Inventory
\`\`\`http
GET /api/technician/inventory/{truckId}
Authorization: Bearer <token>
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "quantity": 15,
      "min_quantity": 5,
      "max_quantity": 50,
      "last_restocked": "2024-01-01T00:00:00Z",
      "item": {
        "name": "Copper Pipe 1/2\"",
        "part_number": "PLB-001",
        "unit_price": 3.50
      },
      "bin": {
        "bin_code": "A1-B2-S3",
        "name": "Main Storage"
      }
    }
  ]
}
\`\`\`

#### Update Inventory Quantity
\`\`\`http
PUT /api/technician/inventory/{inventoryId}/quantity
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 12,
  "action": "used", // or "restocked"
  "notes": "Used for job #12345"
}
\`\`\`

## Common Response Formats

### Success Response
\`\`\`json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully"
}
\`\`\`

### Error Response
\`\`\`json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
\`\`\`

### Paginated Response
\`\`\`json
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
\`\`\`

## Status Codes

- **200 OK**: Successful GET, PUT requests
- **201 Created**: Successful POST requests
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

## Rate Limiting

- **Authenticated requests**: 1000 requests per hour
- **Unauthenticated requests**: 100 requests per hour
- **Admin operations**: 2000 requests per hour

## Error Codes

- **AUTH_REQUIRED**: Authentication token required
- **INVALID_TOKEN**: Invalid or expired token
- **INSUFFICIENT_PERMISSIONS**: User lacks required permissions
- **VALIDATION_ERROR**: Request data validation failed
- **RESOURCE_NOT_FOUND**: Requested resource not found
- **DUPLICATE_RESOURCE**: Resource already exists
- **BUSINESS_RULE_VIOLATION**: Business logic constraint violated

## Webhooks (Future Enhancement)

### Order Status Changes
\`\`\`http
POST {webhook_url}
Content-Type: application/json

{
  "event": "order.status_changed",
  "data": {
    "order_id": "uuid",
    "old_status": "pending",
    "new_status": "confirmed",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
\`\`\`

### Low Stock Alerts
\`\`\`http
POST {webhook_url}
Content-Type: application/json

{
  "event": "inventory.low_stock",
  "data": {
    "truck_id": "uuid",
    "item_id": "uuid",
    "current_quantity": 2,
    "min_quantity": 5,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
\`\`\`

This API documentation provides comprehensive coverage of all available endpoints with proper authentication, error handling, and response formats for the TruxkToK system.
