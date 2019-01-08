var kind = require('enyo/kind'),
    Model = require('enyo/Model'),
    Collection = require('enyo/Collection'),
    Store = require('enyo/Store'),
    Packet = require('../packets.js'),
    UsbDevice = require('./UsbDevice.js'),
    Settings = require('../data/Settings.js'),
    utils = require('../utils.js');

function convertTime(v) {
    // Firmware units for time are whole seconds
    var r = parseInt(Number(utils.minutesToSeconds(v)).toFixed(0));
    console.log("Firmware time %d", r);
    return r;
}

function convertRatio(v) {
    // Firmware units for ratio are in hundreds of a percent
    // 10% -> 1000
    var r = parseInt(100 * parseFloat(Number(v).toFixed(2)));
    console.log("Firmware ratio %d", r);
    return r;
}

function convertFlow(v) {
    // Firmware units for flow rate are in hundreds of uL/min
    // 0.77 uL/min -> 77
    // 10.0 uL/min -> 1000
    var r = parseInt(100 * parseFloat(Number(v).toFixed(2)));
    console.log("Firmware flow %d", r);
    return r;
}

function linearInterpolation(x, p0, p1) {
    return p0.y + (x - p0.x) * ((p1.y - p0.y) / (p1.x - p0.x));
}

function Method2Commands(method) {
    var data = method.get('commands');

    var commands = [];
    var last = data.at(0);

    function ValueHelper(a, b, c, d) {
        return ((a & 3) << 0) | ((b & 3) << 2) | ((c & 3) << 4) | ((d & 3) << 6);
    }

    var refill = method.get('refill');
    if (refill) {
        var volumes = method.totalVolume();
        var refill_volume_a = volumes.a + refill.volume_a;
        var refill_volume_b = volumes.b + refill.volume_b;
        console.log('Refilling system %O %O', refill, volumes);
        console.log('Volume A: %f', refill_volume_a);
        console.log('Volume B: %f', refill_volume_b);
        commands.push(new Packet.CommandDaq(2));
        var a = parseInt(10 * Number(refill_volume_a));
        var a0 = (a >> 0) & 0xff;
        var a1 = (a >> 8) & 0xff;
        var b = parseInt(10 * Number(refill_volume_b));
        var b0 = (b >> 0) & 0xff;
        var b1 = (b >> 8) & 0xff;
        var c = parseInt(Number(refill.limit_empty));
        var c0 = (c >> 0) & 0xff;
        var c1 = (c >> 8) & 0xff;
        var d = parseInt(Number(refill.limit_full));
        var d0 = (d >> 0) & 0xff;
        var d1 = (d >> 8) & 0xff;
        var e = parseInt(10 * Number(refill.post_flow));
        var e0 = (e >> 0) & 0xff;
        var e1 = (e >> 8) & 0xff;
        var f = Number(refill.post_ratio);
        var g = parseInt(1000 * Number(refill.post_time));
        var g0 = (g >> 0) & 0xff;
        var g1 = (g >> 8) & 0xff;
        commands.push(new Packet.CommandRefill([a0, a1, b0, b1, c0, c1, d0, d1, e0, e1, f, g0, g1]));
    }

    var method_flow = data.at(0).get('flow');
    if (method.get('prepressurize')) {
        console.log('Pre-pressurizing system');
        commands.push(new Packet.CommandDaq(2));
        let MAX_PRESSURE = 7000.0;
        var user_flow = Number(method.get('session').pressurize.get('phase2_flow_rate'));
        var a = Number(method.get('session').pressurize.get('target_pressure_a'));
        let p0 = {x: 0.0, y: 0.0};

        // Handle scaling of pressure A
        if (isNaN(a)) {
            var p1a = {
                x: Number(method.get('session').pressurize.get('interpolation_x')),
                y: Number(method.get('session').pressurize.get('interpolation_y'))
            };
            a = Math.trunc(linearInterpolation(method_flow, p0, p1a));
            if (a > MAX_PRESSURE) {
                console.log("warning: clamping pressure A %f to %f", a, MAX_PRESSURE);
                a = MAX_PRESSURE;
            }
        }
        console.log("Pressure A %f", a);
        a /= 100;

        // Handle scaling of pressure B
        var b = Number(method.get('session').pressurize.get('target_pressure_b'));
        if (isNaN(b)) {
            var p1b = {
                x: Number(method.get('session').pressurize.get('interpolation_x')),
                y: 0.95 * Number(method.get('session').pressurize.get('interpolation_y'))
            };
             b = Math.trunc(linearInterpolation(method_flow, p0, p1b));
            if (b > MAX_PRESSURE) {
                console.log("warning: clamping pressure B %f to %f", b, MAX_PRESSURE);
                b = MAX_PRESSURE;
            }
        }
        console.log("Pressure B %f", b);
        b /= 100;

        var c = Number(method.get('session').pressurize.get('error_band'));
        var c0 = (c >> 0) & 0xff;
        var c1 = (c >> 8) & 0xff;
        var d = 10 * Number(method.get('session').pressurize.get('phase0_flow_rate'));
        var d0 = (d >> 0) & 0xff;
        var d1 = (d >> 8) & 0xff;
        var e = 10 * Number(method.get('session').pressurize.get('phase1_flow_rate'));
        var e0 = (e >> 0) & 0xff;
        var e1 = (e >> 8) & 0xff;
        var f = 10 * method_flow;
        if (!isNaN(Number(user_flow))) {
            f = 10 * user_flow;
        }
        console.log("flow rate %O", f);
        var f0 = (f >> 0) & 0xff;
        var f1 = (f >> 8) & 0xff;
        commands.push(new Packet.CommandLoad([a, b, c0, c1, d0, d1, e0, e1, f0, f1, 0, 0, 0]));
        var a = Array(13).fill(0);
        a[0] = 'D';
        a[1] = 'O';
        a[2] = 'N';
        a[3] = 'E';
        commands.push(new Packet.CommandNotify(a));
    }

    commands.push(new Packet.CommandDaq(3));
    commands.push(new Packet.CommandSet(Settings.Address('flow'), 4, convertFlow(method_flow)));
    commands.push(new Packet.CommandSet(Settings.Address('direction'), 4, data.at(0).get('direction')));
    console.log("Firmware direction %d", data.at(0).get('direction'));
    var value = ValueHelper(data.at(0).get('valves_a'), data.at(0).get('valves_b'), 0, 0);
    console.log("Firmware valve %d", value);
    commands.push(new Packet.CommandValve(0, value));

    // take pairwise diffs and set up the commands
    for (var i = 1; i < data.length; i++) {
        // generate the pump/wait/set commands
        var y_diff = data.at(i).get('y') - last.get('y');
        var t_diff = data.at(i).get('x') - last.get('x');
        if (t_diff != 0) {
            commands.push(new Packet.CommandPump(convertTime(t_diff), convertRatio(data.at(i).get('y')), convertRatio(last.get('y'))));
        }

        // set the flow rate
        var f_diff = data.at(i).get('flow') - last.get('flow');
        if (f_diff != 0) {
            commands.push(new Packet.CommandSet(Settings.Address('flow'), 4, convertFlow(data.at(i).get('flow'))));
        }
        // set the direction
        var d_diff = data.at(i).get('direction') - last.get('direction');
        if (d_diff != 0) {
            console.log("Firmware direction %d", data.at(i).get('direction'));
            commands.push(new Packet.CommandSet(Settings.Address('direction'), 4, data.at(i).get('direction')));
        }
        // handle the valve state changes
        var v_diff = {};
        v_diff.a = data.at(i).get('valves_a') - last.get('valves_a');
        v_diff.b = data.at(i).get('valves_b') - last.get('valves_b');
        if (v_diff.a != 0 || v_diff.b != 0) {
            value = ValueHelper(data.at(i).get('valves_a'), data.at(i).get('valves_b'), 0, 0);
            console.log("Firmware valve %d", value);
            commands.push(new Packet.CommandValve(0, value));
        }

        last = data.at(i);
    }
    commands.push(new Packet.CommandDaq(0));
    var a = Array(13).fill(0);
    a[0] = 'D';
    a[1] = 'O';
    a[2] = 'N';
    a[3] = 'E';
    commands.push(new Packet.CommandNotify(a));
    return commands;
}

