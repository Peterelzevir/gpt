const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const PDFDocument = require('pdfkit');

// Token dari Bot Father
const token = 'YOUR_TELEGRAM_BOT_TOKEN';
const bot = new TelegramBot(token, { polling: true });

let conversionMode = null; // Untuk menyimpan mode konversi yang dipilih

// Menangani perintah /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
*Halo ${msg.from.first_name},*
_Selamat datang di bot konversi file ke PDF!_

Pilih mode konversi file yang Anda inginkan:
  `;

  // Menampilkan tombol inline untuk memilih mode konversi
  bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: 'TXT ke PDF', callback_data: 'txt_to_pdf' }],
        [{ text: 'XLS ke PDF', callback_data: 'xls_to_pdf' }],
        [{ text: 'XLSX ke PDF', callback_data: 'xlsx_to_pdf' }],
        [{ text: 'HTML ke PDF', callback_data: 'html_to_pdf' }],
        [{ text: 'Lainnya ke PDF', callback_data: 'other_to_pdf' }],
      ]
    }
  });
});

// Menangani pilihan mode dari inline keyboard
bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  // Menentukan mode konversi yang dipilih
  if (data === 'txt_to_pdf') {
    conversionMode = 'TXT ke PDF';
  } else if (data === 'xls_to_pdf') {
    conversionMode = 'XLS ke PDF';
  } else if (data === 'xlsx_to_pdf') {
    conversionMode = 'XLSX ke PDF';
  } else if (data === 'html_to_pdf') {
    conversionMode = 'HTML ke PDF';
  } else if (data === 'other_to_pdf') {
    conversionMode = 'Lainnya ke PDF';
  }

  // Memberikan respons setelah memilih mode
  bot.sendMessage(chatId, `Anda telah memilih mode *${conversionMode}*. Silakan kirim file yang sesuai untuk memulai proses konversi.`, { parse_mode: 'Markdown' });
});

// Menangani file yang dikirim berdasarkan mode konversi
bot.on('document', async (msg) => {
  const fileId = msg.document.file_id;
  const chatId = msg.chat.id;
  const botUsername = msg.from.username;

  // Validasi file yang dikirim sesuai dengan mode yang dipilih
  let isValidFile = false;
  let fileType = '';

  if (conversionMode === 'TXT ke PDF' && msg.document.mime_type === 'text/plain') {
    isValidFile = true;
    fileType = 'TXT';
  } else if (conversionMode === 'XLS ke PDF' && msg.document.mime_type === 'application/vnd.ms-excel') {
    isValidFile = true;
    fileType = 'XLS';
  } else if (conversionMode === 'XLSX ke PDF' && msg.document.mime_type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    isValidFile = true;
    fileType = 'XLSX';
  } else if (conversionMode === 'HTML ke PDF' && msg.document.mime_type === 'text/html') {
    isValidFile = true;
    fileType = 'HTML';
  } else if (conversionMode === 'Lainnya ke PDF') {
    isValidFile = true;
    fileType = 'lainnya';
  }

  if (isValidFile) {
    bot.sendMessage(chatId, `\`⏳ Sedang memproses file ${fileType} menjadi PDF...\``, { parse_mode: 'Markdown' });

    // Mendapatkan link file
    const fileLink = await bot.getFileLink(fileId);

    // Download file
    const filePath = `./temp/${msg.document.file_name}`;
    const writeStream = fs.createWriteStream(filePath);
    const response = await fetch(fileLink);
    response.body.pipe(writeStream);

    writeStream.on('finish', () => {
      // Konversi file ke PDF (ini bisa disesuaikan untuk berbagai format)
      const randomNumber = Math.floor(Math.random() * 10000);
      const pdfFileName = `Bot_${botUsername}_${randomNumber}.pdf`;
      const pdfPath = `./temp/${pdfFileName}`;
      const pdfDoc = new PDFDocument();
      const writePdf = fs.createWriteStream(pdfPath);
      pdfDoc.pipe(writePdf);

      // Membaca konten dan menambahkannya ke PDF
      const content = fs.readFileSync(filePath, 'utf8');
      pdfDoc.text(content); // Mengkonversi konten menjadi teks dalam PDF
      pdfDoc.end();

      writePdf.on('finish', () => {
        // Mengirim file PDF hasil konversi ke user
        bot.sendDocument(chatId, pdfPath, {
          caption: `\`Convert File Pdf By @${botUsername}\``,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: 'Share', switch_inline_query: '' }]] // Tombol "Share"
          }
        }).then(() => {
          bot.sendMessage(chatId, '*✅ File berhasil dikonversi menjadi PDF!*', { parse_mode: 'Markdown' });
          
          // Hapus file sementara
          fs.unlinkSync(filePath);
          fs.unlinkSync(pdfPath);
        });
      });
    });
  } else {
    bot.sendMessage(chatId, '⚠️ _Mohon kirimkan file yang sesuai dengan mode yang dipilih._', { parse_mode: 'Markdown' });
  }
});
