const { createClient } = require('redis');

module.exports = async function handler(req, res) {
  // REDIS_URL を取得
  const url = process.env.REDIS_URL;

  if (!url) {
    return res.status(500).json({ error: 'Redis Database is not connected.' });
  }

  const client = createClient({ url });

  try {
    await client.connect();

    // GETリクエスト（掲示板の読み込み）
    if (req.method === 'GET') {
      // 'kiriban_bbs' というリストから0番目〜最後（-1）まで取得
      const postsRaw = await client.lRange('kiriban_bbs', 0, -1);
      // 文字列をJSONオブジェクトに戻す
      const posts = postsRaw.map(p => JSON.parse(p));
      
      await client.disconnect();
      return res.status(200).json({ posts });
    } 
    // POSTリクエスト（掲示板への書き込み）
    else if (req.method === 'POST') {
      const { kiriban, name, comment } = req.body;
      
      if (!kiriban || !name || !comment) {
        await client.disconnect();
        return res.status(400).json({ error: '入力内容が不足しています' });
      }

      // 悪意のあるタグなどを無効化（サニタイズ）
      const sanitize = (str) => String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;');

      // 投稿データを作成
      const newPost = {
        id: Date.now(),
        kiriban: sanitize(kiriban),
        name: sanitize(name),
        comment: sanitize(comment).replace(/\n/g, '<br>'), // 改行を反映
        date: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
      };

      // リストの先頭（左側）に追加
      await client.lPush('kiriban_bbs', JSON.stringify(newPost));
      // 容量制限のため、最新50件だけを残す
      await client.lTrim('kiriban_bbs', 0, 49);
      
      await client.disconnect();
      return res.status(200).json({ success: true, post: newPost });
    } 
    // それ以外のリクエスト
    else {
      await client.disconnect();
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('BBS connection error:', error);
    try { await client.disconnect(); } catch(e) {}
    return res.status(500).json({ error: '掲示板の処理に失敗しました' });
  }
};
