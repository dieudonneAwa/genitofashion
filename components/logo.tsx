"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

interface LogoProps {
  alwaysShowText?: boolean;
}

export default function Logo({ alwaysShowText = false }: LogoProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <Link href="/" className="flex items-center space-x-0">
      <motion.div
        className="relative"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg
          width="59.5"
          height="26"
          viewBox="0 0 243 106.16286207989948"
          className="looka-1j8o68f"
        >
          <g
            id="SvgjsG1113"
            transform="matrix(0.22865853658536586,0,0,0.22865853658536586,0,0.06529935976354087)"
            fill="#d4af37"
          >
            <defs xmlns="http://www.w3.org/2000/svg"></defs>
            <g xmlns="http://www.w3.org/2000/svg">
              <path
                className="fil0"
                d="M0 333c0,0 106,-65 145,-80 39,-15 62,-23 100,-52 39,-30 88,-91 105,-104 17,-12 17,-8 49,-19 40,-14 95,-98 116,-74 12,15 44,107 58,69 6,-16 19,-42 32,-32 14,11 11,9 25,60 14,51 20,48 38,66 19,17 5,9 25,49 21,40 62,85 77,109 10,18 18,32 21,37 -44,-14 -127,-38 -223,-54 -9,-17 -10,-45 -12,-55 -8,-40 -60,-28 -42,-61 6,-13 89,-89 61,-85 -17,3 -47,9 -53,12 -85,36 20,-84 -66,-47 -8,4 -31,0 -45,15 -13,15 -31,-3 -47,15 -16,18 -6,26 -32,47 -25,21 -24,22 -46,37 -21,15 -24,36 -43,43 -18,7 -53,24 -65,24 -13,0 -63,30 -69,36 -5,7 -109,44 -109,44z"
                style={{ fill: "#d4af37" }}
              ></path>
              <path
                className="fil0"
                d="M35 356c0,0 212,-57 406,-43 193,14 379,81 379,81l-72 19c-156,-59 -317,-77 -317,-77 0,0 154,49 243,97l-121 31c0,0 -125,-75 -209,-99 -83,-24 -309,-9 -309,-9z"
                style={{ fill: "#d4af37" }}
              ></path>
            </g>
          </g>
        </svg>
      </motion.div>
      <motion.span
        className={`text-lg md:text-xl -ml-4 font-bold ${
          alwaysShowText ? "inline-block" : "hidden xs:inline-block"
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Genito
        <span className="text-gold">Fashion</span>
      </motion.span>
    </Link>
  );
}
