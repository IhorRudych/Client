/**/

var kind = require('enyo/kind'),
    FittableRows = require('layout/FittableRows'),
    IconButton = require('onyx/Icon');

module.exports = kind({
    name: 'tst.QuickStop',
    kind: FittableRows,
    published: {
        classes: 'run-text btn btn-rounded'
    },
    handlers: {},
    events: {
    },
    components: [
        {content: 'QUICK', classes: 'lead'},
        {kind: IconButton, src: './assets/svg/UI-elements-forSVG_gfx-cancelled.svg', classes:'cancelled btn-fade'},
        {content: 'STOP', classes: 'lead'},
    ],
    bindings: [],
    constructor: function () {
        this.inherited(arguments);
    },
    create: function () {
        this.inherited(arguments);
    },
});