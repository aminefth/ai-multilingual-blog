const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const docsRoute = require('./docs.route');
const blogRoute = require('./blog.route');
const translationRoute = require('./translation.route');
const seoRoute = require('./seo.route');
const subscriptionRoute = require('./subscription.route');
const analyticsRoute = require('./analytics.route');
const affiliateRoute = require('./affiliate.route');
const adminRoute = require('./admin.route');
const config = require('../../config/config');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/blog',
    route: blogRoute,
  },
  {
    path: '/translations',
    route: translationRoute,
  },
  {
    path: '/seo',
    route: seoRoute,
  },
  {
    path: '/subscriptions',
    route: subscriptionRoute,
  },
  {
    path: '/analytics',
    route: analyticsRoute,
  },
  {
    path: '/affiliate',
    route: affiliateRoute,
  },
  {
    path: '/admin',
    route: adminRoute,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;
