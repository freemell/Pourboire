import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    const appSecret = process.env.PRIVY_APP_SECRET;

    return NextResponse.json({
      success: true,
      message: 'Privy configuration check',
      config: {
        appId: appId ? '✅ Set' : '❌ Missing',
        appSecret: appSecret ? '✅ Set' : '❌ Missing',
        hasAppId: !!appId,
        hasSecret: !!appSecret
      },
      instructions: {
        twitterLogin: 'Make sure Twitter login is enabled in your Privy app dashboard at https://dashboard.privy.io',
        steps: [
          '1. Go to https://dashboard.privy.io',
          '2. Select your app',
          '3. Go to Authentication > Login Methods',
          '4. Enable Twitter login',
          '5. Save the configuration'
        ]
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Privy configuration check failed',
      details: error
    }, { status: 500 });
  }
}
