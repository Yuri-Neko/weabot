/**
 * Script Amburadul Ga Karuan
 * Created By NathanaeL
 * https://wa.me/6289652948525
 **/

const { default: WAConnection, useMultiFileAuthState, generateWAMessageFromContent, getContentType, downloadContentFromMessage, makeCacheableSignalKeyStore } = require("@adiwajshing/baileys");
const pino = require("pino");
const fetch = require("node-fetch");
const axios = require("axios");
const dl = require("@bochilteam/scraper");
const cheerio = require("cheerio");
const chalk = require("chalk");
const { Odesus } = require("odesus");
const { JSDOM } = require("jsdom");
const clph = require("caliph-api");
const yts = require("yt-search");
const moment = require("moment-timezone");
const formData = require("form-data");
const ffmpeg = require("fluent-ffmpeg");
const xfar = require("xfarr-api");
const dylux = require("api-dylux");
const path = require("path");
const fs = require("fs");
const os = require("os");
const speed = require("performance-now");
const { format } = require("util");
const { PassThrough } = require("stream");
const { watchFile } = require("fs");
const { exec } = require("child_process");

const fakeThumb = fs.readFileSync("./fakeThumb.jpg");
const parseRes = require("./parseres.js");
const resolveDesuUrl = require("./resolve-desu-url.js");
const resolveBufferStream = require("./resolve-buffer-stream.js");

const color = (text, color) => {
  return !color ? chalk.green(text) : chalk.keyword(color)(text);
};

