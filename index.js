const express = require('express');
const line = require('@line/bot-sdk');
const Redis = require('ioredis');

const app = express();

// LINE設定
const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// Redis設定
const redis = new Redis(process.env.REDIS_URL);


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

