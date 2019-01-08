/**/

var kind = require('enyo/kind'),
    FittableRows = require('layout/FittableRows'),
    Plotly = require('plotly');

module.exports = kind({
    name: 'tx.MethodViewer',
    kind: FittableRows,
    published: {
        model: null,
        xdata: [],
        ydata: [],
        markers: false,
    },
    handlers: {},
    components: [
        {name: 'Title'},
        {name: 'Plot', style: 'border: solid 1px black;'},
    ],
    bindings: [
        {from: 'model.name', to: '$.Title.content'},
    ],
    constructor: function () {
        this.inherited(arguments);
    },
    create: function () {
        this.inherited(arguments);
    },
    modelChanged: function(inOldVal, inNewVal, c) {
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
    },
    rendered: function() {
        this.inherited(arguments);

        var plot_data = [
            {
                type: 'line',
                mode: 'lines',
                x: this.get('xdata'),//xdata,
                y: this.get('ydata'),//ydata,
                fill: 'tozeroy',
                fillcolor: 'rgb(136,189,134)',
                line: {
                    color: 'rgb(136,189,134)',
                    width: 1
                },
            }
        ];

        var plot_layout = {
            autosize: false,
            showlegend: false,
            paper_bgcolor: 'rgb(255,255,255)',
            plot_bgcolor: 'rgb(255,255,255)',
            margin: {l: 8, r: 8, b: 16, t: 16, pad: 0},
            xaxis: {
                autorange: true,
                rangemode: 'tozero',
//            autotick: true,
//            tickmode: 'none',
//            ticks: '',
//            tickcolor: 'rgb(136,189,134)',
//            tickfont: {
//                color: 'rgb(136,189,134)',
//            },
                showgrid: false,
                showline: false,
                showticklabels: false,
                zeroline: true,
//            zerolinecolor: 'rgb(136,189,134)',
                zerolinewidth: 1,
            },
            yaxis: {
                autorange: true,
                rangemode: 'nonnegative',
//            autotick: true,
//            tickmode: 'none',
//            ticks: '',
//            tickcolor: 'rgb(136,189,134)',
//            tickfont: {
//                color: 'rgb(136,189,134)',
//            },
                showgrid: false,
                showline: false,
                showticklabels: false,
                zeroline: true,
//            zerolinecolor: 'rgb(136,189,134)',
                zerolinewidth: 1,
            }
        };

//        if (this.get('marker')) {
//            this.plot_data[0].marker = {
//                symbol: 'circle-open',
//                size: 12,
//                color: 'rgb(230,114,30)',
//            };
//        }

        var id = this.$.Plot.id;
        Plotly.plot(id, plot_data, plot_layout, {staticPlot: true, displayModeBar: false});
        this.resize();
    },
    handleResize: function() {
        this.inherited(arguments);
        var bounds = this.getBounds();
	var layout = {
            height: this.get('height') || bounds.height,
            width: this.get('width') || bounds.width,
        };
//        this.$.Plot.setBounds(layout);
	Plotly.relayout(this.$.Plot.id, layout);
    },
});
