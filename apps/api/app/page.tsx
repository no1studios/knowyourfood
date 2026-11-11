export default function HomePage() {
  return (
    <main style={{ maxWidth: 640, margin: '3rem auto', padding: '0 1.25rem', lineHeight: 1.5 }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Know Your Food API</h1>
      <p style={{ color: '#444' }}>
        Next.js App Router API for Vercel. Point Expo{' '}
        <code>EXPO_PUBLIC_AUTH_API_URL</code> at this deployment&apos;s{' '}
        <code>/api</code> base.
      </p>
      <ul>
        <li>
          <a href="/api/health">GET /api/health</a>
        </li>
        <li>POST /api/auth/otp/start</li>
        <li>POST /api/auth/otp/verify</li>
        <li>POST /api/auth/oauth/google | apple</li>
      </ul>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        Default <code>AUTH_MOCK=true</code> — use OTP <strong>123456</strong> until SMS/OAuth
        providers are configured.
      </p>
    </main>
  );
}
