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

  const events = req.body.events;

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      //const userId = event.source.userId;

      // 対応状況をチェック
      //const isResponded = await redis.get(userId);

      //if (!isResponded) {
        // 特定のメッセージを返信
        await client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'お問い合わせありがとうございます。担当者よりご連絡いたします。',
        });

        // 対応済みとして記録（有効期限を設定することも可能）
        //await redis.set(userId, true);
      //}
      // 対応済みの場合は何もしない
    }
  }

  res.status(200).end();
});

app.listen(process.env.PORT || 3000);
