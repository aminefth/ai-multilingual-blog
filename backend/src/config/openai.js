const OpenAI = require('openai');
const config = require('./config');

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

/**
 * Generate blog content using OpenAI GPT-4
 * @param {Object} options - Content generation options
 * @param {String} options.topic - The main topic of the blog post
 * @param {String} options.title - The title of the blog post
 * @param {Array<String>} options.keywords - Keywords to include in the content
 * @param {String} options.tone - The tone of the content (professional, casual, etc.)
 * @param {Number} options.wordCount - The approximate desired word count
 * @param {String} options.language - The language for content generation (en, fr, de, es)
 * @returns {Promise<String>} - Generated blog content
 */
const generateBlogContent = async (options) => {
  try {
    const { topic, title, keywords, tone = 'professional', wordCount = 1000, language = 'en' } = options;
    
    // Define language-specific prompts
    const languagePrompt = {
      en: 'Write in English',
      fr: 'Écrivez en français (Write in French)',
      de: 'Schreiben Sie auf Deutsch (Write in German)',
      es: 'Escribe en español (Write in Spanish)',
    };
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a professional blog writer specializing in AI tools and technology. 
            Write in a ${tone} tone. ${languagePrompt[language] || languagePrompt.en}. 
            Include SEO-friendly content with proper headings, subheadings, and bullet points where appropriate. 
            Create approximately ${wordCount} words.`,
        },
        {
          role: 'user',
          content: `Write a comprehensive blog post titled "${title}" about ${topic}. 
            Include these keywords: ${keywords.join(', ')}. 
            The content should be informative, engaging, and provide real value to readers.
            Structure the post with an introduction, main sections, and conclusion.`,
        },
      ],
      temperature: 0.7,
      max_tokens: Math.min(4000, Math.ceil(wordCount * 1.5)),
    });
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating blog content:', error);
    throw error;
  }
};

/**
 * Generate meta description for SEO
 * @param {String} content - Blog post content
 * @param {String} language - Language code (en, fr, de, es)
 * @returns {Promise<String>} - Generated meta description
 */
const generateMetaDescription = async (content, language = 'en') => {
  try {
    // Define language-specific prompts
    const languagePrompt = {
      en: 'Write in English',
      fr: 'Écrivez en français (Write in French)',
      de: 'Schreiben Sie auf Deutsch (Write in German)',
      es: 'Escribe en español (Write in Spanish)',
    };
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an SEO expert. ${languagePrompt[language] || languagePrompt.en}.
            Create a compelling meta description of approximately 150-160 characters.`,
        },
        {
          role: 'user',
          content: `Based on the following content, create an SEO-optimized meta description:
            ${content.substring(0, 2000)}...`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating meta description:', error);
    throw error;
  }
};

/**
 * Generate blog post translation
 * @param {String} content - Original content
 * @param {String} sourceLanguage - Source language code (en, fr, de, es)
 * @param {String} targetLanguage - Target language code (en, fr, de, es)
 * @returns {Promise<Object>} - Translated content with title and body
 */
const translateContent = async (content, title, sourceLanguage = 'en', targetLanguage) => {
  try {
    // Define language-specific prompts
    const languageFullName = {
      en: 'English',
      fr: 'French',
      de: 'German',
      es: 'Spanish',
    };
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator from ${languageFullName[sourceLanguage]} to ${languageFullName[targetLanguage]}.
            Translate the content while maintaining the original meaning, tone, and formatting.
            Keep all HTML tags, markdown formatting, and structure intact.`,
        },
        {
          role: 'user',
          content: `Translate the following blog post from ${languageFullName[sourceLanguage]} to ${languageFullName[targetLanguage]}.
            Title: ${title}
            
            Content:
            ${content}
            
            Return the result in JSON format with fields for "title" and "content".`,
        },
      ],
      temperature: 0.3,
      max_tokens: Math.min(4000, content.length * 1.5),
      response_format: { type: "json_object" },
    });
    
    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('Error translating content:', error);
    throw error;
  }
};

module.exports = {
  openai,
  generateBlogContent,
  generateMetaDescription,
  translateContent,
};
