const { openai } = require('../config/openai');
const { cache } = require('../config/redis');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * AI Service for content generation, SEO optimization, and translations
 */
class AIService {
  /**
   * Generate blog content using OpenAI
   * @param {Object} options - Content generation options
   * @returns {Promise<String>} - Generated content
   */
  async generateBlogContent(options) {
    const {
      title,
      topic,
      keywords = [],
      tone = 'professional',
      wordCount = 1500,
      language = 'en',
    } = options;

    // Create cache key based on options
    const cacheKey = `ai:content:${Buffer.from(
      JSON.stringify({
        title,
        topic,
        keywords,
        tone,
        wordCount,
        language,
      }),
    ).toString('base64')}`;

    // Try to get from cache first
    const cachedContent = await cache.get(cacheKey);
    if (cachedContent) {
      return cachedContent;
    }

    // Enhanced language-specific prompts with cultural and market adaptations
    const languagePrompt = {
      en: `Write in fluent English for the US/UK market. Use direct, action-oriented language that appeals to entrepreneurs and business owners. Include American business terminology and references to Silicon Valley startup culture. Focus on ROI, efficiency gains, and competitive advantages. Use compelling statistics and case studies.`,

      fr: `Écrivez en français pour le marché français et francophone. Adoptez un style professionnel mais accessible, typique du business français. Utilisez un vocabulaire entrepreneurial français (PME, start-up, chiffre d'affaires, rentabilité). Référencez l'écosystème tech français (Station F, BPI France, French Tech). Mettez l'accent sur l'innovation, la qualité, et l'excellence française dans la tech.`,

      de: `Schreiben Sie auf Deutsch für den deutschen und österreichischen Markt. Verwenden Sie einen präzisen, effizienzorientierten Schreibstil, der der deutschen Geschäftskultur entspricht. Betonen Sie Qualität, Zuverlässigkeit und technische Exzellenz. Referenzieren Sie den deutschen Mittelstand, Industrie 4.0 und die deutsche Ingenieurskunst. Verwenden Sie konkrete Daten und technische Details.`,

      es: `Escribe en español para el mercado español y latinoamericano. Utiliza un tono cálido pero profesional, adaptado a la cultura empresarial hispana. Incluye referencias al ecosistema emprendedor de España y Latinoamérica. Enfócate en la transformación digital, el crecimiento de las PYMEs, y las oportunidades de negocio. Usa ejemplos locales y testimonios creíbles.`,
    };

    // Enhanced system prompt with market-specific instructions
    const systemPrompts = {
      en: `You are a professional tech blogger specializing in AI tools for the US/UK market. Write content that converts visitors into customers. Focus on practical business applications, ROI metrics, and competitive advantages. Use American English, include relevant statistics, and create urgency around adoption of AI tools.`,

      fr: `Vous êtes un expert en rédaction de contenu tech pour le marché français. Créez du contenu qui convertit les visiteurs en clients. Concentrez-vous sur les applications business pratiques, les gains de productivité, et l'avantage concurrentiel. Utilisez un français business moderne et incluez des références à l'écosystème entrepreneurial français.`,

      de: `Sie sind ein professioneller Tech-Content-Experte für den deutschsprachigen Markt. Erstellen Sie Inhalte, die Besucher zu Kunden konvertieren. Fokussieren Sie sich auf praktische Geschäftsanwendungen, Effizienzsteigerungen und Wettbewerbsvorteile. Verwenden Sie präzise deutsche Geschäftssprache und betonen Sie Qualität und Zuverlässigkeit.`,

      es: `Eres un experto en contenido tecnológico para el mercado hispanohablante. Crea contenido que convierta visitantes en clientes. Enfócate en aplicaciones empresariales prácticas, mejoras de productividad y ventajas competitivas. Usa español empresarial moderno e incluye referencias al ecosistema emprendedor hispano.`,
    };

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `${systemPrompts[language] || systemPrompts.en} 
              Write in a ${tone} tone. ${languagePrompt[language] || languagePrompt.en}
              Include SEO-friendly content with proper headings (H2, H3), bullet points, and numbered lists where appropriate. 
              Create approximately ${wordCount} words. 
              Structure the content to maximize user engagement and include natural calls-to-action.
              Focus on practical value and actionable insights that entrepreneurs can implement immediately.`,
          },
          {
            role: 'user',
            content: `Write a comprehensive blog post titled "${title}" about ${topic}. 
              Include these keywords naturally: ${keywords.join(', ')}. 
              The content should be informative, engaging, and provide real business value to readers.
              Structure the post with:
              1. A compelling introduction that hooks the reader
              2. Main sections with properly formatted H2 and H3 headings
              3. Practical examples and use cases
              4. Benefits and ROI considerations
              5. Implementation tips
              6. A conclusion with clear next steps
              
              Make sure to include relevant statistics, case studies, and actionable advice throughout.`,
          },
        ],
        temperature: 0.7,
        max_tokens: Math.min(4000, Math.ceil(wordCount * 2)),
      });

      const content = completion.choices[0].message.content;

      // Cache for 1 day
      await cache.set(cacheKey, content, 86400);

      return content;
    } catch (error) {
      logger.error('Error generating blog content:', error);
      throw error;
    }
  }

  /**
   * Generate SEO metadata for a blog post
   * @param {String} title - Post title
   * @param {String} content - Post content
   * @param {String} language - Target language
   * @returns {Promise<Object>} - SEO metadata
   */
  async generateSEO(title, content, language = 'en') {
    // Create cache key
    const cacheKey = `ai:seo:${language}:${Buffer.from(title).toString('base64')}`;

    // Try to get from cache first
    const cachedSEO = await cache.get(cacheKey);
    if (cachedSEO) {
      return cachedSEO;
    }

    // Language-specific SEO instructions
    const seoInstructions = {
      en: 'Focus on keywords that US/UK audiences search for. Use action words and include terms like "best", "guide", "how to", "review". Consider search intent for business tools and AI software.',
      fr: 'Concentrez-vous sur les mots-clés recherchés par le public français. Utilisez des termes comme "meilleur", "guide", "comment", "avis", "outil". Pensez à l\'intention de recherche pour les outils business et logiciels IA.',
      de: 'Fokussieren Sie sich auf Keywords, nach denen deutsche Nutzer suchen. Verwenden Sie Begriffe wie "beste", "Anleitung", "Test", "Vergleich". Berücksichtigen Sie die Suchintention für Business-Tools und KI-Software.',
      es: 'Enfócate en palabras clave que buscan las audiencias hispanohablantes. Usa términos como "mejor", "guía", "cómo", "reseña", "herramienta". Considera la intención de búsqueda para herramientas empresariales y software de IA.',
    };

    const prompt = `
    Generate search engine optimization (SEO) elements for this blog post about AI tools in ${language}:
    Title: ${title}
    Content excerpt: ${content.substring(0, 1000)}...
    
    ${seoInstructions[language] || seoInstructions.en}
    
    Return ONLY a valid JSON object with these fields:
    {
      "title": "SEO-optimized title (maximum 60 characters, compelling and keyword-rich)",
      "description": "Compelling meta description (maximum 160 characters, includes main keyword and call-to-action)",
      "keywords": ["primary_keyword", "secondary_keyword", "long_tail_keyword_1", "long_tail_keyword_2", "brand_keyword"]
    }
    
    Make sure the title and description are optimized for ${language} search engines and contain important keywords while remaining compelling and click-worthy.
    `;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an SEO expert specializing in AI tools and technology content for the ${language} market. 
              Understand local search behavior and keyword preferences for this language/market. Return only valid JSON.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0].message.content);

      // Cache for 1 week
      await cache.set(cacheKey, result, 604800);

      return result;
    } catch (error) {
      logger.error('Error generating SEO metadata:', error);

      // Fallback if API call fails
      return {
        title: title.substring(0, 60),
        description: content.substring(0, 160).replace(/\n/g, ' '),
        keywords: title
          .split(' ')
          .filter((word) => word.length > 3)
          .slice(0, 5),
      };
    }
  }

  /**
   * Improve existing content with specific enhancements
   * @param {String} content - Original content
   * @param {Array<String>} improvements - Types of improvements to make
   * @param {String} language - Target language
   * @returns {Promise<String>} - Improved content
   */
  async improveContent(content, improvements = [], language = 'en') {
    const improvementPrompts = {
      seo: 'Optimize this content for search engines by adding relevant keywords naturally',
      readability:
        'Improve readability with shorter sentences, clearer language, and better headings',
      engagement: 'Make this content more engaging with questions, stories, and examples',
      cta: 'Add strategic calls-to-action throughout the content',
    };

    if (improvements.length === 0) {
      return content;
    }

    let improvedContent = content;
    const applicableImprovements = improvements.filter((imp) => improvementPrompts[imp]);

    if (applicableImprovements.length === 0) {
      return content;
    }

    // Create combined prompt for all requested improvements
    const improvementInstructions = applicableImprovements
      .map((imp) => improvementPrompts[imp])
      .join('. ');

    // Create cache key
    const cacheKey = `ai:improve:${language}:${Buffer.from(content.substring(0, 100) + improvementInstructions).toString('base64')}`;

    // Try to get from cache first
    const cachedContent = await cache.get(cacheKey);
    if (cachedContent) {
      return cachedContent;
    }

    // Language-specific improvement instructions
    const languageContext = {
      en: 'Focus on clarity, directness, and business value. Use active voice and strong action words.',
      fr: "Maintenez un style professionnel français tout en améliorant la lisibilité et l'engagement.",
      de: 'Behalten Sie die deutsche Präzision bei, aber verbessern Sie die Lesbarkeit und das Engagement.',
      es: 'Mantén un tono profesional en español mientras mejoras la legibilidad y el compromiso.',
    };

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert content editor for ${language} content. 
              Improve the content while maintaining its meaning and core structure. 
              ${languageContext[language] || languageContext.en}`,
          },
          {
            role: 'user',
            content: `Improve this content by: ${improvementInstructions}
              
              Keep the content in ${language} and maintain cultural appropriateness for this market.
              
              Content:
              ${improvedContent}`,
          },
        ],
        temperature: 0.5,
      });

      improvedContent = completion.choices[0].message.content;

      // Cache for 1 day
      await cache.set(cacheKey, improvedContent, 86400);

      return improvedContent;
    } catch (error) {
      logger.error('Error improving content:', error);
      return content; // Return original content if API fails
    }
  }

  /**
   * Translate content to target language
   * @param {String} content - Original content
   * @param {String} title - Original title
   * @param {String} sourceLanguage - Source language code
   * @param {String} targetLanguage - Target language code
   * @returns {Promise<Object>} - Translated content with title and content fields
   */
  async translateContent(content, title, sourceLanguage = 'en', targetLanguage) {
    if (!config.languages.includes(targetLanguage) || sourceLanguage === targetLanguage) {
      throw new Error('Invalid language combination');
    }

    // Create cache key
    const cacheKey = `ai:translate:${sourceLanguage}:${targetLanguage}:${Buffer.from(title).toString('base64')}`;

    // Try to get from cache first
    const cachedTranslation = await cache.get(cacheKey);
    if (cachedTranslation) {
      return cachedTranslation;
    }

    // Define language names and cultural contexts for prompt
    const languageContexts = {
      en: { name: 'English', context: 'US/UK business culture with focus on efficiency and ROI' },
      fr: { name: 'French', context: 'French business culture emphasizing quality and innovation' },
      de: {
        name: 'German',
        context: 'German business culture focusing on precision, quality, and technical excellence',
      },
      es: {
        name: 'Spanish',
        context: 'Spanish/Latin American business culture with warm, relationship-focused approach',
      },
    };

    const sourceContext = languageContexts[sourceLanguage];
    const targetContext = languageContexts[targetLanguage];

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator and cultural adaptation expert from ${sourceContext.name} to ${targetContext.name}.
              Not only translate the content but also adapt it culturally for the ${targetContext.context}.
              Maintain the original meaning, tone, and formatting while making it feel native to the target market.
              Keep all headings, markdown formatting, and structure intact.
              Adapt business examples, cultural references, and terminology to be relevant for the target market.`,
          },
          {
            role: 'user',
            content: `Translate and culturally adapt this blog post from ${sourceContext.name} to ${targetContext.name}.
              Consider the target market context: ${targetContext.context}
              
              Title: ${title}
              
              Content:
              ${content}
              
              Return a JSON object with fields for "title", "content", and a short "excerpt" (maximum 250 characters).
              Make sure all HTML/Markdown tags and formatting remain intact.
              Adapt any cultural references, business examples, or terminology to be relevant for the ${targetContext.name} market.`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0].message.content);

      // Cache for 1 week since translations rarely change
      await cache.set(cacheKey, result, 604800);

      return result;
    } catch (error) {
      logger.error('Error translating content:', error);
      throw error;
    }
  }

  /**
   * Generate blog post titles based on a topic
   * @param {String} topic - Blog post topic
   * @param {String} style - Title style (engaging, seo, professional, clickbait)
   * @param {String} language - Target language
   * @returns {Promise<Array<String>>} - List of generated titles
   */
  async generateTitles(topic, style = 'engaging', language = 'en') {
    const stylePrompts = {
      engaging: 'Create engaging and compelling titles',
      seo: 'Create SEO-optimized titles with relevant keywords',
      professional: 'Create professional and informative titles',
      clickbait: 'Create attention-grabbing titles that generate curiosity (but remain honest)',
    };

    // Language-specific title guidance
    const languageGuidance = {
      en: 'Use power words like "Ultimate", "Essential", "Complete", "Secret", "Proven". Focus on benefits and results.',
      fr: 'Utilisez des mots impactants comme "Ultime", "Essentiel", "Complet", "Secret", "Prouvé". Mettez l\'accent sur les bénéfices.',
      de: 'Verwenden Sie präzise Begriffe wie "Ultimativ", "Wesentlich", "Vollständig", "Bewährt". Fokus auf Nutzen und Ergebnisse.',
      es: 'Usa palabras de impacto como "Definitiva", "Esencial", "Completa", "Secreta", "Probada". Enfócate en beneficios y resultados.',
    };

    const prompt = `${stylePrompts[style] || stylePrompts.engaging} for a blog post about: ${topic}. 
      The blog is focused on AI tools for entrepreneurs and businesses.
      ${languageGuidance[language] || languageGuidance.en}
      Generate 5 different title options in ${language}, each 60 characters or less.
      Make sure titles are optimized for the ${language} market and search behavior.
      Return ONLY a valid JSON object with a "titles" array containing the 5 titles.`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert copywriter who specializes in creating blog titles for the ${language} market. 
              Understand local preferences and search behavior for this language.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0].message.content);
      return Array.isArray(result.titles)
        ? result.titles
        : [result.titles || `${style.charAt(0).toUpperCase() + style.slice(1)} Guide to ${topic}`];
    } catch (error) {
      logger.error('Error generating titles:', error);
      return [`${style.charAt(0).toUpperCase() + style.slice(1)} Guide to ${topic}`];
    }
  }
}

module.exports = new AIService();
