import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/middleware-auth";

// Define UserRole type locally to avoid importing MongoDB models in Edge Runtime
type UserRole = "customer" | "admin" | "staff";

export async function middleware(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  // Only check admin routes
  if (isAdminRoute) {
    try {
      const session = await auth();

      // If no session, redirect to login
      if (!session || !session.user) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Check if user has admin or staff role
      const userRole = (session.user as any)?.role as UserRole | undefined;
      const isAdmin = userRole === "admin" || userRole === "staff";

      if (!isAdmin) {
        // Redirect non-admin users to home
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch (error) {
      console.error("Middleware auth error:", error);
      // On error, redirect to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
