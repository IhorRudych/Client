/**
 * File: Data.js
 * 
 * Data.js contains the structure
 */

var kind = require('enyo/kind'),
    Model = require('enyo/Model'),
    RelationalModel = require('enyo/RelationalModel'),
    Collection = require('enyo/Collection'),
    Store = require('enyo/Store'),
    Method = require('./Method.js');

var dataTracePointCount = 0;
var DataTracePoint = exports.TracePoint = kind({
    name: 'tx.DataTracePoint',
    kind: Model,
    attributes: {
        x: 0, // Timestamp in fractional minutes to 2 decimal places (i.e. 1.75 = 1 minute 45 seconds)
        y: 0, // Percentage to 1 decimal place
    },
    constructor: kind.inherit(function (sup) {
        return function (attrs, props, opts) {
            sup.call(this, attrs, props, opts);
            this.set('id', dataTracePointCount);
            dataTracePointCount++;
        };
    }),
});

var DataTrace = exports.Trace = kind({
    name: 'tx.DataTrace',
    kind: Collection,
    model: DataTracePoint,
});

var dataChannelCount = 0;
var DataChannel = exports.Channel = kind({
    name: 'tx.DataTraceInfo',
    kind: RelationalModel,
    primaryKey: 'id',
    attributes: {
        id: null,
        name: null,
        trace: null,
    },
    relations: [
        {
            key: 'trace',
            type: 'toOne',
            model: DataTrace,
            isOwner: false,
        }
    ],
    constructor: kind.inherit(function (sup) {
        return function (attrs, props, opts) {
            sup.call(this, attrs, props, opts);
            this.set('id', dataChannelCount);
            dataChannelCount++;
        };
    }),
});

var DataTraceInfo = exports.TraceInfo = kind({
    name: 'tx.DataTraceInfo',
    kind: RelationalModel,
    primaryKey: 'id',
    attributes: {
        id: null,
        path: null,
        method: null,
        date: null,
        user: null,
        device: null,
        channels: null,
        favorite: false,
        cancelled: false,
    },
    relations: [
        {
            key: 'method',
            type: 'toOne',
            model: Method.Method,
            isOwner: false,
        },
    ],
});

exports.TraceInfoFactory = function (presets, method, user, device) {
    /**
     * function: TraceInfoFactory
     * 
     * Creates the run object for recording data
     * 
     * @param presets An EnyoJS collection
     * @param method  A Method object (see Method.js)
     * @param user    
     * @param device 
     * 
     * @return A trace object
     */
    var fn = function () {
        return true;
    };
    var allTraces = Store.find(DataTraceInfo, fn, { all: true });
    var nextId = allTraces.length;

    const dateObj = new Date();
    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'JUN', 'JUL', 'SEP', 'OCT', 'NOV', 'DEC'];
    var year = dateObj.getFullYear();
    let month = MONTHS[dateObj.getMonth() - 2];

    var date = dateObj.getDate();
    date = (date < 10) ? '0' + date : date;

    let hour = dateObj.getHours();
    hour = (hour < 10) ? '0' + hour : hour;

    let minutes = dateObj.getMinutes();
    minutes = (minutes < 10) ? '0' + minutes : minutes;

    var pathName = method.get('name') + '-' + year + '' + month + '' + date + '' + hour + '' + minutes + '-' + nextId + '-' + user.slice(-2);

    var trace = new DataTraceInfo({
        id: nextId,
        path: pathName,
        method: method,
        date: year + ' ' + month + ' ' + date + ' ' + hour + ':' + minutes,
        user: user || 'unknown user',
        device: device || 'NONE',
        channels: [
            new DataChannel({ trace: new DataTrace() }), // for Detector A
            new DataChannel({ trace: new DataTrace() }), // for Detector B
            new DataChannel({ trace: new DataTrace() }), // for GPIO ADC A -- Pressure Sensor A
            new DataChannel({ trace: new DataTrace() }), // for GPIO ADC B -- Pressure Sensor B
            new DataChannel({ trace: new DataTrace() }), // for GPIO ADC C -- Which Sensor?
            new DataChannel({ trace: new DataTrace() }), // for GPIO ADC D -- Which Sensor?
            new DataChannel({ trace: new DataTrace() }), // for flow rate
        ],
        cancelled: false,
        favorite: false,
    });
    presets.add(trace);
    return trace;
};

let traceCount = exports.countTraces = () => {
    var fn = function () {
        return true;
    };
    var allTraces = Store.find(DataTraceInfo, fn, { all: true });
    return allTraces.length;
};

var PlotlyHelper = exports.PlotlyHelper = function (trace) {
};
