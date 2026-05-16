// api/chat.js  (CommonJS version)
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

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'کلید API در سرور تنظیم نشده است.' }),
            };
        }

        const response = await fetch('https://api.avalai.ir/v1/chat/completions', {
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
                        content:
                            'تو یک دستیار حسابداری فارسی‌زبان هستی. کارها را با توابع انجام بده.',
                    },
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
                body: JSON.stringify({
                    error: `AvalAI پاسخ خطا داد (${response.status}): ${errText}`,
                }),
            };
        }

        const data = await response.json();
        const message = data.choices[0].message;

        return {
            statusCode: 200,
            body: JSON.stringify({
                reply: message.content,
                tool_calls: message.tool_calls || [],
            }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'خطای سرور',
                message: error.message,
            }),
        };
    }
};
