require('dotenv').config();
const {App} = require('@slack/bolt');

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const CHAT_GPT_USER = process.env.CHAT_GPT_USER
const CHAT_GPT_PASS = process.env.CHAT_GPT_PASS

const app = new App({
    token: SLACK_BOT_TOKEN,
    signingSecret: SLACK_SIGNING_SECRET
});

const botId = 'U04Q4NL8E0Z';
const botIdDev = 'U04PXGZC551';
const conversations = new Map();
const membersPerChannel = new Map();
let api;
let ACCESS_TOKEN;

app.event('app_mention', ({event, say, payload}) => {
    if (event.user !== botId) {
        const text = event.text.replace(`<@${botId}>`, '').replace(`<@${botIdDev}>`, '').trim();

        if (text.length) {
            chatGPT(text, event.channel)
                .then(answer => {
                    say({text: `<@${event.user}>: ${answer.text}`});
                })
                .catch(error => {
                    say({text: `<@${event.user}> me has roto! -> ${error.message}`})
                });
        } else {
            say(`Que coño quieres <@${event.user}>?!`);
        }

        console.log('p', payload);
    }
});

app.command('/resumen', async ({command, ack, respond, payload}) => {
    await ack();

    const text = await formatConversationHistory(command.channel_id);
    const answer = await chatGPT(text, command.channel_id, false);
    console.log('p', payload);

    await respond(answer);
});

// Start your app
(async () => {
    await app.start(process.env.PORT || 3000);
    if (!process.env.SLACK_SIGNING_SECRET.startsWith('6c4')) {
        await app.client.chat.postMessage({channel: 'C04PRHW329Y', text: 'Bot started!'})
    }
    console.log('Bot is running!');
})();

async function chatGPT(msg, channel, useContext = true) {
    if (!ACCESS_TOKEN) {
        // const Authenticator = await import('openai-authenticator')
        // const auth = new Authenticator.default();
        // ACCESS_TOKEN = await auth.login(CHAT_GPT_USER, CHAT_GPT_PASS);
        ACCESS_TOKEN = require('./at.json');
    }

    let members = membersPerChannel.get(channel);
    if (!members) {
        members = (await app.client.conversations.members({channel})).members.map(m => `<@${m}>`).join(', ');
    }

    if (!api) {
        const {ChatGPTUnofficialProxyAPI} = await import('chatgpt');

        api = new ChatGPTUnofficialProxyAPI({
            // apiKey: OPENAI_API_KEY,
            accessToken: ACCESS_TOKEN.accessToken,
            // debug: true,
            completionParams: {temperature: 0},
            apiReverseProxyUrl: 'https://ai.fakeopen.com/api/conversation'
        });
    }

    let conversationParams = useContext ? conversations.get(channel) : null;
    if (conversationParams) {
        const diff = (new Date()).getTime() - conversationParams.timestamp;
        if (diff > 10 * 60 * 1000) {
            conversationParams = null;
        }
    }

    let promptPrefix = 'Eres un chat bot, intenta responder las preguntas de la manera mas detallada posible\n\n';
    if (useContext) {
        promptPrefix += `Los usuarios de este canal son: ${members}\n\n`;
    }

    const response = await api.sendMessage(msg, {
        ...conversationParams,
        // promptPrefix
    });

    if (useContext) {
        conversations.set(channel, {
            conversationId: response.conversationId,
            parentMessageId: response.id,
            timestamp: (new Date()).getTime()
        });
    }

    return response;
}

async function formatConversationHistory(channel) {
    const res = await app.client.conversations.history({channel});
    return 'Resume la siguiente conversación:\n' +
        res.messages
            .reverse()
            .filter(m => m.type === 'message')
            .map(m => `<@${m.user}>: ${m.text}`)
            .join('\n');
}