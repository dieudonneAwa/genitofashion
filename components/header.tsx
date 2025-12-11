"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Menu,
  ShoppingCart,
  User,
  LogOut,
  Shield,
  Settings,
  Package,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import Logo from "@/components/logo";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/cart-context";
import { CallToOrder } from "@/components/call-to-order";
import { SearchAutocomplete } from "@/components/search-autocomplete";
import { saveSearchHistory } from "@/lib/search-utils";

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const pathname = usePathname();
  const { itemCount } = useCart();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  // Track scroll position to add shadow to header when scrolled
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const routes = [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  // Show login button when not authenticated (including when loading)
  const isAuthenticated = status === "authenticated" && session;

  // Type-safe session user access
  const user = session?.user;

  const isActive = (path: string) => {
    return pathname === path;
  };

  // Phase 1: Use Next.js router instead of window.location
  const handleSearch = (query: string) => {
    if (query.trim()) {
      setIsSearching(true);
      saveSearchHistory(query.trim());
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      // Loading state will clear on navigation
    }
  };

  // Phase 2: Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search on "/" key (when not typing in input/textarea)
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <motion.header
      className={`sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm transition-shadow ${
        isScrolled ? "shadow-md" : ""
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
    >
      <div className="container mx-auto max-w-[1300px] px-4">
        {/* Desktop layout */}
        <div className="hidden md:flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Logo alwaysShowText={true} />

            {/* Desktop Navigation */}
            <nav className="ml-6 flex space-x-6 items-center">
              {routes.map((route, index) => (
                <motion.div
                  key={route.path}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 1) }}
                >
                  <Link
                    href={route.path}
                    className={`relative text-sm font-medium transition-colors hover:text-gold ${
                      isActive(route.path)
                        ? "text-gold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {route.name}
                    {isActive(route.path) && (
                      <motion.span
                        className="absolute -bottom-[21px] left-0 h-[2px] w-full bg-gold"
                        layoutId="underline"
                      />
                    )}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </div>

          {/* Desktop Search and Actions */}
          <div className="flex items-center space-x-4">
            <SearchAutocomplete
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={handleSearch}
              placeholder="Search products... (Press '/' to focus)"
              className="w-[250px]"
              inputClassName="text-xs border-gold/30 focus:border-gold"
              size="sm"
              showSearchButton={false}
              inputRef={searchInputRef}
            />

            {isAuthenticated && user ? (
              <>
                {(user.role === "admin" || user.role === "staff") && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="gold"
                      size="icon"
                      className="text-richblack font-medium h-8 w-auto px-3"
                      asChild
                    >
                      <Link href="/admin">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin
                      </Link>
                    </Button>
                  </motion.div>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-2 gap-2 hover:bg-gold/10 border border-transparent hover:border-gold/20 transition-all"
                    >
                      <Avatar className="h-7 w-7 border border-gold/30">
                        <AvatarImage
                          src={user.image || undefined}
                          alt={user.name || "User"}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-gold to-emerald text-richblack font-semibold text-xs">
                          {user.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline-block text-sm font-medium text-foreground">
                        {user.name?.split(" ")[0] || "Account"}
                      </span>
                      <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 p-2">
                    <DropdownMenuLabel className="p-0">
                      <div className="flex items-center gap-3 px-2 py-3 rounded-lg bg-gradient-to-br from-gold/10 to-emerald/10 border border-gold/20">
                        <Avatar className="h-10 w-10 border-2 border-gold/40">
                          <AvatarImage
                            src={user.image || undefined}
                            alt={user.name || "User"}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-gold to-emerald text-richblack font-semibold">
                            {user.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {user.name || "User"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email || ""}
                          </p>
                          {(user.role === "admin" || user.role === "staff") && (
                            <Badge
                              variant="secondary"
                              className="mt-1 text-[10px] px-1.5 py-0 bg-gold/20 text-gold border-gold/30"
                            >
                              <Shield className="h-2.5 w-2.5 mr-1" />
                              {user.role === "admin" ? "Admin" : "Staff"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem
                      asChild
                      className="cursor-pointer rounded-md"
                    >
                      <Link href="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      asChild
                      className="cursor-pointer rounded-md"
                    >
                      <Link href="/orders" className="flex items-center">
                        <Package className="mr-2 h-4 w-4" />
                        <span>My Orders</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      asChild
                      className="cursor-pointer rounded-md"
                    >
                      <Link href="/cart" className="flex items-center">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        <span>My Cart</span>
                        {itemCount > 0 && (
                          <Badge
                            variant="secondary"
                            className="ml-auto bg-burgundy text-white text-[10px] px-1.5 py-0"
                          >
                            {itemCount > 99 ? "99+" : itemCount}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      asChild
                      className="cursor-pointer rounded-md"
                    >
                      <Link href="/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 rounded-md"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              // Show Login button when not authenticated
              <Button
                variant="outline"
                size="sm"
                className="border-gold text-gold hover:bg-gold/10 h-8"
                asChild
              >
                <Link href="/login">
                  <User className="mr-2 h-4 w-4" />
                  Login
                </Link>
              </Button>
            )}

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <Button
                variant="outline"
                size="sm"
                className="border-none text-gold hover:bg-gold/10 overflow-visible"
                asChild
              >
                <Link href="/cart" className="flex items-center">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  <span>Basket</span>
                </Link>
              </Button>
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-2 -top-2 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-burgundy text-[10px] font-bold text-white z-20 px-1 pointer-events-none"
                  >
                    {itemCount > 99 ? "99+" : itemCount}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <ThemeToggle />
          </div>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden">
          {/* Top row with menu, logo, and icons */}
          <div className="flex h-14 items-center justify-between">
            {/* Mobile Menu Button */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0"
                  onClick={() => setIsMenuOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[250px] sm:w-[300px]">
                <div className="flex flex-col h-full">
                  <div className="py-4">
                    <Logo alwaysShowText={true} />
                  </div>
                  <nav className="flex flex-col space-y-4 mt-4">
                    {routes.map((route) => (
                      <Link
                        key={route.path}
                        href={route.path}
                        className={`px-2 py-2 text-sm font-medium rounded-md transition-colors hover:bg-gold/10 hover:text-gold ${
                          isActive(route.path)
                            ? "bg-gold/10 text-gold"
                            : "text-muted-foreground"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {route.name}
                      </Link>
                    ))}
                    {!isAuthenticated && (
                      <div className="pt-2 border-t border-gold/20">
                        <Link
                          href="/login"
                          className="flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors bg-gold text-richblack hover:bg-gold/90"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <User className="mr-2 h-4 w-4" />
                          Login
                        </Link>
                      </div>
                    )}
                  </nav>

                  {/* Call to Order Button in Mobile Menu */}
                  <div className="mt-6 px-2">
                    <CallToOrder
                      phoneNumber="+237 654 321 098"
                      variant="prominent"
                      className="w-full"
                    />
                  </div>

                  <div className="mt-auto pb-6 space-y-2">
                    {isAuthenticated && user ? (
                      <>
                        {(user.role === "admin" || user.role === "staff") && (
                          <Link
                            href="/admin"
                            className="block px-2 py-2 text-sm font-medium text-gold hover:bg-gold/10 rounded-md"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <Shield className="inline mr-2 h-4 w-4" />
                            Admin Dashboard
                          </Link>
                        )}
                        <div className="px-2 py-2 text-sm text-muted-foreground">
                          <p className="font-medium">{user.name || "User"}</p>
                          <p className="text-xs">{user.email || ""}</p>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            handleSignOut();
                            setIsMenuOpen(false);
                          }}
                          className="w-full justify-start px-2 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md"
                        >
                          <LogOut className="inline mr-2 h-4 w-4" />
                          Sign out
                        </Button>
                      </>
                    ) : (
                      // Login link in mobile menu footer (nav menu already has Login/Register above)
                      // This provides quick access at the bottom of the menu
                      <Link
                        href="/login"
                        className="block px-2 py-2 text-sm font-medium text-gold hover:bg-gold/10 rounded-md"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="inline mr-2 h-4 w-4" />
                        Login
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo - Centered on mobile */}
            <div className="flex items-center justify-center">
              <Logo alwaysShowText={false} />
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <Button
                  variant="outline"
                  size="icon"
                  className="border-gold text-gold hover:bg-gold/10 h-8 w-8 overflow-visible"
                  asChild
                >
                  <Link href="/cart">
                    <ShoppingCart className="h-4 w-4" />
                  </Link>
                </Button>
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -right-1.5 -top-1.5 flex min-w-[16px] h-4 items-center justify-center rounded-full bg-burgundy text-[9px] font-bold text-white z-20 px-0.5 pointer-events-none"
                    >
                      {itemCount > 99 ? "99+" : itemCount}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              <ThemeToggle />
            </div>
          </div>

          {/* Search bar row - Full width on mobile */}
          <div className="pb-2 pt-1">
            <SearchAutocomplete
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={handleSearch}
              placeholder="Search products... (Press '/' to focus)"
              className="w-full"
              inputClassName="text-sm border-gold/30 focus:border-gold"
              size="md"
              showSearchButton={true}
              inputRef={searchInputRef}
            />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
