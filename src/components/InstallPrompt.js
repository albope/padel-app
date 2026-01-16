import React, { useState, useEffect } from 'react';
import { Box, Button, Paper, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GetAppIcon from '@mui/icons-material/GetApp';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Previene que el navegador muestre su propio prompt
      e.preventDefault();
      // Guarda el evento para poder dispararlo después
      setDeferredPrompt(e);
      // Muestra nuestro prompt personalizado
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Muestra el prompt de instalación
    deferredPrompt.prompt();

    // Espera a que el usuario responda
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`User response to install prompt: ${outcome}`);

    // Limpia el prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Guardar en localStorage que el usuario rechazó el prompt
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // No mostrar si ya fue rechazado antes
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed === 'true') {
      setShowPrompt(false);
    }
  }, []);

  // No mostrar si ya está instalado
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }
  }, []);

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 80, sm: 24 }, // Espacio para el bottom nav en móvil
        left: { xs: 16, sm: 24 },
        right: { xs: 16, sm: 'auto' },
        maxWidth: { sm: 400 },
        zIndex: 1000,
        animation: 'slideUp 0.3s ease-out',
        '@keyframes slideUp': {
          from: {
            transform: 'translateY(100%)',
            opacity: 0,
          },
          to: {
            transform: 'translateY(0)',
            opacity: 1,
          },
        },
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 2,
          borderRadius: 2,
          background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: (theme) => theme.palette.primary.contrastText,
          border: (theme) => `1px solid ${theme.palette.secondary.main}`,
          boxShadow: (theme) => theme.shadows[16],
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          <PhoneAndroidIcon sx={{ mr: 1, mt: 0.5, color: (theme) => theme.palette.secondary.main }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', color: (theme) => theme.palette.primary.contrastText }}>
              Instalar Padel +K
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9, color: (theme) => theme.palette.primary.contrastText }}>
              Instala la app para acceso rápido y usar sin conexión
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handleDismiss}
            sx={{ color: (theme) => theme.palette.primary.contrastText, ml: 1 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<GetAppIcon />}
            onClick={handleInstall}
            sx={{
              bgcolor: '#D4AF37',
              color: '#FFFFFF !important',
              fontWeight: 700,
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              '& .MuiButton-startIcon': {
                color: '#FFFFFF',
              },
              '&:hover': {
                bgcolor: '#E6C96E',
                color: '#FFFFFF !important',
              },
            }}
          >
            Instalar
          </Button>
          <Button
            variant="outlined"
            onClick={handleDismiss}
            sx={{
              color: (theme) => theme.palette.primary.contrastText,
              borderColor: 'rgba(255, 255, 255, 0.5)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                borderColor: 'rgba(255, 255, 255, 0.8)',
              },
            }}
          >
            Ahora no
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default InstallPrompt;
