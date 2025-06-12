console.log("بدء تشغيل الكود")
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

// إنشاء المجلدات اللازمة إذا لم تكن موجودة
if (!fs.existsSync('./forms')) {
    fs.mkdirSync('./forms');
}

if (!fs.existsSync('./games')) {
    fs.mkdirSync('./games');
}

if (!fs.existsSync('./questions')) {
    fs.mkdirSync('./questions');
    fs.mkdirSync('./questions/quran', { recursive: true });
    fs.mkdirSync('./questions/prophet', { recursive: true });
    fs.mkdirSync('./questions/hadith', { recursive: true });
}

// إنشاء ملف لتخزين الإعدادات إذا لم يكن موجوداً
if (!fs.existsSync('./settings.json')) {
    fs.writeFileSync('./settings.json', JSON.stringify({
        adminOnlyMode: false,
        groups: {},
        activeGames: {}
    }));
}

// قراءة الإعدادات
let settings = JSON.parse(fs.readFileSync('./settings.json'));

// إنشاء عميل واتساب
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

// عرض رمز QR للمصادقة
client.on('qr', (qr) => {
    console.log('QR Code received, scan it with your phone:');
    qrcode.generate(qr, { small: true });
});

// عند جاهزية العميل
client.on('ready', () => {
    console.log('Client is ready!');
});

