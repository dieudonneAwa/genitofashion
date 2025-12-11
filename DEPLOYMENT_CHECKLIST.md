# Vercel Deployment Checklist

Use this checklist to ensure a smooth deployment to Vercel.

## Pre-Deployment

- [ ] Code is committed and pushed to Git repository
- [ ] Production build succeeds locally (`npm run build`)
- [ ] No TypeScript errors (or `ignoreBuildErrors: false` in next.config.mjs)
- [ ] All dependencies are in `package.json`
- [ ] `.env.local` is NOT committed to Git
- [ ] Test all major features locally

## Accounts Setup

- [ ] MongoDB Atlas account created
- [ ] MongoDB cluster created and running
- [ ] Database user created with read/write permissions
- [ ] Network access configured (allow `0.0.0.0/0` for Vercel)
- [ ] Connection string copied and tested
- [ ] Cloudinary account created
- [ ] Cloudinary credentials obtained
- [ ] Vercel account created (with GitHub)

## Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

- [ ] `MONGODB_URI` - MongoDB Atlas connection string
- [ ] `NEXTAUTH_SECRET` - Generated with `openssl rand -base64 32`
- [ ] `NEXTAUTH_URL` - Will be `https://your-project.vercel.app` (update after first deploy)
- [ ] `CLOUDINARY_CLOUD_NAME` - From Cloudinary dashboard
- [ ] `CLOUDINARY_API_KEY` - From Cloudinary dashboard
- [ ] `CLOUDINARY_API_SECRET` - From Cloudinary dashboard
- [ ] `GOOGLE_CLOUD_PROJECT_ID` - (Optional) If using Google Vision
- [ ] `OPENAI_API_KEY` - (Optional) If using GPT-4
- [ ] `ADMIN_EMAIL` - (Optional) For admin user seeding
- [ ] `ADMIN_PASSWORD` - (Optional) For admin user seeding
- [ ] `ADMIN_NAME` - (Optional) For admin user seeding

## Vercel Deployment

- [ ] Repository imported to Vercel
- [ ] Framework preset: Next.js (auto-detected)
- [ ] Root directory: `./` (default)
- [ ] Build command: `npm run build` (auto-detected)
- [ ] Output directory: `.next` (auto-detected)
- [ ] All environment variables added
- [ ] Environment variables set for Production, Preview, and Development
- [ ] Initial deployment started
- [ ] Build completed successfully

## Post-Deployment

- [ ] Site is accessible at Vercel URL
- [ ] Update `NEXTAUTH_URL` to actual Vercel URL
- [ ] Redeploy after updating `NEXTAUTH_URL`
- [ ] Homepage loads correctly
- [ ] Products page displays products
- [ ] Search functionality works
- [ ] User registration works
- [ ] User login works
- [ ] Admin panel accessible at `/admin`
- [ ] Product upload works (test Cloudinary)
- [ ] Cart functionality works
- [ ] Orders page works
- [ ] Images load correctly

## Admin User Setup

Choose one method:

**Option 1: Seed Script**
- [ ] Run `npm run seed:admin` with production database
- [ ] Or configure in Vercel environment variables and run

**Option 2: Manual**
- [ ] Register account on deployed site
- [ ] Update user role to "admin" in MongoDB Atlas

## Custom Domain (Optional)

- [ ] Domain added in Vercel Settings → Domains
- [ ] DNS records configured at domain provider
- [ ] SSL certificate provisioned (automatic)
- [ ] `NEXTAUTH_URL` updated to custom domain
- [ ] Site accessible on custom domain

## Testing Checklist

Test these features on deployed site:

- [ ] **Homepage**: Loads, images display, links work
- [ ] **Products Page**: Products display, filters work, pagination works
- [ ] **Product Detail**: Images load, add to cart works, reviews display
- [ ] **Search**: Autocomplete works, search results display
- [ ] **Authentication**: Register, login, logout work
- [ ] **Cart**: Add items, update quantities, remove items
- [ ] **Admin Panel**: Accessible, all tabs work, POS works
- [ ] **Image Upload**: Product images upload to Cloudinary
- [ ] **Orders**: Orders page loads, order details display

## Monitoring Setup

- [ ] Vercel Analytics enabled (if available)
- [ ] MongoDB Atlas monitoring checked
- [ ] Error tracking configured (optional: Sentry)
- [ ] Performance monitoring set up

## Security Verification

- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Environment variables secured
- [ ] MongoDB IP whitelist configured
- [ ] Admin routes protected
- [ ] API routes have authentication
- [ ] No sensitive data in client code

## Final Steps

- [ ] Document deployment URL
- [ ] Share with team/stakeholders
- [ ] Set up backup strategy
- [ ] Configure staging environment (optional)
- [ ] Set up CI/CD for automatic deployments

---

## Quick Commands

```bash
# Test production build
npm run build
npm start

# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Check for build errors
npm run lint
```

## Troubleshooting

If deployment fails:
1. Check Vercel build logs
2. Verify all environment variables are set
3. Test build locally first
4. Check MongoDB connection
5. Verify Cloudinary credentials

---

**Ready to deploy?** Follow the steps in `DEPLOYMENT.md` for detailed instructions.

