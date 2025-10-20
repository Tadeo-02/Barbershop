import * as soap from 'soap';
import { ARCAConfig, ARCA_ENDPOINTS, VOUCHER_TYPES } from './ARCAConfig';
import { ARCAAuthService, AuthTokens } from './ARCAAuthService';

export interface InvoiceData {
  pointOfSale: number;
  voucherType: number;
  concept: number; // 1: Products, 2: Services, 3: Products and Services
  documentType: number; // 80: CUIT, 86: CUIL, 96: DNI, 99: General Consumer
  documentNumber: string;
  invoiceDate: string; // YYYYMMDD
  netAmount: number;
  exemptAmount: number;
  taxAmount: number;
  totalAmount: number;
  currencyId: string; // 'PES' for pesos
  currencyRate: number; // 1 for pesos
}

export interface InvoiceResponse {
  success: boolean;
  cae?: string;
  caeExpirationDate?: string;
  voucherNumber?: number;
  errors?: string[];
}

export class WSFEService {
  private config: ARCAConfig;
  private authService: ARCAAuthService;

  constructor(config: ARCAConfig) {
    this.config = config;
    this.authService = new ARCAAuthService(config);
  }

  private async getAuthData(): Promise<{ token: string; sign: string; cuit: string }> {
    const tokens = await this.authService.getAuthTokens();
    return {
      token: tokens.token,
      sign: tokens.sign,
      cuit: this.config.cuit
    };
  }

  async getServerStatus(): Promise<any> {
    try {
      const wsfeUrl = ARCA_ENDPOINTS[this.config.environment].wsfe;
      const client = await soap.createClientAsync(wsfeUrl + '?wsdl');
      
      const result = await client.FEDummyAsync();
      return result[0];
    } catch (error) {
      throw new Error(`Failed to get server status: ${error}`);
    }
  }

  async getLastVoucherNumber(pointOfSale: number, voucherType: number): Promise<number> {
    try {
      const authData = await this.getAuthData();
      const wsfeUrl = ARCA_ENDPOINTS[this.config.environment].wsfe;
      const client = await soap.createClientAsync(wsfeUrl + '?wsdl');

      const result = await client.FECompUltimoAutorizadoAsync({
        Auth: authData,
        PtoVta: pointOfSale,
        CbteTipo: voucherType
      });

      return result[0].FECompUltimoAutorizadoResult.CbteNro || 0;
    } catch (error) {
      throw new Error(`Failed to get last voucher number: ${error}`);
    }
  }

  async createInvoice(invoiceData: InvoiceData): Promise<InvoiceResponse> {
    try {
      const authData = await this.getAuthData();
      const wsfeUrl = ARCA_ENDPOINTS[this.config.environment].wsfe;
      const client = await soap.createClientAsync(wsfeUrl + '?wsdl');

      // Get next voucher number
      const lastVoucherNumber = await this.getLastVoucherNumber(
        invoiceData.pointOfSale,
        invoiceData.voucherType
      );
      const nextVoucherNumber = lastVoucherNumber + 1;

      // Prepare invoice request
      const invoiceRequest = {
        Auth: authData,
        FeCAEReq: {
          FeCabReq: {
            CantReg: 1,
            PtoVta: invoiceData.pointOfSale,
            CbteTipo: invoiceData.voucherType
          },
          FeDetReq: {
            FECAEDetRequest: [{
              Concepto: invoiceData.concept,
              DocTipo: invoiceData.documentType,
              DocNro: invoiceData.documentNumber,
              CbteDesde: nextVoucherNumber,
              CbteHasta: nextVoucherNumber,
              CbteFch: invoiceData.invoiceDate,
              ImpTotal: invoiceData.totalAmount,
              ImpTotConc: invoiceData.netAmount,
              ImpNeto: invoiceData.netAmount,
              ImpOpEx: invoiceData.exemptAmount,
              ImpTrib: 0,
              ImpIVA: invoiceData.taxAmount,
              FchServDesde: invoiceData.invoiceDate,
              FchServHasta: invoiceData.invoiceDate,
              FchVtoPago: invoiceData.invoiceDate,
              MonId: invoiceData.currencyId,
              MonCotiz: invoiceData.currencyRate
            }]
          }
        }
      };
      const result = await client.FECAESolicitarAsync(invoiceRequest);
      const response = result[0].FECAESolicitarResult;

      // Debug: Log the full response structure to understand what AFIP returns
      console.log('🔍 AFIP Full Response:', JSON.stringify(response, null, 2));
      console.log('🔍 Response keys:', Object.keys(response));
      
      if (response.FeDetResp) {
        console.log('🔍 FeDetResp:', JSON.stringify(response.FeDetResp, null, 2));
        console.log('🔍 FeDetResp keys:', Object.keys(response.FeDetResp));
      }

      if (response.Errors && response.Errors.length > 0) {
        return {
          success: false,
          errors: response.Errors.map((err: any) => err.Msg)
        };
      }

      // Check if the expected structure exists before accessing it
      if (!response.FeDetResp || !response.FeDetResp.FECAEDetResponse) {
        console.log('❌ Unexpected response structure');
        return {
          success: false,
          errors: ['Unexpected response structure from AFIP']
        };
      }

      const detailResponse = response.FeDetResp.FECAEDetResponse[0];
      
      return {
        success: true,
        cae: detailResponse.CAE,
        caeExpirationDate: detailResponse.CAEFchVto,
        voucherNumber: nextVoucherNumber
      };


    } catch (error) {
      return {
        success: false,
        errors: [`Failed to create invoice: ${error}`]
      };
    }
  }
}
