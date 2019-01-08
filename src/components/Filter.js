/**/

var kind = require('enyo/kind'),
    Model = require('enyo/Model'),
    Collection = require('enyo/Collection'),
    RelationalModel = require('enyo/RelationalModel'),
    Data = require('./Data.js');
   

var SG = require('../../lib/ml-savitzky-golay-generalized'),
    MAs = require('../../lib/moving-averages');
var PA = require('./PeakTools.js');
var d3_peaks = require('../../lib/d3-peaks');

/** TODO: define the "values" data structure
*/

/** TODO: define the "annotation" data structure
 */

/** Filter base class
 */
var filterCount = 0;
var Filter = exports.Filter = kind({
    name: 'tx.Filter',
    kind: RelationalModel,
    primaryKey: 'id',
    attributes: {
        id: null,
        name: null,
        parameters: {},
        enabled: true,
        inputs: null,
        outputs: null,
        values: new Collection([]),
        values2: new Collection([]),
        annotations: new Collection([]),
        info: null,
    },
    run: function (channels) {
        console.log('    Running \'%s\' Filter with %O', this.get('name'), this.get('parameters'));
    },
    constructor: kind.inherit(function (sup) {
        return function (attrs, props, opts) {
            sup.call(this, attrs, props, opts);
            this.set('id', filterCount);
            // Allocate a new set of output channels.
            //console.log('Allocating a new set of channels');
            var channels = [
                new Data.Channel({ trace: new Data.Trace() }),
                new Data.Channel({ trace: new Data.Trace() }),
                new Data.Channel({ trace: new Data.Trace() }),
                new Data.Channel({ trace: new Data.Trace() }),
            ];
            this.set('outputs', channels);
            filterCount++;
        };
    }),
});

/** Sample Filter implementation (Moving Average)
 */

// ToDo: Finish this filter!!! MODIFY THIS DEFINITION OF A MOVING AVERAGE //!@#$%^&*()
var FilterMovingAverage = kind({
    kind: Filter,
    attributes: {
        name: 'Moving Average',
        parameters: { N: 4 },
        enabled: true,
        info: 'A Moving Average is a calculation to analyze data points by creating a series of averages of different subsets in the full data set.',
    },
    run: function (channels) {
        this.inherited(arguments);
        var N = this.get('parameters').N;
        var avg = 0.0;
        var that = this;
        var channel_idx = 0;
        channels.forEach(function (channel, i) {
            if (channel_idx <= 1 /*1 -> processUpToChannel*/) {
                let outputs = that.get('outputs');
                if (outputs[channel_idx]) {
                    var output_channel = outputs[channel_idx].get('trace');
                    var input_trace = channel.get('trace');
                    input_trace.forEach(function (point) {
                        avg -= avg / N;
                        avg += point.get('y') / N;
                        output_channel.add({ 
                            x: point.get('x'), 
                            y: avg,
                            c: channel_idx + 1,
                            a: 0
                        });
                    });
                }
            }
            channel_idx++;
        });
        return this.get('outputs');
    }
});

/** Sample Filter implementation (LOESS)
 * 
 * TODO: actually write an implementation for this
 */
var Filter_LOESS = kind({
    kind: Filter,
    attributes: {
        name: 'LOESS',
        parameters: {},
        enabled: true,
        info: 'This is the LOESS filter',
    },
    run: function (channels) {
        this.inherited(arguments);

        // NOTE: This filter will not output a "stream", rather it will output
        // "values" so we just copy the input to the output.
        this.set('outputs', channels);

        return this.get('outputs');
    }
});

/** Sample Filter implementation (Peak Finder)
 * 
 * TODO: this just finds the maximum value, replace this with somethign smarter
 */
var FilterPeakFinder = kind({
    kind: Filter,
    attributes: {
        name: 'Peak Finder',
        parameters: {},
        enabled: true,
        info: 'This is the Peak Finder filter',
    },
    run: function (channels) {
        this.inherited(arguments);

        // NOTE: This filter will not generate "output", rather it will output
        // "values" so we just copy "inputs" to the "outputs".
        this.set('outputs', channels);

        // NOTE: This function just finds the maximum value and associated time for each input stream.
        var that = this;
        channels.forEach(function (channel, channel_idx) {
            if (channel_idx <= 1 /*1 -> processUpToChannel*/) {
                var max_time = null;
                var max_value = 0.0;
                var values_channel = [];
                var input_trace = channel.get('trace');
                input_trace.forEach(function (point) {
                    var time = point.get('x');
                    var value = point.get('y');
                    if (value > max_value) {
                        max_time = time;
                        max_value = value;
                    }
                });
                values_channel.push({ x: max_time, y: max_value });
                that.get('values').add(values_channel);
            }
        });
        return this.get('outputs');
    }
});


