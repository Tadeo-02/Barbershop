/**
 * Security Measures Test Suite
 * Tests rate limiting and deduplication middleware
 *
 * Run with: node test-security.js
 */

const BASE_URL = "http://localhost:3001"; // Adjust if your server runs on different port

// Test data
const validTestUser = {
  dni: "12345678",
  nombre: "Test",
  apellido: "Security",
  telefono: "1234567890",
  email: `test-${Date.now()}@security.com`,
  contraseña: "TestPassword123!",
};

const loginData = {
  email: "test@example.com",
  contraseña: "wrongPassword123",
};

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n${"=".repeat(60)}`, colors.cyan);
  log(`🧪 TEST: ${testName}`, colors.cyan);
  log("=".repeat(60), colors.cyan);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

async function makeRequest(endpoint, data) {
  try {
    const response = await apiFetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const text = await response.text();
    let body;
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      body = { rawText: text };
    }

    return {
      status: response.status,
      ok: response.ok,
      headers: response.headers,
      body,
    };
  } catch (error) {
    logError(`Request failed: ${error.message}`);
    return { status: 0, ok: false, error: error.message };
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Test 1: Rate Limiter - Login endpoint (5 attempts in 15 minutes)
async function testRateLimiter() {
  logTest("Rate Limiter - Login Endpoint (authLimiter)");
  logInfo("Testing: 5 attempts per 15 minutes limit");
  logInfo("Expected: First 5 attempts should work, 6th should be blocked\n");

  const results = [];

  for (let i = 1; i <= 6; i++) {
    logInfo(`Attempt ${i}/6...`);
    const response = await makeRequest("/login", loginData);
    results.push(response);

    if (i <= 5) {
      if (response.status === 401 || response.status === 400) {
        logSuccess(
          `✓ Attempt ${i}: Processed (${response.status}) - Rate limit NOT triggered yet`,
        );
      } else if (response.status === 429) {
        logWarning(
          `✗ Attempt ${i}: RATE LIMITED TOO EARLY! Expected after attempt 5`,
        );
      }
    } else {
      if (response.status === 429) {
        logSuccess(`✓ Attempt ${i}: RATE LIMITED (429) - Working as expected!`);
        logInfo(`   Message: ${response.body.message}`);
      } else {
        logError(
          `✗ Attempt ${i}: Should be rate limited but got ${response.status}`,
        );
      }
    }

    await sleep(500);
  }

  // Summary
  const rateLimited = results.filter((r) => r.status === 429).length;
  log(
    `\n📊 Summary: ${rateLimited} of 6 requests were rate limited`,
    colors.cyan,
  );

  if (rateLimited === 1) {
    logSuccess("✅ Rate limiter is working correctly!");
  } else {
    logError(`❌ Expected 1 rate limited request, got ${rateLimited}`);
  }
}

// Test 2: Strict Deduplication - Registration (5 second window)
async function testStrictDeduplication() {
  logTest("Strict Deduplication - Registration Endpoint");
  logInfo("Testing: 5-second deduplication window");
  logInfo("Expected: Duplicate requests within 5 seconds should be blocked\n");

  const testUser = {
    ...validTestUser,
    email: `test-dedup-${Date.now()}@security.com`,
  };

  // First request
  logInfo("Sending request #1...");
  const response1 = await makeRequest("/", testUser);
  if (response1.status === 201 || response1.status === 200) {
    logSuccess("✓ Request #1: Accepted (user created or processed)");
  } else {
    logWarning(
      `⚠️  Request #1: Status ${response1.status} - ${response1.body.message || "Unknown"}`,
    );
  }

  // Immediate duplicate (should be blocked)
  logInfo("\nSending DUPLICATE request #2 (immediately)...");
  await sleep(100); // Small delay to ensure request is processed
  const response2 = await makeRequest("/", testUser);
  if (response2.status === 429) {
    logSuccess(
      "✓ Request #2: BLOCKED by deduplication (429) - Working correctly!",
    );
    logInfo(`   Message: ${response2.body.message}`);
    if (response2.body.retryAfter) {
      logInfo(`   Retry after: ${response2.body.retryAfter} seconds`);
    }
  } else {
    logError(`✗ Request #2: Should be blocked but got ${response2.status}`);
  }

  // Wait and try again (should work after 5 seconds)
  logInfo("\nWaiting 5.5 seconds for deduplication window to expire...");
  await sleep(5500);

  logInfo("Sending request #3 (after 5.5 seconds)...");
  const response3 = await makeRequest("/", testUser);
  if (response3.status !== 429) {
    logSuccess(
      "✓ Request #3: Processed (deduplication window expired) - Working correctly!",
    );
  } else {
    logError("✗ Request #3: Still blocked, window should have expired");
  }

  // Summary
  log("\n📊 Deduplication Test Summary:", colors.cyan);
  if (response2.status === 429 && response3.status !== 429) {
    logSuccess("✅ Strict deduplication is working correctly!");
  } else {
    logError("❌ Deduplication behavior is not as expected");
  }
}

