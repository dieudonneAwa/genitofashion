# Authentication & Authorization Setup Guide

## ✅ Implementation Complete

NextAuth.js with RBAC (Role-Based Access Control) has been successfully implemented.

## 📦 Installed Dependencies

- `next-auth` (v5) - Authentication library
- `bcryptjs` - Password hashing
- `zod` - Input validation
- `@types/bcryptjs` - TypeScript types

## 🗂️ File Structure

```
lib/
├── auth/
│   ├── config.ts          # NextAuth configuration
│   ├── adapter.ts         # MongoDB adapter for NextAuth
│   └── utils.ts           # Auth utility functions
├── mongodb/
│   └── models/
│       └── auth.ts        # User, Session, Account models

app/
├── api/
│   └── auth/
│       ├── [...nextauth]/route.ts  # NextAuth API route
│       └── register/route.ts       # Registration endpoint
├── login/page.tsx          # Login page
├── register/page.tsx      # Registration page
└── admin/
    └── layout.tsx         # Admin route protection

middleware.ts              # Route protection middleware
components/
├── providers.tsx          # SessionProvider wrapper
└── header.tsx             # Updated with auth UI
```

## 🔐 User Roles

- **customer** - Default role for registered users
- **admin** - Full access to admin panel
- **staff** - Limited admin access (optional)

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Update `.env.local` with:

```env
MONGODB_URI=mongodb://localhost:27017/genitofashion

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Admin User (optional)
ADMIN_EMAIL=admin@genito.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Admin User
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Create Admin User

```bash
npm run seed:admin
```

This creates an admin user with:
- Email: `admin@genito.com` (or from ADMIN_EMAIL env var)
- Password: `admin123` (or from ADMIN_PASSWORD env var)
- Role: `admin`

### 4. Start Development Server

```bash
npm run dev
```

## 🔒 Protected Routes

### Admin Routes
- `/admin/*` - Protected by middleware and layout
- Requires `admin` or `staff` role

### Middleware Protection
The `middleware.ts` file automatically protects admin routes.

### Server Component Protection
Use in Server Components:
```typescript
import { requireRole } from "@/lib/auth/utils"

export default async function AdminPage() {
  await requireRole("admin")
  // Your code here
}
```

## 🎨 Authentication UI

### Header Features
- **Logged Out**: Shows "Login" button
- **Logged In**: Shows user menu with:
  - User name and email
  - Profile link
  - Admin link (if admin/staff)
  - Sign out button

### Pages
- `/login` - Login page
- `/register` - Registration page

## 📝 Usage Examples

### Client Components
```typescript
import { useSession, signOut } from "next-auth/react"

export function MyComponent() {
  const { data: session } = useSession()
  
  if (session) {
    return <div>Welcome {session.user.name}!</div>
  }
  
  return <div>Please login</div>
}
```

### Server Components
```typescript
import { getCurrentUser, requireRole } from "@/lib/auth/utils"

export default async function MyPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/login")
  }
  
  // Check role
  if (user.role === "admin") {
    // Admin content
  }
}
```

### API Routes
```typescript
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }
  
  // Your code here
}
```

## 🔐 Security Features

- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT-based sessions
- ✅ Secure HTTP-only cookies
- ✅ CSRF protection (NextAuth built-in)
- ✅ Role-based access control
- ✅ Route protection middleware
- ✅ Server-side authorization checks

## 🧪 Testing

1. **Register a new user:**
   - Go to `/register`
   - Fill in the form
   - Account created with `customer` role

2. **Login:**
   - Go to `/login`
   - Use your credentials
   - You'll be redirected to home page

3. **Access Admin:**
   - Login with admin account
   - Click "Admin" button in header
   - Access `/admin` routes

4. **Test Protection:**
   - Logout
   - Try accessing `/admin`
   - Should redirect to home page

## 📚 Next Steps

- [ ] Add email verification
- [ ] Add password reset functionality
- [ ] Add OAuth providers (Google, etc.)
- [ ] Add profile management page
- [ ] Add account settings
- [ ] Implement rate limiting
- [ ] Add 2FA (optional)

## 🐛 Troubleshooting

### "NEXTAUTH_SECRET is not set"
- Add `NEXTAUTH_SECRET` to `.env.local`
- Generate a secure secret key

### "Cannot connect to MongoDB"
- Check `MONGODB_URI` in `.env.local`
- Ensure MongoDB is running

### "Unauthorized" errors
- Check user role in database
- Verify session is active
- Check middleware configuration