/** Sample Filter implementation (Invert)
 */
var FilterInvert = kind({
    kind: Filter,
    attributes: {
        name: 'Invert',
        parameters: { max: 4096 },
        enabled: true,
        info: 'The Invert filter will display the inverted or reversed composition',
    },
    run: function (channels) {
        this.inherited(arguments);
        var that = this;
        var channel_idx = 0;
        channels.forEach(function (channel) {
            if (channel_idx <= 1 /*1 -> processUpToChannel*/) {
                let outputs = that.get('outputs');
                if (outputs[channel_idx]) {
                    var output_channel = outputs[channel_idx].get('trace');
                    var input_trace = channel.get('trace');
                    input_trace.forEach(function (point) {
                        output_channel.add({ 
                            x: point.get('x'), 
                            y: that.get('parameters').max - point.get('y'),
                            c: channel_idx +1,
                            a: 0 
                        });
                    });
                }
            }
            channel_idx++;
        });
        return this.get('outputs');  
    }
});

/** Filter: Peak Finder 
 * 
 *  Library: d3-peaks
 * 
 */
let ricker = d3_peaks.ricker;
var Filter_PeakFinder = kind({
    kind: Filter,
    attributes: {
        name: 'Peak Finder',
        parameters: {
            kernel: 'ricker',
            gapThreshold: 1,
            minLineLength: 1,
            minSNR: 1.0,
            widths: [1],
        },
        enabled: true,
        info: 'The Peak Finder will help you find peaks and measure distance and amplitude between peaks in a noisy signal',
    },
    run: function (channels) {
        this.inherited(arguments);
        let parameters = this.get('parameters');
        let default_parameters = {
            kernel: 'ricker',
            gapThreshold: 1,
            minLineLength: 1,
            minSNR: 1.0,
            widths: [1],
        };

        // NOTE: This filter will not generate "output", rather it will output
        // "values" so we just copy "inputs" to the "outputs".
        this.set('outputs', channels);

        var that = this;
        channels.forEach(function (channel, channel_idx) {
            if (channel_idx <= 1 /*1 -> processUpToChannel*/) {
                let x = [],
                    y = [];
                var max_time = null;
                var max_value = 0.0;
                var values_channel = [];
                var input_trace = channel.get('trace');
                input_trace.forEach(function (point) {
                    x.push(point.get('x'));
                    y.push(point.get('y'));
                });
                let findPeaks = d3_peaks.findPeaks();

                for (let key in parameters) {
                    if (!parameters.hasOwnProperty(key)) { continue; }
                    if (parameters[key] != default_parameters[key]) {
                        // console.log(key, parameters[key], default_parameters[key], parameters[key] != default_parameters[key]);
                        if (key == 'kernel') {
                            // if (parameters[key] == 'ricker') {
                            findPeaks[key](ricker);
                            // } else {
                            //     findPeaks[key](parameters[key]);
                            // }
                        } else {
                            findPeaks[key](parameters[key]);
                        }
                    }
                    // else {
                    // console.log(key, parameters[key], default_parameters[key], parameters[key] != default_parameters[key]);
                    // }
                }
                let peaks = findPeaks(y);
                // console.log('peaks', peaks);
                peaks.forEach((peak, index) => {
                    // console.log('x,y', x[peak.index], y[peak.index]);
                    values_channel.push({ x: x[peak.index], y: y[peak.index], width: peak.width, snr: peak.snr });
                });
                that.get('values').add(values_channel);
                // console.log('vals', that)
            }
        });
        return this.get('outputs');
    }
});


/** Filter:  Savitzky Golay
 * 
 *  Library: ml-savitzky-golay-generalized
 */
