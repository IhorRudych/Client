/**/

var kind = require('enyo/kind'),
    Model = require('enyo/Model');

var PressurizeSettings = kind({
    kind: Model,
    attributes: {
        target_pressure_a: "auto",
        target_pressure_b: "auto",
        error_band: 50,
        phase0_flow_rate: 150,
        phase1_flow_rate: 25,
        phase2_flow_rate: "auto",
        interpolation_x: 4.5,
        interpolation_y: 6000
    }
});

module.exports = kind({
    name: 'tx.Session',
    id: null,
    user: null,
    device: null,
    lasLogin: null,
    pressurize: new PressurizeSettings()
});
