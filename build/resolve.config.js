const path = require('path');

module.exports = {
    modules: [path.resolve(__dirname, '../src'), 'node_modules'],
    alias: {
    	'method': path.resolve(__dirname, '../src/method')
    }
}