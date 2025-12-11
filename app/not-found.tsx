import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[70vh] px-4 py-16 mx-auto">
      <h1 className="text-6xl font-bold text-gold">404</h1>
      <h2 className="mt-4 text-2xl font-semibold">Page Not Found</h2>
      <p className="mt-2 text-muted-foreground text-center max-w-md">
        Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
      </p>
      <div className="mt-8">
        <Button asChild>
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
      <div className="mt-8">
        <p className="text-sm text-muted-foreground mb-2">You might want to check these pages instead:</p>
        <ul className="text-sm space-y-1">
          <li>
            <Link href="/products" className="text-gold hover:underline">
              /products
            </Link>
          </li>
          <li>
            <Link href="/about" className="text-gold hover:underline">
              /about
            </Link>
          </li>
          <li>
            <Link href="/contact" className="text-gold hover:underline">
              /contact
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}
