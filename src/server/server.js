(function() {

  'use strict';

  const app = require('./app');
  const debug = require('debug')('herman-express:server');
  const http = require('http');

  // Initialize the app.
  var server = app.listen(process.env.PORT || 9000, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });

  function onError(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }
    const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  }

  function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    debug('Listening on ' + bind);
  }

}());
