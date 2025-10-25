"use client";

import { motion } from 'framer-motion';

interface LogoProps {
  size?: number;
  animated?: boolean;
}

export default function Logo({ size = 120, animated = true }: LogoProps) {
  const pathVariants = {
    hidden: {
      pathLength: 0,
      opacity: 0,
    },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 2, ease: "easeInOut" },
        opacity: { duration: 0.5 },
      },
    },
  };

  const compassVariants = {
    hidden: { rotate: -180, scale: 0 },
    visible: {
      rotate: 0,
      scale: 1,
      transition: {
        duration: 1,
        ease: "easeOut",
      },
    },
  };

  const needleVariants = {
    idle: {
      rotate: [0, 10, -10, 5, -5, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={animated ? "hidden" : "visible"}
      animate="visible"
    >
      {/* Outer circle glow */}
      <motion.circle
        cx="100"
        cy="100"
        r="90"
        fill="url(#glow)"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: [0.3, 0.6, 0.3],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Main compass circle */}
      <motion.circle
        cx="100"
        cy="100"
        r="80"
        stroke="url(#gradient1)"
        strokeWidth="4"
        variants={animated ? pathVariants : {}}
      />

      {/* Inner circle */}
      <motion.circle
        cx="100"
        cy="100"
        r="60"
        stroke="url(#gradient2)"
        strokeWidth="2"
        strokeDasharray="5,5"
        variants={animated ? pathVariants : {}}
        transition={{ delay: 0.3 }}
      />

      {/* Cardinal directions */}
      <motion.g variants={animated ? compassVariants : {}}>
        {/* N */}
        <text x="100" y="30" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">N</text>
        {/* E */}
        <text x="170" y="105" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">E</text>
        {/* S */}
        <text x="100" y="180" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">S</text>
        {/* W */}
        <text x="30" y="105" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">W</text>
      </motion.g>

      {/* Compass center */}
      <motion.circle
        cx="100"
        cy="100"
        r="12"
        fill="url(#gradient3)"
        variants={animated ? compassVariants : {}}
        transition={{ delay: 0.5 }}
      />

      {/* Compass needle */}
      <motion.g
        variants={animated ? needleVariants : {}}
        animate={animated ? "idle" : undefined}
        style={{ originX: "100px", originY: "100px" }}
      >
        {/* North pointer (red) */}
        <motion.path
          d="M 100 100 L 95 50 L 100 40 L 105 50 Z"
          fill="#ef4444"
          initial={animated ? { scale: 0 } : {}}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        />
        {/* South pointer (white) */}
        <motion.path
          d="M 100 100 L 95 150 L 100 160 L 105 150 Z"
          fill="white"
          initial={animated ? { scale: 0 } : {}}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        />
      </motion.g>

      {/* Decorative stars */}
      <motion.g
        initial={animated ? { opacity: 0 } : {}}
        animate={{ opacity: [0, 1, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: 1,
        }}
      >
        <circle cx="140" cy="60" r="2" fill="white" />
        <circle cx="60" cy="140" r="2" fill="white" />
        <circle cx="140" cy="140" r="2" fill="white" />
        <circle cx="60" cy="60" r="2" fill="white" />
      </motion.g>

      {/* Gradients */}
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <radialGradient id="glow">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
      </defs>
    </motion.svg>
  );
}
