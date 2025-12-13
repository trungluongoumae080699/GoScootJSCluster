# Testing with Postman - Complete API Guide

## Base URL
```
https://still-simply-katydid.ngrok.app/GoScoot/Server
```

---

## 🔐 Authentication

### Login (Get Session Credentials)
```http
POST /auth/dashboard/signIn
Content-Type: application/json

{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "staffProfile": {
    "id": "26b7e566-defb-441c-8148-f06bcebb7a49",
    "full_name": "Martin Larkin",
    "email": "Martin.Larkin@hotmail.com"
  },
  "sessionId": "8ecc770d-8962-4b85-8b9f-bf7e5b3f8ac9",
  "mqtt_password": "AaynoOeGK97zKc+F/D/Exg=="
}
```

---

## 🚲 Bikes API

### Get All Bikes (with pagination)
```http
GET /dashboard/bikes
GET /dashboard/bikes?page=1
GET /dashboard/bikes?battery=80
GET /dashboard/bikes?hub=HUB-123
GET /dashboard/bikes?ids=BIKE-123,BIKE-456
Authorization: {sessionId}
```

### Get Specific Bike by ID
```http
GET /dashboard/bikes?ids=BIKE-123
Authorization: {sessionId}
```

### Get Bike Telemetry
```http
GET /dashboard/telemetry/{bikeId}
GET /dashboard/telemetry/{bikeId}?from=1640995200000&to=1641081600000
GET /dashboard/telemetry/{bikeId}?page=1&pageSize=50&sortDirection=desc
Authorization: {sessionId}
```

### Get Bike Trips
```http
GET /dashboard/trips/{bikeId}
GET /dashboard/trips/{bikeId}?from=1640995200000&to=1641081600000
GET /dashboard/trips/{bikeId}?status=completed&sortBy=reservation_date
Authorization: {sessionId}
```

---

## 🏢 Hubs API

### Get All Hubs
```http
GET /dashboard/hubs
Authorization: {sessionId}
```

### Get Hubs in Area (with boundaries)
```http
GET /dashboard/hubs?minLat=10.762622&maxLat=10.762822&minLong=106.660172&maxLong=106.660372
Authorization: {sessionId}
```

### Get Bikes in Specific Hub
```http
GET /dashboard/bikes/hub/{hubId}
Authorization: {sessionId}
```

---

## 🚨 Alerts API

### Get All Alerts
```http
GET /dashboard/alerts?page=1
Authorization: {sessionId}
```

### Get Alerts by Bike
```http
GET /dashboard/alerts?bikeId=BIKE-123&page=1
Authorization: {sessionId}
```

### Get Alerts with Time Filter
```http
GET /dashboard/alerts?from=1640995200000&to=1641081600000&sortDirection=desc
Authorization: {sessionId}
```

---

## 🛠️ Quick Setup for Web App

### Problem
Session credentials change every time you login via Postman, making it tedious to update the code manually.

### Solution ✅
Use the built-in **Dev Tools** to quickly set credentials from Postman responses!

### Method 1: Copy-Paste Entire Response (Easiest!)

1. **Login via Postman** and copy the entire JSON response
2. **Open your React app** in browser
3. **Open browser console** (Press F12)
4. **Paste this command:**
   ```javascript
   setPostmanResponse(`{"staffProfile":{"id":"26b7e566-defb-441c-8148-f06bcebb7a49","full_name":"Martin Larkin","email":"Martin.Larkin@hotmail.com"},"sessionId":"8ecc770d-8962-4b85-8b9f-bf7e5b3f8ac9","mqtt_password":"AaynoOeGK97zKc+F/D/Exg=="}`)
   ```
   *(Replace with your actual Postman response)*

5. **Reload the page** (F5)
6. ✅ Done! Your app now uses the new credentials

### Method 2: Set Credentials Manually

If you only have the sessionId and mqtt_password:

```javascript
setCredentialsFromPostman({
  sessionId: "8ecc770d-8962-4b85-8b9f-bf7e5b3f8ac9",
  mqtt_password: "AaynoOeGK97zKc+F/D/Exg=="
})
```

### Other Useful Commands

```javascript
// View Current Credentials
viewCredentials()

// Clear Credentials
clearCredentials()
```

---

## 📋 Example API Testing Workflow

```bash
# 1. Login via Postman
POST https://still-simply-katydid.ngrok.app/GoScoot/Server/auth/dashboard/signIn
Response: { "sessionId": "abc123", "mqtt_password": "xyz789", ... }

# 2. Test Bikes API
GET https://still-simply-katydid.ngrok.app/GoScoot/Server/dashboard/bikes
Authorization: abc123

# 3. Test Hubs API  
GET https://still-simply-katydid.ngrok.app/GoScoot/Server/dashboard/hubs
Authorization: abc123

# 4. Test Hub Bikes
GET https://still-simply-katydid.ngrok.app/GoScoot/Server/dashboard/bikes/hub/HUB-N5X1U4Y1
Authorization: abc123

# 5. Copy response to web app:
setPostmanResponse(`{"sessionId":"abc123","mqtt_password":"xyz789"}`)

# 6. Reload page (F5) and test! 🎉
```

---

## 📝 Query Parameters Reference

### Bikes API Parameters
- `page` - Page number (default: 1)
- `battery` - Max battery percentage filter (e.g., 80)
- `hub` - Hub ID filter (e.g., HUB-N5X1U4Y1)
- `ids` - Comma-separated bike IDs (e.g., BIKE-123,BIKE-456)

### Hubs API Parameters
- `minLat`, `maxLat` - Latitude boundaries
- `minLong`, `maxLong` - Longitude boundaries

### Telemetry API Parameters
- `from`, `to` - Unix timestamps in milliseconds
- `page`, `pageSize` - Pagination (default: page=1, pageSize=50)
- `sortDirection` - "asc" or "desc" (default: desc)

### Trips API Parameters
- `from`, `to` - Unix timestamps for reservation_date filter
- `status` - Trip status filter
- `sortBy` - "reservation_date" or "price"
- `sortDirection` - "asc" or "desc"
- `page`, `pageSize` - Pagination

### Alerts API Parameters
- `bikeId` - Filter by specific bike
- `from`, `to` - Unix timestamps
- `sortDirection` - "asc" or "desc"
- `page` - Page number

---

## 🚀 No More Manual Code Updates!

You'll never need to edit `apiClient.ts` manually again. Just use the dev tools in the browser console!

---

## 💡 Pro Tips

- **Credentials persist** until you close the browser tab
- **Use viewCredentials()** to check what's currently stored
- **Use clearCredentials()** to reset and use fallback test credentials
- **Dev tools are automatically loaded** when you run the app
- **All endpoints require Authorization header** except login
- **Use ngrok-skip-browser-warning: true** header to avoid ngrok warnings
- **Timestamps are in milliseconds** (JavaScript Date.now() format)
