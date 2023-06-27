/**
  * Script Amburadul Ga Karuan
  * Created By NathanaeL
  * https://wa.me/6289652948525
**/

const { default: WAConnection, useMultiFileAuthState, generateWAMessageFromContent, getContentType, downloadContentFromMessage, makeCacheableSignalKeyStore } = require('@adiwajshing/baileys');
const pino = require('pino');
const fetch = require('node-fetch');
const axios = require('axios');
const dl = require('@bochilteam/scraper');
const cheerio = require('cheerio');
const chalk = require('chalk');
const { Odesus } = require('odesus');
const { JSDOM } = require('jsdom');
const clph = require('caliph-api');
const yts = require('yt-search');
const moment = require('moment-timezone');
const formData = require('form-data');
const ffmpeg = require('fluent-ffmpeg');
const xfar = require('xfarr-api');
const path = require('path');
const fs = require('fs');
const { format } = require('util');
const { PassThrough } = require('stream');
const { watchFile } = require('fs');
const { exec } = require('child_process');

const fakeThumb = fs.readFileSync('./fakeThumb.jpg');
const parseRes = require('./parseres.js');
const resolveDesuUrl = require('./resolve-desu-url.js');
const resolveBufferStream = require('./resolve-buffer-stream.js');

const color = (text, color) => {
  return !color ? chalk.green(text) : chalk.keyword(color)(text);
};

const start = async () => {
const { state, saveCreds } = await useMultiFileAuthState('session')
      
const level = pino({ level: 'silent' })
const sock = WAConnection({
  logger: level,
  printQRInTerminal: true,
  browser: ['Yanfei', 'Firefox', '3.0.0'],
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, level),
  }
});

sock.ev.on('connection.update', v => {
  const { connection, lastDisconnect } = v;
  if (connection === 'close') {
    if (lastDisconnect.error.output.statusCode !== 401) {
      start();
    } else {
      exec('rm -rf session');
      console.error('Scan QR!');
      start();
    }
  } else if (connection === 'open') {
    console.log('Bot connected!');
  }
});

sock.ev.on('creds.update', saveCreds);

sock.ev.on('messages.upsert', async m => {
const time = moment().tz('Asia/Jakarta').format('HH:mm:ss')

const { ownerNumber, ownerName, botName, otakudesuUrl, lolkey, xcoders } = require('./config.json');
const ods = new Odesus(otakudesuUrl);

if (!m.messages) return;

const msg = m.messages[0];
const from = msg.key.remoteJid;
const type = getContentType(msg.message);
const quotedType = getContentType(msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage) || null;

if (type === 'ephemeralMessage') {
  if (msg && msg.message && msg.message.ephemeralMessage && msg.message.ephemeralMessage.message) {
    msg.message = msg.message.ephemeralMessage.message;
    if (msg.message.viewOnceMessage) {
      msg.message = msg.message.viewOnceMessage;
    }
  }
}

if (type === 'viewOnceMessage') {
  if (msg && msg.message && msg.message.viewOnceMessage) {
    msg.message = msg.message.viewOnceMessage.message;
  }
}

const body =
  type === 'imageMessage' || type === 'videoMessage'
    ? msg.message[type].caption
    : type === 'conversation'
    ? msg.message[type]
    : type === 'extendedTextMessage'
    ? msg.message[type].text
    : '';

const isGroup = from.endsWith('@g.us');
let sender = isGroup ? msg.key.participant : from;
sender = sender.includes(':') ? sender.split(':')[0] + '@s.whatsapp.net' : sender;
const senderName = msg.pushName;
const senderNumber = sender.split('@')[0];
const groupMetadata = isGroup ? await sock.groupMetadata(from) : null;
const participants = isGroup ? await groupMetadata.participants : '';
const groupName = groupMetadata?.subject || '';
const groupMembers = groupMetadata?.participants || [];
const groupAdmins = groupMembers.filter((v) => v.admin).map((v) => v.id);
const isGroupAdmins = groupAdmins.includes(sender);
const botId = sock.user.id.includes(':') ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : sock.user.id;
const isBotGroupAdmins = groupMetadata && groupAdmins.includes(botId);
const isOwner = ownerNumber.includes(sender);
const isCmd = /^[°•π÷×¶∆£¢€¥®™✓_=|~!?#$%^&.+-,\\\©^]/.test(body);
const prefix = isCmd ? body[0] : '';
const args = body.trim().split(/ +/).slice(1);

const reply = (teks) => {
  sock.sendMessage(from, { text: teks }, { quoted: msg });
};

const fakeSend = async (teks, judul, isi, msg) => {
  sock.sendMessage(from, {
    text: teks,
    contextInfo: {
      externalAdReply: {
        showAdAttribution: true,
        title: judul,
        body: isi,
        mediaType: 3,
        thumbnail: fakeThumb,
        sourceUrl: 'https://github.com/natgvlite/weabot'
      }
    }
  }, {
    sendEphemeral: true,
    quoted: msg
  });
}

let command = isCmd ? body.slice(1).trim().split(' ').shift().toLowerCase() : '';
let q = args.join(' ');

const isImage = type === 'imageMessage';
const isVideo = type === 'videoMessage';
const isAudio = type === 'audioMessage';
const isSticker = type === 'stickerMessage';
const isContact = type === 'contactMessage';
const isLocation = type === 'locationMessage';

const isQuoted = type === 'extendedTextMessage';
const isQuotedImage = isQuoted && quotedType === 'imageMessage';
const isQuotedVideo = isQuoted && quotedType === 'videoMessage';
const isQuotedAudio = isQuoted && quotedType === 'audioMessage';
const isQuotedSticker = isQuoted && quotedType === 'stickerMessage';
const isQuotedContact = isQuoted && quotedType === 'contactMessage';
const isQuotedLocation = isQuoted && quotedType === 'locationMessage';

let mediaType = type;
let stream;
if (isQuotedImage || isQuotedVideo || isQuotedAudio || isQuotedSticker) {
  mediaType = quotedType;
  msg.message[mediaType] = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.[mediaType];
  stream = await downloadContentFromMessage(msg.message[mediaType], mediaType.replace('Message', '')).catch(console.error);
}

async function youtubeSearch(query) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await yts(query);
      resolve(data);
    } catch (e) {
      reject(e);
    }
  });
}

