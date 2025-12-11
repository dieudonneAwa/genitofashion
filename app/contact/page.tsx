"use client"

import Link from "next/link"
import type React from "react"
import { useState } from "react"
import { Mail, MapPin, Phone, Send, Clock, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ViewportSection } from "@/components/viewport-section"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // In a real application, you would send this data to your server
    console.log("Form submitted:", formData)
    toast({
      title: "Message Sent",
      description: "Thank you for contacting us. We'll get back to you soon!",
    })

    // Reset form
    setFormData({
      name: "",
      email: "",
      phone: "",
      message: "",
    })
    setIsSubmitting(false)
  }

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
          Get in <span className="text-gold">Touch</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Have questions or want to learn more about our products? We're here to help you.
        </p>
      </motion.div>

      <div className="mb-12 grid gap-6 md:grid-cols-2">
        <ViewportSection threshold={0.05}>
          <div className="flex flex-col justify-between">
            <div>
              <h2 className="mb-6 text-2xl font-bold">Contact Information</h2>
              <motion.div
                className="mb-6 space-y-4"
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.1 }}
              >
                <motion.div variants={item} className="contact-card rounded-lg border p-4">
                  <div className="flex items-start space-x-4">
                    <div className="icon-container">
                      <MapPin className="h-6 w-6 text-gold" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold">Our Location</h3>
                      <p className="text-muted-foreground">
                        Untarred Malingo Street, Molyko
                        <br />
                        Buea, Cameroon
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={item} className="contact-card rounded-lg border p-3">
                  <div className="flex items-start space-x-3">
                    <div className="icon-container">
                      <Phone className="h-4 w-4 text-gold" />
                    </div>
                    <div>
                      <h3 className="mb-1 text-xs font-semibold">Phone Number</h3>
                      <p className="text-xs text-muted-foreground">+237 XXX XXX XXX</p>
                      <p className="text-xs text-muted-foreground">+237 XXX XXX XXX</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={item} className="contact-card rounded-lg border p-3">
                  <div className="flex items-start space-x-3">
                    <div className="icon-container">
                      <Mail className="h-4 w-4 text-gold" />
                    </div>
                    <div>
                      <h3 className="mb-1 text-xs font-semibold">Email Address</h3>
                      <p className="text-xs text-muted-foreground">info@genitofashion.com</p>
                      <p className="text-xs text-muted-foreground">support@genitofashion.com</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={item} className="contact-card rounded-lg border p-3">
                  <div className="flex items-start space-x-3">
                    <div className="icon-container">
                      <Clock className="h-4 w-4 text-gold" />
                    </div>
                    <div>
                      <h3 className="mb-1 text-xs font-semibold">Business Hours</h3>
                      <p className="text-xs text-muted-foreground">Monday - Friday: 9:00 AM - 6:00 PM</p>
                      <p className="text-xs text-muted-foreground">Saturday: 9:00 AM - 5:00 PM</p>
                      <p className="text-xs text-muted-foreground">Sunday: Closed</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            <motion.div
              className="mt-6 rounded-lg bg-champagne/20 dark:bg-darkbluegray/40 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="mb-2 text-sm font-semibold">Follow Us</h3>
              <p className="mb-3 text-xs text-muted-foreground">
                Stay connected with us on social media for the latest products and promotions.
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-full border-gold text-gold hover:bg-gold/10"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                  <span className="sr-only">Facebook</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-full border-gold text-gold hover:bg-gold/10"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                  <span className="sr-only">Instagram</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-full border-gold text-gold hover:bg-gold/10"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                  <span className="sr-only">Twitter</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-full border-gold text-gold hover:bg-gold/10"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                  <span className="sr-only">LinkedIn</span>
                </Button>
              </div>
            </motion.div>
          </div>
        </ViewportSection>

        <ViewportSection threshold={0.05}>
          <Card className="overflow-hidden border-champagne/30 dark:border-gray-700">
            <CardContent className="p-0">
              <div className="bg-champagne/30 dark:bg-darkbluegray/40 p-6">
                <h2 className="text-2xl font-bold">Send Us a Message</h2>
                <p className="text-muted-foreground">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-xs font-medium">
                      Your Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      required
                      className="contact-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-xs font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      required
                      className="contact-input"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+237 XXX XXX XXX"
                    className="contact-input"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="message" className="text-xs font-medium">
                    Your Message
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="How can we help you?"
                    rows={4}
                    required
                    className="contact-input resize-none text-xs"
                  />
                </div>
                <Button type="submit" className="w-full text-xs" variant="gold" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-3 w-3"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Send className="mr-1 h-3 w-3" />
                      Send Message
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </ViewportSection>
      </div>

      <ViewportSection className="mb-12" threshold={0.05}>
        <h2 className="mb-6 text-2xl font-bold text-center">Find Us</h2>
        <div className="map-container">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15922.25373930267!2d9.278889!3d4.156944!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1061128be2e1fe7d%3A0x92daa1444781c48b!2sMolyko%2C%20Buea%2C%20Cameroon!5e0!3m2!1sen!2sus!4v1617293154587!5m2!1sen!2sus"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            title="Genito Fashion Location"
          ></iframe>
        </div>
      </ViewportSection>

      <ViewportSection className="rounded-lg bg-champagne/30 dark:bg-darkbluegray/40 p-6 text-center" threshold={0.1}>
        <h2 className="mb-4 text-3xl font-bold">Visit Our Store Today</h2>
        <p className="mx-auto mb-6 max-w-2xl text-lg text-muted-foreground">
          Experience our products in person at our store in Untarred Malingo Street, Molyko. Our friendly staff is ready
          to help you find exactly what you're looking for at the best prices in town.
        </p>
        <Button size="sm" variant="burgundy" className="group text-xs">
          <Link href="/products" className="flex items-center">
            Browse Our Products
            <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </ViewportSection>
    </main>
  )
}
