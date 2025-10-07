# 🚀 FNF Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

---

## 🔐 Authentication Endpoints

### 1. Send OTP
**POST** `/auth/send-otp`

Send OTP to customer's phone number for verification.

**Request Body:**
```json
{
  "phone": "1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "dev_otp": "123456"  // Only in development mode
}
```

---

### 2. Verify OTP
**POST** `/auth/verify-otp`

Verify OTP and login/register customer.

**Request Body:**
```json
{
  "phone": "1234567890",
  "otp": "123456",
  "firstName": "John",    // Optional, for new customers
  "lastName": "Doe"       // Optional, for new customers
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "customer": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "1234567890",
    "email": null
  }
}
```

---

## 📦 Order Endpoints

### 1. Create Order
**POST** `/orders`

Create a new order.

**Request Body:**
```json
{
  "customerId": "507f1f77bcf86cd799439011",
  "items": [
    {
      "productName": "Burger",
      "quantity": 2,
      "unitPrice": 5.99,
      "totalPrice": 11.98
    },
    {
      "productName": "Fries",
      "quantity": 1,
      "unitPrice": 2.99,
      "totalPrice": 2.99
    }
  ],
  "totalAmount": 14.97,
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "landmark": "Near Central Park"
  },
  "paymentMethod": "cash",  // cash, card, upi, wallet
  "notes": "Extra ketchup please"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-202410-0001",
    "customer": {
      "firstName": "John",
      "lastName": "Doe",
      "phone": "1234567890"
    },
    "items": [...],
    "totalAmount": 14.97,
    "status": "pending",
    "createdAt": "2024-10-05T10:00:00.000Z"
  }
}
```

---

### 2. Get All Orders
**GET** `/orders?status=pending&limit=50&page=1`

Get list of orders with optional filters.

**Query Parameters:**
- `status` - Filter by status (pending, confirmed, preparing, ready, delivered, cancelled)
- `customerId` - Filter by customer ID
- `limit` - Number of orders per page (default: 50)
- `page` - Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "orders": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

---

### 3. Get Single Order
**GET** `/orders/:id`

Get details of a specific order.

**Response:**
```json
{
  "success": true,
  "order": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-202410-0001",
    "customer": {
      "firstName": "John",
      "lastName": "Doe",
      "phone": "1234567890",
      "email": "john@example.com",
      "address": {...}
    },
    "items": [...],
    "totalAmount": 14.97,
    "status": "preparing",
    "deliveryAddress": {...},
    "paymentMethod": "cash",
    "paymentStatus": "pending",
    "notes": "Extra ketchup please",
    "createdAt": "2024-10-05T10:00:00.000Z"
  }
}
```

---

### 4. Update Order
**PUT** `/orders/:id`

Update order status or details.

**Request Body:**
```json
{
  "status": "delivered",             // Required
  "cancellationReason": "Customer cancelled"  // Required only if status = cancelled
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order updated successfully",
  "order": {...}
}
```

---

### 5. Delete Order
**DELETE** `/orders/:id`

Delete an order.

**Response:**
```json
{
  "success": true,
  "message": "Order deleted successfully"
}
```

---

### 6. Get Order Statistics
**GET** `/orders/stats/summary?startDate=2024-01-01&endDate=2024-12-31`

Get order statistics and analytics.

**Query Parameters:**
- `startDate` - Start date for filtering (optional)
- `endDate` - End date for filtering (optional)

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalOrders": 150,
    "totalRevenue": 2500.50,
    "statusBreakdown": [
      { "_id": "pending", "count": 10 },
      { "_id": "confirmed", "count": 20 },
      { "_id": "delivered", "count": 100 }
    ],
    "topProducts": [
      {
        "_id": "Burger",
        "totalQuantity": 250,
        "totalRevenue": 1497.50
      },
      {
        "_id": "Pizza",
        "totalQuantity": 180,
        "totalRevenue": 1800.00
      }
    ]
  }
}
```

---

## 👥 Customer Endpoints

### 1. Get All Customers
**GET** `/customers?limit=50&page=1`

Get list of customers.

**Query Parameters:**
- `limit` - Number of customers per page (default: 50)
- `page` - Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "customers": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 75,
    "pages": 2
  }
}
```

---

### 2. Get Single Customer
**GET** `/customers/:id`

Get details of a specific customer.

**Response:**
```json
{
  "success": true,
  "customer": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "1234567890",
    "email": "john@example.com",
    "address": {...},
    "isVerified": true,
    "totalOrders": 15,
    "totalSpent": 250.50,
    "lastOrderDate": "2024-10-05T10:00:00.000Z",
    "createdAt": "2024-01-01T10:00:00.000Z"
  }
}
```

---

### 3. Update Customer
**PUT** `/customers/:id`

Update customer information.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "landmark": "Near Central Park"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Customer updated successfully",
  "customer": {...}
}
```

---

## 🚨 Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error message here"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

---

## 📝 Usage Examples

### JavaScript (Fetch)
```javascript
// Send OTP
const response = await fetch('http://localhost:5000/api/auth/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '1234567890' })
});
const data = await response.json();
```

### JavaScript (Axios)
```javascript
// Create Order
const response = await axios.post('http://localhost:5000/api/orders', {
  customerId: '507f1f77bcf86cd799439011',
  items: [...],
  totalAmount: 14.97
});
```

---

## 🔧 Testing

### Test API with curl:
```bash
# Send OTP
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"1234567890"}'

# Get all orders
curl http://localhost:5000/api/orders

# Get statistics
curl http://localhost:5000/api/orders/stats/summary
```

---

## 🚀 Next Steps

1. Update your consumer app to use these endpoints
2. Update your admin dashboard to use these endpoints
3. Test all API endpoints
4. Deploy to production (Vercel/Railway)

---

## 💡 Notes

- All times are in UTC
- Phone numbers must be exactly 10 digits
- Order numbers are auto-generated: ORD-YYYYMM-0001
- OTP expires in 5 minutes
- Maximum 3 OTP verification attempts
- In development mode, OTP is returned in the response (remove in production!)
