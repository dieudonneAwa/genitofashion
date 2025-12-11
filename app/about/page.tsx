"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { ViewportSection } from "@/components/viewport-section"

export default function AboutPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-[1300px]">
      <motion.div
        className="mb-12 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="mb-4 text-4xl font-bold">
          About <span className="text-gold">Genito Fashion</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          We are a premier fashion retail shop in Cameroon offering quality products at competitive prices.
        </p>
      </motion.div>

      <ViewportSection className="mb-12 grid gap-6 md:grid-cols-2 md:items-center" threshold={0.1}>
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-4 text-3xl font-bold">Our Story</h2>
          <p className="mb-4 text-muted-foreground">
            Founded in 2023, Genito Fashion started as a boutique in Buea with a vision to provide high-quality products
            to our local community. Located at Untarred Malingo Street in Molyko, we've quickly become one of the most
            trusted fashion retailers in Cameroon.
          </p>
          <p className="mb-6 text-muted-foreground">
            We take pride in curating a selection of the finest shoes, clothes, perfumes, and accessories from both
            local and international brands, ensuring our customers always have access to the best products at the most
            competitive prices in the market.
          </p>
          <motion.div
            className="space-y-1.5"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <motion.div className="flex items-center" variants={item}>
              <CheckCircle2 className="mr-2 h-5 w-5 text-gold" />
              <span>Quality products from trusted sources</span>
            </motion.div>
            <motion.div className="flex items-center" variants={item}>
              <CheckCircle2 className="mr-2 h-4 w-4 text-gold" />
              <span className="text-xs">Prices 15-30% lower than competitors</span>
            </motion.div>
            <motion.div className="flex items-center" variants={item}>
              <CheckCircle2 className="mr-2 h-4 w-4 text-gold" />
              <span className="text-xs">Excellent customer service</span>
            </motion.div>
            <motion.div className="flex items-center" variants={item}>
              <CheckCircle2 className="mr-2 h-4 w-4 text-gold" />
              <span className="text-xs">Fast and reliable delivery options</span>
            </motion.div>
          </motion.div>
        </motion.div>
        <motion.div
          className="rounded-lg bg-champagne/20 dark:bg-richblack/40 p-4"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative aspect-[3/2] overflow-hidden rounded-lg">
            <Image
              src="/images/hermes-crystal-sandals.jpeg"
              alt="Our Premium Products"
              fill
              className="object-cover"
              loading="lazy"
            />
          </div>
        </motion.div>
      </ViewportSection>

      <ViewportSection className="mb-12" threshold={0.1}>
        <motion.h2
          className="mb-8 text-center text-3xl font-bold"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          What We <span className="text-gold">Offer</span>
        </motion.h2>
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
        >
          <motion.div variants={item}>
            <Card className="h-full transition-all hover:shadow-md border-champagne/20 hover:border-gold">
              <CardContent className="p-6 text-center">
                <motion.div
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-champagne/20 dark:bg-richblack/40"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Image
                    src="/images/slide-sandals-blue.jpeg"
                    alt="Shoes"
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                    style={{ width: "auto", height: "auto" }}
                    loading="lazy"
                  />
                </motion.div>
                <h3 className="mb-2 text-xl font-semibold">Shoes</h3>
                <p className="text-muted-foreground">
                  Quality footwear for all occasions, from casual sneakers to designer sandals at prices 20% below
                  market average.
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={item}>
            <Card className="h-full transition-all hover:shadow-md border-champagne/20 hover:border-gold">
              <CardContent className="p-4 text-center">
                <motion.div
                  className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-champagne/20 dark:bg-richblack/40"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Image
                    src="/images/dg-black-tshirt.jpeg"
                    alt="Clothes"
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                    style={{ width: "auto", height: "auto" }}
                    loading="lazy"
                  />
                </motion.div>
                <h3 className="mb-1 text-sm font-semibold">Clothes</h3>
                <p className="text-xs text-muted-foreground">
                  Stylish and comfortable clothing for men and women, including designer brands at unbeatable prices.
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={item}>
            <Card className="h-full transition-all hover:shadow-md border-champagne/20 hover:border-gold">
              <CardContent className="p-4 text-center">
                <motion.div
                  className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-champagne/20 dark:bg-richblack/40"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-xl">🧴</span>
                </motion.div>
                <h3 className="mb-1 text-sm font-semibold">Perfumes</h3>
                <p className="text-xs text-muted-foreground">
                  Luxurious fragrances from top brands that leave a lasting impression, priced 15-25% below competitors.
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={item}>
            <Card className="h-full transition-all hover:shadow-md border-champagne/20 hover:border-gold">
              <CardContent className="p-4 text-center">
                <motion.div
                  className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-champagne/20 dark:bg-richblack/40"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-xl">⛓️</span>
                </motion.div>
                <h3 className="mb-1 text-sm font-semibold">Chains & Accessories</h3>
                <p className="text-xs text-muted-foreground">
                  Beautiful jewelry and accessories to complement your style and outfit at the most competitive prices
                  in Buea.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </ViewportSection>

      <ViewportSection
        className="mb-12 rounded-lg bg-champagne/30 dark:bg-richblack/40 p-6 text-center"
        threshold={0.1}
      >
        <h2 className="mb-4 text-3xl font-bold">Visit Our Store</h2>
        <p className="mx-auto mb-6 max-w-2xl text-lg text-muted-foreground">
          We'd love to welcome you to our physical store at Untarred Malingo Street in Molyko, Buea. Come explore our
          full range of products and get personalized assistance from our friendly staff.
        </p>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button size="sm" className="bg-burgundy hover:bg-burgundy/90 text-white" asChild>
            <Link href="/contact">Contact Us</Link>
          </Button>
        </motion.div>
      </ViewportSection>
    </main>
  )
}
