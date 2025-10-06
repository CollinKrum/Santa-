export default async function handler(req, res) {
  console.log('Santa voice function called');

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

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    console.error('ELEVENLABS_API_KEY not found');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    console.log('Calling ElevenLabs API...');
    
    // Using your custom voice ID
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/qcCzblsmCNtnHtRI0C5j', {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.1,
          similarity_boost: 0.25
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs API error:', response.status, error);
      return res.status(response.status).json({ 
        error: 'ElevenLabs API request failed',
        details: error
      });
    }

    console.log('Success! Sending audio...');
    const audioBuffer = await response.arrayBuffer();
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audioBuffer));
    
  } catch (error) {
    console.error('Error generating voice:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}