var Filter_SavitzkyGolay = kind({
    kind: Filter,
    attributes: {
        name: 'Savitzky-Golay',
        parameters: {
            deltaX: 1,
            windowSize: 5,
            derivative: 0,
            polynomial: 2,
        },
        enabled: true,
        info: 'Savitzky–Golay can be applied to a set of digital data points for the purpose of smoothing the data, i.e., to increase the signal-to-noise ratio without distorting the signal significantly.',
    },
    run: function (channels) {
        this.inherited(arguments);
        SG = require('../../lib/ml-savitzky-golay-generalized');
        var that = this;
        var channel_idx = 0;
        const gaps = Math.floor(this.get('parameters').windowSize / 2);
        channels.forEach(function (channel) {
            if (channel_idx <= 1 /*1 -> processUpToChannel*/) {
                let outputs = that.get('outputs');
                if (outputs[channel_idx]) {
                    var output_channel = outputs[channel_idx].get('trace');
                    var input_trace = channel.get('trace');
                    if (input_trace.length) {
                        let x = [],
                            y = [],
                            c = [],
                            a = [];
                        input_trace.forEach(function (point) {
                            x.push(point.get('x'));
                            y.push(point.get('y'));
                            c.push(channel_idx + 1);
                            a.push(0);
                        });
                        let deltaX = that.get('parameters').deltaX;
                        var options = Object.assign({}, that.get('parameters'));
                        delete options.deltaX;
                        let SG_y = SG(y, deltaX, options);
                        x.map(function (x_point, index) {
                            // if (index >= gaps && index + gaps < x.length) {
                            // console.log('sg_y[i]', {
                            //     x: x_point,
                            //     y: SG_y[index - gaps]
                            // });
                            return output_channel.add({
                                x: x_point,
                                y: SG_y[index],
                                c:c[index],
                                a:0,
                            });
                            // }
                        }.bind(this));
                        // console.log('y', y, '\nSG-2_y', SG_y);
                    }
                }
            }
            channel_idx++;
        });
        return this.get('outputs');
    }
});
/*
var Filter_PeakArea = kind({
    kind: Filter,
    attributes: {
        name: 'Peak Area',
        enabled: true,
        info: ' there is going to be some description here',
    },
    run: function (channels) {
        var channel_idx = 0;
        this.set('outputs', channels);
        var that = this;
        var values_channel = [];
        var peakInfo = [];
        var chandata = [];
        channels.forEach(function (channel) {
            var arrY = [];
            var arrXY =[];
            if (channel_idx <= 1 ) {
                chandata[channel_idx] = channel.get('trace');
                let outputs = that.get('outputs');
                if (outputs[channel_idx]) {
                    //var output_channel = outputs[channel_idx].get('trace');
                    var input_trace = channel.get('trace');
                    //console.log(input_trace);
                    if (input_trace.length) {
                        //let pnts = [];
                       let trace_idx = 0;
                         input_trace.forEach(function (point) {
                            point = [trace_idx, point.get('y')];
                            arrY.push(point);
                           // point2 = [trace_idx, point.get('x'), point.get('y')];
                            //arrXY.push(point2);
                            peakInfo[channel_idx] = PA(point, channel_idx);
                            trace_idx++;
                          });
                        
                    }
                }
            }
            
            for (i=0;i<chandata.length;i++){ 
                peaks = peakInfo[i];

            let curchan = chandata[i];
                        //let result = peaksResult.sort(function(a, b){return a.peakIdx - b.peakIdx});//sorting by index.
                        console.log(peaks.length);
                        peaks.forEach((peak, index) => {
                            let x = curchan.get('models');
                            let xs = x[peak.peakIdx];
                            console.log(peak, xs);
                        if (xs != undefined){
                            let xd = xs.get('x');
                            //let p = arrXY[peak.peakIdx];
                            //console.log(xd);
                           values_channel.push({ x:xd, y: peak.peak, area: peak.area });
                        }
                        });
                        that.get('values').add(values_channel);
                }
        }); 
         return this.get('outputs');
      } 
    });
*/
var Filter_PeakArea = kind({
    kind: Filter,
    attributes: {
        name: 'Peak Area',
        enabled: true,
        info: 'Peak Area measures the area of a all peaks on all channels. It requires a large data sampling range to function correctly.',
    },
    run: function (channels) {
        PA.resetPeakTools();
        var channel_idx = -1;
        this.set('outputs', channels);
        //console.log(channels.length);
        var that = this;
        var values_channel = [];
        var peakInfo = [];
        var chandata = [];
        channels.forEach(function (channel) {
            channel_idx++;
            if (channel_idx <= 2 /*1 -> processUpToChannel*/) {
                chandata[channel_idx] = channel.get('trace');
                let outputs = that.get('outputs');
                if (outputs[channel_idx]) {
                    var input_trace = channel.get('trace');
                     //console.log(input_trace);
                    if (input_trace.length) {
                        //console.log(input_trace);
                       let trace_idx = 0;
                         input_trace.forEach(function (point) {

                            peakInfo[channel_idx] = PA.newData([point.get('x'), point.get('y')], channel_idx);
                            trace_idx++;
                          });
                       PA.endData(channel_idx);
                    }
                }
                peaks = peakInfo[channel_idx];
                let curchan = chandata[channel_idx];

                            peaks.forEach((peak, index) => {
                                let x = curchan.get('models');
                                let xs = x[peak.peakIdx];
                                  //console.log(xs);
                                if (xs != undefined){
                                let xd = xs.get('x');  
                                // console.log(peak);
                                if (channel_idx === 0){
                                    values_channel.push({ ch: 1, x:xd, y: peak.peakRaw, y2:peak.peak, area: parseInt(peak.area), startx:peak.start[0],starty:peak.start[1], endx:peak.end[0], endy:peak.end[1]});
                                } else if (channel_idx === 1){
                                    values_channel.push({ ch: 2, x:xd, y: peak.peakRaw, y2:peak.peak, area: parseInt(peak.area), startx:peak.start[0],starty:peak.start[1], endx:peak.end[0], endy:peak.end[1]});
                                }
                           } 
                            });
                        }
                    }); 
        that.get('values').add(values_channel);
        //console.log(that.get('values'));
        //console.log(this.get('outputs'));
        return this.get('outputs');
        
      } 
    });
    
