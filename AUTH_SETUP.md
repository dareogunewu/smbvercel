# Authentication Setup Guide

This application now requires a passkey for access. Follow these steps to set up authentication.

## Quick Setup (Local Development)

### Step 1: Generate Your Passkey Hash

Run the passkey generation script:

```bash
npx ts-node scripts/generate-passkey.ts
```

When prompted, enter a secure passkey (minimum 8 characters).

**Example:**
```
Enter your desired passkey: MySecurePasskey123!
```

The script will output something like:
```
✅ Passkey hash generated successfully!

Add this to your .env.local file:
────────────────────────────────────────────────────────────
NEXT_PUBLIC_PASSKEY_HASH=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
────────────────────────────────────────────────────────────
```

### Step 2: Add to .env.local

Create or update `.env.local` in your project root:

```bash
# Copy the hash from the script output
NEXT_PUBLIC_PASSKEY_HASH=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### Step 3: Restart Development Server

```bash
npm run dev
```

Now you'll see the login page when you access the site!

## Production Setup (Vercel)

### Step 1: Generate Hash (if not done already)

Use the same script as above to generate your passkey hash.

### Step 2: Add Environment Variable in Vercel

1. Go to your Vercel dashboard
2. Select your project (smbowner)
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name**: `NEXT_PUBLIC_PASSKEY_HASH`
   - **Value**: `<your_generated_hash>`
   - **Environments**: Select Production, Preview, and Development
5. Click **Save**

### Step 3: Redeploy

Vercel will automatically redeploy with the new environment variable.

Or trigger a manual deploy:
```bash
git commit --allow-empty -m "Trigger redeploy with auth"
git push
```

## Security Features

### Session Management
- **Session Duration**: 24 hours
- **Auto-Logout**: Sessions expire after 24 hours of inactivity
- **Stored Locally**: Authentication state stored in browser localStorage
- **Secure Hashing**: SHA-256 hashing for passkey verification

### How It Works

1. **Login**: User enters passkey → Hashed → Compared with stored hash
2. **Session**: Valid login creates 24-hour session token in localStorage
3. **Verification**: Every page load checks if session is still valid
4. **Logout**: Clears session and redirects to login page

### Changing Your Passkey

1. Generate a new hash with a new passkey
2. Update `NEXT_PUBLIC_PASSKEY_HASH` in `.env.local` (local) or Vercel (production)
3. Restart server or redeploy
4. All existing sessions will be invalidated
5. Users must log in again with new passkey

## Security Best Practices

### ✅ DO:
- Use a strong passkey (12+ characters, mix of letters, numbers, symbols)
- Keep your passkey private
- Change passkey periodically
- Set environment variable in Vercel, not in code
- Use different passkeys for development and production

### ❌ DON'T:
- Commit `.env.local` to git (it's in .gitignore)
- Share your passkey hash publicly
- Use simple/common passkeys like "password123"
- Hardcode passkey in source code
- Reuse passkeys across different applications

## Troubleshooting

### Can't Access Site After Setup

**Problem**: Login page shows but passkey doesn't work

**Solutions**:
1. Check that `NEXT_PUBLIC_PASSKEY_HASH` is set correctly
2. Verify hash was generated from correct passkey
3. Clear browser cache and localStorage
4. Restart dev server

### Environment Variable Not Working

**Local Development**:
```bash
# Verify .env.local exists and has the variable
cat .env.local | grep PASSKEY

# Restart dev server
npm run dev
```

**Production (Vercel)**:
1. Check Vercel dashboard → Settings → Environment Variables
2. Ensure variable is enabled for Production environment
3. Trigger a redeploy

### Forgot Passkey

**Solution**: Generate a new passkey hash and update the environment variable.

```bash
# Generate new hash
npx ts-node scripts/generate-passkey.ts

# Update .env.local with new hash
# Restart server
```

### No Login Page Shows

**Problem**: Site loads directly to dashboard without authentication

**Cause**: `NEXT_PUBLIC_PASSKEY_HASH` is not set (failsafe allows access)

**Solution**: Set the environment variable as described above

## Advanced Configuration

### Custom Session Duration

Edit `lib/auth.ts`:

```typescript
// Change from 24 hours to desired duration
const expiryTime = now + (12 * 60 * 60 * 1000); // 12 hours
```

### Multiple Users (Future Enhancement)

Current implementation supports single passkey. For multiple users:
1. Consider implementing a proper authentication system (NextAuth.js, Clerk, etc.)
2. Use a database to store user credentials
3. Implement user roles and permissions

## Testing

### Test Login Flow

1. Clear browser localStorage (DevTools → Application → Local Storage → Clear All)
2. Refresh page → Should see login screen
3. Enter incorrect passkey → Should show error
4. Enter correct passkey → Should access dashboard
5. Close browser and reopen within 24 hours → Should stay logged in
6. Click Logout → Should return to login screen

### Test Session Expiry

In DevTools Console:
```javascript
// Check current session
localStorage.getItem('smbowner_auth_expiry')

// Manually expire session (set to past time)
localStorage.setItem('smbowner_auth_expiry', '1')

// Refresh page → Should redirect to login
```

## Support

For issues or questions:
1. Check this documentation
2. Review `lib/auth.ts` for implementation details
3. Check browser console for errors
4. Open an issue on GitHub

## Security Notice

This is a simple passkey system suitable for personal/small team use. For production applications with multiple users or sensitive data, consider:
- OAuth providers (Google, GitHub, etc.)
- Auth services (Clerk, Auth0, AWS Cognito)
- Multi-factor authentication
- Password reset flows
- Audit logging
