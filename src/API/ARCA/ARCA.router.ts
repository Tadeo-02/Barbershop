import { Router } from 'express';
import arcaController from './ARCA.controller';

const ARCARouter = Router(); // Fixed: was ARCARouter but used 'ARCARouter'

// Test ARCA connection
ARCARouter.get('/status', arcaController.getServerStatus.bind(arcaController));

// Get last voucher number
ARCARouter.get('/voucher/:pointOfSale/:voucherType/last', arcaController.getLastVoucher.bind(arcaController));

// Create invoice
ARCARouter.post('/invoice', arcaController.createInvoice.bind(arcaController));

// Test routes
ARCARouter.get('/test', (req, res) => {
  res.json({ message: 'ARCA routes working!' });
});

export default ARCARouter;
