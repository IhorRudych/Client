/**/

var kind = require('enyo/kind'),
    FittableRows = require('layout/FittableRows'),
    InputDecorator = require('onyx/InputDecorator'),
    Input = require('onyx/Input'),
    Plotly = require('plotly'),
    IconButton = require('onyx/IconButton'),
    Method = require('./Method.js');

const SMART_RANGE_MIN = 200;
const SMART_RANGE_ENABLE = true;

module.exports = kind({
    name: 'tx.NewViewer',
    kind: FittableRows,
    published: {
        method: null,
        model: null,
        data_config: null,
        layout_config: null,
        global_config: null,
        staticPlot: true,
        title: true,
    },
    smartRangeMin: 4095,
    smartRangeMax: 0,
    handlers: {},
    components: [
        { name: 'StaticTitle', showing: false, style: 'font-size:15px;margin-left:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;' },
        {
            name: 'TitleDecorator', kind: InputDecorator, showing: false, classes: 'input-overrider', components: [
                { name: 'Title', classes: 'text-center', style: 'font-size:10px;', kind: Input },
            ]
        },
        { name: 'Plot' },
    ],
    bindings: [
        { from: 'method.name', to: '$.Title.value', oneWay: false },
        { from: 'model.path', to: '$.StaticTitle.content' },
    ],
    constructor: function () {
        this.inherited(arguments);
    },
    create: function () {
        this.inherited(arguments);
        var data_config = [
            // Channel 0
            {
                type: 'scatter',
                mode: 'lines+markers',
                marker: {
                    opacity: 0
                },
                line: { width: 2 },
                name: 'Channel 1',
            },
            // Channel 1
            {
                type: 'scatter',
                mode: 'lines+markers',
                marker: {
                    opacity: 0
                },
                line: { width: 2 },
                name: 'Channel 2',
            },
            // Channel 2
            {
                type: 'scatter',
                mode: 'lines+markers',
                marker: {
                    opacity: 0
                },
                line: { width: 2 },
                name: 'Channel 3',
            },
            // Channel 3
            {
                type: 'scatter',
                mode: 'lines+markers',
                marker: {
                    opacity: 0
                },
                line: { width: 2 },
                name: 'Channel 4',
            },
            // Method
            {
                type: 'scatter',
                mode: 'lines+markers',
                marker: {
                    opacity: 0
                },
                line: {
                    color: 'rgba(136,189,134,1.0)',
                    width: 1
                },
                name: 'Method',
                yaxis: 'y2',
                fill: 'tozeroy',
                fillcolor: 'rgba(74,74,74,0.25)',
            },
        ];
        this.set('data_config', data_config);

        var layout_config = {
            autosize: true,
            showlegend: false,
            paper_bgcolor: 'rgb(20,20,20)',
            plot_bgcolor: 'rgb(20,20,20)',
            //            margin: {l: 32, r: 32, b: 64, t: 32, pad: 0},
            margin: { l: 8, r: 0, b: 0, t: 0, pad: 0 },
            xaxis: {
//                title: 'minutes',
//                titlefont: {
//                    size: 18,
//                    color: '#ffffff'
//                },
                autorange: true,
                rangemode: 'tozero',
                //    autotick: true,
                //    tickmode: 'none',
                //    ticks: '',
                tickcolor: 'rgb(211, 211, 211)',
                tickfont: {
                    color: 'rgb(211, 211, 211)',
                },
                showgrid: false,
                showline: false,
                showticklabels: true,
                zeroline: true,
                zerolinecolor: 'rgb(255, 255, 255)',
                zerolinewidth: 1,
            },
            yaxis: {
                autorange: true,
                rangemode: 'nonnegative',
                //            autotick: true,
                //            tickmode: 'none',
                //            ticks: '',
                tickcolor: 'rgb(211, 211, 211)',
                tickfont: {
                    color: 'rgb(211, 211, 211)',
                },
                showgrid: false,
                showline: false,
                showticklabels: true,
                zeroline: true,
                zerolinecolor: 'rgb(255, 255, 255)',
                zerolinewidth: 1,
            },
            yaxis2: {
                overlaying: 'y',
                side: 'right',
                //                range: [0, 100],
                tickcolor: 'rgb(255, 255, 255)',
                zerolinecolor: 'rgb(255, 255, 255)',
                tickfont: {
                    color: 'rgb(255, 255, 255)',
                },
            },
        };
        this.set('layout_config', layout_config);

        var global_config = {
            staticPlot: this.get('staticPlot'),
            displayModeBar: 'hover',
            scrollZoom: true,
            displaylogo: false,
            modeBarButtonsToRemove: [
                'lasso2d',
                'select2d',
                'zoom2d',
                'autoScale2d',
                'hoverClosestCartesian',
                'hoverCompareCartesian',
                'toggleSpikelines']};


        this.set('global_config', global_config);

        // Subtract 1 to remove the Method
        this.set('defaultPlotTraces', data_config.length); // - 1);
    },
    methodChanged: function () {
        var method_data = { x: [], y: [] };
        var method = this.get('method');
        if (method) {
            this.$.TitleDecorator.setShowing(true);
            method_data = Method.PlotlyHelper(method);
        }

        var data_config = this.get('data_config');
        var layout_config = this.get('layout_config');
        var global_config = this.get('global_config');

        data_config[4].x = method_data.x;
        data_config[4].y = method_data.y;

        if (this.$.Plot.hasNode()) {
            var id = this.$.Plot.id;
            Plotly.purge(id);
            Plotly.plot(id, data_config, layout_config, global_config);
        }
    },
    modelChanged: function () {
        var enabledChannels = [0, 1];
        var trace_data = {};
        for (var channelIdx in enabledChannels) {
            trace_data[channelIdx] = { x: [], y: [] };
        }
        var method_data = { x: [], y: [] };

        var model = this.get('model');
        if (model) {
            if (this.get('title')) {
                this.$.StaticTitle.setShowing(true);
            }
            var method = model.get('method');
            if (method) {
                // Render the Method if one is provided
                method_data = Method.PlotlyHelper(method);

                var channels = model.get('channels');
                if (channels) {
                    for (channelIdx in enabledChannels) {
                        if (channels[channelIdx]) {
                            var points = channels[channelIdx].get('trace');
                            points.forEach(function (point) {
                                trace_data[channelIdx].x.push(point.get('x'));
                                trace_data[channelIdx].y.push(point.get('y'));
                            });
                        }
                    }

                    var id = this.$.Plot.id;
                    this.smartRangeMin = 4095;
                    this.smartRangeMax = 0;
                    var that = this;
                    function update(inSender, inName, inChange) {
                        // console.log('channel %O', this);
                        // console.log('foo %O %O %O', inSender, inName, inChange);
                        var channels = [this.channel];
                        var samples = { x: [[]], y: [[]] };
                        for (var item of inChange.models) {
                            var x = item.get('x');
                            var y = item.get('y');
                            samples.x[0].push(x);
                            samples.y[0].push(y);
                        }
                        // console.log('extend %O %O', samples, channels);
                        if (enabledChannels.includes(this.channel)) {
                            var needRelayout = false;
                            var new_ymin = Math.min(samples.y[0]);
                            if (that.smartRangeMin > new_ymin) {
                                that.smartRangeMin = new_ymin;
                                needRelayout = true;
                            }
                            var new_ymax = Math.min(samples.y[0]);
                            if (that.smartRangeMax < new_ymax) {
                                that.smartRangeMax = new_ymax;
                                needRelayout = true;
                            }
                            if (SMART_RANGE_ENABLE && needRelayout) {
                                var rangeSize = that.smartRangeMax - that.smartRangeMin;
                                var rangeMid = (rangeSize / 2.0) + that.smartRangeMin;

                                if (rangeSize < SMART_RANGE_MIN) {
                                    var range;
                                    if ((rangeMid - SMART_RANGE_MIN / 2) < 0) {
                                        // range must start at min
                                        range = [0, SMART_RANGE_MIN];
                                    }
                                    else if ((rangeMid + SMART_RANGE_MIN / 2) > 4095) {
                                        range = [4095 - SMART_RANGE_MIN, 4095]
                                    }
                                    else {
                                        range = [that.smartRangeMin, that.smartRangeMax];
                                    }
                                    Plotly.relayout(id, 'yaxis.range', range);
                                }
                                else {
                                    range = [that.smartRangeMin, that.smartRangeMax];
                                    Plotly.relayout(id, 'yaxis.range', range);
                                }
                            }
                            Plotly.extendTraces(id, samples, channels);
                        }
                    }
                    var i = 0;
                    for (var channel of channels) {
                        // console.log('Adding listener for channel %d [%O]', i, channel);
                        var boundUpdate = update.bind({ channel: i, channelCount: channels.length });
                        channel.get('trace').addListener('add', boundUpdate);
                        i++;
                    }
                }
            }
        }

        var data_config = this.get('data_config');
        var layout_config = this.get('layout_config');
        var global_config = this.get('global_config');

        // Render the enabled channels
        for (channelIdx in enabledChannels) {
            data_config[channelIdx].x = trace_data[channelIdx].x;
            data_config[channelIdx].y = trace_data[channelIdx].y;
        }

        // Methods are rendered via config 4
        data_config[4].x = method_data.x;
        data_config[4].y = method_data.y;

        if (this.$.Plot.hasNode()) {
            var id = this.$.Plot.id;
            Plotly.purge(id);
            Plotly.plot(id, data_config, layout_config, global_config);
        }
    },
    rendered: function () {
        this.inherited(arguments);
        var id = this.$.Plot.id;
        var data_config = this.get('data_config');
        var layout_config = this.get('layout_config');
        var global_config = this.get('global_config');
        Plotly.plot(id, data_config, layout_config, global_config);
        this.resize();
    },
    handleResize: function () {
        this.inherited(arguments);
        var bounds = this.$.Plot.getBounds();
        //        console.log('bounds %O', this.$.Plot.getBounds());
        var layout = {
            height: this.get('height') || bounds.height,
            width: this.get('width') || bounds.width,
        };
        if ((layout.height === 0 && layout.width === 0) || (this.layout_height == layout.height && this.layout_width == layout.width)) {
            return;
        }
        this.layout_height = layout.height;
        this.layout_width = layout.width;

        try {
            Plotly.relayout(this.$.Plot.id, layout);
        }
        catch (error) {
            //ToDo: Resolve this error
            console.error('handleResize Error:\n', error);
        }
    },

    downloadPlot: function () {
        /**
         * function: downloadPlot
         * 
         * Downloads the DataViewer plot as a PNG
         */
        var id = this.$.Plot.id;
        var data_config = this.get('data_config');
        var layout_config = this.get('layout_config');
        var global_config = this.get('global_config');

        var download_format = { format: 'png', width: 1024, height: 768, filename: this.get('model.path') };

        Plotly.plot(id, data_config, layout_config, global_config)
            .then(function (gd) {
                Plotly.downloadImage(gd, download_format)
            });
    },
    getPlotImage: function () {
        /**
         * function: getPlotImage
         * 
         * Exports Image Promise
         */
        var id = this.$.Plot.id;
        // var data_config = this.get('data_config');
        // var layout_config = this.get('layout_config');
        // var global_config = this.get('global_config');

        var download_format = { format: 'png', width: 1024, height: 768, filename: this.get('model.path') };

        return {
            'id': id,
            plotlytoImagePromise: Plotly.toImage(id, download_format),
        };
    },
    getPlotConfig: function () {
        /**
         * function: getPlotConfig
         * 
         * Exports basic plot configuration data
         */
        return {
            'id': this.$.Plot.id,
            'data_config': this.get('data_config'),
            'layout_config': this.get('layout_config'),
            'global_config': this.get('global_config'),
        };
    },
    resetDefaults: (that) => {
        /**
         * function: resetDefaults
         * 
         * This brings the plot back to its original configuration
         */

        var data_config = [
            // Channel 0
            {
                type: 'scatter',
                mode: 'lines+markers',
                marker: {
                    opacity: 0
                },
                line: { width: 2 },
                name: 'Channel 0',
            },
            // Channel 1
            {
                type: 'scatter',
                mode: 'lines+markers',
                marker: {
                    opacity: 0
                },
                line: { width: 2 },
                name: 'Channel 1',
            },
            // Channel 2
            {
                type: 'scatter',
                mode: 'lines+markers',
                marker: {
                    opacity: 0
                },
                line: { width: 2 },
                name: 'Channel 2',
            },
            // Channel 3
            {
                type: 'scatter',
                mode: 'lines+markers',
                marker: {
                    opacity: 0
                },
                line: { width: 2 },
                name: 'Channel 3',
            },
            // Method
            {
                type: 'scatter',
                mode: 'lines+markers',
                marker: {
                    opacity: 0
                },
                line: {
                    color: 'rgba(136,189,134,1.0)',
                    width: 1
                },
                name: 'Method',
                yaxis: 'y2',
                fill: 'tozeroy',
                fillcolor: 'rgba(74,74,74,0.25)',
            },
        ];
        that.data_config = data_config;

        var layout_config = {
            autosize: true,
            showlegend: false,
            paper_bgcolor: 'rgb(20,20,20)',
            plot_bgcolor: 'rgb(20,20,20)',
            //            margin: {l: 32, r: 32, b: 64, t: 32, pad: 0},
            margin: { l: 8, r: 0, b: 0, t: 0, pad: 0 },
            xaxis: {
                autorange: true,
                rangemode: 'tozero',
                //    autotick: true,
                //    tickmode: 'none',
                //    ticks: '',
                tickcolor: 'rgb(0, 0, 0)',
                tickfont: {
                    color: 'rgb(0, 0, 0)',
                },
                showgrid: false,
                showline: false,
                showticklabels: true,
                zeroline: true,
                zerolinecolor: 'rgb(255, 255, 255)',
                zerolinewidth: 1,
            },
            yaxis: {
                autorange: true,
                rangemode: 'nonnegative',
                //            autotick: true,
                //            tickmode: 'none',
                //            ticks: '',
                tickcolor: 'rgb(0, 0, 0)',
                tickfont: {
                    color: 'rgb(0, 0, 0)',
                },
                showgrid: false,
                showline: false,
                showticklabels: true,
                zeroline: true,
                zerolinecolor: 'rgb(255, 255, 255)',
                zerolinewidth: 1,
            },
            yaxis2: {
                overlaying: 'y',
                side: 'right',
                //                range: [0, 100],
                tickcolor: 'rgb(255, 255, 255)',
                zerolinecolor: 'rgb(255, 255, 255)',
                tickfont: {
                    color: 'rgb(255, 255, 255)',
                },
            },
        };
        that.layout_config = layout_config;

        var global_config = { staticPlot: that.staticPlot, displayModeBar: false };
        that.global_config = global_config;

        // Subtract 1 to remove the Method
        that.defaultPlotTraces = data_config.length; // - 1);
    },
});
