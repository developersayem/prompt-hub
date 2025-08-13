# Prompt Hub API Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

Or as a cookie (automatically handled by browser):
```
Cookie: accessToken=<your_jwt_token>
```

---

## 🏥 Health Check Endpoints

### GET /health-check
**Description**: Basic health check  
**Auth**: None  
**Response**:
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### GET /health-check/server-status
**Description**: Detailed server status  
**Auth**: None  
**Response**:
```json
{
  "status": "success",
  "data": {
    "uptime": 3600,
    "memory": { "used": 50, "total": 100 },
    "cpu": { "usage": 25 }
  }
}
```

### GET /health-check/ping-me
**Description**: Server ping test  
**Auth**: None  

### GET /health-check/test
**Description**: Deployment statistics  
**Auth**: None  

---

## 👤 User Management Endpoints

### POST /users/register
**Description**: Register a new user  
**Auth**: None  
**Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```
**Response**:
```json
{
  "status": "success",
  "data": {
    "email": "john@example.com",
    "message": "Account created. Please verify your email."
  },
  "message": "Verification code sent to your email"
}
```

### POST /users/login
**Description**: User login  
**Auth**: None  
**Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
**Response**:
```json
{
  "status": "success",
  "data": {
    "user": { "id": "...", "name": "John Doe", "email": "..." },
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

### POST /users/verify
**Description**: Verify email with code  
**Auth**: None  
**Body**:
```json
{
  "email": "john@example.com",
  "code": "123456"
}
```

### POST /users/resend
**Description**: Resend verification code  
**Auth**: None  
**Rate Limited**: Yes  
**Body**:
```json
{
  "email": "john@example.com"
}
```

### GET /users/me
**Description**: Get current user info  
**Auth**: Required  
**Response**:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "credits": 1000
    }
  }
}
```

### GET /users/
**Description**: Get user details  
**Auth**: Required  

### POST /users/logout
**Description**: Logout user  
**Auth**: Required  

### PUT /users/profile
**Description**: Update user profile  
**Auth**: Required  
**Content-Type**: multipart/form-data  
**Body**:
```json
{
  "name": "Updated Name",
  "title": "Developer",
  "bio": "My bio",
  "publicEmail": "public@example.com"
}
```
**Files**: avatar (optional)

### GET /users/profile/:slug
**Description**: Get public user profile  
**Auth**: Required  
**Params**: slug (user slug)

### POST /users/change-password
**Description**: Change user password  
**Auth**: None  
**Body**:
```json
{
  "email": "john@example.com",
  "oldPassword": "oldpass123",
  "newPassword": "newpass123"
}
```

### POST /users/set-password
**Description**: Set password for Google users  
**Auth**: Required  
**Body**:
```json
{
  "newPassword": "newpass123"
}
```

### POST /users/reset-password
**Description**: Reset password  
**Auth**: None  
**Body**:
```json
{
  "email": "john@example.com",
  "password": "newpass123",
  "confirmPassword": "newpass123"
}
```

### POST /users/verify-otp
**Description**: Verify OTP code  
**Auth**: None  
**Rate Limited**: Yes  

### Google OAuth Routes
- **GET /users/google**: Start Google OAuth
- **GET /users/google/callback**: Google OAuth callback

### Two-Factor Authentication
- **POST /users/send-2fa**: Send 2FA code (Auth Required, Rate Limited)
- **POST /users/verify-2fa**: Verify 2FA code (Rate Limited)
- **POST /users/toggle-2fa**: Toggle 2FA on/off (Auth Required, Rate Limited)

---

## 📝 Prompt Management Endpoints

### POST /prompts/create
**Description**: Create a new prompt  
**Auth**: Required  
**Content-Type**: multipart/form-data  
**Body**:
```json
{
  "title": "My Awesome Prompt",
  "description": "Description here",
  "category": "category_id",
  "aiModel": "ai_model_id",
  "tags": ["tag1", "tag2"],
  "price": 10,
  "paymentStatus": "paid"
}
```
**Files**: promptContent (required)

### GET /prompts/
**Description**: Get all prompts with filters  
**Auth**: None  
**Query Params**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `category`: Filter by category
- `aiModel`: Filter by AI model
- `search`: Search term
- `sortBy`: Sort field
- `sortOrder`: asc/desc

**Response**:
```json
{
  "status": "success",
  "data": {
    "prompts": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

### GET /prompts/trending
**Description**: Get trending prompts  
**Auth**: None  

### GET /prompts/my-prompts
**Description**: Get current user's prompts  
**Auth**: Required  

### GET /prompts/:id
**Description**: Get single prompt by ID  
**Auth**: Required  
**Params**: id (prompt ID)

### GET /prompts/slug/:slug
**Description**: Get prompt by slug (public)  
**Auth**: None  
**Params**: slug (prompt slug)

### GET /prompts/user/:slug
**Description**: Get all prompts by user slug  
**Auth**: Required  
**Params**: slug (user slug)

### PUT /prompts/:id
**Description**: Update prompt  
**Auth**: Required  
**Content-Type**: multipart/form-data  
**Params**: id (prompt ID)

### DELETE /prompts/:id
**Description**: Delete prompt  
**Auth**: Required  
**Params**: id (prompt ID)

### POST /prompts/view/:id
**Description**: Increase prompt views  
**Auth**: Required  
**Params**: id (prompt ID)

### Draft Management
- **POST /prompts/save-draft**: Save prompt as draft (Auth Required, Multipart)
- **GET /prompts/drafts**: Get all drafts (Auth Required)
- **PATCH /prompts/drafts/:id/publish**: Publish draft (Auth Required)

### Bookmark Management
- **POST /prompts/bookmarks**: Bookmark prompt (Auth Required)
- **GET /prompts/bookmarks**: Get bookmarked prompts (Auth Required)
- **DELETE /prompts/bookmarks/:id**: Remove bookmark (Auth Required)

### Social Features
- **POST /prompts/like**: Like/unlike prompt (Auth Required)
- **POST /prompts/comment/like**: Like/unlike comment (Auth Required)

### Comment Management
- **POST /prompts/comment**: Create comment (Auth Required)
- **PUT /prompts/comment/:commentId**: Update comment (Auth Required)
- **DELETE /prompts/comment/:commentId**: Delete comment (Auth Required)
- **POST /prompts/comment/reply**: Reply to comment (Auth Required)

### Purchase System
- **GET /prompts/purchase-history**: Get purchase history (Auth Required)
- **POST /prompts/:id/buy**: Buy prompt (Auth Required)

### Reports
- **GET /prompts/reported-prompts**: Get reports against user's prompts (Auth Required)

---

## 💳 Credit System Endpoints

### GET /credits/packages
**Description**: Get available credit packages  
**Auth**: None  
**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "id": "starter",
      "name": "Starter Pack",
      "credits": 500,
      "price": 3.99,
      "popular": false,
      "features": ["500 Credits", "Basic Support", "30 Days Validity"]
    },
    {
      "id": "professional",
      "name": "Professional",
      "credits": 1500,
      "price": 6.99,
      "popular": true,
      "features": ["1,500 Credits", "Priority Support", "60 Days Validity"]
    },
    {
      "id": "unlimited",
      "name": "Unlimited",
      "credits": -1,
      "price": 9.99,
      "duration": 30,
      "features": ["Unlimited Credits", "24/7 Support", "30 Days Duration"]
    }
  ]
}
```

### GET /credits/balance
**Description**: Get user's credit balance and stats  
**Auth**: Required  
**Response**:
```json
{
  "status": "success",
  "data": {
    "currentBalance": 1500,
    "transactions": {
      "signup_bonus": { "total": 1000, "count": 1 },
      "buy_credits": { "total": 500, "count": 1 }
    }
  }
}
```

### GET /credits/transactions
**Description**: Get credit transaction history  
**Auth**: Required  
**Query Params**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `type`: Filter by transaction type

**Response**:
```json
{
  "status": "success",
  "data": {
    "transactions": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

### POST /credits/purchase
**Description**: Purchase credits  
**Auth**: Required  
**Body**:
```json
{
  "packageId": "professional",
  "paymentIntentId": "pi_stripe_payment_intent_id"
}
```
**Response**:
```json
{
  "status": "success",
  "data": {
    "newBalance": 2500,
    "creditsAdded": 1500,
    "transaction": { "id": "...", "amount": 1500, "type": "buy_credits" }
  }
}
```

### Admin Routes
- **POST /credits/admin/adjust**: Adjust user credits (Auth Required, Admin Only)

---

## 📊 Statistics Endpoints

### GET /stats/top-creators
**Description**: Get top creators  
**Auth**: None  

### GET /stats/trending-tags
**Description**: Get trending tags  
**Auth**: None  

### GET /stats/community
**Description**: Get community statistics  
**Auth**: None  

---

## 🏷️ Category Management Endpoints

### GET /categories/
**Description**: Get all categories  
**Auth**: Required  

### POST /categories/create
**Description**: Create new category  
**Auth**: Required  
**Body**:
```json
{
  "name": "Category Name",
  "description": "Category description"
}
```

### DELETE /categories/:id
**Description**: Delete category  
**Auth**: Required  
**Params**: id (category ID)

---

## 🤖 AI Model Management Endpoints

### GET /ai-models/
**Description**: Get all AI models  
**Auth**: Required  

### POST /ai-models/create
**Description**: Create new AI model  
**Auth**: Required  
**Body**:
```json
{
  "name": "GPT-4",
  "description": "OpenAI GPT-4 model"
}
```

### DELETE /ai-models/:id
**Description**: Delete AI model  
**Auth**: Required  
**Params**: id (AI model ID)

---

## 🔔 Notification Settings Endpoints

### PATCH /settings/notifications/toggle-notification
**Description**: Toggle notification setting  
**Auth**: Required  
**Body**:
```json
{
  "type": "email",
  "enabled": true
}
```

### GET /settings/notifications/notification-settings
**Description**: Get notification settings  
**Auth**: Required  

### GET /settings/notifications/notification-histories
**Description**: Get notification history  
**Auth**: Required  

### POST /settings/notifications/reset-notification-settings
**Description**: Reset notification settings to default  
**Auth**: Required  

---

## 🔒 Security & Privacy Endpoints

### GET /settings/security-and-privacy/security-events
**Description**: Get security events  
**Auth**: Required  
**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "type": "LOGIN",
      "message": "User logged in",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "ipAddress": "192.168.1.1"
    }
  ]
}
```

### GET /settings/security-and-privacy/devices
**Description**: Get connected devices  
**Auth**: Required  

### GET /settings/security-and-privacy/devices/:id
**Description**: Logout from specific device  
**Auth**: Required  
**Params**: id (device ID)

---

## 🚨 Report System Endpoints

### POST /reports/
**Description**: Report a post/prompt  
**Auth**: Required  
**Rate Limited**: Yes  
**Body**:
```json
{
  "postId": "prompt_id_here",
  "reason": "spam",
  "description": "This is spam content"
}
```

---

## 📋 Postman Collection Setup

### Environment Variables
Create a Postman environment with these variables:
```
base_url: http://localhost:3000/api/v1
access_token: (will be set after login)
user_id: (will be set after login)
```

### Authentication Setup
1. **Login Request**: Use the login endpoint to get tokens
2. **Set Token**: In the login request's "Tests" tab, add:
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("access_token", response.data.accessToken);
    pm.environment.set("user_id", response.data.user.id);
}
```

