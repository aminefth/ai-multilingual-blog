// Import necessary modules
const ApiError = require('../../../src/utils/ApiError');
const translationService = require('../../../src/services/translation.service');
const { openaiClient } = require('../../../src/config/openai');

// Mocking the OpenAI client
jest.mock('../../../src/config/openai', () => ({
  openaiClient: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}));

describe('Translation service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('translateContent', () => {
    test('should translate content to target language successfully', async () => {
      // Mock data
      const content = 'Hello world';
      const targetLanguage = 'fr';
      const sourceLanguage = 'en';
      const mockTranslation = 'Bonjour le monde';

      // Mock OpenAI response
      openaiClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: mockTranslation,
            },
          },
        ],
      });

      // Execute the function
      const result = await translationService.translateContent(
        content,
        sourceLanguage,
        targetLanguage,
      );

      // Assertions
      expect(openaiClient.chat.completions.create).toHaveBeenCalledTimes(1);
      expect(openaiClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.any(String),
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining(targetLanguage),
            }),
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining(content),
            }),
          ]),
        }),
      );
      expect(result).toBe(mockTranslation);
    });

    test('should throw error when translation fails', async () => {
      // Mock data
      const content = 'Hello world';
      const targetLanguage = 'fr';
      const sourceLanguage = 'en';

      // Mock OpenAI error
      openaiClient.chat.completions.create.mockRejectedValueOnce(new Error('API error'));

      // Execute and assert
      await expect(
        translationService.translateContent(content, sourceLanguage, targetLanguage),
      ).rejects.toThrow(ApiError);
    });
  });

  describe('translateBlogPost', () => {
    test('should translate all translatable fields of a blog post', async () => {
      // Mock data
      const blogPost = {
        title: 'Original Title',
        content: 'Original Content',
        metaDescription: 'Original Meta Description',
        tags: ['tag1', 'tag2'],
      };
      const targetLanguage = 'es';
      const sourceLanguage = 'en';

      // Mock translation service responses
      jest.spyOn(translationService, 'translateContent').mockImplementation((text) => {
        const translations = {
          'Original Title': 'Título Original',
          'Original Content': 'Contenido Original',
          'Original Meta Description': 'Descripción Meta Original',
          tag1: 'etiqueta1',
          tag2: 'etiqueta2',
        };
        return Promise.resolve(translations[text] || `Translated: ${text}`);
      });

      // Execute the function
      const result = await translationService.translateBlogPost(
        blogPost,
        sourceLanguage,
        targetLanguage,
      );

      // Assertions
      expect(translationService.translateContent).toHaveBeenCalledTimes(5); // 3 string fields + 2 tags
      expect(result).toEqual({
        title: 'Título Original',
        content: 'Contenido Original',
        metaDescription: 'Descripción Meta Original',
        tags: ['etiqueta1', 'etiqueta2'],
      });
    });

    test('should handle empty fields gracefully', async () => {
      // Mock data with some empty fields
      const blogPost = {
        title: 'Original Title',
        content: '',
        metaDescription: null,
        tags: [],
      };
      const targetLanguage = 'de';
      const sourceLanguage = 'en';

      // Mock translation only for title since other fields are empty
      jest.spyOn(translationService, 'translateContent').mockResolvedValueOnce('Originaler Titel');

      // Execute the function
      const result = await translationService.translateBlogPost(
        blogPost,
        sourceLanguage,
        targetLanguage,
      );

      // Assertions
      expect(translationService.translateContent).toHaveBeenCalledTimes(1); // Only title should be translated
      expect(result).toEqual({
        title: 'Originaler Titel',
        content: '',
        metaDescription: null,
        tags: [],
      });
    });
  });
});
