export interface ARCAConfig {
  environment: 'testing' | 'production';
  cuit: string;
  certificatePath: string;
  privateKeyPath: string;
  passphrase?: string;
}

export const ARCA_ENDPOINTS = {
  testing: {
    wsaa: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
    wsfe: 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx'        // FIXED!
  },
  production: {
    wsaa: 'https://wsaa.afip.gov.ar/ws/services/LoginCms',
    wsfe: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx'     // FIXED!
  }
};



export const VOUCHER_TYPES = {
  FACTURA_A: 1,
  FACTURA_B: 6,
  FACTURA_C: 11,
  NOTA_CREDITO_A: 3,
  NOTA_CREDITO_B: 8,
  NOTA_CREDITO_C: 13
} as const;
