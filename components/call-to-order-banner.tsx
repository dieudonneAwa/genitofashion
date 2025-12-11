"use client"

import { Phone } from "lucide-react"
import { motion } from "framer-motion"
import { CallToOrder } from "@/components/call-to-order"

export function CallToOrderBanner() {
  return (
    <motion.div
      className="bg-gradient-to-r from-burgundy to-gold text-white p-4 rounded-lg shadow-md mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-start md:justify-between">
        <div className="flex items-start md:items-center mb-4 md:mb-0">
          <div className="bg-white/20 p-2 rounded-full mr-4">
            <Phone className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <h3 className="font-bold text-lg">Need help with your order?</h3>
            <p className="text-white/80">
              Get personalized assistance and place orders by phone
            </p>
            <CallToOrder
              phoneNumber="+237 654 321 098"
              variant="prominent"
              className="text-burgundy md:hidden mt-2"
            />
          </div>
        </div>
        <CallToOrder
          phoneNumber="+237 654 321 098"
          variant="prominent"
          className="text-burgundy md:block hidden"
        />
      </div>
    </motion.div>
  );
}
