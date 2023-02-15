require('dotenv').config();
const { App } = require('@slack/bolt');

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const app = new App({
    token: SLACK_BOT_TOKEN,
    signingSecret: SLACK_SIGNING_SECRET
});

const botId = 'U04Q4NL8E0Z';

app.event('app_mention', ({ event, say, payload }) => {

    const text = event.text.replace(`<@${botId}>`, '').trim();
    if (text.length) {
        chatGPT(text).then(answer => say(answer));
    } else {
        say(`Que coño quieres <@${event.user}>?!`);
    }
    console.log('p', payload);
});

// Start your app
(async () => {
    await app.start(process.env.PORT || 8080);
    console.log('Bot is running!');
})();

async function chatGPT(msg) {
    const { ChatGPTAPI } = await import('chatgpt');

    const api = new ChatGPTAPI({
        apiKey: OPENAI_API_KEY
    })

    return await api.sendMessage(msg);
}