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
    Icon = require('onyx/Icon');

var Plotly = require('plotly');

var Graph = module.exports = kind({
    name: 'tst.Plot',
    kind: Control,
    handlers: {},
    components: [
        {name: 'Root', fit: true}
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
        var id = this.$.Root.id;

        var xdata = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
        var ydata = [];
        var phase = 3 * Math.PI * Math.random();
        for (i = 0; i < xdata.length; i++) {
            var noise = Math.random();
            ydata.push(200 * Math.abs((Math.sin((i * 2 * Math.PI / 10) + phase) + noise) / 4));
        }

        var data = [
            {
                x: xdata,
                y: ydata,
                type: 'scatter',
                mode: 'lines+markers',
                fill: 'tozeroy',
                fillcolor: 'rgb(255,255,255)',
                line: {
                    color: 'rgb(136,189,134)',
                    width: 3
                },
                marker: {
                    symbol: 'circle-open',
                    size: 120,
                    color: 'rgb(230,114,30)',
                }
            }
        ];

        var bounds = this.getBounds();

        var layout = {
            autosize: false,
            height: bounds.height,
            width: bounds.width,
            showlegend: false,
            paper_bgcolor: 'rgb(255,255,255)',
            plot_bgcolor: 'rgb(255,255,255)',
            margin: {
                l: 32,
                r: 0,
                b: 32,
                t: 8,
                pad: 0
            },
            xaxis: {
                autotick: true,
                tickmode: 'auto',
                ticks: '',
                tickcolor: 'rgb(136,189,134)',
                tickfont: {
                    color: 'rgb(136,189,134)',
                },
                showgrid: false,
                showline: false,
                showticklabels: true,
                zeroline: true,
                zerolinecolor: 'rgb(136,189,134)',
                zerolinewidth: 4,
                showticklabels: false,
            },
            yaxis: {
                range: [0, 100],
                autotick: true,
                tickmode: 'auto',
                ticks: '',
                tickcolor: 'rgb(136,189,134)',
                tickfont: {
                    color: 'rgb(136,189,134)',
                },
                nticks: 3,
                showgrid: true,
                showline: true,
                showticklabels: true,
                zeroline: true,
                zerolinecolor: 'rgb(136,189,134)',
                zerolinewidth: 4,
            }
        };
        Plotly.plot(id, data, layout, {staticPlot: false, displayModeBar: false});
    },
});
