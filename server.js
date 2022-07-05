const http = require('http');

const app = require('./app');

const server = http.createServer(app);
server.listen({
    port: process.env.PORT || 3001,
    host: '::'
}, function() {
    console.log('\x1b[33mDEBUG\x1b[0m ' + new Date(Date.now()).toUTCString() + ' | Backend API server initiated');
});
