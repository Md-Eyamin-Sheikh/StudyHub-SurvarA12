const OpenAI = require('openai');
require('dotenv').config();

// Debug: Check if API key is loaded
if (!process.env.OPENROUTER_API_KEY) {
  console.error('OPENROUTER_API_KEY not found in environment variables');
} else {
  console.log('OPENROUTER_API_KEY loaded successfully');
}

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://resilient-vacherin-ecfaf3.netlify.app",
    "X-Title": "StudyHub - Collaborative Study Platform",
  }
});

async function getChatbotResponse(userMessage) {
  try {
    const completion = await client.chat.completions.create({
      model: "deepseek/deepseek-r1",
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content: "You are StudyHub AI Assistant, a helpful AI for an educational platform that connects students and tutors. Help users with study sessions, tutoring, course materials, bookings, payments, and educational guidance. Be friendly, informative, and concise."
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Chatbot error:', error);
    return "I'm sorry, I'm having trouble responding right now. Please try again later.";
  }
}

module.exports = { getChatbotResponse };
