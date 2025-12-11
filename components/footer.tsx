import Link from "next/link"
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t bg-champagne/30 dark:bg-darkbluegray">
      <div className="container mx-auto max-w-[1300px] px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-semibold">About Us</h3>
            <p className="text-sm text-muted-foreground">
              We are a retail shop in Buea, Cameroon offering quality shoes, clothes, perfumes, chains and more at the
              most competitive prices in the market.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-gold">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-muted-foreground hover:text-gold">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/search?category=shoes" className="text-muted-foreground hover:text-gold">
                  Shoes
                </Link>
              </li>
              <li>
                <Link href="/search?category=clothes" className="text-muted-foreground hover:text-gold">
                  Clothes
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-gold">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-gold">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-gold" />
                <span className="text-muted-foreground">Untarred Malingo Street, Molyko, Buea, Cameroon</span>
              </li>
              <li className="flex items-center">
                <Phone className="mr-2 h-4 w-4 text-gold" />
                <span className="text-muted-foreground">+237 654 321 098</span>
              </li>
              <li className="flex items-center">
                <Mail className="mr-2 h-4 w-4 text-gold" />
                <span className="text-muted-foreground">info@genitofashion.com</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Follow Us</h3>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-gold">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-gold">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-gold">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-champagne/20 dark:border-gray-700 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Genito Fashion. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