const start = async () => {
  const { state, saveCreds } = await useMultiFileAuthState("session");

  const level = pino({ level: "silent" });
  const sock = WAConnection({
    logger: level,
    printQRInTerminal: true,
    browser: ["Yanfei", "Firefox", "3.0.0"],
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, level),
    },
  });

  sock.ev.on("connection.update", (v) => {
    const { connection, lastDisconnect } = v;
    if (connection === "close") {
      if (lastDisconnect.error.output.statusCode !== 401) {
        start();
      } else {
        exec("rm -rf session");
        console.error("Scan QR!");
        start();
      }
    } else if (connection === "open") {
      console.log("Bot connected!");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async (m) => {
    const time = moment().tz("Asia/Jakarta").format("HH:mm:ss");

    const { ownerNumber, ownerName, botName, otakudesuUrl, xcoders } = require("./config.json");
    const ods = new Odesus(otakudesuUrl);

    if (!m.messages) return;

    const msg = m.messages[0];
    const from = msg.key.remoteJid;
    const type = getContentType(msg.message);
    const quotedType = getContentType(msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage) || null;

    if (type === "ephemeralMessage") {
      if (msg && msg.message && msg.message.ephemeralMessage && msg.message.ephemeralMessage.message) {
        msg.message = msg.message.ephemeralMessage.message;
        if (msg.message.viewOnceMessage) {
          msg.message = msg.message.viewOnceMessage;
        }
      }
    }

    if (type === "viewOnceMessage") {
      if (msg && msg.message && msg.message.viewOnceMessage) {
        msg.message = msg.message.viewOnceMessage.message;
      }
    }

    const body = type === "imageMessage" || type === "videoMessage" ? msg.message[type].caption : type === "conversation" ? msg.message[type] : type === "extendedTextMessage" ? msg.message[type].text : "";

    const isGroup = from.endsWith("@g.us");
    let sender = isGroup ? msg.key.participant : from;
    sender = sender.includes(":") ? sender.split(":")[0] + "@s.whatsapp.net" : sender;
    const senderName = msg.pushName;
    const senderNumber = sender.split("@")[0];
    const groupMetadata = isGroup ? await sock.groupMetadata(from) : null;
    const participants = isGroup ? await groupMetadata.participants : "";
    const groupName = groupMetadata?.subject || "";
    const groupMembers = groupMetadata?.participants || [];
    const groupAdmins = groupMembers.filter((v) => v.admin).map((v) => v.id);
    const isGroupAdmins = groupAdmins.includes(sender);
    const botId = sock.user.id.includes(":") ? sock.user.id.split(":")[0] + "@s.whatsapp.net" : sock.user.id;
    const isBotGroupAdmins = groupMetadata && groupAdmins.includes(botId);
    const isOwner = ownerNumber.includes(sender);
    const isCmd = /^[°•π÷×¶∆£¢€¥®™✓_=|~!?#$%^&.+-,\\\©^]/.test(body);
    const prefix = isCmd ? body[0] : "";
    const args = body.trim().split(/ +/).slice(1);

    const reply = (teks) => {
      sock.sendMessage(from, { text: teks }, { quoted: msg });
    };

    const fakeSend = async (teks, judul, isi, msg) => {
      sock.sendMessage(
        from,
        {
          text: teks,
          contextInfo: {
            externalAdReply: {
              showAdAttribution: true,
              title: judul,
              body: isi,
              mediaType: 3,
              thumbnail: fakeThumb,
              sourceUrl: "https://github.com/natgvlite/weabot",
            },
          },
        },
        {
          sendEphemeral: true,
          quoted: msg,
        }
      );
    };

    let command = isCmd ? body.slice(1).trim().split(" ").shift().toLowerCase() : "";
    let q = args.join(" ");

    const isImage = type === "imageMessage";
    const isVideo = type === "videoMessage";
    const isAudio = type === "audioMessage";
    const isSticker = type === "stickerMessage";
    const isContact = type === "contactMessage";
    const isLocation = type === "locationMessage";

    const isQuoted = type === "extendedTextMessage";
    const isQuotedImage = isQuoted && quotedType === "imageMessage";
    const isQuotedVideo = isQuoted && quotedType === "videoMessage";
    const isQuotedAudio = isQuoted && quotedType === "audioMessage";
    const isQuotedSticker = isQuoted && quotedType === "stickerMessage";
    const isQuotedContact = isQuoted && quotedType === "contactMessage";
    const isQuotedLocation = isQuoted && quotedType === "locationMessage";

    let mediaType = type;
    let stream;
    if (isQuotedImage || isQuotedVideo || isQuotedAudio || isQuotedSticker) {
      mediaType = quotedType;
      msg.message[mediaType] = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.[mediaType];
      stream = await downloadContentFromMessage(msg.message[mediaType], mediaType.replace("Message", "")).catch(console.error);
    }

    async function searchWattpad(q) {
      try {
        const response = await axios.get(`http://xyros.my.id/api/wattpad?keyword=${q}`);
        const data = response.data;
        return data;
      } catch (error) {
        console.log(error);
        return null;
      }
    }

    async function funcArtiNama(name) {
      try {
        const response = await fetch(`http://xyros.my.id/api/artinama?keyword=${name}`);
        const result = await response.json();
        return result.arti;
      } catch (error) {
        console.error("Terjadi kesalahan dalam mendapatkan result arti nama:", error);
        return "Terjadi kesalahan dalam mendapatkan result arti nama.";
      }
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
          method: "get",
          url,
          headers: {
            DNT: 1,
            "Upgrade-Insecure-Request": 1,
          },
          ...options,
          responseType: "arraybuffer",
        });
        return res.data;
      } catch (e) {
        return reply(`Error: ${e}`);
      }
    }

    async function instagram(url) {
      let res = await axios("https://indown.io/");
      let _$ = cheerio.load(res.data);
      let referer = _$("input[name=referer]").val();
      let locale = _$("input[name=locale]").val();
      let _token = _$("input[name=_token]").val();
      let { data } = await axios.post(
        "https://indown.io/download",
        new URLSearchParams({
          link: url,
          referer,
          locale,
          _token,
        }),
        {
          headers: {
            cookie: res.headers["set-cookie"].join("; "),
          },
        }
      );
      let $ = cheerio.load(data);
      let result = [];
      let __$ = cheerio.load($("#result").html());
      __$("video").each(function () {
        let $$ = $(this);
        result.push({
          type: "video",
          thumbnail: $$.attr("poster"),
          url: $$.find("source").attr("src"),
        });
      });
      __$("img").each(function () {
        let $$ = $(this);
        result.push({
          type: "image",
          url: $$.attr("src"),
        });
      });

      return result;
    }

    async function zoro(q) {
      const res = await axios.get(`https://zoro.to/search?keyword=${q}`);
      const $ = cheerio.load(res.data);
      const arrays = [];
      $("div.flw-item").each(function () {
        const title = $(this).find("div.film-detail > h3 > a").attr("title");
        const type = $(this).find("div.film-detail > div.fd-infor > span:nth-child(1)").text();
        const duration = $(this).find("div.film-detail > div.fd-infor > span.fdi-item.fdi-duration").text();
        const link = "https://zoro.to" + $(this).find("div.film-detail > h3 > a").attr("href");
        arrays.push({ title, type, duration, link });
      });
      return arrays;
    }

    async function getBase64(url) {
      try {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        const data = Buffer.from(res.data, "binary").toString("base64");
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
        milliseconds: ms % 1000,
      };
    }

    const runtime = function (seconds) {
      seconds = Number(seconds);
      var d = Math.floor(seconds / (3600 * 24));
      var h = Math.floor((seconds % (3600 * 24)) / 3600);
      var m = Math.floor((seconds % 3600) / 60);
      var s = Math.floor(seconds % 60);
      var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
      var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
      var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
      var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
      return dDisplay + hDisplay + mDisplay + sDisplay;
    };

    if (!isGroup && !isCmd) console.log(color(`[ ${time} ]`, "white"), color("[ PRIVATE ]", "aqua"), color(body.slice(0, 50), "white"), "from", color(senderNumber, "yellow"));
    if (isGroup && !isCmd) console.log(color(`[ ${time} ]`, "white"), color("[  GROUP  ]", "aqua"), color(body.slice(0, 50), "white"), "from", color(senderNumber, "yellow"), "in", color(groupName, "yellow"));
    if (!isGroup && isCmd) console.log(color(`[ ${time} ]`, "white"), color("[ COMMAND ]", "aqua"), color(body, "white"), "from", color(senderNumber, "yellow"));
    if (isGroup && isCmd) console.log(color(`[ ${time} ]`, "white"), color("[ COMMAND ]", "aqua"), color(body, "white"), "from", color(senderNumber, "yellow"), "in", color(groupName, "yellow"));

    switch (command) {
      case "menu":
      case "help":
      case "?":
        sock.sendMessage(
          from,
          {
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
    › ${prefix}kertas - Membuat gambar menggunakan kertas dari teks atau nama kamu.
    › ${prefix}bajingan - Membuat gambar "Bajingan Lo" dari teks atau nama kamu.
    › ${prefix}woi - Membuat gambar "WOI" dari teks atau nama kamu.
    › ${prefix}joebiden - Membuat teks dari polosan postingan Twitter Joe Biden menggunakan nama dan isi teks kamu.
    › ${prefix}ledrun - Membuat video berjalan menggunakan teks kamu.
    
  • *OTHERS*
    › ${prefix}alkitab - Mencari informasi dalam Alkitab.
    › ${prefix}artinama - Mencari informasi dan arti dari nama kamu.
    › ${prefix}cuaca - Menampilkan informasi cuaca.
    › ${prefix}chatgpt - Bertanya seputar apa pun kepada ChatGPT.
    › ${prefix}desuinfo - Mencari informasi tentang anime/manga.
    › ${prefix}desusearch - Mencari gambar anime/manga.
    › ${prefix}get - Menampilkan informasi link.
    › ${prefix}infogempa - Menampilkan informasi gempa terkini.
    › ${prefix}owner - Menampilkan informasi pemilik bot.
    › ${prefix}ping - Menampilkan informasi status bot.
    › ${prefix}runtime - Menampilkan informasi status running bot.
    › ${prefix}shortlink - Memperpendek tautan URL.
    › ${prefix}ssweb - Mengambil tangkapan layar dari situs web.
    › ${prefix}sticker - Mengubah gambar menjadi stiker.
    › ${prefix}tsunami - Mencari informasi tsunami
    › ${prefix}waifu - Mengirim gambar waifu acak.
    › ${prefix}wpsearch - Mengambil result dari Wattpad sesuai permintaan kamu.
    › ${prefix}zorosearch - Mengambil result gambar dari website zoro.to
    `,
            image: {
              url: `https://i.ibb.co/zXGHcZs/20230627-201603.jpg`,
            },
          },
          { quoted: msg }
        );
        break;
      /* Downloader */
      case "igdl":
      case "instagram":
        if (!q) {
          return reply(`Contoh:\n${prefix + command} URL`);
        }
        fakeSend(`\nTunggu sebentar..\n`);
        instagram(q)
          .then((data) => {
            for (let i of data) {
              if (i.type === "video") {
                sock.sendMessage(from, { video: { url: i.url } }, { quoted: msg });
              } else if (i.type === "image") {
                sock.sendMessage(from, { caption: `🥰`, image: { url: i.url } }, { quoted: msg });
              }
            }
          })
          .catch(() => reply(`Maaf, terjadi kesalahan`));
        break;
      case "mediafire":
        if (!q) {
          return reply(`Example:\n${prefix + command} URL`);
        }
        fakeSend(`\nTunggu sebentar..\n`);
        dl.mediafiredl(q).then((data) => {
          reply(`*${data.filename}*\n*Ukuran: ${data.filesize}*`);
          sock.sendMessage(from, { document: { url: data.url }, mimetype: "zip", fileName: data.filename });
        });
        break;
      case "tiktok":
        if (!q) {
          return reply(`Contoh:\n${prefix + command} URL`);
        }
        dl.savefrom(q).then((data) => {
          fakeSend(`\nTunggu sebentar..\n`);
          sock.sendMessage(from, {
            video: {
              url: data[0].url[0].url,
            },
            caption: data[0].meta.title,
          });
        });
        break;
      case "igstory":
      case "igs":
        if (!q) {
          return reply(`Contoh:\n${prefix + command} natgxcoders`);
        } else {
          fakeSend(`\nTunggu sebentar..\n`);
          var storis = `https://instagram.com/stories/` + q;
          instagram(storis.replace("@", ""))
            .then((data) => {
              for (let i of data) {
                if (i.type === "video") {
                  sock.sendMessage(from, { video: { url: i.url } }, { quoted: msg });
                } else if (i.type === "image") {
                  sock.sendMessage(from, { image: { url: i.url } }, { quoted: msg });
                }
              }
            })
            .catch(() => reply(`Maaf, terjadi kesalahan`));
        }
        break;
      case "twitter":
      case "twt":
        if (!q) {
          return reply(`Contoh:\n${prefix + command} URL`);
        }
        var url = q;
        dl.savefrom(url)
          .then((data) => {
            fakeSend(`\nTunggu sebentar..\n`);
            if (data[0].url[0].type === "mp4") {
              sock.sendMessage(from, { video: { url: data[0].url[0].url } });
            } else if (data[0].url[0].type === "jpg") {
              sock.sendMessage(from, { image: { url: data[0].url[0].url } });
            }
          })
          .catch((e) => {
            reply(String(e));
          });
        break;
      case "ytmp3":
        if (!q) {
          return reply(`Contoh:\n${prefix + command} URL`);
        }
        fakeSend(`\nTunggu sebentar..\n`);
        var url = q;
        var yt = await dl.youtubedl(url).catch(async () => await dl.youtubedl(url));
        var dl_url = await yt.audio["128kbps"].download();
        sock.sendMessage(from, { image: { url: yt.thumbnail }, caption: `*${yt.title}*` }, { quoted: msg });
        sock.sendMessage(from, { document: { url: dl_url }, fileName: yt.title + `.mp3`, mimetype: "audio/mp4", caption: `Yanfei-YTMP3` }, { quoted: msg });
        break;
      case "ytmp4":
        if (!q) {
          return reply(`Contoh:\n${prefix + command} URL`);
        }
        fakeSend(`\nTunggu sebentar..\n`);
        var url = q;
        var yt = await dl.youtubedl(url).catch(async () => await dl.youtubedl(url));
        var dl_url = await yt.video["480p"].download();
        setTimeout(() => {
          sock.sendMessage(from, { video: { url: dl_url }, caption: `*${yt.title}*` });
        }, 3000);
        break;
      case "yts":
      case "ytsearch":
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
      case "add":
        if (!isGroup) return reply("Hanya untuk di dalam grup!");
        if (!isGroupAdmins) return reply("Hanya untuk admin grup!");
        if (!isBotGroupAdmins) return reply("Jadikan bot sebagai admin grup!");
        if (!msg.message.extendedTextMessage) return reply("Reply targetnya!");
        add = msg.message.extendedTextMessage.contextInfo.participant;
        await sock.groupParticipantsUpdate(from, [add], "add");
        break;
      case "close":
        if (!isGroup) return reply("Hanya untuk digunakan di dalam grup!");
        if (!isGroupAdmins) return reply("Hanya untuk admin grup!");
        if (!isBotGroupAdmins) return reply("Jadikan bot sebagai admin grup!");
        await sock.groupSettingUpdate(from, "announcement");
        reply("Success.");
        break;
      case "closetime":
        if (!isGroup) return reply("Hanya untuk di dalam grup!");
        if (!isGroupAdmins) return reply("Hanya untuk admin grup!");
        if (!isBotGroupAdmins) return reply("Jadikan bot sebagai admin grup!");
        if (!args[1]) {
          return reply(`*Options:*\ndetik\nmenit\njam\nhari\n\n*Contoh:*\n${prefix + command} 20 detik`);
        }
        let closeTimer;
        switch (args[1]) {
          case "detik":
            closeTimer = args[0] * 1000;
            break;
          case "menit":
            closeTimer = args[0] * 60000;
            break;
          case "jam":
            closeTimer = args[0] * 3600000;
            break;
          case "hari":
            closeTimer = args[0] * 86400000;
            break;
          default:
            return reply(`*Options:*\ndetik\nmenit\njam\nhari\n\n*Contoh:*\n${prefix + command} 20 detik`);
        }
        reply(`${q} dari sekarang`);
        setTimeout(() => {
          sock.groupSettingUpdate(from, "announcement");
          reply(`Success ${command} ${q}`);
        }, closeTimer);
        break;
      case "demote":
        if (!isGroup) return reply("Hanya untuk di dalam grup!");
        if (!isGroupAdmins) return reply("Hanya untuk admin grup!");
        if (!isBotGroupAdmins) return reply("Jadikan bot sebagai admin grup!");
        if (!msg.message.extendedTextMessage) return reply("Reply targetnya!");
        demote = msg.message.extendedTextMessage.contextInfo.participant;
        await sock.groupParticipantsUpdate(from, [demote], "demote");
        reply("Success.");
        break;
      case "hidetag":
        if (!q) return reply(`Contoh:\n${prefix + command} Hidetag dari admin`);
        if (!isGroup) return reply("Hanya untuk di dalam grup!");
        if (!isGroupAdmins) return reply("Hanya untuk admin grup!");
        let mem = participants.map((i) => i.id);
        sock.sendMessage(from, { text: q ? q : "", mentions: mem }, { quoted: msg });
        break;
      case "kick":
        if (!isGroup) return reply("Hanya untuk di dalam grup!");
        if (!isGroupAdmins) return reply("Hanya untuk admin grup!");
        if (!isBotGroupAdmins) return reply("Jadikan bot sebagai admin grup!");
        if (!msg.message.extendedTextMessage) return reply("Reply targetnya!");
        remove = msg.message.extendedTextMessage.contextInfo.participant;
        await sock.groupParticipantsUpdate(from, [remove], "remove");
        break;
      case "opentime":
        if (!isGroup) return reply("Hanya untuk di dalam grup!");
        if (!isGroupAdmins) return reply("Hanya untuk admin grup!");
        if (!isBotGroupAdmins) return reply("Jadikan bot sebagai admin grup!");
        if (!args[1]) {
          return reply(`*Options:*\ndetik\nmenit\njam\nhari\n\n*Contoh:*\n${prefix + command} 20 detik`);
        }
        let openTimer;
        switch (args[1]) {
          case "detik":
            openTimer = args[0] * 1000;
            break;
          case "menit":
            openTimer = args[0] * 60000;
            break;
          case "jam":
            openTimer = args[0] * 3600000;
            break;
          case "hari":
            openTimer = args[0] * 86400000;
            break;
          default:
            return reply(`*Options:*\ndetik\nmenit\njam\nhari\n\n*Contoh:*\n${prefix + command} 20 detik`);
        }
        reply(`${q} dimulai dari sekarang`);
        setTimeout(() => {
          sock.groupSettingUpdate(from, "not_announcement");
          reply(`Success ${command} ${q}`);
        }, openTimer);
        break;
      case "open":
        if (!isGroup) return reply("Hanya untuk digunakan di dalam grup!");
        if (!isGroupAdmins) return reply("Hanya untuk admin grup!");
        if (!isBotGroupAdmins) return reply("Jadikan bot sebagai admin grup!");
        await sock.groupSettingUpdate(from, "not_announcement");
        reply("Success.");
        break;
      case "promote":
        if (!isGroup) return reply("Hanya untuk di dalam grup!");
        if (!isGroupAdmins) return reply("Hanya untuk admin grup!");
        if (!isBotGroupAdmins) return reply("Jadikan bot sebagai admin grup!");
        if (!msg.message.extendedTextMessage) return reply("Reply targetnya!");
        promote = msg.message.extendedTextMessage.contextInfo.participant;
        await sock.groupParticipantsUpdate(from, [promote], "promote");
        reply("Success.");
        break;
      case "setdescgroup":
        if (!isGroup) return reply("Hanya untuk di dalam grup!");
        if (!isGroupAdmins) return reply("Hanya untuk admin grup!");
        if (!isBotGroupAdmins) return reply("Jadikan bot sebagai admin grup!");
        if (!q) return reply(`Contoh:\n${prefix + command} Admin berkuasa`);
        await sock
          .groupUpdateDescription(from, q)
          .then(() => reply("Success."))
          .catch(() => reply("Maaf, terjadi kesalahan"));
        break;
      case "setnamegroup":
        if (!isGroup) return reply("Hanya untuk di dalam grup!");
        if (!isGroupAdmins) return reply("Hanya untuk admin grup!");
        if (!isBotGroupAdmins) return reply("Jadikan bot sebagai admin grup!");
        if (!q) return reply(`Contoh:\n${prefix + command} Yanfei WhatsApp Bot`);
        await sock
          .groupUpdateSubject(from, q)
          .then(() => reply("Success."))
          .catch(() => reply("Maaf, terjadi kesalahan"));
        break;
      /* Maker */
      case "comic-logo":
        if (!q) {
          return reply(`Contoh:\n${prefix + command} Yanfei`);
        }
        sock.sendMessage(
          from,
          {
            caption: q,
            image: {
              url: `https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=comics-logo&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&text=${q}`,
            },
          },
          { quoted: msg }
        );
        break;
      case "runner-logo":
        if (!q) {
          return reply(`Contoh:\n${prefix + command} Yanfei`);
        }
        fakeSend(`\nTunggu sebentar..\n`);
        sock.sendMessage(
          from,
          {
            caption: q,
            image: {
              url: `https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=runner-logo&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&text=${q}`,
            },
          },
          { quoted: msg }
        );
        break;
      case "starwars-logo":
        if (!q) {
          return reply(`Contoh:\n${prefix + command} Yanfei`);
        }
        fakeSend(`\nTunggu sebentar..\n`);
        sock.sendMessage(
          from,
          {
            caption: q,
            image: {
              url: `https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=star-wars-logo&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&text=${q}`,
            },
          },
          { quoted: msg }
        );
        break;
      case "style-logo":
        if (!q) {
          return reply(`Contoh:\n${prefix + command} Yanfei`);
        }
        fakeSend(`\nTunggu sebentar..\n`);
        sock.sendMessage(
          from,
          {
            caption: q,
            image: {
              url: `https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=style-logo&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&text=${q}`,
            },
          },
          { quoted: msg }
        );
        break;
      case "tolol":
        if (!q) {
          return reply(`Contoh:\n${prefix + command} Yanfei`);
        }
        fakeSend(`\nTunggu sebentar..\n`);
        sock.sendMessage(
          from,
          {
            caption: q,
            image: {
              url: `https://tolol.ibnux.com/img.php?nama=${q}`,
            },
          },
          { quoted: msg }
        );
        break;
      case "kertas":
        if (!q) {
          return reply(`Contoh:\n${prefix + command} Love You`);
        }
        fakeSend(`\nTunggu sebentar..\n`);
        sock.sendMessage(
          from,
          {
            caption: q,
            image: {
              url: `https://mfarels.my.id/api/kertas?text=${q}`,
            },
          },
          { quoted: msg }
        );
        break;
      case "bajingan":
        if (!q) {
          return reply(`Contoh:\n${prefix + command} Wahyu`);
        }
        fakeSend(`\nTunggu sebentar..\n`);
        sock.sendMessage(
          from,
          {
            caption: q,
            image: {
              url: `https://mfarels.my.id/api/bajinganlo?text=${q}`,
            },
          },
          { quoted: msg }
        );
        break;
      case "woi":
        if (!q) {
          return reply(`Contoh:\n${prefix + command} Woi Dek`);
        }
        fakeSend(`\nTunggu sebentar..\n`);
        sock.sendMessage(
          from,
          {
            caption: q,
            image: {
              url: `https://mfarels.my.id/api/woi?text=${q}`,
            },
          },
          { quoted: msg }
        );
        break;
      case "joebiden":
        if (!q) {
          return reply(`Contoh:\n${prefix + command} Yanfei WhatsApp Bot`);
        }
        fakeSend(`\nTunggu sebentar..\n`);
        sock.sendMessage(
          from,
          {
            caption: q,
            image: {
              url: `https://api-xcoders.site/api/maker/biden?text=${q}&apikey=${xcoders}`,
            },
          },
          { quoted: msg }
        );
        break;
      case "water-logo":
        if (!q) {
          return reply(`Contoh:\n${prefix + command} Yanfei`);
        }
        fakeSend(`\nTunggu sebentar..\n`);
        sock.sendMessage(
          from,
          {
            caption: q,
            image: {
              url: `https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=water-logo&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&text=${q}`,
            },
          },
          { quoted: msg }
        );
        break;
      case "ledrun":
        if (!q) {
          return reply(`Contoh:\n${prefix + command} Yanfei WhatsApp Bot`);
        }
        fakeSend(`\nTunggu sebentar..\n`);
        sock.sendMessage(
          from,
          {
            caption: q,
            video: {
              url: `https://mfarels.my.id/api/led-runningtext?text=${q}`,
            },
          },
          { quoted: msg }
        );
        break;
      /* Others */
      case "alki":
      case "alkitab":
        if (!q) {
          return reply(`Contoh:\n${prefix + command} Kejadian`);
        }
        let res = await fetch(`https://alkitab.me/search?q=${encodeURIComponent(q)}`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36",
          },
        });
        if (!res.ok) {
          throw await res.text();
        }
        let html = await res.text();
        let { document } = new JSDOM(html).window;
        let ResultRess = [...document.querySelectorAll("div.vw")].map((el) => {
          let a = el.querySelector("a");
          let p = el.querySelector("p");
          return {
            teks: p ? p.textContent.trim() : "",
            link: a ? a.href : "",
            title: a ? a.textContent.trim() : "",
          };
        });
        reply(ResultRess.map((v) => `${v.title}\n${v.teks}`).join("\n────────\n"));
        break;
      case "artinama":
        if (!q) {
          return reply(`Contoh:\n${prefix + command} Nathanael`);
        }
        const name = q;
        const artiNama = await funcArtiNama(name);
        const resultss = `Arti nama dari ${name}: ${artiNama}`;
        reply(resultss);
        break;
      case "cuaca":
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
      case "chatgpt":
      case "ai":
        if (!q) {
          return reply(`Contoh:\n${prefix + command} Apa itu ChatGPT ?`);
        }
        dylux.ChatGpt(q).then((data) => {
          fakeSend(data.text);
        });
        break;
      case "desuinfo":
        if (!q) {
          return reply(`Contoh:\n${prefix + command} URL`);
        }
        const slug = await resolveDesuUrl(q);
        if (!slug || slug.type !== "anime") {
          return;
        }
        const anime = await ods.getAnimeInfo(slug);
        if (!anime) {
          return;
        }
        anime.episodes = anime.episodes.filter((x) => !/batch/gi.test(x.q));
        const episodeList = anime.episodes
          .slice(0, 5)
          .map((e, i) => `     ${i + 1}. ${e.title} (${e.q})`)
          .join("\n");
        await sock.sendMessage(from, {
          text: `*${anime.name}*\n\n${anime.synopsis}\n\n*Genres:*\n${anime.genres.map((x) => x.name).join(", ")}\n\n*Status:*\n${anime.status}\n\n*Rating:*\n${anime.rating}\n\n*Episodes:*\n${episodeList}\n\n*Duration:*\n${
            anime.duration
          }\n\n*Release:*\n${anime.releasedAt}\n\n*Studio:*\n${anime.studio}\n\n*Link:*\n${anime.q}`,
          quoted: msg,
          image: {
            url: anime.image,
          },
        });
        break;
      case "desusearch":
        if (!q) {
          return reply(`Contoh:\n${prefix + command} Kimetsu no Yaiba`);
        }
        const results = await ods.search(q);
        if (!results.length) {
          await sock.sendMessage(
            from,
            {
              text: "No results found",
            },
            { quoted: msg }
          );
          return;
        }
        const searchResultsText = results.map((r, i) => `${i + 1}. ${r.name} (${r.url})`).join("\n\n");
        await sock.sendMessage(from, {
          text: `*Search results for ${q}*\n\n${searchResultsText}`,
          quoted: msg,
        });
        break;
      case "get":
      case "fetch":
        if (!q) {
          return reply(`Contoh:\n${prefix + command} https://github.com/erhabot`);
        }
        if (!/^https?:\/\//.test(q)) {
          return reply("URL is Invalid!");
        }
        var requestOptions = {
          method: "GET",
          redirect: "follow",
        };
        if (body.match(/(mp4)/gi)) {
          fetch(`${q}`, requestOptions)
            .then((res) => sock.sendMessage(from, { video: { url: `${q}` }, mimetype: "video/mp4", caption: "Success" }, { quoted: msg }))
            .catch((error) => reply("Error", error));
        } else if (body.match(/(mp3)/gi)) {
          fetch(`${q}`, requestOptions)
            .then((res) => sock.sendMessage(from, { audio: { url: `${q}` }, mimetype: "audio/mp4", fileName: "Audio" }, { quoted: msg }))
            .catch((error) => reply("error", error));
        } else if (body.match(/(png)/gi)) {
          fetch(`${q}`, requestOptions)
            .then((res) => sock.sendMessage(from, { image: { url: `${q}` }, caption: "Success" }, { quoted: msg }))
            .catch((error) => reply("Error", error));
        } else if (body.match(/(jpg)/gi)) {
          fetch(`${q}`, requestOptions)
            .then((res) => sock.sendMessage(from, { image: { url: `${q}` }, caption: "Success" }, { quoted: msg }))
            .catch((error) => reply("Error", error));
        } else if (body.match(/(jpeg)/gi)) {
          fetch(`${q}`, requestOptions)
            .then((res) => sock.sendMessage(from, { image: { url: `${q}` }, caption: "Success" }, { quoted: msg }))
            .catch((error) => reply("Error", error));
        } else {
          fetch(`${q}`, requestOptions)
            .then((response) => response.text())
            .then((result) => reply(result))
            .catch((error) => reply("Error", error));
        }
        break;
      case "infogempa":
        const { result } = await clph.info.gempa();
        const image = {
          url: result.image,
        };
        delete result.image;
        sock.sendMessage(from, {
          image,
          caption: parseRes(result, {
            title: "Info Gempa",
          }),
        });
        break;
      case "owner":
        const vcard =
          "BEGIN:VCARD\n" +
          "VERSION:3.0\n" +
          `FN:${ownerName}\n` +
          `ORG:${botName};\n` +
          `TEL;type=MSG;type=CELL;type=VOICE;waid=${ownerNumber[ownerNumber.length - 1].split("@")[0]}:+${ownerNumber[ownerNumber.length - 1].split("@")[0]}\n` +
          "END:VCARD";
        sock.sendMessage(from, {
          contacts: {
            displayName: ownerName,
            contacts: [{ vcard }],
          },
        });
        break;
      case "runtime":
        fakeSend(`${runtime(process.uptime())}`);
        break;
      case "ping":
        {
          const used = process.memoryUsage();
          const cpus = os.cpus().map((cpu) => {
            cpu.total = Object.keys(cpu.times).reduce((last, type) => last + cpu.times[type], 0);
            return cpu;
          });
          const cpu = cpus.reduce(
            (last, cpu, _, { length }) => {
              last.total += cpu.total;
              last.speed += cpu.speed / length;
              last.times.user += cpu.times.user;
              last.times.nice += cpu.times.nice;
              last.times.sys += cpu.times.sys;
              last.times.idle += cpu.times.idle;
              last.times.irq += cpu.times.irq;
              return last;
            },
            {
              speed: 0,
              total: 0,
              times: {
                user: 0,
                nice: 0,
                sys: 0,
                idle: 0,
                irq: 0,
              },
            }
          );
          let timestamp = speed();
          let latensi = speed() - timestamp;
          let neww = performance.now();
          let oldd = performance.now();
          let respon = `👋Hai ${senderName}`;
          respon += `\n`;
          respon += `🔰 RESPONS  ${latensi.toFixed(4)}\n`;
          respon += `🔰 AKTIF: ${runtime(process.uptime())}\n`;
          respon += `🔰 RAM: ${format(os.totalmem() - os.freemem())} / ${format(os.totalmem())}\n`;
          respon += `🔰 CPU: ${cpus.length} Core(s)\n`;
          respon += `🔰 OS: ${os.version()}\n`;
          respon += `\n`;
          respon += `_NodeJS Memory Usage_\n`;
          respon += `${Object.keys(used)
            .map((key, _, arr) => `${key.padEnd(Math.max(...arr.map((v) => v.length)), " ")}: ${format(used[key])}`)
            .join("\n")}\n\n${
            cpus[0]
              ? `_Total CPU Usage_\n${cpus[0].model.trim()} (${cpu.speed} MHZ)\n${Object.keys(cpu.times)
                  .map((type) => `- *${(type + "*").padEnd(6)}: ${((100 * cpu.times[type]) / cpu.total).toFixed(2)}%`)
                  .join("\n")}\n_CPU Core(s) Usage (${cpus.length} Core CPU)_\n${cpus
                  .map(
                    (cpu, i) =>
                      `${i + 1}. ${cpu.model.trim()} (${cpu.speed} MHZ)\n${Object.keys(cpu.times)
                        .map((type) => `- *${(type + "*").padEnd(6)}: ${((100 * cpu.times[type]) / cpu.total).toFixed(2)}%`)
                        .join("\n")}`
                  )
                  .join("\n\n")}`
              : ""
          } `.trim();
          sock.sendMessage(from, { image: { url: "https://i.ibb.co/zXGHcZs/20230627-201603.jpg" }, caption: respon });
        }
        break;
      case "shortlink":
        if (!q) {
          return reply(`Contoh:\n${prefix + command} URL`);
        }
        fakeSend(`\nTunggu sebentar..\n`);
        const shortUrl = await shortlink(q);
        const urlqr = await axios.get(`http://xyros.my.id/api/qrgen?keyword=${shortUrl}`);
        sock.sendMessage(from, {
          image: { url: urlqr.data.result },
          caption: `${shortUrl}`,
        });
        break;
      case "ssweb":
        if (!q) {
          return reply(`Contoh:\n${prefix + command} URL`);
        }
        fakeSend(`\nTunggu sebentar..\n`);
        sock.sendMessage(
          from,
          {
            image: { url: `https://image.thum.io/get/width/1900/crop/1000/fullpage/${q}` },
            caption: `🥰`,
          },
          { quoted: msg }
        );
        break;
      case "sticker":
      case "s":
        if (!(isImage || isQuotedImage || isVideo || isQuotedVideo)) {
          return reply("Reply media!");
        }
        let stream = await downloadContentFromMessage(msg.message[mediaType], mediaType.replace("Message", ""));
        let stickerStream = new PassThrough();
        if (isImage || isQuotedImage) {
          ffmpeg(stream)
            .on("start", function (cmd) {
              console.log(`Started: ${cmd}`);
            })
            .on("error", function (err) {
              console.log(`Error: ${err}`);
            })
            .on("end", function () {
              console.log("Finish");
            })
            .addOutputOptions([
              "-vcodec",
              "libwebp",
              "-vf",
              "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse",
            ])
            .toFormat("webp")
            .writeToStream(stickerStream);
          sock.sendMessage(from, { sticker: { stream: stickerStream } });
        } else if (isVideo || isQuotedVideo) {
          ffmpeg(stream)
            .on("start", function (cmd) {
              console.log(`Started: ${cmd}`);
            })
            .on("error", function (err) {
              console.log(`Error: ${err}`);
            })
            .on("end", async () => {
              sock.sendMessage(from, { sticker: { url: `./${sender}.webp` } }).then(() => {
                fs.unlinkSync(`./${sender}.webp`);
                console.log("Success");
              });
            })
            .addOutputOptions([
              "-vcodec",
              "libwebp",
              "-vf",
              "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse",
            ])
            .toFormat("webp")
            .save(`./${sender}.webp`);
        }
        break;
      case "tsunami":
        try {
          const data = await dl.tsunami();
          let response = "Latest tsunami information:\n\n";
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
          console.error("Error:", error.message);
          reply("An error occurred while fetching tsunami data.");
        }
        break;
      case "waifu":
        try {
          const response = await axios.get("https://waifu.pics/api/sfw/waifu");
          const data = response.data.url;
          sock.sendMessage(
            from,
            {
              image: { url: data },
              caption: `🥰`,
            },
            { quoted: msg }
          );
        } catch (error) {
          console.error("Error:", error);
          reply("Maaf, terjadi kesalahan dalam memuat gambar waifu.");
        }
        break;
      case "wpsearch":
      case "wattpad":
        if (!q) return reply(`Contoh:\n${prefix + command} query`);
        const data = await searchWattpad(q);
        if (data) {
          const { desk, gambar, status, title } = data;
          const result = `
      *${title}*
      ${desk}
      Status: ${status}
      Gambar: ${gambar}
    `;
          sock.sendMessage(
            from,
            {
              caption: result,
              image: {
                url: `${gambar}`,
              },
            },
            { quoted: msg }
          );
        } else {
          reply("Maaf, terjadi kesalahan");
        }
        break;
      case "zorosearch":
        if (!q) {
          reply(`Contoh:\n${prefix + command} Naruto`);
          break;
        }
        const ress = await zoro(q);
        if (ress.length > 0) {
          let replyMsg = "Hasil pencarian:\n";
          for (let i = 0; i < ress.length; i++) {
            const { title, type, duration, link } = ress[i];
            replyMsg += `\n${i + 1}. ${title}\nType: ${type}\nDuration: ${duration}\nLink: ${link}\n`;
          }
          reply(replyMsg);
        } else {
          sock.sendMessage(from, "Tidak ada hasil yang ditemukan.", msg);
        }
        break;
      default:
        if (!isOwner) return;
        if (body.startsWith(">")) {
          try {
            let value = await (async () => {
              return await eval(body.slice(1));
            })();
            await reply(format(value));
          } catch (e) {
            await reply(e.toString());
          }
        }

        if (!isOwner) return;
        if (body.startsWith("<")) {
          try {
            let value = await eval(`(async () => { return ${body.slice(1)} })()`);
            await reply(format(value));
          } catch (e) {
            await reply(e);
          }
        }
    }
  });
};
start();

/** Thanks For USing **/
