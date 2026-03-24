/**
 * One-time script to get YouTube OAuth refresh token
 *
 * Usage:
 * 1. Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET env vars
 * 2. Run: node scripts/get-youtube-token.js
 * 3. Open the URL in browser and authorize
 * 4. Copy the refresh token to your environment
 */

const http = require('http');
const url = require('url');

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/api/youtube/callback';
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube.force-ssl'
].join(' ');

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Missing environment variables!');
  console.error('Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET first.');
  console.error('\nExample:');
  console.error('  export YOUTUBE_CLIENT_ID="your-client-id"');
  console.error('  export YOUTUBE_CLIENT_SECRET="your-client-secret"');
  process.exit(1);
}

// Generate OAuth URL
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${CLIENT_ID}&` +
  `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
  `response_type=code&` +
  `scope=${encodeURIComponent(SCOPES)}&` +
  `access_type=offline&` +
  `prompt=consent`;

console.log('\n🎬 YouTube OAuth Setup for Auteur\n');
console.log('1. Open this URL in your browser:\n');
console.log(authUrl);
console.log('\n2. Sign in with the Google account that owns your Auteur YouTube channel');
console.log('3. Authorize the app');
console.log('4. You\'ll be redirected - copy the "code" from the URL\n');

// Start local server to catch the callback
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === '/api/youtube/callback') {
    const code = parsedUrl.query.code;

    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('<h1>Error: No code received</h1>');
      return;
    }

    // Exchange code for tokens
    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI
        })
      });

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(`<h1>Error: ${tokens.error}</h1><p>${tokens.error_description}</p>`);
        console.error('❌ Token error:', tokens);
        return;
      }

      const refreshToken = tokens.refresh_token;

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <head><title>Success!</title></head>
          <body style="font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px;">
            <h1>✅ Success!</h1>
            <p>Your refresh token has been generated. Copy this to your environment variables:</p>
            <pre style="background: #f0f0f0; padding: 15px; border-radius: 8px; overflow-x: auto; word-break: break-all;">YOUTUBE_REFRESH_TOKEN=${refreshToken}</pre>
            <p>Add this to your Railway environment variables or .env.local file.</p>
            <p>You can close this window now.</p>
          </body>
        </html>
      `);

      console.log('\n✅ SUCCESS! Here\'s your refresh token:\n');
      console.log(`YOUTUBE_REFRESH_TOKEN=${refreshToken}`);
      console.log('\nAdd this to Railway environment variables.');
      console.log('\nYou can now close this script (Ctrl+C).\n');

    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`<h1>Error exchanging code</h1><pre>${error.message}</pre>`);
      console.error('❌ Error:', error);
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3000, () => {
  console.log('📡 Local server listening on http://localhost:3000');
  console.log('   Waiting for OAuth callback...\n');
});
