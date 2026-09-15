/**
 * Me Plus Authentication & Validation Test Suite
 * Run with: node server/test-auth.js
 */

const BASE = 'http://localhost:5000/api';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

async function runAuthTestSuite() {
  console.log(`\n${colors.bold}${colors.cyan}======================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  ME PLUS AUTHENTICATION & VALIDATION TEST SUITE     ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================${colors.reset}\n`);

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ${colors.green}✔ PASS${colors.reset} - ${name}`);
      passed++;
    } catch (err) {
      console.log(`  ${colors.red}✖ FAIL${colors.reset} - ${name}`);
      console.log(`    ${colors.yellow}Reason:${colors.reset} ${err.message}\n`);
      failed++;
    }
  }

  // --- Test 1: Unregistered User Login Rejection ---
  await test('Reject login for unregistered user email (Expects 401)', async () => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'unknown_freelancer@test.com', password: 'password123' }),
    });
    if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
    const data = await res.json();
    if (!data.error || !data.error.includes('No account is registered')) {
      throw new Error(`Unexpected error message: ${data.error}`);
    }
  });

  // --- Test 2: Incorrect Password Rejection ---
  await test('Reject login with incorrect password for existing account (Expects 401)', async () => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.rivera@gmail.com', password: 'wrongPassword!@#' }),
    });
    if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
    const data = await res.json();
    if (!data.error || !data.error.includes('password you entered is incorrect')) {
      throw new Error(`Unexpected error message: ${data.error}`);
    }
  });

  // --- Test 3: Valid Credentials Login ---
  await test('Allow login with correct credentials (alex.rivera@gmail.com)', async () => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.rivera@gmail.com', password: 'password123' }),
    });
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.user || data.user.email !== 'alex.rivera@gmail.com') {
      throw new Error('User data missing or invalid in response');
    }
  });

  // --- Test 4: Duplicate Email Registration Prevention ---
  await test('Prevent duplicate account registration (Expects 409 Conflict)', async () => {
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Duplicate',
        email: 'alex.rivera@gmail.com',
        password: 'password123',
      }),
    });
    if (res.status !== 409) throw new Error(`Expected HTTP 409, got ${res.status}`);
    const data = await res.json();
    if (!data.error || !data.error.includes('already exists')) {
      throw new Error(`Unexpected error message: ${data.error}`);
    }
  });

  // --- Test 5: Register New User with Custom Profession ---
  const dynamicTestEmail = `freelancer_${Date.now()}@example.com`;
  await test('Register new user with custom profession ("3D Motion & VFX Designer")', async () => {
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jordan Lee',
        email: dynamicTestEmail,
        password: 'securePassword_2026',
        profession: '3D Motion & VFX Designer',
      }),
    });
    if (res.status !== 201) throw new Error(`Expected HTTP 201, got ${res.status}`);
    const data = await res.json();
    if (!data.success || data.user.title !== '3D Motion & VFX Designer') {
      throw new Error(`Custom profession was not saved correctly: ${data.user?.title}`);
    }
  });

  // --- Test 6: Forgot Password for Non-existent Email ---
  await test('Reject forgot password for unregistered email (Expects 404)', async () => {
    const res = await fetch(`${BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ghost_user@nonexistent.domain' }),
    });
    if (res.status !== 404) throw new Error(`Expected HTTP 404, got ${res.status}`);
    const data = await res.json();
    if (!data.error || !data.error.includes('No registered account')) {
      throw new Error(`Unexpected error message: ${data.error}`);
    }
  });

  // --- Test 7: Forgot Password OTP Generation for Registered Account ---
  let generatedOtp = '';
  await test('Generate 6-digit OTP in Step 1 of Forgot Password (Expects 200 & OTP code)', async () => {
    const res = await fetch(`${BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: dynamicTestEmail }),
    });
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.otpPreview || data.otpPreview.length !== 6) {
      throw new Error(`Invalid OTP generation response: ${JSON.stringify(data)}`);
    }
    generatedOtp = data.otpPreview;
  });

  // --- Test 8: Rate-limit immediate OTP resend request within cooldown window (Expects 429) ---
  await test('Rate-limit immediate OTP resend request within cooldown window (Expects 429)', async () => {
    const res = await fetch(`${BASE}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: dynamicTestEmail }),
    });
    if (res.status !== 429) throw new Error(`Expected HTTP 429, got ${res.status}`);
    const data = await res.json();
    if (!data.error || !data.error.includes('Please wait')) {
      throw new Error(`Unexpected error message: ${data.error}`);
    }
  });

  // --- Test 9: Block Password Reset without OTP Verification ---
  await test('Reject password reset without verified OTP (Expects 403 Forbidden)', async () => {
    const res = await fetch(`${BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: dynamicTestEmail,
        newPassword: 'BrandNewUpdatedPassword2026!',
      }),
    });
    if (res.status !== 403) throw new Error(`Expected HTTP 403, got ${res.status}`);
    const data = await res.json();
    if (!data.error || !data.error.includes('OTP verification required')) {
      throw new Error(`Unexpected error message: ${data.error}`);
    }
  });

  // --- Test 9: Reject Invalid OTP Code ---
  await test('Reject invalid OTP verification code (Expects 400 Bad Request)', async () => {
    const wrongOtp = generatedOtp === '111111' ? '222222' : '111111';
    const res = await fetch(`${BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: dynamicTestEmail, otp: wrongOtp }),
    });
    if (res.status !== 400) throw new Error(`Expected HTTP 400, got ${res.status}`);
    const data = await res.json();
    if (!data.error || !data.error.includes('Invalid verification code')) {
      throw new Error(`Unexpected error message: ${data.error}`);
    }
  });

  // --- Test 10: Verify Valid OTP Code ---
  let receivedResetToken = '';
  await test('Successfully verify valid 6-digit OTP code (Expects 200 & resetToken)', async () => {
    const res = await fetch(`${BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: dynamicTestEmail, otp: generatedOtp }),
    });
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.resetToken) {
      throw new Error(`Expected resetToken in response, got: ${JSON.stringify(data)}`);
    }
    receivedResetToken = data.resetToken;
  });

  // --- Test 11: Reset Password with Verified OTP & Token ---
  await test('Reset password to new value after OTP verification (Expects 200)', async () => {
    const res = await fetch(`${BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: dynamicTestEmail,
        newPassword: 'BrandNewUpdatedPassword2026!',
        otp: generatedOtp,
        resetToken: receivedResetToken,
      }),
    });
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('Password reset failed');
  });

  // --- Test 12: Login with Newly Reset Password ---
  await test('Immediate login with newly reset password (Expects 200)', async () => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: dynamicTestEmail,
        password: 'BrandNewUpdatedPassword2026!',
      }),
    });
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const data = await res.json();
    if (!data.success || data.user.email !== dynamicTestEmail) {
      throw new Error('Login with new password failed');
    }
  });

  // --- Test 13: Old Password No Longer Works ---
  await test('Verify old password is invalidated after reset (Expects 401)', async () => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: dynamicTestEmail,
        password: 'securePassword_2026', // Old password
      }),
    });
    if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
  });

  // --- Test 11: Demo Account Data Access ---
  await test('Verify Demo Account has pre-populated clients and projects', async () => {
    const resClients = await fetch(`${BASE}/clients?userId=usr-1`);
    const clients = await resClients.json();
    if (!Array.isArray(clients) || clients.length === 0) {
      throw new Error('Demo account should have pre-populated clients');
    }
  });

  // --- Test 12: New User Data Isolation (Clean Workspace) ---
  await test('Verify newly registered user starts with 0 clients (Clean Slate)', async () => {
    const newUserId = `usr-isolated-${Date.now()}`;
    const resClients = await fetch(`${BASE}/clients?userId=${newUserId}`);
    const clients = await resClients.json();
    if (!Array.isArray(clients) || clients.length !== 0) {
      throw new Error(`New user should start with 0 clients, got ${clients.length}`);
    }
  });

  // --- Test 13: Adding data to New User does not pollute other accounts ---
  await test('Verify newly created client is isolated to specific userId', async () => {
    const newUserId = `usr-isolated-${Date.now()}`;
    const newClientRes = await fetch(`${BASE}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: newUserId,
        name: 'Private Client Inc',
        company: 'Private Client Inc',
        email: 'private@client.com',
        color: '#128C7E',
        status: 'active',
        hourlyRate: 85,
        currency: '$',
      }),
    });
    if (newClientRes.status !== 201) throw new Error('Failed to create isolated client');

    const resUserClients = await fetch(`${BASE}/clients?userId=${newUserId}`);
    const userClients = await resUserClients.json();
    if (userClients.length !== 1 || userClients[0].name !== 'Private Client Inc') {
      throw new Error('User should have exactly 1 private client');
    }
  });

  // --- Test 14: Client Persists After Logout & Re-Login ---
  await test('Verify created client persists across logout & re-login cycles', async () => {
    const testEmail = `persistent_${Date.now()}@example.com`;
    const testPassword = 'PersistPassword2026!';
    
    // 1. Register user
    const regRes = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Persistent User',
        email: testEmail,
        password: testPassword,
        profession: 'UI/UX Freelancer',
      }),
    });
    if (regRes.status !== 201) throw new Error('Failed to register persistent test user');
    const regData = await regRes.json();
    const userId = regData.user.id;

    // 2. Add client for this user
    const clientRes = await fetch(`${BASE}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        name: 'Acme Global Corp',
        company: 'Acme Global',
        email: 'billing@acmeglobal.com',
        color: '#128C7E',
        status: 'active',
        hourlyRate: 95,
        currency: '$',
      }),
    });
    if (clientRes.status !== 201) throw new Error('Failed to create client for persistent user');

    // 3. Simulate re-login
    const loginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    if (loginRes.status !== 200) throw new Error('Re-login failed');
    const loginData = await loginRes.json();

    // 4. Fetch clients with the re-logged-in user's ID
    const fetchClientsRes = await fetch(`${BASE}/clients?userId=${loginData.user.id}`);
    const persistentClients = await fetchClientsRes.json();

    if (!Array.isArray(persistentClients) || persistentClients.length === 0) {
      throw new Error('Client disappeared after re-login!');
    }
    if (persistentClients[0].name !== 'Acme Global Corp') {
      throw new Error(`Expected client "Acme Global Corp", got "${persistentClients[0]?.name}"`);
    }
  });

  // --- Test 15: Invoices, Tasks, Projects Clean Slate for Real Users ---
  await test('Verify newly registered user starts with 0 invoices, 0 tasks, 0 projects (Clean Slate)', async () => {
    const freshUserId = `usr-fresh-${Date.now()}`;
    const [invRes, taskRes, projRes, timeRes] = await Promise.all([
      fetch(`${BASE}/invoices?userId=${freshUserId}`),
      fetch(`${BASE}/tasks?userId=${freshUserId}`),
      fetch(`${BASE}/projects?userId=${freshUserId}`),
      fetch(`${BASE}/time-entries?userId=${freshUserId}`),
    ]);

    const invoices = await invRes.json();
    const tasks = await taskRes.json();
    const projects = await projRes.json();
    const timeEntries = await timeRes.json();

    if (invoices.length !== 0) throw new Error(`Expected 0 invoices, got ${invoices.length}`);
    if (tasks.length !== 0) throw new Error(`Expected 0 tasks, got ${tasks.length}`);
    if (projects.length !== 0) throw new Error(`Expected 0 projects, got ${projects.length}`);
    if (timeEntries.length !== 0) throw new Error(`Expected 0 time entries, got ${timeEntries.length}`);
  });

  // --- Test 16: Demo Invoices & Seed Data Blocked from Real User Accounts ---
  await test('Verify demo seed invoices cannot leak into real user workspace', async () => {
    const realUserId = `usr-real-${Date.now()}`;
    const postDemoInv = await fetch(`${BASE}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: realUserId,
        id: 'inv-101',
        invoiceNumber: 'INV-2026-001',
        clientName: 'Sarah Jenkins',
        clientCompany: 'Nova Brand Studio',
        total: 3200,
      }),
    });

    const getInv = await fetch(`${BASE}/invoices?userId=${realUserId}`);
    const realUserInvoices = await getInv.json();
    if (realUserInvoices.length !== 0) {
      throw new Error(`Demo seed invoice was incorrectly returned for real user! Found: ${realUserInvoices.length}`);
    }
  });

  // --- Test 17: User Avatar & Profile Updates Persist Across Logout & Re-Login ---
  await test('Verify custom profile avatar & bio persist across logout & login', async () => {
    const avatarTestEmail = `avatar_${Date.now()}@example.com`;
    const avatarPassword = 'AvatarPassword2026!';
    const customAvatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWP+/HgAEtAH5s+OuvwAAAABJRU5ErkJggg==';

    // 1. Register new user
    const regRes = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Avatar Test User',
        email: avatarTestEmail,
        password: avatarPassword,
        profession: 'Motion Designer',
      }),
    });
    if (regRes.status !== 201) throw new Error('Registration failed');
    const regData = await regRes.json();
    const userId = regData.user.id;

    // 2. Update profile with custom uploaded avatar and bio
    const updateRes = await fetch(`${BASE}/auth/profile?userId=${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: userId,
        email: avatarTestEmail,
        avatar: customAvatar,
        bio: 'Updated custom bio for freelancer.',
      }),
    });
    if (updateRes.status !== 200) throw new Error('Profile update failed');

    // 3. Simulate Logout and Login
    const loginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: avatarTestEmail,
        password: avatarPassword,
      }),
    });
    if (loginRes.status !== 200) throw new Error('Login failed');
    const loginData = await loginRes.json();

    if (loginData.user.avatar !== customAvatar) {
      throw new Error('Avatar was not persisted after login!');
    }
    if (loginData.user.bio !== 'Updated custom bio for freelancer.') {
      throw new Error('Bio was not persisted after login!');
    }
  });

  console.log(`\n${colors.bold}------------------------------------------------------${colors.reset}`);
  console.log(`  ${colors.bold}SUMMARY:${colors.reset} Total: ${passed + failed} | Passed: ${colors.green}${passed}${colors.reset} | Failed: ${colors.red}${failed}${colors.reset}`);
  console.log(`${colors.bold}------------------------------------------------------${colors.reset}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthTestSuite().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

