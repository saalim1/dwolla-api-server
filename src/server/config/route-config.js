(function(routeConfig) {

  'use strict';

  routeConfig.init = function(app) {

    var jwt = require('express-jwt');
    var cors = require('cors');

/*    var jwtCheck = jwt({
      secret: process.env.CLIENT_SECRET,
      audience: process.env.CLIENT_ID
    });
*/
    /*var jwtCheck = jwt({
      secret: new Buffer(process.env.CLIENT_SECRET, 'base64'),
      audience: process.env.CLIENT_ID
    // });*/

    //app.use(jwtCheck);
    app.use(cors());
    // *** routes *** //
    const routes = require('../routes/index');
    const users = require('../routes/users');
    const tips = require('../routes/tips');
    const balanceActions = require('../routes/balance-actions');
    const hotels = require('../routes/hotels');
    const reviews = require('../routes/reviews');

    // *** register routes *** //
    app.use('/', routes);
    app.use('/users', /*jwtCheck,*/ users);
    app.use('/tips', /*jwtCheck,*/ tips);
    app.use('/balance', /*jwtCheck,*/ balanceActions);
    app.use('/hotels', /*jwtCheck,*/ hotels);
    app.use('/reviews', /*jwtCheck,*/ reviews);
  };

})(module.exports);