async function getBuffer(url, options) {
  try {
    options = options || {};
    const res = await axios({
      method: 'get',
      url,
      headers: {
        'DNT': 1,
        'Upgrade-Insecure-Request': 1
      },
      ...options,
      responseType: 'arraybuffer'
    });
    return res.data;
  } catch (e) {
    return reply(`Error: ${e}`);
  }
}

async function instagram(url) {
  let res = await axios('https://indown.io/');
  let _$ = cheerio.load(res.data);
  let referer = _$('input[name=referer]').val();
  let locale = _$('input[name=locale]').val();
  let _token = _$('input[name=_token]').val();
  let { data } = await axios.post(
    'https://indown.io/download',
    new URLSearchParams({
      link: url,
      referer,
      locale,
      _token
    }),
    {
      headers: {
        cookie: res.headers['set-cookie'].join('; ')
      }
    }
  );
  let $ = cheerio.load(data);
  let result = [];
  let __$ = cheerio.load($('#result').html());
  __$('video').each(function () {
    let $$ = $(this);
    result.push({
      type: 'video',
      thumbnail: $$.attr('poster'),
      url: $$.find('source').attr('src')
    });
  });
  __$('img').each(function () {
    let $$ = $(this);
    result.push({
      type: 'image',
      url: $$.attr('src')
    });
  });

  return result;
}

async function getBase64(url) {
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    const data = Buffer.from(res.data, 'binary').toString('base64');
    return data;
  } catch (err) {
    console.error(err);
  }
}

async function fetchJson(url, options) {
  try {
    options = options || {};
    const res = await axios.get(url, options);
    return res.data;
  } catch (error) {
    return error.message;
  }
}

function isUrl(url) {
  const regexp =
    /^(?:(?:https?|ftp|file):\/\/|www\.|ftp\.){1,1}(?:\S+(?::\S*)?@)?(?:localhost|(?:(?:[a-zA-Z\u00a1-\uffff0-9]-?)*[a-zA-Z\u00a1-\uffff0-9]+){1,1}(?:\.(?:[a-zA-Z\u00a1-\uffff0-9]-?)*[a-zA-Z\u00a1-\uffff0-9]+)*)(?::\d{2,5})?(?:\/[^\s]*)?$/;
  return regexp.test(url);
}

async function shortlink(url) {
  const res = await axios.get(`https://tinyurl.com/api-create.php?url=${url}`);
  return res.data;
}

async function scheduleFunction(func, ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(func());
      } catch (e) {
        reject(e);
      }
    }, ms);
  });
}

