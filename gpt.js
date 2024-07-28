const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const token = '6819953928:AAF6GzBPNnI2Sh4mAX658r9F9BociRPI2N4';
const adminId = '5988451717';

const bot = new TelegramBot(token, { polling: true });
const idChatFilePath = path.join(__dirname, 'idchat.txt');

// Membaca file idchat.txt dan menginisialisasi set ID chat
let idChats = new Set();
if (fs.existsSync(idChatFilePath)) {
  const data = fs.readFileSync(idChatFilePath, 'utf8').split('\n').filter(Boolean);
  idChats = new Set(data);
}

// Menyimpan ID chat jika belum ada
function saveIdChat(id) {
  if (!idChats.has(id)) {
    idChats.add(id);
    fs.appendFileSync(idChatFilePath, id + '\n');
  }
}

// Mengirim notifikasi ke admin
function notifyAdmin(message) {
  bot.sendMessage(adminId, message, { parse_mode: 'Markdown' });
}

// Melacak status permintaan pengguna
let userRequests = {};

// Handler ketika user mengirim perintah /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username ? `@${msg.from.username}` : msg.from.first_name;

  saveIdChat(chatId);

  const startMessage = `hai ${username} saya adalah bot chatgpt by [hiyaok](https://t.me/hiyaok)`;
  const shareMessage = 'halooo ada bot chatgpt nih by @hiyaok pakee yuu';

  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Share Bot', switch_inline_query: shareMessage }],
        [{ text: 'Total Request', callback_data: 'total_request' }]
      ]
    },
    parse_mode: 'Markdown'
  };

  bot.sendMessage(chatId, startMessage, options);

  // Notifikasi admin tentang user baru
  const newUserMessage = `
    ┏━⏍ 𝙉𝙀𝙒 𝙐𝙎𝙀𝙍 👤
    ┣⮕ 𝙐𝙎𝙀𝙍𝙉𝘼𝙈𝙀: ${username}
    ┣⮕ 𝙄𝘿 : ${chatId}
    ┗━━──━━━━─┉━━❐
  `;
  notifyAdmin(newUserMessage);
});

// Handler untuk inline button "Total Request"
bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const totalUsers = idChats.size;
  const totalRequests = Object.keys(userRequests).length; // Jumlah permintaan yang sedang diproses

  const totalRequestMessage = `*Total Request:* \`${totalRequests}\`\n*Total Users:* \`${totalUsers}\``;

  bot.sendMessage(chatId, totalRequestMessage, { parse_mode: 'Markdown' });
});

// Handler ketika user mengirim pesan selain /start di private chat
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.chat.type === 'private' && !msg.text.startsWith('/start')) {
    if (userRequests[chatId]) {
      bot.sendMessage(chatId, "Tunggu proses sebelumnya selesai.", { reply_to_message_id: msg.message_id });
    } else {
      userRequests[chatId] = true;

      const processingMessage = "💡 Processing";

      bot.sendMessage(chatId, processingMessage, { reply_to_message_id: msg.message_id }).then((sentMsg) => {
        axios.get(`https://api.ngodingaja.my.id/api/gpt?prompt=${msg.text}`)
          .then(response => {
            const data = response.data;

            if (data.status) {
              const resultMessage = `*${data.hasil}*`;
              bot.sendMessage(chatId, resultMessage, { parse_mode: 'Markdown', reply_to_message_id: msg.message_id });
            } else {
              bot.sendMessage(chatId, "erorr gess ya", { reply_to_message_id: msg.message_id });
            }

            // Hapus pesan "Processing"
            bot.deleteMessage(chatId, sentMsg.message_id);
            delete userRequests[chatId];
          })
          .catch(() => {
            bot.sendMessage(chatId, "erorr gess ya", { reply_to_message_id: msg.message_id });
            bot.deleteMessage(chatId, sentMsg.message_id);
            delete userRequests[chatId];
          });
      });
    }
  }
});

// Handler untuk perintah /gpt di grup
bot.onText(/\/gpt (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = match[1];

  if (userRequests[userId]) {
    bot.sendMessage(chatId, "Tunggu proses sebelumnya selesai.", { reply_to_message_id: msg.message_id });
  } else {
    userRequests[userId] = true;

    const processingMessage = "💡 Processing";

    bot.sendMessage(chatId, processingMessage, { reply_to_message_id: msg.message_id }).then((sentMsg) => {
      axios.get(`https://api.ngodingaja.my.id/api/gpt?prompt=${text}`)
        .then(response => {
          const data = response.data;

          if (data.status) {
            const resultMessage = `*${data.hasil}*`;
            bot.sendMessage(chatId, resultMessage, { parse_mode: 'Markdown', reply_to_message_id: msg.message_id });
          } else {
            bot.sendMessage(chatId, "erorr gess ya", { reply_to_message_id: msg.message_id });
          }

          // Hapus pesan "Processing"
          bot.deleteMessage(chatId, sentMsg.message_id);
          delete userRequests[userId];
        })
        .catch(() => {
          bot.sendMessage(chatId, "erorr gess ya", { reply_to_message_id: msg.message_id });
          bot.deleteMessage(chatId, sentMsg.message_id);
          delete userRequests[userId];
        });
    });
  }
});

// Handler untuk perintah /broadcast
bot.onText(/\/broadcast (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];

  if (chatId.toString() !== adminId) return;

  idChats.forEach(id => {
    bot.sendMessage(id, text).catch(() => {
      // Notifikasi admin tentang user yang memblokir bot
      const blockUserMessage = `
        ┏━⏍ USER BAN BOT 😪
        ┣⮕ 𝙐𝙎𝙀𝙍𝙉𝘼𝙈𝙀: [unknown]
        ┣⮕ 𝙄𝘿 : ${id}
        ┗━━──━━━━─┉━━❐
      `;
      notifyAdmin(blockUserMessage);
    });
  });
});

console.log('Bot is running...');
