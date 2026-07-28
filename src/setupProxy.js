// Dev-only API proxy (Create React App loads this automatically).
//
// This replaces the top-level "proxy" field in package.json. With the string
// "proxy" field, react-scripts / webpack-dev-server enforces a host check that
// derives `allowedHosts` from an auto-detected LAN IP. On networks where no
// private LAN IP is detectable (offline, VPN, some Wi-Fi), that value is empty
// and the dev server refuses to start with:
//   "options.allowedHosts[0] should be a non-empty string".
// Proxying via setupProxy.js instead disables that host check (allowedHosts:
// 'all'), so `npm start` works regardless of network state. Dev-only — the
// production build ignores this and uses REACT_APP_API_URL.
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.REACT_APP_API_URL || 'http://localhost:5001',
      changeOrigin: true,
    })
  );
};
