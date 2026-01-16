// src/components/ResultForm.js
// Premium Multi-Step Wizard with "Athletic Luxury Club" Design

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Button,
  Container,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Box,
  Paper,
  FormHelperText,
  Alert,
  Chip,
  useTheme,
  alpha,
  Avatar,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ReplayIcon from '@mui/icons-material/Replay';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import ScoreboardIcon from '@mui/icons-material/Scoreboard';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import dayjs from 'dayjs';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

// Context hooks
import { useSnackbar } from '../context/SnackbarContext';
import { useData } from '../context/DataContext';

// Haptic feedback
import { hapticSuccess, hapticLight, hapticMedium } from '../utils/haptics';

// Custom components
import { PlayerSelector } from './PlayerChip';
import { SetScoreInput } from './ScoreStepper';

// Theme tokens
import { tokens } from '../theme';

// Constants
const PLAYERS_LIST = ['Lucas', 'Ricardo', 'Martin', 'Bort', 'Invitado'];
const LOCATIONS_LIST = ['Passing Padel', 'Elite Padel 22', 'Flow Padel', 'Aspresso k7', 'Otro'];

// Premium pair colors using theme tokens
const PAIR_COLORS = {
  pair1: tokens.colors.championshipGold.main, // Gold for team 1
  pair2: tokens.colors.electricLime.main, // Electric Lime for team 2
};

// Wizard steps configuration
const WIZARD_STEPS = [
  { id: 'teams', label: 'Equipos', icon: GroupsIcon },
  { id: 'scores', label: 'Resultado', icon: ScoreboardIcon },
  { id: 'details', label: 'Detalles', icon: CalendarTodayIcon },
  { id: 'confirm', label: 'Confirmar', icon: CheckCircleIcon },
];

// LocalStorage keys
const STORAGE_KEYS = {
  lastLocation: 'padel_lastLocation',
  lastMatch: 'padel_lastMatch',
  addedBy: 'addedBy',
};

// Player avatar colors
const PLAYER_COLORS = {
  Lucas: '#1976d2',
  Ricardo: '#388e3c',
  Martin: '#f57c00',
  Bort: '#7b1fa2',
  Invitado: '#616161',
};

// Premium confetti with gold particles
const triggerVictoryConfetti = () => {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const goldColors = ['#D4AF37', '#FFD700', '#E6C96E', '#CCFF00'];

  const defaults = {
    startVelocity: 35,
    spread: 360,
    ticks: 80,
    zIndex: 9999,
    colors: goldColors,
  };

  const randomInRange = (min, max) => Math.random() * (max - min) + min;

  // Initial burst
  confetti({
    ...defaults,
    particleCount: 100,
    origin: { x: 0.5, y: 0.6 },
    scalar: 1.2,
  });

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 40 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 200);
};

// ============================================================================
// PROGRESS ARC COMPONENT
// ============================================================================
const ProgressArc = ({ currentStep, totalSteps }) => {
  const theme = useTheme();
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Box sx={{ position: 'relative', width: 100, height: 100, mx: 'auto', mb: 2 }}>
      <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={alpha(theme.palette.secondary.main, 0.15)}
          strokeWidth="6"
        />
        {/* Progress arc */}
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={theme.palette.secondary.main}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </svg>
      {/* Step number */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontFamily: tokens.typography.displayFont,
            color: theme.palette.secondary.main,
            lineHeight: 1,
          }}
        >
          {currentStep + 1}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: theme.palette.text.secondary, fontSize: '0.65rem' }}
        >
          de {totalSteps}
        </Typography>
      </Box>
    </Box>
  );
};

// ============================================================================
// STEP INDICATOR COMPONENT
// ============================================================================
const StepIndicator = ({ steps, currentStep, onStepClick }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        gap: 1,
        mb: 3,
      }}
    >
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const isClickable = index < currentStep;

        return (
          <motion.div
            key={step.id}
            whileHover={isClickable ? { scale: 1.1 } : {}}
            whileTap={isClickable ? { scale: 0.95 } : {}}
          >
            <Box
              onClick={() => isClickable && onStepClick(index)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: isClickable ? 'pointer' : 'default',
                opacity: isActive || isCompleted ? 1 : 0.4,
                transition: 'all 0.3s ease',
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isActive
                    ? theme.palette.secondary.main
                    : isCompleted
                    ? alpha(theme.palette.secondary.main, 0.2)
                    : alpha(theme.palette.text.primary, 0.1),
                  border: `2px solid ${
                    isActive || isCompleted
                      ? theme.palette.secondary.main
                      : alpha(theme.palette.text.primary, 0.2)
                  }`,
                  transition: 'all 0.3s ease',
                }}
              >
                {isCompleted ? (
                  <CheckCircleIcon
                    sx={{
                      fontSize: 20,
                      color: theme.palette.secondary.main,
                    }}
                  />
                ) : (
                  <Icon
                    sx={{
                      fontSize: 20,
                      color: isActive
                        ? theme.palette.secondary.contrastText
                        : theme.palette.text.secondary,
                    }}
                  />
                )}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  mt: 0.5,
                  fontSize: '0.6rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive
                    ? theme.palette.secondary.main
                    : theme.palette.text.secondary,
                }}
              >
                {step.label}
              </Typography>
            </Box>
          </motion.div>
        );
      })}
    </Box>
  );
};

