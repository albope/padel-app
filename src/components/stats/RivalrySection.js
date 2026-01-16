// src/components/stats/RivalrySection.js
// Section 2: Head-to-head rivalry stats against each player

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { motion } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import dayjs from 'dayjs';
import { tokens } from '../../theme';
import GlassCard from './ui/GlassCard';

const RivalCard = ({ rivalry, selectedPlayer, onClick }) => {
  const theme = useTheme();
  const { rival, wins, losses, total, winRate, balance } = rivalry;

  // Determine status
  const isWinning = balance > 0;
  const isLosing = balance < 0;

  const statusColor = isWinning
    ? theme.palette.success.main
    : isLosing
    ? theme.palette.error.light
    : theme.palette.info.main;

  const StatusIcon = isWinning
    ? EmojiEventsIcon
    : isLosing
    ? CloseOutlinedIcon
    : RemoveIcon;

  return (
    <GlassCard
      component={motion.div}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(rivalry)}
      accentColor={statusColor}
      accentPosition="top"
      sx={{
        cursor: 'pointer',
        height: '100%',
        textAlign: 'center',
      }}
    >
      {/* Rival Name */}
      <Typography
        variant="overline"
        sx={{
          fontFamily: tokens.typography.bodyFont,
          color: alpha(theme.palette.text.primary, 0.6),
          fontSize: '0.65rem',
          letterSpacing: '0.1em',
        }}
      >
        vs
      </Typography>
      <Typography
        variant="h5"
        sx={{
          fontFamily: tokens.typography.displayFont,
          color: theme.palette.text.primary,
          mb: 2,
          textTransform: 'uppercase',
        }}
      >
        {rival}
      </Typography>

      {/* Score */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          mb: 2,
        }}
      >
        <Typography
          variant="h3"
          sx={{
            fontFamily: tokens.typography.monoFont,
            fontWeight: 700,
            color: theme.palette.success.main,
          }}
        >
          {wins}
        </Typography>
        <Typography
          variant="h4"
          sx={{
            fontFamily: tokens.typography.monoFont,
            color: alpha(theme.palette.text.primary, 0.4),
          }}
        >
          -
        </Typography>
        <Typography
          variant="h3"
          sx={{
            fontFamily: tokens.typography.monoFont,
            fontWeight: 700,
            color: theme.palette.error.light,
          }}
        >
          {losses}
        </Typography>
      </Box>

      {/* Status Badge */}
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1.5,
          py: 0.5,
          borderRadius: 2,
          background: alpha(statusColor, 0.15),
          border: `1px solid ${alpha(statusColor, 0.3)}`,
        }}
      >
        <StatusIcon sx={{ color: statusColor, fontSize: 18 }} />
        <Typography
          variant="caption"
          sx={{
            fontFamily: tokens.typography.monoFont,
            fontWeight: 700,
            color: statusColor,
            fontSize: '0.8rem',
          }}
        >
          {winRate}%
        </Typography>
      </Box>

      {/* Total matches */}
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mt: 1.5,
          fontFamily: tokens.typography.bodyFont,
          color: alpha(theme.palette.text.primary, 0.5),
          fontSize: '0.7rem',
        }}
      >
        {total} enfrentamiento{total !== 1 ? 's' : ''}
      </Typography>
    </GlassCard>
  );
};

