import { NextResponse } from 'next/server';

export async function GET() {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;

  return NextResponse.json({
    success: true,
    message: 'Privy Configuration Debug',
    config: {
      appId: appId ? `✅ Set: ${appId}` : '❌ Missing',
      appSecret: appSecret ? '✅ Set (hidden)' : '❌ Missing',
      hasAppId: !!appId,
      hasSecret: !!appSecret
    },
    troubleshooting: {
      issue: 'Twitter login not allowed (403 Forbidden)',
      cause: 'Twitter OAuth is not enabled in your Privy app dashboard',
      solution: [
        '1. Go to https://dashboard.privy.io',
        '2. Select your app (ID: cmhbmt0e700xrkz0cu7vqb8d1)',
        '3. Navigate to "Authentication" → "Login Methods"',
        '4. Enable "Twitter" login method',
        '5. Configure Twitter OAuth settings',
        '6. Save the configuration',
        '7. Wait 2-3 minutes for changes to propagate'
      ],
      alternative: 'If Twitter is not available, you can use email login for testing'
    },
    testUrl: 'https://dashboard.privy.io/apps/cmhbmt0e700xrkz0cu7vqb8d1/authentication'
  });
}
