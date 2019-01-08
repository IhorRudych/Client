/**/

var config = exports.config = {
    'Pumps': {
        'A': {
            label: 'Pump A',
            valve: 'Valve A',
            fill: 'A',
            dispense: 'B'
        },
        'B': {
            label: 'Pump A',
            valve: 'Valve B',
            fill: 'A',
            dispense: 'B'
        }
    },
    'Valves': {
        0: {
            label: 'Valve A',
            positions: {
                'A': 1,
                'B': 3,
                'fill': 1,
                'close': 2,
                'dispense': 3
            }
        },
        1: {
            label: 'Valve B',
            positions: {
                'A': 1,
                'B': 3,
                'fill': 1,
                'close': 2,
                'dispense': 3
            }
        },
    },
    'Channels': {
        0: {
            label: 'Detector A',
            addr: 0,
        },
        1: {
            label: 'Detector B',
            addr: 1,
        },
        2: {
            label: 'Pressure A',
            addr: 2,
        },
        3: {
            label: 'Pressure B',
            addr: 3,
        },
    }
};

var valveValue = exports.valveValue = function(name, state) {
    for (var i in config.Valves) {
        var value = config.Valves[i].positions[state];
        if (value) {
            return value;
        }
    }
    return null;
}

var valveHelper = exports.valveHelper = function(a, b, c, d) {
    var values = [0, 0, 0, 0];

    var settings = [
        [config.Valves[0].label, a],
        [config.Valves[1].label, b],
        [config.Valves[2].label, c],
        [config.Valves[3].label, d]
    ];

    // Lookup the valve "address" and "position"
    for (var setting of settings) {
        var valveName = setting[0];
        var positionName = setting[1];
        for (var key in config.Valves) {
            var valve = config.Valves[key];
            if (valve.label == valveName) {
                valveId = Number(key);
                var valvePosition = valve.positions[positionName];
                if (valvePosition) {
                    values[valveId] = valvePosition;
                }
            }
        }
    }
    return ((values[3] & 3) << 0) | ((values[2] & 3) << 2) | ((values[1] & 3) << 4) | ((values[0] & 3) << 6);
}
