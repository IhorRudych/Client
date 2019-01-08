/**/

var kind = require('enyo/kind'),
    FittableRows = require('layout/FittableRows'),
    Plotly = require('plotly');

module.exports = kind({
    name: 'tx.DataViewer',
    kind: FittableRows,
    published: {
        model: null,
        xdata: [],
        ydata: [],
        width: 192,
        height: 192,
        markers: false,
    },
    handlers: {},
    components: [
        { name: 'Title', style: 'font-size:12pt;' },
        { name: 'Plot', fit: true, style: 'border: solid 1px;', },
    ],
    bindings: [
        { from: 'model.path', to: '$.Title.content' },
    ],
    constructor: function () {
        this.inherited(arguments);
    },
    create: function () {
        this.inherited(arguments);
    },
    modelChanged: function (inOldVal, inNewVal, c) {
        var xdata = [];
        var ydata = [];
        var model = this.get('model');
        if (model) {
            var channels = model.get('channels');
            if (channels) {
                var points = channels[0].get('trace');
                points.forEach(function (point) {
                    var x = point.get('x');
                    var y = point.get('y');
                    xdata.push(x);
                    ydata.push(y);
                });
            }
        }
        this.set('xdata', xdata);
        this.set('ydata', ydata);

        if (this.$.Plot.hasNode()) {
            this.render();
        }
    },
    rendered: function () {
        this.inherited(arguments);

        var plot_data = [
            {
                type: 'line',
                mode: 'lines',
                x: this.get('xdata'),//xdata,
                y: this.get('ydata'),//ydata,
                //                fill: 'tozeroy',
                //                fillcolor: 'rgb(136,189,134)',
                line: {
                    color: 'rgb(136,189,134)',
                    width: 2
                },
            }
        ];

        var plot_layout = {
            autosize: false,
            showlegend: false,
            height: this.get('height'),
            width: this.get('width'),
            paper_bgcolor: 'rgb(255,255,255)',
            plot_bgcolor: 'rgb(255,255,255)',
            margin: { l: 8, r: 8, b: 16, t: 16, pad: 0 },
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
        Plotly.plot(id, plot_data, plot_layout, { staticPlot: true, displayModeBar: false });
    },
    handleResize: function () {
        this.inherited(arguments);

        var layout = {
            height: this.get('height') || this.$.Plot.getBounds().height,
            width: this.get('width') || this.$.Plot.parent.getBounds().width,
        };

        this.$.Plot.setBounds(layout);

        var id = this.$.Plot.id;
        Plotly.relayout(id, layout);
    },
});
