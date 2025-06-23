const mongoose = require('mongoose');
const blogService = require('../../../src/services/blog.service');
const { BlogPost } = require('../../../src/models');
const ApiError = require('../../../src/utils/ApiError');
const BlogPostFactory = require('../../factories/blogPostFactory');
const UserFactory = require('../../factories/userFactory');

// Mock the models
jest.mock('../../../src/models', () => ({
  BlogPost: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  },
}));

describe('Blog Service', () => {
  describe('createBlogPost', () => {
    test('should create blog post successfully', async () => {
      // Arrange
      const user = new UserFactory().build();
      const postData = {
        title: 'Test Post',
        content: 'Test content',
        author: user._id,
      };
      const expectedBlogPost = { ...postData, _id: new mongoose.Types.ObjectId() };

      // Mock
      BlogPost.create.mockResolvedValue(expectedBlogPost);

      // Act
      const result = await blogService.createBlogPost(postData);

      // Assert
      expect(BlogPost.create).toHaveBeenCalledWith(postData);
      expect(result).toEqual(expectedBlogPost);
    });
  });

  describe('getBlogPostById', () => {
    test('should return blog post if found', async () => {
      // Arrange
      const id = new mongoose.Types.ObjectId();
      const expectedBlogPost = new BlogPostFactory({ _id: id }).build();

      // Mock
      BlogPost.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(expectedBlogPost),
        }),
      });

      // Act
      const result = await blogService.getBlogPostById(id);

      // Assert
      expect(BlogPost.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedBlogPost);
    });

    test('should throw ApiError if blog post not found', async () => {
      // Arrange
      const id = new mongoose.Types.ObjectId();

      // Mock
      BlogPost.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      // Act & Assert
      await expect(blogService.getBlogPostById(id)).rejects.toThrow(ApiError);
    });
  });

  describe('updateBlogPost', () => {
    test('should update blog post successfully', async () => {
      // Arrange
      const id = new mongoose.Types.ObjectId();
      const updateBody = { title: 'Updated Title', content: 'Updated content' };
      const expectedBlogPost = new BlogPostFactory({ _id: id, ...updateBody }).build();

      // Mock
      BlogPost.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(expectedBlogPost),
      });

      // Act
      const result = await blogService.updateBlogPost(id, updateBody);

      // Assert
      expect(BlogPost.findByIdAndUpdate).toHaveBeenCalledWith(id, updateBody, { new: true });
      expect(result).toEqual(expectedBlogPost);
    });
  });
});
