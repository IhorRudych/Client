/**/

var Data = require('../components/Data.js'),
    PresetMethods = require('../data/PresetMethods.js'),
    Collection = require('enyo/Collection'),
    utils = require('../utils.js');

var traces = module.exports = new Collection([
  //    new Data.TraceInfo({ id: 0,  path: 'Sample Data', method: PresetMethods.at(0), date: '2018 OCT 14 12:36', user: 'CAM23', device: 'LAB-1128', favorite: false, cancelled: true }),
//    new Data.TraceInfo({ id: 1,  path: '42-2018MAR140423-2331-CM',  method: PresetMethods.at(3), date: '2018 MAR 14 04:23', user: 'CAM23', device: 'LAB-1128', favorite: true,  cancelled: false }),
//    new Data.TraceInfo({ id: 2,  path: 'LX-2018MAR141923-2330-CM',  method: PresetMethods.at(5), date: '2018 MAR 14 19:23', user: 'CAM23', device: 'BRB-102T', favorite: false, cancelled: true }),
//    new Data.TraceInfo({ id: 3,  path: '42-2018MAR141145-2329-CM',  method: PresetMethods.at(3), date: '2018 MAR 14 11:45', user: 'CAM23', device: 'LAB-1128', favorite: false, cancelled: false }),
//    new Data.TraceInfo({ id: 4,  path: '42-2018MAR140101-2328-LT',  method: PresetMethods.at(3), date: '2018 MAR 14 01:01', user: 'LRT',   device: 'LAB-1128', favorite: true,  cancelled: true }),
//    new Data.TraceInfo({ id: 5,  path: 'LX2-2019MAR121456-0004-LT', method: PresetMethods.at(7), date: '2019 MAR 12 14:56', user: 'LRT',   device: 'CHM-021X', favorite: false, cancelled: false }),
//    new Data.TraceInfo({ id: 6,  path: 'LX2-2018MAR121235-0003-XX', method: PresetMethods.at(7), date: '2018 MAR 12 12:35', user: 'XXBYU', device: 'CHM-021X', favorite: false, cancelled: true }),
    //new Data.TraceInfo({ id: 7,  path: '42-2018MAR141400-2332-CM',  method: PresetMethods.at(4), date: '2018 MAR 14 14:00', user: 'CAM23', device: 'LAB-1128', favorite: false, cancelled: false }),
//    new Data.TraceInfo({ id: 8,  path: 'RTA-2018MAR141515-2331-CM', method: PresetMethods.at(4), date: '2018 MAR 14 15:15', user: 'CAM23', device: 'LAB-1128', favorite: true,  cancelled: false }),
    //new Data.TraceInfo({ id: 9,  path: '42-2018MAR141234-2330-CM',  method: PresetMethods.at(5), date: '2018 MAR 14 12:34', user: 'MRWHO', device: 'LAB-1128', favorite: true,  cancelled: false }),
//    new Data.TraceInfo({ id: 10, path: '42-2018MAR152131-2329-CM',  method: PresetMethods.at(3), date: '2018 MAR 15 21:31', user: 'CAM23', device: 'LAB-1128', favorite: false, cancelled: false }),
//    new Data.TraceInfo({ id: 11, path: 'AFT-2018MAR141718-2328-LT', method: PresetMethods.at(6), date: '2018 MAR 14 17:18', user: 'LRT',   device: 'LAB-1128', favorite: true,  cancelled: true }),
//    new Data.TraceInfo({ id: 12, path: 'AFT-2018AUG251915-2424-LT', method: PresetMethods.at(6), date: '2018 AUG 25 19:15', user: 'TYL',   device: 'LAB-911#', favorite: true,  cancelled: false }),
]);
 
// NOTE: generate some random trace data, remove this later
traces.forEach(function (trace) {
    var method = trace.get('method');
    var channels = [
        new Data.Channel({ trace: new Data.Trace() }),
        new Data.Channel({ trace: new Data.Trace() }),
    ];
    trace.set('channels', channels);
    for (var channel of channels) {
        var numPoints = utils.minutesToSeconds(method.totalTime(), 0);
        var phase = 4 * Math.PI * Math.random();
        for (var i = 0; i < numPoints; i++) {
            var noise = 0;
            var y = 200 * Math.abs((Math.sin((i * 2 * Math.PI / 10) + phase) + noise) / 4);
            channel.get('trace').add({ x: utils.secondsToMinutes(i), y: y });
        }
    }
});

var numPoints = 5000;
var maxPeaks  = 20;
var rndPeaks  = Math.ceil(Math.random() * maxPeaks);
var peakProb  = 0.0005;
var inPeak    = false;
var ascending = false;
var peakTarg  = 0.0;
var noiseMag  = 0.5;
var peakMax   = 300.0;
var peakCurY  = 0.0;
var peakBase  = 0.0;
var peakDelta = peakMax / 200;

// NOTE: generate some random trace data, remove this later
traces.forEach(function (trace) {
    var method = trace.get('method');
    var channels = [
        new Data.Channel({ trace: new Data.Trace() }),
        new Data.Channel({ trace: new Data.Trace() }),
    ];
    trace.set('channels', channels);
    for (var channel of channels) {
        var phase = 3 * Math.PI * Math.random();
        for (var i = 0; i < numPoints; i++) {
            var noise = Math.random() * noiseMag;
            var y = noise;
            //var y = 200 * Math.abs((Math.sin((i * 2 * Math.PI / 10) + phase) + noise) / 4);
            if (! inPeak)
            {
              inPeak = Math.random() < peakProb;
              if (inPeak)
              {
                peakTarg  = Math.random() * peakMax;
                peakBase  = y;
                ascending = true;
                peakCurY  = y;
              }
            }
            else
            {
              if (ascending)
              {
                peakCurY += peakDelta + noise;
                if (peakCurY > peakTarg)
                {
                  ascending = false;
                }
              }
              else
              {
                peakCurY -= peakDelta + noise;
                if (peakCurY < peakBase)
                {
                 inPeak = false;
                }
              }
              y = peakCurY;
            }
            channel.get('trace').add({ x: utils.secondsToMinutes(i / numPoints * method.totalTime() * 60), y: y });
        }
    }
});
