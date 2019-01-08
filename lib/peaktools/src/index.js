/**********************************************************************
 *
 * Copyright 2018, Axcend Technologies
 * All rights reserved.
 * No portion of this information may be copied, published,
 * printed, shared, or disseminated in any form without the
 * written permission of Axcend Technologies.
 *
 *********************************************************************/

var regression = require('regression');
//var csv        = require('csv');
//var fs         = require('fs');
//var parse      = require('csv-parse');

//
// Only required for testing.
//
//var x = document.createElement("INPUT");
//x.setAttribute("type", "file");

/*var parser = parse({delimiter: ',',
                    columns:   true,
                    function(err, data)
                      {
                          console.log(data);
                          console.log(err);
                      }
                  });*/
//
// Configuration variables.
//
var config = {
  'trackingSize':     15,     // number of adjacent samples to use for linear regression.
  'peakStartAdjust':  4,      // number of prior samples to include in area when peak starts.
  'detectThreshold':  0.75,   // min absolute value of slope for detection.
};

var trackingSize,
detectThreshold,
peakStartAdjust,
sensorData,
sensorLatest,
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
peakDirection,
peakValue,
peakIndex,
channelData,
channelRepo;

resetPeakTools();

function newChannel(channel)
{
console.log("Creating new channel: " + channel);
return {
'chanID':           channel,

'trackingSize':     config.trackingSize,     // number of samples to use for linear regression.
'peakStartAdjust':  config.peakStartAdjust,  // number of samples prior to peakStart to include in current peak area.
'slopeDetect':      config.detectThreshold,  // abs(curSlope) >= slopeDetect triggers a peak start/stop.

'sensorData':       [],
'sensorLatest':     [],

'peakInfo':         [],

'curSlope':         undefined,
'curIntercept':     undefined,
'curLine':          undefined,

'slopeData':        [],
'slopeLatest':      [],

'peakTracking':     false,
'peakAscending':    false,
'peakDescending':   false,
'peakStart':        undefined,
'peakEnd':          undefined,
'peakArea':         undefined,
'peakDirection':    0,
'peakValue':        undefined,
'peakIndex':        undefined,
};
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
console.log('id undefined' + id);
}

if (channelRepo.has(id))
{
channelData = channelRepo.get(id);
}
else
{
channelData = newChannel(id);
console.log('creating new chanel' + id);
channelRepo.set(id, channelData);
}

trackingSize    = channelData.trackingSize;
peakStartAdjust = channelData.peakStartAdjust;
slopeDetect     = channelData.slopeDetect;

sensorData     = channelData.sensorData;
sensorLatest   = channelData.sensorLatest;

peakInfo       = channelData.peakInfo;

curSlope       = channelData.curSlope;
curIntercept   = channelData.curIntercept;
curLine        = channelData.curLine;

slopeData      = channelData.slopeData;
slopeLatest    = channelData.slopeLatest;

peakTracking   = channelData.peakTracking;
peakAscending  = channelData.peakAscending;
peakDescending = channelData.peakDescending;
peakStart      = channelData.peakStart;
peakEnd        = channelData.peakEnd;
peakArea       = channelData.peakArea;
peakDirection  = channelData.peakDirection;
peakValue      = channelData.peakValue;
peakIndex      = channelData.peakIndex;

return channelData;
} // activateChannel()
module.exports.activateChannel = activateChannel;
function saveChannel()
{
if (channelData == undefined)
{
return;
}

channelData.trackingSize    = trackingSize;
channelData.peakStartAdjust = peakStartAdjust;
channelData.slopeDetect     = slopeDetect;

channelData.sensorData      = sensorData;
channelData.sensorLatest    = sensorLatest;

channelData.peakInfo        = peakInfo;

channelData.curSlope        = curSlope;
channelData.curIntercept    = curIntercept;
channelData.curLine         = curLine;

channelData.slopeData       = slopeData;
channelData.slopeLatest     = slopeLatest;

channelData.peakTracking    = peakTracking;
channelData.peakAscending   = peakAscending;
channelData.peakDescending  = peakDescending;
channelData.peakStart       = peakStart;
channelData.peakEnd         = peakEnd;
channelData.peakArea        = peakArea
channelData.peakDirection   = peakDirection;
channelData.peakValue       = peakValue;
channelData.peakIndex       = peakIndex;
} // saveChannel()

function resetPeakTools()
{
channelRepo = undefined;
activateChannel();
} // resetPeakTools()

/*function getTestFile()
{
var x = document.getElementById("peakTestFile");
return x.value;
} // getTestFile()*/

