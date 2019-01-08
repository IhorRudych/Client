/**/

var map = exports.Info = {
    "ramp_steps":        { addr:  0 / 2, size: 4 },
    "ratio_delta":       { addr:  4 / 2, size: 4 },
    "ratio":             { addr:  8 / 2, size: 4 },
    "flow":              { addr: 12 / 2, size: 4 },
    "direction":         { addr: 16 / 2, size: 4 },
    "count":             { addr: 20 / 2, size: 4 },
    "period":            { addr: 24 / 2, size: 4 },
    "channel":           { addr: 28 / 2, size: 4 },
    "step_size":         { addr: 32 / 2, size: 4 },
    "step_rate":         { addr: 36 / 2, size: 4 },
    "current_limit":     { addr: 40 / 2, size: 4 },
    "sleep_pulse_width": { addr: 44 / 2, size: 4 },
    "step_pulse_width":  { addr: 48 / 2, size: 4 }
};

exports.IsAddress = function(name, addr) {
    return map[name].addr == addr;
}

exports.Address = function(name) {
    return map[name].addr;
}
