// src/theme/index.js - Premium "Athletic Luxury Club" Design System
import { createTheme, alpha } from '@mui/material/styles';

// ============================================================================
// PREMIUM DESIGN TOKENS - "COURT OF GOLD"
// ============================================================================

const tokens = {
  // Premium Color Palette
  colors: {
    // Dominant Color (90% usage) - Deep Court Blue
    courtBlue: {
      main: '#0A2342',
      light: '#1a3a5f',
      dark: '#051426',
      contrastText: '#F5F1E8',
    },
    // Primary Accent (8% usage) - Championship Gold
    championshipGold: {
      main: '#D4AF37',
      light: '#E6C96E',
      dark: '#B8941F',
      contrastText: '#0A2342',
    },
    // Shock Accent (2% usage) - Electric Lime
    electricLime: {
      main: '#CCFF00',
      light: '#DDFF4D',
      dark: '#99CC00',
      contrastText: '#0A2342',
    },
    // Supporting Palette
    silver: {
      main: '#C0C0C0',
      light: '#E0E0E0',
      dark: '#A0A0A0',
      contrastText: '#0A2342',
    },
    burgundy: {
      main: '#6B0F1A',
      light: '#8B1F2A',
      dark: '#4B0A12',
      contrastText: '#F5F1E8',
    },
    cream: {
      main: '#F5F1E8',
      light: '#FDFCF9',
      dark: '#E8E4DB',
      contrastText: '#0A2342',
    },
    charcoal: {
      main: '#2C2C2C',
      light: '#3C3C3C',
      dark: '#1C1C1C',
      contrastText: '#F5F1E8',
    },
    // Badge/Trophy colors
    badges: {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2',
      diamond: '#B9F2FF',
    },
  },

  // Premium Typography Scale
  typography: {
    // Display font (Titles, Scores, Player Names)
    displayFont: '"Bebas Neue", "Impact", sans-serif',
    // Body font (UI Text, Paragraphs)
    bodyFont: '"Work Sans", "Helvetica Neue", sans-serif',
    // Monospace (Numbers, Statistics)
    monoFont: '"Space Mono", "Courier New", monospace',
  },

  // Spacing (Golden Ratio based)
  spacing: 8, // Base unit
  goldenRatio: 1.618,

  // Border Radius Tokens
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
    xl: 16,
    xxl: 24,
    pill: 24,
    round: '50%',
  },

  // Premium Transitions
  transitions: {
    premium: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Overshoot
    smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Standard
    elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)', // More elastic
  },
};

// ============================================================================
// PREMIUM SHADOWS - Dramatic Depth (up to 48px)
// ============================================================================

const premiumShadows = [
  'none',
  '0px 1px 2px rgba(10, 35, 66, 0.08)',
  '0px 2px 4px rgba(10, 35, 66, 0.1)',
  '0px 4px 8px rgba(10, 35, 66, 0.12)',
  '0px 6px 12px rgba(10, 35, 66, 0.14)',
  '0px 8px 16px rgba(10, 35, 66, 0.16)',
  '0px 12px 20px rgba(10, 35, 66, 0.18)',
  '0px 16px 24px rgba(10, 35, 66, 0.2)',
  '0px 20px 28px rgba(10, 35, 66, 0.22)',
  '0px 24px 32px rgba(10, 35, 66, 0.24)',
  '0px 28px 36px rgba(10, 35, 66, 0.26)',
  '0px 32px 40px rgba(10, 35, 66, 0.28)',
  '0px 36px 44px rgba(10, 35, 66, 0.3)',
  '0px 40px 48px rgba(10, 35, 66, 0.32)',
  // Dramatic shadows for premium cards
  '0px 44px 52px rgba(10, 35, 66, 0.34)',
  '0px 48px 56px rgba(10, 35, 66, 0.36)',
  // Gold glow effect
  `0px 8px 24px ${alpha('#D4AF37', 0.4)}`,
  // Lime energy glow
  `0px 8px 24px ${alpha('#CCFF00', 0.3)}`,
  // Championship glow (gold + blue)
  `0px 12px 32px ${alpha('#D4AF37', 0.5)}, 0px 4px 16px ${alpha('#0A2342', 0.3)}`,
  // Victory aura
  `0px 16px 48px ${alpha('#D4AF37', 0.6)}, 0px 8px 24px ${alpha('#CCFF00', 0.2)}`,
  // Deep dramatic shadow
  '0px 24px 48px rgba(10, 35, 66, 0.4), 0px 12px 24px rgba(10, 35, 66, 0.2)',
  // Ultra premium shadow
  '0px 32px 64px rgba(10, 35, 66, 0.5), 0px 16px 32px rgba(10, 35, 66, 0.3)',
  // Maximum drama
  '0px 48px 96px rgba(10, 35, 66, 0.6), 0px 24px 48px rgba(10, 35, 66, 0.4)',
  // Glass morph shadow
  '0px 8px 32px rgba(10, 35, 66, 0.12)',
  '0px 16px 48px rgba(10, 35, 66, 0.16)',
];

