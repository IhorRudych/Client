var regression    = require('regression-js');
var utils         = require('../utils.js');
var PresetMethods = require('../data/PresetMethods.js');

//
// Only required for testing.
//
// var x = document.createElement("INPUT");
// x.setAttribute("type", "file");

//
// Configuration variables.
//
var configurations = [
                      { 'name'             : "default",
                        'trackingSize'     :  15,   // number of adjacent samples to use for linear regression.
                        'peakStartAdjust'  :  8,    // number of prior samples to include in area when peak starts.
                        'peakEndAdjust'    :  9,    // number of prior samples to include in area when peak starts.
                        'detectThreshold'  :  0.30, // min absolute value of slope for detection.
                        'endThreshold'     :  0.20, // min absolute value of slope for ending a peak.
                        'slidingMedianLen' :  7,    // number of raw samples to include in sliding median.
                        'samplesPerSecond' :  20,   // number of samples received per second.
                        'minPeakTimeSpan'  :  1.00, // minimum number of _seconds_ a possible peak must span.  Reject if less.
                        'minPeakSeparation':  5,    // minimum number of _samples_ between non-adjacent peaks.
                        'minPeakArea'      :  5,    // minimum area of a supposed peak before it gets accepted.
                        'baselineMaxDelta' :  1.10, // maximum percentage change in baseline between peak start/end.
                      },
                      {
                        'name'             :  'large peaks',
                        'trackingSize'     :  25,   // number of adjacent samples to use for linear regression.
                        'peakStartAdjust'  :  5,    // number of prior samples to include in area when peak starts.
                        'peakEndAdjust'    :  9,    // number of prior samples to include in area when peak starts.
                        'detectThreshold'  :  0.30, // min absolute value of slope for detection.
                        'endThreshold'     :  0.15, // min absolute value of slope for ending a peak.
                        'slidingMedianLen' :  25,   // number of raw samples to include in sliding median.
                        'samplesPerSecond' :  20,   // number of samples received per second.
                        'minPeakTimeSpan'  :  1.00, // minimum number of _seconds_ a possible peak must span.  Reject if less.
                        'minPeakSeparation':  5,    // minimum number of _samples_ between non-adjacent peaks.
                        'minPeakArea'      :  5000, // minimum area of a supposed peak before it gets accepted.
                        'baselineMaxDelta' :  1.10, // maximum percentage change in baseline between peak start/end.
                      },
                    ];

var config = configurations[0];

var trackingSize,
    detectThreshold,
    peakStartAdjust,
    peakEndAdjust,
    sensorData,
    sensorBaseline,
    sensorLatest,
    sensorAverage,
    sensorRunningSum,
    sensorRunningAverage,
    sensorMedian,
    peakInfo,
    curSlope,
    curIntercept,
    curLine,
    curChannel,
    slopeData,
    slopeDetect,
    slopeLatest,
    peakTracking,
    peakAscending,
    peakDescending,
    peakStart,
    peakEnd,
    peakArea,
    peakAreaRaw,
    peakHeight,
    peakDirection,
    peakValue,
    peakIndex,
    slidingMedian,
    sortedMedian,
    channelData,
    channelRepo,
    lastPeak,
    minPeakWidth = config.minPeakTimeSpan * config.samplesPerSecond;

resetPeakTools();

function selectConfig(n)
{
  if ( (n < 0)
    || (n >= configurations.length) )
    {
      console.log("Invalid value for 'n': " + n + " in selectConfig()")
      return;
    }

  config = configurations[n];
} // selectConfig()

function addConfig(name)
{
  configurations.forEach(function(value, key, myArray) {
    if (value.name == name)
      {
      console.log("addConfig('" + name + "') already exists in configurations.")
      return value;
      }
    });
  var newConfig = {
                  'name':      name,
                  };

  configurations.push(newConfig);

  return newConfig;
} // addConfig()

function getChannelRepository()
{
  return channelRepo;
} // getChannelRepository()

