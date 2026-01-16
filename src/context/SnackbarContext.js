// src/context/SnackbarContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, Slide } from '@mui/material';

// Crear el contexto
const SnackbarContext = createContext(null);

// Transición personalizada
function SlideTransition(props) {
  return <Slide {...props} direction="up" />;
}

// Provider del Snackbar
export const SnackbarProvider = ({ children }) => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info', // 'success' | 'error' | 'warning' | 'info'
    autoHideDuration: 4000,
  });

  const showSnackbar = useCallback((message, severity = 'info', duration = 4000) => {
    setSnackbar({
      open: true,
      message,
      severity,
      autoHideDuration: duration,
    });
  }, []);

  // Funciones de conveniencia
  const showSuccess = useCallback((message, duration) => {
    showSnackbar(message, 'success', duration);
  }, [showSnackbar]);

  const showError = useCallback((message, duration) => {
    showSnackbar(message, 'error', duration);
  }, [showSnackbar]);

  const showWarning = useCallback((message, duration) => {
    showSnackbar(message, 'warning', duration);
  }, [showSnackbar]);

  const showInfo = useCallback((message, duration) => {
    showSnackbar(message, 'info', duration);
  }, [showSnackbar]);

  const handleClose = useCallback((event, reason) => {
    // No cerrar si el usuario hace clic fuera del snackbar
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const contextValue = {
    showSnackbar,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <SnackbarContext.Provider value={contextValue}>
      {children}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.autoHideDuration}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={SlideTransition}
        sx={{ mb: 7 }} // Espacio para el BottomNav
      >
        <Alert
          onClose={handleClose}
          severity={snackbar.severity}
          variant="filled"
          elevation={6}
          sx={{
            width: '100%',
            minWidth: 280,
            '& .MuiAlert-message': {
              fontSize: '0.95rem',
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar debe ser usado dentro de un SnackbarProvider');
  }
  return context;
};

export default SnackbarContext;
