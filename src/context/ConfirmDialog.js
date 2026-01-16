// src/context/ConfirmDialog.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Slide,
  useTheme,
  Box,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';

// Crear el contexto
const ConfirmDialogContext = createContext(null);

// Transición personalizada
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Provider del ConfirmDialog
export const ConfirmDialogProvider = ({ children }) => {
  const theme = useTheme();
  const [dialog, setDialog] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    confirmColor: 'primary',
    variant: 'default', // 'default' | 'danger' | 'warning'
    onConfirm: () => {},
    onCancel: () => {},
  });

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setDialog({
        open: true,
        title: options.title || 'Confirmar',
        message: options.message || '',
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        confirmColor: options.variant === 'danger' ? 'error' :
                      options.variant === 'warning' ? 'warning' : 'primary',
        variant: options.variant || 'default',
        onConfirm: () => {
          setDialog(prev => ({ ...prev, open: false }));
          resolve(true);
        },
        onCancel: () => {
          setDialog(prev => ({ ...prev, open: false }));
          resolve(false);
        },
      });
    });
  }, []);

  // Funciones de conveniencia
  const confirmDelete = useCallback((message, title = 'Confirmar eliminacion') => {
    return confirm({
      title,
      message,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
  }, [confirm]);

  const confirmAction = useCallback((message, title = 'Confirmar accion') => {
    return confirm({
      title,
      message,
      confirmText: 'Continuar',
      cancelText: 'Cancelar',
      variant: 'warning',
    });
  }, [confirm]);

  const handleClose = useCallback(() => {
    dialog.onCancel();
  }, [dialog]);

  // Icono segun variante
  const getIcon = () => {
    switch (dialog.variant) {
      case 'danger':
        return <DeleteIcon sx={{ fontSize: 40, color: theme.palette.error.main }} />;
      case 'warning':
        return <WarningAmberIcon sx={{ fontSize: 40, color: theme.palette.warning.main }} />;
      default:
        return <InfoIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />;
    }
  };

  const contextValue = {
    confirm,
    confirmDelete,
    confirmAction,
  };

  return (
    <ConfirmDialogContext.Provider value={contextValue}>
      {children}
      <Dialog
        open={dialog.open}
        onClose={handleClose}
        TransitionComponent={Transition}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: { xs: '90%', sm: 400 },
            maxWidth: 450,
          }
        }}
      >
        <DialogTitle
          id="confirm-dialog-title"
          sx={{
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: dialog.variant === 'danger'
                ? theme.palette.error.light + '30'
                : dialog.variant === 'warning'
                ? theme.palette.warning.light + '30'
                : theme.palette.primary.light + '30',
            }}
          >
            {getIcon()}
          </Box>
          <span>{dialog.title}</span>
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            id="confirm-dialog-description"
            sx={{
              color: 'text.primary',
              fontSize: '1rem',
              lineHeight: 1.6,
            }}
          >
            {dialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            color="inherit"
            sx={{
              minWidth: 100,
              borderRadius: 2,
            }}
          >
            {dialog.cancelText}
          </Button>
          <Button
            onClick={dialog.onConfirm}
            variant="contained"
            color={dialog.confirmColor}
            autoFocus
            sx={{
              minWidth: 100,
              borderRadius: 2,
            }}
          >
            {dialog.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmDialogContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useConfirmDialog = () => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog debe ser usado dentro de un ConfirmDialogProvider');
  }
  return context;
};

export default ConfirmDialogContext;
