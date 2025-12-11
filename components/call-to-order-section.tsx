"use client"

import { Phone, ShoppingBag } from "lucide-react"
import { motion } from "framer-motion"
import { CallToOrder } from "@/components/call-to-order"
import { ViewportSection } from "@/components/viewport-section"

export function CallToOrderSection() {
  return (
    <ViewportSection threshold={0.1}>
      <div className="bg-champagne/20 dark:bg-richblack/40 rounded-lg p-8 mt-12">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            className="bg-gold/20 p-3 rounded-full inline-flex mb-4"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Phone className="h-6 w-6 text-gold" />
          </motion.div>

          <motion.h2
            className="text-2xl md:text-3xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Can't find what you're looking for?
          </motion.h2>

          <motion.p
            className="text-muted-foreground mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            Our team is ready to assist you with finding the perfect product. Call us now for personalized assistance
            and to place your order by phone.
          </motion.p>

          <motion.div
            className="flex flex-col md:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <CallToOrder phoneNumber="+237 654 321 098" variant="prominent" className="w-full md:w-auto" />

            <div className="flex items-center text-sm text-muted-foreground">
              <ShoppingBag className="h-4 w-4 mr-2" />
              <span>Fast delivery available</span>
            </div>
          </motion.div>
        </div>
      </div>
    </ViewportSection>
  )
}
