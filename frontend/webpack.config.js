const path = require('path');
require('dotenv').config();

module.exports = {
  devServer: {
    allowedHosts: ['localhost', '.localhost', '127.0.0.1', process.env.HOST],
    host: process.env.HOST || 'localhost',
    port: process.env.PORT || 3000,
    historyApiFallback: true,
    hot: true
  }
};