/** Filter:  Simple Moving Average
 */
/* var Filter_SimpleMovingAverage = kind({
    kind: Filter,
    attributes: {
        name: 'Simple Moving Average',
        parameters: {
            size: 3
        },
        enabled: true,
    },
    run: function (channels) {
        this.inherited(arguments);
        var that = this;
        var channel_idx = 0;
        channels.forEach(function (channel) {
            if (channel_idx <= 1 ) { //1 -> processUpToChannel
                let outputs = that.get('outputs');
            if (outputs[channel_idx]) {
                var output_channel = outputs[channel_idx].get('trace');
                var input_trace = channel.get('trace');
                if (input_trace.length) {
                    let x = [],
                        y = [];
                    input_trace.forEach(function (point) {
                        x.push(point.get('x'));
                        y.push(point.get('y'));
                        // output_channel.add({ x: point.get('x'), y: avg });
                    });
                    let MAs_sma_y = MAs.ma(y, that.get('parameters').size);
                    x.map(function (x_point, index) {
                        // if ( index >= -1 + that.get('parameters').size &&  !isNaN(MAs_sma_y[index])) {
                        if (isNaN(MAs_sma_y[index])) {
                            console.log('NAN')
                            return output_channel.add({
                                x: x_point,
                                y: y[index]
                            });
                        } else {
                            console.log('!NAN')
                            return output_channel.add({
                                x: x_point,
                                y: MAs_sma_y[index]
                            });
                        }
                    }.bind(this));

                    console.log('y', y, '\nMAs_sma_y', MAs_sma_y);
                }
            }
        }
            channel_idx++;
        });
        return this.get('outputs');
    }
}); */






/** FilterStack class
 */
var filterStackCount = 0;
var FilterStack = exports.Stack = kind({
    name: 'tx.FilterStack',
    kind: RelationalModel,
    primaryKey: 'id',
    attributes: {
        id: null,
        name: null,
        filters: null,
        results: null,
        inputIsOutputCount: 0,
    },
    run: function (channels) {
        console.log('Running FilterStack \'%s\'', this.get('name'));
        var current_channels = channels;
        var filters = this.get('filters');
        let return_channels = [];
        let that = this;

        //ToDo: Revisit when order of filters changes //!@#$%^&*()
        filters.forEach(function (filter) {
            if (filter.get('enabled')) {
                filter.set('values', new Collection([]));
                console.log(filter.get('peaks'));
                filter.set('annotations', new Collection([]));
                filter.set('inputs', current_channels);
                filter.run(current_channels);
                if (filter.get('outputs') == filter.get('inputs')) {
                    //console.log('run has encountered an output=input filter\n\tAdd something here if needed.');
                    //console.log('\t\tname', filter.get('id'), filter.get('name'), filter);
                    that.set('inputIsOutputCount', that.get('inputIsOutputCount') + 1);
                } else {
                    current_channels = filter.get('outputs');
                    console.log(current_channels);ß
                    return_channels.push([filter.get('name'), filter.get('outputs')]);
                }
            }
        });
        
        return return_channels;//(return_channels.length) ? [return_channels[return_channels.length - 1]] : [];
    },
    runParallel: function (channels) {
        console.log('Running FilterStack in Parallel \'%s\'', this.get('name'));
        var current_channels = channels;
        var filters = this.get('filters');
        let return_channels = [];

        //ToDo: Revisit when order of filters changes //!@#$%^&*()
        filters.forEach(function (filter) {
            if (filter.get('enabled')) {
                filter.set('values', new Collection([]));
                filter.set('annotations', new Collection([]));
                filter.set('inputs', current_channels);
                filter.run(current_channels);
                if (filter.get('outputs') == filter.get('inputs')) {
                    console.log('runParallel has encountered an output=input filter\n\tAdd something here if needed.');
                    // console.log('\t\tname', filter.get('id'), filter.get('enabled'), filter.get('name'), filter);
                } else {
                    return_channels.push([filter.get('name'), filter.get('outputs')]);
                }
            }
        });

        return return_channels;
    },

    constructor: kind.inherit(function (sup) {
        return function (attrs, props, opts) {
            sup.call(this, attrs, props, opts);
            this.set('id', filterStackCount);
            filterStackCount++;
        };
    }),
});

