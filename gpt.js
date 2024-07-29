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
  if (!idChats.has(id.toString())) {
    idChats.add(id.toString());
    fs.appendFileSync(idChatFilePath, id + '\n');
    return true; // Menunjukkan bahwa ini adalah pengguna baru
  }
  return false;
}

// Mengirim notifikasi ke admin
function notifyAdmin(message) {
  bot.sendMessage(adminId, message, { parse_mode: 'Markdown' });
}

// Melacak status permintaan pengguna
let userRequests = {};

// Melacak total permintaan yang telah selesai dan pending
let totalRequestsCompleted = 0;
let totalRequestsPending = 0;

// Menyimpan waktu terakhir permintaan dari pengguna
let userLastRequestTime = {};

// Handler ketika user mengirim perintah /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username ? `@${msg.from.username}` : msg.from.first_name;

  const isNewUser = saveIdChat(chatId);

  const startMessage = `🖐🏻 hai ${username} saya adalah bot chatgpt by [hiyaok](https://t.me/hiyaok)`;
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

  // Notifikasi admin tentang user baru jika ini adalah pengguna baru
  if (isNewUser) {
    const newUserMessage = `
      ┏━⏍ 𝙉𝙀𝙒 𝙐𝙎𝙀𝙍 👤
      ┣⮕ 𝙐𝙎𝙀𝙍𝙉𝘼𝙈𝙀: @${username}
      ┣⮕ 𝙄𝘿 : ${chatId}
      ┗━━──━━━━─┉━━❐
    `;
    notifyAdmin(newUserMessage);
  }
});

// Handler untuk inline button "Total Request"
bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const totalUsers = idChats.size;
  const totalRequestMessage = `*Total Requests Pending:* \`${totalRequestsPending}\`\n*Total Requests Completed:* \`${totalRequestsCompleted}\`\n*Total Users:* \`${totalUsers}\``;

  bot.sendMessage(chatId, totalRequestMessage, { parse_mode: 'Markdown' });
});

// Handler ketika user mengirim pesan selain /start dan /broadcast di private chat
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.chat.type === 'private' && !msg.text.startsWith('/start') && !msg.text.startsWith('/broadcast')) {
    if (userRequests[chatId]) {
      bot.sendMessage(chatId, "sabar bjir tunggu proses sebelumnya blm selesai coy 🗿", { reply_to_message_id: msg.message_id });
    } else {
      const currentTime = Date.now();
      const lastRequestTime = userLastRequestTime[chatId] || 0;
      const timeDiff = (currentTime - lastRequestTime) / 1000; // dalam detik

      if (timeDiff < 45 && chatId.toString() !== adminId) {
        const remainingTime = 45 - Math.ceil(timeDiff);
        bot.sendMessage(chatId, `tunggu ${remainingTime} detik lagi untuk dapat pakai fitur bot 🗿, kalau gamau nunggu beli laa source code nya cuman 100rb ke @hiyaok`, { reply_to_message_id: msg.message_id });
      } else {
        userRequests[chatId] = true;
        userLastRequestTime[chatId] = currentTime;
        totalRequestsPending++;

        const processingMessage = "💡 Processing";

        bot.sendMessage(chatId, processingMessage, { reply_to_message_id: msg.message_id }).then((sentMsg) => {
          axios.get(`https://api.ngodingaja.my.id/api/gpt?prompt=${msg.text}`)
            .then(response => {
              const data = response.data;

              // Jika status true, ambil data bagian "hasil"
              if (data.status) {
                const resultMessage = `${data.hasil}`; // Mengambil data "hasil" dari respons JSON
                bot.sendMessage(chatId, resultMessage, { parse_mode: 'Markdown', reply_to_message_id: msg.message_id });
                totalRequestsCompleted++;
              } else {
                bot.sendMessage(chatId, "😪 erorr gess ya", { reply_to_message_id: msg.message_id });
              }
              bot.deleteMessage(chatId, sentMsg.message_id);
              delete userRequests[chatId];
              totalRequestsPending--;
            })
            .catch(error => {
              bot.sendMessage(chatId, "Terjadi kesalahan, coba lagi nanti.", { reply_to_message_id: msg.message_id });
              bot.deleteMessage(chatId, sentMsg.message_id);
              delete userRequests[chatId];
              totalRequestsPending--;
            });
        });
      }
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

          // Jika status true, ambil data bagian "hasil"
          if (data.status) {
            const resultMessage = `${data.hasil}`; // Mengambil data "hasil" dari respons JSON
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
        ┣⮕ 𝙐𝙎𝙀𝙍𝙉𝘼𝙈𝙀: @${username}
        ┣⮕ 𝙄𝘿 : ${id}
        ┗━━──━━━━─┉━━❐
      `;
      notifyAdmin(blockUserMessage);
    });
  });
});

console.log('Bot is running...');
