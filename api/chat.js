// api/chat.js  (نسخه CommonJS با پشتیبانی CORS)
exports.handler = async function (event) {
    // هدرهای CORS برای رفع خطای fetch در مرورگر
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    // مدیریت درخواست پیش‌پرواز (Preflight) که مرورگرهای موبایل گاهی می‌فرستند
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: '',
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'فقط متد POST قبول است' }),
        };
    }

    try {
        const { messages, tools } = JSON.parse(event.body);
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'کلید API تنظیم نشده' }),
            };
        }

        const response = await fetch('https://api.avalai.org/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'تو یک دستیار حسابداری فارسی‌زبان هستی.' },
                    ...messages,
                ],
                tools: tools,
                tool_choice: 'auto',
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: `خطای AvalAI (${response.status}): ${errText}` }),
            };
        }

        const data = await response.json();
        const message = data.choices[0].message;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                reply: message.content,
                tool_calls: message.tool_calls || [],
            }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'خطای سرور', message: error.message }),
        };
    }
};
