import Afip from "@afipsdk/afip.js";
import fs from "fs";
import path from "path";

/**
 * Configuración de ARCA (ex-AFIP) para facturación electrónica.
 *
 * En modo TESTING usa el CUIT de prueba 20409378472 sin necesidad de certificado.
 * En modo PRODUCCIÓN necesita certificado digital (.crt) y clave privada (.key).
 *
 * Variables de entorno requeridas:
 *   AFIP_ACCESS_TOKEN  - Token obtenido de https://app.afipsdk.com
 *   AFIP_CUIT          - CUIT del negocio (sin guiones). Default: 20409378472 (testing)
 *   AFIP_ENVIRONMENT   - "testing" | "production". Default: "testing"
 *   AFIP_CERT_PATH     - (Producción) Ruta al archivo .crt
 *   AFIP_KEY_PATH      - (Producción) Ruta al archivo .key
 *   AFIP_PUNTO_VENTA   - Punto de venta. Default: 1
 */

const AFIP_ENVIRONMENT = process.env.AFIP_ENVIRONMENT || "testing";
const AFIP_CUIT = parseInt(process.env.AFIP_CUIT || "20409378472", 10);
const AFIP_ACCESS_TOKEN = process.env.AFIP_ACCESS_TOKEN || "";
export const AFIP_PUNTO_VENTA = parseInt(
  process.env.AFIP_PUNTO_VENTA || "1",
  10,
);

// Tipos de comprobante más comunes
export const VOUCHER_TYPES = {
  FACTURA_A: 1,
  NOTA_DEBITO_A: 2,
  NOTA_CREDITO_A: 3,
  FACTURA_B: 6,
  NOTA_DEBITO_B: 7,
  NOTA_CREDITO_B: 8,
  FACTURA_C: 11,
  NOTA_DEBITO_C: 12,
  NOTA_CREDITO_C: 13,
} as const;

// Tipos de concepto
export const CONCEPT_TYPES = {
  PRODUCTOS: 1,
  SERVICIOS: 2,
  PRODUCTOS_Y_SERVICIOS: 3,
} as const;

// Tipos de documento
export const DOC_TYPES = {
  CUIT: 80,
  CUIL: 86,
  CDI: 87,
  DNI: 96,
  CONSUMIDOR_FINAL: 99,
} as const;

// Alícuotas de IVA
export const IVA_TYPES = {
  IVA_0: 3,
  IVA_10_5: 4,
  IVA_21: 5,
  IVA_27: 6,
  IVA_5: 8,
  IVA_2_5: 9,
} as const;

// Condición frente al IVA del receptor
export const IVA_CONDITION = {
  IVA_RESPONSABLE_INSCRIPTO: 1,
  IVA_SUJETO_EXENTO: 4,
  CONSUMIDOR_FINAL: 5,
  RESPONSABLE_MONOTRIBUTO: 6,
  SUJETO_NO_CATEGORIZADO: 7,
  PROVEEDOR_DEL_EXTERIOR: 8,
  CLIENTE_DEL_EXTERIOR: 9,
  IVA_LIBERADO: 10,
  IVA_NO_ALCANZADO: 15,
} as const;

function createAfipInstance(): Afip {
  const config: Record<string, unknown> = {
    CUIT: AFIP_CUIT,
    access_token: AFIP_ACCESS_TOKEN,
  };

  // En producción, cargar certificado y clave
  if (AFIP_ENVIRONMENT === "production") {
    const certPath = process.env.AFIP_CERT_PATH;
    const keyPath = process.env.AFIP_KEY_PATH;

    if (!certPath || !keyPath) {
      throw new Error(
        "AFIP_CERT_PATH y AFIP_KEY_PATH son requeridos en producción",
      );
    }

    config.cert = fs.readFileSync(path.resolve(certPath), {
      encoding: "utf8",
    });
    config.key = fs.readFileSync(path.resolve(keyPath), { encoding: "utf8" });
  }

  return new Afip(config as ConstructorParameters<typeof Afip>[0]);
}

// Singleton de la instancia de Afip
let afipInstance: Afip | null = null;

export function getAfip(): Afip {
  if (!afipInstance) {
    afipInstance = createAfipInstance();
  }
  return afipInstance;
}

// Para testing: permite resetear la instancia
export function resetAfipInstance(): void {
  afipInstance = null;
}
