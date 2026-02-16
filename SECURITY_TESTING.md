# Security Measures Testing Guide

This guide explains how to test the rate limiting and deduplication middleware implemented in the Barbershop application.

## 📋 Table of Contents

- [Security Measures Overview](#security-measures-overview)
- [Testing Methods](#testing-methods)
- [Node.js Automated Tests](#nodejs-automated-tests)
- [Postman Collection](#postman-collection)
- [Manual Testing Guide](#manual-testing-guide)
- [Understanding Results](#understanding-results)
- [Troubleshooting](#troubleshooting)

---

## 🔒 Security Measures Overview

### 1. Rate Limiters

Your application implements three rate limiters:

#### Authentication Limiter (`authLimiter`)

- **Endpoints:** `/login`, user registration (`/`)
- **Limit:** 5 failed attempts per 15 minutes per IP
- **Purpose:** Prevents brute force attacks
- **Note:** Successful requests don't count toward the limit

#### Sensitive Operations Limiter (`sensitiveLimiter`)

- **Endpoints:** Password recovery, security questions
- **Limit:** 3 attempts per 60 minutes per IP
- **Purpose:** Extra protection for critical operations

#### Modification Limiter (`modificationLimiter`)

- **Endpoints:** Create/Update/Delete operations
- **Limit:** 20 requests per 5 minutes per IP
- **Purpose:** Prevents abuse of data modification

### 2. Deduplication Middleware

Prevents duplicate submissions from the same IP.

#### Strict Deduplication (5 seconds)

- **Endpoints:** Registration, Login, Security updates
- **Window:** 5 seconds
- **Purpose:** Prevents accidental double-clicks on critical operations

#### Standard Deduplication (3 seconds)

- **Endpoints:** General updates, reactivation
- **Window:** 3 seconds

---

## 🧪 Testing Methods

### Option 1: Automated Node.js Script (Recommended for CI/CD)

### Option 2: Postman Collection (Best for manual testing)

### Option 3: Manual Testing (Educational)

---

## 🤖 Node.js Automated Tests

### Prerequisites

- Node.js 18+ installed
- Backend server running on http://localhost:3001 (or update `BASE_URL` in script)

### Running the Tests

```bash
# From the project root directory
node test-security.js
```

### What It Tests

1. **Rate Limiter Test**
   - Sends 6 login attempts
   - Verifies first 5 are processed
   - Confirms 6th is rate limited (429 status)

2. **Strict Deduplication Test**
   - Sends registration request
   - Immediately sends duplicate
   - Verifies duplicate is blocked
   - Waits 5.5 seconds and verifies expiration

3. **Combined Security Test**
   - Tests rate limiter + deduplication together
   - Sends rapid-fire identical requests
   - Verifies deduplication blocks before rate limit

4. **Sensitive Operations Test**
   - Sends 4 password recovery attempts
   - Verifies first 3 work, 4th is blocked

5. **Cleanup Test**
   - Verifies old cache entries are removed
   - Ensures no memory leaks

### Expected Output

```
╔════════════════════════════════════════════════════════════╗
║        SECURITY MEASURES TEST SUITE                       ║
║        Testing Rate Limiting & Deduplication              ║
╚════════════════════════════════════════════════════════════╝

ℹ️  Target Server: http://localhost:3001
ℹ️  Make sure your backend server is running!

============================================================
🧪 TEST: Rate Limiter - Login Endpoint (authLimiter)
============================================================
✅ Attempt 1: Processed (401) - Rate limit NOT triggered yet
✅ Attempt 2: Processed (401) - Rate limit NOT triggered yet
✅ Attempt 3: Processed (401) - Rate limit NOT triggered yet
✅ Attempt 4: Processed (401) - Rate limit NOT triggered yet
✅ Attempt 5: Processed (401) - Rate limit NOT triggered yet
✅ Attempt 6: RATE LIMITED (429) - Working as expected!

📊 Summary: 1 of 6 requests were rate limited
✅ Rate limiter is working correctly!
```

### Customizing Tests

Edit `test-security.js`:

- Change `BASE_URL` for different server
- Modify test data in `validTestUser` and `loginData`
- Adjust delays with `sleep()` calls
- Add custom test functions

---

## 📮 Postman Collection

### Importing the Collection

1. Open Postman
2. Click **Import** button (top left)
3. Select the file: `SecurityTests.postman_collection.json`
4. Collection will appear in your sidebar

### Configuring Variables

The collection uses environment variables:

- `base_url`: Default is `http://localhost:3001`
- Other variables are auto-generated per test

To change the base URL:

1. Click on the collection name
2. Go to **Variables** tab
3. Update `base_url` value
4. Click **Save**

### Running Tests

#### Individual Tests

1. Expand a test folder (e.g., "1. Rate Limiter Tests")
2. Click on a request
3. Click **Send**
4. Check the **Test Results** tab at the bottom

#### Running Full Test Suite

1. Click on collection name
2. Click **Run** button
3. Select which tests to run
4. Set delay between requests (recommended: 500-1000ms)
5. Click **Run Barbershop Security Tests**

### Test Categories

#### 1. Rate Limiter Tests

- 6 sequential login attempts
- **Expected:** First 5 work (401/400), 6th is blocked (429)
- **Time:** ~3-5 seconds
- **Reset:** Wait 15 minutes or restart server

#### 2. Deduplication Tests

- Registration + duplicate
- Login + duplicate
- **Expected:** First request works, immediate duplicate blocked (429)
- **Time:** ~2 seconds per pair
- **Reset:** Wait 5 seconds between test pairs

#### 3. Sensitive Operations Tests

- 4 security question attempts
- **Expected:** First 3 work, 4th blocked (429)
- **Time:** ~2-3 seconds
- **Reset:** Wait 60 minutes or restart server

#### 4. Combined Security Test

- Rapid-fire identical requests
- **Expected:** Most duplicates blocked
- **Best tested with:** Postman Runner with 0ms delay

### Reading Test Results

Postman automatically validates responses:

✅ **Green checkmarks:** Test passed
❌ **Red X marks:** Test failed
📊 **Test Results tab:** Detailed assertions

Example test assertions:

```javascript
pm.test("Status is 429 (Rate Limited)", function () {
  pm.response.to.have.status(429);
});

pm.test("Contains deduplication message", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData.message).to.include("duplicada");
});
```

---

## 📝 Manual Testing Guide

If you prefer to test manually without scripts or Postman:

### Testing Rate Limiter (Login)

**Tools needed:** Browser DevTools, curl, or any HTTP client

```bash
# Attempt 1-5 (should work - return 401)
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","contraseña":"wrong1"}'

# Repeat 4 more times with different passwords

# Attempt 6 (should be rate limited - return 429)
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","contraseña":"wrong6"}'
```

**Expected results:**

- Attempts 1-5: Status 401 (Unauthorized - processed but wrong credentials)
- Attempt 6: Status 429 (Too Many Requests - rate limited)
- Response message: "Demasiados intentos de autenticación..."

### Testing Deduplication (Registration)

```bash
# First attempt (should work)
curl -X POST http://localhost:3001/ \
  -H "Content-Type: application/json" \
  -d '{
    "dni":"12345678",
    "nombre":"Test",
    "apellido":"User",
    "telefono":"1234567890",
    "email":"test-dedup@example.com",
    "contraseña":"TestPass123!",
    "preguntaSeguridad":"¿Color favorito?",
    "respuestaSeguridad":"Azul"
  }'

# Immediate duplicate (should be blocked)
# Run this WITHIN 5 SECONDS of the first request
curl -X POST http://localhost:3001/ \
  -H "Content-Type: application/json" \
  -d '{
    "dni":"12345678",
    "nombre":"Test",
    "apellido":"User",
    "telefono":"1234567890",
    "email":"test-dedup@example.com",
    "contraseña":"TestPass123!",
    "preguntaSeguridad":"¿Color favorito?",
    "respuestaSeguridad":"Azul"
  }'
```

**Expected results:**

- First request: Status 201 (Created) or 400 (validation error)
- Duplicate request: Status 429 (Duplicate detected)
- Response includes `retryAfter` field (seconds to wait)

### Testing from Browser

Open DevTools Console (F12) and paste:

```javascript
// Test rate limiting
async function testRateLimit() {
  for (let i = 1; i <= 6; i++) {
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        contraseña: `wrong${i}`,
      }),
    });
    const data = await response.json();
    console.log(`Attempt ${i}: ${response.status}`, data);
    await new Promise((r) => setTimeout(r, 1000)); // 1 second between attempts
  }
}

testRateLimit();
```

---

## 📊 Understanding Results

### HTTP Status Codes

| Code    | Meaning           | Indicates                                       |
| ------- | ----------------- | ----------------------------------------------- |
| 200/201 | Success           | Request processed successfully                  |
| 400     | Bad Request       | Validation error (but not blocked by security)  |
| 401     | Unauthorized      | Wrong credentials (but not blocked by security) |
| 429     | Too Many Requests | **Security measure triggered!**                 |

### Response Messages

#### Rate Limiter Messages

```json
{
  "success": false,
  "message": "Demasiados intentos de autenticación. Por favor, intente nuevamente en 15 minutos."
}
```

#### Deduplication Messages

```json
{
  "success": false,
  "message": "Solicitud duplicada detectada. Por favor, espere antes de intentar nuevamente.",
  "retryAfter": 4
}
```

### Server Logs

Check your backend console for security events:

```
⚠️  [SECURITY] 2026-02-16T10:30:45.123Z | 127.0.0.1 | POST /login | RATE_LIMIT | Rate limit exceeded
⚠️  [SECURITY] 2026-02-16T10:31:10.456Z | 127.0.0.1 | POST / | DUPLICATE_REQUEST | Duplicate request blocked
```

---

## 🔧 Troubleshooting

### Tests are failing or behaving unexpectedly

#### Server not running

**Symptom:** Connection errors, status 0
**Solution:**

```bash
# Start your backend
pnpm dev:backend
# or
npm run dev:backend
```

#### Wrong port

**Symptom:** Connection refused
**Solution:**

- Check your server port in console output
- Update `BASE_URL` in test-security.js or `base_url` in Postman

#### Rate limits not resetting

**Symptom:** Still getting 429 after waiting
**Solution:**

```bash
# Restart server to clear all limits
# Stop server (Ctrl+C) and restart
pnpm dev:backend
```

#### Deduplication not working

**Symptom:** Duplicate requests not blocked
**Solution:**

- Ensure requests are sent within the time window (5 seconds for strict)
- Verify request body is EXACTLY the same
- Check that middleware is applied in router

#### Tests pass but security seems weak

**Symptom:** Can bypass with multiple IPs or browsers
**Solution:**

- Rate limiting is per-IP by design
- In production, consider:
  - Adding user-based limits (not just IP)
  - Using Redis for distributed rate limiting
  - Implementing CAPTCHA after failed attempts
  - Adding device fingerprinting

### Postman-specific Issues

#### Variables not working

**Solution:**

- Ensure you saved the collection after importing
- Check variable scope (Collection vs Environment)
- Pre-request scripts generate some variables automatically

#### Tests running too fast

**Solution:**

- Add delays in Postman Runner settings
- Recommended: 500-1000ms between requests

---

## 🚀 Best Practices

### During Development

1. **Test locally first** before deploying
2. **Use Postman** for quick manual verification
3. **Run automated tests** before commits
4. **Check server logs** to understand behavior

### For Production

1. **Monitor rate limit hits** in production logs
2. **Adjust limits** based on real usage patterns
3. **Set up alerts** for suspicious activity
4. **Consider Redis** for distributed systems
5. **Add CAPTCHA** as fallback protection

### Test Data Management

1. Use unique emails per test (avoid conflicts)
2. Clean up test users periodically
3. Don't use real user data in tests
4. Document any permanent test accounts

---

## 📚 Additional Resources

### Code References

- Rate limiters: `src/BACK/middleware/rateLimiter.ts`
- Deduplication: `src/BACK/middleware/deduplication.ts`
- Security monitor: `src/BACK/middleware/securityMonitor.ts`
- Router implementation: `src/BACK/users/users.router.ts`

### Security Event Monitoring

Your backend logs security events automatically:

- Rate limit violations
- Duplicate request blocks
- Authentication failures
- Validation errors

Check the console output when running your server.

### Extending Tests

Add custom tests by:

1. Copying existing test structure
2. Modifying endpoint, data, or assertions
3. Adding to the Postman collection or test script

---

## ✅ Quick Checklist

Before considering security measures working:

- [ ] Server starts without errors
- [ ] Login rate limiting works (6th attempt blocked)
- [ ] Registration deduplication works (immediate duplicate blocked)
- [ ] Deduplication expires after time window
- [ ] Sensitive operations have stricter limits
- [ ] Server logs show security events
- [ ] Postman tests pass
- [ ] Automated script passes

---

## 🆘 Need Help?

If tests are consistently failing:

1. Check server logs for errors
2. Verify middleware is imported and applied
3. Ensure database is connected
4. Test endpoints work without security (comment out middleware temporarily)
5. Review rate limiter and deduplication configuration

**Common mistakes:**

- Forgetting to restart server after code changes
- Testing with successful requests (rate limiter skips those)
- Not waiting for time windows to expire
- Using different request bodies (deduplication won't trigger)

---

**Last updated:** February 2026  
**Version:** 1.0  
**Test coverage:** Rate Limiting, Deduplication, Combined Security