function parseMs(ms) {
  let seconds = Math.floor((ms / 1000) % 60);
  let minutes = Math.floor((ms / (1000 * 60)) % 60);
  let hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  let days = Math.floor(ms / (1000 * 60 * 60 * 24));

  return {
    days,
    hours,
    minutes,
    seconds,
    milliseconds: ms % 1000
  };
}

  if (!isGroup && !isCmd) console.log(color(`[ ${time} ]`, 'white'), color('[ PRIVATE ]', 'aqua'), color(body.slice(0, 50), 'white'), 'from', color(senderNumber, 'yellow'))
  if (isGroup && !isCmd) console.log(color(`[ ${time} ]`, 'white'), color('[  GROUP  ]', 'aqua'), color(body.slice(0, 50), 'white'), 'from', color(senderNumber, 'yellow'), 'in', color(groupName, 'yellow'))
  if (!isGroup && isCmd) console.log(color(`[ ${time} ]`, 'white'), color('[ COMMAND ]', 'aqua'), color(body, 'white'), 'from', color(senderNumber, 'yellow'))
  if (isGroup && isCmd) console.log(color(`[ ${time} ]`, 'white'), color('[ COMMAND ]', 'aqua'), color(body, 'white'), 'from', color(senderNumber, 'yellow'), 'in', color(groupName, 'yellow'))
  
    switch (command) {
case 'menu':
case 'help':
case '?':
  sock.sendMessage(from, {
    caption: `
    Hi, *${botName}* in Here!
  
  Available Commands:
  
  • *DOWNLOADER*
    › ${prefix}igdl - Mengunduh video dari Instagram.
    › ${prefix}igstory - Mengunduh story Instagram.
    › ${prefix}mediafire - Mengunduh file dari MediaFire.
    › ${prefix}tiktok - Mengunduh video dari TikTok.
    › ${prefix}twitter - Mengunduh video dari Twitter.
    › ${prefix}ytmp3 - Mengunduh audio dari YouTube.
    › ${prefix}ytmp4 - Mengunduh video dari YouTube.
    › ${prefix}ytsearch - Mencari video di YouTube.
    
  • *GROUPS*
    › ${prefix}add - Menambahkan anggota ke grup.
    › ${prefix}close - Menutup grup.
    › ${prefix}closetime - Mengatur waktu penutupan grup.
    › ${prefix}demote - Menurunkan jabatan anggota grup.
    › ${prefix}hidetag - Menyembunyikan tag.
    › ${prefix}kick - Mengeluarkan anggota dari grup.
    › ${prefix}opentime - Mengatur waktu pembukaan grup.
    › ${prefix}open - Membuka grup.
    › ${prefix}promote - Menaikkan jabatan anggota grup.
    › ${prefix}setdescgroup - Mengatur deskripsi grup.
    › ${prefix}setnamegroup - Mengatur nama grup.
    
  • *MAKER*
    › ${prefix}comic-logo - Membuat logo menggunakan nama kamu.
    › ${prefix}runner-logo - Membuat logo menggunakan nama kamu.
    › ${prefix}starwars-logo - Membuat logo menggunakan nama kamu.
    › ${prefix}style-logo - Membuat logo menggunakan nama kamu.
    › ${prefix}water-logo - Membuat logo menggunakan nama kamu.
    › ${prefix}tolol - Membuat teks "Sertifikat Tolol" menggunakan nama kamu.
    › ${prefix}joebiden - Membuat teks dari polosan postingan Twitter Joe Biden menggunakan nama dan isi teks kamu.
    
  • *OTHERS*
    › ${prefix}cuaca - Menampilkan informasi cuaca.
    › ${prefix}desuinfo - Mencari informasi tentang anime/manga.
    › ${prefix}desusearch - Mencari gambar anime/manga.
    › ${prefix}googleimage - Mencari gambar dari google.
    › ${prefix}gtwiki - Mencari informasi Growtopia dari Wikipedia.
    › ${prefix}infogempa - Menampilkan informasi gempa terkini.
    › ${prefix}owner - Menampilkan informasi pemilik bot.
    › ${prefix}shortlink - Memperpendek tautan URL.
    › ${prefix}ssweb - Mengambil tangkapan layar dari situs web.
    › ${prefix}sticker - Mengubah gambar menjadi stiker.
    › ${prefix}tsunami - Mencari informasi tsunami
    › ${prefix}waifu - Mengirim gambar waifu acak.
    `,
    image: {
      url: `https://i.ibb.co/zXGHcZs/20230627-201603.jpg`
    }
  }, { quoted: msg });
  break;
  /* Downloader */
case 'igdl':
case 'instagram':
  if (!q) {
    return reply(`Contoh:\n${prefix + command} URL`);
  }
  fakeSend(`\nTunggu sebentar..\n`);
  instagram(q)
    .then((data) => {
      for (let i of data) {
        if (i.type === "video") {
          sock.sendMessage(from, { video: { url: i.url }}, { quoted: msg });
        } else if (i.type === "image") {
          sock.sendMessage(from, { caption: `🥰`, image: { url: i.url }}, { quoted: msg });
        }
      }
    })
    .catch(() => reply(`Maaf, terjadi kesalahan`));
  break;
case 'mediafire':
  if (!q) {
    return reply(`Example:\n${prefix + command} URL`);
  }
  fakeSend(`\nTunggu sebentar..\n`);
  dl.mediafiredl(q)
    .then((data) => {
      reply(`*${data.filename}*\n*Ukuran: ${data.filesize}*`);
      sock.sendMessage(from, { document: { url: data.url }, mimetype: 'zip', fileName: data.filename });
    });
  break;
case 'tiktok':
  if (!q) {
    return reply(`Contoh:\n${prefix + command} URL`);
  }
  dl.savefrom(q).then(data => {
    fakeSend(`\nTunggu sebentar..\n`);
    sock.sendMessage(from, {
      video: {
        url: data[0].url[0].url
      },
      caption: data[0].meta.title
    });
  });
  break;
case 'igstory':
case 'igs':
  if (!q) {
    return reply(`Contoh:\n${prefix + command} natgxcoders`);
  } else {
    fakeSend(`\nTunggu sebentar..\n`);
    var storis = `https://instagram.com/stories/` + q;
    instagram(storis.replace('@', ''))
      .then((data) => {
        for (let i of data) {
          if (i.type === "video") {
            sock.sendMessage(from, { video: { url: i.url }}, { quoted: msg });
          } else if (i.type === "image") {
            sock.sendMessage(from, { image: { url: i.url }}, { quoted: msg });
          }
        }
      })
      .catch(() => reply(`Maaf, terjadi kesalahan`));
  }
  break;
case 'twitter':
case 'twt':
  if (!q) {
    return reply(`Contoh:\n${prefix + command} URL`);
  }
  var url = q;
  dl.savefrom(url)
    .then(data => {
      fakeSend(`\nTunggu sebentar..\n`);
      if (data[0].url[0].type === "mp4") {
        sock.sendMessage(from, { video: { url: data[0].url[0].url } });
      } else if (data[0].url[0].type === "jpg") {
        sock.sendMessage(from, { image: { url: data[0].url[0].url } });
      }
    })
    .catch(e => {
      reply(String(e));
    });
  break;
case 'ytmp3':
  if (!q) {
    return reply(`Contoh:\n${prefix + command} URL`);
  }
  fakeSend(`\nTunggu sebentar..\n`);
  var url = q;
  var yt = await dl.youtubedl(url).catch(async () => await dl.youtubedl(url));
  var dl_url = await yt.audio['128kbps'].download();
  sock.sendMessage(from, { image: { url: yt.thumbnail }, caption: `*${yt.title}*` }, { quoted: msg });
  sock.sendMessage(from, { document: { url: dl_url }, fileName: yt.title + `.mp3`, mimetype: 'audio/mp4', caption: `Yanfei-YTMP3` }, { quoted: msg });
  break;
case 'ytmp4':
  if (!q) {
    return reply(`Contoh:\n${prefix + command} URL`);
  }
  fakeSend(`\nTunggu sebentar..\n`);
  var url = q;
  var yt = await dl.youtubedl(url).catch(async () => await dl.youtubedl(url));
  var dl_url = await yt.video['480p'].download();
  setTimeout(() => {
    sock.sendMessage(from, { video: { url: dl_url }, caption: `*${yt.title}*` });
  }, 3000);
  break;
case 'yts':
case 'ytsearch':
  if (!q) {
    return reply(`Contoh:\n${prefix + command} Windah Basudara`);
  }
  try {
    const results = await youtubeSearch(q);
    if (results && results.videos.length > 0) {
      const video = results.videos[0];
      const response = `Hasil Pencarian YouTube:
        Judul: ${video.title}
        Deskripsi: ${video.description}
        Link: ${video.url}`;
      reply(response);
    } else {
      reply("Tidak ada hasil yang ditemukan.");
    }
  } catch (error) {
    console.error("Error saat melakukan pencarian YouTube:", error);
    reply("Terjadi kesalahan saat melakukan pencarian YouTube.");
  }
  break;
  /* Groups */
case 'add':
  if (!isGroup) return reply('Hanya untuk di dalam grup!');
  if (!isGroupAdmins) return reply('Hanya untuk admin grup!');
  if (!isBotGroupAdmins) return reply('Jadikan bot sebagai admin grup!');
  if (!msg.message.extendedTextMessage) return reply('Reply targetnya!');
  add = msg.message.extendedTextMessage.contextInfo.participant;
  await sock.groupParticipantsUpdate(from, [add], 'add');
  break;
case 'close':
  if (!isGroup) return reply('Hanya untuk digunakan di dalam grup!');
  if (!isGroupAdmins) return reply('Hanya untuk admin grup!');
  if (!isBotGroupAdmins) return reply('Jadikan bot sebagai admin grup!');
  await sock.groupSettingUpdate(from, 'announcement');
  reply('Success.');
  break;
case 'closetime':
  if (!isGroup) return reply('Hanya untuk di dalam grup!');
  if (!isGroupAdmins) return reply('Hanya untuk admin grup!');
  if (!isBotGroupAdmins) return reply('Jadikan bot sebagai admin grup!');
  if (!args[1]) {
    return reply(`*Options:*\ndetik\nmenit\njam\nhari\n\n*Contoh:*\n${prefix + command} 20 detik`);
  }
  let closeTimer;
  switch (args[1]) {
    case 'detik':
      closeTimer = args[0] * 1000;
      break;
    case 'menit':
      closeTimer = args[0] * 60000;
      break;
    case 'jam':
      closeTimer = args[0] * 3600000;
      break;
    case 'hari':
      closeTimer = args[0] * 86400000;
      break;
    default:
      return reply(`*Options:*\ndetik\nmenit\njam\nhari\n\n*Contoh:*\n${prefix + command} 20 detik`);
  }
  reply(`${q} dari sekarang`);
  setTimeout(() => {
    sock.groupSettingUpdate(from, 'announcement');
    reply(`Success ${command} ${q}`);
  }, closeTimer);
  break;
case 'demote':
  if (!isGroup) return reply('Hanya untuk di dalam grup!');
  if (!isGroupAdmins) return reply('Hanya untuk admin grup!');
  if (!isBotGroupAdmins) return reply('Jadikan bot sebagai admin grup!');
  if (!msg.message.extendedTextMessage) return reply('Reply targetnya!');
  demote = msg.message.extendedTextMessage.contextInfo.participant;
  await sock.groupParticipantsUpdate(from, [demote], 'demote');
  reply('Success.');
  break;
case 'hidetag':
  if (!q) return reply(`Contoh:\n${prefix + command} Hidetag dari admin`);
  if (!isGroup) return reply('Hanya untuk di dalam grup!');
  if (!isGroupAdmins) return reply('Hanya untuk admin grup!');
  let mem = participants.map(i => i.id);
  sock.sendMessage(from, { text: q ? q : '', mentions: mem }, { quoted: msg });
  break;
case 'kick':
  if (!isGroup) return reply('Hanya untuk di dalam grup!');
  if (!isGroupAdmins) return reply('Hanya untuk admin grup!');
  if (!isBotGroupAdmins) return reply('Jadikan bot sebagai admin grup!');
  if (!msg.message.extendedTextMessage) return reply('Reply targetnya!');
  remove = msg.message.extendedTextMessage.contextInfo.participant;
  await sock.groupParticipantsUpdate(from, [remove], 'remove');
  break;
case 'opentime':
  if (!isGroup) return reply('Hanya untuk di dalam grup!');
  if (!isGroupAdmins) return reply('Hanya untuk admin grup!');
  if (!isBotGroupAdmins) return reply('Jadikan bot sebagai admin grup!');
  if (!args[1]) {
    return reply(`*Options:*\ndetik\nmenit\njam\nhari\n\n*Contoh:*\n${prefix + command} 20 detik`);
  }
  let openTimer;
  switch (args[1]) {
    case 'detik':
      openTimer = args[0] * 1000;
      break;
    case 'menit':
      openTimer = args[0] * 60000;
      break;
    case 'jam':
      openTimer = args[0] * 3600000;
      break;
    case 'hari':
      openTimer = args[0] * 86400000;
      break;
    default:
      return reply(`*Options:*\ndetik\nmenit\njam\nhari\n\n*Contoh:*\n${prefix + command} 20 detik`);
  }
  reply(`${q} dimulai dari sekarang`);
  setTimeout(() => {
    sock.groupSettingUpdate(from, 'not_announcement');
    reply(`Success ${command} ${q}`);
  }, openTimer);
  break;
case 'open':
  if (!isGroup) return reply('Hanya untuk digunakan di dalam grup!');
  if (!isGroupAdmins) return reply('Hanya untuk admin grup!');
  if (!isBotGroupAdmins) return reply('Jadikan bot sebagai admin grup!');
  await sock.groupSettingUpdate(from, 'not_announcement');
  reply('Success.');
  break;
case 'promote':
  if (!isGroup) return reply('Hanya untuk di dalam grup!');
  if (!isGroupAdmins) return reply('Hanya untuk admin grup!');
  if (!isBotGroupAdmins) return reply('Jadikan bot sebagai admin grup!');
  if (!msg.message.extendedTextMessage) return reply('Reply targetnya!');
  promote = msg.message.extendedTextMessage.contextInfo.participant;
  await sock.groupParticipantsUpdate(from, [promote], 'promote');
  reply('Success.');
  break;
case 'setdescgroup':
  if (!isGroup) return reply('Hanya untuk di dalam grup!');
  if (!isGroupAdmins) return reply('Hanya untuk admin grup!');
  if (!isBotGroupAdmins) return reply('Jadikan bot sebagai admin grup!');
  if (!q) return reply(`Contoh:\n${prefix + command} Admin berkuasa`);
  await sock.groupUpdateDescription(from, q)
    .then(() => reply('Success.'))
    .catch(() => reply('Maaf, terjadi kesalahan'));
  break;
case 'setnamegroup':
  if (!isGroup) return reply('Hanya untuk di dalam grup!');
  if (!isGroupAdmins) return reply('Hanya untuk admin grup!');
  if (!isBotGroupAdmins) return reply('Jadikan bot sebagai admin grup!');
  if (!q) return reply(`Contoh:\n${prefix + command} Yanfei WhatsApp Bot`);
  await sock.groupUpdateSubject(from, q)
    .then(() => reply('Success.'))
    .catch(() => reply('Maaf, terjadi kesalahan'));
  break;
  /* Maker */
case 'comic-logo':
  if (!q) {
    return reply(`Contoh:\n${prefix + command} Yanfei`);
  }
  sock.sendMessage(from, {
    caption: q,
    image: {
      url: `https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=comics-logo&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&text=${q}`
    }
  }, { quoted: msg });
  break;
case 'runner-logo':
  if (!q) {
    return reply(`Contoh:\n${prefix + command} Yanfei`);
  }
  fakeSend(`\nTunggu sebentar..\n`);
  sock.sendMessage(from, {
    caption: q,
    image: {
      url: `https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=runner-logo&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&text=${q}`
    }
  }, { quoted: msg });
  break;
case 'starwars-logo':
  if (!q) {
    return reply(`Contoh:\n${prefix + command} Yanfei`);
  }
  fakeSend(`\nTunggu sebentar..\n`);
  sock.sendMessage(from, {
    caption: q,
    image: {
      url: `https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=star-wars-logo&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&text=${q}`
    }
  }, { quoted: msg });
  break;
case 'style-logo':
  if (!q) {
    return reply(`Contoh:\n${prefix + command} Yanfei`);
  }
  fakeSend(`\nTunggu sebentar..\n`);
  sock.sendMessage(from, {
    caption: q,
    image: {
      url: `https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=style-logo&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&text=${q}`
    }
  }, { quoted: msg });
  break;
case 'tolol':
  if (!q) {
    return reply(`Contoh:\n${prefix + command} Yanfei`);
  }
  fakeSend(`\nTunggu sebentar..\n`);
  sock.sendMessage(from, {
    caption: q,
    image: {
      url: `https://tolol.ibnux.com/img.php?nama=${q}`
    }
  }, { quoted: msg });
  break;
case 'joebiden':
  if (!q) {
    return reply(`Contoh:\n${prefix + command} Yanfei WhatsApp Bot`);
  }
  fakeSend(`\nTunggu sebentar..\n`);
  sock.sendMessage(from, {
    caption: q,
    video: {
      url: `https://api-xcoders.site/api/maker/biden?text=${q}&apikey=${xcoders}`
    }
  }, { quoted: msg });
  break;
case 'water-logo':
  if (!q) {
    return reply(`Contoh:\n${prefix + command} Yanfei`);
  }
  fakeSend(`\nTunggu sebentar..\n`);
  sock.sendMessage(from, {
    caption: q,
    image: {
      url: `https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=water-logo&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&text=${q}`
    }
  }, { quoted: msg });
  break;
  /* Others */
case 'chatgpt':
case 'ai':
  if (!q) {
    return reply(
      `Contoh:\n${prefix + command} Bisakah untuk menjelaskan bagaimana ChatGPT dapat bekerja?`
    );
  }
  axios
    .get(
      `https://api.lolhuman.xyz/api/openai?apikey=${lolkey}&text=${encodeURIComponent(
        q
      )}&user=${senderNumber}`
    )
    .then(({ data }) => {
      let openai = `${data.result}`;
      reply(openai);
    })
    .catch((err) => {
      let emror = `${err.message}`;
      reply(emror);
    });
  break;
case 'cuaca':
  if (!q) {
    return reply(`Contoh:\n${prefix + command} Yogyakarta`);
  }
  await fakeSend(`\nTunggu sebentar..\n`);
  var { status, data: resultInfo } = await clph.search.cuaca(q);
  if (status != 200) {
    return reply(`Daerah ${q} tidak ditemukan!`);
  }
  reply(
    parseRes(resultInfo, {
      title: "Cuaca Hari Ini",
    })
  );
  break;
case 'desuinfo':
  if (!q) {
    return reply(`Contoh:\n${prefix + command} URL`);
  }
  const slug = await resolveDesuUrl(q);
  if (!slug || slug.type !== 'anime') {
    return;
  }
  const anime = await ods.getAnimeInfo(slug);
  if (!anime) {
    return;
  }
  anime.episodes = anime.episodes.filter((x) => !/batch/gi.test(x.q));
  const episodeList = anime.episodes.slice(0, 5).map((e, i) => `     ${i + 1}. ${e.title} (${e.q})`).join('\n');
  await sock.sendMessage(from, {
    text: `*${anime.name}*\n\n${anime.synopsis}\n\n*Genres:*\n${anime.genres.map((x) => x.name).join(', ')}\n\n*Status:*\n${anime.status}\n\n*Rating:*\n${anime.rating}\n\n*Episodes:*\n${episodeList}\n\n*Duration:*\n${anime.duration}\n\n*Release:*\n${anime.releasedAt}\n\n*Studio:*\n${anime.studio}\n\n*Link:*\n${anime.q}`,
    quoted: msg,
    image: {
      url: anime.image
    }
  });
  break;
case 'desusearch':
  if (!q) {
    return reply(`Contoh:\n${prefix + command} Kimetsu no Yaiba`);
  }
  const results = await ods.search(q);
  if (!results.length) {
    await sock.sendMessage(from, {
      text: 'No results found'
    }, { quoted: msg });
    return;
  }
  const searchResultsText = results.map((r, i) => `${i + 1}. ${r.name} (${r.url})`).join('\n\n');
  await sock.sendMessage(from, {
    text: `*Search results for ${q}*\n\n${searchResultsText}`,
    quoted: msg
  });
  break;
case 'googleimage':
  if (!q) return reply(`Contoh:\n${prefix + command} Naruto`);
  const dataResult = await dl.googleImage(q);
  if (dataResult && dataResult.length > 0) {
    const randomIndex = Math.floor(Math.random() * dataResult.length);
    const randomImage = dataResult[randomIndex];
    const imageUrl = randomImage.url;
    sock.sendMessage(from, { url: imageUrl }, { quoted: msg, caption: randomImage.title });
  } else {
    reply('Tidak ada hasil gambar yang ditemukan.');
  }
  break;
case 'gtwiki':
  if (!q) {
    return reply(`Contoh:\n${prefix + command} Purple`);
  }
  try {
    const wikig = await axios.get(`https://violet-narwhal-cap.cyclic.app/api/gtwiki?keyword=${q}`);
    const data = wikig.data.data;
    const imageUrl = {
      url: wikig.data.image
    };
    let gata = `Growtopia Wiki\n`;
    for (const item of data) {
      gata += `*${item.title}:*\n${item.data}\n\n`;
    }
    await sock.sendMessage(from, {
      image: { url: wikig.data.image },
      caption: `${gata}*Desc:*\n${wikig.data.description}`,
    });
  } catch (error) {
    console.error(`Error:`, error);
    reply(`Engror`);
  }
  break;
case 'infogempa':
  const { result } = await clph.info.gempa();
  const image = {
    url: result.image
  };
  delete result.image;
  sock.sendMessage(from, {
    image,
    caption: parseRes(result, {
      title: "Info Gempa"
    })
  });
  break;
case 'owner':
  const vcard =
    'BEGIN:VCARD\n' +
    'VERSION:3.0\n' +
    `FN:${ownerName}\n` +
    `ORG:${botName};\n` +
    `TEL;type=MSG;type=CELL;type=VOICE;waid=${ownerNumber[ownerNumber.length - 1].split('@')[0]}:+${ownerNumber[ownerNumber.length - 1].split('@')[0]}\n` +
    'END:VCARD';
  sock.sendMessage(from, {
    contacts: {
      displayName: ownerName,
      contacts: [{ vcard }]
    }
  });
  break;
case 'shortlink':
  if (!q) {
    return reply(`Contoh:\n${prefix + command} URL`);
  }
  fakeSend(`\nTunggu sebentar..\n`);
  const shortUrl = await shortlink(q);
  const urlqr = await axios.get(`https://mfarels.my.id/api/qrcodev2?text=${shortUrl}`)
  sock.sendMessage(from, {
    image: { url: urlqr.data.result },
    caption: `${shortUrl}`
  }) 
  break;
case 'ssweb':
  if (!q) {
    return reply(`Contoh:\n${prefix + command} URL`);
  }
  fakeSend(`\nTunggu sebentar..\n`);
  sock.sendMessage(from, {
    image: { url: `https://image.thum.io/get/width/1900/crop/1000/fullpage/${q}` },
    caption: `🥰`
  }, { quoted: msg });
  break;
case 'sticker':
case 's':
  if (!(isImage || isQuotedImage || isVideo || isQuotedVideo)) {
    return reply('Reply media!');
  }
  let stream = await downloadContentFromMessage(msg.message[mediaType], mediaType.replace('Message', ''));
  let stickerStream = new PassThrough();
  if (isImage || isQuotedImage) {
    ffmpeg(stream)
      .on('start', function (cmd) {
        console.log(`Started: ${cmd}`);
      })
      .on('error', function (err) {
        console.log(`Error: ${err}`);
      })
      .on('end', function () {
        console.log('Finish');
      })
      .addOutputOptions([
        '-vcodec',
        'libwebp',
        '-vf',
        "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse",
      ])
      .toFormat('webp')
      .writeToStream(stickerStream);
    sock.sendMessage(from, { sticker: { stream: stickerStream } });
  } else if (isVideo || isQuotedVideo) {
    ffmpeg(stream)
      .on('start', function (cmd) {
        console.log(`Started: ${cmd}`);
      })
      .on('error', function (err) {
        console.log(`Error: ${err}`);
      })
      .on('end', async () => {
        sock.sendMessage(from, { sticker: { url: `./${sender}.webp` } }).then(() => {
          fs.unlinkSync(`./${sender}.webp`);
          console.log('Success');
        });
      })
      .addOutputOptions([
        '-vcodec',
        'libwebp',
        '-vf',
        "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse",
      ])
      .toFormat('webp')
      .save(`./${sender}.webp`);
  }
  break;
case 'tsunami':
try {
      const data = await dl.tsunami();
      let response = 'Latest tsunami information:\n\n';
      for (const tsunami of data) {
        response += `Date: ${tsunami.date}\n`;
        response += `Time: ${tsunami.time}\n`;
        response += `Location: ${tsunami.location}\n`;
        response += `Magnitude: ${tsunami.magnitude}\n`;
        response += `Depth: ${tsunami.depth}\n`;
        response += `Info: ${tsunami.info}\n\n`;
      }
      // Send the response message
      reply(response);
    } catch (error) {
      // Handle any errors
      console.error('Error:', error.message);
      reply('An error occurred while fetching tsunami data.');
    }
    break;
case 'waifu':
  try {
    const response = await axios.get('https://waifu.pics/api/sfw/waifu');
    const data = response.data.url;
    sock.sendMessage(from, {
    image: { url: data },
    caption: `🥰`
  }, { quoted: msg });
  } catch (error) {
    console.error('Error:', error);
    reply('Maaf, terjadi kesalahan dalam memuat gambar waifu.');
  }
  break;
  default:
  if (!isOwner) return
if (body.startsWith('>')) {
  try {
    let value = await (async () => { return await eval(body.slice(1)); })();
    await reply(format(value));
  } catch (e) {
    await reply(e.toString());
  }
}

  if (!isOwner) return
if (body.startsWith('<')) {
  try {
    let value = await eval(`(async () => { return ${body.slice(1)} })()`);
    await reply(format(value));
  } catch (e) {
    await reply(e);
  }
}
       }
   })
}
start();

/** Thanks For USing **/