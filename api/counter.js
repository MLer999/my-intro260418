// api/counter.js
// このスクリプトはVercelのServerless Functionsとして動作し、
// データベース（Vercel KV）と通信して訪問者数を管理します。

export default async function handler(request, response) {
  // Vercel KV または Upstash Redis に接続するための環境変数
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  // もしVercelダッシュボードでKV（データベース）が紐付けられていない場合は、
  // エラーにならずに仮の数字(99)を返して、すぐにキリ番テストができるようにします。
  if (!url || !token) {
    return response.status(200).json({ 
      count: 99, 
      warning: 'KV Database is not connected. Returning dummy count.' 
    });
  }

  try {
    // Vercel KV (Redis) の REST API を使って 'visitor_count' を1増やします (INCRコマンド)
    const res = await fetch(`${url}/incr/visitor_count`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    // データベースから返ってきた新しいカウント数を取得
    const data = await res.json();
    
    // フロントエンド（ブラウザ）にカウント数を返します
    return response.status(200).json({ count: data.result });
  } catch (error) {
    // データベース接続等に失敗した場合はエラーを返します
    return response.status(500).json({ error: 'Failed to increment counter' });
  }
}
