# Offer Bazar API

A comprehensive API for managing stores, offers, and merchants with admin approval system.

## Features

- **Store Management** - Create, read, update, delete stores
- **Offer Management** - Manage offers with categories and discounts
- **Merchant System** - Merchant registration and dashboard
- **Admin Approval** - Admin can approve/disapprove merchant submissions
- **Modern UI** - Next.js style admin panel and merchant dashboard

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Frontend**: HTML, CSS, JavaScript
- **Validation**: express-validator
- **File Upload**: Multer

## API Endpoints

### Stores
- `GET /api/stores` - Get all stores
- `POST /api/stores` - Create new store
- `PUT /api/stores/:id` - Update store
- `DELETE /api/stores/:id` - Delete store
- `PATCH /api/stores/:id/toggle-status` - Toggle store status

### Offers
- `GET /api/offers` - Get all offers
- `POST /api/offers` - Create new offer
- `PUT /api/offers/:id` - Update offer
- `DELETE /api/offers/:id` - Delete offer
- `PATCH /api/offers/:id/toggle-featured` - Toggle featured status
- `PATCH /api/offers/:id/toggle-status` - Toggle offer status

### Merchants
- `GET /api/merchants` - Get all merchants
- `POST /api/merchants` - Create new merchant
- `PATCH /api/merchants/:id/toggle-approval` - Toggle merchant approval
- `DELETE /api/merchants/:id` - Delete merchant
- `GET /api/merchants/pending` - Get pending approvals
- `PATCH /api/merchants/stores/:id/approve` - Approve store
- `PATCH /api/merchants/offers/:id/approve` - Approve offer

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file with environment variables
4. Start the server: `npm start`

## Environment Variables

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/offer_bazar
```

## Deployment

### Railway
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically

### Heroku
1. Install Heroku CLI
2. Create Heroku app: `heroku create your-app-name`
3. Set environment variables: `heroku config:set MONGODB_URI=your-mongodb-uri`
4. Deploy: `git push heroku main`

### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel --prod`

## Frontend

- **Admin Panel**: `http://localhost:5000/` - Full admin dashboard
- **Merchant Dashboard**: `http://localhost:5000/merchant.html?merchantId=YOUR_MERCHANT_ID`

## License

MIT License