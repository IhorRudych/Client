/**/

var kind = require('enyo/kind'),
    FittableRows = require('layout/FittableRows');

module.exports = kind({
    name: 'tx.Splash',
    kind: FittableRows,
    classes: 'splash',
    fit: true,
    handlers: {
        ontap: 'tapHandler',
    },
    components: [
        {fit: true},
    ],
    bindings: [
    ],
    constructor: function () {
        this.inherited(arguments);
    },
    create: function () {
        this.inherited(arguments);
    },
});
