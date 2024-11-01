const express = require('express');
const line = require('@line/bot-sdk');
const Redis = require('ioredis');
const cors = require('cors'); // CORS対応

const app = express();

// CORS設定
app.use(cors({
  origin: 'https://tkuchida-h.github.io',
  optionsSuccessStatus: 200
}));


// LINE設定
const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// ここで `client` を定義
const client = new line.Client(config);

// Redis設定
const redis = new Redis(process.env.REDIS_URL);



// **Webhookエンドポイントをボディパーサーの前に配置**
app.post('/webhook', line.middleware(config), async (req, res) => {
 try {
    const events = req.body.events;

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userId = event.source.userId;

        // プロフィール情報の取得
        let displayName = '';
        try {
          const profile = await client.getProfile(userId);
          displayName = profile.displayName;

          // プロフィール情報をRedisに保存
          await redis.hset(`user:${userId}`, 'displayName', displayName);
        } catch (error) {
          console.error(`ユーザーID ${userId} のプロフィール取得に失敗しました:`, error);
          displayName = '取得失敗';
        }

// 対応状況を取得
const status = await redis.hget(`user:${userId}`, 'status');


        if (status === '対応中') {
          // 対応中の場合は何もしない
          continue;
        } else {
          await client.replyMessage(event.replyToken, {
            type: 'text',
            text: `お問い合わせありがとうございます、${displayName}さん。担当者が対応いたします。`,
          });

// 対応状況を「対応中」に設定
await redis.hset(`user:${userId}`, 'status', '対応中');

        }
      }
    }

    res.status(200).end();

  } catch (error) {
    console.error('エラーが発生しました:', error);
    res.status(500).end();
  }
});

// JSONボディのパース
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ユーザーの対応状態を更新
app.post('/api/users/:userId/status', async (req, res) => {
  const userId = req.params.userId;
  const { status } = req.body;

  try {
    await redis.hset(`user:${userId}`, 'status', status);
    res.json({ message: '対応状態を更新しました' });
  } catch (error) {
    console.error(`ユーザーID ${userId} の対応状態更新エラー:`, error);
    res.status(500).json({ error: '対応状態の更新に失敗しました' });
  }
});

// ユーザー一覧を取得
app.get('/api/users', async (req, res) => {
  try {
    const keys = await redis.keys('user:*');
    const users = [];

    for (const key of keys) {
      const userId = key.replace('user:', '');
      const status = await redis.hget(key, 'status') || '未対応';
      const displayName = await redis.hget(key, 'displayName') || '不明';

      users.push({ userId, displayName, status });
    }

    res.json(users);
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error);
    res.status(500).json({ error: 'ユーザー一覧の取得に失敗しました' });
  }
});




app.listen(process.env.PORT || 3000);
