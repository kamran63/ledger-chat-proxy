// api/chat.js  (نسخه CommonJS مخصوص Netlify Functions)
exports.handler = async function (event) {
    // فقط درخواست‌های POST را قبول می‌کنیم
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'فقط متد POST قبول است' }),
        };
    }

    try {
        const { messages, tools } = JSON.parse(event.body);
        const apiKey = process.env.OPENAI_API_KEY;

        // بررسی وجود کلید API در تنظیمات Netlify
        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'کلید API در سرور تنظیم نشده است. به Netlify Environment Variables بروید.' }),
            };
        }

        // اتصال به AvalAI با دامنه بین‌المللی (مناسب برای سرورهای خارج از ایران)
        const response = await fetch('https://api.avalai.org/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'تو یک دستیار حسابداری فارسی‌زبان هستی. کارها را با توابع انجام بده.',
                    },
                    ...messages,
                ],
                tools: tools,
                tool_choice: 'auto',
            }),
        });

        // اگر AvalAI پاسخی غیر از 200 داد، خطای آن را برگردان
        if (!response.ok) {
            const errText = await response.text();
            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: `AvalAI پاسخ خطا داد (${response.status}): ${errText}`,
                }),
            };
        }

        const data = await response.json();
        const message = data.choices[0].message;

        // ارسال موفقیت‌آمیز پاسخ به برنامه
        return {
            statusCode: 200,
            body: JSON.stringify({
                reply: message.content,
                tool_calls: message.tool_calls || [],
            }),
        };
    } catch (error) {
        // خطای غیرمنتظره (مثلاً قطعی شبکه)
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'خطای سرور',
                message: error.message,
            }),
        };
    }
};
