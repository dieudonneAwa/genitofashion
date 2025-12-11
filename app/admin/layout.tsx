import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth/utils"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireRole(["admin", "staff"])
    return <>{children}</>
  } catch (error) {
    redirect("/")
  }
}

