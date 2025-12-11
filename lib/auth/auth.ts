// Main auth instance export for use in API routes and server components
// This file creates the auth instance with full configuration (including MongoDB)
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/config";

const { handlers, auth } = NextAuth(authOptions);

// Export handlers for the route
export { handlers };

// Export auth for use in API routes and server components
export { auth };

