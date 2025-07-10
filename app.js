const protect = require('static-auth');
const safeCompare = require('safe-compare');
const path = require('path');

const app = protect(
  '/',
  (username, password) =>
    safeCompare(username, process.env.USERNAME || 'admin') &&
    safeCompare(password, process.env.PASSWORD || 'admin'),
  {
    directory: path.join(__dirname, 'dist'),
    onAuthFailed: (res) => {
      res.end('Authentication failed');
    },
  }
);

module.exports = app;