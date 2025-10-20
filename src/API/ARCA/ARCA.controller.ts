import { Request, Response } from "express";
import { WSFEService, InvoiceData } from "./WSFEService";
import { ARCAConfig, VOUCHER_TYPES } from "./ARCAConfig";
import { config } from "dotenv";
import path from "path";

class ARCAController {
  private wsfeService: WSFEService;

  constructor() {
    // Load ARCA-specific environment variables from ARCA.env
    config({ path: path.join(__dirname, 'ARCA.env') });

    const arcaConfig: ARCAConfig = {
      environment:
        (process.env.ARCA_ENVIRONMENT as "testing" | "production") || "testing",
      cuit: process.env.ARCA_CUIT || "",
      certificatePath: process.env.ARCA_CERTIFICATE_PATH || "",
      privateKeyPath: process.env.ARCA_PRIVATE_KEY_PATH || "",
    };

    // Debug: Log the configuration
    console.log('🔧 ARCA Config loaded from ARCA.env:', {
      environment: arcaConfig.environment,
      cuit: arcaConfig.cuit,
      certificatePath: arcaConfig.certificatePath,
      privateKeyPath: arcaConfig.privateKeyPath
    });

    this.wsfeService = new WSFEService(arcaConfig);
  }

  async getServerStatus(req: Request, res: Response) {
    try {
      const status = await this.wsfeService.getServerStatus();
      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getLastVoucher(req: Request, res: Response) {
    try {
      const { pointOfSale, voucherType } = req.params;

      const lastVoucher = await this.wsfeService.getLastVoucherNumber(
        parseInt(pointOfSale),
        parseInt(voucherType),
      );

      res.json({
        success: true,
        lastVoucherNumber: lastVoucher,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to get last voucher number: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  async createInvoice(req: Request, res: Response) {
    try {
      const invoiceData: InvoiceData = {
        pointOfSale: parseInt(process.env.ARCA_POINT_OF_SALE || "1"),
        voucherType: VOUCHER_TYPES.FACTURA_B, // Default to Factura B
        concept: 2, // Services
        documentType: 96, // DNI
        documentNumber: req.body.customerDocument,
        invoiceDate: new Date().toISOString().slice(0, 10).replace(/-/g, ""),
        netAmount: req.body.netAmount,
        exemptAmount: 0,
        taxAmount: req.body.taxAmount || 0,
        totalAmount: req.body.totalAmount,
        currencyId: "PES",
        currencyRate: 1,
        ...req.body, // Override with any provided data
      };

      const result = await this.wsfeService.createInvoice(invoiceData);

      if (result.success) {
        res.json({
          success: true,
          invoice: {
            cae: result.cae,
            caeExpirationDate: result.caeExpirationDate,
            voucherNumber: result.voucherNumber,
            ...invoiceData,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          errors: result.errors,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async clearAuthTokens(req: Request, res: Response) {
    try {
      // Access the auth service from WSFEService to clear tokens
      await this.wsfeService.clearAuthenticationTokens();
      
      res.json({
        success: true,
        message: "Authentication tokens cleared successfully. Next request will authenticate with AFIP again.",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async forceReauth(req: Request, res: Response) {
    try {
      // Force new authentication
      await this.wsfeService.forceNewAuthentication();
      
      res.json({
        success: true,
        message: "Forced new authentication with AFIP successful",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Force authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }
}

export default new ARCAController();
