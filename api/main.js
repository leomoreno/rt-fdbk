'use strict';

var SwaggerExpress = require('swagger-express-mw');
var app = require('express')();
module.exports = app; // for testing

var config = {
  appRoot: __dirname, // required config
  swaggerSecurityHandlers: {
    api_key: function (req, authOrSecDef, scopesOrApiKey, cb) {
      // for some reason `scopesOrApiKey` is undefined on server
      // disabling security for a while
      cb(null);
      // if ('1234' === scopesOrApiKey) {
      //     cb(null);
      // } else {
      //     cb(new Error(`Access denied wrong API key ${scopesOrApiKey}`));
      // }
    }
  }
};

SwaggerExpress.create(config, function(err, swaggerExpress) {
  if (err) { throw err; }

  // install middleware
  swaggerExpress.register(app);

  var port = process.env.PORT || 8081;
  app.listen(port);
  console.info(`Listening on port ${port}`);
});
