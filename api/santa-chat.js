export default async function handler(req, res) {
  console.log('Santa chat function called');
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { message, childName, chatHistory } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not found');
    return res.status(500).json({ error: 'API key not configured' });
  }
  
  try {
    console.log('Calling Claude API for chat...');
    
    const name = childName || 'friend';
    const messages = chatHistory || [];
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `You are Santa Claus chatting with a child named ${name}. Be warm, jolly, kind, and magical. Use "ho ho ho" occasionally. Keep responses short and child-friendly (2-4 sentences). Talk about Christmas, the North Pole, reindeer, elves, toys, and being good. Always be encouraging and positive. Never break character.`,
        messages: [
          ...messages,
          { role: 'user', content: message }
        ]
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Claude API error:', response.status, error);
      return res.status(response.status).json({ 
        error: 'Claude API request failed',
        details: error
      });
    }
    
    const data = await response.json();
    console.log('Success! Sending response...');
    
    res.status(200).json({
      reply: data.content[0].text
    });
    
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}