function newChannel(channel)
{
  // console.log("Creating new channel: " + channel);
  return {
      'chanID' :          channel,

      'trackingSize' :    config.trackingSize,      // number of samples to use for
                                                    // linear regression.
      'peakStartAdjust' : config.peakStartAdjust,   // number of samples prior to
                                                    // peakStart to include in
                                                    // current peak area.
      'peakEndAdjust' :   config.peakEndAdjust,     // number of samples prior to
                                                    // peakEnd to exclude from
                                                    // current peak area.
      'slopeDetect' :     config.detectThreshold,   // abs(curSlope) >= slopeDetect
                                                    // triggers a peak start.
      'slopeDetectEnd' :  config.endThreshold,      // abs(curSlope) < slopeDetectEnd
                                                    // triggers a peak end.

      'sensorData' :
        [],
      'sensorBaseline' :
        [],
      'sensorLatest' :
        [],
      'sensorRunningSum' : 0,
      'sensorRunningAvg' : 0.0,
      'sensorMedian' :     0.0,
      'sensorAverage' :
        [],

      'peakInfo' :
        [],

      'curSlope' :      undefined,
      'curIntercept' :  undefined,
      'curLine' :       undefined,

      'slopeData' :
        [],
      'slopeLatest' :
        [],

      'peakTracking' :    false,
      'peakAscending' :   false,
      'peakDescending' :  false,
      'peakStart' :       undefined,
      'peakEnd' :         undefined,
      'peakArea' :        undefined,
      'peakHeight' :      undefined,
      'peakDirection' :   0,
      'peakValue' :       undefined,
      'peakIndex' :       undefined,
      'peakHistory' :     [],

      'baselineTrack' :   undefined,

      'slidingMedian' :   [],
      'sortedMedian'  :   [],
      'sensorMeds'    :   [],
    }; // return -- returns a brand new empty channel.
} // newChannel()

function activateChannel(id)
{
  //
  // Makes indicated id the current channel.
  // If id is undefined, sets id to 0 (zero).
  // If id does not exist, creates an empty channel with designated id.
  //
  if (channelRepo == undefined)
  {
    channelRepo = new Map();
  }

  if (id == undefined)
  {
    id = 0;
  }

  if (channelRepo.has(id))
  {
    channelData = channelRepo.get(id);
  }
  else
  {
    channelData = newChannel(id);
    channelRepo.set(id, channelData);
  }

  trackingSize      = channelData.trackingSize;
  peakStartAdjust   = channelData.peakStartAdjust;
  peakEndAdjust     = channelData.peakEndAdjust;
  slopeDetect       = channelData.slopeDetect;
  slopeDetectEnd    = channelData.slopeDetectEnd;

  sensorData        = channelData.sensorData;
  sensorBaseline    = channelData.sensorBaseline;
  sensorLatest      = channelData.sensorLatest;
  sensorRunningSum  = channelData.sensorRunningSum;
  sensorRunningAvg  = channelData.sensorRunningAvg;
  sensorAverage     = channelData.sensorAverage;
  sensorMedian      = channelData.sensorMedian;

  peakInfo          = channelData.peakInfo;

  curSlope          = channelData.curSlope;
  curIntercept      = channelData.curIntercept;
  curLine           = channelData.curLine;

  slopeData         = channelData.slopeData;
  slopeLatest       = channelData.slopeLatest;

  peakTracking      = channelData.peakTracking;
  peakAscending     = channelData.peakAscending;
  peakDescending    = channelData.peakDescending;
  peakStart         = channelData.peakStart;
  peakEnd           = channelData.peakEnd;
  peakArea          = channelData.peakArea;
  peakHeight        = channelData.peakHeight;
  peakDirection     = channelData.peakDirection;
  peakValue         = channelData.peakValue;
  peakIndex         = channelData.peakIndex;
  peakHistory       = channelData.peakHistory;

  baselineTrack     = channelData.baselineTrack;

  slidingMedian     = channelData.slidingMedian;
  sortedMedian      = channelData.sortedMedian;
  sensorMeds        = channelData.sensorMeds;

  return channelData;
} // activateChannel()

