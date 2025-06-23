const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn().mockImplementation(() => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Mock SEO Title',
                description: 'Mock SEO Description',
                keywords: ['ai', 'tools', 'mock'],
              }),
            },
          },
        ],
      })),
    },
  },
};

const mockStripe = {
  customers: {
    create: jest.fn().mockImplementation(() => ({ id: 'cus_mock123' })),
    update: jest
      .fn()
      .mockImplementation(() => ({ discount: { coupon: { id: 'mock_coupon', percent_off: 20 } } })),
  },
  subscriptions: {
    create: jest.fn().mockImplementation(() => ({ id: 'sub_mock123' })),
    retrieve: jest.fn().mockImplementation(() => ({ status: 'active' })),
  },
  checkout: {
    sessions: {
      create: jest
        .fn()
        .mockImplementation(() => ({ id: 'cs_mock', url: 'https://mock-checkout.url' })),
    },
  },
  webhookEndpoints: {
    create: jest.fn().mockImplementation(() => ({ secret: 'whsec_mock' })),
  },
};

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  increment: jest.fn(),
  client: {
    expire: jest.fn(),
  },
};

module.exports = {
  mockOpenAI,
  mockStripe,
  mockRedis,
};
