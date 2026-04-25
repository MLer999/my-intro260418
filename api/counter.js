// api/counter.js
const { createClient } = require('redis');

module.exports = async function handler(request, response) {
  // REDIS_URL を取得 (VercelのRedis integration で自動設定されます)
  const url = process.env.REDIS_URL;

  // まだ接続されていない場合は仮の数字(99)を返します
  if (!url) {
    return response.status(200).json({ 
      count: 99, 
      warning: 'Redis Database is not connected. Returning dummy count.' 
    });
  }

  try {
    // Redisクライアントを作成して接続
    const client = createClient({ url });
    await client.connect();
    
    // 'visitor_count' の値を1増やして新しい数字を取得
    const newCount = await client.incr('visitor_count');
    
    // 接続を閉じる
    await client.disconnect();
    
    // 成功したら新しいカウント数をブラウザに返します
    return response.status(200).json({ count: newCount });
  } catch (error) {
    console.error('Redis connection error:', error);
    return response.status(500).json({ error: 'Failed to increment counter' });
  }
}
