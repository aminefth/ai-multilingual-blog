// Import necessary modules
const { openaiClient } = require('../../../src/config/openai');
const aiService = require('../../../src/services/ai.service');
const ApiError = require('../../../src/utils/ApiError');
const config = require('../../../src/config/config');

// Mock des dépendances
jest.mock('../../../src/config/openai', () => ({
  openaiClient: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
    embeddings: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../../../src/config/config', () => ({
  openai: {
    apiKey: 'test-api-key',
    defaultModel: 'gpt-4',
    embeddingModel: 'text-embedding-ada-002',
  },
}));

describe('AI service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateContent', () => {
    const mockPrompt = 'Write a blog post about AI';
    const mockOptions = {
      maxTokens: 500,
      temperature: 0.7,
    };
    const mockResponse = {
      choices: [
        {
          message: {
            content: 'This is a generated blog post about AI technology...',
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 100,
        total_tokens: 110,
      },
    };

    test('should generate content successfully', async () => {
      // Arrange
      openaiClient.chat.completions.create.mockResolvedValue(mockResponse);

      // Act
      const result = await aiService.generateContent(mockPrompt, mockOptions);

      // Assert
      expect(openaiClient.chat.completions.create).toHaveBeenCalledWith({
        model: config.openai.defaultModel,
        messages: [
          { role: 'system', content: expect.any(String) },
          { role: 'user', content: mockPrompt },
        ],
        max_tokens: mockOptions.maxTokens,
        temperature: mockOptions.temperature,
      });
      expect(result).toEqual({
        content: mockResponse.choices[0].message.content,
        usage: mockResponse.usage,
      });
    });

    test('should use default options when none provided', async () => {
      // Arrange
      openaiClient.chat.completions.create.mockResolvedValue(mockResponse);

      // Act
      await aiService.generateContent(mockPrompt);

      // Assert
      expect(openaiClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: config.openai.defaultModel,
          messages: expect.any(Array),
          // Verify default options are used
          max_tokens: expect.any(Number),
          temperature: expect.any(Number),
        }),
      );
    });

    test('should handle empty response from API', async () => {
      // Arrange
      const emptyResponse = {
        choices: [],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 0,
          total_tokens: 10,
        },
      };
      openaiClient.chat.completions.create.mockResolvedValue(emptyResponse);

      // Act & Assert
      await expect(aiService.generateContent(mockPrompt)).rejects.toThrow(ApiError);
      await expect(aiService.generateContent(mockPrompt)).rejects.toThrow(
        'No content was generated',
      );
    });

    test('should throw error when API call fails', async () => {
      // Arrange
      const errorMsg = 'OpenAI API error';
      openaiClient.chat.completions.create.mockRejectedValue(new Error(errorMsg));

      // Act & Assert
      await expect(aiService.generateContent(mockPrompt)).rejects.toThrow(ApiError);
      await expect(aiService.generateContent(mockPrompt)).rejects.toThrow(errorMsg);
    });

    test('should include system role with specific instructions', async () => {
      // Arrange
      openaiClient.chat.completions.create.mockResolvedValue(mockResponse);
      const systemPrompt = 'You are a helpful blogging assistant';

      // Act
      await aiService.generateContent(mockPrompt, { systemPrompt });

      // Assert
      expect(openaiClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: mockPrompt },
          ],
        }),
      );
    });

    test('should handle different models', async () => {
      // Arrange
      openaiClient.chat.completions.create.mockResolvedValue(mockResponse);
      const customModel = 'gpt-3.5-turbo';

      // Act
      await aiService.generateContent(mockPrompt, { model: customModel });

      // Assert
      expect(openaiClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: customModel,
        }),
      );
    });
  });

  describe('generateEmbedding', () => {
    const mockText = 'This is a sample text for embedding';
    const mockEmbeddingResponse = {
      data: [
        {
          embedding: Array(1536).fill(0.1),
        },
      ],
      usage: {
        prompt_tokens: 10,
        total_tokens: 10,
      },
    };

    test('should generate embedding successfully', async () => {
      // Arrange
      openaiClient.embeddings.create.mockResolvedValue(mockEmbeddingResponse);

      // Act
      const result = await aiService.generateEmbedding(mockText);

      // Assert
      expect(openaiClient.embeddings.create).toHaveBeenCalledWith({
        model: config.openai.embeddingModel,
        input: mockText,
      });
      expect(result).toEqual({
        embedding: mockEmbeddingResponse.data[0].embedding,
        usage: mockEmbeddingResponse.usage,
      });
    });

    test('should handle empty or null text', async () => {
      // Act & Assert
      await expect(aiService.generateEmbedding('')).rejects.toThrow(ApiError);
      await expect(aiService.generateEmbedding(null)).rejects.toThrow(ApiError);
    });

    test('should throw error when API call fails', async () => {
      // Arrange
      const errorMsg = 'Embedding generation failed';
      openaiClient.embeddings.create.mockRejectedValue(new Error(errorMsg));

      // Act & Assert
      await expect(aiService.generateEmbedding(mockText)).rejects.toThrow(ApiError);
      await expect(aiService.generateEmbedding(mockText)).rejects.toThrow(errorMsg);
    });

    test('should truncate long text to maximum token size', async () => {
      // Arrange
      openaiClient.embeddings.create.mockResolvedValue(mockEmbeddingResponse);
      // Generate a very long text (8000 chars ~= 2000 tokens)
      const longText = 'a'.repeat(8000);

      // Act
      await aiService.generateEmbedding(longText);

      // Assert
      expect(openaiClient.embeddings.create).toHaveBeenCalledWith({
        model: config.openai.embeddingModel,
        // Check that the text was truncated
        input: expect.not.stringContaining(longText),
      });
    });
  });

  describe('enhanceSEO', () => {
    const mockBlogPost = {
      title: 'Sample Blog Post',
      content: 'This is the content of the blog post',
      tags: ['ai', 'technology'],
    };

    const mockSEOResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              metaTitle: 'Enhanced SEO Title',
              metaDescription: 'This is an improved meta description for better SEO',
              metaKeywords: ['ai', 'technology', 'machine learning', 'seo'],
              suggestedHeadings: ['Introduction to AI', 'Technology Impact'],
            }),
          },
        },
      ],
    };

    test('should enhance SEO metadata successfully', async () => {
      // Arrange
      openaiClient.chat.completions.create.mockResolvedValue(mockSEOResponse);

      // Act
      const result = await aiService.enhanceSEO(mockBlogPost);

      // Assert
      expect(openaiClient.chat.completions.create).toHaveBeenCalled();
      expect(result).toEqual({
        metaTitle: 'Enhanced SEO Title',
        metaDescription: 'This is an improved meta description for better SEO',
        metaKeywords: ['ai', 'technology', 'machine learning', 'seo'],
        suggestedHeadings: ['Introduction to AI', 'Technology Impact'],
      });
    });

    test('should handle invalid JSON response from API', async () => {
      // Arrange
      openaiClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Not a valid JSON response',
            },
          },
        ],
      });

      // Act & Assert
      await expect(aiService.enhanceSEO(mockBlogPost)).rejects.toThrow(ApiError);
    });

    test('should handle empty blog post content', async () => {
      // Arrange
      const emptyPost = {
        title: 'Sample Blog Post',
        content: '',
      };

      // Act & Assert
      await expect(aiService.enhanceSEO(emptyPost)).rejects.toThrow(ApiError);
    });

    test('should throw error when API call fails', async () => {
      // Arrange
      const errorMsg = 'SEO enhancement failed';
      openaiClient.chat.completions.create.mockRejectedValue(new Error(errorMsg));

      // Act & Assert
      await expect(aiService.enhanceSEO(mockBlogPost)).rejects.toThrow(ApiError);
      await expect(aiService.enhanceSEO(mockBlogPost)).rejects.toThrow(errorMsg);
    });
  });

  describe('generateBlogTitle', () => {
    const mockContent =
      'This is a blog post about artificial intelligence and its applications in modern business.';
    const mockTitleResponse = {
      choices: [
        {
          message: {
            content: 'The Impact of AI on Modern Business: A Comprehensive Guide',
          },
        },
      ],
    };

    test('should generate blog title successfully', async () => {
      // Arrange
      openaiClient.chat.completions.create.mockResolvedValue(mockTitleResponse);

      // Act
      const result = await aiService.generateBlogTitle(mockContent);

      // Assert
      expect(openaiClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('generate a compelling title'),
            }),
            expect.objectContaining({
              role: 'user',
              content: mockContent,
            }),
          ]),
        }),
      );
      expect(result).toBe(mockTitleResponse.choices[0].message.content);
    });

    test('should generate multiple title options when requested', async () => {
      // Arrange
      const multiTitleResponse = {
        choices: [
          {
            message: {
              content:
                '1. The Impact of AI on Modern Business\n2. How AI is Transforming Business Operations\n3. Artificial Intelligence: The Future of Business',
            },
          },
        ],
      };
      openaiClient.chat.completions.create.mockResolvedValue(multiTitleResponse);

      // Act
      const result = await aiService.generateBlogTitle(mockContent, { count: 3 });

      // Assert
      expect(openaiClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('generate 3 compelling titles'),
            }),
          ]),
        }),
      );
      expect(result).toBe(multiTitleResponse.choices[0].message.content);
    });

    test('should handle empty content', async () => {
      // Act & Assert
      await expect(aiService.generateBlogTitle('')).rejects.toThrow(ApiError);
      await expect(aiService.generateBlogTitle(null)).rejects.toThrow(ApiError);
    });

    test('should handle API errors', async () => {
      // Arrange
      const errorMsg = 'Title generation failed';
      openaiClient.chat.completions.create.mockRejectedValue(new Error(errorMsg));

      // Act & Assert
      await expect(aiService.generateBlogTitle(mockContent)).rejects.toThrow(ApiError);
      await expect(aiService.generateBlogTitle(mockContent)).rejects.toThrow(errorMsg);
    });
  });
});
