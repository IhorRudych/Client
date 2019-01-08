var kind = require('enyo/kind'),
    bind = require('enyo/utils').bind,
    FittableRows = require('layout/FittableRows'),
    FittableColumns = require('layout/FittableColumns'),
    Button = require('onyx/Button'),
    Slideable = require('layout/Slideable'),
    IconButton = require('onyx/Icon'),
    EnyoImage = require('enyo/Image'),
    ToolDecorator = require('enyo/ToolDecorator'),
    SvgRoot = require('svg/Root'),
    SvgText = require('svg/Text'),
    SvgTspan = require('svg/Tspan'),
    GraphPanel = require('./GraphPanel.js'),
    Data = require('./Data.js'),
    Timer = require('./Timer.js'),
    TimeDisplay = require('./TimeDisplay.js'),
    PresetData = require('../data/PresetData.js'),
    DataViewer = require('./DataViewer.js'),
    NewViewer = require('./NewViewer.js'),
    QuickStop = require('./QuickStop.js'),
    Packet = require('../packets.js'),
    UsbDevice = require('./UsbDevice.js'),
    Method = require('./Method.js'),
    utils = require('../utils.js'),
    JSONfn = require('./JSONfn.js'),
    localForageKeys = require('./localForageKeys.js');

// FIXME: embed the channel labels into the channel structure
var channelLabels = {
    0: 'UV0',
    1: 'UV1',
    2: 'PRESSURE A',
    3: 'PRESSURE B',
    4: 'SYRINGE A',
    5: 'SYRINGE B',
    6: 'FLOW',
};

let convertADCtoPressure = function (y, max, toBar) {
    /**
     *  function: convertADCtoPressure
     * 
     *  convertADCtoPressure converts the raw ADC to Pressure
     * 
     *  See TestPanel.js for duplicate lines of code
     */
    var pressure = ((4.096 * y / 2047.0) - 0.5) * 3750;
    if (pressure <= 0) {
        pressure = 0;
    }
    if (toBar) {
        return Number(pressure / 14.503773800722).toFixed(0) + ' bar';
    }
    else {
        return Number(pressure).toFixed(0) + ' PSI';
    }
};

let convertADCtoPosition = function (y, max) {
//    var position = (6.144 / 5.0) * y / max;
//    return Number(position).toFixed(0) + ' %';
    return Number(y).toFixed(0);
};

let convertADCtoPercentage = function (y, min, max, toRaw) {
    if (toRaw) {
        return Number(y).toFixed(0);
    }
    else {
        var ratio = 100.0 - (100.0 * (y - min) / (max - min));
        if (ratio < 0) {
            ratio = 0.0;
        }
        else if (ratio > 100) {
            ratio = 100.0;
        }
        return Number(ratio).toFixed(1) + ' %';
    }
};

var toBar = false;
var toRaw = false;
var channelConvert = {
    0: function (y) { return Number(y).toFixed(2); },
    1: function (y) { return Number(y).toFixed(2); },
    2: function (y) { return convertADCtoPressure(y, 2047, toBar); },
    3: function (y) { return convertADCtoPressure(y, 2047, toBar); },
    4: function (y) { return convertADCtoPercentage(y, Method.RefillDefaults.limit_full, Method.RefillDefaults.limit_empty, toRaw); },
    5: function (y) { return convertADCtoPercentage(y, Method.RefillDefaults.limit_full, Method.RefillDefaults.limit_empty, toRaw); },
    6: function (y) { return Number(y / 100).toFixed(2) + ' uL/min'; },
};

