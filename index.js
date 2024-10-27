const express = require('express');
const line = require('@line/bot-sdk');
const Redis = require('ioredis');
const cors = require('cors'); // CORS対応

const app = express();

// CORS設定
app.use(cors({
  origin: 'https://TKUchida-H.github.io//line-bot-webhook',
  optionsSuccessStatus: 200
}));

// JSONボディのパース
app.use(express.json());

// Redis設定
const redis = new Redis(process.env.REDIS_URL);

// ユーザー一覧を取得
app.get('/api/users', async (req, res) => {
  try {
    const keys = await redis.keys('*');
    const users = [];

    for (const userId of keys) {
      const status = await redis.get(userId);
      const displayName = await redis.hget(`user:${userId}`, 'displayName') || '不明';

      users.push({ userId, displayName, status });
    }

    res.json(users);
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error);
    res.status(500).json({ error: 'ユーザー一覧の取得に失敗しました' });
  }
});

// ユーザーの対応状態を更新
app.post('/api/users/:userId/status', async (req, res) => {
  const userId = req.params.userId;
  const { status } = req.body;

  try {
    await redis.set(userId, status);
    res.json({ message: '対応状態を更新しました' });
  } catch (error) {
    console.error(`ユーザーID ${userId} の対応状態更新エラー:`, error);
    res.status(500).json({ error: '対応状態の更新に失敗しました' });
  }
});


app.post('/webhook', line.middleware(config), async (req, res) => {
  const client = new line.Client(config);

  try {
    const events = req.body.events;

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userId = event.source.userId;

        // 対応状況を取得
        const status = await redis.get(userId);

        if (status === '対応中') {
          // 対応中の場合は何もしない
          continue;
        } else {
          // 未対応の場合、メッセージを返信
          await client.replyMessage(event.replyToken, {
            type: 'text',
            text: 'お問い合わせありがとうございます。担当者が対応いたします。',
          });

          // 対応状況を「対応中」に設定
          await redis.set(userId, '対応中');
        }
      }
    }

    res.status(200).end();
  } catch (error) {
    console.error('エラーが発生しました:', error);
    res.status(500).end();
  }
});



app.listen(process.env.PORT || 3000);