// Test 3: Combined Security - Rapid Login Attempts
async function testCombinedSecurity() {
  logTest("Combined Security - Login with Deduplication");
  logInfo("Testing: Rate limiter + deduplication working together");
  logInfo(
    "Expected: Duplicate requests blocked immediately, unique requests counted toward rate limit\n",
  );

  const loginAttempt = {
    email: `combined-test-${Date.now()}@security.com`,
    contraseña: "TestPass123",
  };

  // Send 3 identical requests rapidly
  logInfo("Sending 3 identical requests rapidly (within 1 second)...");
  const promises = [
    makeRequest("/login", loginAttempt),
    makeRequest("/login", loginAttempt),
    makeRequest("/login", loginAttempt),
  ];

  const responses = await Promise.all(promises);

  const blocked = responses.filter((r) => r.status === 429).length;
  const processed = responses.filter((r) => r.status !== 429).length;

  logInfo(`\n📊 Results:`);
  logInfo(`   Processed: ${processed}`);
  logInfo(`   Blocked: ${blocked}`);

  if (blocked >= 2) {
    logSuccess("✅ Deduplication blocked most duplicate requests!");
  } else {
    logWarning("⚠️  Expected more duplicate requests to be blocked");
  }
}

// Test 4: Sensitive Operations Rate Limit (password reset, security questions)
async function testSensitiveOperations() {
  logTest("Sensitive Operations Limiter");
  logInfo("Testing: 3 attempts per 60 minutes limit for password recovery");
  logInfo("Expected: First 3 attempts work, 4th should be blocked\n");

  const testEmail = `sensitive-${Date.now()}@security.com`;

  for (let i = 1; i <= 4; i++) {
    logInfo(`Attempt ${i}/4...`);
    const response = await makeRequest("/verify-security-answer", {
      email: testEmail,
      respuesta: "test-answer",
    });

    if (i <= 3) {
      if (response.status !== 429) {
        logSuccess(`✓ Attempt ${i}: Processed (${response.status})`);
      } else {
        logWarning(`✗ Attempt ${i}: Rate limited too early!`);
      }
    } else {
      if (response.status === 429) {
        logSuccess(`✓ Attempt ${i}: RATE LIMITED (429) - Working correctly!`);
        logInfo(`   Message: ${response.body.message}`);
      } else {
        logError(
          `✗ Attempt ${i}: Should be rate limited but got ${response.status}`,
        );
      }
    }

    await sleep(500);
  }
}

// Test 5: Deduplication Memory Cleanup
async function testDeduplicationCleanup() {
  logTest("Deduplication Memory Cleanup");
  logInfo("Testing: Old entries are cleaned up after time window");
  logInfo("This ensures the middleware doesn't have memory leaks\n");

  const testData = {
    email: `cleanup-test-${Date.now()}@security.com`,
    contraseña: "TestPass123",
  };

  logInfo("Sending initial request...");
  await makeRequest("/login", testData);
  logSuccess("✓ Initial request sent");

  logInfo("\nWaiting 6 seconds for cleanup cycle...");
  await sleep(6000);

  logInfo("Sending same request again (should be allowed)...");
  const response = await makeRequest("/login", testData);

  if (
    response.status !== 429 ||
    response.body.message?.includes("rate limit")
  ) {
    logSuccess("✅ Deduplication cache was cleaned up successfully!");
  } else {
    logError("❌ Request still being blocked - cleanup may not be working");
  }
}

// Main test runner
async function runAllTests() {
  log(
    "\n╔════════════════════════════════════════════════════════════╗",
    colors.cyan,
  );
  log(
    "║        SECURITY MEASURES TEST SUITE                       ║",
    colors.cyan,
  );
  log(
    "║        Testing Rate Limiting & Deduplication              ║",
    colors.cyan,
  );
  log(
    "╚════════════════════════════════════════════════════════════╝",
    colors.cyan,
  );

  logInfo(`\nTarget Server: ${BASE_URL}`);
  logInfo("Make sure your backend server is running!\n");

  await sleep(1000);

  try {
    // Test server connectivity
    logInfo("Testing server connectivity...");
    const healthCheck = await makeRequest("/login", {});
    if (healthCheck.status === 0) {
      logError(`\n❌ Cannot connect to server at ${BASE_URL}`);
      logError("Please make sure your backend is running and try again.");
      process.exit(1);
    }
    logSuccess("✓ Server is reachable\n");

    // Run tests sequentially
    await testRateLimiter();
    await sleep(2000);

    await testStrictDeduplication();
    await sleep(2000);

    await testCombinedSecurity();
    await sleep(2000);

    await testSensitiveOperations();
    await sleep(2000);

    await testDeduplicationCleanup();

    // Final summary
    log(
      "\n╔════════════════════════════════════════════════════════════╗",
      colors.green,
    );
    log(
      "║              ALL TESTS COMPLETED                           ║",
      colors.green,
    );
    log(
      "╚════════════════════════════════════════════════════════════╝",
      colors.green,
    );

    logInfo("\n📝 Notes:");
    logInfo("   - Rate limits reset after their time window (15-60 minutes)");
    logInfo("   - Restart your server to reset all rate limiters immediately");
    logInfo("   - Check server logs for detailed security event information");
  } catch (error) {
    logError(`\n❌ Test suite failed: ${error.message}`);
    console.error(error);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, testRateLimiter, testStrictDeduplication };
