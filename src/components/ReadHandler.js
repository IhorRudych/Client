/**/

var kind = require('enyo/kind'),
    bind = require('enyo/utils').bind,
    EnyoJob = require('enyo/job');

var Packet = require('../packets.js'),
    device = require('./UsbDevice.js');

class Dispatcher {
    constructor() {
        this.buffer = [];
        this.debug = '';
        this.callbacks = {};
        this.notifications = [];
    }
    factory(data) {
        var cmd = null;
        if (Packet.IsDebug(data)) {
            cmd = new Packet.CommandDebug();
            cmd.depacketize(data);
        }
        else if (Packet.IsUdv(data)) {
//            console.log("received data");
            cmd = new Packet.CommandUdv();
            cmd.depacketize(data);
        }
        else if (Packet.IsPrs(data)) {
//            console.log("received pressure");
            cmd = new Packet.CommandPrs();
            cmd.depacketize(data);
        }
        else if (Packet.IsNotify(data)) {
//            console.log("received notify");
            cmd = new Packet.CommandNotify();
            cmd.depacketize(data);
        }
        else if (Packet.IsEvent(data)) {
            console.log("received event");
            cmd = new Packet.CommandEvent();
            cmd.depacketize(data);
        }
        else {
            console.log('unknown packet %s%s %O', String.fromCharCode(data[0]), String.fromCharCode(data[1]), data);
        }
        return cmd;
    }
    process(data) {
        var PACKET_SIZE = 16;

        // Accumulate received data stream for packetization
        this.buffer = this.buffer.concat(data);

        // Run each new data buffer through the command factory (depacketization)
        var commands = {};
        while (this.buffer.length >= PACKET_SIZE) {
            var buffer = this.buffer.splice(0, PACKET_SIZE);
            var cmd = this.factory(buffer);
            if (cmd !== null) {
                if (cmd.name == 'Debug') {
                    this.debug += cmd.stringify();
                }
                else if (cmd.name == 'Notify') {
                    var func = this.notifications.shift();
                    if (typeof func == 'function') {
                        func();
                    }
                    else {
                        console.log("Error: Received an unhandled notification");
                    }
                }
                else {
                    if (!(cmd.name in commands)) {
                        commands[cmd.name] = [];
                    }
                    commands[cmd.name].push(cmd);
                }
            }
            else {
                console.log("unknown command %O", cmd);
            }
        }

        // Break up the debug strings and print them
        if (this.debug.indexOf('\r\n') !== -1 ) {
            var strings = this.debug.split('\r\n');
            for (var i = 0; i < strings.length - 1; i++) {
                console.log(strings[i]);
            }
            this.debug = strings[strings.length-1];
        }

        // Issue callbacks
        for (name in commands) {
            if (name in this.callbacks) {
                for (var id in this.callbacks[name]) {
                    var callback = this.callbacks[name][id];
                    callback(commands[name]);
                }
            }
        }
    }
}

var ReadHandler = module.exports = kind({
    name: 'ReadHandler',
    published: {
    },
    callbacks: {},
    dispatcher: new Dispatcher(),
    constructor: function() {
        this.inherited(arguments);
    },
    create: function() {
        this.inherited(arguments);
    },
    start: function() {
        this.periodic();
    },
    stop: function() {
        EnyoJob.stop("Periodic");
    },
    register: function(inName, inFunction) {
        if (!(inName in this.dispatcher.callbacks)) {
            this.dispatcher.callbacks[inName] = {};
        }
        var nextIndex = Object.keys(this.dispatcher.callbacks[inName]).length + 1;
        this.dispatcher.callbacks[inName][nextIndex] = inFunction;
        return nextIndex;
    },
    addNotification: function(inFunction) {
        this.dispatcher.notifications.push(inFunction);
    },
    periodic: function() {
        var PERIOD = 1000;
        EnyoJob("Periodic", bind(this, "periodic"), PERIOD);
        EnyoJob.throttle("ReadJob", bind(this, "readJob"), PERIOD / 2);
    },
    readJob: function() {
        var that = this;
        device.read().then((result) => {
            if (result.length == 1) {
                var isBinaryEncoded = false;
                var decoded = result[0];
                if (isBinaryEncoded) {
                    decoded = [].slice.call(new Int8Array(result[0]));
                }
                if (decoded.length > 0) {
                    that.dispatcher.process(decoded);
                }
            }
        })
        .catch((err) => {
            //console.log('read errors %O', err);
        });
    }
});
