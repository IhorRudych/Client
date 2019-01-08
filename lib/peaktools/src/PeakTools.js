/**********************************************************************
 *
 * Copyright 2018, Axcend Technologies
 * All rights reserved.
 * No portion of this information may be copied, published,
 * printed, shared, or disseminated in any form without the
 * written permission of Axcend Technologies.
 *
 *********************************************************************/

var regression = require('regression-js');

var x = document.createElement("INPUT");
x.setAttribute("type", "file");

var trackingSize    = 15; // number of samples to use for linear regression.
var peakStartAdjust = 4;

var sensorData     = [];
var sensorLatest   = [];

var peakInfo       = [];

var curSlope       = undefined;
var curIntercept   = undefined;
var curLine        = undefined;

var slopeData      = [];
var slopeDetect    = 0.75; // abs(curSlope) >= slopeDetect triggers a peak start/stop.
var slopeLatest    = [];

var peakTracking   = false;
var peakAscending  = false;
var peakDescending = false;
var peakStart      = undefined;
var peakEnd        = undefined;
var peakArea       = undefined;
var peakDirection  = 0;

function getTestFile()
{
  var x = document.getElementById("peakTestFile");
//    x.disabled = true;
  return x.value;
} // getTestFile()

function startPeak()
{
  console.log("Start peak");
  peakTracking  = true;
  peakStart     = sensorData[sensorData.length - peakStartAdjust - 1];
  peakIdxStart  = peakStart[0];
  peakBaseStart = peakStart[1];
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

  for (var i = 0; i < peakStartAdjust; i++)
  {
    peakArea += (sensorData[peakIdxStart + i][1] - peakBaseStart);
  }
} // startPeak()

function savePeak(reading)
{
  console.log("SavePeak");
  peakEnd = reading;
  var peak = {'start':     peakStart,
              'end':       peakEnd,
              'area':      peakArea,
              'idxStart':  peakStart[0],
              'idxEnd':    peakEnd  [0],
              'baseStart': peakStart[1],
              'baseEnd':   peakEnd  [1]
              };

  console.log("Peak: " + peak);
  peakInfo.push(peak);
  peakTracking   = false;

  peakAscending  = false;
  peakDescending = false;
} // savePeak()

function newData(reading)
{
  sensorData  .push(reading);
  sensorLatest.push(reading);

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
      if (Math.abs(curSlope) >= slopeDetect)
      {
        startPeak();
      }
    }
  }
} // newData()  

function runPeakTest(datafile)
{
  console.log("Running peak tests");
  var readings = 0;
  
  if (datafile == undefined)
  {
    datafile = getTestFile();
  }

  var parse = require('csv-parse');
  var parser = parse({
      delimiter: ',',
      columns:   true,
      function(err, data) {
          console.log(data);
          console.log(err);
      }
  });
  var fs = require('fs');

  var data = fs.createReadStream(datafile)
               .pipe(parser)
               .on('data', function (data)
                    {
                      readings += 1;
                      console.log(readings);
                      newData([readings, parseFloat(data.Sensor)]);
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
} // runPeakTest()
