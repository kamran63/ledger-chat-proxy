export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    const { messages, tools } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'کلید API تنظیم نشده' });

    try {
        const response = await fetch('https://api.avalai.ir/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'تو یک دستیار حسابداری فارسی‌زبان هستی. کارها را با توابع انجام بده.' },
                    ...messages
                ],
                tools: tools,
                tool_choice: 'auto'
            })
        });
        const data = await response.json();
        const message = data.choices[0].message;
        return res.json({
            reply: message.content,
            tool_calls: message.tool_calls || []
        });
    } catch (error) {
        return res.status(500).json({ error: 'خطا در ارتباط با AvalAI' });
    }
}
