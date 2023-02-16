require('dotenv').config();
const {App} = require('@slack/bolt');

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const app = new App({
    token: SLACK_BOT_TOKEN,
    signingSecret: SLACK_SIGNING_SECRET
});

const botId = 'U04Q4NL8E0Z';
const conversations = new Map();
const membersPerChannel = new Map();
let api;

app.event('app_mention', ({event, say}) => {
    const text = event.text.replace(`<@${botId}>`, '').trim();

    if (text.length) {
        chatGPT(text, event.channel).then(answer => {
            say(answer)
        });
    } else {
        say(`Que coño quieres <@${event.user}>?!`);
    }

    // console.log('p', payload);
});

// Start your app
(async () => {
    await app.start(process.env.PORT || 3000);
    console.log('Bot is running!');
})();

async function chatGPT(msg, channel) {
    let members = membersPerChannel.get(channel);
    if (!members) {
        members = (await app.client.conversations.members({channel})).members.map(m => `<@${m}>`).join(', ');
    }

    if (!api) {
        const {ChatGPTAPI} = await import('chatgpt');

        api = new ChatGPTAPI({
            apiKey: OPENAI_API_KEY,
            // debug: true
        });
    }

    let conversationParams = conversations.get(channel);
    if (conversationParams) {
        const diff = (new Date()).getTime() - conversationParams.timestamp;
        if (diff > 10 * 60 * 1000) {
            conversationParams = null;
        }
    }

    const response = await api.sendMessage(msg, {
        ...conversationParams,
        promptPrefix: `Los usuarios de este canal son: ${members}`
    });
    conversations.set(channel, {
        conversationId: response.conversationId,
        parentMessageId: response.id,
        timestamp: (new Date()).getTime()
    })
    return response;
}