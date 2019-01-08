/*
 */

var kind = require('enyo/kind'),
    FittableRows = require('layout/FittableRows');

module.exports = kind({
    name: "TimeDisplay",
    kind: FittableRows,
    published: {
        title: '',
        classes: 'btn',
        message: 'RUN TIME',
        elapsed: '-'
    },
    events: {
    },
    components: [
        {name: 'Title', classes: 'head-info'},
        {name: 'Message', content: 'RUN TIME', classes: 'run-text'},
        {name: 'Elapsed', content: '0', classes: 'run-text'},
        {content: 'SECONDS',  classes: 'head-info'},
    ],
    bindings: [
        {from: 'elapsed', to: '$.Elapsed.content'},
        {from: 'title', to: '$.Title.content', transform: function(v) {
            return 'NAME: ' + v;
        }},
        {from: 'message', to: '$.Message.content' },
    ],
    create: function() {
        this.inherited(arguments);
    },
})
