# Security Features

This application implements comprehensive security measures to protect user data and prevent common web vulnerabilities.

## Implemented Security Features

### 1. Security Headers (middleware.ts)
- **HSTS (HTTP Strict Transport Security)**: Forces HTTPS connections for 1 year
- **X-Frame-Options**: Prevents clickjacking attacks by blocking iframe embedding
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-XSS-Protection**: Enables browser XSS filtering
- **Referrer-Policy**: Prevents URL leakage to external sites
- **Permissions-Policy**: Disables unnecessary browser features (camera, microphone, geolocation)
- **Content-Security-Policy (CSP)**: Prevents XSS and injection attacks

### 2. HTTPS Enforcement
- Automatic redirect from HTTP to HTTPS in production
- All traffic encrypted in transit

### 3. Input Validation & Sanitization (lib/sanitize.ts)
- File type validation (PDF only)
- File size limits (10MB max)
- Filename sanitization (prevents directory traversal)
- HTML/script injection prevention
- Transaction data sanitization
- Amount validation and range limiting

### 4. Rate Limiting
- **Server-side**: 5 uploads per minute per IP (lib/rate-limit.ts)
- **Client-side**: 5 upload attempts per minute (lib/sanitize.ts)
- **API**: 10 API calls per minute per IP

### 5. CSRF Protection (lib/csrf.ts)
- Origin header validation
- Same-origin policy enforcement
- Protection against cross-site request forgery

### 6. Data Encryption (lib/encryption.ts)
- Client-side AES-GCM encryption for localStorage
- Sensitive data encrypted at rest
- Browser-specific encryption keys

### 7. API Security
- Input validation on all endpoints
- Error message sanitization (no stack traces exposed)
- File upload validation
- Request origin validation

## Security Best Practices

### For Users:
1. **Use HTTPS**: Always access the site via https://
2. **Clear Data**: Use "Finish Session" when done to clear sensitive data
3. **Secure Connection**: Only upload files on trusted networks
4. **Browser Security**: Keep your browser updated

### For Developers:
1. **Environment Variables**: Never commit API keys to version control
2. **Dependencies**: Regularly update npm packages for security patches
3. **Audits**: Run `npm audit` regularly
4. **Testing**: Test security features in production-like environments

## Security Headers Explained

### Content Security Policy (CSP)
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https:;
font-src 'self' data:;
connect-src 'self' https://api2.bankstatementconverter.com;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

This policy:
- Only allows resources from the same origin by default
- Permits inline scripts/styles (required by Next.js/Tailwind)
- Allows API calls only to bankstatementconverter.com
- Prevents framing by other sites
- Restricts form submissions to same origin

## Data Protection

### What's Encrypted:
- Transaction data in localStorage
- Merchant categorization rules
- User preferences

### What's NOT Stored on Server:
- Bank statements (processed in memory only)
- Transaction details
- Personal financial data

All processing happens client-side or in serverless functions that don't persist data.

## Vulnerability Reporting

If you discover a security vulnerability, please email: [your-email@example.com]

**Please do NOT:**
- Open a public GitHub issue
- Share the vulnerability publicly before it's fixed

**Please DO:**
- Provide detailed steps to reproduce
- Include your environment (browser, OS, etc.)
- Allow reasonable time for a fix before public disclosure

## Security Checklist for Production

- [ ] HTTPS certificate configured and valid
- [ ] Environment variables set correctly
- [ ] Rate limiting enabled
- [ ] Security headers verified (use securityheaders.com)
- [ ] CSP tested and working
- [ ] Error messages don't expose sensitive info
- [ ] npm audit shows no high/critical vulnerabilities
- [ ] File upload limits tested
- [ ] CSRF protection verified

## Compliance Notes

This application:
- Does NOT store financial data long-term
- Processes data client-side when possible
- Uses encryption for local storage
- Implements industry-standard security headers
- Follows OWASP security guidelines

For financial compliance (PCI-DSS, etc.), consult with your legal/compliance team about your specific use case.

## Security Updates

Last security review: December 2024
Next scheduled review: March 2025

## Third-Party Services

**bankstatementconverter.com API**:
- Used for PDF to JSON conversion
- Data transmitted over HTTPS
- Review their privacy policy: [Link to their privacy policy]

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [MDN Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security)
