import { config } from "dotenv";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
const envFallback = resolve(process.cwd(), ".env");
config({ path: envPath });
config({ path: envFallback });

if (!process.env.MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI environment variable is not set!");
  console.error("Please create a .env.local file with:");
  console.error("MONGODB_URI=mongodb://localhost:27017/genitofashion");
  process.exit(1);
}
import mongoose from "mongoose";
import connectDB from "../lib/mongodb/connection";
import { Category, Product } from "../lib/mongodb/models";

async function seedMongoDB() {
  try {
    await connectDB();
    console.log("Connected to MongoDB");
    const categories = [
      { name: "Clothing", slug: "clothing", icon: "👕" },
      { name: "Shoes", slug: "shoes", icon: "👟" },
      { name: "Accessories", slug: "accessories", icon: "👜" },
      { name: "Perfumes", slug: "perfumes", icon: "🌸" },
    ];

    await Category.insertMany(categories, {
      ordered: false,
    }).catch((err) => {
      if (err.code === 11000) {
        console.log("Categories already exist, skipping...");
        return [];
      }
      throw err;
    });
    const categoryMap: { [key: string]: mongoose.Types.ObjectId } = {};
    const existingCategories = await Category.find();
    existingCategories.forEach((cat) => {
      categoryMap[cat.slug] = cat._id;
    });

    const products = [
      {
        name: "DG Black T-Shirt",
        description: "Premium cotton t-shirt with designer logo",
        price: 29990,
        category_id: categoryMap["clothing"],
        image_url: "/images/dg-black-tshirt.jpeg",
        rating: 4.5,
        reviews_count: 12,
        discount: 33,
        stock: 50,
        brand: "Dolce & Gabbana",
        color: "Black",
        gender: "unisex",
        stock_by_size: {
          S: 10,
          M: 15,
          L: 15,
          XL: 10,
        },
        features: [
          "100% Cotton",
          "Machine Washable",
          "Available in Multiple Colors",
        ],
      },
      {
        name: "White Zip Polo",
        description: "Classic polo shirt with zip detail",
        price: 34990,
        category_id: categoryMap["clothing"],
        image_url: "/images/white-zip-polo.jpeg",
        rating: 4.8,
        reviews_count: 24,
        stock: 30,
        brand: "Ralph Lauren",
        color: "White",
        gender: "men",
        stock_by_size: {
          M: 8,
          L: 12,
          XL: 10,
        },
        features: ["Premium Fabric", "Classic Fit", "Durable Construction"],
      },
      {
        name: "Denim Shorts Embroidered",
        description: "Stylish denim shorts with embroidered details",
        price: 24990,
        category_id: categoryMap["clothing"],
        image_url: "/images/denim-shorts-embroidered.jpeg",
        rating: 4.6,
        reviews_count: 18,
        stock: 25,
        brand: "Levi's",
        color: "Blue",
        gender: "women",
        stock_by_size: {
          "28": 5,
          "30": 8,
          "32": 7,
          "34": 5,
        },
        features: ["Stretch Denim", "Comfortable Fit", "Fashion Forward"],
      },
      {
        name: "Black Knit Set",
        description: "Matching knit set for a coordinated look",
        price: 44990,
        category_id: categoryMap["clothing"],
        image_url: "/images/black-knit-set.jpeg",
        rating: 4.9,
        reviews_count: 31,
        discount: 25,
        stock: 15,
        brand: "Zara",
        color: "Black",
        gender: "women",
        stock_by_size: {
          S: 3,
          M: 5,
          L: 4,
          XL: 3,
        },
        features: ["Matching Set", "Premium Quality", "Versatile"],
      },
      {
        name: "Dotted Black Polo",
        description: "Elegant polo with dotted pattern",
        price: 32990,
        category_id: categoryMap["clothing"],
        image_url: "/images/dotted-black-polo.jpeg",
        rating: 4.7,
        reviews_count: 20,
        stock: 35,
        brand: "Tommy Hilfiger",
        color: "Black",
        gender: "men",
        stock_by_size: {
          M: 10,
          L: 12,
          XL: 8,
          XXL: 5,
        },
        features: ["Patterned Design", "Comfortable", "Stylish"],
      },
      {
        name: "DG T-Shirts Set",
        description: "Set of designer t-shirts",
        price: 59990,
        category_id: categoryMap["clothing"],
        image_url: "/images/dg-tshirts-set.jpeg",
        rating: 4.8,
        reviews_count: 28,
        stock: 20,
        brand: "Dolce & Gabbana",
        color: "White",
        gender: "unisex",
        stock_by_size: {
          S: 4,
          M: 6,
          L: 6,
          XL: 4,
        },
        features: ["Set of 3", "Designer Brand", "Value Pack"],
      },
      {
        name: "Black Leather Slides",
        description: "Comfortable leather slides for casual wear",
        price: 19990,
        category_id: categoryMap["shoes"],
        image_url: "/images/black-leather-slides.jpeg",
        rating: 4.7,
        reviews_count: 45,
        discount: 22,
        stock: 40,
        brand: "Adidas",
        color: "Black",
        gender: "men",
        stock_by_size: {
          "40": 5,
          "41": 8,
          "42": 10,
          "43": 9,
          "44": 8,
        },
        features: ["Genuine Leather", "Comfortable", "Slip-On Design"],
      },
      {
        name: "Hermes Black Sandals",
        description: "Luxury sandals from Hermes",
        price: 89990,
        category_id: categoryMap["shoes"],
        image_url: "/images/hermes-black-sandals.jpeg",
        rating: 4.8,
        reviews_count: 28,
        stock: 20,
        brand: "Hermes",
        color: "Black",
        gender: "women",
        stock_by_size: {
          "36": 3,
          "37": 4,
          "38": 5,
          "39": 4,
          "40": 4,
        },
        features: ["Luxury Brand", "Premium Quality", "Elegant Design"],
      },
      {
        name: "Hermes Crystal Sandals",
        description: "Stunning crystal-embellished sandals",
        price: 99990,
        category_id: categoryMap["shoes"],
        image_url: "/images/hermes-crystal-sandals.jpeg",
        rating: 4.9,
        reviews_count: 35,
        stock: 15,
        brand: "Hermes",
        color: "Gold",
        gender: "women",
        stock_by_size: {
          "36": 2,
          "37": 3,
          "38": 4,
          "39": 3,
          "40": 3,
        },
        features: ["Crystal Details", "Luxury Brand", "Statement Piece"],
      },
      {
        name: "Slide Sandals Blue",
        description: "Comfortable blue slide sandals",
        price: 17990,
        category_id: categoryMap["shoes"],
        image_url: "/images/slide-sandals-blue.jpeg",
        rating: 4.6,
        reviews_count: 22,
        discount: 20,
        stock: 28,
        brand: "Nike",
        color: "Blue",
        gender: "unisex",
        stock_by_size: {
          "38": 4,
          "39": 5,
          "40": 6,
          "41": 5,
          "42": 4,
          "43": 4,
        },
        features: ["Comfortable", "Colorful", "Casual Wear"],
      },
    ];

    await Product.insertMany(products, { ordered: false }).catch((err) => {
      if (err.code === 11000) {
        console.log("Some products already exist, skipping duplicates...");
      } else {
        throw err;
      }
    });

    console.log("✅ MongoDB seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding MongoDB:", error);
    process.exit(1);
  }
}

seedMongoDB();
