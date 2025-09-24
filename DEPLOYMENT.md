# StudyHub Backend Deployment Guide

## 🚀 Vercel Deployment Steps

### 1. Prepare for Deployment
- ✅ `vercel.json` configuration file created
- ✅ CORS configuration updated
- ✅ Package.json optimized for Vercel
- ✅ Port configuration set for production

### 2. Deploy to Vercel

1. **Install Vercel CLI** (if not already installed)
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from project directory**
   ```bash
   cd "Study Hub SurvarA12"
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? `Y`
   - Which scope? Select your account
   - Link to existing project? `N` (for first deployment)
   - Project name: `studyhub-backend` (or your preferred name)
   - Directory: `./` (current directory)

### 3. Environment Variables Setup

In Vercel Dashboard, add these environment variables:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
JWT_SECRET=your_super_secret_jwt_key
```

### 4. Update Frontend API URLs

After deployment, update your frontend to use the Vercel URL:

**Replace all instances of:**
```javascript
http://localhost:5000
```

**With your Vercel URL:**
```javascript
https://your-project-name.vercel.app
```

### 5. Update CORS Configuration

After getting your Netlify URL, update the CORS origins in `index.js`:

```javascript
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://your-netlify-app.netlify.app"  // Replace with actual URL
    ],
    credentials: true,
  })
);
```

## 📝 Deployment Checklist

- [ ] Vercel CLI installed and logged in
- [ ] Project deployed to Vercel
- [ ] Environment variables configured in Vercel dashboard
- [ ] Frontend API URLs updated to Vercel domain
- [ ] CORS origins updated with Netlify URL
- [ ] Database connection tested in production
- [ ] Stripe webhooks updated (if using)
- [ ] All API endpoints tested in production

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Ensure no trailing slashes in origin URLs
   - Verify Netlify URL is correct
   - Check credentials: true is set

2. **Environment Variables**
   - Verify all variables are set in Vercel dashboard
   - Check variable names match exactly
   - Redeploy after adding variables

3. **Database Connection**
   - Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
   - Verify connection string is correct
   - Check database user permissions

4. **API Endpoints Not Working**
   - Check Vercel function logs
   - Verify routes are correctly defined
   - Test endpoints individually

## 📊 Post-Deployment Testing

Test these endpoints after deployment:

- `GET /data` - Study sessions
- `POST /users` - User registration  
- `POST /auth/login` - JWT login
- `GET /admin/users` - Admin endpoints
- `POST /create-payment-intent` - Stripe integration

## 🔄 Redeployment

For updates, simply run:
```bash
vercel --prod
```

Or push to your connected Git repository for automatic deployments.
