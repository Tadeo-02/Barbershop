import * as fs from 'fs';
import * as soap from 'soap';
import * as forge from 'node-forge';
import * as xml2js from 'xml2js';
import { ARCAConfig, ARCA_ENDPOINTS } from './ARCAConfig';

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
    const expiration = new Date(now.getTime() + 1 * 60 * 60 * 1000); // Try 1 hour first

    const uniqueId = Math.floor(now.getTime() / 1000);
    const generationTime = now.toISOString(); // Keep Z (UTC)
    const expirationTime = expiration.toISOString(); // Keep Z (UTC)

    console.log('🕐 Generation time:', generationTime);
    console.log('🕐 Expiration time:', expirationTime);

    return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${uniqueId}</uniqueId>
    <generationTime>${generationTime}</generationTime>
    <expirationTime>${expirationTime}</expirationTime>
  </header>
  <service>${service}</service>
</loginTicketRequest>`;
  }


  private createCMS(traXml: string): string {
    try {
      // Read certificate and private key
      const certPem = fs.readFileSync(this.config.certificatePath, 'utf8');
      const privateKeyPem = fs.readFileSync(this.config.privateKeyPath, 'utf8');
      
      const cert = forge.pki.certificateFromPem(certPem);
      const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

      // Create PKCS#7 signed data
      const p7 = forge.pkcs7.createSignedData();
      p7.content = forge.util.createBuffer(traXml, 'utf8');
      p7.addCertificate(cert);

      // Add signer WITHOUT authenticated attributes (simpler approach)
      p7.addSigner({
        key: privateKey,
        certificate: cert,
        digestAlgorithm: forge.pki.oids.sha1
        // Remove authenticatedAttributes - let forge handle it automatically
      });

      p7.sign();
      
      // Convert to DER format and then to base64
      const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
      return forge.util.encode64(der);
    } catch (error) {
      throw new Error(`Error creating CMS signature: ${error}`);
    }
  }

  // This parses the response XML that ARCA sends back
  private async parseLoginResponse(xmlResponse: string): Promise<AuthTokens> {
    try {
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(xmlResponse);
      
      const credentials = result.loginTicketResponse.credentials;
      const header = result.loginTicketResponse.header;
      
      return {
        token: credentials.token,
        sign: credentials.sign,
        expirationTime: new Date(header.expirationTime)
      };
    } catch (error) {
      throw new Error(`Error parsing login response: ${error}`);
    }
  }

  async getAuthTokens(): Promise<AuthTokens> {
    // Return cached tokens if still valid
    if (this.cachedTokens && this.cachedTokens.expirationTime > new Date()) {
      console.log('🔄 Using cached ARCA tokens');
      return this.cachedTokens;
    }

    try {
      console.log('🔐 Authenticating with ARCA WSAA...');
      
      // Step 1: Create TRA (dynamically)
      const traXml = this.createTRA('wsfe');
      console.log('📝 Created TRA (Ticket Request Authorization)');

      // Step 2: Sign the TRA
      const cms = this.createCMS(traXml);
      console.log('✍️ Signed TRA with certificate');

      // Step 3: Call WSAA service
      const wsaaUrl = ARCA_ENDPOINTS[this.config.environment].wsaa;
      console.log(`🌐 Calling WSAA: ${wsaaUrl}`);
      
      const client = await soap.createClientAsync(wsaaUrl + '?wsdl');
      const result = await client.loginCmsAsync({ in0: cms });
      
      // Step 4: Parse response (this is your loginticketresponse.xml content)
      const loginResponseXml = result[0].loginCmsReturn;
      console.log('📨 Received login response from ARCA');
      
      const tokens = await this.parseLoginResponse(loginResponseXml);
      
      // Cache the tokens
      this.cachedTokens = tokens;
      console.log('✅ ARCA authentication successful');
      
      return tokens;

    } catch (error) {
      console.error('❌ ARCA authentication failed:', error);
      throw new Error(`ARCA authentication failed: ${error}`);
    }
  }

  // Helper method to check if tokens are valid
  isTokenValid(): boolean {
    return this.cachedTokens !== null && 
           this.cachedTokens.expirationTime > new Date();
  }

  // Clear cached tokens (useful for testing)
  clearTokens(): void {
    this.cachedTokens = null;
  }
}