module.exports = kind({
    name: 'tst.TestRunPanel',
    kind: FittableColumns,
    classes: 'enyo-fit data-right-column',
    isRunning: false,
    published: {
        model: null,
        trace: null,
        pressureTime: null,
        runTime: null
    },
    handlers: {},
    events: {
        onStopPressed:       '',
        onJumpToFinishedRun: '',
        onDisplayLoader:     '',
        onGpioRun:           '',
    },
    components: [
        { name: 'Viewer', kind: NewViewer, enable_gl: true, staticPlot: false, classes: 'marker run-width' },
        { style: 'width:5%;' },
        { // It might be good to align the Timer and Stop components instead of stacking them.
            kind: FittableRows, classes: 'text-center', style: 'padding-right:6%;', components: [
                { name: 'Pretimer', kind: TimeDisplay, showing: true },
                { name: 'Timer', kind: TimeDisplay, showing: false },
                { name: 'Ticker', kind: Timer, onTick: 'tickHandler', onDone: 'doneHandler', showing: false },
                { name: 'Stop', kind: QuickStop, showing: false, ontap: 'stopHandler' },
                {
                    name: 'RecentValues', kind: FittableRows, style: 'padding-right: 6%; padding-left: 5%;line-height:1;', components: [
                        { name: 'Channel0', content: channelLabels[0] + '<br>' + channelConvert[0](0), style: 'font-size: 17px;', classes: 'run-text', allowHtml: true, showing: false },
                        { name: 'Channel1', content: channelLabels[1] + '<br>' + channelConvert[1](0), style: 'font-size: 17px;', classes: 'run-text', allowHtml: true, showing: false },
                        { name: 'Channel2', content: channelLabels[2] + '<br>' + channelConvert[2](0), style: 'font-size: 17px;', classes: 'run-text', allowHtml: true, showing: true, ontap: 'handlePressureUnitToggle' },
                        { name: 'Channel3', content: channelLabels[3] + '<br>' + channelConvert[3](0), style: 'font-size: 17px;', classes: 'run-text', allowHtml: true, showing: true, ontap: 'handlePressureUnitToggle' },
                        { name: 'Channel4', content: channelLabels[4] + '<br>' + channelConvert[4](0), style: 'font-size: 17px;', classes: 'run-text', allowHtml: true, showing: true, ontap: 'handlePositionUnitToggle' },
                        { name: 'Channel5', content: channelLabels[5] + '<br>' + channelConvert[5](0), style: 'font-size: 17px;', classes: 'run-text', allowHtml: true, showing: true, ontap: 'handlePositionUnitToggle' },
                        { name: 'Channel6', content: channelLabels[6] + '<br>' + channelConvert[6](0), style: 'font-size: 17px;', classes: 'run-text', allowHtml: true, showing: true },
                    ],
                },
            ],
        },
    ],
    handlePressureUnitToggle: function () {
        toBar = toBar ? false : true;
    },
    handlePositionUnitToggle: function () {
        toRaw = toRaw ? false : true;
    },
    bindings: [
        { from: 'model.name', to: '$.Pretimer.title' },
        { from: 'model.name', to: '$.Timer.title' },
        { from: 'trace', to: '$.Viewer.model' },
        { from: 'pressureTime', to: '$.Pretimer.elapsed', transform: function(v) {
            if (v === null) {
                return '-';
            }
            else {
                return (60 * Number(v)).toFixed(0);
            }
        }},
        { from: 'runTime', to: '$.Timer.elapsed', transform: function(v) {
            if (v === null) {
                return '-';
            }
            else {
                return (60 * Number(v)).toFixed(0);
            }
        }}
    ],
    constructor: function () {
        this.inherited(arguments);
        this.streamEpoch = 0;
        this.lastStreamId = 0;

    },
    create: function () {
        this.inherited(arguments);
        this.app.$.ReadHandler.register('Udv', bind(this, "dataHandler"));
        this.app.$.ReadHandler.register('Prs', bind(this, "pressureHandler"));
        this.app.$.ReadHandler.register('Event', bind(this, "eventHandler"));
    },
    handleResize: function () {
        this.inherited(arguments);
    },
    rendered: function () {
        this.inherited(arguments);
    },
    start: function () {
        // Create a new trace
        var method = this.get('model');
        var user = this.app.$.Session.get('user');
        var device = this.app.$.NetworkManager.get('connectedDevice');
        var device_name = 'Test Device 001';
        var volumes = method.totalVolume();
        if (device) {
            device_name = device.get('name');
        }
        var that = this;
        
        function setTrace() {
            var trace = new Data.TraceInfoFactory(PresetData, method, user, device_name);
            that.set('trace', trace);
            return trace;
        }

        // Setup the instantaneous displays
        // var that = this;
        function update(inSender, inName, inChange) {
            if (inChange.models.length > 0) {
                var value = inChange.models[inChange.models.length - 1].get('y');
                var label = channelLabels[this.channel];
                var convertedValue = channelConvert[this.channel](value);
                that.$['Channel' + this.channel].set('content', label + '<br>' + convertedValue);
            }
        }
        function triggerRun(trace) {
            var i = 0;
            for (var channel of trace.get('channels')) {
                var boundUpdate = update.bind({ channel: i });
                channel.get('trace').addListener('add', boundUpdate);
                i++;
            }

            // that.expectedStreamId = 0;

            // Show the Quick Stop component
            // NOTE: change false to true to bring back the QuickStop button
            that.$.Stop.set('showing', false);

            // Reset the stream epoch
            this.streamEpoch = 0;
            this.lastStreamId = 0;


            // Start the test timer
            that.isRunning = true;
            var device = that.app.$.NetworkManager.get('connectedDevice');
            if (device && method.get('prepressurize')) {
                that.app.$.ReadHandler.addNotification(bind(that, "pressureDoneHandler"));
                that.app.$.ReadHandler.addNotification(bind(that, "doneHandler"));
                that.$.Timer.set('showing', false);
                that.$.Pretimer.set('showing', true);
                that.$.Pretimer.set('message', 'Pressurizing');
            }
            else {
                that.app.$.ReadHandler.addNotification(bind(that, "doneHandler"));
                that.pressureDoneHandler();
            }

            // Send the commands down to the hardware
            // TODO: use the actual device
            method.set('session', that.app.$.Session);
            method.writeCommands(null);

            // NOTE: Remove phase when testing complete.
            that.phase = 300 * Math.PI * Math.random();
        }

        // Get method's commands
        let saveMethodCommands = [];
        method.get('commands').forEach(element => {
            saveMethodCommands.push({
                id: element.get('id'),
                x: element.get('x'),
                y: element.get('y'),
                flow: element.get('flow'),
                direction: element.get('direction'),
                valves_a: element.get('valves_a'),
                valves_b: element.get('valves_b'),
                valves_c: element.get('valves_c')
            });
        });
        saveMethodCommands.push({
                id: saveMethodCommands[saveMethodCommands.length - 1].id + 1,
                x: saveMethodCommands[saveMethodCommands.length - 1].x + 0.3,
                y: 0,
                flow: saveMethodCommands[saveMethodCommands.length - 1].flow,
                direction: saveMethodCommands[saveMethodCommands.length - 1].direction,
                valves_a: 3,
                valves_b: 1,
                valves_c: saveMethodCommands[saveMethodCommands.length - 1].valves_c
         });
        // Update names based on use
        let defaultMethods = that.owner.owner.$.DataPanel.get('defaultMethods');
        let methodLibrary = that.owner.owner.$.TestPanel.get('collection');
        let models = {};
        methodLibrary.get('models').forEach(model => {
            models[model.get('name')] = model;
        });

        let methodName = method.get('name');
        if (defaultMethods.hasOwnProperty(methodName)) {
            if (JSONfn.stringify(saveMethodCommands) != JSONfn.stringify(defaultMethods[methodName])) {
                method.set('name', 'Modified' + ' ' + methodName);
            }
            triggerRun(setTrace());
        } else {
            that.owner.owner.$.DataPanel.getSavedMethodKeys().then(keys => {
                if (keys.includes(methodName)) {
                    let savedMethods = localForageKeys[localForageKeys.savedMethods + localForageKeys.suffix];
                    savedMethods.getItem(methodName).then(value => {
                        if (JSONfn.stringify(saveMethodCommands) != JSONfn.stringify(value.commands)) {
                            method.set('name', 'Modified' + ' ' + methodName);
                        }
                        triggerRun(setTrace());
                    });
                } else {
                    triggerRun(setTrace());
                }
            });
        }

    },
    busy: function () {
        return this.isRunning;
    },
    stopHandler: function () {
        var cmd = new Packet.CommandDaq(0);
        cmd.write(UsbDevice);

        var trace = this.get('trace');
        trace.set('cancelled', true);
        this.doStopPressed({ model: this.get('model') });
        this.saveToIndexedDB();
        this.app.testing(false);
    },
    tickHandler: function (inSender, inEvent) {
        var device = this.app.$.NetworkManager.get('connectedDevice');
        if (device) {
            return;
        }

        var channels = this.get('trace.channels');
        var numPoints = this.get('trace.method').totalTime();

        for (var i = 0; i < channels.length; ++i) {
            var channel = channels[i];
            if (channel.length > 0) {
                var lastValue = channel.get('trace').at(channel.length - 1).get('y');
                this.$['Channel' + i].set('content', channelLabels[i] + '<br>' + channelConvert[i](lastValue));
            }
        }

        // NOTE: This is just here to generate "fake" input data, Remove it
        // when initial testing is complete.
        for (var channel of channels) {
            var x = utils.secondsToMinutes(inEvent.tick - 1);
            var noise = Math.random();
            // NOTE: Periodically generate "peaks", the parameters below were
            // chosen to have peaks be clearly larger magnitude, but not so 
            // large as to make the rest of the data so small that you can't
            // see it's underlying sine wave pattern.
            if (Math.random() < 0.05) {
                var y = 2000 * (Math.random() + 1);
            }
            else {
                var y = 1000 * Math.abs((Math.sin((x * 200 * Math.PI / 10) + this.phase) + noise) / 4);
            }
            var point = new Data.TracePoint({ x: x, y: y });
            channel.get('trace').add(point);
        }
    },
    doneHandler: function () {
        console.log("METHOD complete");
        var cmd = new Packet.CommandDaq(0);
        cmd.write(UsbDevice);

        this.isRunning = false;

        // Hide the Quick Stop component
        this.$.Stop.set('showing', false);

        // Display Loader
        //this.doDisplayLoader();

        // Jump to file in the DATA tab
        let that = this;
        console.log("Starting jump delay");
        setTimeout(
            function () {
                console.log("Emitting doJumpToFinishedRun");
                that.doJumpToFinishedRun({ trace: that.get('trace') });
            },
            500);

        // Automatically save the file ?? //!@#$%^&*() ToDo:
        this.saveToIndexedDB();
    },
    saveToIndexedDB: function () {
        
        let saveMethodCommands = [];
        var model = this.get('trace');
        model.get('method').get('commands').forEach(element => {
            saveMethodCommands.push({
                id: element.get('id'),
                x: element.get('x'),
                y: element.get('y'),
                flow: element.get('flow'),
                direction: element.get('direction'),
                valves_a: element.get('valves_a'),
                valves_b: element.get('valves_b'),
                valves_c: element.get('valves_c')
            });
        });

        // Format Channels' Data
        let channels = {};
        model.get('channels').forEach((channel, i) => {
            let x = [],
                y = [];
            channel.get('trace').forEach(point => {
                x.push(point.get('x'));
                y.push(point.get('y'));
            });
            channels[i] = { x: x, y: y };
        });

        // Compile all data so save
        let saveModel = {
            path: model.get('path'),
            method: {
                name: model.get('method.name'),
                commands: saveMethodCommands,
            },
            date: model.get('date'),
            user: model.get('user'),
            device: model.get('device'),
            channels: channels,
            favorite: model.get('favorite'),
            cancelled: model.get('cancelled'),
        };

        // Check if current stack already exists in Array
        let savedData = localForageKeys[localForageKeys.savedData + localForageKeys.suffix];
        savedData.setItem(model.get('path'), saveModel, function (err) {
            // if err is non-null, we got an error
            if (err) {
            }
        });
    },
    pressureDoneHandler: function () {
        console.log("PRESSURIZATION complete");
        var method = this.get('model');
        this.$.Pretimer.setShowing(false);
        var device = this.app.$.NetworkManager.get('connectedDevice');
        if (device) {
            this.$.Timer.setShowing(true);
        }
        else {
            this.$.Timer.setShowing(false);
            this.$.Ticker.setShowing(true);
            this.$.Ticker.set('max', utils.minutesToSeconds(method.totalTime()));
            this.$.Ticker.start();
        }
    },
    pressureHandler: function (commands) {
        var trace = this.get('trace');
        var maxTime = this.get('trace.method').totalTime();
        var channels = {};
        for (prs of commands) {
            // NOTE: We are deriving the time received from the streamId since
            // that's the most accurate thing that we have access to. Samples are
            // therefore time = streamID / 5 
            var time_sec = prs.streamId / 5;
            var time_min = utils.secondsToMinutes(time_sec);
            var point = { x: time_min, y: prs.value };
            // NOTE: Sometimes we get a few samples after the maximum test time, just drop those extra samples.
            if (!(prs.channelId in channels)) {
                channels[prs.channelId] = [];
            }
            channels[prs.channelId].push(point);
        }

        this.set('pressureTime', time_min);

        for (channelId in channels) {
            trace.get('channels')[channelId].get('trace').add(channels[channelId]);
        }
    },
    dataHandler: function (commands) {
        var MAX_VALUE = 4095;
        var trace = this.get('trace');
        if (trace === null) {
            console.log('error: trace is null');
            return;
        }
        var maxTime = this.get('trace.method').totalTime();
        var channels = {};
        for (udv of commands) {
            // NOTE: Flush out any old packets that were still sitting in the buffer
            // TODO: The code below should be un-commented at a future date. 
            // There is a genuine need to flush any old packets.
            //            if (udv.streamId != this.expectedStreamId) {
            //                console.log("flushing old packets");
            //                continue;
            //            }
            // this.expectedStreamId++;
            // NOTE: We are deriving the time received from the streamId since
            // that's the most accurate thing that we have access to. Samples are
            // numbered across 2 channels nd oversampled by 50x, 
            // therefore time = streamID / 50
            var time_sec = udv.streamId / (2 * 25.0);
            var time_min = utils.secondsToMinutes(time_sec);
            var point = { x: time_min, y: MAX_VALUE - udv.value };
            // NOTE: Sometimes we get a few samples after the maximum test time, just drop those extra samples.
            if (!(udv.channelId in channels)) {
                channels[udv.channelId] = [];
            }
            channels[udv.channelId].push(point);
        }

        this.set('runTime', time_min);

        for (channelId in channels) {
            trace.get('channels')[channelId].get('trace').add(channels[channelId]);
        }
    },
    dumpEvent: function(cmd) {
        console.log(cmd);
        console.log("Automate bit: "   + this.app.automateBit);
        console.log("Automate state: " + this.app.automateActiveState);
        console.log("Event bit: "      + (this.app.automateBit & command.value));
        console.log("New GPIO: "       + cmd.value);
        console.log("Changed: "        + cmd.typeId);
        console.log("Auto Changed: "   + (cmd.typeId & this.app.automateBit));
        console.log("Auto State: "     + (cmd.value  & this.app.automateBit));
    },
    eventHandler: function(commands) {
        console.log('received event packet(s): ' + commands.length);
        console.log('commands: ');
        console.log(commands);
        command = commands[0];
        if (commands.length > 1)
        {
            command = commands[commands.length - 1];
        }

        newGpio     = command.value;
        changedGpio = command.typeId;
        autoChanged = (changedGpio & this.app.automateBit);
        autoState   = (newGpio     & this.app.automateBit);

        this.app.curGpio = newGpio;

        if (!this.app.isAutomated())
        {
            console.log("IGNORED.  Automation is OFF.");
            this.dumpEvent(command);
        }
        else if (this.app.isRunningTest())
        {
            console.log("IGNORED, Automation is ON, but test is RUNNING.");
            this.dumpEvent(command);
        }
        else if (!autoChanged
             || (autoState != this.app.automateActiveState))
        {
            console.log("Ignored, Automation is ON, test is NOT-RUNNING, but event is in INACTIVE state.");
            this.dumpEvent(command);
        }
        else
        {
            console.log("ACCEPTED, Automation is ON, test is NOT-RUNNING, and event is in ACTIVE state.");
            this.dumpEvent(command);
            this.doGpioRun(this, command);
        }
    },
});