function saveChannel()
{
  if (channelData == undefined)
  {
    return;
  }

  channelData.trackingSize      = trackingSize;
  channelData.peakStartAdjust   = peakStartAdjust;
  channelData.peakEndAdjust     = peakEndAdjust;
  channelData.slopeDetect       = slopeDetect;
  channelData.slopeDetectEnd    = slopeDetectEnd;

  channelData.sensorData        = sensorData;
  channelData.sensorBaseline    = sensorBaseline;
  channelData.sensorLatest      = sensorLatest;
  channelData.sensorRunningSum  = sensorRunningSum;
  channelData.sensorRunningAvg  = sensorRunningAvg;
  channelData.sensorAverage     = sensorAverage;
  channelData.sensorMedian      = sensorMedian;

  channelData.peakInfo          = peakInfo;

  channelData.curSlope          = curSlope;
  channelData.curIntercept      = curIntercept;
  channelData.curLine           = curLine;

  channelData.slopeData         = slopeData;
  channelData.slopeLatest       = slopeLatest;

  channelData.peakTracking      = peakTracking;
  channelData.peakAscending     = peakAscending;
  channelData.peakDescending    = peakDescending;
  channelData.peakStart         = peakStart;
  channelData.peakEnd           = peakEnd;
  channelData.peakArea          = peakArea;
  channelData.peakHeight        = peakHeight;
  channelData.peakDirection     = peakDirection;
  channelData.peakValue         = peakValue;
  channelData.peakIndex         = peakIndex;
  channelData.peakHistory       = peakHistory;

  channelData.baselineTrack     = baselineTrack;

  channelData.slidingMedian     = slidingMedian;
  channelData.sortedMedian      = sortedMedian;
  channelData.sensorMeds        = sensorMeds;
} // saveChannel()

function resetPeakTools()
{
  selectConfig(0);
  minPeakWidth = config.minPeakTimeSpan * config.samplesPerSecond;
  channelRepo = undefined;
  activateChannel();
} // resetPeakTools()

function startPeak()
{
  var baseline  = sensorBaseline[sensorBaseline.length - 1];
  peakHistory   = [];
  peakTracking  = true;
  peakIdxStart  = sensorData.length - peakStartAdjust - 1;
  var firstSamp = sensorData[peakIdxStart];
  peakIdxEnd    = peakIdxStart;
  peakStart     = [firstSamp[0], baseline[1]];
  peakBaseStart = peakStart;
  peakValue     = firstSamp[1];
  peakHeight    = 0;
  peakIndex     = peakIdxStart;
  peakArea      = 0;
  peakAreaRaw   = 0;
  peakDirection = Math.sign(curSlope);

  peakHistory.push([ peakIdxStart, firstSamp[0], sensorMeds[peakIdxStart] ]);

  if (baselineTrack == undefined)
    {
    baselineTrack = peakBaseStart;
    }
  else
    {
    peakBaseStart = baselineTrack;
    }

  if (peakDirection > 0)
  {
    peakAscending  = true;
    peakDescending = false;
  }
  else
  {
    peakDescending = true; // possible support for 'negative' peaks.... FUTURE DEVELOPMENT.
    peakAscending  = false;
  }

  var curEntry;

  for (var i = 0; i < peakStartAdjust; i++)
  {
    curEntry  = sensorData[peakIdxStart + i];
    peakArea += curEntry[1];

    if (curEntry[1] > peakValue)
    {
      peakIndex  = peakIdxStart + i;
      peakValue  = curEntry[1];
      peakHeight = peakValue - peakBaseStart[1];

      peakHistory.push([peakIndex, curEntry[0], curEntry[1]]);
    }
  }
} // startPeak()

function endPeak()
{
  peakTracking    = false;
  peakAscending   = false;
  peakDescending  = false;
} // endPeak()

function baselineCheck(baselineStart, baselineEnd)
{
  if(baselineStart < baselineEnd)
  {
    if(baselineStart * config.baselineMaxDelta < baselineEnd)
    {
      return baselineStart;
    }
    else
    {
      return baselineEnd;
    }
  }
  else
  {
    if(baselineEnd * config.baselineMaxDelta < baselineStart)
    {
      return baselineEnd;
    }
    else
    {
      return baselineStart;
    }
  }
}

