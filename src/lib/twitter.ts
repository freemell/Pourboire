import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const bearerClient = client.readOnly;

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

export async function postTweet(text: string): Promise<string | null> {
  try {
    const tweet = await client.v2.tweet(text);
    return tweet.data.id;
  } catch (error) {
    console.error('Error posting tweet:', error);
    return null;
  }
}

export async function searchMentions(query: string, sinceId?: string): Promise<any[]> {
  try {
    const tweets = await bearerClient.v2.search(query, {
      'tweet.fields': ['id', 'text', 'author_id', 'created_at', 'public_metrics'],
      'user.fields': ['id', 'username', 'name'],
      'max_results': 100,
      'since_id': sinceId
    });
    
    return tweets.data?.data || [];
  } catch (error) {
    console.error('Error searching mentions:', error);
    return [];
  }
}


