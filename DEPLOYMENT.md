# Vercel Deployment Guide

This guide will help you deploy your Cameroon Shop website to Vercel.

## Prerequisites

1. ✅ GitHub/GitLab/Bitbucket account
2. ✅ MongoDB Atlas account (free tier available)
3. ✅ Cloudinary account (free tier available)
4. ✅ Vercel account (free tier available)

## Step 1: Prepare Your Code

### 1.1 Ensure Code is Committed

```bash
# Check git status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Prepare for deployment"

# Push to your repository
git push origin main
```

### 1.2 Test Production Build Locally

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test production build
npm start
```

Visit `http://localhost:3000` and test:
- ✅ Homepage loads
- ✅ Products page works
- ✅ Search functionality works
- ✅ Authentication works
- ✅ Admin panel accessible

## Step 2: Set Up MongoDB Atlas

### 2.1 Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a new cluster (choose free M0 tier)
4. Wait for cluster to be created (~5 minutes)

### 2.2 Configure Database Access

1. Go to **Database Access** → **Add New Database User**
2. Create a user with:
   - Username: `genito-admin` (or your choice)
   - Password: Generate secure password (save it!)
   - Database User Privileges: **Read and write to any database**
3. Click **Add User**

### 2.3 Configure Network Access

1. Go to **Network Access** → **Add IP Address**
2. For Vercel deployment, add:
   - **Allow Access from Anywhere**: `0.0.0.0/0`
   - Or add Vercel's IP ranges (more secure)
3. Click **Confirm**

### 2.4 Get Connection String

1. Go to **Database** → **Connect**
2. Choose **Connect your application**
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with your database name (e.g., `genitofashion`)

Example:
```
mongodb+srv://genito-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/genitofashion?retryWrites=true&w=majority
```

## Step 3: Set Up Cloudinary

### 3.1 Create Cloudinary Account

1. Go to https://cloudinary.com
2. Sign up for free account
3. Go to **Dashboard**

### 3.2 Get Credentials

From Cloudinary Dashboard, copy:
- **Cloud Name**
- **API Key**
- **API Secret**

## Step 4: Deploy to Vercel

### 4.1 Create Vercel Account

1. Go to https://vercel.com
2. Sign up with GitHub (recommended)
3. Authorize Vercel to access your repositories

### 4.2 Import Project

1. Click **Add New Project**
2. Select your repository (`genitofashion-website`)
3. Vercel will auto-detect Next.js

### 4.3 Configure Project Settings

**Framework Preset**: Next.js (auto-detected)
**Root Directory**: `./` (default)
**Build Command**: `npm run build` (auto-detected)
**Output Directory**: `.next` (auto-detected)
**Install Command**: `npm install` (auto-detected)

### 4.4 Add Environment Variables

Click **Environment Variables** and add:

#### Required Variables:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/genitofashion?retryWrites=true&w=majority

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-project.vercel.app

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### Optional Variables:

```env
# Google Vision API (if using)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
# Note: For Google credentials, you'll need to upload the JSON file
# or use environment variables (see below)

# OpenAI (if using)
OPENAI_API_KEY=your-openai-key

# Admin User (for seeding)
ADMIN_EMAIL=admin@genito.com
ADMIN_PASSWORD=your-secure-password
ADMIN_NAME=Admin User
```

**Important**: 
- Add variables for **Production**, **Preview**, and **Development** environments
- Click **Save** after adding each variable

### 4.5 Generate NEXTAUTH_SECRET

```bash
# Run this command to generate a secure secret
openssl rand -base64 32
```

Copy the output and use it as `NEXTAUTH_SECRET`.

### 4.6 Deploy

1. Click **Deploy**
2. Wait for build to complete (~2-5 minutes)
3. Your site will be live at `https://your-project.vercel.app`

## Step 5: Post-Deployment Configuration

### 5.1 Update NEXTAUTH_URL

After first deployment:
1. Go to **Settings** → **Environment Variables**
2. Update `NEXTAUTH_URL` to your actual Vercel URL:
   ```
   https://your-project.vercel.app
   ```
3. Redeploy (Vercel will auto-redeploy on env var changes)

### 5.2 Create Admin User

**Option 1: Using Seed Script (Recommended)**

1. Go to Vercel Dashboard → Your Project → **Settings** → **Functions**
2. Or run locally with production database:
   ```bash
   MONGODB_URI="your-production-uri" npm run seed:admin
   ```

**Option 2: Manual Registration**

