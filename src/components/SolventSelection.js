/*
 */

var kind = require('enyo/kind'),
    FittableColumns = require('layout/FittableColumns'),
    Select = require('enyo/Select');

module.exports = kind({
    name: 'tx.SolventSelection',
    kind: FittableColumns,
    classes: '',
    published: {
    },
    events: {
    },
    components: [
        {kind: Select, onchange: 'selectChanged', classes:'style-selected', components: [
            {content: 'Water', value: 'a'},
            {content: 'Methanol', value: 'b'},
            {content: 'Acetonitrile', value: 'c'}
        ]}
    ],
    bindings: [
    ],
});
