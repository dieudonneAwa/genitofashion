"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, LogIn, UserPlus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function LoginCTABanner() {
  const { data: session, status } = useSession();

  if (status === "loading" || (status === "authenticated" && session)) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="border-2 border-gold/40 bg-gradient-to-r from-gold/15 via-champagne/25 to-gold/15 dark:from-gold/10 dark:via-richblack/40 dark:to-gold/10 shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="p-3 rounded-full bg-gold/30 dark:bg-gold/20 shadow-md">
                <Sparkles className="h-7 w-7 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                  Join Genito Fashion Today!
                </h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  Create an account to save your cart, track orders, get
                  exclusive discounts, and enjoy a personalized shopping
                  experience.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-gold text-gold hover:bg-gold/10 font-semibold whitespace-nowrap"
                asChild
              >
                <Link href="/login" className="flex items-center">
                  <LogIn className="mr-2 h-5 w-5" />
                  Login
                </Link>
              </Button>
              <Button
                size="lg"
                className="bg-gold text-richblack hover:bg-gold/90 font-semibold shadow-md whitespace-nowrap"
                asChild
              >
                <Link href="/register" className="flex items-center">
                  <UserPlus className="mr-2 h-5 w-5" />
                  Sign Up Free
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
