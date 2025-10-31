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
    
    const tweetOptions: any = { text };
    if (replyToTweetId) {
      tweetOptions.reply = {
        in_reply_to_tweet_id: replyToTweetId
      };
    }
    
    const tweet = await client.v2.tweet(tweetOptions);
    return tweet.data.id;
  } catch (error) {
    console.error('Error posting tweet:', error);
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
      }
    }
    
    return tweets;
  } catch (error) {
    console.error('Error searching mentions:', error);
    return [];
  }
}


