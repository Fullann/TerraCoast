import { motion } from "framer-motion";
import { ReactNode } from "react";

const pageVariants = {
  initial: {
    opacity: 0,
    y: 10, // Léger glissement depuis le bas
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -10, // Léger glissement vers le haut à la sortie
  },
};

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
      className="w-full h-full min-h-screen"
    >
      {children}
    </motion.div>
  );
}