var MethodCommand = exports.Command = kind({
    name: 'MethodCommand',
    kind: Model,
    primaryKey: 'id',
    attributes: {
        id: null,
        x: null,
        y: null,
        flow: null,
        direction: null,
        valves_a: null,
        valves_b: null,
    }
});

var MethodCommands = exports.Commands = kind({
    name: 'MethodCommands',
    kind: Collection,
    model: MethodCommands
});

var refill_defaults = exports.RefillDefaults = {
    volume_a: 15,
    volume_b: 15,
    limit_empty: 1675,
    limit_full: 25,
    post_flow: 50.0,
    post_ratio: 50.0,
    post_time: 6.0,
};

var Method = exports.Method = kind({
    name: 'Method',
    kind: Model,
    primaryKey: 'id',
    attributes: {
        name: 'Empty Method',
        addr: null,
        commands: null,
        refill: null,
        prepressurize: true,
        unlocked: false,
        dragAndDropPoints: true,
        session: null,
    },
    constructor: function() {
        this.inherited(arguments);
        this.set('refill', JSON.parse(JSON.stringify(refill_defaults)));
        //console.log('method %O', this);
    },
    computed: {
        totalTime: ['commands'],
        totalVolume: ['commands']
    },
    pressureTime: function() {
        // NOTE: This must match the total time of the static pressure commands from staticPrePessurization
        return 2;
    },
    totalVolume: function() {
        // Find the fluid volume dispensed during the method;
        var last_command = null;
        var commands = this.get('commands');
        var volume_a = 0.0;
        var volume_b = 0.0;
        commands.forEach(function (command) {
            if (last_command !== null) {
                var flow = last_command.get('flow');
                var x0 = last_command.get('x');
                var y0 = last_command.get('y');
                var x1 = command.get('x');
                var y1 = command.get('y');
                var area = 0.0;
                if (y0 == y1) {
                    // Area of a rectangle
                    var width = x1 - x0;
                    var flow_a = flow * (100.0 - y1) / 100.0;
                    var flow_b = flow * y1 / 100.0;
                    area_a = width * flow_a;
                    area_b = width * flow_b;
                }
                else {
                    // Area of a right trapezoid
                    var height = x1 - x0;
                    var a = flow * (100.0 - y0) / 100.0;
                    var b = flow * (100.0 - y1) / 100.0;
                    area_a = 0.5 * height * (a + b);

                    var a = flow * (y0) / 100.0;
                    var b = flow * (y1) / 100.0;
                    area_b = 0.5 * height * (a + b);
                }
                volume_a += area_a;
                volume_b += area_b;
            }
            last_command = command;
        });
        return {a: volume_a, b: volume_b};
    },
    totalTime: function () {
        // NOTE: Can we just assume the commands will be in order? If so,
        // just grab the time of the last command.
        var commands = this.get('commands')
        var endTime = 0;
        commands.forEach(function (command) {
            var time = command.get('x');
            if (endTime < time) {
                endTime = time;
            }
        });
        return endTime;
    },
    writeCommands: function (addr) {
        var commands = Method2Commands(this);
        for (var i in commands) {
            var cmd = commands[i];
            cmd.write(UsbDevice);
        }
    }
});