// ============================================================================
// MATERIAL-UI THEME CONFIGURATION
// ============================================================================

const theme = createTheme({
  palette: {
    mode: 'light',
    // Primary - Court Blue (dominant)
    primary: {
      main: tokens.colors.courtBlue.main,
      light: tokens.colors.courtBlue.light,
      dark: tokens.colors.courtBlue.dark,
      contrastText: tokens.colors.courtBlue.contrastText,
    },
    // Secondary - Championship Gold (accent)
    secondary: {
      main: tokens.colors.championshipGold.main,
      light: tokens.colors.championshipGold.light,
      dark: tokens.colors.championshipGold.dark,
      contrastText: tokens.colors.championshipGold.contrastText,
    },
    // Success - Gold (victories)
    success: {
      main: tokens.colors.championshipGold.main,
      light: tokens.colors.championshipGold.light,
      dark: tokens.colors.championshipGold.dark,
      contrastText: tokens.colors.courtBlue.main,
    },
    // Error - Burgundy (defeats)
    error: {
      main: tokens.colors.burgundy.main,
      light: tokens.colors.burgundy.light,
      dark: tokens.colors.burgundy.dark,
      contrastText: tokens.colors.cream.main,
    },
    // Warning - Gold
    warning: {
      main: tokens.colors.championshipGold.main,
      light: tokens.colors.championshipGold.light,
      dark: tokens.colors.championshipGold.dark,
      contrastText: tokens.colors.courtBlue.main,
    },
    // Info - Court Blue lighter
    info: {
      main: tokens.colors.courtBlue.light,
      light: '#2a4a7f',
      dark: tokens.colors.courtBlue.dark,
      contrastText: tokens.colors.cream.main,
    },
    // Backgrounds - Deep Court Blue dominante (90%)
    background: {
      default: tokens.colors.courtBlue.main, // Fondo principal azul oscuro
      paper: tokens.colors.courtBlue.light, // Cards/Papers azul más claro
      dark: tokens.colors.courtBlue.dark,
    },
    // Text - Invertido para fondo oscuro
    text: {
      primary: tokens.colors.cream.main, // Texto claro sobre fondo oscuro
      secondary: alpha(tokens.colors.cream.main, 0.7),
      disabled: alpha(tokens.colors.cream.main, 0.4),
      inverse: tokens.colors.charcoal.main, // Para fondos claros
    },
    divider: alpha(tokens.colors.championshipGold.main, 0.15),

    // Custom Colors
    badges: tokens.colors.badges,

    // Electric Lime (shock accent)
    lime: {
      main: tokens.colors.electricLime.main,
      light: tokens.colors.electricLime.light,
      dark: tokens.colors.electricLime.dark,
      contrastText: tokens.colors.electricLime.contrastText,
    },

    // Winner/Loser semantic colors
    winner: {
      main: tokens.colors.championshipGold.main,
      background: alpha(tokens.colors.championshipGold.main, 0.08),
      glow: alpha(tokens.colors.championshipGold.main, 0.3),
    },
    loser: {
      main: tokens.colors.burgundy.light,
      background: alpha(tokens.colors.burgundy.main, 0.06),
    },

    // Glass morph effect
    glass: {
      light: alpha('#FFFFFF', 0.1),
      medium: alpha('#FFFFFF', 0.15),
      dark: alpha(tokens.colors.courtBlue.main, 0.8),
    },
  },

  typography: {
    fontFamily: tokens.typography.bodyFont,

    // Display variants (Bebas Neue)
    h1: {
      fontFamily: tokens.typography.displayFont,
      fontSize: '3.5rem',
      fontWeight: 400,
      lineHeight: 1.1,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    },
    h2: {
      fontFamily: tokens.typography.displayFont,
      fontSize: '2.75rem',
      fontWeight: 400,
      lineHeight: 1.15,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    },
    h3: {
      fontFamily: tokens.typography.displayFont,
      fontSize: '2.25rem',
      fontWeight: 400,
      lineHeight: 1.2,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    },
    h4: {
      fontFamily: tokens.typography.displayFont,
      fontSize: '1.875rem',
      fontWeight: 400,
      lineHeight: 1.25,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    },
    h5: {
      fontFamily: tokens.typography.displayFont,
      fontSize: '1.5rem',
      fontWeight: 400,
      lineHeight: 1.3,
      letterSpacing: '0.03em',
    },
    h6: {
      fontFamily: tokens.typography.displayFont,
      fontSize: '1.25rem',
      fontWeight: 400,
      lineHeight: 1.4,
      letterSpacing: '0.03em',
    },

    // Body variants (Work Sans)
    subtitle1: {
      fontFamily: tokens.typography.bodyFont,
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0.01em',
    },
    subtitle2: {
      fontFamily: tokens.typography.bodyFont,
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0.01em',
    },
    body1: {
      fontFamily: tokens.typography.bodyFont,
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    body2: {
      fontFamily: tokens.typography.bodyFont,
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    caption: {
      fontFamily: tokens.typography.bodyFont,
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.5,
      color: tokens.colors.charcoal.light,
    },
    overline: {
      fontFamily: tokens.typography.bodyFont,
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    },
    button: {
      fontFamily: tokens.typography.bodyFont,
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0.02em',
      textTransform: 'none',
    },

    // Custom variants for scores (Space Mono)
    score: {
      fontFamily: tokens.typography.monoFont,
      fontSize: '1.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '0.05em',
    },
    scoreLarge: {
      fontFamily: tokens.typography.monoFont,
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1,
      letterSpacing: '0.05em',
    },
    stat: {
      fontFamily: tokens.typography.monoFont,
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
  },

  spacing: tokens.spacing,

  shape: {
    borderRadius: tokens.borderRadius.medium,
  },

  shadows: premiumShadows,

  // ============================================================================
  // COMPONENT STYLE OVERRIDES - Premium Enhancements
  // ============================================================================

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          // CSS Custom Properties for premium effects
          '--color-court-blue': tokens.colors.courtBlue.main,
          '--color-championship-gold': tokens.colors.championshipGold.main,
          '--color-electric-lime': tokens.colors.electricLime.main,
          '--color-cream': tokens.colors.cream.main,
          '--color-charcoal': tokens.colors.charcoal.main,
          '--shadow-dramatic': '0 24px 48px rgba(10, 35, 66, 0.4)',
          '--blur-glass': 'blur(16px) saturate(180%)',
          '--transition-premium': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          '--transition-smooth': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        },
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: `${alpha(tokens.colors.championshipGold.main, 0.3)} ${alpha(tokens.colors.courtBlue.main, 0.05)}`,
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: alpha(tokens.colors.courtBlue.main, 0.05),
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(tokens.colors.championshipGold.main, 0.3),
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: alpha(tokens.colors.championshipGold.main, 0.5),
            },
          },
        },
        // Noise texture overlay utility class
        '.noise-texture': {
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.05\'/%3E%3C/svg%3E")',
            opacity: 0.03,
            pointerEvents: 'none',
            zIndex: 1,
          },
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.pill,
          padding: '10px 24px',
          fontWeight: 600,
          fontSize: '0.9375rem',
          letterSpacing: '0.02em',
          transition: `all 0.3s ${tokens.transitions.premium}`,
          position: 'relative',
          overflow: 'hidden',
          color: tokens.colors.cream.main,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 0,
            height: 0,
            borderRadius: '50%',
            background: alpha('#FFFFFF', 0.3),
            transform: 'translate(-50%, -50%)',
            transition: 'width 0.6s, height 0.6s',
          },
          '&:hover::before': {
            width: '300px',
            height: '300px',
          },
          '&.Mui-disabled': {
            color: alpha(tokens.colors.cream.main, 0.3),
          },
        },
        contained: {
          boxShadow: premiumShadows[3],
          '&:hover': {
            boxShadow: premiumShadows[6],
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: premiumShadows[2],
          },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${tokens.colors.courtBlue.light} 0%, ${tokens.colors.courtBlue.main} 100%)`,
          color: tokens.colors.cream.main,
          '&:hover': {
            background: `linear-gradient(135deg, ${tokens.colors.courtBlue.main} 0%, ${tokens.colors.courtBlue.dark} 100%)`,
          },
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${tokens.colors.championshipGold.main} 0%, ${tokens.colors.championshipGold.dark} 100%)`,
          color: tokens.colors.courtBlue.dark,
          boxShadow: premiumShadows[16], // Gold glow
          '&:hover': {
            background: `linear-gradient(135deg, ${tokens.colors.championshipGold.light} 0%, ${tokens.colors.championshipGold.main} 100%)`,
            boxShadow: premiumShadows[18], // Championship glow
          },
        },
        outlined: {
          borderWidth: '2px',
          borderColor: alpha(tokens.colors.championshipGold.main, 0.5),
          color: tokens.colors.cream.main,
          '&:hover': {
            borderWidth: '2px',
            borderColor: tokens.colors.championshipGold.main,
            backgroundColor: alpha(tokens.colors.championshipGold.main, 0.08),
          },
        },
        text: {
          color: tokens.colors.cream.main,
          '&:hover': {
            backgroundColor: alpha(tokens.colors.championshipGold.main, 0.08),
          },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.large,
          boxShadow: premiumShadows[3],
          transition: `all 0.4s ${tokens.transitions.smooth}`,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: tokens.colors.courtBlue.light,
          '&:hover': {
            boxShadow: premiumShadows[8],
            transform: 'translateY(-4px)',
            borderColor: alpha(tokens.colors.championshipGold.main, 0.3),
          },
          border: `1px solid ${alpha(tokens.colors.championshipGold.main, 0.15)}`,
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.large,
          backgroundImage: 'none',
          backgroundColor: tokens.colors.courtBlue.light,
          border: `1px solid ${alpha(tokens.colors.championshipGold.main, 0.1)}`,
        },
        elevation1: {
          boxShadow: premiumShadows[2],
        },
        elevation2: {
          boxShadow: premiumShadows[4],
        },
        elevation3: {
          boxShadow: premiumShadows[6],
        },
        elevation4: {
          boxShadow: premiumShadows[8],
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.medium,
          fontWeight: 500,
          fontSize: '0.8125rem',
          letterSpacing: '0.01em',
          transition: `all 0.2s ${tokens.transitions.smooth}`,
          '&:hover': {
            transform: 'scale(1.05)',
          },
        },
        filled: {
          '&.MuiChip-colorSuccess': {
            backgroundColor: alpha(tokens.colors.championshipGold.main, 0.15),
            color: tokens.colors.championshipGold.dark,
            fontWeight: 600,
          },
          '&.MuiChip-colorError': {
            backgroundColor: alpha(tokens.colors.burgundy.main, 0.12),
            color: tokens.colors.burgundy.main,
            fontWeight: 600,
          },
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: tokens.borderRadius.medium,
            transition: `all 0.2s ${tokens.transitions.smooth}`,
            backgroundColor: alpha(tokens.colors.courtBlue.dark, 0.5),
            color: tokens.colors.cream.main,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(tokens.colors.championshipGold.main, 0.3),
            },
            '&:hover': {
              backgroundColor: alpha(tokens.colors.courtBlue.dark, 0.6),
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: tokens.colors.championshipGold.main,
              },
            },
            '&.Mui-focused': {
              backgroundColor: alpha(tokens.colors.courtBlue.dark, 0.7),
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: tokens.colors.championshipGold.main,
                borderWidth: '2px',
              },
            },
          },
          '& .MuiInputLabel-root': {
            color: alpha(tokens.colors.cream.main, 0.7),
            '&.Mui-focused': {
              color: tokens.colors.championshipGold.main,
            },
          },
          '& .MuiInputBase-input': {
            color: tokens.colors.cream.main,
          },
        },
      },
    },

    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.medium,
          color: tokens.colors.cream.main,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(tokens.colors.championshipGold.main, 0.3),
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: tokens.colors.championshipGold.main,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: tokens.colors.championshipGold.main,
          },
        },
        icon: {
          color: tokens.colors.championshipGold.main,
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: tokens.colors.cream.main,
          backgroundColor: tokens.colors.courtBlue.light,
          '&:hover': {
            backgroundColor: alpha(tokens.colors.championshipGold.main, 0.12),
          },
          '&.Mui-selected': {
            backgroundColor: alpha(tokens.colors.championshipGold.main, 0.2),
            '&:hover': {
              backgroundColor: alpha(tokens.colors.championshipGold.main, 0.25),
            },
          },
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: alpha(tokens.colors.cream.main, 0.7),
          '&.Mui-focused': {
            color: tokens.colors.championshipGold.main,
          },
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: alpha(tokens.colors.courtBlue.main, 0.95),
          borderRadius: tokens.borderRadius.small,
          fontSize: '0.75rem',
          padding: '8px 12px',
          fontFamily: tokens.typography.bodyFont,
          fontWeight: 500,
          backdropFilter: 'blur(8px)',
          boxShadow: premiumShadows[4],
        },
        arrow: {
          color: alpha(tokens.colors.courtBlue.main, 0.95),
        },
      },
    },

    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 64,
          backgroundColor: tokens.colors.courtBlue.dark,
          borderTop: `1px solid ${alpha(tokens.colors.championshipGold.main, 0.2)}`,
          boxShadow: `0 -4px 20px ${alpha(tokens.colors.courtBlue.dark, 0.5)}`,
        },
      },
    },

    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 'auto',
          padding: '6px 12px',
          color: alpha(tokens.colors.cream.main, 0.6),
          transition: `all 0.3s ${tokens.transitions.premium}`,
          '&.Mui-selected': {
            paddingTop: '6px',
            color: tokens.colors.championshipGold.main,
            '& .MuiBottomNavigationAction-label': {
              fontWeight: 600,
            },
            '& .MuiSvgIcon-root': {
              transform: 'scale(1.1)',
            },
          },
          '&:hover': {
            backgroundColor: alpha(tokens.colors.championshipGold.main, 0.12),
            color: tokens.colors.cream.main,
          },
        },
        label: {
          fontFamily: tokens.typography.bodyFont,
          fontSize: '0.65rem',
          fontWeight: 500,
          letterSpacing: '0.02em',
          '&.Mui-selected': {
            fontSize: '0.7rem',
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        head: {
          fontFamily: tokens.typography.bodyFont,
          fontWeight: 700,
          fontSize: '0.8125rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          backgroundColor: tokens.colors.courtBlue.main,
          color: tokens.colors.cream.main,
          borderBottom: `2px solid ${tokens.colors.championshipGold.main}`,
        },
        body: {
          fontSize: '0.875rem',
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.medium,
          fontFamily: tokens.typography.bodyFont,
          fontWeight: 500,
        },
        standardSuccess: {
          backgroundColor: alpha(tokens.colors.championshipGold.main, 0.12),
          color: tokens.colors.championshipGold.dark,
          border: `1px solid ${alpha(tokens.colors.championshipGold.main, 0.3)}`,
        },
        standardError: {
          backgroundColor: alpha(tokens.colors.burgundy.main, 0.12),
          color: tokens.colors.burgundy.main,
          border: `1px solid ${alpha(tokens.colors.burgundy.main, 0.3)}`,
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(tokens.colors.courtBlue.dark, 0.95),
          backdropFilter: 'blur(16px) saturate(180%)',
          borderBottom: `1px solid ${alpha(tokens.colors.championshipGold.main, 0.2)}`,
          boxShadow: `0 4px 20px ${alpha(tokens.colors.courtBlue.dark, 0.5)}`,
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: `all 0.2s ${tokens.transitions.smooth}`,
          '&:hover': {
            transform: 'scale(1.1)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.pill,
          height: 8,
          backgroundColor: alpha(tokens.colors.courtBlue.main, 0.1),
        },
        bar: {
          borderRadius: tokens.borderRadius.pill,
          background: `linear-gradient(90deg, ${tokens.colors.championshipGold.light} 0%, ${tokens.colors.championshipGold.main} 100%)`,
        },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: tokens.colors.courtBlue.main,
          border: `1px solid ${alpha(tokens.colors.championshipGold.main, 0.2)}`,
          boxShadow: premiumShadows[8],
        },
        list: {
          backgroundColor: tokens.colors.courtBlue.main,
        },
      },
    },

    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: tokens.colors.courtBlue.main,
          border: `1px solid ${alpha(tokens.colors.championshipGold.main, 0.2)}`,
        },
      },
    },

    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: tokens.colors.championshipGold.main,
        },
      },
    },
  },
});

// Export tokens for use in components
export { tokens };
export default theme;
