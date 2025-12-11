# Environment Variables Template

Copy this template and fill in your actual values for Vercel deployment.

## Required Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables

```env
# ============================================
# DATABASE
# ============================================
# MongoDB Atlas connection string
# Format: mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/genitofashion?retryWrites=true&w=majority

# ============================================
# NEXTAUTH (Authentication)
# ============================================
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=YOUR_GENERATED_SECRET_HERE

# Your Vercel deployment URL (update after first deploy)
# Format: https://your-project.vercel.app
NEXTAUTH_URL=https://your-project.vercel.app

# ============================================
# CLOUDINARY (Image Storage)
# ============================================
# Get these from Cloudinary Dashboard
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# ============================================
# OPTIONAL: Google Vision API
# ============================================
# Only if you're using image analysis feature
GOOGLE_CLOUD_PROJECT_ID=your-project-id
# Note: For credentials, see DEPLOYMENT.md for options

# ============================================
# OPTIONAL: OpenAI API
# ============================================
# Only if you're using GPT-4 for product generation
OPENAI_API_KEY=your-openai-api-key

# ============================================
# OPTIONAL: Admin User Seeding
# ============================================
# Used by seed:admin script
ADMIN_EMAIL=admin@genito.com
ADMIN_PASSWORD=your-secure-password
ADMIN_NAME=Admin User
```

## How to Add in Vercel

1. Go to your project in Vercel Dashboard
2. Click **Settings** → **Environment Variables**
3. Click **Add New**
4. Enter variable name and value
5. Select environments: **Production**, **Preview**, **Development**
6. Click **Save**
7. Redeploy if needed (Vercel auto-redeploys on env var changes)

## Security Notes

- ✅ Never commit `.env.local` to Git
- ✅ Use different values for production vs development
- ✅ Rotate secrets periodically
- ✅ Use Vercel's environment variable encryption
- ✅ Limit access to environment variables

## Generating NEXTAUTH_SECRET

```bash
# On Mac/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Copy the output and use it as `NEXTAUTH_SECRET`.

