# Tax and Service Fee Management System

## Overview
This module allows administrators to manage various taxes and service fees that are applied during the checkout process. The system supports different types of fees including taxes, platform fees, and delivery fees with various calculation methods.

## Features
- **Admin Management Interface**: Dedicated admin page to add, edit, and delete tax and service fees
- **Dynamic Fee Calculation**: Fees can be calculated based on:
  - Fixed amounts
  - Percentage of order value
  - Distance-based delivery fees
  - Time-based fees (e.g., peak hours)
  - Region-specific fees
- **Real-time Application**: All configured fees are applied in real-time during checkout

## Database Schema
The system uses a MongoDB schema with the following structure:

```javascript
const TaxServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { 
      type: String, 
      enum: ["tax", "platform_fee", "delivery_fee"], 
      required: true 
    },
    value: { type: Number, required: true },
    valueType: { 
      type: String, 
      enum: ["percentage", "fixed"], 
      required: true 
    },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    distanceRange: {
      min: { type: Number },
      max: { type: Number }
    },
    timeRange: {
      startTime: { type: String },
      endTime: { type: String }
    },
    applicableRegions: [{ type: String }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);
```

## API Endpoints

### Admin Endpoints
- `GET /api/tax-service` - Get all tax and service fees
- `GET /api/tax-service/type/:type` - Get fees by type (tax, platform_fee, delivery_fee)
- `POST /api/tax-service` - Create a new tax or service fee
- `PUT /api/tax-service/:id` - Update an existing tax or service fee
- `DELETE /api/tax-service/:id` - Delete a tax or service fee

### Calculation Endpoint
- `POST /api/tax-service/calculate` - Calculate applicable fees for an order
  - Request body should include:
    - `subtotal`: Order subtotal amount
    - `distance`: Delivery distance (optional)
    - `region`: Delivery region (optional)
    - `time`: Order time (optional)

## Setup Instructions

### Seeding Initial Data
To populate the database with initial tax and service fee data:

```bash
npm run seed
```

This will run the seed script that adds default tax rates, platform fees, and distance-based delivery fees.

### Accessing the Admin Interface
The tax and service fee management interface is available at:

```
/tax-service
```

Only users with admin privileges can access this page.

## Integration with Checkout
The checkout page automatically fetches applicable taxes and fees from the API based on the order details, including:
- Order subtotal
- Delivery distance
- Current time
- Delivery region

These fees are then displayed in the order summary and included in the final payment amount.