function savePeak()
{
  if (peakTracking)
    {
    var baseline = sensorBaseline[sensorBaseline.length - 1];
    peakIdxEnd   = sensorData.length - 1 - peakEndAdjust;
    var lastSamp = sensorData[peakIdxEnd];
    peakEnd      = [lastSamp[0], Math.min(baseline[1], lastSamp[1])];
//    peakEnd     = [sensorData[peakIdxEnd][0], Math.min(sensorMeds[peakIdxEnd], peakStart[1] * config.baselineMaxDelta)];
    peakWidth    = peakIdxEnd - peakIdxStart + 1;

    // force baseline to within config parameters
    peakEnd = [peakEnd[0], baselineCheck(peakStart[1],peakEnd[1])];
    peakStart = [peakStart[0], baselineCheck(peakStart[1],peakEnd[1])];
    
    baseAvg      = (peakStart[1] + peakEnd[1]) / 2.0;
    peakAreaRaw  = peakArea;
    baseArea     = baseAvg * peakWidth;
    peakArea    -= baseArea;
    peakHeight   = peakValue - baseAvg;

    if (lastPeak && (Math.abs(lastPeak.peakIdxEnd - peakIdxStart) < config.minPeakSeparation))
      {
      // Absorb current peak into last peak.
      console.log("\n\nABSORBING PEAK: tally(" + peakInfo.length + "), start(" + peakStart + "), end(" + peakEnd + "), width(" + peakWidth + "), val(" + peakValue + "), area(" + peakArea + ")");
      console.log("Pending feature, implementation WIP\n\n");
      peakArea = peakAreaRaw;
      return;
      }
    else if ( (peakWidth <= minPeakWidth)
        ||    (peakArea  <= config.minPeakArea) )
      {
      // discard this peak, too narrow.
      //console.log("\n\nDISCARDING PEAK: tally(" + peakInfo.length + "), start(" + peakStart + "), end(" + peakEnd + "), width(" + peakWidth + "), val(" + peakValue + "), area(" + peakArea + ")");
      if (peakWidth <= minPeakWidth)
        {
        console.log("WIDTH IS TOO NARROW: " + peakWidth);
        }
      if (peakArea <= config.minPeakArea)
        {
        console.log("AREA IS TOO LOW: " + peakArea);
        }
      console.log("\n\n");
      lastPeak = undefined;
      endPeak();
      return;
      }

    var lastIdx  = sensorData.length - 1;
    var lastPeak = peakHistory.pop();

    /*
     * Back-out info from samples in the peakEndAdjust area.
     */
    for (var i = 0; i < peakEndAdjust; i++)
    {
      curEntry  = sensorData[lastIdx - i];
      peakArea -= (curEntry[1] - peakBaseStart[1]);

      if (lastPeak[0] >= (lastIdx - i))
      {
        lastPeak   = peakHistory.pop();
        peakIndex  = lastPeak[0];
        peakValue  = lastPeak[2];
        peakHeight = peakValue - peakBaseStart[1];
      }
    }

//    /*
//     * Back out trapazoid formed by baseline area.
//     */
//    baseArea    = (peakStart[1] + peakEnd[1]) / 2.0 * peakWidth;
//    peakArea   -= baseArea;

    var peak =
      {
        'start' :         peakStart,
        'end' :           peakEnd,
        'area' :          peakArea,
        'areaRaw':        peakAreaRaw,
        'peakRaw' :       peakValue,
        'peak' :          peakHeight,
        'peakIdx' :       peakIndex,
        'idxStart' :      peakStart[0],
        'idxEnd' :        peakEnd[0],
        'baseStart' :     peakStart[1],
        'baseEnd' :       peakEnd[1],
        'baseArea' :      baseArea,
        'baseIdxStart' :  peakIdxStart,
        'baseIdxEnd' :    peakIdxEnd,
        'baseStartAvg' :  sensorAverage[peakIdxStart],
        'baseEndAvg' :    sensorAverage[peakIdxEnd],
        'peakWidth' :     peakWidth,
      };

    peakInfo.push(peak);
    lastPeak = peak;
    }

  endPeak();
} // savePeak()

function compareNumeric(a, b) {
  return a - b;
} // compareNumeric()

function addMedianData(val)
{
  slidingMedian.unshift(val);

  while (slidingMedian.length > config.slidingMedianLen) {
    slidingMedian.pop();
  }

  sortedMedian = slidingMedian.slice(0);
  sortedMedian.sort(compareNumeric);

  return sortedMedian[Math.floor(sortedMedian.length / 2)];
} // addMedianData()

