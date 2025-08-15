# Device Management System Documentation

## Overview
The device management system allows users to:
- View all connected devices (max 3 devices)
- Logout from specific devices remotely
- Logout from all other devices
- Track device usage and security events
- Automatic device limit enforcement

## Features Implemented

### ✅ **Device Tracking**
- Unique device fingerprinting
- Session token management
- Device type detection (mobile/desktop/tablet)
- Trust level calculation
- Login count tracking

### ✅ **Device Limits**
- Maximum 3 active devices per user
- Automatic logout of oldest device when limit exceeded
- Real-time device session validation

### ✅ **Security Features**
- Device-based security events logging
- Suspicious device detection
- Force logout capabilities
- Session invalidation

## API Endpoints

### Device Management

#### GET /settings/security-and-privacy/devices
**Description**: Get all connected devices  
**Auth**: Required  
**Response**:
```json
{
  "status": "success",
  "data": {
    "devices": [
      {
        "id": "675a1b2c3d4e5f6789012345",
        "deviceName": "Chrome on Windows",
        "os": "Windows 10",
        "browser": "Chrome 120.0",
        "location": "New York, US",
        "lastActive": "2024-01-01T12:00:00.000Z",
        "isCurrent": true,
        "deviceType": "desktop",
        "trustLevel": "high",
        "loginCount": 15,
        "isActive": true
      },
      {
        "id": "675a1b2c3d4e5f6789012346",
        "deviceName": "Safari on iPhone",
        "os": "iOS 17.0",
        "browser": "Safari 17.0",
        "location": "Los Angeles, US",
        "lastActive": "2024-01-01T10:30:00.000Z",
        "isCurrent": false,
        "deviceType": "mobile",
        "trustLevel": "medium",
        "loginCount": 8,
        "isActive": true
      }
    ],
    "totalDevices": 2,
    "maxDevices": 3
  },
  "message": "Connected devices fetched successfully"
}
```

#### GET /settings/security-and-privacy/devices/stats
**Description**: Get device statistics  
**Auth**: Required  
**Response**:
```json
{
  "status": "success",
  "data": {
    "activeDevices": 2,
    "totalDevices": 5,
    "maxDevices": 3,
    "availableSlots": 1,
    "recentLogins": [
      {
        "deviceName": "Chrome on Windows",
        "lastActive": "2024-01-01T12:00:00.000Z",
        "location": "New York, US",
        "deviceType": "desktop"
      }
    ]
  },
  "message": "Device statistics fetched successfully"
}
```

#### DELETE /settings/security-and-privacy/devices/:id
**Description**: Logout from specific device  
**Auth**: Required  
**Params**: 
- `id`: Device ID to logout

**Response**:
```json
{
  "status": "success",
  "data": {
    "deviceName": "Safari on iPhone",
    "loggedOutAt": "2024-01-01T12:15:00.000Z"
  },
  "message": "Device logged out successfully"
}
```

#### POST /settings/security-and-privacy/devices/logout-all
**Description**: Logout from all other devices except current  
**Auth**: Required  
**Headers** (Optional):
- `X-Device-ID`: Current device ID to keep active

**Response**:
```json
{
  "status": "success",
  "data": {
    "loggedOutDevices": 2,
    "message": "Successfully logged out from 2 other devices"
  },
  "message": "All other devices logged out successfully"
}
```

### Security Events

#### GET /settings/security-and-privacy/security-events
**Description**: Get security events with pagination  
**Auth**: Required  
**Query Params**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response**:
```json
{
  "status": "success",
  "data": {
    "events": [
      {
        "type": "NEW_DEVICE_LOGIN",
        "action": "LOGIN",
        "message": "Logged in from a new device: Chrome on Windows",
        "ip": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "location": "New York, US",
        "createdAt": "2024-01-01T12:00:00.000Z"
      },
      {
        "type": "DEVICE_LOGOUT",
        "action": "LOGOUT",
        "message": "Device logged out: Safari on iPhone",
        "ip": "192.168.1.101",
        "location": "Los Angeles, US",
        "createdAt": "2024-01-01T11:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "pages": 2
    }
  },
  "message": "Security events fetched successfully"
}
```

