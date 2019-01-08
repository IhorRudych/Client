/**/

var kind = require('enyo/kind'),
    FittableRows = require('layout/FittableRows'),
    FittableColumns = require('layout/FittableColumns'),
    IconButton = require('onyx/IconButton'),
    Plotly = require('plotly'),
    MethodEditorPullout = require('./MethodEditorPullout.js');

var plot_data = [
    {
        type: 'line',
        mode: 'lines',
        x: [],
        y: [],
        fill: 'tozeroy',
        fillcolor: 'rgb(216,217,218)',
        line: {
            color: 'rgb(136,189,134)',
            width: 10
        },
    }
];

var plot_layout = {
    autosize: false,
    showlegend: false,
    paper_bgcolor: 'rgb(14,14,14)',
    plot_bgcolor: 'rgb(14,14,14)',
    margin: {l: 32, r: 32, b: 32, t: 32, pad: 0},
    xaxis: {
        autorange: true,
        rangemode: 'tozero',
        autotick: true,
        tickcolor: 'rgb(216,217,218)',
        tickfont: {
            color: 'rgb(216,217,218)',
        },
        showgrid: true,
        showline: true,
        showticklabels: true,
        zeroline: true,
        zerolinecolor: 'rgb(216,217,218)',
        zerolinewidth: 1,
    },
    yaxis: {
        autorange: true,
        rangemode: 'nonnegative',
        autotick: true,
        tickcolor: 'rgb(216,217,218)',
        tickfont: {
            color: 'rgb(216,217,218)',
        },
        showgrid: true,
        showline: true,
        showticklabels: true,
        zeroline: true,
        zerolinecolor: 'rgb(216,217,218)',
        zerolinewidth: 1,
    }
};

module.exports = kind({
    name: 'tx.MethodEditor',
    kind: FittableColumns,
    published: {
        model: null,
        xdata: [],
        ydata: [],
        markers: false,
    },
    handlers: {},
    components: [
        {name: 'Plot', fit: true, style: 'border: solid 1px black;width:100%;height:100%;'},
        {name: 'Pullout', kind: MethodEditorPullout, style: 'height:100%;'},
    ],
    bindings: [
        {from: 'model', to: '$.Pullout.model'},
    ],
    constructor: function () {
        this.inherited(arguments);
    },
    create: function () {
        this.inherited(arguments);
    },
    modelChanged: function(inOldVal, inNewVal, c) {
//        console.log('modelChanged');
        var xdata = [];
        var ydata = [];
        var model = this.get('model');
        if (model) {
            var commands = model.get('commands');
            if (commands) {
                commands.forEach(function(cmd) {
                    var x = cmd.get('x');
                    var y = cmd.get('y');
                    xdata.push(x);
                    ydata.push(y);
                });
            }
        }
        this.set('xdata', xdata);
        this.set('ydata', ydata);

        var plot_data = [
            {
                type: 'line',
                mode: 'lines',
                x: xdata,
                y: ydata,
                fill: 'tozeroy',
                fillcolor: 'rgb(74,74,74)',
                line: {
                    color: 'rgb(136,189,134)',
                    width: 1
                },
            }
        ];

        var bounds = this.getBounds();
        plot_layout.height = bounds.height;
        plot_layout.width = bounds.width;

        var id = this.$.Plot.id;
        Plotly.purge(id);
        Plotly.plot(id, plot_data, plot_layout, {staticPlot: false, displayModeBar: false});
    },
    rendered: function() {
        this.inherited(arguments);

        var xdata = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
        var ydata = [];
        var phase = 3 * Math.PI * Math.random();
        for (i = 0; i < xdata.length; i++) {
            var noise = Math.random();
            ydata.push(200 * Math.abs((Math.sin((i * 2 * Math.PI / 10) + phase) + noise) / 4));
        }

        var plot_data = [
            {
                type: 'line',
                mode: 'lines',
                x: xdata,
                y: ydata,
                fill: 'tozeroy',
                fillcolor: 'rgb(136,189,134)',
                line: {
                    color: 'rgb(136,189,134)',
                    width: 1
                },
            }
        ];

        var bounds = this.getBounds();
        plot_layout.height = bounds.height;
        plot_layout.width = bounds.width;

//        if (this.get('marker')) {
//            this.plot_data[0].marker = {
//                symbol: 'circle-open',
//                size: 12,
//                color: 'rgb(230,114,30)',
//            };
//        }

        var id = this.$.Plot.id;
        Plotly.plot(id, plot_data, plot_layout, {staticPlot: false, displayModeBar: false});
    },
    handleResize: function() {
        this.inherited(arguments);
        var bounds = this.getBounds();
        var id = this.$.Plot.id;
        Plotly.relayout(id, {height: bounds.height, width: bounds.width});
//        this.$.Plot.setBounds({
//            height: bounds.height,
//            width: bounds.width,
//        });
    },
});
