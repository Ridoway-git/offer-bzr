# Render Deployment Guide

## 🚀 Deploy to Render.com

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Connect your GitHub account

### Step 2: Deploy Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure settings:
   - **Name**: `offer-bazar-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

### Step 3: Environment Variables
Add these environment variables in Render dashboard:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://loopsridoway:jASEqeDKhwO2D21H@cluster0.zfv1kvp.mongodb.net/offer_bazar_prod?retryWrites=true&w=majority&appName=Cluster0
PORT=10000
```

### Step 4: Deploy
1. Click "Create Web Service"
2. Wait for deployment (2-3 minutes)
3. Your API will be live!

### Your Live URLs:
- **Admin Panel**: `https://your-app-name.onrender.com/`
- **Merchant Dashboard**: `https://your-app-name.onrender.com/merchant.html?merchantId=YOUR_ID`
- **API Endpoints**: `https://your-app-name.onrender.com/api/`

### Benefits of Render:
- ✅ **FREE Tier Available**
- ✅ **Automatic Deployments**
- ✅ **Custom Domains**
- ✅ **SSL Certificates**
- ✅ **Easy Environment Variables**
- ✅ **GitHub Integration**

### Render vs Other Platforms:
- **Render**: Best for Node.js apps, easy setup
- **Railway**: Good alternative, similar features
- **Heroku**: More complex, paid plans
- **Vercel**: Better for frontend, limited backend

### Troubleshooting:
- If deployment fails, check environment variables
- Make sure MongoDB Atlas allows connections from anywhere
- Check Render logs for any errors
