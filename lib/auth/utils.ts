import { auth } from "@/lib/auth/auth";
import type { UserRole } from "@/lib/mongodb/models/auth";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(role: UserRole | UserRole[]) {
  const user = await requireAuth();
  const allowedRoles = Array.isArray(role) ? role : [role];
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden: Insufficient permissions");
  }
  return user;
}

export function hasRole(
  userRole: UserRole,
  requiredRole: UserRole | UserRole[]
): boolean {
  const allowedRoles = Array.isArray(requiredRole)
    ? requiredRole
    : [requiredRole];
  return allowedRoles.includes(userRole);
}
