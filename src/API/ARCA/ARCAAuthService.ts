import * as fs from 'fs';
import * as soap from 'soap';
import * as forge from 'node-forge';
import * as xml2js from 'xml2js';
import { type ARCAConfig, ARCA_ENDPOINTS } from './ARCAConfig';

export interface AuthTokens {
  token: string;
  sign: string;
  expirationTime: Date;
}

export class ARCAAuthService {
  private config: ARCAConfig;
  private cachedTokens: AuthTokens | null = null;

  constructor(config: ARCAConfig) {
    this.config = config;
  }

  private createTRA(service: string = 'wsfe'): string {
    const now = new Date();
    const generationTime = new Date(now.getTime() - 10 * 60 * 1000);
    const expirationTime = new Date(now.getTime() + 10 * 60 * 1000);
  
    const formatDateTime = (date: Date): string => {
      const yyyy = date.getFullYear();
      const MM = (date.getMonth() + 1).toString().padStart(2, '0');
      const dd = date.getDate().toString().padStart(2, '0');
      const HH = date.getHours().toString().padStart(2, '0');
      const mm = date.getMinutes().toString().padStart(2, '0');
      const ss = date.getSeconds().toString().padStart(2, '0');
      return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}`;
    };
  
    const uniqueId = Math.floor(Date.now() / 1000); // ✅ timestamp entero UNIX, válido para WSAA
  
    const tra = `<?xml version="1.0" encoding="UTF-8"?>
  <loginTicketRequest version="1.0">
    <header>
      <uniqueId>${uniqueId}</uniqueId>
      <generationTime>${formatDateTime(generationTime)}</generationTime>
      <expirationTime>${formatDateTime(expirationTime)}</expirationTime>
    </header>
    <service>${service}</service>
  </loginTicketRequest>`;
  
    return tra;
  }



  private createCMS(traXml: string): string {
    try {
      console.log('✍️ Creating CMS signature...');
      
      // Read certificate and private key
      const certPem = fs.readFileSync(this.config.certificatePath, 'utf8');
      const privateKeyPem = fs.readFileSync(this.config.privateKeyPath, 'utf8');
      
      console.log('📜 Certificate loaded from:', this.config.certificatePath);
      console.log('🔑 Private key loaded from:', this.config.privateKeyPath);
      
      const cert = forge.pki.certificateFromPem(certPem);
      const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

      // Create PKCS#7 signed data
      const p7 = forge.pkcs7.createSignedData();
      p7.content = forge.util.createBuffer(traXml, 'utf8');
      p7.addCertificate(cert);

      // Add signer - using simpler approach without authenticatedAttributes
      p7.addSigner({
        key: privateKey,
        certificate: cert,
        digestAlgorithm: forge.pki.oids.sha1
        // AFIP should accept signatures without authenticatedAttributes
      });

      p7.sign();
      
      // Convert to DER format and then to base64
      const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
      const base64 = forge.util.encode64(der);
      
      console.log('✅ CMS signature created successfully');
      console.log('📦 CMS length:', base64.length, 'characters');
      
      return base64;
    } catch (error) {
      console.error('❌ Error creating CMS signature:', error);
      throw new Error(`Error creating CMS signature: ${error}`);
    }
  }

  private async parseLoginResponse(xmlResponse: string): Promise<AuthTokens> {
    try {
      console.log('📨 Parsing AFIP login response...');
      
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(xmlResponse);
      
      console.log('🔍 Parsed response structure:', Object.keys(result));
      
      if (!result.loginTicketResponse) {
        throw new Error('Invalid response: missing loginTicketResponse');
      }
      
      const credentials = result.loginTicketResponse.credentials;
      const header = result.loginTicketResponse.header;
      
      if (!credentials || !header) {
        throw new Error('Invalid response: missing credentials or header');
      }
      
      const tokens = {
        token: credentials.token,
        sign: credentials.sign,
        expirationTime: new Date(header.expirationTime)
      };
      
      console.log('✅ Successfully parsed authentication tokens');
      console.log('🎫 Token length:', tokens.token?.length || 0);
      console.log('✍️ Sign length:', tokens.sign?.length || 0);
      console.log('⏰ Expires at:', tokens.expirationTime);
      
      return tokens;
    } catch (error) {
      console.error('❌ Error parsing login response:', error);
      throw new Error(`Error parsing login response: ${error}`);
    }
  }

  async getAuthTokens(forceNew: boolean = false): Promise<AuthTokens> {
    // Return cached tokens if still valid and not forcing new
    if (!forceNew && this.cachedTokens && this.cachedTokens.expirationTime > new Date()) {
      console.log('🔄 Using cached ARCA tokens (expires at ' + this.cachedTokens.expirationTime + ')');
      return this.cachedTokens;
    }

    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      try {
        attempt++;
        console.log(`🔐 Authenticating with ARCA WSAA (attempt ${attempt}/${maxAttempts})...`);
        console.log('🌍 Environment:', this.config.environment);
        console.log('🏢 CUIT:', this.config.cuit);
        
        // Step 1: Create TRA
        const traXml = this.createTRA('wsfe', attempt > 1 || forceNew);

        // Step 2: Sign the TRA
        const cms = this.createCMS(traXml);

        // Step 3: Call WSAA service
        const wsaaUrl = ARCA_ENDPOINTS[this.config.environment].wsaa;
        console.log(`🌐 Calling WSAA: ${wsaaUrl}`);
        
        // Create SOAP client
        const client = await soap.createClientAsync(wsaaUrl + '?wsdl');
        
        console.log('📡 SOAP client created, sending authentication request...');
        const result = await client.loginCmsAsync({ in0: cms });
        
        if (!result || !result[0] || !result[0].loginCmsReturn) {
          throw new Error('Invalid response from WSAA service');
        }
        
        // Step 4: Parse response
        const loginResponseXml = result[0].loginCmsReturn;
        console.log('📨 Received login response from ARCA');
        console.log('📄 Response XML length:', loginResponseXml.length);
        
        const tokens = await this.parseLoginResponse(loginResponseXml);
        
        // Cache the tokens
        this.cachedTokens = tokens;
        console.log('✅ ARCA authentication successful!');
        console.log('⏰ Token expires at:', tokens.expirationTime);
        
        return tokens;

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Authentication attempt ${attempt} failed:`, errorMessage);
        
