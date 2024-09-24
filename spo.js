const TelegramBot = require('node-telegram-bot-api');
const SpotifyWebApi = require('spotify-web-api-node');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const { Voice } = require('@grammyjs/voice');

// Token dari BotFather
const token = '7147604833:AAH8LPw1eVQTF_NKIBMh9bJx_lBCnAHlVuA';
const bot = new TelegramBot(token, {polling: true});

// Spotify API credentials
const spotifyApi = new SpotifyWebApi({
  clientId: 'dac4ca52b8de4d07bc207b049b25e0db',
  clientSecret: '21488701d97e442eb21ef8be632e4c45',
});

// Autentikasi Spotify API
spotifyApi.clientCredentialsGrant().then(data => {
  spotifyApi.setAccessToken(data.body['access_token']);
}).catch(err => console.error('Spotify Auth Error:', err));

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Selamat datang di bot musik! Gunakan perintah /play untuk memutar musik dari Spotify atau YouTube.');
});

bot.onText(/\/play (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1];

  try {
    const data = await spotifyApi.searchTracks(query);
    const tracks = data.body.tracks.items;

    if (tracks.length > 0) {
      const track = tracks[0];
      bot.sendMessage(chatId, `Memutar: ${track.name} oleh ${track.artists.map(artist => artist.name).join(', ')}\nLink: ${track.external_urls.spotify}`);

      // Putar pratinjau musik (durasi terbatas, 30 detik)
      playPreview(chatId, track.preview_url);
    } else {
      bot.sendMessage(chatId, 'Tidak ditemukan musik.');
    }
  } catch (error) {
    bot.sendMessage(chatId, 'Terjadi kesalahan saat mencari musik.');
  }
});

function playPreview(chatId, previewUrl) {
  bot.sendAudio(chatId, previewUrl, { caption: 'Pratinjau 30 detik dari Spotify.' });
}