// ============================================================================
// FLOATING MATCH PREVIEW COMPONENT
// ============================================================================
const MatchPreview = ({ pair1Players, pair2Players, sets, matchWinner, showThirdSet }) => {
  const theme = useTheme();

  const getPlayerInitials = (name) => name?.slice(0, 1).toUpperCase() || '?';

  const activeSets = showThirdSet ? sets : sets.slice(0, 2);
  const hasScores = activeSets.some(s => s.pair1Score !== '' || s.pair2Score !== '');

  if (pair1Players.length === 0 && pair2Players.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: 360,
          p: 2,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.95)} 0%, ${alpha(theme.palette.primary.dark, 0.98)} 100%)`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
          boxShadow: theme.shadows[20],
          zIndex: 1000,
        }}
      >
        {/* Winner banner */}
        <AnimatePresence>
          {matchWinner && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  mb: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  background: `linear-gradient(90deg, ${alpha(theme.palette.secondary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.4)} 50%, ${alpha(theme.palette.secondary.main, 0.2)} 100%)`,
                }}
              >
                <EmojiEventsIcon sx={{ color: theme.palette.secondary.main, fontSize: 18 }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: tokens.typography.displayFont,
                    color: theme.palette.secondary.main,
                    letterSpacing: '0.1em',
                  }}
                >
                  VICTORIA
                </Typography>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Teams */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Team 1 */}
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
              {pair1Players.map((player, i) => (
                <Avatar
                  key={i}
                  sx={{
                    width: 28,
                    height: 28,
                    fontSize: '0.7rem',
                    backgroundColor: PLAYER_COLORS[player] || '#666',
                    border: matchWinner === 'pair1'
                      ? `2px solid ${theme.palette.secondary.main}`
                      : '2px solid transparent',
                  }}
                >
                  {getPlayerInitials(player)}
                </Avatar>
              ))}
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: matchWinner === 'pair1' ? 700 : 400,
                color: matchWinner === 'pair1'
                  ? theme.palette.secondary.main
                  : theme.palette.text.primary,
                fontSize: '0.7rem',
              }}
            >
              {pair1Players.join(' & ') || 'Equipo 1'}
            </Typography>
          </Box>

          {/* Scores */}
          {hasScores && (
            <Box sx={{ px: 2, textAlign: 'center' }}>
              {activeSets.map((set, i) => (
                <Typography
                  key={i}
                  sx={{
                    fontFamily: tokens.typography.monoFont,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    lineHeight: 1.3,
                  }}
                >
                  {set.pair1Score || '-'} - {set.pair2Score || '-'}
                </Typography>
              ))}
            </Box>
          )}

          {/* Team 2 */}
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
              {pair2Players.map((player, i) => (
                <Avatar
                  key={i}
                  sx={{
                    width: 28,
                    height: 28,
                    fontSize: '0.7rem',
                    backgroundColor: PLAYER_COLORS[player] || '#666',
                    border: matchWinner === 'pair2'
                      ? `2px solid ${theme.palette.secondary.main}`
                      : '2px solid transparent',
                  }}
                >
                  {getPlayerInitials(player)}
                </Avatar>
              ))}
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: matchWinner === 'pair2' ? 700 : 400,
                color: matchWinner === 'pair2'
                  ? theme.palette.secondary.main
                  : theme.palette.text.primary,
                fontSize: '0.7rem',
              }}
            >
              {pair2Players.join(' & ') || 'Equipo 2'}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
};

// ============================================================================
// VICTORY CEREMONY OVERLAY
// ============================================================================
const VictoryCeremony = ({ winnerNames, onComplete }) => {
  const theme = useTheme();

  useEffect(() => {
    triggerVictoryConfetti();
    hapticSuccess();
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `radial-gradient(circle at center, ${alpha(tokens.colors.courtBlue.main, 0.95)} 0%, ${tokens.colors.courtBlue.dark} 100%)`,
        zIndex: 9999,
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <EmojiEventsIcon
            sx={{
              fontSize: 120,
              color: theme.palette.secondary.main,
              filter: `drop-shadow(0 0 30px ${alpha(theme.palette.secondary.main, 0.6)})`,
            }}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Typography
            variant="h3"
            sx={{
              fontFamily: tokens.typography.displayFont,
              color: theme.palette.secondary.main,
              mt: 2,
              letterSpacing: '0.1em',
            }}
          >
            ¡VICTORIA!
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontFamily: tokens.typography.displayFont,
              color: theme.palette.text.primary,
              mt: 1,
            }}
          >
            {winnerNames}
          </Typography>
        </motion.div>
      </Box>
    </motion.div>
  );
};

const ResultForm = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location_state = useLocation();
  const { showSuccess, showError, showInfo } = useSnackbar();
  const { refreshResults } = useData();

  // Get prefilled date from navigation state (from Calendar quick-add)
  const prefilledDate = location_state?.state?.prefilledDate;

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [showVictoryCeremony, setShowVictoryCeremony] = useState(false);

  // Form state
  const [pair1Players, setPair1Players] = useState([]);
  const [pair2Players, setPair2Players] = useState([]);
  const [sets, setSets] = useState([
    { pair1Score: '', pair2Score: '' },
    { pair1Score: '', pair2Score: '' },
  ]);
  const [showThirdSet, setShowThirdSet] = useState(false);
  const [date, setDate] = useState(prefilledDate ? dayjs(prefilledDate) : dayjs());
  const [location, setLocation] = useState('');
  const [addedBy, setAddedBy] = useState('');

  // UI state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLastMatch, setHasLastMatch] = useState(false);

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem(STORAGE_KEYS.lastLocation);
    const savedAddedBy = localStorage.getItem(STORAGE_KEYS.addedBy);
    const savedLastMatch = localStorage.getItem(STORAGE_KEYS.lastMatch);

    if (savedLocation) setLocation(savedLocation);
    if (savedAddedBy) setAddedBy(savedAddedBy);
    if (savedLastMatch) setHasLastMatch(true);

    if (prefilledDate) {
      showInfo(`Fecha pre-seleccionada: ${dayjs(prefilledDate).format('DD/MM/YYYY')}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time validation effect
  useEffect(() => {
    const newErrors = {};

    // Validate players in real-time
    if (pair1Players.length > 0 || pair2Players.length > 0) {
      const allPlayers = [...pair1Players, ...pair2Players];
      if (new Set(allPlayers).size !== allPlayers.length) {
        newErrors.players = 'No se puede repetir un jugador.';
      }
    }

    // Validate sets in real-time
    sets.forEach((set, index) => {
      if (index === 2 && !showThirdSet) return;

      const score1 = set.pair1Score === '' ? null : parseInt(set.pair1Score, 10);
      const score2 = set.pair2Score === '' ? null : parseInt(set.pair2Score, 10);

      if (score1 !== null && score2 !== null) {
        if (score1 === score2) {
          newErrors[`set${index}`] = 'No puede haber empate';
        } else if (Math.max(score1, score2) === 6 && Math.abs(score1 - score2) < 2) {
          newErrors[`set${index}`] = 'Diferencia mínima de 2';
        } else if (
          Math.max(score1, score2) === 7 &&
          Math.min(score1, score2) !== 5 &&
          Math.min(score1, score2) !== 6
        ) {
          newErrors[`set${index}`] = 'Con 7, rival debe tener 5 o 6';
        } else if (Math.max(score1, score2) < 6) {
          newErrors[`set${index}`] = 'Mínimo 6 juegos para ganar';
        }
      }
    });

    setErrors((prev) => ({ ...prev, ...newErrors }));
  }, [pair1Players, pair2Players, sets, showThirdSet]);

  // Get players not selected in the other pair
  const getAvailableForPair = useCallback(
    (forPair) => {
      const otherPairPlayers = forPair === 'pair1' ? pair2Players : pair1Players;
      return PLAYERS_LIST.filter((p) => !otherPairPlayers.includes(p));
    },
    [pair1Players, pair2Players]
  );

  // Calculate match winner based on current sets
  const matchWinner = useMemo(() => {
    let pair1Wins = 0;
    let pair2Wins = 0;
    const activeSets = showThirdSet ? sets : sets.slice(0, 2);

    activeSets.forEach((set) => {
      const s1 = parseInt(set.pair1Score, 10);
      const s2 = parseInt(set.pair2Score, 10);
      if (!isNaN(s1) && !isNaN(s2)) {
        if (s1 > s2) pair1Wins++;
        else if (s2 > s1) pair2Wins++;
      }
    });

    if (pair1Wins >= 2) return 'pair1';
    if (pair2Wins >= 2) return 'pair2';
    return null;
  }, [sets, showThirdSet]);

  // Handle set score changes
  const handleSetScoreChange = useCallback((setIndex, scoreKey, value) => {
    setSets((prev) =>
      prev.map((set, i) => (i === setIndex ? { ...set, [scoreKey]: value === null ? '' : value } : set))
    );
    // Clear error for this set
    setErrors((prev) => ({ ...prev, [`set${setIndex}`]: undefined }));
  }, []);

  // Add third set
  const addThirdSet = useCallback(() => {
    if (!showThirdSet) {
      setShowThirdSet(true);
      setSets((prev) => [...prev, { pair1Score: '', pair2Score: '' }]);
    }
  }, [showThirdSet]);

  // Remove third set
  const removeThirdSet = useCallback(() => {
    if (showThirdSet) {
      setShowThirdSet(false);
      setSets((prev) => prev.slice(0, 2));
      setErrors((prev) => ({ ...prev, set2: undefined }));
    }
  }, [showThirdSet]);

  // Load last match configuration
  const loadLastMatch = useCallback(() => {
    try {
      const savedMatch = localStorage.getItem(STORAGE_KEYS.lastMatch);
      if (savedMatch) {
        const match = JSON.parse(savedMatch);
        setPair1Players(match.pair1Players || []);
        setPair2Players(match.pair2Players || []);
        if (match.location) setLocation(match.location);
        showInfo('Configuración del último partido cargada');
      }
    } catch (e) {
      console.error('Error loading last match:', e);
    }
  }, [showInfo]);

  // Validate entire form
  const validateForm = useCallback(() => {
    const newErrors = {};

    // Validate players
    if (pair1Players.length !== 2) {
      newErrors.pair1 = 'Selecciona 2 jugadores para la Pareja 1';
    }
    if (pair2Players.length !== 2) {
      newErrors.pair2 = 'Selecciona 2 jugadores para la Pareja 2';
    }

    const allPlayers = [...pair1Players, ...pair2Players];
    if (new Set(allPlayers).size !== allPlayers.length) {
      newErrors.players = 'Los jugadores no pueden repetirse.';
    }

    // Validate date
    if (!date || !dayjs(date).isValid()) {
      newErrors.date = 'La fecha es requerida.';
    }

    // Validate location
    if (!location) {
      newErrors.location = 'El lugar es requerido.';
    }

    // Validate addedBy
    if (!addedBy.trim()) {
      newErrors.addedBy = 'Tu nombre es requerido.';
    }

    // Validate sets
    const finalSets = showThirdSet ? sets : sets.slice(0, 2);
    let pair1SetWins = 0;
    let pair2SetWins = 0;

    finalSets.forEach((set, index) => {
      const score1 = set.pair1Score === '' ? null : parseInt(set.pair1Score, 10);
      const score2 = set.pair2Score === '' ? null : parseInt(set.pair2Score, 10);

      if (score1 === null || score2 === null) {
        newErrors[`set${index}`] = `Set ${index + 1}: Completa ambas puntuaciones.`;
        return;
      }

      if (score1 === score2) {
        newErrors[`set${index}`] = `Set ${index + 1}: No puede haber empate.`;
      } else if (Math.max(score1, score2) < 6) {
        newErrors[`set${index}`] = `Set ${index + 1}: Mínimo 6 juegos para ganar.`;
      } else if (Math.max(score1, score2) === 6 && Math.abs(score1 - score2) < 2) {
        newErrors[`set${index}`] = `Set ${index + 1}: Diferencia mínima de 2 juegos.`;
      } else if (
        Math.max(score1, score2) === 7 &&
        Math.min(score1, score2) !== 5 &&
        Math.min(score1, score2) !== 6
      ) {
        newErrors[`set${index}`] = `Set ${index + 1}: Con 7, rival debe tener 5 o 6.`;
      } else {
        // Valid set, count winner
        if (score1 > score2) pair1SetWins++;
        else pair2SetWins++;
      }
    });

    // Check match winner
    if (!Object.keys(newErrors).some((k) => k.startsWith('set'))) {
      if (pair1SetWins === pair2SetWins && finalSets.length === 2) {
        newErrors.setsGlobal = 'Empate a sets. Añade un tercer set para desempatar.';
      } else if (pair1SetWins < 2 && pair2SetWins < 2 && finalSets.length === 3) {
        newErrors.setsGlobal = 'Un equipo debe ganar al menos 2 sets.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [pair1Players, pair2Players, date, location, addedBy, sets, showThirdSet]);

  // Validate current step
  const validateStep = useCallback((step) => {
    const stepErrors = {};

    switch (step) {
      case 0: // Teams
        if (pair1Players.length !== 2) {
          stepErrors.pair1 = 'Selecciona 2 jugadores';
        }
        if (pair2Players.length !== 2) {
          stepErrors.pair2 = 'Selecciona 2 jugadores';
        }
        const allPlayers = [...pair1Players, ...pair2Players];
        if (new Set(allPlayers).size !== allPlayers.length) {
          stepErrors.players = 'Los jugadores no pueden repetirse';
        }
        break;

      case 1: // Scores
        const finalSets = showThirdSet ? sets : sets.slice(0, 2);
        let pair1SetWins = 0;
        let pair2SetWins = 0;

        finalSets.forEach((set, index) => {
          const score1 = set.pair1Score === '' ? null : parseInt(set.pair1Score, 10);
          const score2 = set.pair2Score === '' ? null : parseInt(set.pair2Score, 10);

          if (score1 === null || score2 === null) {
            stepErrors[`set${index}`] = 'Completa el set';
          } else if (score1 === score2) {
            stepErrors[`set${index}`] = 'No puede haber empate';
          } else if (Math.max(score1, score2) < 6) {
            stepErrors[`set${index}`] = 'Mínimo 6 juegos';
          } else if (Math.max(score1, score2) === 6 && Math.abs(score1 - score2) < 2) {
            stepErrors[`set${index}`] = 'Diferencia mínima de 2';
          } else if (Math.max(score1, score2) === 7 && Math.min(score1, score2) !== 5 && Math.min(score1, score2) !== 6) {
            stepErrors[`set${index}`] = 'Con 7, rival debe tener 5 o 6';
          } else {
            if (score1 > score2) pair1SetWins++;
            else pair2SetWins++;
          }
        });

        if (!Object.keys(stepErrors).some((k) => k.startsWith('set'))) {
          if (pair1SetWins === pair2SetWins && finalSets.length === 2) {
            stepErrors.setsGlobal = 'Empate a sets. Añade un tercer set.';
          } else if (pair1SetWins < 2 && pair2SetWins < 2 && finalSets.length === 3) {
            stepErrors.setsGlobal = 'Un equipo debe ganar 2 sets';
          }
        }
        break;

      case 2: // Details
        if (!date || !dayjs(date).isValid()) {
          stepErrors.date = 'Fecha requerida';
        }
        if (!location) {
          stepErrors.location = 'Lugar requerido';
        }
        if (!addedBy.trim()) {
          stepErrors.addedBy = 'Tu nombre es requerido';
        }
        break;

      default:
        break;
    }

    return stepErrors;
  }, [pair1Players, pair2Players, sets, showThirdSet, date, location, addedBy]);

  // Navigate to next step
  const handleNextStep = useCallback(() => {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      hapticMedium();
      return;
    }
    setErrors({});
    hapticLight();
    setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  }, [currentStep, validateStep]);

  // Navigate to previous step
  const handlePrevStep = useCallback(() => {
    hapticLight();
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // Jump to specific step (only backwards)
  const handleStepClick = useCallback((step) => {
    if (step < currentStep) {
      hapticLight();
      setErrors({});
      setCurrentStep(step);
    }
  }, [currentStep]);

  // Handle form submit
  const handleSubmit = async () => {
    // Prevent double submit
    if (isSubmitting) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const finalSets = showThirdSet ? sets : sets.slice(0, 2);
      const pair1 = { player1: pair1Players[0], player2: pair1Players[1] };
      const pair2 = { player1: pair2Players[0], player2: pair2Players[1] };

      await addDoc(collection(db, 'results'), {
        pair1,
        pair2,
        sets: finalSets.map((s) => ({
          pair1Score: parseInt(s.pair1Score, 10),
          pair2Score: parseInt(s.pair2Score, 10),
        })),
        date: dayjs(date).format('YYYY-MM-DD'),
        location,
        addedBy,
        createdAt: serverTimestamp(),
      });

      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.addedBy, addedBy);
      localStorage.setItem(STORAGE_KEYS.lastLocation, location);
      localStorage.setItem(
        STORAGE_KEYS.lastMatch,
        JSON.stringify({
          pair1Players,
          pair2Players,
          location,
        })
      );

      await refreshResults();

      // Show victory ceremony
      setShowVictoryCeremony(true);
    } catch (error) {
      console.error('Error al guardar el resultado:', error);
      showError('Error al guardar el resultado. Inténtalo de nuevo.');
      setErrors({ submit: 'Error al guardar el resultado.' });
      setIsSubmitting(false);
    }
  };

  // Handle victory ceremony complete
  const handleVictoryComplete = useCallback(() => {
    showSuccess('¡Partido guardado!');
    navigate('/');
  }, [showSuccess, navigate]);

  // Get selected player names for display
  const getPairDisplayNames = (players) => {
    if (players.length === 0) return 'Sin seleccionar';
    if (players.length === 1) return `${players[0]} y ...`;
    return `${players[0]} y ${players[1]}`;
  };

  // Get winner names for victory ceremony
  const getWinnerNames = () => {
    if (matchWinner === 'pair1') return pair1Players.join(' & ');
    if (matchWinner === 'pair2') return pair2Players.join(' & ');
    return '';
  };

  // Animation variants for step transitions
  const stepVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Teams Step
        return (
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontFamily: tokens.typography.displayFont,
                textAlign: 'center',
                mb: 3,
                color: theme.palette.text.primary,
              }}
            >
              SELECCIONA LOS EQUIPOS
            </Typography>

            {/* Repeat Last Match Button */}
            {hasLastMatch && (
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<ReplayIcon />}
                  onClick={loadLastMatch}
                  size="small"
                >
                  Repetir último partido
                </Button>
              </Box>
            )}

            {/* Split screen layout for teams */}
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              {/* Team 1 Zone */}
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${alpha(PAIR_COLORS.pair1, 0.15)} 0%, ${alpha(PAIR_COLORS.pair1, 0.05)} 100%)`,
                  border: `2px solid ${alpha(PAIR_COLORS.pair1, 0.3)}`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${alpha(PAIR_COLORS.pair1, 0.2)} 0%, transparent 70%)`,
                  }}
                />
                <PlayerSelector
                  players={getAvailableForPair('pair1')}
                  selectedPlayers={pair1Players}
                  disabledPlayers={pair2Players}
                  onSelect={setPair1Players}
                  pairColor={PAIR_COLORS.pair1}
                  maxSelections={2}
                  label="Equipo Oro"
                />
                {errors.pair1 && (
                  <FormHelperText error sx={{ mt: 1, textAlign: 'center' }}>
                    {errors.pair1}
                  </FormHelperText>
                )}
              </Box>

              {/* VS Divider */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: { xs: 1, sm: 0 },
                }}
              >
                <Chip
                  label="VS"
                  sx={{
                    fontFamily: tokens.typography.displayFont,
                    fontSize: '1rem',
                    fontWeight: 600,
                    backgroundColor: alpha(theme.palette.secondary.main, 0.2),
                    color: theme.palette.secondary.main,
                    border: `1px solid ${theme.palette.secondary.main}`,
                  }}
                />
              </Box>

              {/* Team 2 Zone */}
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${alpha(PAIR_COLORS.pair2, 0.15)} 0%, ${alpha(PAIR_COLORS.pair2, 0.05)} 100%)`,
                  border: `2px solid ${alpha(PAIR_COLORS.pair2, 0.3)}`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${alpha(PAIR_COLORS.pair2, 0.2)} 0%, transparent 70%)`,
                  }}
                />
                <PlayerSelector
                  players={getAvailableForPair('pair2')}
                  selectedPlayers={pair2Players}
                  disabledPlayers={pair1Players}
                  onSelect={setPair2Players}
                  pairColor={PAIR_COLORS.pair2}
                  maxSelections={2}
                  label="Equipo Lima"
                />
                {errors.pair2 && (
                  <FormHelperText error sx={{ mt: 1, textAlign: 'center' }}>
                    {errors.pair2}
                  </FormHelperText>
                )}
              </Box>
            </Box>

            {errors.players && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errors.players}
              </Alert>
            )}
          </Box>
        );

      case 1: // Scores Step
        return (
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontFamily: tokens.typography.displayFont,
                textAlign: 'center',
                mb: 3,
                color: theme.palette.text.primary,
              }}
            >
              RESULTADO DEL PARTIDO
            </Typography>

            {/* Team labels */}
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 3 }}>
              <Chip
                label={getPairDisplayNames(pair1Players)}
                sx={{
                  backgroundColor: alpha(PAIR_COLORS.pair1, 0.2),
                  color: PAIR_COLORS.pair1,
                  fontWeight: 600,
                  border: `1px solid ${PAIR_COLORS.pair1}`,
                }}
              />
              <Chip
                label={getPairDisplayNames(pair2Players)}
                sx={{
                  backgroundColor: alpha(PAIR_COLORS.pair2, 0.2),
                  color: PAIR_COLORS.pair2,
                  fontWeight: 600,
                  border: `1px solid ${PAIR_COLORS.pair2}`,
                }}
              />
            </Box>

            {/* Sets */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {sets.slice(0, showThirdSet ? 3 : 2).map((set, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <SetScoreInput
                    setNumber={index + 1}
                    pair1Score={set.pair1Score}
                    pair2Score={set.pair2Score}
                    onPair1Change={(val) => handleSetScoreChange(index, 'pair1Score', val)}
                    onPair2Change={(val) => handleSetScoreChange(index, 'pair2Score', val)}
                    pair1Label="Oro"
                    pair2Label="Lima"
                    pair1Color={PAIR_COLORS.pair1}
                    pair2Color={PAIR_COLORS.pair2}
                    error={!!errors[`set${index}`]}
                    helperText={errors[`set${index}`]}
                  />
                </motion.div>
              ))}
            </Box>

            {errors.setsGlobal && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {errors.setsGlobal}
              </Alert>
            )}

            {/* Add/Remove Third Set */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              {!showThirdSet ? (
                <Button
                  variant="outlined"
                  onClick={addThirdSet}
                  startIcon={<AddCircleOutlineIcon />}
                >
                  Añadir Tercer Set
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={removeThirdSet}
                  startIcon={<DeleteIcon />}
                >
                  Quitar Tercer Set
                </Button>
              )}
            </Box>
          </Box>
        );

      case 2: // Details Step
        return (
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontFamily: tokens.typography.displayFont,
                textAlign: 'center',
                mb: 3,
                color: theme.palette.text.primary,
              }}
            >
              DETALLES DEL PARTIDO
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <DatePicker
                label="Fecha del Partido"
                value={date}
                onChange={(newDate) => {
                  setDate(newDate);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.date,
                    helperText: errors.date,
                  },
                }}
              />

              <FormControl fullWidth error={!!errors.location}>
                <InputLabel id="location-label">Lugar</InputLabel>
                <Select
                  labelId="location-label"
                  value={location}
                  label="Lugar"
                  onChange={(e) => {
                    setLocation(e.target.value);
                    if (errors.location) setErrors((prev) => ({ ...prev, location: undefined }));
                  }}
                >
                  <MenuItem value="">
                    <em>Seleccionar</em>
                  </MenuItem>
                  {LOCATIONS_LIST.map((place) => (
                    <MenuItem key={place} value={place}>
                      {place}
                    </MenuItem>
                  ))}
                </Select>
                {errors.location && <FormHelperText>{errors.location}</FormHelperText>}
              </FormControl>

              <FormControl fullWidth error={!!errors.addedBy}>
                <InputLabel id="addedBy-label">Añadido por</InputLabel>
                <Select
                  labelId="addedBy-label"
                  value={addedBy}
                  label="Añadido por"
                  onChange={(e) => {
                    setAddedBy(e.target.value);
                    if (errors.addedBy) setErrors((prev) => ({ ...prev, addedBy: undefined }));
                  }}
                >
                  <MenuItem value="">
                    <em>Seleccionar</em>
                  </MenuItem>
                  {PLAYERS_LIST.filter((p) => p !== 'Invitado').map((player) => (
                    <MenuItem key={player} value={player}>
                      {player}
                    </MenuItem>
                  ))}
                </Select>
                {errors.addedBy && <FormHelperText>{errors.addedBy}</FormHelperText>}
              </FormControl>
            </Box>
          </Box>
        );

      case 3: // Confirm Step
        return (
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontFamily: tokens.typography.displayFont,
                textAlign: 'center',
                mb: 3,
                color: theme.palette.text.primary,
              }}
            >
              CONFIRMAR PARTIDO
            </Typography>

            {/* Match Summary Card */}
            <Paper
              elevation={4}
              sx={{
                p: 3,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)} 0%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
              }}
            >
              {/* Winner Banner */}
              {matchWinner && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    mb: 2,
                    py: 1,
                    borderRadius: 2,
                    background: `linear-gradient(90deg, transparent 0%, ${alpha(theme.palette.secondary.main, 0.3)} 50%, transparent 100%)`,
                  }}
                >
                  <EmojiEventsIcon sx={{ color: theme.palette.secondary.main }} />
                  <Typography
                    sx={{
                      fontFamily: tokens.typography.displayFont,
                      color: theme.palette.secondary.main,
                      letterSpacing: '0.1em',
                    }}
                  >
                    VICTORIA: {getWinnerNames()}
                  </Typography>
                </Box>
              )}

              {/* Teams */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: PAIR_COLORS.pair1,
                      fontWeight: 600,
                      mb: 0.5,
                    }}
                  >
                    {getPairDisplayNames(pair1Players)}
                  </Typography>
                </Box>
                <Typography sx={{ color: theme.palette.text.secondary, px: 2 }}>vs</Typography>
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: PAIR_COLORS.pair2,
                      fontWeight: 600,
                      mb: 0.5,
                    }}
                  >
                    {getPairDisplayNames(pair2Players)}
                  </Typography>
                </Box>
              </Box>

              {/* Scores */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
                {sets.slice(0, showThirdSet ? 3 : 2).map((set, i) => (
                  <Box key={i} sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      Set {i + 1}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: tokens.typography.monoFont,
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                      }}
                    >
                      {set.pair1Score} - {set.pair2Score}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Details */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  pt: 2,
                  borderTop: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                }}
              >
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  {dayjs(date).format('DD/MM/YYYY')}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  {location}
                </Typography>
              </Box>
            </Paper>

            {errors.submit && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errors.submit}
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Victory Ceremony Overlay */}
      <AnimatePresence>
        {showVictoryCeremony && (
          <VictoryCeremony
            winnerNames={getWinnerNames()}
            onComplete={handleVictoryComplete}
          />
        )}
      </AnimatePresence>

      <Container maxWidth="sm" sx={{ py: 3, pb: 16 }}>
        <Paper
          elevation={6}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 4,
            background: `linear-gradient(180deg, ${alpha(theme.palette.primary.light, 0.95)} 0%, ${alpha(theme.palette.primary.main, 0.98)} 100%)`,
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background decoration */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${theme.palette.secondary.main} 0%, ${tokens.colors.electricLime.main} 100%)`,
            }}
          />

          {/* Progress Arc */}
          <ProgressArc currentStep={currentStep} totalSteps={WIZARD_STEPS.length} />

          {/* Step Indicator */}
          <StepIndicator
            steps={WIZARD_STEPS}
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />

          {/* Step Content with Animation */}
          <Box sx={{ minHeight: 300, position: 'relative' }}>
            <AnimatePresence mode="wait" custom={currentStep}>
              <motion.div
                key={currentStep}
                custom={currentStep}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </Box>

          {/* Navigation Buttons */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 2,
              mt: 4,
              pt: 3,
              borderTop: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
            }}
          >
            {currentStep === 0 ? (
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
                startIcon={<ArrowBackIcon />}
                sx={{ flex: 1 }}
              >
                Cancelar
              </Button>
            ) : (
              <Button
                variant="outlined"
                onClick={handlePrevStep}
                startIcon={<ArrowBackIcon />}
                sx={{ flex: 1 }}
              >
                Anterior
              </Button>
            )}

            {currentStep < WIZARD_STEPS.length - 1 ? (
              <Button
                variant="contained"
                color="secondary"
                onClick={handleNextStep}
                endIcon={<ArrowForwardIcon />}
                sx={{ flex: 1 }}
              >
                Siguiente
              </Button>
            ) : (
              <motion.div style={{ flex: 1 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  startIcon={<EmojiEventsIcon />}
                  fullWidth
                  sx={{
                    py: 1.5,
                    fontFamily: tokens.typography.displayFont,
                    fontSize: '1.1rem',
                    letterSpacing: '0.05em',
                    boxShadow: theme.shadows[18],
                    '&:hover': {
                      boxShadow: theme.shadows[19],
                    },
                  }}
                >
                  {isSubmitting ? 'Guardando...' : 'REGISTRAR VICTORIA'}
                </Button>
              </motion.div>
            )}
          </Box>
        </Paper>

        {/* Floating Match Preview */}
        <AnimatePresence>
          {(pair1Players.length > 0 || pair2Players.length > 0) && currentStep > 0 && (
            <MatchPreview
              pair1Players={pair1Players}
              pair2Players={pair2Players}
              sets={sets}
              matchWinner={matchWinner}
              showThirdSet={showThirdSet}
            />
          )}
        </AnimatePresence>
      </Container>
    </>
  );
};

export default ResultForm;
