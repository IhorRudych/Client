/**/

var kind = require('enyo/kind'),
    FittableRows = require('layout/FittableRows'),
    FittableColumns = require('layout/FittableColumns'),
    IconButton = require('onyx/IconButton'),
    EnyoImage = require('enyo/Image'),
    ToolDecorator = require('enyo/ToolDecorator'),
    Button = require('enyo/Button'),
    GraphPanel = require('./GraphPanel.js');

module.exports = kind({
    name: 'tst.DataPanel',
    kind: FittableRows,
    classes: 'enyo-fit data-right-column',
    published: {
        collection: null
    },
    handlers: {},
    components: [
        {name: 'ServiceToolbar', kind: FittableColumns, classes: 'data-toolbar', components: [
            {kind: FittableColumns, classes: 'data-label', components: [
                {name: 'ServicePageLogo', kind: EnyoImage, src: './assets/svg/UI-elements-forSVG_gfx-symbol-svc-light.svg'},
                {content: 'SERVICE'},
            ]},
            {fit: true},
            {kind: FittableColumns, style: 'padding-top:5px;', components: [
                {name: 'ServiceDeviceButton', kind: IconButton, classes:'btn-fade btn-icon', src: './assets/svg/UI-elements-forSVG_gfx-device-disconnected.svg', style:'margin-right:20px;'},
                // {name: 'ServiceSettingsButton', kind: IconButton, classes:'btn-fade btn-icon', src: './assets/svg/UI-elements-forSVG_gfx-settings-light.svg'},
            ]},
            {fit: true},
            { kind: FittableRows, components: [
            ]}
        ]},
        {kind: FittableRows, content:'Purge Pumps', classes:'lead'},
        {kind: FittableRows, content:'Manual Switch Valves', classes:'lead'},
        {kind: FittableRows, content:'Wifi Settings', classes:'lead'},
        {kind: FittableRows, content:'Instrument Status Details', classes:'lead'},
    ],
    bindings: [
    ],
    constructor: function () {
        this.inherited(arguments);
    },
    create: function () {
        this.inherited(arguments);
    },
    handleResize: function() {
        this.inherited(arguments);
    },
    rendered: function() {
        this.inherited(arguments);
    },
});
