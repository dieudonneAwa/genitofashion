import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb/connection";
import { User } from "@/lib/mongodb/models/auth";
import type { UserRole } from "@/lib/mongodb/models/auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      image?: string | null;
    };
  }

  interface User {
    role: UserRole;
  }
}

export const authOptions: NextAuthConfig = {
  // No adapter needed for JWT strategy with CredentialsProvider
  // User lookup is handled in the authorize function
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Please enter your email and password");
          }

          await connectDB();

          const email =
            typeof credentials.email === "string"
              ? credentials.email.toLowerCase()
              : String(credentials.email).toLowerCase();
          const user = await User.findOne({
            email,
          });

          if (!user) {
            throw new Error("Invalid email or password");
          }

          if (!user.password) {
            throw new Error("Invalid email or password");
          }

          const password =
            typeof credentials.password === "string"
              ? credentials.password
              : String(credentials.password);
          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            throw new Error("Invalid email or password");
          }

          return {
            id: user._id.toString(),
            email: user.email || "",
            name: user.name || null,
            role: user.role || "customer",
            image: user.image || null,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          // Re-throw the error so NextAuth can handle it properly
          if (error instanceof Error) {
            throw error;
          }
          throw new Error("An error occurred during authentication");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const tokenWithExtras = token as { id?: string; role?: UserRole };
        tokenWithExtras.id = user.id;
        tokenWithExtras.role = user.role || "customer";
      }
      return token;
    },
    async session({ session, token }) {
      try {
        // If no session is provided, return null (unauthenticated)
        if (!session) {
          return null as any;
        }

        // If there's no user in session, return session as-is (unauthenticated state)
        if (!session.user) {
          return session;
        }

        // Extract token data with proper typing
        const tokenWithExtras = token as { id?: string; role?: UserRole };

        // Populate session user with token data
        if (tokenWithExtras.id) {
          session.user.id = tokenWithExtras.id;
        }

        // Set role from token or default to customer
        session.user.role =
          tokenWithExtras.role || session.user.role || "customer";

        return session;
      } catch (error) {
        console.error("Session callback error:", error);
        // Return null on error to indicate unauthenticated state
        return null as any;
      }
    },
  },
  secret: (() => {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          "NEXTAUTH_SECRET environment variable is required in production"
        );
      }
      console.warn(
        "⚠️  NEXTAUTH_SECRET not set. Using fallback secret for development only."
      );
      return "fallback-secret-for-development-only-change-in-production";
    }
    return secret;
  })(),
  debug: process.env.NODE_ENV === "development",
  trustHost: true, // Required for NextAuth v5
};
