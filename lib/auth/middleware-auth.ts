// Minimal auth configuration for middleware (Edge Runtime compatible)
// This avoids importing MongoDB/Mongoose which isn't compatible with Edge Runtime
import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

// Define UserRole locally to avoid importing MongoDB models
type UserRole = "customer" | "admin" | "staff";

// Minimal config for middleware - JWT only, no database connection needed
// NextAuth v5's auth() function works with JWT tokens in Edge Runtime
// Must include callbacks to extract role from JWT token
const middlewareConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
  },
  secret: (() => {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          "NEXTAUTH_SECRET environment variable is required in production"
        );
      }
      return "fallback-secret-for-development-only-change-in-production";
    }
    return secret;
  })(),
  trustHost: true,
  // No providers needed for middleware - it only reads JWT tokens
  providers: [],
  // Callbacks are essential to extract role from JWT token
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const tokenWithExtras = token as { id?: string; role?: UserRole };
        tokenWithExtras.id = user.id;
        tokenWithExtras.role = (user as any).role || "customer";
      }
      return token;
    },
    async session({ session, token }) {
      try {
        if (!session || !session.user) {
          return session;
        }

        const tokenWithExtras = token as { id?: string; role?: UserRole };

        if (tokenWithExtras.id) {
          session.user.id = tokenWithExtras.id;
        }

        session.user.role =
          tokenWithExtras.role || (session.user as any).role || "customer";

        return session;
      } catch (error) {
        console.error("Middleware session callback error:", error);
        return session;
      }
    },
  },
};

// Create auth instance specifically for middleware
// This doesn't import MongoDB/Mongoose, so it's Edge Runtime compatible
const { auth } = NextAuth(middlewareConfig);

export { auth };
