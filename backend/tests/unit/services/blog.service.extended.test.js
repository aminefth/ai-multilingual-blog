const httpStatus = require('http-status');
const mongoose = require('mongoose');
const blogService = require('../../../src/services/blog.service');
const translationService = require('../../../src/services/translation.service');
const ApiError = require('../../../src/utils/ApiError');
const { BlogPost } = require('../../../src/models');

// Mock des dépendances
jest.mock('../../../src/models/blogPost.model');
jest.mock('../../../src/services/translation.service');

describe('Blog service', () => {
  let mockBlogPost;
  let mockBlogId;
  let mockUserId;

  beforeEach(() => {
    jest.clearAllMocks();

    mockBlogId = new mongoose.Types.ObjectId();
    mockUserId = new mongoose.Types.ObjectId();
    mockBlogPost = {
      _id: mockBlogId,
      title: 'Original Blog Post',
      content: 'This is the original content',
      status: 'draft',
      author: mockUserId,
      translations: {
        en: {
          title: 'Original Blog Post',
          content: 'This is the original content',
          metaDescription: 'Original meta description',
        },
      },
      defaultLanguage: 'en',
      seoMetadata: {
        metaDescription: 'Original meta description',
        metaKeywords: ['test', 'blog'],
      },
      tags: ['technology', 'ai'],
      categories: [new mongoose.Types.ObjectId()],
      toJSON: jest.fn().mockReturnThis(),
      save: jest.fn().mockResolvedValue(this),
    };
  });

  describe('createBlogPost', () => {
    test('should create a blog post successfully', async () => {
      // Arrange
      const blogData = {
        title: 'New Blog Post',
        content: 'This is the content',
        status: 'draft',
        author: mockUserId,
        tags: ['tech', 'ai'],
        defaultLanguage: 'en',
      };

      BlogPost.create.mockResolvedValue({
        ...blogData,
        _id: mockBlogId,
        toJSON: jest.fn().mockReturnValue(blogData),
      });

      // Act
      const result = await blogService.createBlogPost(blogData);

      // Assert
      expect(BlogPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: blogData.title,
          content: blogData.content,
          status: blogData.status,
          author: blogData.author,
        }),
      );
      expect(result).toMatchObject(blogData);
    });

    test('should create blog post with default translations in defaultLanguage', async () => {
      // Arrange
      const blogData = {
        title: 'New Blog Post',
        content: 'This is the content',
        metaDescription: 'Meta description',
        status: 'draft',
        author: mockUserId,
        defaultLanguage: 'en',
      };

      const expectedTranslations = {
        en: {
          title: blogData.title,
          content: blogData.content,
          metaDescription: blogData.metaDescription,
        },
      };

      BlogPost.create.mockImplementation((data) => {
        return Promise.resolve({
          ...data,
          _id: mockBlogId,
          toJSON: jest.fn().mockReturnValue({ ...data, _id: mockBlogId }),
        });
      });

      // Act
      const result = await blogService.createBlogPost(blogData);

      // Assert
      expect(BlogPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          translations: expectedTranslations,
        }),
      );
      expect(result).toHaveProperty('translations');
      expect(result.translations).toEqual(expectedTranslations);
    });

    test('should throw error when required fields are missing', async () => {
      // Arrange
      const incompleteData = {
        content: 'Just content without title',
        status: 'draft',
      };

      BlogPost.create.mockRejectedValue(new Error('Validation error'));

      // Act & Assert
      await expect(blogService.createBlogPost(incompleteData)).rejects.toThrow();
    });
  });

  describe('getBlogPostById', () => {
    test('should return blog post if id exists', async () => {
      // Arrange
      BlogPost.findById.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockBlogPost),
      }));

      // Act
      const result = await blogService.getBlogPostById(mockBlogId);

      // Assert
      expect(BlogPost.findById).toHaveBeenCalledWith(mockBlogId);
      expect(result).toEqual(mockBlogPost);
    });

    test('should return blog post with specific language if requested', async () => {
      // Arrange
      const targetLanguage = 'fr';
      mockBlogPost.translations = {
        en: {
          title: 'Original Blog Post',
          content: 'This is the original content',
        },
        fr: {
          title: 'Article de Blog Original',
          content: 'Ceci est le contenu original',
        },
      };

      BlogPost.findById.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockBlogPost),
      }));

      // Act
      const result = await blogService.getBlogPostById(mockBlogId, targetLanguage);

      // Assert
      expect(result.title).toBe(mockBlogPost.translations.fr.title);
      expect(result.content).toBe(mockBlogPost.translations.fr.content);
    });

    test('should return default language if requested language is not available', async () => {
      // Arrange
      const targetLanguage = 'de'; // Pas disponible dans les traductions
      mockBlogPost.translations = {
        en: {
          title: 'Original Blog Post',
          content: 'This is the original content',
        },
      };
      mockBlogPost.defaultLanguage = 'en';

      BlogPost.findById.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockBlogPost),
      }));

      // Act
      const result = await blogService.getBlogPostById(mockBlogId, targetLanguage);

      // Assert
      expect(result.title).toBe(mockBlogPost.translations.en.title);
      expect(result.content).toBe(mockBlogPost.translations.en.content);
    });

    test('should throw error if blog post is not found', async () => {
      // Arrange
      BlogPost.findById.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(null),
      }));

      // Act & Assert
      await expect(blogService.getBlogPostById(mockBlogId)).rejects.toThrow(ApiError);
      await expect(blogService.getBlogPostById(mockBlogId)).rejects.toThrow(
        `Blog post not found with id ${mockBlogId}`,
      );
    });
  });

  describe('updateBlogPost', () => {
    test('should update blog post if id exists', async () => {
      // Arrange
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        status: 'published',
      };

      const updatedPost = {
        ...mockBlogPost,
        ...updateData,
        translations: {
          en: {
            title: 'Updated Title',
            content: 'Updated content',
          },
        },
        toJSON: jest.fn().mockReturnValue({ ...mockBlogPost, ...updateData }),
      };

      BlogPost.findByIdAndUpdate.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(updatedPost),
      }));

      // Act
      const result = await blogService.updateBlogPost(mockBlogId, updateData);

      // Assert
      expect(BlogPost.findByIdAndUpdate).toHaveBeenCalledWith(mockBlogId, expect.anything(), {
        new: true,
      });
      expect(result.title).toBe(updateData.title);
      expect(result.content).toBe(updateData.content);
      expect(result.status).toBe(updateData.status);
    });

    test('should update specific language translation if language is provided', async () => {
      // Arrange
      const updateData = {
        title: 'Titre mis à jour',
        content: 'Contenu mis à jour',
      };
      const targetLanguage = 'fr';

      const existingPost = {
        ...mockBlogPost,
        translations: {
          en: {
            title: 'Original Blog Post',
            content: 'This is the original content',
            metaDescription: 'Original meta description',
          },
          fr: {
            title: 'Article de Blog Original',
            content: 'Ceci est le contenu original',
            metaDescription: 'Description meta originale',
          },
        },
      };

      const updatedPost = {
        ...existingPost,
        translations: {
          ...existingPost.translations,
          fr: {
            ...existingPost.translations.fr,
            title: updateData.title,
            content: updateData.content,
          },
        },
        toJSON: jest.fn().mockReturnThis(),
      };

      BlogPost.findById.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(existingPost),
      }));

      BlogPost.findByIdAndUpdate.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(updatedPost),
      }));

      // Act
      const result = await blogService.updateBlogPost(mockBlogId, updateData, targetLanguage);

      // Assert
      expect(BlogPost.findByIdAndUpdate).toHaveBeenCalledWith(
        mockBlogId,
        expect.objectContaining({
          $set: {
            [`translations.${targetLanguage}.title`]: updateData.title,
            [`translations.${targetLanguage}.content`]: updateData.content,
          },
        }),
        { new: true },
      );
      expect(result.translations[targetLanguage].title).toBe(updateData.title);
      expect(result.translations[targetLanguage].content).toBe(updateData.content);
    });

    test('should create new translation if language does not exist', async () => {
      // Arrange
      const updateData = {
        title: 'Título actualizado',
        content: 'Contenido actualizado',
        metaDescription: 'Meta descripción',
      };
      const targetLanguage = 'es'; // Nouvelle langue non présente dans les traductions

      const existingPost = {
        ...mockBlogPost,
        translations: {
          en: {
            title: 'Original Blog Post',
            content: 'This is the original content',
            metaDescription: 'Original meta description',
          },
        },
      };

      const updatedPost = {
        ...existingPost,
        translations: {
          ...existingPost.translations,
          es: updateData,
        },
        toJSON: jest.fn().mockReturnThis(),
      };

      BlogPost.findById.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(existingPost),
      }));

      BlogPost.findByIdAndUpdate.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(updatedPost),
      }));

      // Act
      const result = await blogService.updateBlogPost(mockBlogId, updateData, targetLanguage);

      // Assert
      expect(BlogPost.findByIdAndUpdate).toHaveBeenCalled();
      expect(result.translations[targetLanguage]).toEqual(updateData);
    });

    test('should throw error if blog post to update is not found', async () => {
      // Arrange
      BlogPost.findById.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(null),
      }));

      const updateData = { title: 'This will not update' };

      // Act & Assert
      await expect(blogService.updateBlogPost(mockBlogId, updateData)).rejects.toThrow(ApiError);
    });
  });

  describe('deleteBlogPost', () => {
    test('should delete blog post if id exists', async () => {
      // Arrange
      BlogPost.findByIdAndDelete.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockBlogPost),
      }));

      // Act
      await blogService.deleteBlogPost(mockBlogId);

      // Assert
      expect(BlogPost.findByIdAndDelete).toHaveBeenCalledWith(mockBlogId);
    });

    test('should throw error if blog post to delete is not found', async () => {
      // Arrange
      BlogPost.findByIdAndDelete.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(null),
      }));

      // Act & Assert
      await expect(blogService.deleteBlogPost(mockBlogId)).rejects.toThrow(ApiError);
    });
  });

  describe('translateBlogPost', () => {
    test('should translate blog post to target language', async () => {
      // Arrange
      const targetLanguage = 'fr';
      const sourceLanguage = 'en';

      const originalPost = {
        ...mockBlogPost,
        translations: {
          en: {
            title: 'Original Blog Post',
            content: 'This is the original content',
            metaDescription: 'Original meta description',
          },
        },
      };

      const translatedFields = {
        title: 'Article de Blog Traduit',
        content: 'Ceci est le contenu traduit',
        metaDescription: 'Description meta traduite',
      };

      const updatedPost = {
        ...originalPost,
        translations: {
          ...originalPost.translations,
          [targetLanguage]: translatedFields,
        },
        toJSON: jest.fn().mockReturnThis(),
      };

      BlogPost.findById.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(originalPost),
      }));

      translationService.translateContent.mockImplementation((text) => {
        const translations = {
          'Original Blog Post': translatedFields.title,
          'This is the original content': translatedFields.content,
          'Original meta description': translatedFields.metaDescription,
        };
        return Promise.resolve(translations[text]);
      });

      BlogPost.findByIdAndUpdate.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(updatedPost),
      }));

      // Act
      const result = await blogService.translateBlogPost(
        mockBlogId,
        sourceLanguage,
        targetLanguage,
      );

      // Assert
      expect(BlogPost.findById).toHaveBeenCalledWith(mockBlogId);
      expect(translationService.translateContent).toHaveBeenCalledTimes(3); // Pour title, content et metaDescription
      expect(result.translations[targetLanguage]).toEqual(translatedFields);
    });

    test('should throw error if blog post to translate is not found', async () => {
      // Arrange
      BlogPost.findById.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(null),
      }));

      // Act & Assert
      await expect(blogService.translateBlogPost(mockBlogId, 'en', 'fr')).rejects.toThrow(ApiError);
    });

    test('should throw error if source language translation does not exist', async () => {
      // Arrange
      const originalPost = {
        ...mockBlogPost,
        translations: {
          en: {
            title: 'Original Blog Post',
            content: 'This is the original content',
          },
        },
        defaultLanguage: 'en',
      };

      BlogPost.findById.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(originalPost),
      }));

      // Act & Assert
      await expect(blogService.translateBlogPost(mockBlogId, 'de', 'fr')).rejects.toThrow(ApiError);
    });
  });

  describe('queryBlogPosts', () => {
    test('should return paginated blog posts matching filter', async () => {
      // Arrange
      const filter = { status: 'published' };
      const options = { limit: 10, page: 1, sortBy: 'createdAt:desc' };

      const mockPaginatedResults = {
        results: [mockBlogPost, { ...mockBlogPost, _id: new mongoose.Types.ObjectId() }],
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 2,
      };

      BlogPost.paginate.mockResolvedValue(mockPaginatedResults);

      // Act
      const result = await blogService.queryBlogPosts(filter, options);

      // Assert
      expect(BlogPost.paginate).toHaveBeenCalledWith(filter, options);
      expect(result).toEqual(mockPaginatedResults);
    });

    test('should apply language filter to return posts in specific language', async () => {
      // Arrange
      const filter = { status: 'published' };
      const options = { limit: 10, page: 1, sortBy: 'createdAt:desc' };
      const language = 'fr';

      const mockPaginatedResults = {
        results: [
          {
            ...mockBlogPost,
            translations: {
              en: { title: 'English Title', content: 'English content' },
              fr: { title: 'Titre Français', content: 'Contenu français' },
            },
          },
        ],
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 1,
      };

      BlogPost.paginate.mockResolvedValue(mockPaginatedResults);

      // Act
      const result = await blogService.queryBlogPosts(filter, options, language);

      // Assert
      expect(BlogPost.paginate).toHaveBeenCalledWith(
        { ...filter, [`translations.${language}`]: { $exists: true } },
        options,
      );
      expect(result).toEqual(mockPaginatedResults);
    });
  });
});