## Device Types & Trust Levels

### Device Types
- **desktop**: Windows, macOS, Linux
- **mobile**: Android, iOS
- **tablet**: iPad, Android tablets
- **unknown**: Unrecognized devices

### Trust Levels
- **high**: 10+ logins, 7+ days old
- **medium**: 3+ logins, 1+ days old  
- **low**: New or infrequently used devices

## Security Event Types

| Event Type | Description |
|------------|-------------|
| `NEW_DEVICE_LOGIN` | First login from a new device |
| `DEVICE_LOGIN` | Login from known device |
| `DEVICE_LOGOUT` | Manual device logout |
| `DEVICE_LOGOUT_ALL` | Logout all devices action |
| `DEVICE_FORCE_LOGOUT` | Automatic logout due to device limit |

## Implementation Details

### Device Fingerprinting
Devices are identified using:
- IP address
- User agent string
- Operating system
- Browser information
- Device name

### Session Management
- Each login generates a unique session token
- Session tokens are used for device validation
- Tokens are invalidated on logout
- Automatic cleanup of expired sessions

### Device Limit Enforcement
1. Check active device count on login
2. If limit exceeded (3 devices):
   - Find oldest device by `lastActive`
   - Mark as inactive and remove session
   - Log security event
3. Allow new device login

### Database Schema

#### ConnectedDevice Model
```typescript
{
  userId: ObjectId,           // User reference
  ip: String,                 // IP address
  userAgent: String,          // Full user agent
  deviceName: String,         // Friendly device name
  os: String,                 // Operating system
  browser: String,            // Browser info
  location: String,           // Geographic location
  isCurrent: Boolean,         // Currently active session
  isActive: Boolean,          // Device is active
  lastActive: Date,           // Last activity timestamp
  sessionToken: String,       // Unique session identifier
  deviceFingerprint: String,  // Unique device hash
  loginCount: Number,         // Number of logins
  createdAt: Date,           // First login date
  updatedAt: Date            // Last update
}
```

## Frontend Integration

### Headers to Include
```javascript
// For device session validation
headers: {
  'X-Session-Token': 'user_session_token',
  'X-Device-ID': 'device_id'
}
```

### Login Response
```json
{
  "user": {...},
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token",
  "deviceInfo": {
    "deviceId": "675a1b2c3d4e5f6789012345",
    "deviceName": "Chrome on Windows",
    "sessionToken": "session_token_here"
  }
}
```

## Testing with Postman

### 1. Login and Get Device Info
```
POST /api/v1/users/login
{
  "email": "user@example.com",
  "password": "password123"
}

Response headers will include:
X-Device-ID: 675a1b2c3d4e5f6789012345
X-Session-Token: abc123...
```

### 2. Get Connected Devices
```
GET /api/v1/settings/security-and-privacy/devices
Authorization: Bearer <token>
```

### 3. Logout Specific Device
```
DELETE /api/v1/settings/security-and-privacy/devices/675a1b2c3d4e5f6789012346
Authorization: Bearer <token>
```

### 4. Logout All Other Devices
```
POST /api/v1/settings/security-and-privacy/devices/logout-all
Authorization: Bearer <token>
X-Device-ID: 675a1b2c3d4e5f6789012345
```

### 5. Get Security Events
```
GET /api/v1/settings/security-and-privacy/security-events?page=1&limit=10
Authorization: Bearer <token>
```

## Error Handling

### Common Errors
- `401`: Device session expired
- `404`: Device not found
- `400`: Invalid device ID
- `429`: Too many requests

### Error Response Format
```json
{
  "status": "error",
  "message": "Device session expired. Please login again.",
  "statusCode": 401
}
```

## Security Considerations

1. **Session Validation**: Always validate device sessions for sensitive operations
2. **Rate Limiting**: Implement rate limiting for device management endpoints
3. **Audit Logging**: All device actions are logged for security auditing
4. **Automatic Cleanup**: Inactive devices are automatically cleaned up after 30 days
5. **Fingerprint Security**: Device fingerprints are hashed for privacy

This device management system provides comprehensive control over user sessions while maintaining security and usability.