function endData(channel)
{
  savePeak();
} // endData()

function newData(reading, channel)
{
  if (channel == undefined)
  {
    channel = 0;
  }

  activateChannel(channel);

  sensorMedian = addMedianData(reading[1]);

  sensorData.push(reading);
  sensorMeds.push(sensorMedian);

  sensorRunningSum += reading[1];

  sensorLatest.push(
      [
      sensorData.length, sensorMedian
      ]);

  if (sensorLatest.length <= trackingSize)
  {
    sensorRunningAvg = sensorRunningSum / sensorLatest.length;

    sensorBaseline.push([reading[0], sensorMedian]);
    sensorAverage .push(sensorRunningAvg);
  }
  else
  {
    oldest            = sensorLatest.shift();
    sensorRunningSum -= oldest[1];
    sensorRunningAvg  = sensorRunningSum / trackingSize;
    curLine           = regression.linear(sensorLatest);
    curSlope          = curLine.equation[0];
    curIntercept      = curLine.equation[1];

    slopeData.push(curSlope);

    sensorAverage.push(sensorRunningAvg);

    if (!peakTracking)
    {
      /*
       * Not tracking a peak, so update baseline & check if start of a peak.
       */
      sensorBaseline.push([reading[0], sensorMedian]);

      if (Math.abs(curSlope) >= slopeDetect)
      {
        startPeak();
      }
    }
    else
    {
      /*
       * Tracking a peak.
       *
       * Don't update baseline while tracking.
       *
       * Collect current data. Check for: + switched direction (peak-is-ending) +
       * dropped below slopeDetect (peak-has-ended) + switched direction again
       * (new-peak-is-starting).
       * 
       * QUESTION: Are 'plateaus' on the side of a peak a secondary peak, or
       * just part of the current peak?
       */
      peakArea += reading[1];

      if (reading[1] > peakValue)
      {
        peakIndex  = sensorData.length - 1;
        peakValue  = reading[1];
        peakHeight = peakValue;

        //console.log("Updating peak history in newData(), idx: " + peakIndex);
        peakHistory.push([peakIndex, sensorData[peakIndex][0], peakValue]);
      }

      if (peakAscending && (Math.abs(curSlope) >= slopeDetect)
          && ((Math.sign(curSlope) * peakDirection) < 0))
      {
        /*
         * Peak slope has switched directions. Only consider it a significant change
         * if > slopeDetect.
         */
        peakAscending  = false;
        peakDescending = true;
      }
      else if (peakDescending && (Math.abs(curSlope) < slopeDetectEnd))
      {
        /*
         * Peak has ended. End and store the current peak.
         */
        savePeak();
      }
      else if (peakDescending && (Math.abs(curSlope) >= slopeDetectEnd)
          && (Math.sign(curSlope) == peakDirection))
      {
        /*
         * Peak has switched directions again. Adjacent peaks. End (and store)
         * the current peak and start another.
         * 
         * NOTE: Need to potentially adjust the area based on whether peakEnd
         * sample == peakStart sample.
         */
        savePeak();
        startPeak();
      }
    }
  }

  saveChannel();

  return peakInfo;
} // newData()

function getPeakInfo()
{
  return peakInfo;
} // getPeakInfo()

/*
 * var datastream;
 * 
 * function runPeakTest(datafile) { console.log("Running peak tests"); var
 * readings = 0;
 * 
 * if (datastream != undefined) { datastream.destroy(); }
 * 
 * if (datafile == undefined) { datafile = getTestFile(); }
 * 
 * resetPeakTools();
 * 
 * console.log("Data file is: " + datafile);
 * 
 * var fs = require('fs'); var parse = require('csv-parse'); var parser =
 * parse({delimiter: ',', columns: true, function(err, data) {
 * console.log(data); console.log(err); } });
 * 
 * datastream = fs.createReadStream(datafile) .pipe(parser) .on('data', function
 * (data) { readings += 1; newData([parseFloat(data.Time),
 * parseFloat(data.Sensor)]); } ) .on('headers', function (headerList) {
 * console.log('Headers: ' + headerList); } ) .on('end', function() {
 * console.log("Slope info: " + slopeData); } ); } // runPeakTest()
 */


