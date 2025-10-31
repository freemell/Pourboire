import { TwitterApi } from 'twitter-api-v2';

let client: TwitterApi | null = null;
let bearerClient: any = null;

function getTwitterClient() {
  if (!client) {
    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
      throw new Error('Twitter API credentials not configured');
    }
    
    client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });
    
    bearerClient = client.readOnly;
  }
  
  return { client, bearerClient };
}

export interface TwitterUser {
  id: string;
  username: string;
  name: string;
  profile_image_url: string;
  description: string;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
  };
}

export async function getUserByHandle(handle: string): Promise<TwitterUser | null> {
  try {
    const { bearerClient } = getTwitterClient();
    
    // Remove @ symbol if present
    const cleanHandle = handle.replace('@', '');
    
    const user = await bearerClient.v2.userByUsername(cleanHandle, {
      'user.fields': ['id', 'username', 'name', 'profile_image_url', 'description', 'public_metrics']
    });
    
    if (user.data) {
      return user.data as TwitterUser;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user by handle:', error);
    return null;
  }
}

export async function getUserProfile(userId: string): Promise<TwitterUser | null> {
  try {
    const { bearerClient } = getTwitterClient();
    
    const user = await bearerClient.v2.user(userId, {
      'user.fields': ['id', 'username', 'name', 'profile_image_url', 'description', 'public_metrics']
    });
    
    if (user.data) {
      return user.data as TwitterUser;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function postTweet(text: string, replyToTweetId?: string): Promise<string | null> {
  try {
    const { client } = getTwitterClient();
    
    if (!client) {
      console.error('Twitter client not initialized');
      return null;
    }
    
    const tweetOptions: any = { 
      text: text.substring(0, 280) // Ensure text is within Twitter's limit
    };
    
    if (replyToTweetId) {
      // Ensure tweet ID is a string (Twitter API v2 requires string IDs)
      const tweetId = String(replyToTweetId).trim();
      if (!tweetId || tweetId === 'undefined' || tweetId === 'null') {
        console.error('Invalid tweet ID for reply:', replyToTweetId);
        return null;
      }
      tweetOptions.reply = {
        in_reply_to_tweet_id: tweetId
      };
    }
    
    console.log('Posting tweet:', { text: tweetOptions.text, replyToTweetId, hasReply: !!replyToTweetId });
    
    const tweet = await client.v2.tweet(tweetOptions);
    
    if (tweet?.data?.id) {
      console.log('Tweet posted successfully:', tweet.data.id);
      return tweet.data.id;
    } else {
      console.error('Tweet posted but no ID returned:', tweet);
      return null;
    }
  } catch (error: any) {
    console.error('Error posting tweet:', {
      message: error?.message,
      code: error?.code,
      data: error?.data,
      stack: error?.stack
    });
    
    // Log full error details for debugging
    if (error?.data) {
      console.error('Twitter API error details:', JSON.stringify(error.data, null, 2));
    }
    
    return null;
  }
}

export async function searchMentions(query: string, sinceId?: string): Promise<any[]> {
  try {
    const { bearerClient } = getTwitterClient();
    const res: any = await bearerClient.v2.search(query, {
      'tweet.fields': ['id', 'text', 'author_id', 'created_at', 'public_metrics'],
      'user.fields': ['id', 'username', 'name'],
      expansions: ['author_id'],
      max_results: 50,
      since_id: sinceId,
    });
    // twitter-api-v2 returns paginator with data and includes; merge author info
    let tweets: any[] = [];
    if (Array.isArray(res?.data)) {
      tweets = res.data;
    } else if (Array.isArray(res?.data?.data)) {
      tweets = res.data.data;
    } else if (Array.isArray(res?.tweets)) {
      tweets = res.tweets;
    }
    
    // Attach author info from includes
    if (tweets.length && res?.includes?.users) {
      const userMap: Record<string, any> = {};
      for (const u of res.includes.users) {
        userMap[u.id] = u;
      }
      for (const t of tweets) {
        if (t.author_id && userMap[t.author_id]) {
          t.author = userMap[t.author_id];
          t.username = userMap[t.author_id].username;
        }
        // Ensure tweet ID is always a string (Twitter API v2 requires string IDs)
        if (t.id) {
          t.id = String(t.id);
        }
      }
    }
    
    // Also normalize IDs for tweets that don't have author info attached
    for (const t of tweets) {
      if (t.id && typeof t.id !== 'string') {
        t.id = String(t.id);
      }
    }
    
    return tweets;
  } catch (error) {
    console.error('Error searching mentions:', error);
    return [];
  }
}


