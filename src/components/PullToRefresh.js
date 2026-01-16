// PullToRefresh.js
import React, { useState, useRef, useCallback } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import RefreshIcon from '@mui/icons-material/Refresh';
import { hapticMedium } from '../utils/haptics';

/**
 * PullToRefresh component
 * Implements a pull-to-refresh gesture for mobile devices
 */
const PullToRefresh = ({ onRefresh, children, threshold = 80 }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef(null);
  const y = useMotionValue(0);
  const startY = useRef(0);

  // Transform pull distance to rotation for the icon
  const rotate = useTransform(y, [0, threshold], [0, 360]);
  const opacity = useTransform(y, [0, threshold], [0, 1]);

  const handleTouchStart = useCallback((e) => {
    // Only start pulling if at the top of the page
    if (window.scrollY === 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    // Only allow pulling down
    if (diff > 0 && window.scrollY === 0) {
      // Prevent default scrolling when pulling
      e.preventDefault();

      // Apply resistance to the pull (diminishing returns)
      const resistance = 0.4;
      const pullDistance = Math.min(diff * resistance, threshold * 1.5);
      y.set(pullDistance);

      // Haptic feedback when reaching threshold
      if (pullDistance >= threshold && pullDistance - 1 < threshold) {
        hapticMedium();
      }
    }
  }, [isPulling, isRefreshing, y, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || isRefreshing) return;

    setIsPulling(false);

    const currentY = y.get();

    if (currentY >= threshold) {
      // Trigger refresh
      setIsRefreshing(true);
      hapticMedium();

      // Animate to refresh position
      animate(y, threshold, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      });

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh error:', error);
      } finally {
        // Animate back to start
        animate(y, 0, {
          type: 'spring',
          stiffness: 300,
          damping: 30,
        });
        setIsRefreshing(false);
      }
    } else {
      // Didn't reach threshold, bounce back
      animate(y, 0, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      });
    }
  }, [isPulling, isRefreshing, y, threshold, onRefresh]);

  return (
    <Box
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      sx={{
        position: 'relative',
        width: '100%',
        minHeight: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Pull indicator */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          y: -80,
          opacity,
          zIndex: 10,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {isRefreshing ? (
            <CircularProgress size={32} />
          ) : (
            <motion.div style={{ rotate }}>
              <RefreshIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            </motion.div>
          )}
          <Typography variant="caption" color="text.secondary">
            {isRefreshing ? 'Actualizando...' : 'Desliza para actualizar'}
          </Typography>
        </Box>
      </motion.div>

      {/* Content */}
      <motion.div
        style={{
          y,
          width: '100%',
        }}
      >
        {children}
      </motion.div>
    </Box>
  );
};

export default PullToRefresh;
