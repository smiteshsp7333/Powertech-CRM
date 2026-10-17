import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[Powertech ERP] Backend server running on port ${PORT}`);
  console.log(`[Powertech ERP] API Gateway: http://localhost:${PORT}/api`);
  console.log(`[Powertech ERP] OpenAPI Docs: http://localhost:${PORT}/docs`);
});

process.on('SIGTERM', () => {
  console.log('[Powertech ERP] SIGTERM signal received. Closing HTTP server gracefully.');
  server.close(() => {
    console.log('[Powertech ERP] HTTP server closed.');
    process.exit(0);
  });
});