const RivalryDetailModal = ({ open, onClose, rivalry, selectedPlayer }) => {
  const theme = useTheme();

  if (!rivalry) return null;

  const { rival, wins, losses, winRate, matches } = rivalry;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(145deg,
            ${alpha(theme.palette.primary.main, 0.98)} 0%,
            ${alpha(theme.palette.primary.dark, 0.99)} 100%)`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
        }}
      >
        <Box>
          <Typography
            variant="overline"
            sx={{
              fontFamily: tokens.typography.bodyFont,
              color: alpha(theme.palette.text.primary, 0.6),
              display: 'block',
            }}
          >
            Historial vs
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontFamily: tokens.typography.displayFont,
              color: theme.palette.text.primary,
              textTransform: 'uppercase',
            }}
          >
            {rival}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: theme.palette.text.primary }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Summary */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 4,
            mb: 3,
            pb: 3,
            borderBottom: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h3"
              sx={{
                fontFamily: tokens.typography.monoFont,
                fontWeight: 700,
                color: theme.palette.success.main,
              }}
            >
              {wins}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: tokens.typography.bodyFont,
                color: alpha(theme.palette.text.primary, 0.6),
                textTransform: 'uppercase',
              }}
            >
              Victorias
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h3"
              sx={{
                fontFamily: tokens.typography.monoFont,
                fontWeight: 700,
                color: theme.palette.error.light,
              }}
            >
              {losses}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: tokens.typography.bodyFont,
                color: alpha(theme.palette.text.primary, 0.6),
                textTransform: 'uppercase',
              }}
            >
              Derrotas
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h3"
              sx={{
                fontFamily: tokens.typography.monoFont,
                fontWeight: 700,
                color: theme.palette.secondary.main,
              }}
            >
              {winRate}%
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: tokens.typography.bodyFont,
                color: alpha(theme.palette.text.primary, 0.6),
                textTransform: 'uppercase',
              }}
            >
              Efectividad
            </Typography>
          </Box>
        </Box>

        {/* Match List */}
        <Typography
          variant="subtitle2"
          sx={{
            fontFamily: tokens.typography.displayFont,
            color: theme.palette.text.primary,
            mb: 2,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Partidos
        </Typography>

        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
          {matches
            .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
            .map((match, index) => (
              <React.Fragment key={index}>
                <ListItem
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderRadius: 2,
                    backgroundColor: match.won
                      ? alpha(theme.palette.success.main, 0.08)
                      : alpha(theme.palette.error.main, 0.08),
                    mb: 1,
                  }}
                >
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: tokens.typography.bodyFont,
                            color: theme.palette.text.primary,
                          }}
                        >
                          {dayjs(match.date).format('DD MMM YYYY')}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: tokens.typography.monoFont,
                            fontWeight: 700,
                            color: match.won
                              ? theme.palette.success.main
                              : theme.palette.error.light,
                          }}
                        >
                          {match.won ? 'VICTORIA' : 'DERROTA'}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: tokens.typography.bodyFont,
                          color: alpha(theme.palette.text.primary, 0.6),
                        }}
                      >
                        Pareja: {match.partner || 'N/A'} vs {match.rivalPartner || 'N/A'}
                      </Typography>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};

const RivalrySection = ({ rivalryStats, selectedPlayer }) => {
  const theme = useTheme();
  const [selectedRivalry, setSelectedRivalry] = useState(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (!rivalryStats || rivalryStats.length === 0) {
    return (
      <Box>
        <Typography
          variant="h5"
          sx={{
            fontFamily: tokens.typography.displayFont,
            color: theme.palette.text.primary,
            mb: 3,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Rivalidades
        </Typography>
        <GlassCard>
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              color: alpha(theme.palette.text.primary, 0.5),
              py: 4,
            }}
          >
            No hay suficientes datos de enfrentamientos
          </Typography>
        </GlassCard>
      </Box>
    );
  }

  return (
    <Box
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Typography
        variant="h5"
        component={motion.h2}
        variants={itemVariants}
        sx={{
          fontFamily: tokens.typography.displayFont,
          color: theme.palette.text.primary,
          mb: 3,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Rivalidades
      </Typography>

      <Grid container spacing={2}>
        {rivalryStats.map((rivalry, index) => (
          <Grid item xs={12} sm={4} key={rivalry.rival}>
            <motion.div variants={itemVariants}>
              <RivalCard
                rivalry={rivalry}
                selectedPlayer={selectedPlayer}
                onClick={setSelectedRivalry}
              />
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <RivalryDetailModal
        open={!!selectedRivalry}
        onClose={() => setSelectedRivalry(null)}
        rivalry={selectedRivalry}
        selectedPlayer={selectedPlayer}
      />
    </Box>
  );
};

export default RivalrySection;