function isValidBaseLayoutEntry(entry, samples)
{
  return entry.hasOwnProperty('x')
      && entry.hasOwnProperty('y')
      && (entry.x >= 0)
      && (entry.x < samples);
} // isValidBaseLayoutEntry()

function isValidBaseLayoutArray(arr, samples)
{
  valid = true;
  array = false;

  if (!Array.isArray(arr) || (arr.length > samples))
    {
    return false;
    }

  for (obj in arr)
    {
    if (Array.isArray(obj))
      {
      array  = true;
      valid &= isValidBaseLayoutArray(obj, samples);
      }
    else
      {
      //
      // if we have a mix of arrays and objects,
      // or an object is invalid, this is not a valid array.
      //
      valid &= (!array && isValidBaseLayoutEntry(obj, samples));
      }
    }

  return valid;
} // isValidBaseLayoutArray()

function genBaseLayouts(channels, samples, baseLayout)
{
  baseLayouts = [];

  switch (typeof baseLayout)
  {
  case 'undefined':
    return genBaseLayouts(channels, samples, 0);
  case 'number':
    defaultLayout = [{x: 0, y: baseLayout}, {x: samples - 1, y: baseLayout}];
    for (var i = 0; i < channels; i++)
      {
      baseLayouts.push(defaultLayout);
      }
    break;
  case 'object': // We only accept an array of objects or an array of arrays of objects.
    if (   !Array.isArray(baseLayout)                                                   // must be array
        || !isValidBaseLayoutArray(baseLayout)                                          // must have correct form
        || (Array.isArray(baseLayout[0]) && !isValidBaseLayoutEntry(baseLayout[0][0]))  // no more than 2 layers deep.
        )
      {
      console.log("Unrecognized value passed as baseLayout in genBaseLayouts(): " + String(baseLayout));
      return genBaseLayouts(channels, samples, 0);
      }
    if (!Array.isArray(baseLayout[0])) // replicate single base layout across all channels.
      {
      for (var i = 0; i < channels; i++)
        {
        baseLayouts.push(baseLayout);
        }
      }
    else // fully-specified base layout.
      {
      baseLayouts = baseLayout;
      }
    break;
  default:
    console.log("Unrecognized object passed as baseLayout in genBaseLayouts(): " + String(baseLahout));
    return genBaseLayouts(channels, samples, 0);
  } // switch (typeof)

  return baseLayouts;
} // genBaseLayouts()

function getBaseline(channel, baseLayouts, index)
{
  return 25;
} // getBaseline()

function initTrace()
{
  baseline      = 25;
  samplesPerSec = 20;
  timeInMinutes = 4.0;
  secsPerMinute = 60;
  numPoints     = samplesPerSec * secsPerMinute * timeInMinutes;
  delTime       = timeInMinutes / numPoints;
  curTime       = 0.0;
  maxPeaks      = 10;
  rndPeaks      = Math.ceil(Math.random() * maxPeaks);
  peakProb      = 0.005; // 0.0005;
  inPeak        = false;
  ascending     = false;
  peakTarg      = 0.0;
  noiseMag      = 6;
  peakStart     = 0;
  peakMax       = 600.0;
  peakCurY      = 0.0;
  peakBase      = 0.0;
  peakMaxW      = samplesPerSec * 30;
  peakDelta     = peakMax / peakMaxW;
  peakEquation  = undefined;
} // initTrace()

function makePoint(x, y)
{
  return {x: x, y: y};
} // makePoint()

function genParabola(vertex, secondPoint)
{
  var h  = vertex.x;
  var k  = vertex.y;
  var x  = secondPoint.x;
  var gx = secondPoint.y;
  var sq = (x - h) * (x - h);
  var a  = (gx - k) / sq;

  return function (x) {
    return a * (x - h) * (x - h) + k
    }
} // genParabola()

function genGaussian(peak, loc, width)
{
  var a = peak;
  var b = loc;
  var c = width / 6.5; // width for gaussian is actual sigma.  Want about 4 sigma each side.

  return function(x) {
    return a * Math.exp(-(x - b) * (x - b) / (2 * c * c));
  }
} // genGaussian()

//***********************************************************************
//
// Synthetic data variables.
//