var MethodLibrary = exports.Library = kind({
    name: 'MethodLibrary',
    kind: Collection,
    model: Method
});

var PlotlyHelper = exports.PlotlyHelper = function (method) {
    var x = [];
    var y = [];
    var commands = method.get('commands');
    if (commands) {
        commands.forEach(function (cmd) {
            x.push(cmd.get('x'));
            y.push(cmd.get('y'));
        });
    }
    return { x: x, y: y };
};

var MethodFactory = exports.MethodFactory = function () {
    var fn = function () {
        return true;
    }
    var allMethods = Store.find(Method, fn, { all: true });
    var nextMethodId = allMethods.length;
    var allCommands = Store.find(MethodCommand, fn, { all: true });
    var nextCommandId = allCommands[length];
    // TODO: Determine if we need to use an alternate "id" so that we could have a unique "id" and a sequence id. <- If this changes examine TestSetupPanel.js to propogate the change throughout the program.
    var method = new Method({
        id: nextMethodId,
        name: 'New Method ' + nextMethodId,
        commands: new MethodCommands([
            new MethodCommand({ "id": 0, "x": 0, "y": 0,   "flow": 1, "direction": 1, "valves_a": 3, "valves_b": 0 }),
            new MethodCommand({ "id": 1, "x": 1, "y": 100, "flow": 1, "direction": 1, "valves_a": 3, "valves_b": 0 }),
            new MethodCommand({ "id": 1, "x": 1.3, "y": 100, "flow": 1, "direction": 1, "valves_a": 3, "valves_b": 0 }),
            new MethodCommand({ "id": 1, "x": 1.4, "y": 0, "flow": 1, "direction": 1, "valves_a": 3, "valves_b": 0 }),
            new MethodCommand({ "id": 1, "x": 1.5, "y": 0, "flow": 1, "direction": 1, "valves_a": 2, "valves_b": 1 }),
        ]),
        prepressurize: true,
        unlocked: true,
        dragAndDropPoints: true,
        session: null,
    });
    return method;
};

let MethodCount = exports.MethodCount = function () {
    let fn = function () {
        return true;
    }
    let allMethods = Store.find(Method, fn, { all: true });
    return allMethods.length;
};
