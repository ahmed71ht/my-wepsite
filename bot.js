
const fs = require('fs');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');  // <-- تعديل هنا
const path = require('path');

(async () => {
    // إعداد قاعدة بيانات lowdb
    const adapter = new JSONFile(path.join(__dirname, 'db.json'));
    const defaultData = { forms: {}, titles: {} };
    const db = new Low(adapter, defaultData);

    await db.read();
    db.data ||= {};
    db.data.settings ||= {};


    // إعداد العميل
    const { Client, LocalAuth } = require('whatsapp-web.js');

    const client = new Client({
        puppeteer: {
            headless: true, // جرب true أو false
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });


    // عرض QR للتسجيل
    client.on('qr', (qr) => {
        qrcode.generate(qr, { small: true });
    });

    // جاهزية البوت
    client.on('ready', () => {
        console.log('🤖 البوت جاهز للعمل!');
    });

    // دالة للتحقق هل المرسل مشرف في المجموعة
    async function isAdminCheck(msg) {
        if (!msg.from.endsWith('@g.us')) return false;
        const chat = await msg.getChat();
        const contact = await msg.getContact();
        const admins = chat.participants.filter(p => p.isAdmin).map(p => p.id._serialized);
        return admins.includes(contact.id._serialized);
    }

    // التعامل مع الرسائل
    client.on('message', async (msg) => {

        const isGroup = msg.from.endsWith('@g.us');
        const body = msg.body || '';
        const lower = body.toLowerCase().trim();

        // تحليل الأمر والكلمات
        const args = body.trim().split(/\s+/);
        const command = args[0];

        // تحقق إذا المستخدم مشرف (في القروب فقط)
        const isAdmin = isGroup ? await isAdminCheck(msg) : false;

        // 1) ميزة تحويل صورة إلى ملصق عند كتابة "ملصق"
        if (lower === 'ملصق' && msg.hasMedia) {
            try {
                const media = await msg.downloadMedia();
                if (!media) return msg.reply('❌ فشل في تحميل الصورة.');

                const sticker = new Sticker(media.data, {
                    pack: 'رايزو بوت',
                    author: 'RAIZO',
                    type: StickerTypes.FULL,
                    quality: 100,
                });

                const stickerBuffer = await sticker.toBuffer();
                const stickerMedia = new MessageMedia('image/webp', stickerBuffer.toString('base64'));

                await client.sendMessage(msg.from, stickerMedia, {
                    sendMediaAsSticker: true,
                    stickerName: 'RAIZO',
                    stickerAuthor: 'رايزو',
                });
            } catch (err) {
                console.error(err);
                msg.reply('❌ حدث خطأ أثناء تحويل الصورة إلى ملصق.');
            }
            return;
        }

        // رايزو1 - أوامر الحماية
        if (command === '.رايزو1') {
            return msg.reply(`
༺━─━─╃⌬〔⚔〕⌬╄─━─━༻
『🛡┇اوامـر الـحـمـايـة┇🛡』
❐═━━━━═╊⊰⚔⊱╉═━━━━═❐
> ⧉↫الـجـمـيـع يـبـدأ بـي .افتح - .اقفل❯
> ⧉↫تـخـتـار افتح ثـم الـخـيـار الـي تـبـيـه يـتـفـعـل❯
> ⧉↫تـخـتـار اقفل ثـم الـخـيـار الـي تـبـيـه يـقـف❯
> ⧉↫مـثـال↫.اقفل مضاد_الاخفاء❯
❐═━━━━═╊⊰⚔⊱╉═━━━━═❐
【🔱┇الـخـيـار ⟣ الادمن_فقط】 
> ⧉↫الـبـوت لـن يـتـفـاعـل سوا مـع الـمـشـرفـيـن❯
━━ ═━╃✦⊰⚔⊱✦╄━━ ═━
【🔱┇الـخـيـار ⟣ الترحيب】 
> ⧉↫بـيـشـغـل و يـطـفـي الـتـرحـيـب❯
━━ ═━╃✦⊰⚔⊱✦╄━━ ═━
【🔱┇الـخـيـار ⟣ مضاد_الاخفاء】 
> ⧉↫بـيـمـنـع ارسـال الـصـور مـره واحـده❯
━━ ═━╃✦⊰⚔⊱✦╄━━ ═━
【🔱┇الـخـيـار ⟣ مضاد_الروابط】 
> ⧉↫بـيـمـنـع الاعـضـاء مـن ارسـال روابـط❯
> ⧉↫بٕيـشـتـغـل لـي روابـط الـواتـس فـقـط❯
━━ ═━╃✦⊰⚔⊱✦╄━━ ═━
【🔱┇الـخـيـار ⟣ مضاد_الروابط2】 
> ⧉↫بـيـمـنـع الاعـضـاء مـن ارسـال روابـط❯
> ⧉↫جـمـيـع الـروابـط بـي شـكـل عـام❯
━━ ═━╃✦⊰⚔⊱✦╄━━ ═━
【🔱┇الـخـيـار ⟣ مضاد_الاسبام】 
> ⧉↫لـو الـرسـالـه فـيـهـا 2500 حـرف❯
> ⧉↫بـيـحـذفـهـا و يـدي انـذار لـلـشـخـص❯
━━ ═━╃✦⊰⚔⊱✦╄━━ ═━
【🔱┇الـخـيـار ⟣ مضاد_السب】 
> ⧉↫بـيـمـنـع ارسـال مـسـبـات فـي الـجـروب❯
> ⧉↫ان وجـد سـب بـيـمـسـح و يـمـنـشـن الادمنز❯
༺━─━─╃⌬〔⚔〕⌬╄─━─━༻
> 𝙱𝚈┇𝚁𝙰𝙸𝚉𝙾 𝙱𝙾𝚃`);
        }

        const settings = db.data.settings[msg.from] || {};
        const com = msg.body.toLowerCase();

        // تفعيل وإيقاف الأنظمة (للمشرفين فقط)
        if (com.startsWith('.اقفل ') || com.startsWith('.افتح ')) {
            if (!isGroup || !isAdmin) {
                return msg.reply('⌫┇هـذا الامـر لـي ادمـن الـمـجـمـوعـة فـقـط يـا حـب┇〄');
            }

            const isLock = com.startsWith('.اقفل ');
            const feature = com.split(' ')[1]?.trim();

            if (!feature) return msg.reply('❗ يرجى تحديد اسم الميزة بعد الأمر.\nمثال: .اقفل الروابط');

            const groupId = msg.from;
            db.data.settings[groupId] ||= {};
            db.data.settings[groupId][feature] = isLock;

            await db.write();

            const state = isLock ? '✅ تم قفل' : '❌ تم فتح';
            msg.reply(`${state} ميزة *${feature}*`);
        }

        // عرض الحالة (للمشرفين فقط)
        if (com === '.الحالة') {
            if (!isGroup || !isAdmin) {
                return msg.reply('⌫┇هـذا الامـر لـي ادمـن الـمـجـمـوعـة فـقـط يـا حـب┇〄');
            }

            const groupId = msg.from;
            const settings = db.data.settings[groupId] || {};

            let reply = '📊 *حالة أنظمة الحماية:*\n\n';
            const features = ['الروابط', 'السبام', 'السب', 'الاخفاء', 'الادمن فقط', 'الترحيب'];

            for (const feature of features) {
                const status = settings[feature] ? '✅ مقفول' : '❌ مفتوح';
                reply += `- ${feature}: ${status}\n`;
            }

            msg.reply(reply);
        }

        // تهيئة قاعدة البيانات
        db.data.blacklist = db.data.blacklist || [];
        db.data.warnings = db.data.warnings || {};
        db.data.rules = db.data.rules || {};
        db.write();

        // أوامر عامة متاحة للجميع
        if (command === '.رايزو2') {
            return msg.reply(`
        ༺━─━─╃⌬〔⚔ أوامـر الجـروبـات ⚔〕⌬╄─━─━༻

        ❐ .مؤبد
        ↳ ⧉ يضيف شخص للبلاك ليست (لو دخل الجروب ينطرد تلقائيًا)

        ❐ .عفو
        ↳ ⧉ يحذف شخص من البلاك ليست

        ❐ .البلاك_ليست
        ↳ ⧉ عرض قائمة الأشخاص في البلاك ليست

        ❐ .انذار @منشن
        ↳ ⧉ إعطاء انذار (يُطرد بعد 5 إنذارات)

        ❐ .مسح_انذار @منشن
        ↳ ⧉ حذف إنذار من شخص

        ❐ .وضع_القوانين
        ↳ ⧉ تحديد رسالة القوانين الخاصة بالجروب

        ❐ .القوانين
        ↳ ⧉ عرض القوانين التي تم تعيينها

        ༺━─━─╃⌬〔⚔〕⌬╄─━─━༻
        > 𝙱𝚈 ┇ 𝚁𝙰𝙸𝚉𝙾 𝙱𝙾𝚃
        `);
        }

        // أمر .القوانين متاح للجميع
        if (command === '.القوانين') {
            const rules = db.data.rules[msg.from];
            if (!rules) return msg.reply('ℹ️ لم يتم تعيين قوانين لهذا القروب بعد.');
            return msg.reply(`📜 قوانين القروب:\n${rules}`);
        }

        // التحقق من أن المرسل أدمن
        const chat = await msg.getChat();
        const isGroupAdmin = chat.participants?.find(p => p.id._serialized === msg.author && (p.isAdmin || p.isSuperAdmin));

        // الأوامر الخاصة بالمشرفين فقط
        const adminOnlyCommands = ['.مؤبد', '.عفو', '.البلاك_ليست', '.انذار', '.مسح_انذار', '.وضع_القوانين'];
        if (!isGroupAdmin && adminOnlyCommands.includes(command)) {
            return msg.reply('⌫┇هـذا الامـر لـي ادمـن الـمـجـمـوعـة فـقـط يـا حـب┇〄');
        }

        // أمر .مؤبد
        if (command === '.مؤبد') {
            const target = msg.mentionedIds[0];
            if (!target) return msg.reply('⛔ منشن الشخص الذي تريد إضافته للبلاك ليست');
            if (!db.data.blacklist.includes(target)) {
                db.data.blacklist.push(target);
                db.write();
                msg.reply('✅ تم إضافة الشخص للبلاك ليست.');
            } else {
                msg.reply('⚠️ الشخص موجود مسبقًا في البلاك ليست.');
            }
        }

        // أمر .عفو
        if (command === '.عفو') {
            const target = msg.mentionedIds[0];
            if (!target) return msg.reply('⛔ منشن الشخص الذي تريد إزالة اسمه من البلاك ليست');
            db.data.blacklist = db.data.blacklist.filter(id => id !== target);
            db.write();
            msg.reply('✅ تم إزالة الشخص من البلاك ليست.');
        }

        // أمر .البلاك_ليست
        if (command === '.البلاك_ليست') {
            const list = db.data.blacklist;
            if (list.length === 0) return msg.reply('🟢 لا يوجد أشخاص في البلاك ليست.');
            const mentions = list.map(id => `@${id.split('@')[0]}`).join('\n');
            msg.reply(`⛔ الأشخاص في البلاك ليست:\n${mentions}`, undefined, { mentions: list });
        }

        // أمر .انذار
        if (command === '.انذار') {
            const target = msg.mentionedIds[0];
            if (!target) return msg.reply('⛔ منشن الشخص الذي تريد إنذاره');
            db.data.warnings[target] = (db.data.warnings[target] || 0) + 1;
            db.write();
            if (db.data.warnings[target] >= 5) {
                msg.reply(`🚫 @${target.split('@')[0]} تم طرده بعد 5 إنذارات.`, undefined, { mentions: [target] });
                msg.getChat().then(chat => {
                    chat.removeParticipants([target]).catch(() => {
                        msg.reply(`⚠️ لم أتمكن من طرد @${target.split('@')[0]}، تأكد أن لدي صلاحيات الأدمن.`, undefined, { mentions: [target] });
                    });
                });
            } else {
                msg.reply(`⚠️ تم إنذار @${target.split('@')[0]} ( ${db.data.warnings[target]} / 5 )`, undefined, { mentions: [target] });
            }
        }

        // أمر .مسح_انذار
        if (command === '.مسح_انذار') {
            const target = msg.mentionedIds[0];
            if (!target) return msg.reply('⛔ منشن الشخص الذي تريد تقليل إنذاراته');
            db.data.warnings[target] = Math.max((db.data.warnings[target] || 0) - 1, 0);
            db.write();
            msg.reply(`✅ تم تقليل إنذارات @${target.split('@')[0]} إلى (${db.data.warnings[target]})`, undefined, { mentions: [target] });
        }

        // أمر .وضع_القوانين
        if (command === '.وضع_القوانين') {
            const content = msg.body.split('.وضع_القوانين')[1]?.trim();
            if (!content) return msg.reply('⛔ أرسل القوانين مع الأمر.\nمثال: .وضع_القوانين ممنوع السب، ممنوع الإعلانات');
            if (content.length > 1000) return msg.reply('⛔ القوانين طويلة جدًا، حاول تقصيرها.');
            db.data.rules[msg.from] = content;
            db.write();
            msg.reply('✅ تم حفظ قوانين القروب.');
        }


        // رايزو3 - قسم ديني
        if (command === '.رايزو3') {
            return msg.reply(`
༺━─━─╃⌬〔⚔〕⌬╄─━─━༻
⌫┇قـسـم ديـــنــي┇〄
✠ ━━ • ━ ‹✤› ━ • ━━ ✠ 
❐┇.معلومة_دينية_عشوائية 』
> ⧉↫بيعطي معلومة دينية عشوائية من الذكاء الاصطناعي❯
❐┇.سؤال_نبوي』
> ⧉↫يرسل سؤال عن سيرة النبي محمد ﷺ او عن حياته❯
❐┇.سؤال_حديث 』
> ⧉↫يرسل سؤال عن احاديث الشريفة❯
❐┇.سؤال_قران 』
> ⧉↫يرسل سؤال عن ايات أو سور من القرأن ألكريم❯
❐┇.سؤال_ديني』
> ⧉↫بيرسل سؤال ديني عشوائي❯
༺━─━─╃⌬〔⚔〕⌬╄─━─━༻
> 𝙱𝚈┇𝚁𝙰𝙸𝚉𝙾 𝙱𝙾𝚃`);
        }

        // تحقق إذا المستخدم أدمن
        async function thinkIsAdmin(msg) {
            const chat = await msg.getChat();
            const sender = msg.author || msg.from;
            const participant = chat.participants.find(p => p.id._serialized === sender);
            return participant?.isAdmin || participant?.isSuperAdmin;
        }

        // طرد عضو
        if (command.startsWith('.طرد')) {
            if (!(await thinkIsAdmin(msg))) return msg.reply('⌫┇هـذا الامـر لـي ادمـن الـمـجـمـوعـة فـقـط يـا حـب┇〄');
            const mentioned = msg.mentionedIds[0];
            if (!mentioned) return msg.reply('حدد الشخص بعد الأمر.');
            const chat = await msg.getChat();
            await chat.removeParticipants([mentioned]);
            msg.reply('✅ تم الطرد.');
        }

        // ترقية أدمن
        if (command.startsWith('.ترقية')) {
            if (!(await thinkIsAdmin(msg))) return msg.reply('⌫┇هـذا الامـر لـي ادمـن الـمـجـمـوعـة فـقـط يـا حـب┇〄');
            const mentioned = msg.mentionedIds[0];
            const chat = await msg.getChat();
            await chat.promoteParticipants([mentioned]);
            msg.reply('✅ تم ترقية العضو لمشرف.');
        }

        // خفض أدمن
        if (command.startsWith('.خفض')) {
            if (!(await thinkIsAdmin(msg))) return msg.reply('⌫┇هـذا الامـر لـي ادمـن الـمـجـمـوعـة فـقـط يـا حـب┇〄');
            const mentioned = msg.mentionedIds[0];
            const chat = await msg.getChat();
            await chat.demoteParticipants([mentioned]);
            msg.reply('✅ تم خفض العضو.');
        }

        // ✅ قسم الأسئلة الدينية - OpenRouter AI Integration
        const axios = require('axios'); // تأكد أنك مثبت axios

        client.on('message', async (msg) => {
            const command = msg.body.trim().toLowerCase();

            const religiousCommands = [
                ".معلومة_دينية_عشوائية",
                ".سؤال_نبوي",
                ".سؤال_حديث",
                ".سؤال_قران",
                ".سؤال_ديني"
            ];

            if (!religiousCommands.includes(command)) return;

            const promptMap = {
                ".معلومة_دينية_عشوائية": "قدم لي معلومة دينية عشوائية باللغة العربية مع شرح مبسط.",
                ".سؤال_نبوي": "اطرح سؤالًا عن سيرة النبي محمد صلى الله عليه وسلم مع 3 خيارات وإجابة صحيحة.",
                ".سؤال_حديث": "اطرح سؤالًا عن حديث نبوي شريف مع 3 خيارات وإجابة صحيحة.",
                ".سؤال_قران": "اطرح سؤالًا عن آيات أو سور من القرآن الكريم مع 3 خيارات وإجابة صحيحة.",
                ".سؤال_ديني": "اطرح سؤالًا دينيًا عشوائيًا مع 3 خيارات وإجابة صحيحة."
            };

            try {
                const res = await axios.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    {
                        model: "gpt-4o-mini",
                        messages: [
                            { role: "system", content: "أنت مساعد يقدم أسئلة ومعلومات دينية باللغة العربية." },
                            { role: "user", content: promptMap[command] }
                        ],
                        max_tokens: 500,
                        temperature: 0.7
                    },
                    {
                        headers: {
                            "Authorization": "Bearer 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", // ← استبدله بمفتاحك الحقيقي
                            "Content-Type": "application/json"
                        }
                    }
                );

                const reply = res.data.choices?.[0]?.message?.content;
                if (reply) {
                    await msg.reply(reply);
                } else {
                    await msg.reply("لم أتمكن من توليد الرد في الوقت الحالي.");
                }

            } catch (err) {
                console.error("🚨 حدث خطأ:", err.response?.data || err.message);
                await msg.reply("⚠️ حدث خطأ أثناء التواصل مع الذكاء الاصطناعي. حاول لاحقًا.");
            }
        });

        // رايزو4 - أوامر الاستمارات
        if (command === '.رايزو4') {
            return msg.reply(`
༺━─━─╃⌬〔⚔〕⌬╄─━─━༻
⌫┇قــســم الاســتــمــارات┇〄
✠ ━━ • ━ ‹✤› ━ • ━━ ✠ 
❐┇.حفظ_استمارة [هنا_الاستمارة] اسم_الاستمارة』
> ⧉↫لي حفظ الاستمارة❯
❐┇.استمارة اسم_الاستمارة 』
> ⧉↫لي استدعاء الاستمارة باسمها❯
❐┇.حذف_الاستمارات 』
> ⧉↫لي حذف جميع الاستمارات❯
❐┇.كل_الاستمارات 』
> ⧉لي ارسال كل الاستمارات (اسامي الاستمارات فقط)❯
༺━─━─╃⌬〔⚔〕⌬╄─━─━༻
> 𝙱𝚈┇𝚁𝙰𝙸𝚉𝙾 𝙱𝙾𝚃`);
        }

        // رايزو5 - أوامر الألقاب
        if (command === '.رايزو5') {
            return msg.reply(`
༺━─━─╃⌬〔⚔〕⌬╄─━─━༻
⌫┇اوامـــر الالـــقـــاب┇〄
✠ ━━ • ━ ‹✤› ━ • ━━ ✠ 
❐┇.تسجيل_لقب 』
> ⧉↫ طريقة الكتابة: (.تسجيل_لقب @منشن_الشخص اللقب) لتسجيل الالقاب❯
❐┇.مسح_لقب 』
> ⧉↫ طريقة الكتابة: (.مسح_لقب @منشن_الشخص) لحذف لقبه اذا كان مسجل❯
❐┇.تغير_لقب 』
> ⧉↫ طريقة الكتابة: (.تغير_لقب @منشن_الشخص لقب_الجديد❯
❐┇.تصفية_الالقاب 』
> ⧉↫ لي مسح الالقاب الي مسجلين لاشخاص طالعين من القروب❯
❐┇.مسح_الالقاب 』
> ⧉↫ لي مسح كل الالقاب❯
❐┇.الالقاب 』
> ⧉↫ بيكتب كل الالقاب الي مسجلة مثل (بوروتو @منشن_صاحب_اللقب❯
❐┇.لقب 』
> ⧉↫ طريقة الكتابة: .لقب @شخص ليظهر لقبه❯
❐┇.لقبي』
> ⧉↫ لاظهار لقبك
༺━─━─╃⌬〔⚔〕⌬╄─━─━༻
> 𝙱𝚈┇𝚁𝙰𝙸𝚉𝙾 𝙱𝙾𝚃;
    `);
        }

        db.data.titles = db.data.titles || {};

        // إعطاء لقب - للمشرفين فقط في القروبات
        if (command.startsWith('.تسجيل_لقب ')) {
            if (!isGroup || !isAdmin) {
                return msg.reply('🚫 هذا الأمر متاح للمشرفين فقط في المجموعات.');
            }
            const parts = msg.body.split(' ');
            if (parts.length < 3) {
                return msg.reply('❗ استخدم: .تسجيل_لقب رقم_الهاتف اللقب\nمثال: .تسجيل_لقب 123456789 لقب');
            }
            const number = parts[1].replace(/\D/g, '') + '@c.us';
            const title = parts.slice(2).join(' ');
            db.data.titles[number] = title;
            await db.write();
            msg.reply(`✅ تم تسجيل لقب لـ ${parts[1]}: ${title}`);
        }

        // مسح لقب - للمشرفين فقط في القروبات
        if (command.startsWith('.مسح_لقب ')) {
            if (!isGroup || !isAdmin) {
                return msg.reply('🚫 هذا الأمر متاح للمشرفين فقط في المجموعات.');
            }
            const number = msg.body.split(' ')[1]?.replace(/\D/g, '') + '@c.us';
            if (!db.data.titles[number]) {
                return msg.reply('❗ لا يوجد لقب مسجل لهذا الرقم.');
            }
            delete db.data.titles[number];
            await db.write();
            msg.reply('🗑️ تم حذف اللقب بنجاح.');
        }

        // عرض لقب الشخص الذي أرسل الرسالة (.لقبي) - متاح للجميع
        if (command === '.لقبي') {
            const senderId = msg.from; // في الخاص أو الجروب
            const title = db.data.titles[senderId];
            if (title) {
                msg.reply(`🎖️ لقبك هو: ${title}`);
            } else {
                msg.reply('🚫 لا يوجد لقب محفوظ لك.');
            }
        }

        // عرض لقب شخص آخر (.لقب 123456789) - متاح للجميع
        if (command.startsWith('.لقب ')) {
            const number = msg.body.split(' ')[1]?.replace(/\D/g, '') + '@c.us';
            const title = db.data.titles[number];
            if (title) {
                msg.reply(`🎖️ لقب الشخص ${number.split('@')[0]} هو: ${title}`);
            } else {
                msg.reply('🚫 لا يوجد لقب محفوظ لهذا الرقم.');
            }
        }

        // عرض كل الألقاب (.الالقاب) - متاح للجميع
        if (command === '.الالقاب') {
            const titles = db.data.titles;
            if (Object.keys(titles).length === 0) {
                return msg.reply('🚫 لا توجد ألقاب مسجلة حتى الآن.');
            }
            let text = '🏅 *قائمة الألقاب:*\n\n';
            for (const [num, title] of Object.entries(titles)) {
                text += `• ${num.split('@')[0]}: ${title}\n`;
            }
            msg.reply(text);
        }



        // دالة إرسال قائمة الأوامر الرئيسية
        if (command === '.الاوامر' || command === '.اوامر') {
            const contact = await msg.getContact();
            const userName = contact.pushname || contact.name || 'مستخدم';

            return msg.reply(`
        ༺━─━─╃⌬〔⚔〕⌬╄─━─━༻
        『 👤┇قائــمــة الاوامــــر┇👤』
        ❐═━━━═╊⊰⚔⊱╉═━━━═❐
        【🌟┇اهـلا بـك ⟣ ${userName}】
        ✠ ━━ • ━ ‹✤› ━ • ━━ ✠ 
        『🤖┇مـعـلـومـات الـبـوت┇🤖』
        ✠ ━━ • ━ ‹✤› ━ • ━━ ✠ 
        【⚔┇اسـم الـبـوت ⟣ رايزو】
        【🀄┇الـوضـع ⟣ عام】 
        【🌀┇الـمـنـصـة ⟣ قروب】 
        【🌐┇قـبـل كـل أمـر ⟣ .】
        ❐═━━━═╊⊰⚔⊱╉═━━━═❐
        ❐┇.رايزو1 』
        ⧉↫اوامـر الـحـمـايـة ❯
        ❐┇.رايزو2 』
        ⧉↫اوامـر الـجـروبـات ❯
        ❐┇.رايزو3 』
        ⧉↫قــســم ديــنــي ❯ 
        ❐┇.رايزو4 』
        ⧉↫قــســم الاسـتـمـارات ❯
        ❐┇.رايزو5 』
        ⧉↫قـسـم الالـقـاب ❯
        ༺━─━─╃⌬〔⚔〕⌬╄─━─━༻
        > 𝙱𝚈┇𝚁𝙸𝙰𝚉𝙾 𝙱𝙾𝚃`);
        }

        // منشن جماعي
        client.on('message', async (msg) => {
            if (msg.body.startsWith('.منشن')) {
                if (!msg.isGroupMsg) {
                    return msg.reply('❌ هذا الأمر يعمل فقط في المجموعات.');
                }

                const chat = await msg.getChat();
                if (!chat.isGroup) return;

                // استخراج السبب من الرسالة
                const reason = msg.body.slice(6).trim() || "لا يوجد سبب محدد";

                let mentions = [];
                let admins = [];
                let members = [];

                for (let participant of chat.participants) {
                    const contact = await client.getContactById(participant.id._serialized);
                    mentions.push(contact);

                    const mentionLine = `@${contact.number}`;

                    if (participant.isAdmin || participant.isSuperAdmin) {
                        admins.push(mentionLine);
                    } else {
                        members.push(mentionLine);
                    }
                }

                // تجهيز قائمة المنشن كمجموعة مرقمة
                const formatList = (arr) => arr.map((mention, index) => `${index + 1}- ${mention}`).join('\n');

                const message = `
        ༺━─━─╃⌬〔⚔〕⌬╄─━─━༻
        〄┇منشن جماعي┇〄
        ✠ ━━ • ━ ‹✤› ━ • ━━ ✠ 
        السبب: ${reason}

        ⌬ المشرفين ⌬
        ${formatList(admins) || "لا يوجد مشرفين"}

        ⌬ الأعضاء ⌬
        ${formatList(members) || "لا يوجد أعضاء"}

        ༺━─━─╃⌬〔⚔〕⌬╄─━─━༻
        > 𝙱𝚈┇𝚁𝙰𝙸𝚉𝙾 𝙱𝙾𝚃
                `.trim();

                await chat.sendMessage(message, { mentions });
            }
        });

        // مخفي
        if (command === '.مخفي') {
            if (!isGroup) return msg.reply('هذا الأمر خاص بالمجموعات فقط.');
            if (!isAdmin) return msg.reply('⌫┇هـذا الامـر لـي ادمـن الـمـجـمـوعـة فـقـط يـا حـب┇〄');

            const chat = await msg.getChat();
            let mentions = [];
            for (const participant of chat.participants) {
                const contact = await client.getContactById(participant.id._serialized);
                mentions.push(contact);
            }
            let text = args.slice(1).join(' ') || 'مخفي جماعي للجميع!';
            await chat.sendMessage(text, { mentions });
            return;
        }

        const { MessageMedia } = require('whatsapp-web.js');
        const fs = require('fs');
        const path = require('path');

        const googleTTS = require('google-tts-api');

        // 🟢 تحويل صورة إلى ملصق عند كتابة "ملصق"
        if (msg.body.toLowerCase() === 'ملصق' && msg.hasMedia) {
            const media = await msg.downloadMedia();
            if (media.mimetype.startsWith('image/')) {
                await msg.reply(media, null, { sendMediaAsSticker: true });
            } else {
                msg.reply('الرجاء إرسال صورة مع كلمة "ملصق".');
            }
        }


        // 🟢 تحويل ملصق إلى صورة
        if (msg.body === '.صورة_ملصق' && msg.hasMedia) {
            const media = await msg.downloadMedia();
            if (media.mimetype === 'image/webp') {
                await msg.reply(media, null, { sendMediaAsDocument: true });
            } else {
                msg.reply('هذا ليس ملصقاً! أرسل الملصق مع الأمر.');
            }
        }

        // 🟢 تحويل نص إلى صوت
        if (msg.body.startsWith('.انطق ')) {
            const text = msg.body.slice(7);
            if (!text) return msg.reply('❗ أرسل نص بعد الأمر: .انطق مرحباً');

            try {
                const url = googleTTS.getAudioUrl(text, {
                    lang: 'ar',
                    slow: false,
                    host: 'https://translate.google.com',
                });
                const response = await axios.get(url, { responseType: 'arraybuffer' });
                const media = new MessageMedia('audio/mpeg', Buffer.from(response.data).toString('base64'), 'voice.mp3');
                await client.sendMessage(msg.from, media, { sendAudioAsVoice: true });
            } catch (e) {
                msg.reply('⚠️ حدث خطأ أثناء تحويل النص إلى صوت.');
            }
        }
    });

    client.on('qr', qr => {
        console.log('🟡 امسح رمز QR في واتساب:', qr);
    });

    client.on('ready', () => {
        console.log('✅ البوت جاهز!');
    });

    client.on('auth_failure', msg => {
        console.error('❌ فشل في تسجيل الدخول:', msg);
    });

    client.on('disconnected', reason => {
        console.log('⚠️ تم قطع الاتصال:', reason);
    });
    // بدء البوت
    client.initialize();
})();