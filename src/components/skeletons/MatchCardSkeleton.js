// MatchCardSkeleton.js - Skeleton loader para MatchCard
import React from 'react';
import { Box, Card, CardContent, Skeleton, useTheme, alpha } from '@mui/material';

const MatchCardSkeleton = () => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: theme.shadows[2],
      }}
    >
      <CardContent>
        {/* Header: Fecha y ubicación */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="30%" height={20} />
        </Box>

        {/* Main content: Teams vs Teams */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 1,
            mb: 2,
          }}
        >
          {/* Pareja 1 */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              p: 1.5,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.grey[500], 0.05),
            }}
          >
            <Skeleton variant="text" width="80%" height={20} />
            <Skeleton variant="text" width="70%" height={20} />
          </Box>

          {/* VS divider */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: 1,
            }}
          >
            <Skeleton variant="text" width={30} height={24} />
          </Box>

          {/* Pareja 2 */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              p: 1.5,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.grey[500], 0.05),
            }}
          >
            <Skeleton variant="text" width="80%" height={20} />
            <Skeleton variant="text" width="70%" height={20} />
          </Box>
        </Box>

        {/* Sets results */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
            py: 1.5,
            px: 2,
            backgroundColor: alpha(theme.palette.grey[500], 0.05),
            borderRadius: 2,
          }}
        >
          {[1, 2, 3].map((set) => (
            <Box
              key={set}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Skeleton variant="text" width={30} height={16} />
              <Skeleton variant="rectangular" width={32} height={24} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={32} height={24} sx={{ borderRadius: 1 }} />
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default MatchCardSkeleton;
