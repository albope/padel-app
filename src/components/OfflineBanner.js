import React, { useState, useEffect } from 'react';
import { Alert, Snackbar, Box } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import WifiIcon from '@mui/icons-material/Wifi';

const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineToast(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineToast(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleCloseOffline = () => {
    setShowOfflineToast(false);
  };

  const handleCloseOnline = () => {
    setShowOnlineToast(false);
  };

  return (
    <>
      {/* Banner persistente cuando está offline */}
      {!isOnline && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: 'warning.main',
            color: 'warning.contrastText',
            padding: 1,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            boxShadow: 2,
          }}
        >
          <WifiOffIcon fontSize="small" />
          <Box component="span" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
            Sin conexión - Mostrando datos guardados
          </Box>
        </Box>
      )}

      {/* Toast cuando cambia a offline */}
      <Snackbar
        open={showOfflineToast}
        autoHideDuration={6000}
        onClose={handleCloseOffline}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseOffline}
          severity="warning"
          variant="filled"
          icon={<WifiOffIcon />}
          sx={{ width: '100%' }}
        >
          Conexión perdida. La app funcionará con datos guardados.
        </Alert>
      </Snackbar>

      {/* Toast cuando recupera conexión */}
      <Snackbar
        open={showOnlineToast}
        autoHideDuration={4000}
        onClose={handleCloseOnline}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseOnline}
          severity="success"
          variant="filled"
          icon={<WifiIcon />}
          sx={{ width: '100%' }}
        >
          Conexión restaurada
        </Alert>
      </Snackbar>
    </>
  );
};

export default OfflineBanner;