/** The default filter library
 */
var DefaultFilterLibrary = new Collection([
    FilterMovingAverage,
    // Filter_LOESS,
    // FilterPeakFinder,
    FilterInvert,
    Filter_SavitzkyGolay,
    // Filter_SimpleMovingAverage,
    //Filter_PeakFinder,
    Filter_PeakArea,
]);

/** The default filter stack.
 */
var DefaultFilterStack = exports.DefaultFilterStack = new FilterStack({
    name: 'Default',
    filters: new Collection([
        new FilterInvert(),
        new FilterMovingAverage(),
        // new FilterPeakFinder(),
        new Filter_SavitzkyGolay(),
        // new Filter_SimpleMovingAverage(),
        //new Filter_PeakFinder(),
        new Filter_PeakArea(),
        
    ]),
});

/* Sample usage of a FilterStack
 *
 * The 'channels' attribute of a Data.TraceInfo model may be passed to the
 * FilterStack.run routine.
 * 
 * var channels = Data.TraceInfo.get('channels');
 * DefaultFilterStack.run(channels);
 * 
 * Results are available through examination of the individual filters in the
 * stack:
 * 
 * var filter_idx = 0;
 * var filters = DefaultFilterStack.get('filters');
 * var output_channel = filters.at(filter_idx).get('outputs');
 * 
 * NOTE: There is always 1 'values' channel for each 'inputs' channel. Each 
 *     'values' channel will contain a Collection of Objects. Each Object
 *     simply contains unstructured key/value pairs.
 * var value_channel = filters.at(filter_idx).get('values');
 * 
 * NOTE: There is always 1 'annotations' channel for each 'inputs' channel. Each 
 *     'annotations' channel is a Collection of Objects. The Object format
 *     has yet to be determined.
 * var annotation_channel = filters.at(filter_idx).get('annotations');
 *
 */
if (false) {
    /* Test run for the default filter stack */
    var y = [
        589, 561, 640, 656, 727, 697, 640, 599, 568, 577, 553, 582, 600,
        566, 653, 673, 742, 716, 660, 617, 583, 587, 565, 598, 628, 618,
        688, 705, 770, 736, 678, 639, 604, 611, 594, 634, 658, 622, 709,
        722, 782, 756, 702, 653, 615, 621, 602, 635, 677, 635, 736, 755,
        811, 798, 735, 697, 661, 667, 645, 688, 713, 667, 762, 784, 837,
        817, 767, 722, 681, 687, 660, 698, 717, 696, 775, 796, 858, 826,
        783, 740, 701, 706, 677, 711, 734, 690, 785, 805, 871, 845, 801,
        764, 725, 723, 690, 734, 750, 707, 807, 824, 886, 859, 819, 783,
        740, 747, 711, 751, 804, 756, 860, 878, 942, 913, 869, 834, 790,
        800, 763, 800, 826, 799, 890, 900, 961, 935, 894, 855, 809, 810,
        766, 805, 821, 773, 883, 898, 957, 924, 881, 837, 784, 791, 760,
        802, 828, 778, 889, 902, 969, 947, 908, 867, 815, 812, 773, 813,
        834, 782, 892, 903, 966, 937, 896, 858, 817, 827, 797, 843
    ];
    var x = Array.from({ length: y.length }, (x, i) => i);

    var points = x.map(function (e, i) {
        return { x: e, y: y[i] };
    });
    var trace = new Data.Trace(points);

    var channels = [
        new Data.Channel({ trace: trace }),
        new Data.Channel({ trace: new Data.Trace() }),
        new Data.Channel({ trace: new Data.Trace() }),
        new Data.Channel({ trace: new Data.Trace() }),
    ];
    DefaultFilterStack.run(channels);

    var num_filters = DefaultFilterStack.get('filters').length;
    console.log(num_filters);
    console.log('Stack %O', DefaultFilterStack);
    console.log('    i %O', DefaultFilterStack.get('filters').at(0).get('inputs')[0].get('trace'));
    console.log('    o %O', DefaultFilterStack.get('filters').at(1).get('outputs')[0].get('trace'));
}