// التحقق مما إذا كان المستخدم مشرفاً في المجموعة
async function isAdmin(groupId, userId) {
    try {
        const chat = await client.getChatById(groupId);
        if (!chat.isGroup) return false;

        const participants = await chat.participants;
        const participant = participants.find(p => p.id._serialized === userId);

        return participant && participant.isAdmin;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// التحقق من وضع "البوت للمشرفين فقط"
function isAdminOnlyMode(groupId) {
    if (!settings.groups[groupId]) {
        settings.groups[groupId] = { adminOnlyMode: false };
        saveSettings();
    }
    return settings.groups[groupId].adminOnlyMode;
}

// حفظ الإعدادات
function saveSettings() {
    fs.writeFileSync('./settings.json', JSON.stringify(settings, null, 2));
}

// بيانات الألعاب
const gameWords = {
    disassemble: ['واتساب', 'تيليجرام', 'انستغرام', 'فيسبوك', 'تويتر', 'يوتيوب', 'انمي', 'مانجا', 'قروب', 'مشرف'],
    assemble: ['ب و ت', 'ا ن م ي', 'م ش ر ف', 'ق ر و ب', 'و ا ت س ا ب', 'ت ي ل ي ج ر ا م', 'ف ي س ب و ك'],
    typing: ['سرعة الكتابة', 'انمي', 'مانجا', 'واتساب', 'بوت رايزو', 'قروب الانمي', 'مرحبا بالجميع'],
    reverse: ['انمي', 'مانجا', 'واتساب', 'تيليجرام', 'مشرف', 'قروب', 'رايزو']
};

// أسئلة دينية
const religiousQuestions = {
    quran: [
        { question: 'كم عدد سور القرآن الكريم؟', answer: '114' },
        { question: 'ما هي أطول سورة في القرآن الكريم؟', answer: 'البقرة' },
        { question: 'ما هي أقصر سورة في القرآن الكريم؟', answer: 'الكوثر' }
    ],
    prophet: [
        { question: 'متى ولد النبي محمد صلى الله عليه وسلم؟', answer: 'عام الفيل' },
        { question: 'ما اسم أم النبي محمد صلى الله عليه وسلم؟', answer: 'آمنة بنت وهب' },
        { question: 'ما اسم زوجة النبي الأولى؟', answer: 'خديجة' }
    ],
    hadith: [
        { question: 'أكمل الحديث: "إنما الأعمال..."', answer: 'بالنيات' },
        { question: 'من هو راوي حديث "من حسن إسلام المرء تركه ما لا يعنيه"؟', answer: 'أبو هريرة' },
        { question: 'كم عدد الأحاديث في صحيح البخاري؟', answer: '7563' }
    ]
};

// بدء لعبة جديدة
function startGame(groupId, gameType) {
    if (!settings.activeGames) {
        settings.activeGames = {};
    }

    let word = '';
    let answer = '';

    switch (gameType) {
        case 'disassemble':
            word = gameWords.disassemble[Math.floor(Math.random() * gameWords.disassemble.length)];
            answer = word.split('').join(' ');
            break;
        case 'assemble':
            word = gameWords.assemble[Math.floor(Math.random() * gameWords.assemble.length)];
            answer = word.replace(/ /g, '');
            break;
        case 'typing':
            word = gameWords.typing[Math.floor(Math.random() * gameWords.typing.length)];
            answer = word;
            break;
        case 'reverse':
            word = gameWords.reverse[Math.floor(Math.random() * gameWords.reverse.length)];
            answer = word.split('').reverse().join('');
            break;
    }

    settings.activeGames[groupId] = {
        type: gameType,
        word: word,
        answer: answer,
        startTime: Date.now(),
        active: true
    };

    saveSettings();
    return word;
}

// بدء سؤال ديني
function startReligiousQuestion(groupId, questionType) {
    if (!settings.activeGames) {
        settings.activeGames = {};
    }

    let questions;
    switch (questionType) {
        case 'quran':
            questions = religiousQuestions.quran;
            break;
        case 'prophet':
            questions = religiousQuestions.prophet;
            break;
        case 'hadith':
            questions = religiousQuestions.hadith;
            break;
    }

    const questionObj = questions[Math.floor(Math.random() * questions.length)];

    settings.activeGames[groupId] = {
        type: 'question',
        questionType: questionType,
        question: questionObj.question,
        answer: questionObj.answer,
        startTime: Date.now(),
        active: true
    };

    saveSettings();
    return questionObj.question;
}

// التحقق من إجابة اللعبة
function checkGameAnswer(groupId, answer) {
    if (!settings.activeGames || !settings.activeGames[groupId] || !settings.activeGames[groupId].active) {
        return { correct: false, message: 'لا توجد لعبة نشطة حالياً' };
    }

    const game = settings.activeGames[groupId];
    const correctAnswer = game.answer.trim().toLowerCase();
    const userAnswer = answer.trim().toLowerCase();

    if (correctAnswer === userAnswer) {
        const timeTaken = ((Date.now() - game.startTime) / 1000).toFixed(2);
        game.active = false;
        saveSettings();

        return {
            correct: true,
            message: `إجابة صحيحة! 🎉\nالوقت المستغرق: ${timeTaken} ثانية`,
            timeTaken: timeTaken
        };
    }

    return { correct: false };
}

// معالجة الرسائل الواردة
client.on('message', async (message) => {
    try {
        const chat = await message.getChat();
        const sender = await message.getContact();
        const senderId = sender.id._serialized;

        // تجاهل الرسائل من غير المجموعات
        if (!chat.isGroup) return;

        const groupId = chat.id._serialized;
        const isUserAdmin = await isAdmin(groupId, senderId);
        const adminOnlyMode = isAdminOnlyMode(groupId);

        // التحقق من الألعاب النشطة
        if (settings.activeGames && settings.activeGames[groupId] && settings.activeGames[groupId].active) {
            const result = checkGameAnswer(groupId, message.body);
            if (result.correct) {
                await message.reply(`${result.message}\nالفائز: @${sender.number}`, { mentions: [sender] });
                return;
            }
        }

        // التحقق من الأوامر الأساسية
        if (message.body === '.بوت' || message.body === '.رايزو') {
            await message.reply('هلا');
            return;
        }

        // التحقق من أوامر المشرفين
        if (message.body === '.اوامر') {
            let commandsText = '*قائمة الأوامر:*\n\n';

            // قسم الأوامر العامة
            commandsText += '*الأوامر العامة:*\n';
            commandsText += '• .بوت أو .رايزو - للتحقق من حالة البوت\n';
            commandsText += '• .اوامر - لعرض قائمة الأوامر\n\n';

            // قسم أوامر المشرفين
            commandsText += '*أوامر المشرفين:*\n';
            commandsText += '• .طرد @المستخدم - لطرد مستخدم من المجموعة\n';
            commandsText += '• .اعفاء @المستخدم - لإزالة الإشراف عن مستخدم\n';
            commandsText += '• .اضافة_عضو @رقم - لإضافة مستخدم إلى المجموعة\n';
            commandsText += '• .تشغيل_البوت_بس_للادمن - لتفعيل وضع المشرفين فقط\n';
            commandsText += '• .اطفاء_البوت_بس_للادمن - لإلغاء وضع المشرفين فقط\n\n';

            // قسم الاستمارات (للمشرفين فقط)
            commandsText += '*أوامر الاستمارات (للمشرفين فقط):*\n';
            commandsText += '• .اضافة_استمارة الاسم=اسم_الاستمارة - لإضافة استمارة جديدة\n';
            commandsText += '• استمارة_اسم_الاستمارة - لاستخدام استمارة محفوظة\n\n';

            // قسم الفعاليات
            commandsText += '*🎮 قسم الفعاليات:*\n';
            commandsText += '• .تفكيك - بدء لعبة تفكيك الكلمات\n';
            commandsText += '• .تركيب - بدء لعبة تركيب الكلمات\n';
            commandsText += '• .كتابة - بدء لعبة سرعة الكتابة\n';
            commandsText += '• .عكس - بدء لعبة عكس الكلمة\n\n';

            // قسم الأسئلة الدينية
            commandsText += '*🕌 قسم الأسئلة الدينية:*\n';
            commandsText += '• .سؤال_قرآن - طرح سؤال من القرآن الكريم\n';
            commandsText += '• .سؤال_نبوي - طرح سؤال عن السيرة النبوية\n';
            commandsText += '• .سؤال_حديث - طرح سؤال من الأحاديث النبوية\n';

            await message.reply(commandsText);
            return;
        }

        // التحقق من وضع المشرفين فقط
        if (adminOnlyMode && !isUserAdmin) {
            return; // تجاهل الرسائل من غير المشرفين في وضع المشرفين فقط
        }

        // أوامر الفعاليات (متاحة للجميع إذا لم يكن وضع المشرفين فقط مفعلاً)
        if (message.body === '.تفكيك') {
            const word = startGame(groupId, 'disassemble');
            await message.reply(`*🎮 لعبة تفكيك الكلمات*\n\nقم بتفكيك الكلمة التالية (اكتب الحروف مفصولة بمسافات):\n\n*${word}*`);
            return;
        }

        if (message.body === '.تركيب') {
            const word = startGame(groupId, 'assemble');
            await message.reply(`*🎮 لعبة تركيب الكلمات*\n\nقم بتركيب الكلمة التالية (اكتب الكلمة بدون مسافات):\n\n*${word}*`);
            return;
        }

        if (message.body === '.كتابة') {
            const word = startGame(groupId, 'typing');
            await message.reply(`*🎮 لعبة سرعة الكتابة*\n\nاكتب الجملة التالية بسرعة:\n\n*${word}*`);
            return;
        }

        if (message.body === '.عكس') {
            const word = startGame(groupId, 'reverse');
            await message.reply(`*🎮 لعبة عكس الكلمة*\n\nقم بكتابة الكلمة التالية بالعكس:\n\n*${word}*`);
            return;
        }

        // أوامر الأسئلة الدينية
        if (message.body === '.سؤال_قرآن') {
            const question = startReligiousQuestion(groupId, 'quran');
            await message.reply(`*📘 سؤال من القرآن الكريم*\n\n${question}`);
            return;
        }

        if (message.body === '.سؤال_نبوي') {
            const question = startReligiousQuestion(groupId, 'prophet');
            await message.reply(`*🕋 سؤال من السيرة النبوية*\n\n${question}`);
            return;
        }

        if (message.body === '.سؤال_حديث') {
            const question = startReligiousQuestion(groupId, 'hadith');
            await message.reply(`*📜 سؤال من الأحاديث النبوية*\n\n${question}`);
            return;
        }

        // أوامر المشرفين
        if (isUserAdmin) {
            // أمر طرد مستخدم
            if (message.body.startsWith('.طرد ')) {
                const mentionedUsers = await message.getMentions();

                if (mentionedUsers.length === 0) {
                    await message.reply('يرجى ذكر المستخدم الذي تريد طرده باستخدام @');
                    return;
                }

                const userToKick = mentionedUsers[0];
                const userToKickId = userToKick.id._serialized;

                try {
                    await chat.removeParticipants([userToKickId]);
                    await message.reply(`تم طرد @${userToKick.number} من المجموعة`, { mentions: [userToKick] });
                } catch (error) {
                    await message.reply('فشل طرد المستخدم. تأكد من أن لديك الصلاحيات اللازمة.');
                }
                return;
            }

            // أمر إزالة الإشراف
            if (message.body.startsWith('.اعفاء ')) {
                const mentionedUsers = await message.getMentions();

                if (mentionedUsers.length === 0) {
                    await message.reply('يرجى ذكر المستخدم الذي تريد إزالة الإشراف عنه باستخدام @');
                    return;
                }

                const userToDemote = mentionedUsers[0];
                const userToDemoteId = userToDemote.id._serialized;

                try {
                    await chat.demoteParticipants([userToDemoteId]);
                    await message.reply(`تم إزالة الإشراف عن @${userToDemote.number}`, { mentions: [userToDemote] });
                } catch (error) {
                    await message.reply('فشل إزالة الإشراف. تأكد من أن لديك الصلاحيات اللازمة.');
                }
                return;
            }

            // أمر إضافة عضو
            if (message.body.startsWith('.اضافة_عضو ')) {
                const numberToAdd = message.body.split(' ')[1].replace('@', '');

                if (!numberToAdd) {
                    await message.reply('يرجى تحديد رقم المستخدم الذي تريد إضافته');
                    return;
                }

                // تنسيق رقم الهاتف بالصيغة الصحيحة
                let formattedNumber = numberToAdd;
                if (!formattedNumber.includes('@c.us')) {
                    formattedNumber = `${formattedNumber}@c.us`;
                }

                try {
                    await chat.addParticipants([formattedNumber]);
                    await message.reply(`تمت إضافة المستخدم ${numberToAdd} إلى المجموعة`);
                } catch (error) {
                    await message.reply('فشل إضافة المستخدم. تأكد من صحة الرقم وأن لديك الصلاحيات اللازمة.');
                }
                return;
            }

            // أمر تفعيل وضع المشرفين فقط
            if (message.body === '.تشغيل_البوت_بس_للادمن') {
                if (!settings.groups[groupId]) {
                    settings.groups[groupId] = {};
                }
                settings.groups[groupId].adminOnlyMode = true;
                saveSettings();
                await message.reply('تم تفعيل وضع "البوت للمشرفين فقط"');
                return;
            }

            // أمر إلغاء وضع المشرفين فقط
            if (message.body === '.اطفاء_البوت_بس_للادمن') {
                if (!settings.groups[groupId]) {
                    settings.groups[groupId] = {};
                }
                settings.groups[groupId].adminOnlyMode = false;
                saveSettings();
                await message.reply('تم إلغاء وضع "البوت للمشرفين فقط"');
                return;
            }

            // أمر إضافة استمارة (للمشرفين فقط)
            if (message.body.startsWith('.اضافة_استمارة ')) {
                const formContent = message.body.substring('.اضافة_استمارة '.length);
                const formNameMatch = formContent.match(/الاسم=([^\s]+)/);

                if (!formNameMatch) {
                    await message.reply('صيغة الأمر غير صحيحة. الرجاء استخدام: .اضافة_استمارة محتوى_الاستمارة الاسم=اسم_الاستمارة');
                    return;
                }

                const formName = formNameMatch[1];
                let formText = formContent.replace(`الاسم=${formName}`, '').trim();

                // حفظ الاستمارة في ملف
                fs.writeFileSync(`./forms/${formName}.txt`, formText);
                await message.reply(`تم حفظ الاستمارة باسم: ${formName}`);
                return;
            }

            // استخدام الاستمارات (للمشرفين فقط)
            if (message.body.startsWith('استمارة_')) {
                const formName = message.body.substring('استمارة_'.length);
                const formPath = `./forms/${formName}.txt`;

                if (fs.existsSync(formPath)) {
                    const formContent = fs.readFileSync(formPath, 'utf8');
                    await message.reply(formContent);
                } else {
                    await message.reply(`الاستمارة "${formName}" غير موجودة`);
                }
                return;
            }
        }

    } catch (error) {
        console.error('Error processing message:', error);
    }
});

// تشغيل العميل
client.initialize();
