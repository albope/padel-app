// src/components/ErrorBoundary.js
import React from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';

/**
 * Error Boundary component to catch JavaScript errors anywhere in the component tree
 * Displays a fallback UI instead of crashing the entire app
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Log to external service (e.g., Sentry) if configured
    if (window.SENTRY_ENABLED) {
      // Example: Sentry.captureException(error, { extra: errorInfo });
      console.log('Would send to Sentry:', { error, errorInfo });
    }

    // Log structured error for analytics
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: true,
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <Container maxWidth="sm">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              py: 4,
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 3,
                width: '100%',
              }}
            >
              <ErrorOutlineIcon
                sx={{
                  fontSize: 80,
                  color: 'error.main',
                  mb: 2,
                }}
              />

              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                ¡Ups! Algo salió mal
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                La aplicación encontró un error inesperado. No te preocupes, tus datos están seguros.
              </Typography>

              {/* Show error count if multiple errors */}
              {errorCount > 1 && (
                <Typography variant="caption" color="error" sx={{ mb: 2, display: 'block' }}>
                  Este error ha ocurrido {errorCount} veces en esta sesión.
                </Typography>
              )}

              {/* Action buttons */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  mt: 3,
                }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReset}
                  fullWidth
                >
                  Reintentar
                </Button>

                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  startIcon={<HomeIcon />}
                  onClick={this.handleGoHome}
                  fullWidth
                >
                  Ir al Inicio
                </Button>

                <Button
                  variant="text"
                  color="secondary"
                  size="small"
                  onClick={this.handleReload}
                >
                  Recargar Página
                </Button>
              </Box>

              {/* Development mode: show error details */}
              {isDevelopment && error && (
                <Box
                  sx={{
                    mt: 4,
                    p: 2,
                    backgroundColor: 'grey.100',
                    borderRadius: 2,
                    textAlign: 'left',
                    maxHeight: 300,
                    overflow: 'auto',
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1, color: 'error.main' }}
                  >
                    Error Details (Development Only):
                  </Typography>
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {error.toString()}
                    {errorInfo && errorInfo.componentStack}
                  </Typography>
                </Box>
              )}

              {/* Support information */}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 3, display: 'block' }}
              >
                Si el problema persiste, intenta limpiar la caché del navegador o contacta con soporte.
              </Typography>
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