1. Visit your deployed site
2. Go to `/register`
3. Register an account
4. Update user role in MongoDB Atlas:
   - Go to MongoDB Atlas → **Browse Collections**
   - Find `users` collection
   - Find your user document
   - Update `role` field to `"admin"`

### 5.3 Test Deployment

Visit your deployed site and test:

- ✅ Homepage loads correctly
- ✅ Products page displays products
- ✅ Search functionality works
- ✅ User registration works
- ✅ User login works
- ✅ Admin panel accessible at `/admin`
- ✅ Product upload works (test with Cloudinary)
- ✅ Cart functionality works
- ✅ Orders page works

## Step 6: Custom Domain (Optional)

### 6.1 Add Domain in Vercel

1. Go to **Settings** → **Domains**
2. Enter your domain (e.g., `genito.com`)
3. Follow DNS configuration instructions

### 6.2 Update Environment Variables

Update `NEXTAUTH_URL` to your custom domain:
```
https://genito.com
```

### 6.3 Configure DNS

Add these DNS records to your domain provider:

**For Root Domain:**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For WWW Subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

Vercel will automatically provision SSL certificate.

## Step 7: Google Vision API (Optional)

If you're using Google Vision API:

### Option 1: Environment Variables (Recommended)

1. Convert JSON credentials to environment variables
2. Add to Vercel:
   ```
   GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
   ```
3. Update code to read from env var instead of file

### Option 2: Upload Credentials File

1. Base64 encode your credentials file:
   ```bash
   base64 -i oauth-303809-f83153ad3187.json
   ```
2. Add as environment variable:
   ```
   GOOGLE_CREDENTIALS_BASE64=<base64-encoded-content>
   ```
3. Update code to decode and use

### Option 3: Disable (If Not Needed)

If you don't need image analysis:
- Remove `GOOGLE_APPLICATION_CREDENTIALS` from environment variables
- The code will handle missing credentials gracefully

## Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Common issues:
   - TypeScript errors → Fix or temporarily enable `ignoreBuildErrors`
   - Missing dependencies → Check `package.json`
   - Environment variables missing → Add all required vars

### Database Connection Fails

1. Check MongoDB Atlas Network Access (allow `0.0.0.0/0`)
2. Verify connection string format
3. Check database user permissions
4. Test connection string locally

### Authentication Not Working

1. Verify `NEXTAUTH_SECRET` is set
2. Check `NEXTAUTH_URL` matches your domain
3. Ensure callback URLs are correct
4. Check browser console for errors

### Images Not Loading

1. Verify Cloudinary credentials
2. Check Next.js Image configuration
3. Verify image URLs in database
4. Check Cloudinary dashboard for uploads

### 500 Errors

1. Check Vercel Function Logs
2. Check MongoDB connection
3. Verify all environment variables are set
4. Check API route error handling

## Monitoring

### Vercel Analytics

1. Go to **Analytics** tab in Vercel dashboard
2. Enable Analytics (may require Pro plan)
3. Monitor:
   - Page views
   - Performance metrics
   - Error rates

### MongoDB Atlas Monitoring

1. Go to MongoDB Atlas dashboard
2. Monitor:
   - Database usage
   - Connection count
   - Query performance

## Performance Optimization

### Enable Image Optimization

Already configured in `next.config.mjs` with Cloudinary remote patterns.

### Enable Caching

Vercel automatically caches:
- Static assets
- API responses (with proper headers)
- Next.js pages

### Monitor Bundle Size

```bash
# Analyze bundle size
npm run build
# Check .next/analyze for bundle report
```

## Security Checklist

- ✅ Environment variables secured (not in code)
- ✅ MongoDB Atlas IP whitelist configured
- ✅ Strong `NEXTAUTH_SECRET` generated
- ✅ HTTPS enabled (automatic on Vercel)
- ✅ Admin routes protected with middleware
- ✅ API routes have proper authentication
- ✅ No sensitive data in client-side code

## Support Resources

- Vercel Documentation: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- Cloudinary Docs: https://cloudinary.com/documentation

## Next Steps

After successful deployment:

1. ✅ Set up monitoring and alerts
2. ✅ Configure custom domain
3. ✅ Set up staging environment
4. ✅ Enable analytics
5. ✅ Set up error tracking (Sentry, etc.)
6. ✅ Configure backup strategy
7. ✅ Set up CI/CD for automatic deployments

---

**Need Help?** Check Vercel logs or MongoDB Atlas logs for detailed error messages.

