const TelegramBot = require('node-telegram-bot-api');
const math = require('mathjs');

// Masukkan API Token Bot Telegram yang didapatkan dari BotFather
const token = '7147604833:AAH8LPw1eVQTF_NKIBMh9bJx_lBCnAHlVuA';
const bot = new TelegramBot(token, { polling: true });

// Inline Query Handler
bot.on('inline_query', (query) => {
    const queryText = query.query;

    // Check jika input tidak kosong
    if (queryText.length === 0) return;

    let result;
    try {
        // Evaluasi ekspresi matematika
        result = math.evaluate(queryText);
    } catch (error) {
        result = 'Error: Invalid Expression';
    }

    // Teks hasil dalam format miring dan monospace
    const formattedInput = `_${queryText}_`;
    const formattedResult = `\`${result}\``;

    // Response Inline Query
    const inlineResults = [{
        type: 'article',
        id: query.id,
        title: `hasil: ${result}`,
        input_message_content: {
            message_text: `${formattedInput} = ${formattedResult}`,
            parse_mode: 'MarkdownV2'  // Menggunakan Markdown untuk format teks
        },
        reply_markup: {
            inline_keyboard: [[
                {
                    text: "Share",
                    switch_inline_query: `${queryText}`
                }
            ]]
        },
        description: `hitung: ${queryText} = ${result}`
    }];

    bot.answerInlineQuery(query.id, inlineResults);
});

// Message handler untuk memproses pesan langsung
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    let result;
    try {
        // Evaluasi ekspresi matematika
        result = math.evaluate(text);
    } catch (error) {
        result = 'Error: Invalid Expression';
    }

    // Format hasil dalam teks miring dan monospace
    const response = `_${text}_ = \`${result}\``;

    bot.sendMessage(chatId, response, { parse_mode: 'MarkdownV2' });
});

console.log('Bot kalkulator siap!');
