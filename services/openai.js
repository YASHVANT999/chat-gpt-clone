const { Configuration, OpenAIApi } = require('openai');

class OpenAIService {
  constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);
  }

 static async summarizeChat(messages) {
    try {
      const messageText = messages
        .map(m => `${new Date(m.timestamp).toISOString()}: ${m.message}`)
        .join('\n');

      const response = await this.openai.createCompletion({
        model: "text-davinci-003",
        prompt: `Please provide a concise summary of the following chat:\n\n${messageText}`,
        max_tokens: 150,
        temperature: 0.7,
      });

      return response.data.choices[0].text.trim();
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate chat summary');
    }
  }
}