function startPeak()
{
//console.log("Start peak: " + sensorData.length);
peakTracking  = true;
peakStart     = sensorData[sensorData.length - peakStartAdjust - 1];
peakIdxStart  = sensorData.length - peakStartAdjust - 1;
peakBaseStart = peakStart[1];
peakValue     = peakBaseStart;
peakIndex     = peakIdxStart;
peakArea      = 0;
peakDirection = Math.sign(curSlope);

if (peakDirection > 0)
{
peakAscending  = true;
peakDescending = false;
}
else
{
peakDescending = true;  // possible support for 'negative' peaks....  FUTURE DEVELOPMENT.
peakAscending  = false;
}

var curEntry;

for (var i = 0; i < peakStartAdjust; i++)
{
curEntry = sensorData[peakIdxStart + i];
peakArea += (curEntry[1] - peakBaseStart);

if (curEntry[1] > peakValue)
{
peakIndex = peakStartAdjust + i;
peakValue = curEntry[1];
}
}
} // startPeak()

function savePeak(reading)
{
//console.log("SavePeak: " + sensorData.length);
peakEnd = reading;
var peak = {'start':     peakStart,
  'end':       peakEnd,
  'area':      peakArea,
  'peak':      peakValue,
  'peakIdx':   peakIndex,
  'idxStart':  peakStart[0],
  'idxEnd':    peakEnd  [0],
  'baseStart': peakStart[1],
  'baseEnd':   peakEnd  [1]
  };

//console.log("Peak: " + peak);
peakInfo.push(peak);
peakTracking   = false;

peakAscending  = false;
peakDescending = false;
} // savePeak()

module.exports.newData = function newData(reading, channel)
{
if (channel == undefined)
{
channel = 0;
}

activateChannel(channel);

sensorData  .push(reading);
sensorLatest.push([sensorData.length, reading[1]]);

if (sensorLatest.length > trackingSize)
{
sensorLatest.shift();
curLine      = regression.linear(sensorLatest);
curSlope     = curLine.equation[0];
curIntercept = curLine.equation[1];
slopeData.push(curSlope);

if (peakTracking)
{
/*
* Collect current data.
* Check for:
*    + switched direction (peak-is-ending)
*    + dropped below slopeDetect (peak-has-ended)
*    + switched direction again (new-peak-is-starting).
*
* QUESTION: Are 'plateaus' on the side of a peak
* a secondary peak, or just part of the current peak?
*/
peakArea += reading[1] - peakBaseStart;

if (reading[1] > peakValue)
{
peakIndex = sensorData.length - 1;
peakValue = reading[1];
}

if (peakAscending
&& (Math.abs(curSlope) >= slopeDetect)
&& ((Math.sign(curSlope) * peakDirection) < 0))
{
/*
* Peak has switched directions.
* Only consider it a significant change if > slopeDetect.
*/
peakAscending  = false;
peakDescending = true;
}
else if (peakDescending
&& (Math.abs(curSlope) < slopeDetect))
{
/*
* Peak has ended.
* End and store the current peak.
*/
savePeak(reading);
}
else if (peakDescending
&& (Math.abs(curSlope) >= slopeDetect)
&& (Math.sign(curSlope) == peakDirection))
{
/*
* Peak has switched directions again.
* Adjacent peaks.
* End (and store) the current peak and start another.
*
* NOTE: Need to potentially adjust the area
* based on whether peakEnd sample == peakStart sample.
*/
savePeak(reading);
startPeak();
}
}
else
{
/*
*
* Start collecting peak information.
* Track the start of the peak.
* Set the direction.
* We track a peak through one reversal of direction
* back to below slopeDetect or to another reversal.
* Example:
*    + to - to below slopeDetect // non-adjacent peaks.
*    + to - to +                 // adjacent peaks.
*
*/
//console.log("Slope is " + curSlope + ", threshold is " + slopeDetect);
if (Math.abs(curSlope) >= slopeDetect)
{
startPeak();
}
}
}

saveChannel();

return peakInfo;
} // newData()  

//var datastream;

/*function runPeakTest(datafile)
{
  console.log("Running peak tests");
  var readings = 0;

  if (datastream != undefined)
  {
    datastream.destroy();
  }

  if (datafile == undefined)
  {
    datafile = getTestFile();
  }

  resetPeakTools();

  console.log("Data file is: " + datafile);

  datastream = fs.createReadStream(datafile)
               .pipe(parser)
               .on('data', function (data)
                    {
                      readings += 1;
                      console.log(readings);
                      newData([parseFloat(data.Time), parseFloat(data.Sensor)]);
                    }
                  )
               .on('headers', function (headerList)
                    {
                      console.log('Headers: ' + headerList);
                    }
                   )
               .on('end', function()
                    {
                      console.log("Slope info: " + slopeData);
                    }
                  );
} // runPeakTest()*/

//module.exports.newData = newData;
//module.exports.activateChannel = activateChannel;

