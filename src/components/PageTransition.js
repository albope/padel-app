// PageTransition.js
import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition component adds smooth animations when navigating between routes
 * Uses Framer Motion for fluid page transitions
 */
const PageTransition = ({ children }) => {
  const location = useLocation();

  // Animation variants for different types of transitions
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2,
        ease: 'easeIn',
      },
    },
  };

  return (
    <motion.div
      key={location.pathname}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      style={{
        width: '100%',
        minHeight: '100%',
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
