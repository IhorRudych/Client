/*
 *  File: DataManger.js 
 *  
 *  DataManger.js houses the DataControl and DataViewer kinds
 *  It catches all save events
 * 
 *  DataManger.js is created to allow the user the use of
 *  downloadImage from the upper level kind
 */

let testing = !true,
    processChannels = { 0: true, 1: true }; // Channel 0 & 1 -> Absorbance, Channel 2 & 3 -> Pressure

var kind = require('enyo/kind'),
    FittableRows = require('layout/FittableRows'),
    FittableColumns = require('layout/FittableColumns'),
    NewViewer = require('./NewViewer.js'),
    DataControl = require('./DataControl.js'),
    utils = require('../utils.js'),
    XMLConverter = require('../../lib/xml-js'),
    Plotly = require('plotly'),
    pdfMake = require('../../lib/pdfmake/build/pdfmake'),
    Filter = require('./Filter.js'),
    Collection = require('enyo/Collection'),
    Scroller = require('enyo/Scroller'),
    ModelList = require('enyo/ModelList');
require('../../assets/vfs_fonts.js');

let JSONfn = require('./JSONfn.js'),
    deepClone = require('./deepClone.js'),
    localForageKeys = require('./localForageKeys.js');

module.exports = kind({
    name: 'tx.DataManager',
    kind: FittableColumns,
    published: {
        model: null,
        defaultPlotTraces: null,
        appliedFilters: null,
        appliedFiltersAsStack: false,
        appliedFiltersDateTime: null,
    },
    handlers: {
        onRequestSaveData: 'saveData',
        onRequestSaveReport: 'saveReport',
        onRequestSaveStack: 'saveStack',
        onRequestApplyFilters: 'applyFilters',
    },
    events: {
        onPassRunDataToModal: '',
        onRequestExportDocModal: '',
    },
    components: [
        { name: 'DataViewer', kind: NewViewer, staticPlot: false, classes: 'marker graph-ipad', fit: true },
        { fit: true, style: 'margin-right:20px;' },
        { kind: Scroller, components:[
            {
                kind: FittableRows, components: [
                    { name: 'DataControl', kind: DataControl },
                ] 
            },
                /*{
                    kind: FittableColumns, classes: 'btn btn-text-lg', onclick: 'triggerGenerateReport', components: [
                        { kind: IconButton, style: 'height:27px;width:20px;transform:rotate(180deg);', src: './assets/svg/UI-elements-forSVG_gfx-arrow-light.svg' },
                        { allowHtml: true, style: 'font-weight:300;padding-left:5px;', content: 'GENERATE REPORT' }
                    ]
                },*/

            ]
        },
    ],
    bindings: [
        { from: 'model', to: '$.DataViewer.model' },
        { from: 'model', to: '$.DataControl.model' },
    ],
    
    constructor: function () {
        this.inherited(arguments);
    },
    create: function () {
        this.inherited(arguments);
        let plotconfigs = this.$.DataViewer.getPlotConfig();
        this.set('defaultPlotTraces', plotconfigs.data_config.length);
    },
    rendered: function () {
        this.inherited(arguments);
    },

    // ToDo: Finish adding METHOD, VALUES, and ANNOTATIONS into the CSV
    saveData: function () {
        /**
         *  function: saveData
         * 
         *  saveData exports the processed or raw data as
         *      a CSV or AnIML (a type of XML) file
         *  saveData is triggered by the onRequestSaveData 
         *         (initially called by doRequestSaveData)
         *  In the EnyoJS model, exportType contains the
         *  user's request on the type of data to be
         *  exported.
         * 
         *  ToDo: Exporting as AnIML contains a lot of duplicate code that
         *      needs to be cut down to remove the redundant lines of code
         */
        let downloadFiles = !false;
        console.log('Saving Data In Selected Format!');
        var channels = this.get('model.channels');
        var exportType = this.get('model.exportType');

        // Convert ADC to Voltage, 3.3 is the max referenced voltage of the device
        // Convert Voltage to Pressure, Units are PSI, Pressure = ((ADC->Voltage) -0.5)*15000/4
        var MAX_VALUE = 4095; // Max ADC Value

        // Averaging (Artihmetic Mean) data points for conversion
        var avgReferenceChannel = [];
        if (exportType.ConvertAbsorbance) {
            channels.forEach(function (channel, index) {
                if (channel.get('trace').length) {
                    var channel_points = [];
                    channel.get('trace').forEach(function (point, pointIndex) {
                        channel_points.push(point.get('y'));
                    });
                    avgReferenceChannel.push(channel_points.reduce((a, b) => a + b, 0) / channel_points.length);
                }
            });
        }
        let avgProcessedReferenceChannel = {}
        if (exportType.Processed && this.appliedFilters && exportType.ConvertAbsorbance) {
            console.log('Creating avgProcessedReferenceChannel');
            this.appliedFilters.get('filters').forEach((filter, filter_index) => {
                let exportData = {
                    annotations: null,
                    inputs: [],
                    outputs: [],
                    values: null,
                };
                // console.log('filter', filter);
                if (filter.get('annotations').length) {
                    // Add to SeriesSet
                    console.log('annotations');
                    // Add to SeriesSet & SeriesSetCount
                }
                if (filter.get('values').length) {
                    // Add to SeriesSet
                    console.log('values');
                    // Add to SeriesSet & SeriesSetCount
                }

                // Average the input
                filter.get('inputs').forEach((channel, channel_index) => {
                    if (channel.get('trace').length) {
                        let channel_points = [];
                        channel.get('trace').forEach(point => {
                            channel_points.push(point.get('y'));
                        });
                        exportData.inputs = (channel_points.reduce((a, b) => a + b, 0) / channel_points.length);
                    }
                });

                if (filter.get('inputs') == filter.get('outputs')) {
                    console.log('inputs = outputs filter');
                    exportData.outputs.push(exportData.inputs[filter_index]);
                } else {
                    console.log('outputs', filter.get('outputs'));
                    // Average the output
                    filter.get('outputs').forEach((channel, channel_index) => {
                        if (channel.get('trace').length) {
                            let channel_points = [];
                            channel.get('trace').forEach(point => {
                                channel_points.push(point.get('y'));
                            });
                            exportData.outputs = (channel_points.reduce((a, b) => a + b, 0) / channel_points.length);
                        }
                    });
                }

                avgProcessedReferenceChannel[filter.get('name')] = exportData;
            });
        }

        // Converting functions are listed here in the case that they need to be changed in the future
        let convertADCtoAbsorbance = function (y, avgs, index) {
            /**
             *  function: convertADCtoAbsorbance
             * 
             *  convertADCtoAbsorbance converts the raw data to Absorbance
             */
            return Math.log10(avgs[index] / y);
        };
        let convertADCtoPressure = function (y, max) {
            /**
             *  function: convertADCtoPressure
             * 
             *  convertADCtoPressure converts the raw ADC to Pressure
             * 
             *  See TestRunPanel.js for duplicate lines of code
             */
            var pressure = (((3.3 / max) * y) - 0.5) * 15000 / 4;
            if (pressure <= 0) {
                pressure = 0;
            }
            return pressure;
        };
        let convertProcessedADCtoAbsorbance = function (y, avgs, name, property) {
            /**
             *  function: convertProcessedADCtoAbsorbance
             * 
             *  convertProcessedADCtoAbsorbance converts the raw ADC (that has been processed by filters) to Absorbance
             */
            return Math.log10(avgs[name][property] / y);
        };

        // ToDo: Incorporate Method Data into AnIML (XML)
        //console.warn('Method Data has yet to be added to AnIML');
        //console.warn('Values have not been added to CSV or AnIML');
        //  console.warn('Annotations have not been added to CSV or AnIML');
        // console.log('method', this.get('model.method'));
        // console.log('method', this.get('model.method.name'));


        let exportRawData = function (CSV, XML, Absorbance = false, Pressure = false, that, Download = true, applyAsStack = false) {

            if (CSV) {
                console.log('Downloading  Raw CSV');
                var text = '';
                var data = [];
                if (Absorbance && Pressure) {
                    channels.forEach(function (channel, index) {
                        // console.log('Dumping data for channel %O', channel);
                        if (!index) {
                            text += 'Time,'
                        }

                        if (channels.length - 1 != index) {
                            text += 'Channel ' + index + ',';
                        } else {
                            text += 'Channel ' + index;
                        }

                        channel.get('trace').forEach(function (point, pointIndex) {
                            if (!index) {
                                data.push(point.get('x')); // Time
                            }

                            if (index == 0 || index == 1) {
                                // Convert ADC to Absorbance
                                data[pointIndex] += ',' + convertADCtoAbsorbance(point.get('y'), avgReferenceChannel, index); // y-data -> Absorbance
                            } else if (index == 2 || index == 3) {
                                // Convert ADC to Pressure
                                data[pointIndex] += ',' + convertADCtoPressure(point.get('y'), MAX_VALUE); // y-data -> Pressure
                            }
                        });
                    });
                } else if (Absorbance && !Pressure) {
                    channels.forEach(function (channel, index) {
                        // console.log('Dumping data for channel %O', channel);
                        if (!index) {
                            text += 'Time,'
                        }

                        if (channels.length - 1 != index) {
                            text += 'Channel ' + index + ',';
                        } else {
                            text += 'Channel ' + index;
                        }

                        channel.get('trace').forEach(function (point, pointIndex) {
                            if (!index) {
                                data.push(point.get('x')); // Time
                            }

                            if (index == 0 || index == 1) {
                                // Convert ADC to Absorbance
                                data[pointIndex] += ',' + convertADCtoAbsorbance(point.get('y'), avgReferenceChannel, index); // y-data -> Absorbance
                            } else if (index == 2 || index == 3) {
                                data[pointIndex] += ',' + point.get('y'); // y-data -> Pressure
                            }
                        });
                    });
                } else if (!Absorbance && Pressure) {
                    channels.forEach(function (channel, index) {
                        // console.log('Dumping data for channel %O', channel);
                        if (!index) {
                            text += 'Time,'
                        }

                        if (channels.length - 1 != index) {
                            text += 'Channel ' + index + ',';
                        } else {
                            text += 'Channel ' + index;
                        }

                        channel.get('trace').forEach(function (point, pointIndex) {
                            if (!index) {
                                data.push(point.get('x')); // Time
                            }

                            if (index == 0 || index == 1) {
                                data[pointIndex] += ',' + point.get('y'); // y-data -> Raw ADC
                            } else if (index == 2 || index == 3) {
                                data[pointIndex] += ',' + convertADCtoPressure(point.get('y'), MAX_VALUE); // y-data -> Pressure
                            }
                        });
                    });
                } else if (!Absorbance && !Pressure) {
                    channels.forEach(function (channel, index) {
                        // console.log('Dumping data for channel %O', channel);
                        if (!index) {
                            text += 'Time,'
                        }

                        if (channels.length - 1 != index) {
                            text += 'Channel ' + index + ',';
                        } else {
                            text += 'Channel ' + index;
                        }

                        channel.get('trace').forEach(function (point, pointIndex) {
                            if (!index) {
                                data.push(point.get('x')); // Time
                            }

                            data[pointIndex] += ',' + point.get('y'); // y-data -> Absorbance/Pressure
                        });
                    });
                }

                var filename = that.get('model.path') + '.csv';
                if (Download) {
                    utils.Download(filename, text + data.join('\n'));
                } else {
                    console.log('titles', text);
                    return [text, data];
                }
            }

            if (XML) {
                console.log('Downloading Raw XML');
                let methodx = that.get('model.method.name');
                let methodd = that.get('model.date');
                let myChannelString = '';
                channels.forEach((channel, index) => {
                    if (channel.get('trace').length) {
                        myChannelString += ', Channel ' + index;
                    }
                });
                console.log(methodx);
                let jsonData = {
                    "_declaration": {
                        "_attributes": {
                            "version": "1.0",
                            "encoding": "UTF-8"
                        }
                    },
                    "_comment": " Created by Axcend 1.0 (http://www.axcendcorp.com) ",
                    "AnIML": {
                        "_attributes": {
                            "targetNamespace": "urn:org:astm:animl:schema:core:draft:0.90",
                            "xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
                            "xmlns:ds": "http://www.w3.org/2000/09/xmldsig#",
                            "xmlns": "urn:org:astm:animl:schema:core:draft:0.90",
                            "elementFormDefault": "qualified",
                            "attributeFormDefault": "unqualified",
                            "version": "0.90"
                        },
                        "_comment": " Time" + myChannelString + " ",
                        "ExperimentStepSet": {
                            "ExperimentStep": [
                                {
                                    "_comment": (Absorbance ? " Converted Raw ADC to Absorbance" : " Raw Absorbance ADC") + ' and ' + (Pressure ? "Converted Raw ADC to Pressure " : "Raw Pressure ADC "),
                                    "Technique": {
                                        "_attributes": {
                                            "name": "Liquid Chromatography",
                                            "uri": "http://techniques.animl.org/current/chromatography-technique.atdd",
                                            "method":methodx,
                                            "date":methodd
                                        }
                                    },
                                    "Result": {
                                        "_attributes": {
                                            "id": that.get('model.date').replace(/\s/g, '_')
                                        },
                                        "SeriesSet": {
                                            "_comment": 'Original Data Recorded on ' + that.get('model.date'),
                                            "Series": [
                                            ]
                                        }
                                    },
                                    "CategoryBlueprint": []
                                }
                            ]
                        }
                    }
                };
                if (Absorbance && Pressure) {
                    // Absorbance & Pressure
                    channels.forEach(function (channel, index) {
                        let XMLatts = {};

                        switch (index) {
                            case 0:
                                XMLatts = {
                                    "_comment": [
                                        " The Time Data "
                                    ],
                                    "_attributes": {
                                        "name": "Time",
                                        "seriesType": "Float",
                                        "seriesID": "t",
                                        "dependency": "independent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "sec",
                                            "quantity": "Time"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }

                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[0].Result.SeriesSet.Series.push(XMLatts);

                                XMLatts = {
                                    "_comment": [
                                        " The Channel Data "
                                    ],
                                    "_attributes": {
                                        "name": "Channel_0",
                                        "seriesType": "Float",
                                        "seriesID": "0",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "Absorbance",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                };
                                break;
                            case 1:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_1",
                                        "seriesType": "Float",
                                        "seriesID": "1",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "Absorbance",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;
                            case 2:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_2",
                                        "seriesType": "Float",
                                        "seriesID": "2",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "Pressure",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;

                            case 3:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_3",
                                        "seriesType": "Float",
                                        "seriesID": "3",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "Pressure",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;

                            case 4:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_4",
                                        "seriesType": "Float",
                                        "seriesID": "4",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "//!@#$%^&*()_ ToDo:",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;

                            case 5:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_5",
                                        "seriesType": "Float",
                                        "seriesID": "5",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "//!@#$%^&*()_ ToDo:",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;
                            case 6:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_6",
                                        "seriesType": "Float",
                                        "seriesID": "6",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "//!@#$%^&*()_ ToDo:",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;

                            case 7:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_7",
                                        "seriesType": "Float",
                                        "seriesID": "7",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "//!@#$%^&*()_ ToDo:",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;
                        }
                        jsonData.AnIML.ExperimentStepSet.ExperimentStep[0].Result.SeriesSet.Series.push(XMLatts);

                        channel.get('trace').forEach(function (point) {
                            if (!index) {
                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[0].Result.SeriesSet.Series[index].IndividualValueSet.Float32.push(
                                    {
                                        "_text": point.get('x')
                                    }
                                );
                            }
                            if (index == 0 || index == 1) {
                                // Convert ADC to Absorbance
                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[0].Result.SeriesSet.Series[index + 1].IndividualValueSet.Float32.push(
                                    {
                                        "_text": convertADCtoAbsorbance(point.get('y'), avgReferenceChannel, index)  // Math.log10(avgReferenceChannel[index] / point.get('y'))
                                    }
                                );
                            } else if (index == 2 || index == 3) {
                                // Convert ADC to Pressure
                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[0].Result.SeriesSet.Series[index + 1].IndividualValueSet.Float32.push(
                                    {
                                        "_text": convertADCtoPressure(point.get('y'), MAX_VALUE)
                                    }
                                );
                            } else if (index == 4 || index == 5) {
                                // Remaining Two Channels
                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet.Series[index + 1].IndividualValueSet.Float32.push(
                                    {
                                        "_text": point.get('y')
                                    }
                                );
                            }
                        });
                    });
                } else if (Absorbance && !Pressure) {
                    // Absorbance & No Pressure
                    channels.forEach(function (channel, index) {
                        var XMLatts = {};

                        switch (index) {
                            case 0:
                                XMLatts = {
                                    "_comment": [
                                        " The Time Data "
                                    ],
                                    "_attributes": {
                                        "name": "Time",
                                        "seriesType": "Float",
                                        "seriesID": "t",
                                        "dependency": "independent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "sec",
                                            "quantity": "Time"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }

                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[0].Result.SeriesSet.Series.push(XMLatts);

                                XMLatts = {
                                    "_comment": [
                                        " The Channel Data "
                                    ],
                                    "_attributes": {
                                        "name": "Channel_0",
                                        "seriesType": "Float",
                                        "seriesID": "0",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "Absorbance",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                };
                                break;
                            case 1:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_1",
                                        "seriesType": "Float",
                                        "seriesID": "1",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "Absorbance",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;
                            case 2:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_2",
                                        "seriesType": "Float",
                                        "seriesID": "2",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "Pressure",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;

                            case 3:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_3",
                                        "seriesType": "Float",
                                        "seriesID": "3",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "Pressure",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;

                            case 4:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_4",
                                        "seriesType": "Float",
                                        "seriesID": "4",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "//!@#$%^&*()_ ToDo:",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;

                            case 5:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_5",
                                        "seriesType": "Float",
                                        "seriesID": "5",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "//!@#$%^&*()_ ToDo:",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;
                            case 6:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_6",
                                        "seriesType": "Float",
                                        "seriesID": "6",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "//!@#$%^&*()_ ToDo:",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;

                            case 7:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_7",
                                        "seriesType": "Float",
                                        "seriesID": "7",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "//!@#$%^&*()_ ToDo:",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;

                        }
                        jsonData.AnIML.ExperimentStepSet.ExperimentStep[0].Result.SeriesSet.Series.push(XMLatts);

                        channel.get('trace').forEach(function (point) {
                            if (!index) {
                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[0].Result.SeriesSet.Series[index].IndividualValueSet.Float32.push(
                                    {
                                        "_text": point.get('x')
                                    }
                                );
                            }
                            if (index === 0 || index == 1) {
                                // Convert ADC to Absorbance
                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[0].Result.SeriesSet.Series[index + 1].IndividualValueSet.Float32.push(
                                    {
                                        "_text": convertADCtoAbsorbance(point.get('y'), avgReferenceChannel, index)  // Math.log10(avgReferenceChannel[index] / point.get('y'))
                                    }
                                );
                            } else if (index == 2 || index == 3) {
                                // Pressure ADC
                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[0].Result.SeriesSet.Series[index + 1].IndividualValueSet.Float32.push(
                                    {
                                        "_text": point.get('y')
                                    }
                                );
                            } else if (index == 4 || index == 5) {
                                // Remaining Two Channels
                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet.Series[index + 1].IndividualValueSet.Float32.push(
                                    {
                                        "_text": point.get('y')
                                    }
                                );
                            }
                        });
                    });

                } else if (!Absorbance && Pressure) {
                    // No Absorbance & Pressure
                    channels.forEach(function (channel, index) {
                        var XMLatts = {};

                        switch (index) {
                            case 0:
                                XMLatts = {
                                    "_comment": [
                                        " The Time Data "
                                    ],
                                    "_attributes": {
                                        "name": "Time",
                                        "seriesType": "Float",
                                        "seriesID": "t",
                                        "dependency": "independent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "sec",
                                            "quantity": "Time"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }

                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[0].Result.SeriesSet.Series.push(XMLatts);

                                XMLatts = {
                                    "_comment": [
                                        " The Channel Data "
                                    ],
                                    "_attributes": {
                                        "name": "Channel_0",
                                        "seriesType": "Float",
                                        "seriesID": "0",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "Absorbance",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                };
                                break;
                            case 1:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_1",
                                        "seriesType": "Float",
                                        "seriesID": "1",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "Absorbance",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;
                            case 2:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_2",
                                        "seriesType": "Float",
                                        "seriesID": "2",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "Pressure",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;

                            case 3:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_3",
                                        "seriesType": "Float",
                                        "seriesID": "3",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "Pressure",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;

                            case 4:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_4",
                                        "seriesType": "Float",
                                        "seriesID": "4",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "//!@#$%^&*()_ ToDo:",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;

                            case 5:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_5",
                                        "seriesType": "Float",
                                        "seriesID": "5",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "//!@#$%^&*()_ ToDo:",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;
                            case 6:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_6",
                                        "seriesType": "Float",
                                        "seriesID": "6",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "//!@#$%^&*()_ ToDo:",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;
                            case 7:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_7",
                                        "seriesType": "Float",
                                        "seriesID": "7",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "//!@#$%^&*()_ ToDo:",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;

                        }
                        jsonData.AnIML.ExperimentStepSet.ExperimentStep[0].Result.SeriesSet.Series.push(XMLatts);

                        channel.get('trace').forEach(function (point) {
                            if (!index) {
                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[0].Result.SeriesSet.Series[index].IndividualValueSet.Float32.push(
                                    {
                                        "_text": point.get('x')
                                    }
                                );
                            }
                            if (index === 0 || index == 1) {
                                // ADC Absorbance
                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[0].Result.SeriesSet.Series[index + 1].IndividualValueSet.Float32.push(
                                    {
                                        "_text": point.get('y')
                                    }
                                );
                            } else if (index == 2 || index == 3) {
                                // Convert ADC to Pressure
                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[0].Result.SeriesSet.Series[index + 1].IndividualValueSet.Float32.push(
                                    {
                                        "_text": convertADCtoPressure(point.get('y'), MAX_VALUE)
                                    }
                                );
                            } else if (index == 4 || index == 5) {
                                // Remaining Two Channels
                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet.Series[index + 1].IndividualValueSet.Float32.push(
                                    {
                                        "_text": point.get('y')
                                    }
                                );
                            }
                        });
                    });
                } else if (!Absorbance && !Pressure) {
                    // No Absorbance & No Pressure
                    // console.log('No Absorbance & No Pressure');
                    channels.forEach(function (channel, index) {
                        var XMLatts = {};

                        switch (index) {
                            case 0:
                                XMLatts = {
                                    "_comment": [
                                        " The Time Data "
                                    ],
                                    "_attributes": {
                                        "name": "Time",
                                        "seriesType": "Float",
                                        "seriesID": "t",
                                        "dependency": "independent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "sec",
                                            "quantity": "Time"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }

                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[0].Result.SeriesSet.Series.push(XMLatts);

                                XMLatts = {
                                    "_comment": [
                                        " The Channel Data "
                                    ],
                                    "_attributes": {
                                        "name": "Channel_0",
                                        "seriesType": "Float",
                                        "seriesID": "0",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "Absorbance",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                };
                                break;
                            case 1:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_1",
                                        "seriesType": "Float",
                                        "seriesID": "1",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "Absorbance",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;
                            case 2:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_2",
                                        "seriesType": "Float",
                                        "seriesID": "2",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "Pressure",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;
                            case 3:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_3",
                                        "seriesType": "Float",
                                        "seriesID": "3",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "Pressure",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;

                            case 4:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_4",
                                        "seriesType": "Float",
                                        "seriesID": "4",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "//!@#$%^&*()_ ToDo:",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;

                            case 5:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_5",
                                        "seriesType": "Float",
                                        "seriesID": "5",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "//!@#$%^&*()_ ToDo:",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;
                                
                            case 6:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_6",
                                        "seriesType": "Float",
                                        "seriesID": "6",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "//!@#$%^&*()_ ToDo:",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;

                            case 7:
                                XMLatts = {
                                    "_attributes": {
                                        "name": "Channel_7",
                                        "seriesType": "Float",
                                        "seriesID": "7",
                                        "dependency": "dependent"
                                    },
                                    "Unit": {
                                        "_attributes": {
                                            "label": "//!@#$%^&*()_ ToDo:",
                                            "quantity": "Raw ADC"
                                        }
                                    },
                                    "IndividualValueSet": {
                                        "Float32": []
                                    }
                                }
                                break;
                        }
                        jsonData.AnIML.ExperimentStepSet.ExperimentStep[0].Result.SeriesSet.Series.push(XMLatts);

                        channel.get('trace').forEach(function (point) {
                            if (!index) {
                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[0].Result.SeriesSet.Series[index].IndividualValueSet.Float32.push(
                                    {
                                        "_text": point.get('x')
                                    }
                                );
                            }

                            jsonData.AnIML.ExperimentStepSet.ExperimentStep[0].Result.SeriesSet.Series[index + 1].IndividualValueSet.Float32.push(
                                {
                                    "_text": point.get('y')
                                }
                            );

                        });
                    });
                }


                var filename = that.get('model.path') + '.xml';
                var toXML = XMLConverter.js2xml(jsonData, { compact: true, spaces: 4 });
                if (Download) {
                    utils.Download(filename, toXML);
                } else {
                    return jsonData;
                }
            }

        }
        let exportProcessedData = function (CSV, XML, Absorbance = false, Pressure = false, that, Download = true, applyAsStack = false) {
            /**
             * This can be cleaned up a little.
             * There are only minor differences
             * between the applyAsStack and !applyAsStack
             * versions. In fact, there is only one difference,
             * but to prevent an unknown number of iterations
             * the code was separated and copied so that
             * one less if statement had to be checked
             * (although inconvienent, this decreases
             * the number of checks from n to 1).
             * The difference is the name that is exported as CSV
            */
            if (CSV) {
                var text = '';
                var data = [];
                if (applyAsStack) {
                    console.log('Downloading Processed CSV (Stack)');

                    // Get Original data into the data Array 
                    [text, data] = exportRawData(CSV, false, Absorbance, Pressure, that, false);

                    // Add the Processed Data into the data Array
                    if (Absorbance) {
                        if (Pressure) {
                            that.appliedFilters.get('filters').forEach((filter, filter_index) => {
                                if (filter_index == that.appliedFilters.get('filters').length - 1) {

                                    text += ',';
                                    // console.log('filter', filter);
                                    if (filter.get('annotations').length) {
                                        console.log('annotations');
                                    }
                                    if (filter.get('values').length) {
                                        console.log('values');
                                    }
                                    if (filter.get('inputs') == filter.get('outputs')) {
                                        console.log('inputs = outputs filter');
                                    } else {
                                        let currentProperty = 'outputs';
                                        filter.get(currentProperty).forEach((channel, channel_index) => {
                                            if (channel.get('trace').length) {
                                                channel.get('trace').forEach((point, pointIndex) => {
                                                    if (!pointIndex) {
                                                        text += 'Processed Channel ' + channel_index;
                                                    }

                                                    if (channel_index == 0 || channel_index == 1) {
                                                        // Convert Processed ADC to Absorbance
                                                        data[pointIndex] += ',' + convertProcessedADCtoAbsorbance(point.get('y'), avgProcessedReferenceChannel, filter.get('name'), currentProperty);  // Math.log10(avgReferenceChannel[channel_index] / point.get('y')); // y-data -> Absorbance
                                                    } else if (channel_index == 2 || channel_index == 3) {
                                                        // Convert Processed ADC to Pressure
                                                        data[pointIndex] += ',' + convertADCtoPressure(point.get('y'), MAX_VALUE); // y-data -> Pressure
                                                    }
                                                });
                                            }
                                        });
                                    }
                                }
                            });
                        } else {
                            that.appliedFilters.get('filters').forEach((filter, filter_index) => {
                                if (filter_index == that.appliedFilters.get('filters').length - 1) {
                                    text += ',';
                                    // console.log('filter', filter);
                                    if (filter.get('annotations').length) {
                                        console.log('annotations');
                                    }
                                    if (filter.get('values').length) {
                                        console.log('values');
                                    }
                                    if (filter.get('inputs') == filter.get('outputs')) {
                                        console.log('inputs = outputs filter');
                                    } else {
                                        let currentProperty = 'outputs';
                                        filter.get(currentProperty).forEach((channel, channel_index) => {
                                            if (channel.get('trace').length) {
                                                channel.get('trace').forEach((point, pointIndex) => {
                                                    if (!pointIndex) {
                                                        text += 'Processed Channel ' + channel_index;
                                                    }

                                                    if (channel_index == 0 || channel_index == 1) {
                                                        // Convert Processed ADC to Absorbance
                                                        data[pointIndex] += ',' + convertProcessedADCtoAbsorbance(point.get('y'), avgProcessedReferenceChannel, filter.get('name'), currentProperty);  // Math.log10(avgReferenceChannel[channel_index] / point.get('y')); // y-data -> Absorbance
                                                    } else if (channel_index == 2 || channel_index == 3) {
                                                        // Processed ADC Pressure
                                                        data[pointIndex] += ',' + point.get('y'); // y-data -> Pressure
                                                    }
                                                });
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    } else {
                        if (Pressure) {
                            that.appliedFilters.get('filters').forEach((filter, filter_index) => {
                                if (filter_index == that.appliedFilters.get('filters').length - 1) {
                                    text += ',';
                                    // console.log('filter', filter);
                                    if (filter.get('annotations').length) {
                                        console.log('annotations');
                                    }
                                    if (filter.get('values').length) {
                                        console.log('values');
                                    }
                                    if (filter.get('inputs') == filter.get('outputs')) {
                                        console.log('inputs = outputs filter');
                                    } else {
                                        let currentProperty = 'outputs';
                                        filter.get(currentProperty).forEach((channel, channel_index) => {
                                            if (channel.get('trace').length) {
                                                channel.get('trace').forEach((point, pointIndex) => {
                                                    if (!pointIndex) {
                                                        text += 'Processed Channel ' + channel_index;
                                                    }

                                                    if (channel_index == 0 || channel_index == 1) {
                                                        // Processed ADC Absorbance
                                                        data[pointIndex] += ',' + point.get('y');  // Math.log10(avgReferenceChannel[channel_index] / point.get('y')); // y-data -> Absorbance
                                                    } else if (channel_index == 2 || channel_index == 3) {
                                                        // Convert Processed ADC to Pressure
                                                        data[pointIndex] += ',' + convertADCtoPressure(point.get('y'), MAX_VALUE); // y-data -> Pressure
                                                    }
                                                });
                                            }
                                        });
                                    }
                                }
                            });
                        } else {
                            that.appliedFilters.get('filters').forEach((filter, filter_index) => {
                                if (filter_index == that.appliedFilters.get('filters').length - 1) {
                                    text += ',';
                                    // console.log('filter', filter);
                                    if (filter.get('annotations').length) {
                                        console.log('annotations');
                                    }
                                    if (filter.get('values').length) {
                                        console.log('values');
                                    }
                                    if (filter.get('inputs') == filter.get('outputs')) {
                                        console.log('inputs = outputs filter');
                                    } else {
                                        let currentProperty = 'outputs';
                                        filter.get(currentProperty).forEach((channel, channel_index) => {
                                            if (channel.get('trace').length) {
                                                channel.get('trace').forEach((point, pointIndex) => {
                                                    if (!pointIndex) {
                                                        text += 'Processed Channel ' + channel_index;
                                                    }

                                                    // Processed ADC
                                                    data[pointIndex] += ',' + point.get('y');
                                                });
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    }
                } else {
                    console.log('Downloading Processed CSV');

                    // Get Original data into the data Array 
                    [text, data] = exportRawData(CSV, false, Absorbance, Pressure, that, false);

                    // Add the Processed Data into the data Array
                    if (Absorbance) {
                        if (Pressure) {
                            that.appliedFilters.get('filters').forEach((filter, filter_index) => {
                                text += ',';
                                // console.log('filter', filter);
                                if (filter.get('annotations').length) {
                                    console.log('annotations');
                                }
                                if (filter.get('values').length) {
                                    console.log('values');
                                }
                                if (filter.get('inputs') == filter.get('outputs')) {
                                    console.log('inputs = outputs filter');
                                } else {
                                    let currentProperty = 'outputs';
                                    filter.get(currentProperty).forEach((channel, channel_index) => {
                                        if (channel.get('trace').length) {
                                            channel.get('trace').forEach((point, pointIndex) => {
                                                if (!pointIndex) {
                                                    text += 'Channel ' + channel_index + ':' + filter.get('name');
                                                }

                                                if (channel_index == 0 || channel_index == 1) {
                                                    // Convert Processed ADC to Absorbance
                                                    data[pointIndex] += ',' + convertProcessedADCtoAbsorbance(point.get('y'), avgProcessedReferenceChannel, filter.get('name'), currentProperty);  // Math.log10(avgReferenceChannel[channel_index] / point.get('y')); // y-data -> Absorbance
                                                } else if (channel_index == 2 || channel_index == 3) {
                                                    // Convert Processed ADC to Pressure
                                                    data[pointIndex] += ',' + convertADCtoPressure(point.get('y'), MAX_VALUE); // y-data -> Pressure
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        } else {
                            that.appliedFilters.get('filters').forEach((filter, filter_index) => {
                                text += ',';
                                // console.log('filter', filter);
                                if (filter.get('annotations').length) {
                                    console.log('annotations');
                                }
                                if (filter.get('values').length) {
                                    console.log('values');
                                }
                                if (filter.get('inputs') == filter.get('outputs')) {
                                    console.log('inputs = outputs filter');
                                } else {
                                    let currentProperty = 'outputs';
                                    filter.get(currentProperty).forEach((channel, channel_index) => {
                                        if (channel.get('trace').length) {
                                            channel.get('trace').forEach((point, pointIndex) => {
                                                if (!pointIndex) {
                                                    text += 'Channel ' + channel_index + ':' + filter.get('name');
                                                }

                                                if (channel_index == 0 || channel_index == 1) {
                                                    // Convert Processed ADC to Absorbance
                                                    data[pointIndex] += ',' + convertProcessedADCtoAbsorbance(point.get('y'), avgProcessedReferenceChannel, filter.get('name'), currentProperty);  // Math.log10(avgReferenceChannel[channel_index] / point.get('y')); // y-data -> Absorbance
                                                } else if (channel_index == 2 || channel_index == 3) {
                                                    // Processed ADC Pressure
                                                    data[pointIndex] += ',' + point.get('y'); // y-data -> Pressure
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    } else {
                        if (Pressure) {
                            that.appliedFilters.get('filters').forEach((filter, filter_index) => {
                                text += ',';
                                // console.log('filter', filter);
                                if (filter.get('annotations').length) {
                                    console.log('annotations');
                                }
                                if (filter.get('values').length) {
                                    console.log('values');
                                }
                                if (filter.get('inputs') == filter.get('outputs')) {
                                    console.log('inputs = outputs filter');
                                } else {
                                    let currentProperty = 'outputs';
                                    filter.get(currentProperty).forEach((channel, channel_index) => {
                                        if (channel.get('trace').length) {
                                            channel.get('trace').forEach((point, pointIndex) => {
                                                if (!pointIndex) {
                                                    text += 'Channel ' + channel_index + ':' + filter.get('name');
                                                }

                                                if (channel_index == 0 || channel_index == 1) {
                                                    // Processed ADC Absorbance
                                                    data[pointIndex] += ',' + point.get('y');  // Math.log10(avgReferenceChannel[channel_index] / point.get('y')); // y-data -> Absorbance
                                                } else if (channel_index == 2 || channel_index == 3) {
                                                    // Convert Processed ADC to Pressure
                                                    data[pointIndex] += ',' + convertADCtoPressure(point.get('y'), MAX_VALUE); // y-data -> Pressure
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        } else {
                            that.appliedFilters.get('filters').forEach((filter, filter_index) => {
                                text += ',';
                                // console.log('filter', filter);
                                if (filter.get('annotations').length) {
                                    console.log('annotations');
                                }
                                if (filter.get('values').length) {
                                    console.log('values');
                                }
                                if (filter.get('inputs') == filter.get('outputs')) {
                                    console.log('inputs = outputs filter');
                                } else {
                                    let currentProperty = 'outputs';
                                    filter.get(currentProperty).forEach((channel, channel_index) => {
                                        if (channel.get('trace').length) {
                                            channel.get('trace').forEach((point, pointIndex) => {
                                                if (!pointIndex) {
                                                    text += 'Channel ' + channel_index + ':' + filter.get('name');
                                                }

                                                data[pointIndex] += ',' + point.get('y');
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    }

                }
                if (Absorbance) {
                    Object.keys(avgProcessedReferenceChannel).forEach((key, keyIndex) => {
                        text += ',' + key + '\'s avg Channel ' + 'Input';
                        text += ',' + key + '\'s avg Channel ' + 'Output';
                        data[0] += ',' + avgProcessedReferenceChannel[key].inputs;
                        data[0] += ',' + avgProcessedReferenceChannel[key].outputs;
                    });
                }

                if (Download) {
                    var filename = that.get('model.path') + '.csv';
                    utils.Download(filename, text + '\n' + data.join('\n'));
                } else {
                    console.log('Processed Data\n', text + '\n' + data.join('\n'))
                }
            }
            if (XML) {

                var jsonData = exportRawData(false, XML, Absorbance, Pressure, that, false);

                if (applyAsStack) {
                    console.log('Downloading Processed XML (Original Data Applied As A Stack)');

                    if (Absorbance && Pressure) {
                        // console.log('Absorbance && Pressure');
                        let seriesSetCount = 0,
                            filter_channel_count = 1;
                        that.appliedFilters.get('filters').forEach((filter, filter_index) => {
                            // if (filter_index == that.appliedFilters.get('filters').length - 1) {

                            jsonData.AnIML.ExperimentStepSet.ExperimentStep.push(
                                {
                                    "_comment": " Filters Applied As Stack" + (Absorbance ? " Converted the Processed Raw ADC to Absorbance" : " Processed Raw Absorbance ADC") + ' and ' + (Pressure ? "Converted the Processed Raw ADC to Pressure " : "Processed Raw Pressure ADC "),
                                    "Technique": {
                                        "_attributes": {
                                            "name": "Liquid Chromatography",
                                            "uri": "http://techniques.animl.org/current/chromatography-technique.atdd"
                                        }
                                    },
                                    "Result": {
                                        "_attributes": {
                                            "id": that.appliedFiltersDateTime,
                                        },
                                        "SeriesSet": [
                                            {
                                                "_comment": [
                                                    " Filter: " + filter.get('name') + " ",
                                                ],
                                                "Series": [

                                                ],
                                                'avgProcessedReferenceChannel': {
                                                    "_comment": " avgProcessedReferenceChannelData contains the averages of the Filter's input/output data along with value and annotation data ",
                                                },
                                            }
                                        ]
                                    }
                                }
                            );
                            for (let [key, value] of Object.entries(avgProcessedReferenceChannel)) {
                                if (value && key) {
                                    jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[0].avgProcessedReferenceChannel[key.replace(/\s/g, '_')] = {};//[key] = value;
                                    for (let [sub_key, sub_value] of Object.entries(value)) {
                                        if (sub_value) {
                                            jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[0].avgProcessedReferenceChannel[key.replace(/\s/g, '_')][sub_key.replace(/\s/g, '_').slice(0, -1)] = sub_value;
                                        }
                                    }
                                }
                            }

                            // console.log('filter', filter);                    
                            if (filter.get('annotations').length) {
                                // Add to SeriesSet
                                console.log('annotations');
                                // Add to SeriesSet & SeriesSetCount
                            }
                            if (filter.get('values').length) {
                                // Add to SeriesSet
                                console.log('values');
                                // Add to SeriesSet & SeriesSetCount
                            }
                            if (filter.get('inputs') == filter.get('outputs')) {
                                console.log('inputs = outputs filter');
                            } else {

                                let currentProperty = 'inputs';
                                filter.get(currentProperty).forEach((channel, channel_index) => {
                                    console.log(` Filter ${filter.get('name')}'s ${currentProperty.charAt(0).toUpperCase() + currentProperty.slice(1).slice(0, -1)} `);

                                    // Check if channel has any data
                                    if (channel.get('trace').length) {
                                        filter_channel_count += 1;
                                        var XMLatts = {};
                                        switch (channel_index) {
                                            case 0:
                                                XMLatts = {
                                                    "_comment": [
                                                        " The Time Data "
                                                    ],
                                                    "_attributes": {
                                                        "name": "Time",
                                                        "seriesType": "Float",
                                                        "seriesID": "t",
                                                        "dependency": "independent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "sec",
                                                            "quantity": "Time"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series.push(XMLatts);

                                                XMLatts = {
                                                    "_comment": [
                                                        " The Processed Channel Data ",
                                                        ` Filter ${filter.get('name')}'s ${currentProperty.charAt(0).toUpperCase() + currentProperty.slice(1).slice(0, -1)} `
                                                    ],
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "0",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Absorbance",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                            case 1:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "1",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Absorbance",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                            case 2:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "2",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Pressure",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;

                                            case 3:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "3",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Pressure",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;

                                            case 4:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "4",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;

                                            case 5:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "5",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                            case 6:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Channel_5",
                                                        "seriesType": "Float",
                                                        "seriesID": "5",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                        }
                                        jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series.push(XMLatts);

                                        // Add Data Points to appropriate XMLatts
                                        channel.get('trace').forEach(point => {

                                            if (!channel_index) {
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": point.get('x')
                                                    }
                                                );
                                            }
                                            if (channel_index == 0 || channel_index == 1) {
                                                // Convert Processed ADC to Absorbance
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": convertProcessedADCtoAbsorbance(point.get('y'), avgProcessedReferenceChannel, filter.get('name'), currentProperty)  // Math.log10(avgReferenceChannel[channel_index] / point.get('y'))
                                                    }
                                                );
                                            } else if (channel_index == 2 || channel_index == 3) {
                                                // Convert Processed ADC to Pressure
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": convertADCtoPressure(point.get('y'), MAX_VALUE)
                                                    }
                                                );
                                            } else if (channel_index == 4 || channel_index == 5) {
                                                // Remaining Two Channels
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1].IndividualValueSet.Float32.push(
                                                    {
                                                        // "_text": convertADCtoPressure(point.get('y'), MAX_VALUE)
                                                        "_text": point.get('y')
                                                    }
                                                );
                                            }
                                        });
                                    }
                                });

                                currentProperty = 'outputs';
                                filter.get(currentProperty).forEach((channel, channel_index) => {

                                    // Check if channel has any data
                                    if (channel.get('trace').length) {
                                        var XMLatts = {};
                                        switch (channel_index) {
                                            case 0:
                                                XMLatts = {
                                                    "_comment": [
                                                        " The Time Data "
                                                    ],
                                                    "_attributes": {
                                                        "name": "Time",
                                                        "seriesType": "Float",
                                                        "seriesID": "t",
                                                        "dependency": "independent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "sec",
                                                            "quantity": "Time"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series.push(XMLatts);

                                                XMLatts = {
                                                    "_comment": [
                                                        " The Processed Channel Data ",
                                                        ` Filter ${filter.get('name')}'s ${currentProperty.charAt(0).toUpperCase() + currentProperty.slice(1).slice(0, -1)} `
                                                    ],
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "0",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Absorbance",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                            case 1:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "1",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Absorbance",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                            case 2:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "2",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Pressure",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;

                                            case 3:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "3",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Pressure",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;

                                            // Unprocessed
                                            case 4:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "4",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;

                                            case 5:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "5",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                        }
                                        jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series.push(XMLatts);

                                        // Add Data Points to appropriate XMLatts
                                        channel.get('trace').forEach(point => {
                                            if (!channel_index) {
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + filter_channel_count].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": point.get('x')
                                                    }
                                                );
                                            }
                                            if (channel_index === 0 || channel_index == 1) {
                                                // Convert Processed ADC to Absorbance
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1 + filter_channel_count].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": convertProcessedADCtoAbsorbance(point.get('y'), avgProcessedReferenceChannel, filter.get('name'), currentProperty)  // Math.log10(avgReferenceChannel[channel_index] / point.get('y'))
                                                    }
                                                );
                                            } else if (channel_index == 2 || channel_index == 3) {
                                                // Convert Processed ADC to Pressure
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1 + filter_channel_count].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": convertADCtoPressure(point.get('y'), MAX_VALUE)
                                                    }
                                                );
                                            } else if (channel_index == 4 || channel_index == 5) {
                                                // Remaining Two Channels
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1].IndividualValueSet.Float32.push(
                                                    {
                                                        // "_text": convertADCtoPressure(point.get('y'), MAX_VALUE)
                                                        "_text": point.get('y')
                                                    }
                                                );
                                            }
                                        });
                                    }
                                });
                            }
                            // }
                        });
                    } else if (Absorbance && !Pressure) {
                        console.log('Absorbance && !Pressure');
                        let seriesSetCount = 0,
                            filter_channel_count = 1;
                        that.appliedFilters.get('filters').forEach((filter, filter_index) => {
                            // if (filter_index == that.appliedFilters.get('filters').length - 1) {
                            jsonData.AnIML.ExperimentStepSet.ExperimentStep.push(
                                {
                                    "_comment": " Filters Applied As Stack" + (Absorbance ? " Converted the Processed Raw ADC to Absorbance" : " Processed Raw Absorbance ADC") + ' and ' + (Pressure ? "Converted the Processed Raw ADC to Pressure " : "Processed Raw Pressure ADC "),
                                    "Technique": {
                                        "_attributes": {
                                            "name": "Liquid Chromatography",
                                            "uri": "http://techniques.animl.org/current/chromatography-technique.atdd"
                                        }
                                    },
                                    "Result": {
                                        "_attributes": {
                                            "id": that.appliedFiltersDateTime,
                                        },
                                        "SeriesSet": [
                                            {
                                                "_comment": [
                                                    " Filter: " + filter.get('name') + " ",
                                                ],
                                                "Series": [

                                                ],
                                                'avgProcessedReferenceChannel': {
                                                    "_comment": " avgProcessedReferenceChannelData contains the averages of the Filter's input/output data along with value and annotation data ",
                                                },
                                            }
                                        ]
                                    }
                                }
                            );

                            for (let [key, value] of Object.entries(avgProcessedReferenceChannel)) {
                                if (value && key) {
                                    jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[0].avgProcessedReferenceChannel[key.replace(/\s/g, '_')] = {};//[key] = value;
                                    for (let [sub_key, sub_value] of Object.entries(value)) {
                                        if (sub_value) {
                                            jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[0].avgProcessedReferenceChannel[key.replace(/\s/g, '_')][sub_key.replace(/\s/g, '_').slice(0, -1)] = sub_value;
                                        }
                                    }
                                }
                            }

                            // console.log('filter', filter);                    
                            if (filter.get('annotations').length) {
                                // Add to SeriesSet
                                console.log('annotations');
                                // Add to SeriesSet & SeriesSetCount
                            }
                            if (filter.get('values').length) {
                                // Add to SeriesSet
                                console.log('values');
                                // Add to SeriesSet & SeriesSetCount
                            }
                            if (filter.get('inputs') == filter.get('outputs')) {
                                console.log('inputs = outputs filter');
                            } else {
                                let currentProperty = 'inputs';
                                filter.get(currentProperty).forEach((channel, channel_index) => {
                                    console.log(` Filter ${filter.get('name')}'s ${currentProperty.charAt(0).toUpperCase() + currentProperty.slice(1).slice(0, -1)} `);

                                    // Check if channel has any data
                                    if (channel.get('trace').length) {
                                        filter_channel_count += 1;
                                        var XMLatts = {};
                                        switch (channel_index) {
                                            case 0:
                                                XMLatts = {
                                                    "_comment": [
                                                        " The Time Data "
                                                    ],
                                                    "_attributes": {
                                                        "name": "Time",
                                                        "seriesType": "Float",
                                                        "seriesID": "t",
                                                        "dependency": "independent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "sec",
                                                            "quantity": "Time"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series.push(XMLatts);

                                                XMLatts = {
                                                    "_comment": [
                                                        " The Processed Channel Data ",
                                                        ` Filter ${filter.get('name')}'s ${currentProperty.charAt(0).toUpperCase() + currentProperty.slice(1).slice(0, -1)} `
                                                    ],
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "0",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Absorbance",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                            case 1:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "1",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Absorbance",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                            case 2:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "2",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Pressure",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;

                                            case 3:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "3",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Pressure",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;

                                            // Unprocessed
                                            case 4:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "4",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;

                                            case 5:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "5",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;

                                            case 6:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Channel_5",
                                                        "seriesType": "Float",
                                                        "seriesID": "5",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                        }
                                        jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series.push(XMLatts);

                                        // Add Data Points to appropriate XMLatts
                                        channel.get('trace').forEach(point => {

                                            if (!channel_index) {
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": point.get('x')
                                                    }
                                                );
                                            }
                                            if (channel_index === 0 || channel_index == 1) {
                                                // Convert Processed ADC to Absorbance
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": convertProcessedADCtoAbsorbance(point.get('y'), avgProcessedReferenceChannel, filter.get('name'), currentProperty)  // Math.log10(avgReferenceChannel[channel_index] / point.get('y'))
                                                    }
                                                );
                                            } else if (channel_index == 2 || channel_index == 3) {
                                                // Convert Processed ADC to Pressure
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": point.get('y')
                                                    }
                                                );
                                            } else if (channel_index == 4 || channel_index == 5) {
                                                // Remaining Two Channels
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1].IndividualValueSet.Float32.push(
                                                    {
                                                        // "_text": convertADCtoPressure(point.get('y'), MAX_VALUE)
                                                        "_text": point.get('y')
                                                    }
                                                );
                                            }
                                        });
                                    }
                                });

                                currentProperty = 'outputs';
                                filter.get(currentProperty).forEach((channel, channel_index) => {

                                    // Check if channel has any data
                                    if (channel.get('trace').length) {
                                        var XMLatts = {};
                                        switch (channel_index) {
                                            case 0:
                                                XMLatts = {
                                                    "_comment": [
                                                        " The Time Data "
                                                    ],
                                                    "_attributes": {
                                                        "name": "Time",
                                                        "seriesType": "Float",
                                                        "seriesID": "t",
                                                        "dependency": "independent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "sec",
                                                            "quantity": "Time"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series.push(XMLatts);

                                                XMLatts = {
                                                    "_comment": [
                                                        " The Processed Channel Data ",
                                                        ` Filter ${filter.get('name')}'s ${currentProperty.charAt(0).toUpperCase() + currentProperty.slice(1).slice(0, -1)} `
                                                    ],
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "0",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Absorbance",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                            case 1:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "1",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Absorbance",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                            case 2:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "2",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Pressure",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;

                                            case 3:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "3",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Pressure",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;

                                            // Unprocessed
                                            case 4:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Channel_4",
                                                        "seriesType": "Float",
                                                        "seriesID": "4",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;

                                            case 5:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Channel_5",
                                                        "seriesType": "Float",
                                                        "seriesID": "5",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                            case 6:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Channel_6",
                                                        "seriesType": "Float",
                                                        "seriesID": "6",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                        }
                                        jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series.push(XMLatts);

                                        // Add Data Points to appropriate XMLatts
                                        channel.get('trace').forEach(point => {
                                            if (!channel_index) {
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + filter_channel_count].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": point.get('x')
                                                    }
                                                );
                                            }

                                            if (channel_index === 0 || channel_index == 1) {
                                                // Convert Processed ADC to Absorbance
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1 + filter_channel_count].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": convertProcessedADCtoAbsorbance(point.get('y'), avgProcessedReferenceChannel, filter.get('name'), currentProperty)  // Math.log10(avgReferenceChannel[channel_index] / point.get('y'))
                                                    }
                                                );
                                            } else if (channel_index == 2 || channel_index == 3) {
                                                // Convert Processed ADC to Pressure
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1 + filter_channel_count].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": point.get('y')
                                                    }
                                                );
                                            } else if (channel_index == 4 || channel_index == 5) {
                                                // Remaining Two Channels
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1].IndividualValueSet.Float32.push(
                                                    {
                                                        // "_text": convertADCtoPressure(point.get('y'), MAX_VALUE)
                                                        "_text": point.get('y')
                                                    }
                                                );
                                            }
                                        });
                                    }
                                });
                            }
                            // }
                        });
                    } else if (!Absorbance && Pressure) {
                        // console.log('!Absorbance && Pressure');
                        let seriesSetCount = 0,
                            filter_channel_count = 1;
                        that.appliedFilters.get('filters').forEach((filter, filter_index) => {
                            // if (filter_index == that.appliedFilters.get('filters').length - 1) {
                            jsonData.AnIML.ExperimentStepSet.ExperimentStep.push(
                                {
                                    "_comment": " Filters Applied As Stack" + (Absorbance ? " Converted the Processed Raw ADC to Absorbance" : " Processed Raw Absorbance ADC") + ' and ' + (Pressure ? "Converted the Processed Raw ADC to Pressure " : "Processed Raw Pressure ADC "),
                                    "Technique": {
                                        "_attributes": {
                                            "name": "Liquid Chromatography",
                                            "uri": "http://techniques.animl.org/current/chromatography-technique.atdd"
                                        }
                                    },
                                    "Result": {
                                        "_attributes": {
                                            "id": that.appliedFiltersDateTime,
                                        },
                                        "SeriesSet": [
                                            {
                                                "_comment": " Filter: " + filter.get('name') + " ",
                                                "Series": [

                                                ]
                                            }
                                        ]
                                    }
                                }
                            );

                            // console.log('filter', filter);                    
                            if (filter.get('annotations').length) {
                                // Add to SeriesSet
                                console.log('annotations');
                                // Add to SeriesSet & SeriesSetCount
                            }
                            if (filter.get('values').length) {
                                // Add to SeriesSet
                                console.log('values');
                                // Add to SeriesSet & SeriesSetCount
                            }
                            if (filter.get('inputs') == filter.get('outputs')) {
                                console.log('inputs = outputs filter');
                            } else {
                                let currentProperty = 'inputs';
                                filter.get(currentProperty).forEach((channel, channel_index) => {
                                    console.log(` Filter ${filter.get('name')}'s ${currentProperty.charAt(0).toUpperCase() + currentProperty.slice(1).slice(0, -1)} `);

                                    // Check if channel has any data
                                    if (channel.get('trace').length) {
                                        filter_channel_count += 1;
                                        var XMLatts = {};
                                        switch (channel_index) {
                                            case 0:
                                                XMLatts = {
                                                    "_comment": [
                                                        " The Time Data "
                                                    ],
                                                    "_attributes": {
                                                        "name": "Time",
                                                        "seriesType": "Float",
                                                        "seriesID": "t",
                                                        "dependency": "independent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "sec",
                                                            "quantity": "Time"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series.push(XMLatts);

                                                XMLatts = {
                                                    "_comment": [
                                                        " The Processed Channel Data ",
                                                        ` Filter ${filter.get('name')}'s ${currentProperty.charAt(0).toUpperCase() + currentProperty.slice(1).slice(0, -1)} `
                                                    ],
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "0",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Absorbance",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                            case 1:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "1",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Absorbance",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                            case 2:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "2",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Pressure",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;

                                            case 3:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "3",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Pressure",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;

                                            // Unprocessed
                                            case 4:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Channel_4",
                                                        "seriesType": "Float",
                                                        "seriesID": "4",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;

                                            case 5:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Channel_5",
                                                        "seriesType": "Float",
                                                        "seriesID": "5",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                        }
                                        jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series.push(XMLatts);

                                        // Add Data Points to appropriate XMLatts
                                        channel.get('trace').forEach(point => {

                                            if (!channel_index) {
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": point.get('x')
                                                    }
                                                );
                                            }
                                            if (channel_index === 0 || channel_index == 1) {
                                                // Convert Processed ADC to Absorbance
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": point.get('y')  // Math.log10(avgReferenceChannel[channel_index] / point.get('y'))
                                                    }
                                                );
                                            } else if (channel_index == 2 || channel_index == 3) {
                                                // Convert Processed ADC to Pressure
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": convertADCtoPressure(point.get('y'), MAX_VALUE)
                                                    }
                                                );
                                            } else if (channel_index == 4 || channel_index == 5) {
                                                // Remaining Two Channels
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1].IndividualValueSet.Float32.push(
                                                    {
                                                        // "_text": convertADCtoPressure(point.get('y'), MAX_VALUE)
                                                        "_text": point.get('y')
                                                    }
                                                );
                                            }
                                        });
                                    }
                                });

                                currentProperty = 'outputs';
                                filter.get(currentProperty).forEach((channel, channel_index) => {

                                    // Check if channel has any data
                                    if (channel.get('trace').length) {
                                        var XMLatts = {};
                                        switch (channel_index) {
                                            case 0:
                                                XMLatts = {
                                                    "_comment": [
                                                        " The Time Data "
                                                    ],
                                                    "_attributes": {
                                                        "name": "Time",
                                                        "seriesType": "Float",
                                                        "seriesID": "t",
                                                        "dependency": "independent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "sec",
                                                            "quantity": "Time"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series.push(XMLatts);

                                                XMLatts = {
                                                    "_comment": [
                                                        " The Processed Channel Data ",
                                                        ` Filter ${filter.get('name')}'s ${currentProperty.charAt(0).toUpperCase() + currentProperty.slice(1).slice(0, -1)} `
                                                    ],
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "0",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Absorbance",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                            case 1:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "1",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Absorbance",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                            case 2:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "2",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Pressure",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;

                                            case 3:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "3",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Pressure",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;

                                            // Unprocessed
                                            case 4:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Channel_4",
                                                        "seriesType": "Float",
                                                        "seriesID": "4",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;

                                            case 5:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Channel_5",
                                                        "seriesType": "Float",
                                                        "seriesID": "5",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                        }
                                        jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series.push(XMLatts);

                                        // Add Data Points to appropriate XMLatts
                                        channel.get('trace').forEach(point => {
                                            if (!channel_index) {
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + filter_channel_count].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": point.get('x')
                                                    }
                                                );
                                            }

                                            if (channel_index === 0 || channel_index == 1) {
                                                // Convert Processed ADC to Absorbance
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1 + filter_channel_count].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": point.get('y')  // Math.log10(avgReferenceChannel[channel_index] / point.get('y'))
                                                    }
                                                );
                                            } else if (channel_index == 2 || channel_index == 3) {
                                                // Convert Processed ADC to Pressure
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1 + filter_channel_count].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": convertADCtoPressure(point.get('y'), MAX_VALUE)
                                                    }
                                                );
                                            } else if (channel_index == 4 || channel_index == 5) {
                                                // Remaining Two Channels
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1].IndividualValueSet.Float32.push(
                                                    {
                                                        // "_text": convertADCtoPressure(point.get('y'), MAX_VALUE)
                                                        "_text": point.get('y')
                                                    }
                                                );
                                            }
                                        });
                                    }
                                });
                            }
                            // }
                        });
                    } else if (!Absorbance && !Pressure) {
                        let seriesSetCount = 0,
                            filter_channel_count = 1;
                        that.appliedFilters.get('filters').forEach((filter, filter_index) => {
                            // if (filter_index == that.appliedFilters.get('filters').length - 1) {
                            console.log('filter', filter);
                            jsonData.AnIML.ExperimentStepSet.ExperimentStep.push(
                                {
                                    "_comment": " Filters Applied As Stack" + (Absorbance ? " Converted the Processed Raw ADC to Absorbance" : " Processed Raw Absorbance ADC") + ' and ' + (Pressure ? "Converted the Processed Raw ADC to Pressure " : "Processed Raw Pressure ADC "),
                                    "Technique": {
                                        "_attributes": {
                                            "name": "Liquid Chromatography",
                                            "uri": "http://techniques.animl.org/current/chromatography-technique.atdd"
                                        }
                                    },
                                    "Result": {
                                        "_attributes": {
                                            "id": that.appliedFiltersDateTime,
                                        },
                                        "SeriesSet": [
                                            {
                                                "_comment": [
                                                    " Filter: " + filter.get('name') + " "
                                                ],
                                                "Series": [
                                                ]
                                            }
                                        ]
                                    }
                                }
                            );

                            // console.log('filter', filter);                    
                            if (filter.get('annotations').length) {
                                // Add to SeriesSet
                                console.log('annotations');
                                // Add to SeriesSet & SeriesSetCount
                            }
                            if (filter.get('values').length) {
                                // Add to SeriesSet
                                console.log('values');
                                // Add to SeriesSet & SeriesSetCount
                            }
                            if (filter.get('inputs') == filter.get('outputs')) {
                                console.log('inputs = outputs filter');
                            } else {
                                let currentProperty = 'inputs';
                                filter.get(currentProperty).forEach((channel, channel_index) => {
                                    console.log(` Filter ${filter.get('name')}'s ${currentProperty.charAt(0).toUpperCase() + currentProperty.slice(1).slice(0, -1)} `);

                                    // Check if channel has any data
                                    if (channel.get('trace').length) {
                                        filter_channel_count += 1;
                                        var XMLatts = {};
                                        switch (channel_index) {
                                            case 0:
                                                XMLatts = {
                                                    "_comment": [
                                                        " The Time Data "
                                                    ],
                                                    "_attributes": {
                                                        "name": "Time",
                                                        "seriesType": "Float",
                                                        "seriesID": "t",
                                                        "dependency": "independent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "sec",
                                                            "quantity": "Time"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series.push(XMLatts);

                                                XMLatts = {
                                                    "_comment": [
                                                        " The Processed Channel Data ",
                                                        ` Filter ${filter.get('name')}'s ${currentProperty.charAt(0).toUpperCase() + currentProperty.slice(1).slice(0, -1)} `
                                                    ],
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "0",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Absorbance",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                            case 1:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "1",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Absorbance",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                            case 2:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "2",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Pressure",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;

                                            case 3:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "3",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Pressure",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;

                                            // Unprocessed
                                            case 4:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Channel_4",
                                                        "seriesType": "Float",
                                                        "seriesID": "4",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;

                                            case 5:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Channel_5",
                                                        "seriesType": "Float",
                                                        "seriesID": "5",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                        }
                                        jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series.push(XMLatts);

                                        // Add Data Points to appropriate XMLatts
                                        channel.get('trace').forEach(point => {

                                            if (!channel_index) {
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": point.get('x')
                                                    }
                                                );
                                            }

                                            jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1].IndividualValueSet.Float32.push(
                                                {
                                                    "_text": point.get('y')
                                                }
                                            );
                                        });
                                    }
                                });

                                currentProperty = 'outputs';
                                filter.get(currentProperty).forEach((channel, channel_index) => {

                                    // Check if channel has any data
                                    if (channel.get('trace').length) {
                                        var XMLatts = {};
                                        switch (channel_index) {
                                            case 0:
                                                XMLatts = {
                                                    "_comment": [
                                                        " The Time Data "
                                                    ],
                                                    "_attributes": {
                                                        "name": "Time",
                                                        "seriesType": "Float",
                                                        "seriesID": "t",
                                                        "dependency": "independent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "sec",
                                                            "quantity": "Time"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series.push(XMLatts);

                                                XMLatts = {
                                                    "_comment": [
                                                        " The Processed Channel Data ",
                                                        ` Filter ${filter.get('name')}'s ${currentProperty.charAt(0).toUpperCase() + currentProperty.slice(1).slice(0, -1)} `
                                                    ],
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "0",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Absorbance",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                            case 1:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "1",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Absorbance",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                            case 2:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "2",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Pressure",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;

                                            case 3:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "3",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Pressure",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;

                                            // Unprocessed
                                            case 4:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Channel_4",
                                                        "seriesType": "Float",
                                                        "seriesID": "4",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;

                                            case 5:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Channel_5",
                                                        "seriesType": "Float",
                                                        "seriesID": "5",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                        }
                                        jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series.push(XMLatts);

                                        // Add Data Points to appropriate XMLatts
                                        channel.get('trace').forEach(point => {
                                            if (!channel_index) {
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + filter_channel_count].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": point.get('x')
                                                    }
                                                );
                                            }

                                            jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1 + filter_channel_count].IndividualValueSet.Float32.push(
                                                {
                                                    "_text": point.get('y')
                                                }
                                            );
                                        });
                                    }
                                });
                            }
                            // }
                        });
                    }

                    if (Download) {
                        var filename = that.get('model.path') + '.xml';
                        var toXML = XMLConverter.js2xml(jsonData, { compact: true, spaces: 4 });
                        utils.Download(filename, toXML);
                    } else {
                        console.log('jsonData\n', jsonData);
                    }
                } else {
                    console.log('Downloading Processed XML (Original Data NOT Applied As A Stack)');

                    if (Absorbance && Pressure) {
                        let seriesSetCount = 0;
                        that.appliedFilters.get('filters').forEach((filter, filter_index) => {
                            jsonData.AnIML.ExperimentStepSet.ExperimentStep.push(
                                {
                                    "_comment": " Filter: " + filter.get('name') + " --" + (Absorbance ? " Converted the Processed Raw ADC to Absorbance" : " Processed Raw Absorbance ADC") + ' and ' + (Pressure ? "Converted the Processed Raw ADC to Pressure " : "Processed Raw Pressure ADC "),
                                    "Technique": {
                                        "_attributes": {
                                            "name": "Liquid Chromatography",
                                            "uri": "http://techniques.animl.org/current/chromatography-technique.atdd"
                                        }
                                    },
                                    "Result": {
                                        "_attributes": {
                                            "id": that.appliedFiltersDateTime,
                                            "_comment": " avgProcessedReferenceChannelData contains averages of the Filter's input/output data along with value and annotation data ",

                                        },
                                        "SeriesSet": [
                                            {
                                                "_comment": " Filter: " + filter.get('name') + " ",
                                                "Series": [
                                                ]
                                            }
                                        ]
                                    }
                                }
                            );
                            jsonData.AnIML.ExperimentStepSet.ExperimentStep[filter_index + 1].Result._attributes['avgProcessedReferenceChannelData'] = avgProcessedReferenceChannel;

                            // console.log('filter', filter);                    
                            if (filter.get('annotations').length) {
                                // Add to SeriesSet
                                console.log('annotations');
                                // Add to SeriesSet & SeriesSetCount
                            }
                            if (filter.get('values').length) {
                                // Add to SeriesSet
                                console.log('values');
                                // Add to SeriesSet & SeriesSetCount
                            }
                            if (filter.get('inputs') == filter.get('outputs')) {
                                console.log('inputs = outputs filter');
                            } else {
                                let currentProperty = 'outputs';
                                filter.get(currentProperty).forEach((channel, channel_index) => {

                                    // Check if channel has any data
                                    if (channel.get('trace').length) {
                                        var XMLatts = {};
                                        switch (channel_index) {
                                            case 0:
                                                XMLatts = {
                                                    "_comment": [
                                                        " The Time Data "
                                                    ],
                                                    "_attributes": {
                                                        "name": "Time",
                                                        "seriesType": "Float",
                                                        "seriesID": "t",
                                                        "dependency": "independent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "sec",
                                                            "quantity": "Time"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[filter_index + 1].Result.SeriesSet[seriesSetCount].Series.push(XMLatts);

                                                XMLatts = {
                                                    "_comment": [
                                                        " The Processed Channel Data "
                                                    ],
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "0",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Absorbance",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                            case 1:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "1",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Absorbance",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                break;
                                            case 2:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "2",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Pressure",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                break;

                                            case 3:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "3",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Pressure",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                break;

                                            // Unprocessed
                                            case 4:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Channel_4",
                                                        "seriesType": "Float",
                                                        "seriesID": "4",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                break;

                                            case 5:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Channel_5",
                                                        "seriesType": "Float",
                                                        "seriesID": "5",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                break;
                                        }
                                        jsonData.AnIML.ExperimentStepSet.ExperimentStep[filter_index + 1].Result.SeriesSet[seriesSetCount].Series.push(XMLatts);

                                        // Add Data Points to appropriate XMLatts
                                        channel.get('trace').forEach(point => {

                                            if (!channel_index) {
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[filter_index + 1].Result.SeriesSet[seriesSetCount].Series[channel_index].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": point.get('x')
                                                    }
                                                );
                                            }

                                            if (channel_index == 0 || channel_index == 1) {
                                                // Convert Processed ADC to Absorbance
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[filter_index + 1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": convertProcessedADCtoAbsorbance(point.get('y'), avgProcessedReferenceChannel, filter.get('name'), currentProperty)  // Math.log10(avgReferenceChannel[channel_index] / point.get('y'))
                                                    }
                                                );
                                            } else if (channel_index == 2 || channel_index == 3) {
                                                // Convert Processed ADC to Pressure
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[filter_index + 1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": convertADCtoPressure(point.get('y'), MAX_VALUE)
                                                    }
                                                );
                                            } else if (channel_index == 4 || channel_index == 5) {
                                                // Remaining Two Channels
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1].IndividualValueSet.Float32.push(
                                                    {
                                                        // "_text": convertADCtoPressure(point.get('y'), MAX_VALUE)
                                                        "_text": point.get('y')
                                                    }
                                                );
                                            }

                                        });
                                    }
                                });
                            }
                        });
                    } else if (Absorbance && !Pressure) {
                        let seriesSetCount = 0;
                        that.appliedFilters.get('filters').forEach((filter, filter_index) => {
                            jsonData.AnIML.ExperimentStepSet.ExperimentStep.push(
                                {
                                    "_comment": " Filter: " + filter.get('name') + " --" + (Absorbance ? " Converted the Processed Raw ADC to Absorbance" : " Processed Raw Absorbance ADC") + ' and ' + (Pressure ? "Converted the Processed Raw ADC to Pressure " : "Processed Raw Pressure ADC "),
                                    "Technique": {
                                        "_attributes": {
                                            "name": "Liquid Chromatography",
                                            "uri": "http://techniques.animl.org/current/chromatography-technique.atdd"
                                        }
                                    },
                                    "Result": {
                                        "_attributes": {
                                            "id": that.appliedFiltersDateTime,
                                            "_comment": " avgProcessedReferenceChannelData contains averages of the Filter's input/output data along with value and annotation data ",

                                        },
                                        "SeriesSet": [
                                            {
                                                "_comment": " Filter: " + filter.get('name') + " ",
                                                "Series": [

                                                ]
                                            }
                                        ]
                                    }
                                }
                            );
                            jsonData.AnIML.ExperimentStepSet.ExperimentStep[filter_index + 1].Result._attributes['avgProcessedReferenceChannelData'] = avgProcessedReferenceChannel;

                            // console.log('filter', filter);                    
                            if (filter.get('annotations').length) {
                                // Add to SeriesSet
                                console.log('annotations');
                                // Add to SeriesSet & SeriesSetCount
                            }
                            if (filter.get('values').length) {
                                // Add to SeriesSet
                                console.log('values');
                                // Add to SeriesSet & SeriesSetCount
                            }
                            if (filter.get('inputs') == filter.get('outputs')) {
                                console.log('inputs = outputs filter');
                            } else {
                                let currentProperty = 'outputs';
                                filter.get(currentProperty).forEach((channel, channel_index) => {

                                    // Check if channel has any data
                                    if (channel.get('trace').length) {
                                        var XMLatts = {};
                                        switch (channel_index) {
                                            case 0:
                                                XMLatts = {
                                                    "_comment": [
                                                        " The Time Data "
                                                    ],
                                                    "_attributes": {
                                                        "name": "Time",
                                                        "seriesType": "Float",
                                                        "seriesID": "t",
                                                        "dependency": "independent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "sec",
                                                            "quantity": "Time"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[filter_index + 1].Result.SeriesSet[seriesSetCount].Series.push(XMLatts);

                                                XMLatts = {
                                                    "_comment": [
                                                        " The Processed Channel Data "
                                                    ],
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "0",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Absorbance",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                            case 1:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "1",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Absorbance",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                break;
                                            case 2:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "2",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Pressure",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                break;

                                            case 3:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "3",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Pressure",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                break;

                                            // Unprocessed
                                            case 4:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Channel_4",
                                                        "seriesType": "Float",
                                                        "seriesID": "4",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                break;

                                            case 5:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Channel_5",
                                                        "seriesType": "Float",
                                                        "seriesID": "5",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                break;
                                            case 6:    
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Channel_6",
                                                        "seriesType": "Float",
                                                        "seriesID": "6",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                break;

                                            case 7:    
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Channel_7",
                                                        "seriesType": "Float",
                                                        "seriesID": "6",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                break;
                                        }
                                        jsonData.AnIML.ExperimentStepSet.ExperimentStep[filter_index + 1].Result.SeriesSet[seriesSetCount].Series.push(XMLatts);

                                        // Add Data Points to appropriate XMLatts
                                        channel.get('trace').forEach(point => {

                                            if (!channel_index) {
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[filter_index + 1].Result.SeriesSet[seriesSetCount].Series[channel_index].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": point.get('x')
                                                    }
                                                );
                                            }

                                            if (channel_index == 0 || channel_index == 1) {
                                                // Convert Processed ADC to Absorbance
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[filter_index + 1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": convertProcessedADCtoAbsorbance(point.get('y'), avgProcessedReferenceChannel, filter.get('name'), currentProperty)  // Math.log10(avgReferenceChannel[channel_index] / point.get('y'))
                                                    }
                                                );
                                            } else if (channel_index == 2 || channel_index == 3) {
                                                // ADC Pressure
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[filter_index + 1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": point.get('y')
                                                    }
                                                );
                                            } else if (channel_index == 4 || channel_index == 5) {
                                                // Remaining Two Channels
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1].IndividualValueSet.Float32.push(
                                                    {
                                                        // "_text": convertADCtoPressure(point.get('y'), MAX_VALUE)
                                                        "_text": point.get('y')
                                                    }
                                                );
                                            }

                                        });
                                    }
                                });
                            }
                        });
                    } else if (!Absorbance && Pressure) {
                        console.log('!Absorbance && Pressure');
                        let seriesSetCount = 0;
                        that.appliedFilters.get('filters').forEach((filter, filter_index) => {
                            jsonData.AnIML.ExperimentStepSet.ExperimentStep.push(
                                {
                                    "_comment": " Filter: " + filter.get('name') + " --" + (Absorbance ? " Converted the Processed Raw ADC to Absorbance" : " Processed Raw Absorbance ADC") + ' and ' + (Pressure ? "Converted the Processed Raw ADC to Pressure " : "Processed Raw Pressure ADC "),
                                    "Technique": {
                                        "_attributes": {
                                            "name": "Liquid Chromatography",
                                            "uri": "http://techniques.animl.org/current/chromatography-technique.atdd"
                                        }
                                    },
                                    "Result": {
                                        "_attributes": {
                                            "id": that.appliedFiltersDateTime,
                                            "_comment": " avgProcessedReferenceChannelData contains averages of the Filter's input/output data along with value and annotation data ",

                                        },
                                        "SeriesSet": [
                                            {
                                                "_comment": " Filter: " + filter.get('name') + " ",
                                                "Series": [

                                                ]
                                            }
                                        ]
                                    }
                                }
                            );
                            jsonData.AnIML.ExperimentStepSet.ExperimentStep[filter_index + 1].Result._attributes['avgProcessedReferenceChannelData'] = avgProcessedReferenceChannel;

                            // console.log('filter', filter);                    
                            if (filter.get('annotations').length) {
                                // Add to SeriesSet
                                console.log('annotations');
                                // Add to SeriesSet & SeriesSetCount
                            }
                            if (filter.get('values').length) {
                                // Add to SeriesSet
                                console.log('values');
                                // Add to SeriesSet & SeriesSetCount
                            }
                            if (filter.get('inputs') == filter.get('outputs')) {
                                console.log('inputs = outputs filter');
                            } else {
                                let currentProperty = 'outputs';
                                filter.get(currentProperty).forEach((channel, channel_index) => {

                                    // Check if channel has any data
                                    if (channel.get('trace').length) {
                                        var XMLatts = {};
                                        switch (channel_index) {
                                            case 0:
                                                XMLatts = {
                                                    "_comment": [
                                                        " The Time Data "
                                                    ],
                                                    "_attributes": {
                                                        "name": "Time",
                                                        "seriesType": "Float",
                                                        "seriesID": "t",
                                                        "dependency": "independent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "sec",
                                                            "quantity": "Time"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[filter_index + 1].Result.SeriesSet[seriesSetCount].Series.push(XMLatts);

                                                XMLatts = {
                                                    "_comment": [
                                                        " The Processed Channel Data "
                                                    ],
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "0",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Absorbance",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                            case 1:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "1",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Absorbance",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                break;
                                            case 2:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "2",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Pressure",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                break;

                                            case 3:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "3",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Pressure",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                break;

                                            // Unprocessed
                                            case 4:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Channel_4",
                                                        "seriesType": "Float",
                                                        "seriesID": "4",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                break;

                                            case 5:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Channel_5",
                                                        "seriesType": "Float",
                                                        "seriesID": "5",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                break;
                                        }
                                        jsonData.AnIML.ExperimentStepSet.ExperimentStep[filter_index + 1].Result.SeriesSet[seriesSetCount].Series.push(XMLatts);

                                        // Add Data Points to appropriate XMLatts
                                        channel.get('trace').forEach(point => {

                                            if (!channel_index) {
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[filter_index + 1].Result.SeriesSet[seriesSetCount].Series[channel_index].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": point.get('x')
                                                    }
                                                );
                                            }

                                            if (channel_index == 0 || channel_index == 1) {
                                                // ADC Absorbance
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[filter_index + 1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": point.get('y') // Math.log10(avgReferenceChannel[channel_index] / point.get('y'))
                                                    }
                                                );
                                            } else if (channel_index == 2 || channel_index == 3) {
                                                // Convert Processed ADC to Pressure
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[filter_index + 1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": convertADCtoPressure(point.get('y'), MAX_VALUE)
                                                    }
                                                );
                                            } else if (channel_index == 4 || channel_index == 5) {
                                                // Remaining Two Channels
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1].IndividualValueSet.Float32.push(
                                                    {
                                                        // "_text": convertADCtoPressure(point.get('y'), MAX_VALUE)
                                                        "_text": point.get('y')
                                                    }
                                                );
                                            }

                                        });
                                    }
                                });
                            }
                        });
                    } else if (!Absorbance && !Pressure) {
                        console.log('!Absorbance && !Pressure');
                        let seriesSetCount = 0;
                        that.appliedFilters.get('filters').forEach((filter, filter_index) => {
                            console.log('filter', filter.get('name'));
                            jsonData.AnIML.ExperimentStepSet.ExperimentStep.push(
                                {
                                    "_comment": " Filter: " + filter.get('name') + " --" + (Absorbance ? " Converted the Processed Raw ADC to Absorbance" : " Processed Raw Absorbance ADC") + ' and ' + (Pressure ? "Converted the Processed Raw ADC to Pressure " : "Processed Raw Pressure ADC "),
                                    "Technique": {
                                        "_attributes": {
                                            "name": "Liquid Chromatography",
                                            "uri": "http://techniques.animl.org/current/chromatography-technique.atdd"
                                        }
                                    },
                                    "Result": {
                                        "_attributes": {
                                            "id": that.appliedFiltersDateTime,
                                            "_comment": " avgProcessedReferenceChannelData contains averages of the Filter's input/output data along with value and annotation data ",

                                        },
                                        "SeriesSet": [
                                            {
                                                "_comment": " Filter: " + filter.get('name') + " ",
                                                "Series": [

                                                ]
                                            }
                                        ]
                                    }
                                }
                            );
                            jsonData.AnIML.ExperimentStepSet.ExperimentStep[filter_index + 1].Result._attributes['avgProcessedReferenceChannelData'] = avgProcessedReferenceChannel;

                            // console.log('filter', filter);                    
                            if (filter.get('annotations').length) {
                                // Add to SeriesSet
                                console.log('annotations');
                                // Add to SeriesSet & SeriesSetCount
                            }
                            if (filter.get('values').length) {
                                // Add to SeriesSet
                                console.log('values');
                                // Add to SeriesSet & SeriesSetCount
                            }
                            if (filter.get('inputs') == filter.get('outputs')) {
                                console.log('inputs = outputs filter');
                            } else {
                                let currentProperty = 'outputs';
                                filter.get(currentProperty).forEach((channel, channel_index) => {

                                    // Check if channel has any data
                                    if (channel.get('trace').length) {
                                        var XMLatts = {};
                                        switch (channel_index) {
                                            case 0:
                                                XMLatts = {
                                                    "_comment": [
                                                        " The Time Data "
                                                    ],
                                                    "_attributes": {
                                                        "name": "Time",
                                                        "seriesType": "Float",
                                                        "seriesID": "t",
                                                        "dependency": "independent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "sec",
                                                            "quantity": "Time"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[filter_index + 1].Result.SeriesSet[seriesSetCount].Series.push(XMLatts);

                                                XMLatts = {
                                                    "_comment": [
                                                        " The Processed Channel Data "
                                                    ],
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "0",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Absorbance",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                };
                                                break;
                                            case 1:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "1",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Absorbance",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                break;
                                            case 2:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "2",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Pressure",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                break;

                                            case 3:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Processed_Channel_" + channel_index,
                                                        "seriesType": "Float",
                                                        "seriesID": "3",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "Pressure",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                break;

                                            case 4:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Channel_4",
                                                        "seriesType": "Float",
                                                        "seriesID": "4",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                break;

                                            case 5:
                                                XMLatts = {
                                                    "_attributes": {
                                                        "name": "Channel_5",
                                                        "seriesType": "Float",
                                                        "seriesID": "5",
                                                        "dependency": "dependent"
                                                    },
                                                    "Unit": {
                                                        "_attributes": {
                                                            "label": "//!@#$%^&*()_ ToDo:",
                                                            "quantity": "Raw ADC"
                                                        }
                                                    },
                                                    "IndividualValueSet": {
                                                        "Float32": []
                                                    }
                                                }
                                                break;
                                        }
                                        jsonData.AnIML.ExperimentStepSet.ExperimentStep[filter_index + 1].Result.SeriesSet[seriesSetCount].Series.push(XMLatts);

                                        // Add Data Points to appropriate XMLatts
                                        channel.get('trace').forEach(point => {

                                            if (!channel_index) {
                                                jsonData.AnIML.ExperimentStepSet.ExperimentStep[filter_index + 1].Result.SeriesSet[seriesSetCount].Series[channel_index].IndividualValueSet.Float32.push(
                                                    {
                                                        "_text": point.get('x')
                                                    }
                                                );
                                            }

                                            jsonData.AnIML.ExperimentStepSet.ExperimentStep[filter_index + 1].Result.SeriesSet[seriesSetCount].Series[channel_index + 1].IndividualValueSet.Float32.push(
                                                {
                                                    "_text": point.get('y')
                                                }
                                            );
                                        });
                                    }
                                });
                            }
                        });
                    }

                    if (Download) {
                        var filename = that.get('model.path') + '.xml';
                        var toXML = XMLConverter.js2xml(jsonData, { compact: true, spaces: 4 });
                        utils.Download(filename, toXML);
                    } else {
                        console.log('jsonData\n', jsonData);
                    }
                }
            }
        }

        if (exportType.Processed && this.appliedFilters) {
            console.log('Downloading Processed: Nothing is Happening Yet');
            exportProcessedData(exportType.CSV, exportType.XML, exportType.ConvertAbsorbance, exportType.ConvertPressure, this, downloadFiles, this.appliedFiltersAsStack);
        } else if (exportType.Processed && !this.appliedFilters) {
            alert('No data has been processed. Please process data before continuing.');
        } else if (exportType.Raw) {
            console.log('Downloading Raw: Nothing is Happening Yet');
            exportRawData(exportType.CSV, exportType.XML, exportType.ConvertAbsorbance, exportType.ConvertPressure, this, downloadFiles, this.appliedFiltersAsStack);
        }

        if (exportType.Screen) {
            console.log('Downloading Screenshot');
            this.$.DataViewer.downloadPlot();
        }

        return true;
    },
    saveReport: async function () {
        /**
         * function: saveReport
         * 
         * This grabs the selected checkboxes from the 
         * model.reportExportType and exports the data
         * as a PDF
         */
        var channels = this.get('model.channels');
        var reportExportType = this.get('model.reportExportType');

        /*if (reportExportType.Raw) {
            console.log('Exporting Raw Report: Nothing is Happening Yet');
        }
        if (reportExportType.FilterStack) {
            console.log('Exporting Filter Stack Report: Nothing is Happening Yet');
        }
        if (reportExportType.XML) {
            console.log('Exporting XML Report: Nothing is Happening Yet');
        }*/
        if (reportExportType.PDF) {
            //console.log('Exporting PDF Report: Needs Touching Up');


            // ToDo: Change when capability to make multiple plot selections has been enabled //!@#$%^&*()
            var selectedPlots = {};

            let hiddenMainPlot = document.createElement('DIV');
            document.body.appendChild(hiddenMainPlot);
            let hiddenMainPlotID = 'graphycopy';
            hiddenMainPlot.setAttribute('id', hiddenMainPlotID);
            // ToDo: Remove this once capable of multiple selections //!@#$%^&*()
            //hiddenMainPlot.setAttribute('style', 'display:none'); // ---------->>>

            // let plotconfigs = deepClone.getClone(this.$.DataViewer.getPlotConfig());
            let plotconfigs = this.$.DataViewer.getPlotConfig();
            let main_plot_original_layout_config = deepClone.getClone(plotconfigs.layout_config); //JSON.parse(JSON.stringify(plotconfigs.layout_config))
            let main_plot_original_data_config = deepClone.getClone(plotconfigs.data_config);//[];
            // plotconfigs.data_config.forEach(function (trace) {
            //     main_plot_original_data_config.push(JSON.parse(JSON.stringify(trace)));
            // });

            // console.log('id', plotconfigs.id);
            // COPYING WORKS, BUT THEN IT BECOMES A CSS/HTML ISSUE RATHER THAN JAVASCRIPT
            // let copy = document.getElementById(plotconfigs.id).lastChild.cloneNode(true);
            // hiddenMainPlot.appendChild(copy);
            // console.log('aa', hiddenMainPlot.data);


            // console.log('plotC', plotconfigs);
            // console.log('main_plot_original_data_config', main_plot_original_data_config);
            // console.log('main_plot_original_layout_config', main_plot_original_layout_config);

            let main_plot_original_global_config = deepClone.getClone(plotconfigs.global_config);
            // console.log('main_plot_original_data_config[4]', main_plot_original_data_config[4]);
            // Plotly.newPlot(hiddenMainPlot, plotconfigs.data_config, plotconfigs.layout_config, plotconfigs.global_config);
            // console.log('main_plot_original_data_config[main_plot_original_data_config.length - 1]', delete main_plot_original_data_config[main_plot_original_data_config.length - 1].yaxis);

            // Plotly.plot(hiddenMainPlot, [main_plot_original_data_config[0], main_plot_original_data_config[main_plot_original_data_config.length - 1]], main_plot_original_layout_config, main_plot_original_global_config);
            // console.log('main_plot_original_global_config', main_plot_original_global_config);
            // let method = main_plot_original_data_config.splice(4, 1);
            // console.log('method', method);
            // console.log(' main_plot_original_data_config', main_plot_original_data_config);
            //Plotly.newPlot(hiddenMainPlot, plotconfigs.data_config, plotconfigs.layout_config, plotconfigs.global_config);
             Plotly.plot(hiddenMainPlot, main_plot_original_data_config, main_plot_original_layout_config, main_plot_original_global_config);
            // Plotly.addTraces(hiddenMainPlot, main_plot_original_data_config[4]);

            // Plotly.newPlot(hiddenMainPlot, main_plot_original_data_config, main_plot_original_layout_config, main_plot_original_global_config);
            // Plotly.newPlot(hiddenMainPlotID, main_plot_original_data_config, main_plot_original_layout_config, main_plot_original_global_config);
            // Plotly.plot(hiddenMainPlotID, main_plot_original_data_config, main_plot_original_layout_config, main_plot_original_global_config);

            // var main_plot_id = plotconfigs.id;
            var main_plot_id = hiddenMainPlotID;
            var graphDiv = document.getElementById(main_plot_id);
            //let MAX_Id = 5;
            //var externalDataRetrievedFromServer = [];
            var dataFromChannel1 = [];
            var dataFromChannel2 = [];
            var filterData = this.$.DataViewer.data_config[5];
            /*try{
                if (filterData === undefined){
                    filterData = { "type": "scatter", "mode": "lines+markers", "marker": { "opacity": 0 }, "line": { "width": 2, "dash": "", "color": "" }, "name": "", "uid": "b97712", "x": [0], "y": [0], "a":[0] };
                }
            }catch(e){ 
                document.getElementById('application_panels_DataPanel_DataManager_DataControl_FilterControl_control8_IdBox').click();
                document.getElementById('application_panels_DataPanel_DataManager_DataControl_FilterControl_ApplyButton').click();
                setTimeout(function(){
                    //console.log('filter data', filterData);
                }, 3000); 

                var filterData = this.$.DataViewer.data_config[5];
            }*/
            document.getElementById('application_panels_DataPanel_DataManager_DataControl_FilterControl_ApplyButton').click();
           // preparation for percent calculation
            var objch1 = [];
            var objch2 = [];
            console.log(filterData);
            for (let i = 0; i < filterData.x.length; i++){
                if (filterData.c[i] == 1){
                    let idx1 = i;
                    objch1.push(filterData.a[idx1]);
                } else if (filterData.c[i] == 2){
                    let idx2 = i;
                    objch2.push(filterData.a[idx2]);
                }
            }
            // assembling data for report table
            for (let i = 0; i < filterData.x.length; i++) {
            if (filterData.mode == 'markers+text'){
             if (filterData.x.length){
                if (filterData.c[i] == 1){
                    let idx = i;
                    var sum = objch1.reduce(function(a, b) { return a + b; }, 0);
                    dataFromChannel1.push({
                    'Ret. Time': filterData.x[idx].toLocaleString(undefined, { maximumFractionDigits: 4}),
                    'Pk. Height': filterData.y2[idx].toLocaleString(undefined, { maximumFractionDigits: 4}),
                    'Pk. Area': filterData.a[idx],
                     '%': (filterData.a[idx] / sum * 100).toLocaleString(undefined, { maximumFractionDigits: 2}),
                    });
                } else if (filterData.c[i] == 2){
                    let idx = i;
                    var sum = objch2.reduce(function(a, b) { return a + b; }, 0);
                    dataFromChannel2.push({
                    'Ret. Time': filterData.x[idx].toLocaleString(undefined, { maximumFractionDigits: 4}),
                    'Pk. Height': filterData.y2[idx].toLocaleString(undefined, { maximumFractionDigits: 4}),
                    'Pk. Area': filterData.a[idx],
                    '%': (filterData.a[idx] / sum * 100).toLocaleString(undefined, { maximumFractionDigits: 2}),
                    });
                }
            } else {
                dataFromChannel1.push({
                    'Ret. Time': 0,
                    'Pk. Height': 0,
                    'Pk. Area': 0,
                    });
                dataFromChannel2.push({
                        'Ret. Time': 0,
                        'Pk. Height': 0,
                        'Pk. Area': 0,
                        });
            }
            } else if (filterData.mode == 'lines+markers'){  

                dataFromChannel1.push({
                    'Ret. Time': 0,
                    'Pk. Height': 0,
                    'Pk. Area': 0,
                    });
                dataFromChannel2.push({
                        'Ret. Time': 0,
                        'Pk. Height': 0,
                        'Pk. Area': 0,
                        });
                }
            } 
            //console.log(duplicateRemoved);
            // ToDo: The User should be able to select the column they want the maxes highlighted
            const MAX_COLUMN_NAME = "Pk. Height";
            let MAX_HIGHLIGHTS = filterData.y.length / 2;
            let mergeSortByObjectProperty = function (data, object_property_column_name) {
                /*
                 *  This is an object variation of the Merge Sort Algorithm.
                */
                // Split arrays in half recursively
                let mergeSort = function (arr) {
                    if (arr.length < 2) { return arr; }

                    let middle = Math.floor(arr.length / 2);
                    let left = arr.slice(0, middle);
                    let right = arr.slice(middle);

                    return merge(mergeSort(left), mergeSort(right));
                };
                // Compare and return cocatenation of results
                let merge = function (left, right) {
                    var result = [];
                    let indexLeft = 0;
                    let indexRight = 0;

                    while (indexLeft < left.length && indexRight < right.length) {
                        if (left[indexLeft][object_property_column_name] <= right[indexRight][object_property_column_name]) {
                            result.push(left[indexLeft]);
                            indexLeft++;
                        } else {
                            result.push(right[indexRight]);
                            indexRight++;
                        }
                    }
                    return result.concat(left.slice(indexLeft)).concat(right.slice(indexRight));
                };

                // Remove id:'Total' from data -> This is always stored at the end of the data array
                let g = mergeSort(data.slice(0, data.length - 1));
                // If MAX_HIGHLIGHTS is longer than the data, it will select all points
                (MAX_HIGHLIGHTS > g.length) ? MAX_HIGHLIGHTS = g.length : ''
                return g.slice(g.length - MAX_HIGHLIGHTS, g.length);
            };

           /* externalDataRetrievedFromServer.push({
                id: 'Total',
                'Ret. Time': Math.floor(Math.random() * 60) + 1,
                'Pk. Response': Math.floor(Math.random() * 60) + 1,
                'Pk. Height': 45.9,
                'Pk. Area': Math.floor(Math.random() * 60) + 1,
                'Pk. Type': Math.floor(Math.random() * 60) + 1,
                'Chemical Name': Math.floor(Math.random() * 60) + 1,
            });*/
            let buildTableBody = function (data, columns) {
                //console.log('the data is ', data);
                //console.log('The columns are', columns);
                let body = [],
                    cc = [];
                columns.forEach(function (column) {
                    cc.push({ text: column.toString(), alignment: 'center' });
                });

                body.push(cc);
                let inverter = false;
                let organizedByColumn = mergeSortByObjectProperty(data, MAX_COLUMN_NAME);
                data.forEach(function (row) {
                    var dataRow = [];
                    columns.forEach(function (column) {
                        dataRow.push(
                            (row[column]) ?
                                ((organizedByColumn.indexOf(row) >= 0) ?
                                    { text: row[column].toString(), alignment: 'center', fillColor: '#D8D9DA' }
                                    : { text: row[column].toString(), alignment: 'center' })
                                : '');
                    }); 
                    dataRow.forEach( function (element){
                            element.fillColor = inverter ? '#D8D9DA' : undefined;
                    });
                    inverter = !inverter;
                    body.push(dataRow);
                });

                return body;
            };
            
            let table = function (data, columns) { 
                return {
                    width: 'auto',
                    layout: 'lightHorizontalLines',
                    unbreakable: true,
                    table: {
                        headerRows: 1,
                        body: buildTableBody(data, columns),
                        dontBreakRows: true,
                        keepWithHeaderRows: true,
                    },
                };
            };

            let table2 = function (data, columns) {
                return {
                    width: 'auto',
                    layout: 'lightHorizontalLines',
                    unbreakable: true,
                    table: {
                        headerRows: 1,
                        body: buildTableBody(data, columns),
                        dontBreakRows: true,
                        keepWithHeaderRows: true,
                    },
                };
            };
            if (!dataFromChannel1.length){
                dataFromChannel1.push({
                    'Ret. Time': 0,
                    'Pk. Height': 0,
                    'Pk. Area': 0,
                    });
            } else if(!dataFromChannel2.length){
                dataFromChannel2.push({
                    'Ret. Time': 0,
                    'Pk. Height': 0,
                    'Pk. Area': 0,
                    });
            }
            var dd = {
                content: [
                    { text: '\nPeak Table', style: ['sectionTitle'], alignment: 'center', margin: [0, -5, 0, 5] },
                    { text: '\nChannel 1                                                               Channel 2', alignment: 'center', margin: [0, -5, 0, 5] },
                    {
                        columns: [
                            { width: '*', text: '' },
                            table(dataFromChannel1, Object.keys(dataFromChannel1[0])),
                            { width: '*', text: ''},
                            table2(dataFromChannel2, Object.keys(dataFromChannel2[0])),
                            { width: '*', text: '' },
                        ]
                    },
                ],
                alignment: 'center',
            }
          
            //This 6 line chunk is responsible for getting the selected filter names and putting them in appliedFiltersForPDF.
            var appliedFiltersForPDF = [];
            try {
                this.get('model.applyFilters').selectedAndOrderedFilters.forEach(function(tempvar) {appliedFiltersForPDF.push(tempvar.previous.name)});
                appliedFiltersForPDF = appliedFiltersForPDF.join(', ')
                if (appliedFiltersForPDF.length == 0) {
                    appliedFiltersForPDF = 'No Filters Applied';
                }
            }
            catch(e){
                appliedFiltersForPDF = 'No Filters Applied';
            }

            //This chunck of code gets the value of solvent B on the test screen
            let solventB = this.parent.parent.parent.parent.parent.$.TestPanel.$.SolventButton.$.select.value;
            for (let i = 0; i < this.parent.parent.parent.parent.parent.$.TestPanel.$.SolventButton.$.select.children.length; i++) {
                 if (solventB == this.parent.parent.parent.parent.parent.$.TestPanel.$.SolventButton.$.select.children[i].value){
                     solventB = this.parent.parent.parent.parent.parent.$.TestPanel.$.SolventButton.$.select.children[i].content;
                     break;
                 }
            }
            //console.log(this);
            var filename = this.get('model.path');
            var docDefinition = {
                footer: function (currentPage, pageCount) { return { text: currentPage.toString() + ' of ' + pageCount, alignment: 'center' } },
                header: function (currentPage, pageCount) {
                    return [{
                        columns: [
                            //{ text: 'Report #' + Math.floor(Math.random() * 1000), color: 'black', alignment: 'left' },
                           // { text: 'Page ' + currentPage.toString() + ' of ' + pageCount, color: 'black', alignment: 'right' }, // (currentPage % 2) ? 'left' : 'righ  t'
                        ], margin: [40, 15, 40, 0]
                    }]
                },
                content: [
                    {
                        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARcAAABjCAYAAACxF0S3AAAgAElEQVR4Xu2dCZgcV3Xvz+0ZLbaxHQLGgYQAeSZ4AQIYeC9hGzDWdI813TIgQ8xOEkNYErb3WANie/DYH/sWEggPgwVIM2N198gYy/DYMYSwGQKBsBmDAS9gJGvUle/XU/+eqzvV3VXV3bNIVfr0zUx31a17zz33f89+nRXXEU2Bicsmxvc9cN/C1Fz5uVYqNevn1P91+0Xbx3aet/NQzoGPmRnP3sfM7mFmbzazcTNbyNle8dgRSgF3hI6rGJaZCVgqs5UHOYsuNbMv1KvN/94mTmTOnEUZCQW/8EzJzL5pZncyszPN7MsFwGSk5FFwewEuR+gk79ixo7Rjx47W9Nz0LReig1c6s1vEQ31Dvdp8poAn4/AlofyjmT0hfvY/zex0M7sxBp1WxjaL249QChTgciRObGRux0t2OMBlarY8b2ZbzOygmaHSlFxktT215uyZ7zxzwxVPvILP01wb4jYeY2bvi1UjgITPP2xmj4jbz6tupelDcc86okABLutostJ2VaBxzmzlBZFFL49BARAADFBprh+PDp02W7vkpyntL7Kz3NHMvhEDitrC1oJE82Qze3v8XVrASjuk4r51SIECXNbhpPXqstSdcy6evF/Ucp+MbSQ8orleBIPIPlWvNe/ftr0sftvN/iI7C3d9xczuFhtvARQunlPbf2Zm/1bYX44wpso5nAJcchJuLT4mO0ulXjnBFqJvObPbxOoLkod/IVlsiCx6RaM6/8I+6pHsLG8xs6d4UpDfHqoQ7/i2md05Bh8flNYiuYo+jZgCBbiMmMAr2XwHXObKMy6yahcgkLTR9vq4kpX3bG3OdzHwys6y3cwu6gJUGmIbsGJ7zOMK+8tKzvzafFcBLmtzXjL3StLH1Gz5GWb2+kB1SWqvbTOJzH65eeHgnXY95NJfCpzim2Vn+WMz+5aZHevZbLr1T/YXwAWjr8Ap83iKB9Y/BQpwWRtziJGVK5cbV1LH1rnJe7ci9/m4Ld8W0gcM3CX1amOLZ3+RdMPPz5rZ/0gBVnoGngJkUI9QkwRSmSkN2PEQXq/MDxcPrDoFCnBZ9Sloe2+0ePzfU/VM0sbEZRObj71hM4Ftd+ijvoTtttUZZ+6Fe6qNV1zwpQs2vOue76I/2FFeY2bP7qFeJfVR0guGXQy8XJntL74UFUhUqehS3LT6FCjAZXXnQMbSx8e7/Gey7vRyJU/NTn7IzD08IxD4EoqzqPSAeq2Oh4lLdha5nLNQSvYXXNO4qDOlB0gSK8+Vp5y54xvTjQ/nDPrL0ufi3iFToACXIRM0Q3NSF06LQ+m/Y2b8zmJOtdN7dpYnmtk7+qguSCK0KxXM7+qit6dkV/36O9fd+bPP/OyvzOz9ZvZoM7vJzDYmjIt+onqFnijdKg/SX5rZh9LaX3yPl1uIvmdmN4/G3e0bU40fp4zJyTAFxa2jpEABLqOkbve2/Rwd1Icz4lsJq//rNDt9Z3efKd+15Oyr8fNJdhY+Uz4Qt0ltWa4elWzD2HEb5uYeOFe1k+04u7ods/InCWqW34bAMOQlSTykBTC+H6SRygQuU7PlWTObjjv5uXq1+eft3/PlRK3OLB/lby3AZXUYQGrCe8zsr2JVBokCKeCxsdTQ3dMSLzB28t9uvoGIWRIIJSn4I+qoNM6510VR9AAzu2cP1WnBxmx84zEbn7P7QbOvNjMWNKra4rJelHyk8nzNzD5nZn8Tf+cDmPogEPqimd07/rCrVOZFFj89sugNMRDS7gZz7tX16cZzCvVodRg2z1sLcMlDtcGeEWicb2b/zwMFAQGLF08LalKip6VTRmG28l6zCHuNFvxyVYdPXPTU+vT8WycumrjZsZs2183Z/bo80waQ0saSjTl3n5nJPQDLM83sdQEAXmZm55rZdWb2HDN7VfziJIBT33CPP6ubVLYUWbzlzKhV+lIAaDFtWtP16t6LM+ZEDTZbxdO5KVCAS27S5XpQYHFKnKODLcM3mGqn/1czu3vSTt/Z3WfKj42c/XMXicVTW6Jt9er8zPaLtm/ced5O7Cc2NVsm0fC8+FkkJp8P2gCx4bixH1x35W/vsu8p+35jZh81s4fE/XmrmT01/l1A+Ugz+0D8WZLapTFuM7OZ0P4iVYg+3rj5hm9EZtDHB6r4+eja8Wjh1NnapVcX9pdc/LeiDxXgsnLk9tWBK+JCS0kLUTv92+Jw+46npeMZ2jP1p3aohVoCOIV2Fj1/vbVKW+rb6p8XIPkLcmq2jCRBwF1ok4EiB61kGzbdbONHdk3Mbreb24n267YK9C4zQ13hkttcAPNAM6ub2eYEu04nYdLMTjWzq3ypbMnjVZYROUkSa9MqMtvXqDYfmCInauVmtnhTIgUKcFk5xhBIvMnMntbHZaxdmzIGSBkkGh5ScuHUbBnJhhiSEJy0KH8wZq0HzVX3fj9UIdpSwot3YLWJKjOTz3LOvbaLStO2v2w4ZsNTZh4097aTt5x83NV7r/6tJ+X4iY4CGAy3HzezP0gYn/qKqxvbT5v3Ji6bGFuslDf5eIvce/t4vBbHF9lL6rXmjkI9WjnmzfOmAlzyUC37M1p8qBaoGKFtIvS4aKdnMd+L8Pszdpyx8Rs7vnHT1Ez5LeYSEwgFLF+4af/Clo+f9/Hrui6+yNz2ndtLlLo8Z6b8iMjZhQkqzaJE1FaaSnenPKb60GX4GuOtzOwTsYcolED09/82sxeccsopm7773e8eKC96vL5gZpsCSSyUqgRoruXswc3p5qWFgTc7M67UEwW4jJ7SsrPcNrazHB/YWXyg8X8/EC82BaLZ5K7J88bGHJKMfx8Ljr/HI2ezja3NbUglaRZdJ05mZur+5lpNMzsmkDja7yltKH37qh9efZd2YanermBJZ4AEKtKDEsozQHH4jgJWl7RtQDPlD5oz4mH8mJpudBHw/sKVxu60Z+ueXxcRvKNn4jxvKMAlD9XSP+PbWf5/XNTaV2X0+5Vm9odmBvB0KsaZ2c/tGLuH/c5+MnHhxO2PPa4d3g8AaIEtpQ1E7h31WuNv6VoWY6cAZnpuy6kLUenSuEyDL3EslmcYt/c1ppqPS9G2H437L2b2qMBwrL5fE0s3Py/PlO805uxLkdnN4rEBLEhCv7LIrjFnfxqAVEy3qFGvzk8V4JKeIVfyzgJcRkttLbRXmtlzPamgI23Eu3c5dj/vjnODtLjPiSUAu/dHzvzcLTeeRHFtAdKSl8nZP9Snm1ScI8mvXTs3y7AEMJV65SS3EGEzuWsgwSy+00VPqE/P/1MKW4fvQsdNjbvaV3E0BiQXJBg752Pl7ZGzi2xMbnX37zbmtkYu+k93MLokwX2+SCNnz6tPN1+Vok9ZSFLcOwQKFOAyBCL2sUFUYoAQGLDI+J0FiCuZOBVdqBOUKiBHCEPr/+SLe3347q89fsOJz9o8vlmgs6QyxAu+LVFs39nKUdG//W6pUSzSk2990sXxogcEFN7fDqBrRXaXZq357RQSjJ/pjQEbQzaX+q6xvNDMXsEXW+uVN7da0VOtZRcet//4x8l13ladlnKneF5tt/nXtVr32bNt72fSqIKjm+6i5ZACBbiMhifkpj3JzFB5fj/IfOatLCgWFpdiTVTc+lEn/vGJe6774XW/3jpXmW4tRLM21lGFtOsvuJJt7RR6mtjX8SblHZIPGJW58j+7qB0trMW8CIjOvlafbiLZpAnFh78AJ/osYzZPagxyo0+Y2eX3fdt9b37zU07YOreljjrVVu/O+OYZkSSxBPf5Iu0i+/G4bTx9tjZ7Qx7JLS+9iud6U6AAl+FziGjKwuGsIBk1tdB4I7YREg3DOi78LfXBqjNn32ZhfOybdshO9G0RFHgac9FZF0/Pf3XY6oC/OCuzky935l4Qk0hlGDY4i96+pzr/5AySgjxJpBPstUXbim9b+klsfyHitw1aOr2AP3u4z+kT/8ejyHY1as2HFOAyfIbO22IBLnkp1/05LaR/MLOXeicRYn8BOIhSJSmPv5EKDi+MveiNae/2ldnyZc6MXZ2dfjHHxuzbJTd+1sXTF/9k2MCiIflFmiozlb91LiKgj6uTWe0i+8s9teaHMvRBdCH6FtClwh0AAw9CC2hSi93dfL6MLnKfV+YqD3dRRKa1pCB+0sbf16vNN2Xo0/Bnv2ixQ4ECXIbLDDLgAgjk37BAAAYW1rWxHYMkvq5JiXGxpoNb90y9rHWohdq0tAAj+9RYaUN5bnruxpEvoMjcxL7FALdzZsrVyLXD9rnkLt7fOmSnNc9t/iCF/UVU1rhvHhuyOa3RBxjymIgA7kqfLu7zJRd2VLpXvVb/UgapargcULRWgMsIeEB2FlQYas7e2sz2x+Hw/xGrR5xO2HXheEWSzipF7UjXjthPgex6tYmht2N8HcEYljWpxRyX0MS7c4KZ/S52iX+xXm0uZjunL4UgAIZeSCt4xHzXNx4xAuq6FphSn3Bhl1xbCsKNv0hrZ9+LxtwZjanGgUJFWgkO6f6OUUsuKiPQ60wc6fKrS4nB3y5wmcPx4S1AcnImOYisF7BoIZz7sbNucWB8A+CEMViGz/YRrHQxg5Qw+IjiFjqxMLNb7nDISixmSmlSp+XYyKI3Nqrzz8goKfiuavKVKNsggAGAKZoFgHUt+7kUnzN9y0PRQfqEkbndJzP3wXq18cjVoNXQiH4ENDRKcMlSDzbLvWuR7JJGKCmAC1kSyy4vm7hnqcdOBbaZctO5Nhi1XbZRFD27UZt/XWjkXGkiaDE/+KIHn7hx89i8mUPCaEcR5zwe1p/zF2O39cA01fGwXdznbdpHzl3QmG68e+Tq40pPxDp636jARYzDAeW4M3VIuU8aJJbjzGxfHAeyXgFGoEGFfCrlK56FQ8SI7+DqWQF/yY5Qfp45I++mfcloOmgMy7D40ZdOpmbLBPzV4ravL7nx0zEyZ5QW4D/+QzMq8L3b6ysHsGFI7nk8SZDp/U9mxrEm7VgiV2rdbc/WvV/P2KdhketIawceTsILpOvEa1TgosX0sbioUC9C/9TMbrdOT+kTIHKmz9djdYGxPs8roNQTND07y31LkX0qJtSNkbmpRrVx+Vrbef2Fes7s5Nsic+2UA+JU6tXmRI5SCH4szFRc70WAjcG37/Gw3dznzuwbx+4//s9I0MxgEzrSQGElxuOnuXTeNwpw0WIiH4RcGC5l/YYDBfWo/7FUWmDRzrBeLoHoB83aiXdcjzEzgsD4TkWsE8ejRVGdqR6/4G6iDi62jB+50tjknq17vrXWgEWDCBbz8525doStM/eyPdXGizLaX9SsJJR7mBlJlNicAGz+lkepm+2uHQtDQwTcTc1NPskiR8In1zvr1eaTcvZpvfDhKPsp4MAuRvgAnjlJnMwLxcOIT1oGMKMAF+06lEbECOkn6nVS5mNqKBT8cpwgvQx4o6Rezra1GCA6RknKI3CEKuUGUh2l0SlGPVe+yCLbHpl92cZduTHV+MVaBZYOrQ4v26CqeAgIZzWqjU/kXMyiKRnk87FhF1XpglQ0Xe4+p7wFc3F+vdq8cM3TNCcjjvgxgca/22KFwPD6b2aGN3SZhD5scFFHiGOgM7fw6nP4FdOSfpcLMvcJfSMmst+8wAObEgWyf25mVGJDUkt1hOlSMeryk6M2+keNq6+6pkZZg5wLcwWHH7/KW8zlubLc57/deGjzH+0+d/e1OV3Boh9RvHvM7P5xZjX1hjPRdmpm6p7OtS4j27p1yO6QMSZn5em5Nt+oNc1JnoQdYMSXFxiPHgXC8PCNHFy06P7OzP5vQg4JYd4wDbEguiTZKIkv1a6/ivPgi3+ACjVmITolBFIxv8Bjem7yHocid4VF0fvrtXkM36viah6Ulp2s6t2V010pokreFQMeBeLzgOx2dzSz7/Yzjmss6tOW3VtuO14qUVb0hnq1yS6bJSZnUNIcCc+L3ymajg3ML2wG0HDyxMjBRZ3gJzs4tVLlORGAYFtB/XlSAvDgUYKBMPCuZc+RH89C8BZHdbTzW7xQ/+5MFQebTc+14zM4S/l9imHJudOvCQYOyjZ83Zy7sD7dePoAnhpfguU8J0ozEP8CmCcaEENCeLWDj7lx8w3/FpkR9Hf+AH1aE7Re4U6sCXDR4uLICXYb2VMEMFfHtVXvY2YUTkqqek+SHK7YdAt1hans7ZpPiHOEsLFwpe5vpxg1NWPN/SF1WI6UA9e1mKszZ5284DZg51Ax77wz5SdyUhMHqYgYmNSq8+Hu88pes9Zb26chRNvHdrqdykLP27+j4bk1AS7a0ZUJLHCR1EIxI5L5uIhaxcYSAtD3YzGrr3dglWZVhMbg+KO4D6kZvdNnL1Tez/hdpTEN9bUjkAr8LPNcffX7RAT0rodc+svCNZ2alKsOLlpg2B4w/Mhgq5/oZrimfxgPCfsCNhbfk7S84v3adEv7Inl+9c3ztqSe5vVy42jGlh3EPXodpnKmz4NaLxQfZT9XHVykFlBFjTiPTkGjWGUg7oPPZfAk6IwTBbFZSD1aT27pgXfTUXJD0XYXCgAqXC4o51AQrBcFVhVctHsTYANg+MdDSHLx3cx0FvBBTcLGEsbB8D0SEKUJBtqtCp4pKFBQYGAKrCq4SGp5WVy2UWAhSYS6JlRjEwjpJ9GoeEuQZgRC680tPfDMFQ0UFFjjFFg1cNGLSUBEarlNgprz0Nh75HtUJJHozOKwpipuaWw0xMXkt2to1uJgr6RJPGnipGiYXoMd0Y7Svn37VL6y88phvyduGPqr/i4fdUpkemNVqLa+75mSMEJGVz9Em359VT+7hvwP2Ff6o+LjflOqoRM2r/6H9Az7p+9ViH1U/U87/JBHkk6G6MUjqwYuAgyFwIfHXiCZEJvgG3ghisBFFduS3NKqCp/azZtI7RTGu2HFlwyrnT5co0Wh40nSMpl/HwtcoJ3pGJIcL1M2bd6cMZUHHabbuF+cjB+zJQDK2389P8z+95sG8Ug3oOz3/KJlagl8GfuqBdF9xczulhA0x0Hnb+wSB6IJxLZCIFroliZfgUC8/G7pGFi2zp19x4XW2F8QpVly0Xgrcu1/5myTM/dtyiIO6kLV85Nzk/dwLXe6i9x+XsIsleKfx+0/Ybd/XEaaGQ4kEFXS18e/FxdJ4txoaPVHccqFFiTM9ctYAkSy5PB6/hNzpEtAs7yeb8YOBrfTV+3efLXRzO4SR3mSNoE7n+REPueiDgt9xaNIEOaX44xo5r9NxpjhB12k4juixLd7fYZWHDhHFjbZ6UnR1rePN0to/SexpM7JDjzHRVIftCX1hWp6lOAQrUN6DEbd5KcFCD4Qnmxmd4/XJ0GqaBeMXU4JghKJLkdL+F58WgVCAcGs/kWUM0mkKxKhK+mDA70aHjhISvlVHHHLz6SdQhIJAWlEYA7fLR2DC0FdB61d3Y2cp/BqRWanpzyLJ3FKO8AyM3lKyZzyiw6717nF7Nyc0o0vvaGCUkflvPgEx1tm5NIb4mA0Mo+pmgfY6BpMSkwGAUCdUxfhE+xsWS7inkhgfH+8UHm2b7Z5nxdIYgMg4InwahcKjz9kYZIzRnQwTgkS9wSGacYBrTntgNo+1C3iGgaNk97tt8vJnfAHZVGpM8TfWS6ScAGYz5i1y61S3pT+c265jpphTY8s/F/gQnIZdTjCoDkkFiSXbsQU4OCWBumT7DWfNLMHDGJ3UYQmEkWp5UBf7dDyWm1yZl+t15pIXtnzTjy1qzIz+RUzRzsQnXGz61LXdV+j2oRJs7bv79YwyNPj1AlopSuL6CspxWc0oqXJPOYwekkJWRjRv9ef6web2YvM7H7eDb4qp50zfJdsFGFxIpj7Jd4izetJFLiwi7MRiA+hI8DBe14dH/+C2h4uTF/CSxqDn/nv23QAcgpgEXw5TIDxpRUkKA7S4z236sIjvfrMI0k8gvTFpkZe4CIXL9JtJOCiCULMRYzU5dtWEH05EKyXQVZEJuSfAktJbumBs6U7eS8zk88yc5Sh9N+zeBay2VubteZTs2Yk6/6p3eW3Rs6e7NWClR3p+gU7dNoltUt+mlH18hfPI+PymX8QE5r+y1Dnqx7dqoX5ACTm4jnor4vkM0LsAZo8dhjNJaoaFeRU30bvFlD6/Q2N0XpveK/P8FSbY/GQkZtnkfrgwu7s21f8hSO6CEySDNG+kVfPSm2QGqTjWPgbiYD0GCSBPH0PgdhfW9Rthu6om1w+j/C3DORJffaN6z74aD0LJJOCY4eeuCjCUJDHT0LUoiW3CC9Rv91FxEF/ZaJlK5BUwd8wE6rTQJPRqVE7W561yKaDivNtqcu56GH16vxH09b98LKBH2Yu2ulJb5rMknPRNnJZ0rYZM4bGyk6KStCu+h8cJCbbQ+jxYDfB28ZcsNtQjCv0XkmC8HN3BDSoC8xFFi+d+suhZ9QNRp0I+0d/uoFfuGj0t/9M58yk2DaAmkWWdFa+6AcuvFuA4ttJknb0bv3W/PNTtPdPONAZ4Fn77r/Pnx82TOo3i0dolzXknx7Rq6+96M93ocdpZJKLkB4GQp1BbNTLtFsT10J8Sz9woeO656LYwBa6pUF73NIDZUsLXLbt2vZ7B0r70bWRAkIj8m8ORa3T927b+6N+UkYnAXHP1O2ihRbiNeqdxi9p6PXNWvNZGaUhMRz0Rd+9cwwUvocHegtUkDjYCVFvGNdV8Q5JXwAW7ExEQiNJojOjg/tFfwQCtA/tkUazgIv6y86J6C8GxyCqheoDIJIuxcFwAtB3JBAu6EcgJu+nhgvp/bo0T/ytM4o4TQEwg/ZZFmkacOm2KHknhnHeiVRO/1EZGAPPsBY4hYCEVsbAlWRL5DPqoNBWFhAXPfxnKIjFUblJYK4NA9sPRmpsKPAIpUJ0P6oUdZdwBmATY3NBGmEuul0jAxdNJGoM6kwYNIf3hwjbfu4+dVzggk2CKm5JbmkSHonozcJEywjTqVe7qzzhSp1Dy4TMGsenG7XmfdsPd3Nje59PzZY/H0Xt8QYpD9HnG7V5FnIWO4togZEW1x+1hZcO/FoCQ1r9dKwqYUxHWkl7QUMWLgyJ0Q8PCJcWFGCWFlw0H5xWgIE4XEz+wiIF5M1x5HWavrJICXGgRq+8ZFoskgJY2IDRLzIs0n7g4hcyo59kYgPeJOTyu+9p6zUObIWoKYD6MjU8XuwAUNp1onf59yMtPyyWaH1pRaoP4EdFSOLJAJS0F1H2bEDwL4IC/9mMR6oWaWCI6zAgjBnWbCEpEVE+CxD0c0sPLVvaU2VeZC7CQOiLq5I4XtmsNZ/fTZURSFVmJt9g5jCyqg3R4sbx0sJpc9Mf/2E/CcibbdEA5gdYcB/6wCIGZffE5vAB71ktOunOfuCWr2OHsTHMI+rrs2M3I02ya6XZUQWEGEapdUtbvoSh/lIb+K8oINWlvz7DS9/3jab05z1mBuD77YvmLHy8OWkXaS9w0eLB6ErlOxYlgBL20ZfEkoLofLUT8Kd/PsDod9Tzi1NK+OqD1hVGZ4y3Pv/69Pk/sUEdHuKSStotqE+0T3IQIFUyf6rRJJ4aqkFXA8PACHOHQXPEKMAMxCyknWwGrnZ1vMTw3dKaGi95rTJT9g+Kl70H4pfMuclGtbE3VGm80/6qztpHnPqSlmw3D69X5y/KaWd5Z1wzNglYUCnwzClymYWSNT7F15/9eIjzzYwUDtywgEUvcd2fW8UpJS0ePFC0qznOEvjH+1kQ8mARroDtLUkK4DgRkmbTbGjdwGVx3hcdFMRd+Z4z8UaW6GbFyfAspVBR7cONWG7vNOYDf51IUvTdwr5Kznnk9Zju9AOadQOVJGlG4CHDOrQgbmekrmgxFcFBiEyh+xnXIwyaZpLD3YDB4+rCjuOLYEPPll6quk/8y/iVZg4PhyZHP6+56dDBUy99yKW/1P2SQs6eOfs24zaG7srRpqGdJY/XScx1dhwXkSQBIM1QaAvQSVVOM4UMLDemAAr68xk6eq9L86tD4PzdU4ufzefRHrDkjXD1eUlqQLipwTNEgsvo22shdQMX5pF5ULF4SWKDBO1pnjDgIqGIVyQhETSI5PfrFJux1h5twnuU7BSf+OoKrn9UZvrPvGQBlW5AQxsjDaLTAkCXJBYgJNSghlcx0avM7Dld3NIAGvVi0iJ91wXSiX+ZmTynZM6feJ4R8843as1yWNCpMlPGeMpCD+ws9pVGrUkUYxY7i99HRTqHhmaMtBgAYcKswJ0CYzqShQCgl9Sp7wBkvDV+EXb1m2JgGFsljg+yQP02MD6ismF8FP/pndiQ8FT1441+4MLcskCzSN79aEyfMABjxwjXTdoKAJr3v4+j3n1AV5toFBxzA7BIHerXt37fiw4jDf/XpIW7hxYYYitqTV7m16SDyEyERFHfLT3UIt4d28nu8mvMte0Oy+0vkT2vua35qu0XbT9m53k7f1fZPfkqcw7wC+0sB6zlzmic2/heBjuLv3CwfXwkAFUxDTo7toVhSSzdGEp6d6/dTvMLvV6TUAsZfsCIiTSRlxeS+qexK6I7lJpZVCyutQYu6o+8OqEDJI3dRQscerI2WCOhiiUVdJg0Zx5GDi5a+OiNiGSKj9CL+YkHgnyQPK41MVM3AJPYN9wi3odH134uPv84dIWbs9ID6rX6J6dmt2yNohLu1mV2lsjs0c1a8wMZ7SyMW/TC29I5I9pbtLjoiXMZNtP027H6fY+hk5ymkMmJucDQOGwgFK8Ru4PEJNVZthLyYjA4Mn+9pI6Vllw0b7KlheCC2xqe6gWK+k7u/lAdYqPD1onjY5D110stGpnkIgKFB51pkORPsDD67Rr9GFbP4/rC2Jrklh5qEW9JGeVd5du7Utvw5seraHzfbZWih5VapXmziPiTw+0szt7TrDb/JmM8iw8suJzxviUV2sK4iL47KG370T7N92JcUhxQ4XQJ/KEXC5zFD7hAp2Fe0ABxX8eN+AZNPBe8+wd9Fthqgcs7zOyJCaEbacBF698qOmoAABEGSURBVA+vGZ63UB3HmI1RexQb0EglFzWedNCZFl8a0S4tk+l9MiCF9gfQGSbSsZKDGqzMc08/3Fz0oaRI24SAu8UJjtzXG7XGXdulE1OUdwiI0M37Ftouhr0bpZ2L8L5Q7w93YUR/4i5GfT03TlUIpcw09ov1Bi5+iAJag+910iaHI4CAy1FsQCMFl24MpYHhtiSQaViX3hfWiKF9LTryVgCBoSH1UuxK5e1mESkNvv0lDB7S3wuHSq277J3ee2VGO4topf6/ycyelrAjvdjMXjrMcQ44SWJeAuLIdA7BhZ2VXRRj76BG3KSu8v5r43cjBYQbDxnYeDJ7LbL1Bi7qLyky2FtUuRH6sPAJjsPjRPzTMI3Qov/IwMW3qXQ76IwgMk5XJNQ8r7vRZyTeycLuJSkNnC29jHMldUTmKrNlAr8ATN8l7EdutoE1cvbXzWrzH3PYWfR6MQ5qJbuP3qeflTjydRQ7Uh6cET+ER8PQVhjZmqf9LM/479PvabyJ6w1cupkKxCN4boluH5V0OzJw0c7a7aAzwosVPp6FMdLe+3wze8WosqXDTkj62DK35dSxVgn7i2+41u3xpEbvb9TmH5tTYtGuI5WOwC3ADNBSABO/437ul1melpaD3icmwy7ERsNO6tvEaD8punPQ9yY9r+Aufcemxo5OOD05NEeS5KI1SMwQke+hl+y9sR1maFJ8QPCRgYvQkJwf0DG0UmM8Q9dDahmm8Y4BYVMh4Y7sV3+Xkig+VLe0COpF4D7KmSH++wtI/fjZzQ4cf7t2VbnsdpZQ3PSDonxwoUIY+jUxLqMQd7MuevWBQDtiTW69CtJKrz6jLuG9Ikq81y6+3iQXgQZqIEbh0JhLGgChEesKXIT+4UFnmuCVEoPD9/hu6eEV8Y5H1QGX3eVnOGevT9id2++PnJ3frDYvHEAlSoq49MEFHZqgK5Ly1gO40HeC/DSGrOCV537eRcAYGfPECaWR8o40cEGyp970ugIXdTY86Mxngiy5InmYh0XlJ4n5YjD9G04R77hVz6h7H7OISM0kW8KSG7rlTssRNBdKLowDNQOjnA8upPHjFeu3E+eha55n/DgT3OY60E5qHMBCsiUGRt/omOddWZ4BLABixbv0k6DXK7iEeXeSYMg0/7v1BC6aAGo6wEioPb4EkTVZLguzdLtXWZ3S7enj0LKll/KNqscftJvYASkl6auBYl7evzixzl3RqDaIQ8kb7q8FS0oDEmKodirGZVTGuizz4hv38RASheuDITRBkmROVuNKS6P1Bi7SIIiHIVE2NPrzGYmKozL6D93mIqklPOgsaSdfSUYKAQ6CDsUt3alUN1NmsphIuaKXeYniAcffR29s1OafkSOAjmb6pVTkKV8xyvnQwqRoNikJIaMr3gn+GYUrutfY0sY7rTdwUX+pb4MXU5ck6CxJm3l4Y6jg4ou/dBzDXZhsRVwGuxeJZP3E0DwDClUH/kYFIjrWjwZlceIdwEuQduda1p8eNXb1ruvMIrKnqefru6fbdMlZypJ+CMQZG0AeGutGYrQeYELUX3KKyC0K+0sEN5+PSv8foOudR9cbuPjrUQcPhnZIIqYBntxroAdhhwouYoxQx/OREvF3pS8MV7im/XoeWeIbEvvbyY7eNXnvUsmhnvjSWfyu6GmN2vxbKjNlPDdJ5TGvby1Ep84/dP6qjK5pSS5hFb6OVyo26pJxvhaMuuovYjgZyGEQG8xP6YNRbjiD8t16AxdfwvXTHpgLrQUZdYedz8W7hwoumrxuiWk66AypZdCjKNIwCsyAWzqMUGTQA7mlpQpNz00fu3Do4DfNtctKasFILdrVqDVJ57fJ3ZP3KzlHAJ9EcL8PlzdqzYm2a3pxStKI6Zo4aIlti8rtYSLgBXFF/lEwThr6+/eov5RZIH+ISNxQklTpg7UqvaxHcBEtiYomPCKsZ8Omh0NgFJvQ0MBFO1Ovg85wj6YpbpOVcXvdr34R8k+GcJhTkutsaUkZlZmyX4uURSyA+dHvDuw/fd95+35TqVc2NaYaByqzk8+3yLFTLCvPYC56aaM6/+KM7mkxzhvic4lCxiFQEUlxaLlUA05MvxQAxHPE9EWQHbxYUZruZlEH1iO4aIFTABxThW8eEL+QJkK6yDBrufiSy8DFosQ43Q46YwE8cxV0avUrLFTF4EXcTEW8O3aW2crTLIqwIS0rtRCV7C+a083Pdoy1ccBcZaay1ywiXN9/ZnEinDurUW18IoOBV8yO29k/pMuXiuRuHLX0Ap2RnHpJXZoLikFRTT4pc11zMWxGD4FGYQpZjMfrEVwYd+hkSXI4EAqAxjFMPtF7Bypz2c0q7Yu96NMgZ5adIs3Ok+aebnktYu7U2dJePMvdzSJq0Ph2FnmBntOozb/al0I6HqV65SRbiK60yDgnWO+Pf7qrN7U2nbr73N3XZji6VROotPykKmOqE5unJmo/+oag0s++I4DZHdfcXQbMZu2zoajwN6xyi/4YQlAhMhe+RILtd61XcNGcUFqVsXKionhPkjZSLlIj0crDABhtDpyeSb0h6O6bBFIX6BaDdzvojCppHNw9Kn96P6ZQ/3DP4kXxDbsi7iPiiu1d9X0PIDbZQc5JjtBVD7ezOKs3qs1zksChczzJ7vKkc22CJ+zc7uJGrTGdAVzE8IAVRlFsGqGHDvrI7a7gwkESRdWGnw+ETo/3DSbtBTDqLyoyZQCgtzYhv9/UjqX6Pffzf5D+JrVB7hVeNrKhUR3TZAavV3DxpZfQ9uJL8Ei/nJSA6SLvRiQQYS4BFkIPRDd+aq5TgYsYCU8IzJ100Bnn5lK8eLXARX2kmBN9VIQogxU49M2W9uwsFJCmLKKkBLXxs02tzaf1kjwkzUzNll8ZRUZtkYQC1dGzG7X512WwvwgQFSzlB6j5ACbdGobSgkubMMj9iqj1FzrFuThmBaZkwcKg/aRT9ZdzhTifxwd7v79UpaM6XdhfGLSb+qU+JvWVds4ys6fGwWP8zWkIVGJLY9Bcz+DCWEObV9IpEUR1kw5B9TiBErTupvKKzqKNvH1UPMAUwuXPaSZwEaN0O+iMGhnsDv3E5X7Sx6Dfq58sMPT6TG5pz85ygUURZQeTbCYTjWrj8p42Ey9ZsTxT/rRbpM1ym42zezerzS9msL9ofFTb4xA42lRksi+Oov/+rxjsRVNJIkk0TkrTAKRRXQAHbFlcgCSHoqU5t8hndJVwTFLnuI9UCsYE+PuXwFHM2msBAHq4wDHoq36QGP7HsQucZM9+PLrewUXjYxyUvuC4jySAgc6cXUTBe9QkXdpg+Ju2kjYm+Jlzw3VqpA8sPJcaXNTZXgedqar4arsXxRiUecB1S581UC3uxJJ/klgmZyfPKEWOEge+eCc7y4satfmXpZE2OuUZdm+57ZgrsdOTLXyYDuzMvn/jCftP3/fAfftzqEg69EoLTqIqEhbzwEUtD87SpiQou3e/C2mPNAPOPuI/KQ5ctClGy3LMqL+QJQkyDz5o+P0FZDhsjKN+/6NHKAOueSr8E5WKNIXUjC1Bl78DQxfGjj2QI1GOdHDxQR2eg6bYnHTkDOP3Az1/Fbuv8Yhi7EW6Cy9oyJoi3oq1Dr25tLlpjfkeQH7vqxYJMLoddAYT4MlgAfabuH7MPYzvJRZS7R0bRH+3dCxpAAi/2Xz91yxyOuOmE4jkzD5erzXPzhKnsqQeTT40ihw2KX9S24DlzC6s15rnZwiu8ydQ5wJBN9pjrsQ8/GQRc2HIpP4M/xGJOQ8HZjvRzDgaFsbBJoGNBIlFl7wsmlfokVYtUhu++vSW+DRI9dc/L9rvL+CAAZ7/JDqKtzBWopoDLESGy3Crdwm4+Js2BLJkRVMRP81hfOtdchEttA6YTwznAINAN2kj4jnohFRKXAz8wX0nxWdEE0cmempDk8nB/1y8kgpcdDNuRdyLYTEaVCVEq9WWWkKisqNhfExyhR6WLd3xDs1W3mtR9PiEY0GuGS9tOG1ueu6aDBJGuz+e5+nNZhF2gAT7i7ugUWu8O41EFA9SC5G5wB6CdKKDwWkfptDEwwia/DTgraRTSW7+8zAfpzj8LONG4gMMXi1sMEgfUsek2undafur+2UTkB1KoAPYEPuECO+78XvR4UgBF1+C4XdUIFRlSRxSk8M56EUb6Cne43dtDoSmsDFh1/JtgX0lF17GIVDow9oZ6BATiPUdbwq7y1qQWkQY9UUnP2rBaTdD2oIQC2d+6cwNV9zzioOV3ZXHmItQmXRvZ+d11tpSr+29JINtZGmCDj+e5CtmDvFd7xAd89baFaCzUAmQ4kAsMtS5woXXy0DK/aFI60sF2CywmwAKiNF55toHRCQP1DokS1/q4Hfp/OpvaNQVkHCv7pGapbbwZiG5clYWR4pofGmion1w8Y/JgZ4sJjkF8tAgaeGGXlgkBiV28r5Bi9v7wM6GiwF2MVN/Cdw1N0k0T6K3wJ+yH5yiikFea81Xe/keLYD5WOYAEMMhVuE2DC+YjUPP14rUov6F4dBJk6q4ECvPlO/qDs8oXbrfRa9oVOdfmEGqWPYuqTxb586+46HWGDto0s78vd+dsP/O2F8yVq/zaU96AAZYVFhJMn5/koxz4cLU/ahSLCTCyckTglGyLNIkmvOZ319On6TwOGVSUdH8K8l4q0UgvvTvR6riYDjUT36ya+p9ab1l3K9FgJqI3S68MJaToNrPW9Zt/OHnooeOBQm/x0hNJv4ga0xSijyAGL2hO6eChldIqyT+QKhgI0Yaki3va7GxP+Q31NHE41zoFPk0TBbGUbmghGYY/dK4JdMSelj3aVdB38SYyaKD2aQqnGAlu8Ra7UXozr289tH91x5AOsNqrl3jOIuizzW2zcP4eeuxdMazlFldeaRZxO5xvaOId1sKcAfNoltFZq9t1povz2B/Ufsh81DHFqMbaRpY9pEuKWje62Ls2DgI48agSliBbwQWXdLs/v3mUdKJbDro9UQ0U6YB7wY8x+Fm3S52d/qGZEEyKX3lwHs/SI7+ZgEVvUugcYeYd8RLtEUIBu86L6f0ljQe2Ubw/j05toeJ1gAusVnw8DBCPMJgSMC9FttjqL9D/FS3C1UY1zUHtLHZUAGRS8F4xLpQAF0eOd7FhoS0hOSbKLnISChdSi/XxA1LPOzHkFm/9/sVVj6THeGm7dH2ku20jWd884wD+x6wTwZQu+E7N7grnnjFYuJl/jq4h/XZP7D+Fyf94rDdd+LyidZn/vwzx+zdsvfGlEmNSfTQLhMGo8E0MoLyu+aU8RFMxa7PYhXDqO3QFpJ1Dvrd362/eKnYEMiRwYirecHbc3XcX/ocnnfMuHq5q/v1x/9egB0+k+S2z9Jut3u7SZCjKLyWtFEQoIm0i8eQjUhggBqMEwDpA+DQFYI3m4Efoav78D5JKDls7EniZzgBw9jJhjE5SW0MBnzZMphTjSGrQThVo8tv8tWHrMwplS3Prp+zu20bjm+ETduOH+PTLQAsbVtH430CtLRzPdTNRuDSDWTWMrCEIJjEPIv9F4iEd6Qri5CdKVf6fUtRt75xTv32jXhrYT7VxyTeU/+6GXuzz0XvJ5L4fpQ0Wun3hWskpP3i6jj8fzeKZcaIfpLLsCezaK+gQEGBo4QCBbgcJRNdDLOgwEpToACXlaZ48b6CAkcJBQpwOUomuhhmQYGVpkABLitN8eJ9BQWOEgoU4HKUTHQxzIICK02BAlxWmuLF+woKHCUUKMDlKJnoYpgFBVaaAgW4rDTFi/cVFDhKKFCAy1Ey0cUwCwqsNAUKcFlpihfvKyhwlFCgAJejZKKLYRYUWGkK/BdvG0yf0du9KQAAAABJRU5ErkJggg==',
                        alignment: 'center',
                        height: 40,
                        width: 100,
                    },
                    { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 516, y2: 5, lineWidth: 2 }] },
                    { text: 'Project Information:', style: 'sectionTitle', },
                    {
                        alignment: 'center',
                        columnGap: 10,
                        columns: [
                            [
                                {
                                    width: '*',
                                    text: 'File Name:  ' + filename,
                                    alignment: 'left',
                                    style: ['nonTitleText',]
                                },
                                /**{
                                    width: '*',
                                    text: 'File Location: ' + '/Users/.../folder',
                                    alignment: 'left',
                                    style: ['nonTitleText',]
                                },
                                {
                                    width: '*',
                                    text: 'Report Style: ' + 'Standard',
                                    alignment: 'left',
                                    style: ['nonTitleText',]
                                }
                                {
                                    width: '*',
                                    text: 'Acquired By: ' + this.get('model.user'),
                                    alignment: 'left',
                                    style: ['nonTitleText',]
                                },*/
                            ],
                            [
                                {
                                    width: '*',
                                    text: 'File Creation Date: ' + this.get('model.date'),
                                    alignment: 'right',
                                    style: ['nonTitleText',]
                                },
                                {
                                    width: '*',
                                    text: '\n',
                                    alignment: 'right',
                                    style: ['nonTitleText',]
                                },
                            ]
                        ]
                    },
                    { text: 'Methods:', style: 'sectionTitle' },
                    {
                        alignment: 'center',
                        columnGap: 10,
                        columns: [
                            [
                                {
                                    width: '*',
                                    text: 'Filters:  ' + appliedFiltersForPDF,
                                    alignment: 'left',
                                    style: ['nonTitleText',]
                                },
                               {
                                    width: '*',
                                    text: 'Method: '  + this.model.previous.method.attributes.name,
                                    alignment: 'left',
                                    style: ['nonTitleText',]
                                }, 
                            ],
                            [
                                
                                {
                                    width: '*',
                                    text: 'Solvent B: ' + solventB,
                                    alignment: 'right',
                                    style: ['nonTitleText',]
                                }, 
                            ]
                        ]
                    },
                    { text: 'Sample Information:', style: 'sectionTitle' },
                    {
                        alignment: 'left',
                        columnGap: 10,
                        columns: [
                             [
                                {
                                    width: 'auto',
                                    text: 'Sample Notes: ' + this.$.DataControl.$.ReportControl.$.SampleNotes.value + "\n\n" + this.parent.parent.parent.parent.parent.$.NotesArea.attributes.value,
                                    alignment: 'left',
                                    style: ['nonTitleText',]
                                },
                                /*{
                                    width: 'auto',
                                    text: 'Sample ID: ' + Math.floor(Math.random() * 1000),
                                    alignment: 'left',
                                    style: ['nonTitleText',]
                                },
                                {
                                    width: 'auto',
                                    text: 'Dilution Factor: ' + Math.floor(Math.random() * 100),
                                    alignment: 'left',
                                    style: ['nonTitleText',]
                                },
                                {
                                    width: 'auto',
                                    text: 'Sample Quantity (nl):  ' + Math.floor(Math.random() * 10),
                                    alignment: 'left',
                                    style: ['nonTitleText',]
                                },
                                {
                                    width: 'auto',
                                    text: '\n',
                                    alignment: 'left',
                                    style: ['nonTitleText',]
                                },
                            ],
                            [
                                {
                                    width: 'auto',
                                    text: 'Vial #: ' + Math.floor(Math.random() * 1000),
                                    alignment: 'right',
                                    style: ['nonTitleText',]
                                },
                                {
                                    width: 'auto',
                                    text: 'Injection Volume: ' + Math.floor(Math.random() * 1000),
                                    alignment: 'right',
                                    style: ['nonTitleText',]
                                },
                                {
                                    width: 'auto',
                                    text: 'Level #: ' + Math.floor(Math.random() * 10),
                                    alignment: 'right',
                                    style: ['nonTitleText',]
                                },
                            */ ]
                       ] 
                    },
                ],
                styles: {
                    // h2
                    sectionTitle: {
                        fontSize: 15,
                        bold: true,
                        decoration: 'underline',
                        margin: [0, 5, 0, 5],
                    },
                    // h4
                    nonTitleText: {
                        fontSize: 11,
                    }
                },
            };
            var plotsToPrint = Object.values(selectedPlots);
            plotsToPrint.unshift(main_plot_id); // Add the main plot to the list of ones to change, this isn't a great solution because I have to change and then undo the change that I make in the layout.

            let scalar = 3,
                dimensions = {
                    format: 'jpeg',
                    height: 235 * scalar,
                    width: 450 * scalar,
                    scale: scalar * 2 // This high scale does increase the time it takes to produce the PDF but the plot comes out much clearer
                };

            let length = Object.values(plotsToPrint).length - 1;
            await plotsToPrint.forEach(async function (plotID, index) {
                //console.log('pp', document.getElementById(plotID).data);
                let currentPlot = document.getElementById(plotID);
                main_plot_original_layout_config.paper_bgcolor = 'rgb(f,f,f)';
                main_plot_original_layout_config.plot_bgcolor = 'rgb(f,f,f)';
                main_plot_original_layout_config.font = {
                    size: 30,
                    family: "Open Sans",
                };
                main_plot_original_layout_config.xaxis.title = '<b>Runtime (min)</b>';
                main_plot_original_layout_config.xaxis.titlefont = {
                    family: 'Open Sans',
                    size: 32,
                };
                main_plot_original_layout_config.yaxis.title = '<b>Absorbance</b>';
                main_plot_original_layout_config.yaxis.titlefont = {
                    family: 'Open Sans',
                    size: 32,
                };
                main_plot_original_layout_config.margin = {
                    t: 20,
                    r: 80,
                    b: 130,
                    l: 130
                };
                main_plot_original_layout_config.yaxis2.showticklabels = false;

                /*currentPlot.data.forEach(function (trace, index) {
                    console.log('trace', trace, '\nindex', index);
                    try {
                        if (index != 4) {
                            trace.line.width = 5;
                        } else {
                            trace.line.width = 3;
                        }
                    }
                    catch (e) {
                        console.log('Error: ', e);
                    }
                });*/

                if (!testing) {
                    await Plotly.relayout(currentPlot, main_plot_original_layout_config)
                        .then(async function (gd) {
                            await Plotly.toImage(currentPlot, dimensions)
                                .then(function (url) {
                                    // console.log(plotID, ' at', index, '/', length);
                                    docDefinition.content.push({
                                        image: url,
                                        alignment: 'center',
                                        height: dimensions.height / scalar,
                                        width: dimensions.width / scalar,
                                    });

                                    if (plotID == main_plot_id) {
                                        // Delete Temporary hiddenMainPlot element
                                        document.body.removeChild(hiddenMainPlot);
                                    }
                                });
                        });
                }

                if (index == length) {
                    // await deleteSelected();
                    pdfMake.fonts = {
                        'OpenSans': {
                            normal: 'OpenSans-Regular.ttf',
                            bold: 'OpenSans-Bold.ttf',
                            italics: 'OpenSans-RegularItalic.ttf',
                            bolditalics: 'OpenSans-BoldItalic.ttf'
                        }
                    };
                    docDefinition.defaultStyle = { font: 'OpenSans' };

                    if (!index && !length) { docDefinition.content.push(dd.content); }
                    if (!testing) { await pdfMake.createPdf(docDefinition).download(filename + '_report.pdf'); }
                } else if (!index) {
                    docDefinition.content.push(dd.content);
                }

            });

            if (testing) {
                let min = 0;
                let sec = 60 * (min ? min : (1 / 6));
                setTimeout(function () {
                    document.body.removeChild(hiddenMainPlot);
                }, sec * 1000);
            }
        }
        if (reportExportType.Tabular) {
            var dataFromChannels = [];
            //var dataFromChannel2 = [];
            var filterData = this.$.DataViewer.data_config[5];
            var objch1 = [];
            var objch2 = [];
            console.log(filterData);
            for (let i = 0; i < filterData.x.length; i++){
                if (filterData.c[i] == 1){
                    let idx1 = i;
                    objch1.push(filterData.a[idx1]);
                } else if (filterData.c[i] == 2){
                    let idx2 = i;
                    objch2.push(filterData.a[idx2]);
                }
            }
            // assembling data for table
            for (let i = 0; i < filterData.x.length; i++) {
            if (filterData.mode == 'markers+text'){
             if (filterData.x.length){
                if (filterData.c[i] == 1){
                    let idx = i;
                    var sum = objch1.reduce(function(a, b) { return a + b; }, 0);
                    dataFromChannels.push({
                    'Channel': 1,
                    'Ret. Time': filterData.x[idx],
                    'Pk. Height': filterData.y2[idx],
                    'Pk. Area': filterData.a[idx],
                     '%': filterData.a[idx] / sum * 100,
                    });
                } else if (filterData.c[i] == 2){
                    let idx = i;
                    var sum = objch2.reduce(function(a, b) { return a + b; }, 0);
                    dataFromChannels.push({
                    'Channel': 2,
                    'Ret. Time': filterData.x[idx],
                    'Pk. Height': filterData.y2[idx],
                    'Pk. Area': filterData.a[idx],
                    '%': filterData.a[idx] / sum * 100,
                    });
                }
                }
                }
            }
            
            var result = [
                // headers
                Object.keys(dataFromChannels['0']),
                // values
                ...Object.values(dataFromChannels).map(item => Object.values(item))
              ]
              .reduce((string, item) => {
                string += item.join(',') + '\n';
                return string;
              }, '');
            
            var filename = this.get('model.path') + '.csv';
            utils.Download(filename, result);
                //.join('\n'));
        }
        return true;
    },

    saveStack: function () {
        /**
         * function: saveStack
         * 
         * saveStack saves the custom stacks
         * to localForage
         */
        console.log('Exporting Stack');
        let defaultFilters = [];
        let defaultFiltersRun = [];
        this.$.DataControl.$.FilterControl.get('defaultFilterStack.models').forEach(m => {
            defaultFilters.push(m.get('name'));
            defaultFiltersRun.push(m.run);
        });
        let exportType = this.get('model.saveStack'),
            exportFilters = [],
            exportOrder = '',
            anyChecked = false;

        let newCollection = new Collection();
        for (let [, value] of Object.entries(exportType.allFiltersAndOrder)) {
            // What to do if inputs & outputs exist? //!@#$%^&*() ToDo
            if (value.checked) {
                exportFilters.push({
                    name: value.name,
                    parameters: value.model.get('parameters'),
                    run: defaultFilters.includes(value.name) ? 'default Filter' : JSONfn.stringify(value.model.run),
                    info: value.model.get('info'),
                });
                exportOrder += value.location + value.name;
                anyChecked = true;

                let filter = new Filter.Filter({
                    name: value.name,
                    parameters: value.model.get('parameters'),
                    info: value.info,
                });
                filter.run = value.model.run;
                newCollection.add(filter);
            }
        }

        if (anyChecked) {
            this.$.DataControl.addToCustomFilterStacksCollection(newCollection, this.$.DataControl);
            let savedStacks = localForageKeys[localForageKeys.savedStacks + localForageKeys.suffix];
            // ToDo: Remove after Testing //!@#$%^&*()
            if (!false) {
                savedStacks.length().then(function (numberOfKeys) {
                    // Outputs the length of the database.
                    if (numberOfKeys > 2) {
                        console.log('Resetting localStorage and storedStacks\n\t\t\tFor Testing Purposes');
                        savedStacks.clear().then(function () {
                            // Run this code once the database has been entirely deleted.
                            console.log('Database is now empty.');

                            // Check if current stack already exists in Array
                            savedStacks.keys().then(function (keys) {
                                // An array of all the key names.
                                if (!keys.includes(exportOrder)) {
                                    savedStacks.setItem(exportOrder, exportFilters, function (err) {
                                        // if err is non-null, we got an error
                                        if (err) {
                                            console.log('beg-err', err);
                                        }
                                    });
                                }
                            }).catch(function (err) {
                                // This code runs if there were any errors
                                console.log(err);
                            });
                        }).catch(function (err) {
                            // This code runs if there were any errors
                            console.log('Could not delete: ', err);
                        });
                    } else {
                        // Check if current stack already exists in Array
                        savedStacks.keys().then(function (keys) {
                            // An array of all the key names.
                            if (!keys.includes(exportOrder)) {
                                savedStacks.setItem(exportOrder, exportFilters, function (err) {
                                    if (err) {
                                        console.log('beg-err', err);
                                    }
                                    // if err is non-null, we got an error
                                });
                            }
                        }).catch(function (err) {
                            // This code runs if there were any errors
                            console.log(err);
                        });
                    }
                }).catch(function (err) {
                    // This code runs if there were any errors
                    console.log(err);
                });
            } else { //Keep Post Testing \/ \/ \/
                // Check if current stack already exists in Array
                savedStacks.keys().then(function (keys) {
                    // An array of all the key names.
                    if (!keys.includes(exportOrder)) {
                        savedStacks.setItem(exportOrder, exportFilters, function (err) {
                            // if err is non-null, we got an error
                            if (err) {
                                console.log('beg-err', err);
                            }
                        });
                    }
                }).catch(function (err) {
                    // This code runs if there were any errors
                    console.log(err);
                });
            } // Keep Post Testing ^^^^^^
        }

        return true;
    },

    // Check All Filters For Processing
    checkAllFilters: function () {
        /**
         * function: checkAllFilters
         * 
         * This sorts through the EnyoJS DataRepeater
         * and checks all the filters for the jumpToRun
         */
        // console.log('Checking Filters: DataManager.js');
        this.$.DataControl.checkAllFilters();
    },
    applyFilters: function () {
        /**
         * function: applyFilters
         * 
         * applyFilters takes the selected filters and
         * runs the data in parallel or in sequence
         */
        //console.log('Applying Filters');
        
        let exportType = this.get('model.applyFilters');
        //console.log('exportType.runData', exportType.runData);
        // console.log('exportType', exportType);
        let plotconfigs = this.$.DataViewer.getPlotConfig();
        //console.log(plotconfigs);
        // Remove Any Extra Traces From Plot
        let plotDefaultTraces = function (defaultPlotTraces, totalPlotTraces, plotconfigs) {
            if (totalPlotTraces > defaultPlotTraces) {
                console.log("Restoring Plot to Original Configuration");
                // Delete old Traces
                for (let trace = totalPlotTraces; defaultPlotTraces < trace; trace--) {
                    Plotly.deleteTraces(plotconfigs.id, trace - 1);
                }
            }

            // CSS
            // let update1 = {
            //     'marker.opacity': 0,
            // };
            // Plotly.restyle(plotconfigs.id, update1, 4);
            // CSS
            let update = {
                'line.dash': '',
                'line.color': '',
            };
            Plotly.restyle(plotconfigs.id, update, [0, 1, 2, 3]);
            Plotly.relayout(plotconfigs.id, { showlegend: false });
        };

        // Delete old Traces
        plotDefaultTraces(this.get('defaultPlotTraces'), plotconfigs.data_config.length, plotconfigs);

        if (exportType.selectedAndOrderedFilters.length) {
            //let totalPlotTraces = plotconfigs.data_config.length;
            let filterCollection = new Collection();
            for (let [, value] of Object.entries(exportType.filterOrder)) {
                if (value.checked) {
                    // console.log('model:', value.model);
                    filterCollection.add(value.model);
                }
            }
            //console.log(filterCollection);
            let selectedFilterStack = new Filter.Stack({
                name: '',
                filters: filterCollection
            });

            // These variables will grab the data that is used to style the plots. They will then be passed onward to the post-run modal window.
            let processedDataToFront = new Array(),
                peaksAndAnnotationsToFront = new Array(),
                newLayoutToFront = {};


            // Reset everything for next analysis
            
            selectedFilterStack.get('filters').forEach(function (filter, filter_index) {
                if (processChannels[filter_index]) {
                    if (filter.get('values')) {
                        filter.set('values', new Collection([]));
                    }
                    if (filter.get('annotations')) {
                        filter.set('annotations', new Collection([]));
                    }
                    if (filter.get('inputs') != filter.get('outputs')) {
                        filter.get('outputs').forEach(function (output, channel_index) {
                            // console.log('output', output);
                            if (output.get('trace').get('models').length) {
                                // Reset models to prevent appending new analysis
                                output.set('trace.models', new ModelList);
                            }
                        });
                    }
                }
            });

            let restyleBasicPlotConfiguration = function (id) {
                // let update1 = {
                //     // 'marker.symbol': 'circle-open',
                //     'marker.size': 12,
                //     'marker.color': 'rgb(230,114,30)',
                //     'marker.opacity': 1,
                //     'marker.gradient.type': 'radial',
                //     'marker.gradient.color': '#141414',
                // };
                // Plotly.restyle(plotconfigs.id, update1, 4);
                let update = {
                    'line.dash': 'dash',
                    // Note: Original Data Color Kept For Clarity
                    // 'line.color': 'rgb(230,114,30)',
                };
                Plotly.restyle(id, update, [0, 1, 2, 3]);

                let newLayout = {
                    showlegend: true,
                    legend: {
                        "orientation": "h",
                        // "orientation": "v",
                        font: {
                            family: 'Open Sans',
                            size: 14,
                            color: '#fff'
                        },
                    },
                    margin: { t: 0, r: 0, b: 0, l: 0, pad: 0 },
                    xaxis: { visible: false, rangemode: "nonnegative", },
                    yaxis: { visible: false },
                    yaxis2: { visible: false },
                };
                Plotly.relayout(id, newLayout);

                newLayoutToFront['newLayout'] = newLayout;
            };
            let stackResults;
            let channels = this.get('model.channels');
            if (exportType.applyAsStack) {
                // console.log('Subsequently Apply Filters');
                stackResults = selectedFilterStack.run(channels);
            } else {
                stackResults = selectedFilterStack.runParallel(channels);
            }

            let stackYAxisStringName = null,
                stackYAxisStringObj = {};
            let d = 'default';
            stackYAxisStringObj[d] = {
                yaxis_string: '',
                index: -1,
            };

            let numberofInputEqualOutput = selectedFilterStack.get('inputIsOutputCount');
            selectedFilterStack.set('inputIsOutputCount', 0);

            stackResults.forEach(function (filter_data, filter_index) {
                //restyleBasicPlotConfiguration(plotconfigs.id); //ToDo: Check this. Does i tneed to be here? Or can I place it somwhere else. Current location implies that it can be reset for each filter.
                filter_data[1].forEach(function (filter_output, channel_index) {
                    if (filter_output.get('trace').get('models').length) {
                        let nAxis = {};
                        let yaxis_string = `${filter_index + 1}${channel_index + 1}`;

                        if (!exportType.applyAsStack || filter_index == (selectedFilterStack.get('filters').length - 1 - numberofInputEqualOutput)) {
                            nAxis['yaxis' + yaxis_string] = {
                                autorange: true,
                                visible: false,
                                overlaying: 'y',
                                side: 'right',
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
                                showticklabels: true,
                                zeroline: true,
                                //            zerolinecolor: 'rgb(136,189,134)',
                                zerolinewidth: 1,
                            };
                            Plotly.relayout(plotconfigs.id, nAxis);

                            if (exportType.runData) {
                                newLayoutToFront['yaxis' + yaxis_string] = nAxis['yaxis' + yaxis_string];
                            }

                            let x = new Array(),
                                y = new Array(),
                                c = new Array(),
                                a = new Array();
                            filter_output.get('trace').forEach(function (point) {
                                x.push(point.get('x'));
                                y.push(point.get('y'));
                                c.push(point.get('c'));
                                a.push(point.get('a'));
                            });
                            Plotly.addTraces(plotconfigs.id, {
                                type: 'scatter',
                                mode: 'lines+markers',
                                // CSS
                                marker: {
                                    opacity: 0,  
                                },
                                line: {
                                    width: 2, //!@#$%^&*()
                                    color: (exportType.applyAsStack) ? 'rgb(76, 176, 72)' : '',
                                },
                                x: x,
                                y: y,
                                c: c,
                                a: a,
                                name: (exportType.applyAsStack) ? `Channel ${channel_index + 1}` : `Channel ${channel_index + 1}: ${filter_data[0]}`,
                                yaxis: 'y' + yaxis_string,
                            });

                            if (exportType.runData) {
                                processedDataToFront.push({
                                    type: 'scatter',
                                    mode: 'lines+markers',
                                    // CSS
                                    marker: {
                                        opacity: 0,
                                    },
                                    line: {
                                        width: 2, //!@#$%^&*()
                                        color: (exportType.applyAsStack) ? 'rgb(76, 176, 72)' : '',
                                    },
                                    x: x,
                                    y: y,
                                    c: c,
                                    name: (exportType.applyAsStack) ? `Channel ${channel_index + 1}` : `Channel ${channel_index + 1}: ${filter_data[0]}`,
                                    yaxis: 'y' + yaxis_string,
                                });

                            }
                        }

                        stackYAxisStringName = (exportType.applyAsStack) ? yaxis_string : '';
                        stackYAxisStringObj[filter_data[0]] = {
                            yaxis_string: stackYAxisStringName,
                            index: filter_index,
                        };
                    }
                });
            });

            // Work with the Values and Annotations
            let displayValuesAndAnnotations = function (stack_filters, appliedYAxisStringData = null, yaxisrange = null, layout_config = null) {
                // console.log('appliedYAxisStringData', appliedYAxisStringData);
                stack_filters.forEach(function (filter, filter_index) {
                    if (filter.get('values').get('models').length) {
                        let y_axis_string_data = appliedYAxisStringData[(filter_index - 1 >= 0) ? stack_filters[filter_index - 1].get('name') : 'default'];

                        let valueCounter = 0; // ToDo: ReCheck this when values and annotations are rechecked
                        let newAxis = {};
                        let x = new Array(),
                            y = new Array(),
                            y2 = new Array(),
                            a = new Array(),
                            l = new Array(),
                            c = new Array(),
                            xb = new Array(),
                            yb = new Array(),
                            xe = new Array(),
                            ye = new Array();

                        filter.get('values').get('models').forEach((point) => {
                            if (point.get('x') != null) {
                                c.push(point.get('ch'));
                                x.push(point.get('x'));
                                y.push(point.get('y'));
                                y2.push(point.get('y2'));
                                a.push(point.get('area'));
                                l.push(point.get('x').toLocaleString(undefined, { maximumFractionDigits: 2}));
                                xb.push(point.get('startx'));
                                yb.push(point.get('starty'));
                                xe.push(point.get('endx'));
                                ye.push(point.get('endy'));
                                valueCounter++;
                            }
                        });

                        newAxis['yaxis' + y_axis_string_data.yaxis_string] = {
                            autorange: true,
                            visible: false,
                            overlaying: 'y',
                            side: 'right',
                            rangemode: 'nonnegative',
                            showgrid: false,
                            showline: false,
                            showticklabels: true,
                            zeroline: true,
                            zerolinewidth: 1,
                        };
                        if (layout_config.hasOwnProperty('yaxis' + y_axis_string_data.yaxis_string)) {
                            newAxis['yaxis' + y_axis_string_data.yaxis_string] = layout_config['yaxis' + y_axis_string_data.yaxis_string];
                        }

                        Plotly.relayout(plotconfigs.id, newAxis);

                        Plotly.addTraces(plotconfigs.id, {
                            type: 'scatter',
                            mode: 'markers+text',
                            // CSS
                            marker: {
                                size: 10
                            },
                            c: c,
                            x: x,
                            y: y,
                            y2:y2,
                            a: a,
                            l: l,
                            text: l,
                            textposition:"top",
                            textfont: {
                                size:16,
                                color:"#FF0000"
                            },
                            showlegend: false,
                            yaxis: 'y' + y_axis_string_data.yaxis_string,
                            hoverinfo: `${filter.get('name')} Area: ${valueCounter}`,
                            name: `${filter.get('name')} Area: ${valueCounter}`,
                            //name: `${filter.get('name')} Point: ${valueCounter}`,
                        });

                        Plotly.addTraces(plotconfigs.id, {
                            type: 'scatter',
                            mode: 'markers',
                            // CSS
                            marker: {
                                symbol:142,
                                size: 30,
                                color:"#FF0000"
                            },
                            x: xb,
                            y: yb,
                            showlegend: false,
                            yaxis: 'y' + y_axis_string_data.yaxis_string,
                            hoverinfo: `${filter.get('name')} Area: ${valueCounter}`,
                            name: `${filter.get('name')} Area: ${valueCounter}`,
                            //name: `${filter.get('name')} Point: ${valueCounter}`,
                        });
                        Plotly.addTraces(plotconfigs.id, {
                            type: 'scatter',
                            mode: 'markers',
                            // CSS
                            marker: {
                                symbol:142,
                                size: 30,
                                color:"#FF0000"
                            },
                            x: xe,
                            y: ye,
                            showlegend: false,
                            yaxis: 'y' + y_axis_string_data.yaxis_string,
                            hoverinfo: `${filter.get('name')} Area: ${valueCounter}`,
                            name: `${filter.get('name')} Area: ${valueCounter}`,
                            //name: `${filter.get('name')} Point: ${valueCounter}`,
                        });
                        for (i=0;i<xb.length;i++){
                                var xi = [];
                                var yi = [];
                                xi.push(xb[i]);
                                xi.push(xe[i]);
                                yi.push(yb[i]);
                                yi.push(ye[i]);
                            Plotly.addTraces(plotconfigs.id, {
                                type: 'scatter',
                                mode: 'lines + markers',
                                marker: {
                                    opacity: 0,  
                                },
                                line: {
                                    width: 3, //!@#$%^&*()
                                    color: "#FF0000",
                                    dash:'dot'
                                },
                            x: xi,
                            y: yi,
                            showlegend: false,
                        });
                        }
                        if (exportType.runData) {
                            peaksAndAnnotationsToFront.push(
                                {
                                    type: 'scatter',
                                    mode: 'markers',
                                    // CSS
                                    marker: {
                                        size: 10
                                    },
                                    x: x,
                                    y: y,
                                    a: a,
                                    l:l,
                                    c:c,
                                    showlegend: false,
                                    yaxis: 'y' + y_axis_string_data.yaxis_string,
                                    hoverinfo: `${filter.get('name')} Point: ${valueCounter}`,
                                    name: `${filter.get('name')} Point: ${valueCounter}`,
                                    annotations: [
                                        {
                                          x: x,
                                          y: y,
                                          xref: 'x',
                                          yref: 'y',
                                          text: 'Annotation Text',
                                          showarrow: true,
                                          arrowhead: 7,
                                          ax: 0,
                                          ay: -40
                                        }
                                      ],
                                }
                            );
                        }
                    }


                    //ToDo: Write this once it has been defined!! //!@#$%^&*()
                    if (filter.get('annotations').get('models').length) {
                        console.log('We have an annotation!!');
                    }
                });
            };
            // console.log('data', plotconfigs.data_config);
            displayValuesAndAnnotations(selectedFilterStack.get('filters').get('models'), stackYAxisStringObj, plotconfigs.layout_config.yaxis.range, plotconfigs.layout_config);

            this.appliedFilters = selectedFilterStack;
            this.appliedFiltersAsStack = exportType.applyAsStack;
            this.appliedFiltersDateTime = utils.Stamp();

            // This passes the data to DataPanel.js to update the modal window
            if (exportType.runData) {
                this.set('model.runDataForPlotting', { processedDataToFront: processedDataToFront, peaksAndAnnotationsToFront: peaksAndAnnotationsToFront, newLayoutToFront: newLayoutToFront });
                this.doPassRunDataToModal(
                    {
                        model: this.get('model')
                    }
                );
            }
        }

        return true;
    },

    setOriginalConfig: function () {
        /**
         * function: setOriginalConfig
         * 
         * This brings the DataViewer plot back to its original configuration.
         * It erases all traces that come from the processed data.
         */
        let plotconfigs = this.$.DataViewer.getPlotConfig();
        if (plotconfigs.data_config.length > this.get('defaultPlotTraces')) {
            console.log("Restoring Plot to Original Configuration");

            // let update1 = {
            //     'marker.opacity': 0,
            // };
            // Plotly.restyle(plotconfigs.id, update1, 4);
            let update = {
                'line.dash': '',
                'line.color': '',
            };
            Plotly.restyle(plotconfigs.id, update, [0, 1, 2, 3]);

            var layout_config = {
                autosize: false,
                showlegend: false,
                paper_bgcolor: 'rgb(20,20,20)',
                plot_bgcolor: 'rgb(20,20,20)',
                margin: { l: 8, r: 0, b: 0, t: 0, pad: 0 },
                xaxis: {
                    autorange: true,
                    rangemode: 'tozero',
                    showgrid: false,
                    showline: false,
                    showticklabels: true,
                    zeroline: true,
                    zerolinewidth: 1,
                },
                yaxis: {
                    autorange: true,
                    rangemode: 'nonnegative',
                    showgrid: false,
                    showline: false,
                    showticklabels: true,
                    zeroline: true,
                    zerolinewidth: 1,
                },
                yaxis2: {
                    overlaying: 'y',
                    side: 'right',
                },
            };
            Plotly.relayout(plotconfigs.id, layout_config);

            // Delete old Traces
            for (let trace = plotconfigs.data_config.length; this.get('defaultPlotTraces') < trace; trace--) {
                // console.log('plotDefaultTraces trace:', plotconfigs.data_config[trace - 1]);
                Plotly.deleteTraces(plotconfigs.id, trace - 1);
            }
            Plotly.newPlot(
                plotconfigs.id,
                plotconfigs.data_config,
                plotconfigs.layout_config,
                plotconfigs.global_config
            );
        }

        this.appliedFilters = null;
        this.appliedFiltersAsStack = false;
        this.appliedFiltersDateTime = null;
    },
    setNoSelections: function (filterControl = true, dataControl = true, reportControl = true, resetFilterstoDefaultStack = true) {
        /**
         * function: setNoSelections
         * 
         * This unselects all checkboxes
         */
        this.$.DataControl.setNoSelections(filterControl, dataControl, reportControl, resetFilterstoDefaultStack);
    },
    callExportReport: function () {
        /**
         * Call's DataControl.js' function
         *      This activates the default export configuration
         *      And then exports the data
          */
        this.$.DataControl.callExportReport();
    },
    saveDataAsFile: function () {
        /**
         * Call's DataControl.js' function 
         *      This activates the default save configuration
         *      And then saves the data
         */
        this.$.DataControl.saveDataAsFile();
    },
    triggerGenerateReport: (s, e) => {
        /**
         * function: triggerGenerateReport
         * 
         * Triggers an EnyoJS event that will
         * trigger the Export Document Modal
         */
        let that = e.originator.owner;
        that.doRequestExportDocModal({ model: that.model, sentFromGenerateReportTrigger: true, });

        return true;
    },
    

});
