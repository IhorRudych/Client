/**/

var Method = require('../components/Method.js');
var utils = require('../utils.js');

var fast = new Method.Method({
    name: 'Fast Run',
    commands: new Method.Commands([
        new Method.Command({ "id": 0, "x": utils.secondsToMinutes( 0, 2), "y":  5.0, "flow": 1.0, "direction": 1, "valves_a": 3, "valves_b": 0 }),
        new Method.Command({ "id": 1, "x": utils.secondsToMinutes(180, 2), "y": 95.0, "flow": 1.0, "direction": 1, "valves_a": 3, "valves_b": 0 }),
        new Method.Command({ "id": 3, "x": utils.secondsToMinutes(198, 2), "y": 95.0, "flow": 1.0, "direction": 1, "valves_a": 3, "valves_b": 0 }),
        new Method.Command({ "id": 4, "x": utils.secondsToMinutes(204, 2), "y":  5.0, "flow": 1.0, "direction": 1, "valves_a": 3, "valves_b": 0 }),
        new Method.Command({ "id": 5, "x": utils.secondsToMinutes(210, 2), "y":  5.0, "flow": 1.0, "direction": 1, "valves_a": 2, "valves_b": 1 }),
    ])
});

var standard = new Method.Method({
    name: 'Std Method',
    commands: new Method.Commands([
        new Method.Command({ "id": 0, "x": utils.secondsToMinutes(  0, 2), "y": 25.0, "flow": 1.0, "direction": 1, "valves_a": 3, "valves_b": 0 }),
        new Method.Command({ "id": 1, "x": utils.secondsToMinutes(300, 2), "y": 95.0, "flow": 1.0, "direction": 1, "valves_a": 3, "valves_b": 0 }),
        new Method.Command({ "id": 2, "x": utils.secondsToMinutes(340, 2), "y": 95.0, "flow": 1.0, "direction": 1, "valves_a": 3, "valves_b": 1 }),
    ])
});

var manual = new Method.Method({
    name: 'Manual Method',
    commands: new Method.Commands([
        new Method.Command({ "id": 0, "x": utils.secondsToMinutes(  0, 2), "y": 50.0, "flow": 50.00, "direction": 0, "valves_a": 0, "valves_b": 0 }),
        new Method.Command({ "id": 1, "x": utils.secondsToMinutes(120, 2), "y": 50.0, "flow": 50.00, "direction": 0, "valves_a": 0, "valves_b": 0 }),
    ]),
    refill: null,
    prepressurize: false
});
manual.set('refill', null);

module.exports = new Method.Library([fast, standard, manual]);
