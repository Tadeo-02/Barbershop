import axios from "axios";

async function testARCA() {
  const baseURL = 'http://localhost:3001';
  
  console.log('🚀 Starting ARCA integration tests...');
  console.log('📍 Base URL:', baseURL);
  
  try {
    // Test 1: Basic router connection
    console.log('\n🔧 Test 1: Testing basic router connection...');
    const testResponse = await axios.get(`${baseURL}/arca/test`);
    console.log('✅ Router Test:', testResponse.data);
    
    // Test 2: Server status (tests WSFE connection)
    console.log('\n🌐 Test 2: Testing ARCA server status...');
    const statusResponse = await axios.get(`${baseURL}/arca/status`);
    console.log('✅ ARCA Server Status:', statusResponse.data);
    
    // Test 3: Last voucher number
    console.log('\n🧾 Test 3: Testing last voucher number...');
    const voucherResponse = await axios.get(`${baseURL}/arca/voucher/1/6/last`);
    console.log('✅ Last Voucher (Point of Sale 1, Type 6 - Factura B):', voucherResponse.data);
    
    // Test 4: Create a test invoice
    console.log('\n📄 Test 4: Testing invoice creation...');
    const invoiceData = {
      customerDocument: '12345678',
      netAmount: 1000,
      taxAmount: 210, // 21% IVA
      totalAmount: 1210,
      concept: 2, // Services
      documentType: 96, // DNI
      voucherType: 6 // Factura B
    };
    
    const invoiceResponse = await axios.post(`${baseURL}/arca/invoice`, invoiceData);
    console.log('✅ Invoice Creation:', invoiceResponse.data);
    
    console.log('\n🎉 All ARCA tests completed successfully!');
    
  } catch (error: any) {
    console.error('\n❌ Error testing ARCA:');
    
    if (error.response) {
      // Server responded with error status
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received. Is your server running?');
      console.error('Make sure to start your server with: pnpm run dev:backend');
    } else {
      // Something else happened
      console.error('Error message:', error.message);
    }
    
    // Additional debugging info
    console.error('\n🔍 Debugging info:');
    console.error('- Make sure your server is running on port 3001');
    console.error('- Check if ARCA router is properly connected');
    console.error('- Verify your certificates are in the correct path');
  }
}

// Helper function to test just authentication (direct import)
async function testARCAAuthDirect() {
  console.log('🔐 Testing ARCA Authentication directly...');
  
  try {
    // Since you're in root, the import path is different
    const { ARCAAuthService } = await import('./src/API/ARCA/ARCAAuthService');
    
    const config = {
      environment: 'testing' as const,
      cuit: process.env.ARCA_CUIT || '20440225978',
      certificatePath: process.env.ARCA_CERTIFICATE_PATH || './src/API/ARCA/CertificadoBarbershopAutorizado.pem',
      privateKeyPath: process.env.ARCA_PRIVATE_KEY_PATH || './src/API/ARCA/ARCAKey.key'
    };
    
    console.log('Config:', config);
    
    const authService = new ARCAAuthService(config);
    const tokens = await authService.getAuthTokens();
    
    console.log('✅ Direct authentication successful!');
    console.log('Token (first 50 chars):', tokens.token.substring(0, 50) + '...');
    console.log('Sign (first 50 chars):', tokens.sign.substring(0, 50) + '...');
    console.log('Expires at:', tokens.expirationTime);
    
  } catch (error) {
    console.error('❌ Direct authentication failed:', error);
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  console.log('🧪 ARCA Test Suite');
  console.log('==================');
  
  if (args.includes('--auth-only')) {
    await testARCAAuthDirect();
  } else if (args.includes('--help')) {
    console.log('Usage:');
    console.log('  npx ts-node test-ARCA.ts           # Run full test suite');
    console.log('  npx ts-node test-ARCA.ts --auth-only  # Test authentication only');
    console.log('  npx ts-node test-ARCA.ts --help       # Show this help');
  } else {
    await testARCA();
  }
}

// Run the tests
main().catch(console.error);
