const fs = require("fs");
const forge = require("node-forge");

function validateCertificates() {
  console.log("🔍 Validating ARCA certificates and keys...\n");

  const certPath = "./src/API/ARCA/CertificadoBarbershopAutorizado.pem";
  const keyPath = "./src/API/ARCA/ARCAKey.key";

  try {
    // Check if files exist
    console.log("📁 Checking file existence...");
    if (!fs.existsSync(certPath)) {
      console.error(`❌ Certificate file not found: ${certPath}`);
      return false;
    }
    if (!fs.existsSync(keyPath)) {
      console.error(`❌ Private key file not found: ${keyPath}`);
      return false;
    }
    console.log("✅ Both files exist");

    // Read files
    console.log("\n📖 Reading certificate and key files...");
    const certPem = fs.readFileSync(certPath, "utf8");
    const keyPem = fs.readFileSync(keyPath, "utf8");

    // Validate certificate format
    console.log("🔍 Validating certificate format...");
    if (!certPem.includes("-----BEGIN CERTIFICATE-----")) {
      console.error("❌ Certificate file does not contain proper PEM header");
      return false;
    }
    if (!certPem.includes("-----END CERTIFICATE-----")) {
      console.error("❌ Certificate file does not contain proper PEM footer");
      return false;
    }
    console.log("✅ Certificate PEM format is valid");

    // Validate private key format
    console.log("🔍 Validating private key format...");
    if (
      !keyPem.includes("-----BEGIN PRIVATE KEY-----") &&
      !keyPem.includes("-----BEGIN RSA PRIVATE KEY-----")
    ) {
      console.error("❌ Private key file does not contain proper PEM header");
      return false;
    }
    console.log("✅ Private key PEM format is valid");

    // Parse certificate with forge
    console.log("🔍 Parsing certificate with node-forge...");
    const cert = forge.pki.certificateFromPem(certPem);
    console.log("✅ Certificate parsed successfully");
    console.log(
      `   Subject: ${cert.subject.getField("CN")?.value || "Unknown"}`,
    );
    console.log(`   Issuer: ${cert.issuer.getField("CN")?.value || "Unknown"}`);
    console.log(`   Valid from: ${cert.validity.notBefore}`);
    console.log(`   Valid until: ${cert.validity.notAfter}`);

    // Check if certificate is still valid
    const now = new Date();
    if (now < cert.validity.notBefore) {
      console.warn("⚠️  Certificate is not yet valid");
    } else if (now > cert.validity.notAfter) {
      console.error("❌ Certificate has expired");
      return false;
    } else {
      console.log("✅ Certificate is currently valid");
    }

    // Parse private key with forge
    console.log("\n🔍 Parsing private key with node-forge...");
    const privateKey = forge.pki.privateKeyFromPem(keyPem);
    console.log("✅ Private key parsed successfully");
    console.log(`   Key type: RSA`);
    console.log(`   Key size: ${privateKey.n.bitLength()} bits`);

    // Test key-certificate compatibility
    console.log("\n🔍 Testing key-certificate compatibility...");
    const publicKeyFromCert = cert.publicKey;
    const publicKeyFromPrivate = forge.pki.rsa.setPublicKey(
      privateKey.n,
      privateKey.e,
    );

    if (
      publicKeyFromCert.n.equals(publicKeyFromPrivate.n) &&
      publicKeyFromCert.e.equals(publicKeyFromPrivate.e)
    ) {
      console.log("✅ Certificate and private key match perfectly");
    } else {
      console.error("❌ Certificate and private key do not match");
      return false;
    }

    console.log("\n🎉 All certificate validations passed!");
    return true;
  } catch (error) {
    console.error(`❌ Error validating certificates: ${error.message}`);
    return false;
  }
}

// Run validation
validateCertificates();
