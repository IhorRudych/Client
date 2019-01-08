// This is the default "main" file, specified from the root package.json file
// The ready function is excuted when the DOM is ready for usage.

var ready = require('enyo/ready'),
    App = require('./src/app.js');

ready(function() {
    new App().renderInto(document.body);
});
