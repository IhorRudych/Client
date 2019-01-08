/**/

var kind = require('enyo/kind'),
    FittableRows = require('layout/FittableRows'),
    FittableColumns = require('layout/FittableColumns'),
    Toolbar = require('onyx/Toolbar'),
    Button = require('onyx/Button'),
    IconButton = require('onyx/IconButton'),
    Scroller = require('enyo/Scroller'),
    Control = require('enyo/Control'),
    Collection = require('enyo/Collection'),
    DataList = require('enyo/DataList'),
    Input = require('enyo/Input'),
    TextArea = require('onyx/TextArea'),
    Picker = require('onyx/Picker'),
    Panels = require('layout/Panels'),
    Signals = require('enyo/Signals'),
    PickerDecorator = require('onyx/PickerDecorator'),
    CollapsingArranger = require('layout/CollapsingArranger'),
    FittableColumnsLayout = require('layout/FittableLayout').Columns,
    ShowingTransitionSupport = require('enyo/ShowingTransitionSupport'),
    Slideable = require('layout/Slideable'),
    Icon = require('onyx/Icon');

var Graph = require('./Graph.js');

var GraphPanel = module.exports = kind({
    name: 'tst.GraphPanel',
    kind: FittableRows,
    handlers: {},
    components: [
        {name: 'Plot1', kind: Graph, classes: 'my-plot-gradient test'},
        {name: 'Plot2', kind: Graph, classes: 'my-plot-data test'},
        {name: 'Plot3', kind: Graph, classes: 'my-plot-pressure test'},
        {name: 'TestTableArea', kind: Slideable, axis: 'h', unit: '%', min: 0, max: 95, value: 95, classes: 'enyo-fit slideable-sample right', components: [
            {content: 'This is the placeholder for the gradient tables'},
        ]},
    ],
    bindings: [],
    constructor: function () {
        this.inherited(arguments);
    },
    create: function () {
        this.inherited(arguments);
    },
    rendered: function() {
        this.inherited(arguments);
        this.resize();
    },
    handleResize: function() {
        this.inherited(arguments);
        var gradient_height = Math.floor(this.getBounds().height * 4.0 / 10);
        this.$.Plot1.setBounds({
            height: gradient_height
        });
        this.$.Plot1.render();

        var data_height     = Math.floor(this.getBounds().height * 4.0 / 10);
        this.$.Plot2.setBounds({
            height: data_height
        });
        this.$.Plot2.render();

        var pressure_height = Math.floor(this.getBounds().height * 2.0 / 10);
        this.$.Plot3.setBounds({
            height: pressure_height
        });
        this.$.Plot3.render();
    },
});