        // Check for specific AFIP errors
        if (errorMessage.includes('alreadyAuthenticated') || 
            errorMessage.includes('ya posee un TA valido')) {
          
          console.log(`⚠️ AFIP reports existing valid token (attempt ${attempt})`);
          
          if (attempt < maxAttempts) {
            console.log('⏳ Waiting 30 seconds before retry...');
            await new Promise(resolve => setTimeout(resolve, 30000));
            continue;
          }
        } else if (errorMessage.includes('xml.bad') || 
                   errorMessage.includes('No se ha podido interpretar el XML')) {
          
          console.log(`⚠️ XML Schema validation error (attempt ${attempt})`);
          console.log('🔍 This usually means the TRA XML format is incorrect');
          
          if (attempt < maxAttempts) {
            console.log('🔄 Retrying with different uniqueId...');
            continue;
          }
        }
        
        // If this is the last attempt or an unrecoverable error, throw it
        if (attempt >= maxAttempts) {
          throw new Error(`ARCA authentication failed after ${maxAttempts} attempts: ${errorMessage}`);
        }
      }
    }

    throw new Error('Maximum authentication attempts reached');
  }

  // Helper method to check if tokens are valid
  isTokenValid(): boolean {
    const valid = this.cachedTokens !== null && 
                  this.cachedTokens.expirationTime > new Date();
    
    if (this.cachedTokens) {
      console.log('🔍 Token validation:', {
        exists: true,
        expiresAt: this.cachedTokens.expirationTime,
        isValid: valid,
        timeUntilExpiry: this.cachedTokens.expirationTime.getTime() - Date.now()
      });
    }
    
    return valid;
  }

  // Clear cached tokens (useful for testing)
  clearTokens(): void {
    this.cachedTokens = null;
    console.log('🗑️ Cleared cached authentication tokens');
  }

  // Force new authentication (bypasses cache)
  async forceNewAuthentication(): Promise<AuthTokens> {
    console.log('🔄 Forcing new authentication...');
    this.clearTokens();
    return this.getAuthTokens(true);
  
  }
}