var samplesPerSec;
var timeInMinutes;
var secsPerMinute;
var numPoints;
var delTime;
var curTime;
var maxPeaks;
var rndPeaks;
var peakProb;
var inPeak;
var ascending;
var peakTarg;
var noiseMag;
var peakStart;
var peakMax;
var peakCurY;
var peakBase;
var peakMaxW;
var peakDelta;
var peakEquation;

function initTrace()
{
  baseline      = 25;
  samplesPerSec = 20;
  timeInMinutes = 4.0;
  secsPerMinute = 60;
  numPoints     = samplesPerSec * secsPerMinute * timeInMinutes;
  delTime       = timeInMinutes / numPoints;
  curTime       = 0.0;
  maxPeaks      = 10;
  rndPeaks      = Math.ceil(Math.random() * maxPeaks);
  peakProb      = 0.005; // 0.0005;
  inPeak        = false;
  ascending     = false;
  peakTarg      = 0.0;
  noiseMag      = 6;
  peakStart     = 0;
  peakMax       = 600.0;
  peakCurY      = 0.0;
  peakBase      = 0.0;
  peakMaxW      = samplesPerSec * 30;
  peakDelta     = peakMax / peakMaxW;
  peakEquation  = undefined;
} // initTrace()

function genSyntheticData(timeInMinutes, channels, samples, baseLayout, maxPeaks, maxHalfSpan, maxHeight, peakProbability)
{
  //
  // timeInMinutes    Total time for synthesized data.
  // channels         Number of channels to synthesize
  // samples          Number of samples per channel
  // baseLayout       Piecewise-linear description of baseline
  //                  If undefined, straight line at zero
  //                  If single number, straight line at specified value
  //                  If array of 2-value pairs, describes baseline to use for every channel
  //                  If array of channels arrays of 2-value pairs, is a baseLayout for each channel
  // maxPeaks         Max number of peaks to generate in a channel
  // maxHalfSpan      Max half-width of any peak
  // maxHeight        Max height of any peak
  // peakProbability  Probability of a peak starting at any given sample point
  //

  var traces    = new Collection([
                        new Data.TraceInfo({id:         -1,
                                            path:       'Synthetic Data',
                                            method:     PresetMethods.at(0),
                                            date:       'SYNTHETIC NODATE',
                                            user:       'SYNTHETIC USER',
                                            device:     'SYNTHETIC DEVICE',
                                            favorite:   false,  
                                            cancelled:  true }),
                                ]);
  var chanList  = [];

  baseLayout = genBaseLayouts(channels, baseLayout);

  for (var tally = 0; tally < channels; tally++)
  {
    traceNew   = new Data.Trace();
    channelNew = new Data.Channel({trace: traceNew});

    chanList.push(channelNew);

    var data = [];
    curTime  = 0.0;
    for (var i = 0; i < numPoints; i++)
    {
      var noise = Math.random() * noiseMag;
      var y     = noise;
      if (! inPeak) {
        inPeak = Math.random() < peakProb;
        if (inPeak) {
          peakBase  = y;
          peakTarg  = Math.random() * peakMax;
          peakWidth = Math.random() * maxHalfSpan * 2.0;
          peakDelta = peakTarg / peakWidth / 2;
          ascending = true;
          peakCurY  = y;
        }
      }
      else { // inPeak
        if (ascending) {
          peakCurY += peakDelta + noise;
          if (peakCurY > peakTarg) {
            ascending = false;
          }
        }
        else { // not ascending
          peakCurY -= peakDelta + noise;
          if (peakCurY < peakBase) {
            inPeak = false;
          }
        }
        y = peakCurY;
      }
      data.push({ x: curTime, y: y, idx: i });
      curTime += delTime;
    }
    channel.get('trace').add(data);
  }

  return traces;
} // genSyntheticData()

module.exports.newData          = newData;
module.exports.endData          = endData;
module.exports.activateChannel  = activateChannel;
module.exports.resetPeakTools   = resetPeakTools;
module.exports.getPeakInfo      = getPeakInfo;
module.exports.genSyntheticData = genSyntheticData;
module.exports.getBaseline      = getBaseline;
module.exports.genParabola      = genParabola;
module.exports.genGaussian      = genGaussian;
