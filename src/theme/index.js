// src/theme/index.js
import { createTheme, alpha } from '@mui/material/styles';

// Design Tokens
const tokens = {
  colors: {
    // Primary - Azul profesional
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#fff',
    },
    // Secondary - Rosa/Magenta para acentos
    secondary: {
      main: '#f50057',
      light: '#ff4081',
      dark: '#c51162',
      contrastText: '#fff',
    },
    // Success - Verde victoria
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
      contrastText: '#fff',
    },
    // Error - Rojo derrota
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
      contrastText: '#fff',
    },
    // Warning - Dorado trofeos
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
      contrastText: '#fff',
    },
    // Info - Azul informativo
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
      contrastText: '#fff',
    },
    // Badges de logros
    badges: {
      bronze: '#cd7f32',
      silver: '#c0c0c0',
      gold: '#ffd700',
    },
  },
  spacing: 8, // Base spacing unit (8px)
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
    xl: 16,
    pill: 24,
    round: '50%',
  },
};

const theme = createTheme({
  palette: {
    primary: tokens.colors.primary,
    secondary: tokens.colors.secondary,
    success: tokens.colors.success,
    error: tokens.colors.error,
    warning: tokens.colors.warning,
    info: tokens.colors.info,
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#616161',
      disabled: '#9e9e9e',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
    // Custom colors for badges
    badges: tokens.colors.badges,
    // Semantic colors for match results
    winner: {
      main: tokens.colors.success.light,
      background: alpha(tokens.colors.success.main, 0.08),
    },
    loser: {
      main: tokens.colors.error.light,
      background: alpha(tokens.colors.error.main, 0.08),
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      color: '#616161',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.875rem',
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
  },
  spacing: tokens.spacing,
  shape: {
    borderRadius: tokens.borderRadius.medium,
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0,0,0,0.08)',
    '0px 2px 4px rgba(0,0,0,0.08)',
    '0px 4px 8px rgba(0,0,0,0.08)',
    '0px 6px 12px rgba(0,0,0,0.1)',
    '0px 8px 16px rgba(0,0,0,0.1)',
    '0px 12px 24px rgba(0,0,0,0.12)',
    '0px 16px 32px rgba(0,0,0,0.12)',
    '0px 20px 40px rgba(0,0,0,0.14)',
    '0px 24px 48px rgba(0,0,0,0.14)',
    '0px 28px 56px rgba(0,0,0,0.16)',
    '0px 32px 64px rgba(0,0,0,0.16)',
    // Rest filled with last value
    '0px 32px 64px rgba(0,0,0,0.16)',
    '0px 32px 64px rgba(0,0,0,0.16)',
    '0px 32px 64px rgba(0,0,0,0.16)',
    '0px 32px 64px rgba(0,0,0,0.16)',
    '0px 32px 64px rgba(0,0,0,0.16)',
    '0px 32px 64px rgba(0,0,0,0.16)',
    '0px 32px 64px rgba(0,0,0,0.16)',
    '0px 32px 64px rgba(0,0,0,0.16)',
    '0px 32px 64px rgba(0,0,0,0.16)',
    '0px 32px 64px rgba(0,0,0,0.16)',
    '0px 32px 64px rgba(0,0,0,0.16)',
    '0px 32px 64px rgba(0,0,0,0.16)',
    '0px 32px 64px rgba(0,0,0,0.16)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.pill,
          padding: '8px 20px',
          fontWeight: 600,
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0,0,0,0.15)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
          },
        },
      },
      defaultProps: {
        disableElevation: false,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.large,
          boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
          transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0px 4px 16px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.large,
        },
        elevation1: {
          boxShadow: '0px 1px 4px rgba(0,0,0,0.08)',
        },
        elevation2: {
          boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
        },
        elevation3: {
          boxShadow: '0px 4px 12px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.medium,
          fontWeight: 500,
        },
        filled: {
          '&.MuiChip-colorSuccess': {
            backgroundColor: alpha(tokens.colors.success.main, 0.12),
            color: tokens.colors.success.dark,
          },
          '&.MuiChip-colorError': {
            backgroundColor: alpha(tokens.colors.error.main, 0.12),
            color: tokens.colors.error.dark,
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'medium',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: tokens.borderRadius.medium,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.medium,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(33, 33, 33, 0.9)',
          borderRadius: tokens.borderRadius.small,
          fontSize: '0.75rem',
          padding: '8px 12px',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 64,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 'auto',
          padding: '6px 0',
          '&.Mui-selected': {
            paddingTop: '6px',
          },
        },
        label: {
          fontSize: '0.65rem',
          '&.Mui-selected': {
            fontSize: '0.7rem',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#f5f5f5',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.medium,
        },
        standardSuccess: {
          backgroundColor: alpha(tokens.colors.success.main, 0.12),
        },
        standardError: {
          backgroundColor: alpha(tokens.colors.error.main, 0.12),
        },
      },
    },
  },
});

// Export tokens for use in components if needed
export { tokens };
export default theme;
