import { config } from "dotenv"
import { resolve } from "path"
import bcrypt from "bcryptjs"
import connectDB from "../lib/mongodb/connection"
import { User } from "../lib/mongodb/models/auth"

const envPath = resolve(process.cwd(), ".env.local")
const envFallback = resolve(process.cwd(), ".env")
config({ path: envPath })
config({ path: envFallback })

if (!process.env.MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI environment variable is not set!")
  process.exit(1)
}

async function seedAdmin() {
  try {
    await connectDB()
    console.log("Connected to MongoDB")

    const email = process.env.ADMIN_EMAIL || "admin@genito.com"
    const password = process.env.ADMIN_PASSWORD || "admin123"
    const name = process.env.ADMIN_NAME || "Admin User"

    const existingAdmin = await User.findOne({ email: email.toLowerCase() })

    if (existingAdmin) {
      console.log("✅ Admin user already exists!")
      console.log(`Email: ${existingAdmin.email}`)
      console.log(`Role: ${existingAdmin.role}`)
      process.exit(0)
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "admin",
    })

    console.log("✅ Admin user created successfully!")
    console.log(`Email: ${admin.email}`)
    console.log(`Password: ${password}`)
    console.log(`Role: ${admin.role}`)
    console.log("\n⚠️  Please change the default password after first login!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Error seeding admin:", error)
    process.exit(1)
  }
}

seedAdmin()

