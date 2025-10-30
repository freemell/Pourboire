import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

export async function GET(_req: NextRequest) {
  try {
    const appKey = process.env.TWITTER_API_KEY;
    const appSecret = process.env.TWITTER_API_SECRET;
    const callbackUrl = process.env.PRIVY_TWITTER_CALLBACK_URL || 'https://auth.privy.io/api/v1/oauth/callback';

    if (!appKey || !appSecret) {
      return NextResponse.json(
        { ok: false, error: 'Missing TWITTER_API_KEY or TWITTER_API_SECRET in environment' },
        { status: 400 }
      );
    }

    const client = new TwitterApi({ appKey, appSecret });

    // This requests an OAuth 1.0a request token from Twitter to validate credentials
    const { url, oauth_token, oauth_token_secret } = await client.generateAuthLink(callbackUrl, {
      linkMode: 'authorize',
    });

    return NextResponse.json({
      ok: true,
      message: 'Twitter OAuth 1.0a consumer keys appear valid. Visit the URL to continue auth.',
      authUrl: url,
      oauth_token,
      // Do NOT persist the secret; returned here only for temporary validation purposes
      oauth_token_secret,
      callbackUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Twitter auth test failed' },
      { status: 500 }
    );
  }
}