3. **Authorization Header**: For protected routes, add:
```
Authorization: Bearer {{access_token}}
```

### Sample Test Requests

#### 1. Register User
```
POST {{base_url}}/users/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

#### 2. Login User
```
POST {{base_url}}/users/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

#### 3. Get Credit Packages
```
GET {{base_url}}/credits/packages
```

#### 4. Get User Balance
```
GET {{base_url}}/credits/balance
Authorization: Bearer {{access_token}}
```

#### 5. Create Prompt
```
POST {{base_url}}/prompts/create
Authorization: Bearer {{access_token}}
Content-Type: multipart/form-data

title: My Test Prompt
description: This is a test prompt
category: category_id_here
aiModel: ai_model_id_here
tags: ["test", "example"]
price: 10
paymentStatus: paid
promptContent: (file upload)
```

---

## 🔧 Error Responses

All endpoints return errors in this format:
```json
{
  "status": "error",
  "message": "Error description",
  "statusCode": 400
}
```

### Common Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests (Rate Limited)
- `500`: Internal Server Error

---

## 📝 Notes

1. **File Uploads**: Use `multipart/form-data` for endpoints with file uploads
2. **Rate Limiting**: Some endpoints have rate limiting (marked in documentation)
3. **Authentication**: JWT tokens are required for most endpoints
4. **Pagination**: List endpoints support pagination with `page` and `limit` parameters
5. **CORS**: Ensure your frontend origin is in the `ALLOWED_ORIGINS` environment variable

This documentation covers all the main endpoints in your Prompt Hub API. Use it as a reference for testing with Postman or integrating with your frontend application.