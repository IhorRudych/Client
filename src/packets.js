/**/

var utils = require('./utils.js');

module.exports.IsError  = function(pkt) { return pkt[0] == 'M'.charCodeAt(0) && pkt[1] == 'E'.charCodeAt(0); };
module.exports.IsDebug  = function(pkt) { return pkt[0] == 'M'.charCodeAt(0) && pkt[1] == 'D'.charCodeAt(0); };
module.exports.IsWarn   = function(pkt) { return pkt[0] == 'M'.charCodeAt(0) && pkt[1] == 'W'.charCodeAt(0); };
module.exports.IsSet    = function(pkt) { return pkt[0] == 'C'.charCodeAt(0) && pkt[1] == 'C'.charCodeAt(0); };
module.exports.IsFlush  = function(pkt) { return pkt[0] == 'C'.charCodeAt(0) && pkt[1] == 'E'.charCodeAt(0); };
module.exports.IsFill   = function(pkt) { return pkt[0] == 'C'.charCodeAt(0) && pkt[1] == 'F'.charCodeAt(0); };
module.exports.IsMotor  = function(pkt) { return pkt[0] == 'C'.charCodeAt(0) && pkt[1] == 'M'.charCodeAt(0); };
module.exports.IsLoad   = function(pkt) { return pkt[0] == 'C'.charCodeAt(0) && pkt[1] == 'L'.charCodeAt(0); };
module.exports.IsNotify = function(pkt) { return pkt[0] == 'D'.charCodeAt(0) && pkt[1] == 'N'.charCodeAt(0); };
module.exports.IsAbort  = function(pkt) { return pkt[0] == 'C'.charCodeAt(0) && pkt[1] == 'Q'.charCodeAt(0); };
module.exports.IsPump   = function(pkt) { return pkt[0] == 'C'.charCodeAt(0) && pkt[1] == 'P'.charCodeAt(0); };
module.exports.IsRefill = function(pkt) { return pkt[0] == 'C'.charCodeAt(0) && pkt[1] == 'R'.charCodeAt(0); };
module.exports.IsDaq    = function(pkt) { return pkt[0] == 'C'.charCodeAt(0) && pkt[1] == 'U'.charCodeAt(0); };
module.exports.IsWait   = function(pkt) { return pkt[0] == 'C'.charCodeAt(0) && pkt[1] == 'W'.charCodeAt(0); };
module.exports.IsValve  = function(pkt) { return pkt[0] == 'C'.charCodeAt(0) && pkt[1] == 'V'.charCodeAt(0); };
module.exports.IsBerr   = function(pkt) { return pkt[0] == 'E'.charCodeAt(0) && pkt[1] == 'B'.charCodeAt(0); };
module.exports.IsDerr   = function(pkt) { return pkt[0] == 'E'.charCodeAt(0) && pkt[1] == 'D'.charCodeAt(0); };
module.exports.IsFerr   = function(pkt) { return pkt[0] == 'E'.charCodeAt(0) && pkt[1] == 'F'.charCodeAt(0); };
module.exports.IsPerr   = function(pkt) { return pkt[0] == 'E'.charCodeAt(0) && pkt[1] == 'P'.charCodeAt(0); };
module.exports.IsSerr   = function(pkt) { return pkt[0] == 'E'.charCodeAt(0) && pkt[1] == 'S'.charCodeAt(0); };
module.exports.IsTerr   = function(pkt) { return pkt[0] == 'E'.charCodeAt(0) && pkt[1] == 'T'.charCodeAt(0); };
module.exports.IsPrs    = function(pkt) { return pkt[0] == 'D'.charCodeAt(0) && pkt[1] == 'P'.charCodeAt(0); };
module.exports.IsPum    = function(pkt) { return pkt[0] == 'D'.charCodeAt(0) && pkt[1] == 'M'.charCodeAt(0); };
module.exports.IsUdv    = function(pkt) { return pkt[0] == 'D'.charCodeAt(0) && pkt[1] == 'U'.charCodeAt(0); };
module.exports.IsTmp    = function(pkt) { return pkt[0] == 'D'.charCodeAt(0) && pkt[1] == 'T'.charCodeAt(0); };
module.exports.IsEvent  = function(pkt) { return pkt[0] == 'D'.charCodeAt(0) && pkt[1] == 'E'.charCodeAt(0); };

function packetEncode_16_16(packetId, typeId, a, b) {
    var pkt = new Uint8Array(16);
    pkt[0] = packetId.charCodeAt(0);
    pkt[1] = typeId.charCodeAt(0);
    pkt[2] = (a >> 0) & 0xff;
    pkt[3] = (a >> 8) & 0xff;
    pkt[4] = (b >> 0) & 0xff;
    pkt[5] = (b >> 8) & 0xff;
    pkt[15] = '\n'.charCodeAt(0);
    return pkt;
}

function packetEncode_16_16_16(packetId, typeId, time, end_ratio, start_ratio) {
    var pkt = new Uint8Array(16);
    pkt[0] = packetId.charCodeAt(0);
    pkt[1] = typeId.charCodeAt(0);
    pkt[2] = (time >> 0) & 0xff;
    pkt[3] = (time >> 8) & 0xff;
    pkt[4] = (end_ratio >> 0) & 0xff;
    pkt[5] = (end_ratio >> 8) & 0xff;
    pkt[6] = (start_ratio >> 0) & 0xff;
    pkt[7] = (start_ratio >> 8) & 0xff;
    pkt[15] = '\n'.charCodeAt(0);
    return pkt;
}

function packetEncode_16(packetId, typeId, value) {
    var pkt = new Uint8Array(16);
    pkt[0] = packetId.charCodeAt(0);
    pkt[1] = typeId.charCodeAt(0);
    pkt[2] = (value >> 0) & 0xff;
    pkt[3] = (value >> 8) & 0xff;
    pkt[15] = '\n'.charCodeAt(0);
    return pkt;
}

function packetEncode_32(packetId, typeId, value) {
    var pkt = new Uint8Array(16);
    pkt[0] = packetId.charCodeAt(0);
    pkt[1] = typeId.charCodeAt(0);
    pkt[2] = (value >> 0) & 0xff;
    pkt[3] = (value >> 8) & 0xff;
    pkt[4] = (value >> 16) & 0xff;
    pkt[5] = (value >> 24) & 0xff;
    pkt[15] = '\n'.charCodeAt(0);
    return pkt;
}

function packetEncode_16_8_32(packetId, typeId, address, length, data) {
    var pkt = new Uint8Array(16);
    pkt[0] = packetId.charCodeAt(0);
    pkt[1] = typeId.charCodeAt(0);
    pkt[2] = (address >> 0) & 0xff;
    pkt[3] = (address >> 8) & 0xff;
    pkt[4] = (length >> 0) & 0xff;
    pkt[5] = (data >> 0) & 0xff;
    pkt[6] = (data >> 8) & 0xff;
    pkt[7] = (data >> 16) & 0xff;
    pkt[8] = (data >> 24) & 0xff;
    pkt[15] = '\n'.charCodeAt(0);
    return pkt;
}

function packetEncode_16_8_16v(packetId, typeId, address, length, data) {
    var pkt = new Uint8Array(16);
    pkt[0] = packetId.charCodeAt(0);
    pkt[1] = typeId.charCodeAt(0);
    pkt[2] = (address >> 0) & 0xff;
    pkt[3] = (address >> 8) & 0xff;
    pkt[4] = (length >> 0) & 0xff;
    pkt[5] = (data >> 0) & 0xff;
    pkt[6] = (data >> 8) & 0xff;
    pkt[15] = '\n'.charCodeAt(0);
    return pkt;
}

function packetEncode_0(packetId, typeId) {
    var pkt = new Uint8Array(16);
    pkt[0] = packetId.charCodeAt(0);
    pkt[1] = typeId.charCodeAt(0);
    pkt[15] = '\n'.charCodeAt(0);
    return pkt;
}

function packetEncode_text(packetId, typeId, data) {
    var pkt = new Uint8Array(16);
    pkt[0] = packetId.charCodeAt(0);
    pkt[1] = typeId.charCodeAt(0);
    pkt[2] = data[0];
    pkt[3] = data[1];
    pkt[4] = data[2];
    pkt[5] = data[3];
    pkt[6] = data[4];
    pkt[7] = data[5];
    pkt[8] = data[6];
    pkt[9] = data[7];
    pkt[10] = data[8];
    pkt[11] = data[9];
    pkt[12] = data[10];
    pkt[13] = data[11];
    pkt[14] = data[12];
    pkt[15] = '\n'.charCodeAt(0);
    return pkt;
}

function packetEncode_data(packetId, typeId, streamId, channelId, value) {
    var pkt = new Uint8Array(16);
    pkt[0] = packetId.charCodeAt(0);
    pkt[1] = typeId.charCodeAt(0);
    pkt[2] = (streamId >> 0) & 0xff;
    pkt[3] = (streamId >> 8) & 0xff;
    pkt[4] = (channelId >> 0) & 0xff;
    pkt[5] = (value >> 0) & 0xff;
    pkt[6] = (value >> 8) & 0xff;
    pkt[15] = '\n'.charCodeAt(0);
    return pkt;
}

var EncodeError = module.exports.EncodeError = function(data) {
    return packetEncode_text('M', 'E', data);
};

var EncodeDebug = module.exports.EncodeDebug = function(data) {
    return packetEncode_text('M', 'D', data);
};

var EncodeWarn = module.exports.EncodeWarn = function(data) {
    return packetEncode_text('M', 'W', data);
};

var EncodeSet = module.exports.EncodeSet = function(address, length, data) {
    return packetEncode_16_8_32('C', 'C', address, length, data);
};

var EncodeFlush = module.exports.EncodeFlush = function() {
    return packetEncode_0('C', 'E');
};

var EncodeFill = module.exports.EncodeFill = function() {
    return packetEncode_0('C', 'F');
};

var EncodeMotor = module.exports.EncodeMotor = function(value) {
    return packetEncode_32('C', 'M', value);
};

var EncodeLoad = module.exports.EncodeLoad = function(data) {
    return packetEncode_text('C', 'L', data);
};

var EncodeNotify = module.exports.EncodeNotify = function(data) {
    return packetEncode_text('C', 'N', data);
};

var EncodeAbort = module.exports.EncodeAbort = function() {
    return packetEncode_0('C', 'Q');
};

var EncodePump = module.exports.EncodePump = function(time, end_ratio, start_ratio) {
    return packetEncode_16_16_16('C', 'P', time, end_ratio, start_ratio);
};

var EncodeRefill = module.exports.EncodeRefill = function(data) {
    return packetEncode_text('C', 'R', data);
};

var EncodeDaq = module.exports.EncodeDaq = function(value) {
    return packetEncode_16('C', 'U', value);
};

var EncodeWait = module.exports.EncodeWait = function(value) {
    return packetEncode_16('C', 'W', value);
};

var EncodeValve = module.exports.EncodeValve = function(address, data) {
    return packetEncode_16_16('C', 'V', address, data);
};

var EncodeBerr = module.exports.EncodeBerr = function() {
    return packetEncode_0('E', 'B');
};

var EncodeDerr = module.exports.EncodeDerr = function() {
    return packetEncode_0('E', 'D');
};

var EncodeFerr = module.exports.EncodeFerr = function() {
    return packetEncode_0('E', 'F');
};

var EncodePerr = module.exports.EncodePerr = function() {
    return packetEncode_0('E', 'P');
};

var EncodeSerr = module.exports.EncodeSerr = function() {
    return packetEncode_0('E', 'S');
};

var EncodeTerr = module.exports.EncodeTerr = function() {
    return packetEncode_0('E', 'T');
};

var EncodePrs = module.exports.EncodePrs = function(streamId, channelId, value) {
    return packetEncode_data('D', 'P', streamId, channelId, value);
};

var EncodePum = module.exports.EncodePum = function(streamId, channelId, value) {
    return packetEncode_data('D', 'M', streamId, channelId, value);
};

var EncodeUdv = module.exports.EncodeUdv = function(streamId, channelId, value) {
    return packetEncode_data('D', 'U', streamId, channelId, value);
};

var EncodeTmp = module.exports.EncodeTmp = function(streamId, channelId, value) {
    return packetEncode_data('D', 'T', streamId, channelId, value);
};

var EncodeEvent = module.exports.EncodeEvent = function(typeId, value) {
    return packetEncode_16_16('D', 'E', typeId, value);
};

function packetDecode_16_16(pkt) {
    var result = {};
    result.a = 0;
    result.a |= (pkt[2] & 0xff) << 0;
    result.a |= (pkt[3] & 0xff) << 8;
    result.b = 0;
    result.b |= (pkt[4] & 0xff) << 0;
    result.b |= (pkt[5] & 0xff) << 8;
    return result;
}

function packetDecode_16_16_16(pkt) {
    var result = {};
    result.time = 0;
    result.time |= (pkt[2] & 0xff) << 0;
    result.time |= (pkt[3] & 0xff) << 8;
    result.end_ratio = 0;
    result.end_ratio |= (pkt[4] & 0xff) << 0;
    result.end_ratio |= (pkt[5] & 0xff) << 8;
    result.start_ratio = 0;
    result.start_ratio |= (pkt[6] & 0xff) << 0;
    result.start_ratio |= (pkt[7] & 0xff) << 8;
    return result;
}

function packetDecode_16(pkt) {
    var result = {};
    result.value = 0;
    result.value |= (pkt[2] & 0xff) << 0;
    result.value |= (pkt[3] & 0xff) << 8;
    return result;
}

function packetDecode_32(pkt) {
    var result = {};
    result.value = 0;
    result.value |= (pkt[2] & 0xff) << 0;
    result.value |= (pkt[3] & 0xff) << 8;
    result.value |= (pkt[4] & 0xff) << 16;
    result.value |= (pkt[5] & 0xff) << 24;
    return result;
}

function packetDecode_16_8_32(pkt) {
    var result = {};
    result.address = 0;
    result.address |= (pkt[2] & 0xff) << 0;
    result.address |= (pkt[3] & 0xff) << 8;
    result.length = 0;
    result.length |= (pkt[4] & 0xff) << 0;
    result.data = 0;
    result.data |= (pkt[5] & 0xff) << 0;
    result.data |= (pkt[6] & 0xff) << 8;
    result.data |= (pkt[7] & 0xff) << 16;
    result.data |= (pkt[8] & 0xff) << 24;
    return result;
}

function packetDecode_16_8_16v(pkt) {
    var result = {};
    result.address = 0;
    result.address |= (pkt[2] & 0xff) << 0;
    result.address |= (pkt[3] & 0xff) << 8;
    result.length = 0;
    result.length |= (pkt[4] & 0xff) << 0;
    result.data = 0;
    result.data |= (pkt[5] & 0xff) << 0;
    result.data |= (pkt[6] & 0xff) << 8;
    return result;
}

function packetDecode_0(pkt) {
    var result = {};
    return result;
}

function packetDecode_text(pkt) {
    var result = {};
    result.data = [];
    result.data.push(pkt[2]);
    result.data.push(pkt[3]);
    result.data.push(pkt[4]);
    result.data.push(pkt[5]);
    result.data.push(pkt[6]);
    result.data.push(pkt[7]);
    result.data.push(pkt[8]);
    result.data.push(pkt[9]);
    result.data.push(pkt[10]);
    result.data.push(pkt[11]);
    result.data.push(pkt[12]);
    result.data.push(pkt[13]);
    result.data.push(pkt[14]);
    return result;
}

function packetDecode_data(pkt) {
    var result = {};
    result.streamId = 0;
    result.streamId |= (pkt[2] & 0xff) << 0;
    result.streamId |= (pkt[3] & 0xff) << 8;
    result.channelId = 0;
    result.channelId |= (pkt[4] & 0xff) << 0;
    result.value = 0;
    result.value |= (pkt[5] & 0xff) << 0;
    result.value |= (pkt[6] & 0xff) << 8;
    return result;
}

var DecodeError = module.exports.DecodeError = function(pkt) {
    return packetDecode_text(pkt);
};

var DecodeDebug = module.exports.DecodeDebug = function(pkt) {
    return packetDecode_text(pkt);
};

var DecodeWarn = module.exports.DecodeWarn = function(pkt) {
    return packetDecode_text(pkt);
};

var DecodeSet = module.exports.DecodeSet = function(pkt) {
    return packetDecode_16_8_32(pkt);
};

var DecodeFlush = module.exports.DecodeFlush = function(pkt) {
    return packetDecode_0(pkt);
};

var DecodeFill = module.exports.DecodeFill = function(pkt) {
    return packetDecode_0(pkt);
};

var DecodeMotor = module.exports.DecodeMotor = function(pkt) {
    return packetDecode_32(pkt);
};

var DecodeLoad = module.exports.DecodeLoad = function(pkt) {
    return packetDecode_0(pkt);
};

var DecodeNotify = module.exports.DecodeNotify = function(pkt) {
    return packetDecode_text(pkt);
};

var DecodeAbort = module.exports.DecodeAbort = function(pkt) {
    return packetDecode_0(pkt);
};

var DecodePump = module.exports.DecodePump = function(pkt) {
    return packetDecode_16_16_16(pkt);
};

var DecodeRefill = module.exports.DecodeRefill = function(pkt) {
    return packetDecode_0(pkt);
};

var DecodeDaq = module.exports.DecodeDaq = function(pkt) {
    return packetDecode_16(pkt);
};

var DecodeWait = module.exports.DecodeWait = function(pkt) {
    return packetDecode_16(pkt);
};

var DecodeValve = module.exports.DecodeValve = function(pkt) {
    var result = packetDecode_16_16(pkt);
    return {address: result.a, data: result.b};
};

var DecodeBerr = module.exports.DecodeBerr = function(pkt) {
    return packetDecode_0(pkt);
};

var DecodeDerr = module.exports.DecodeDerr = function(pkt) {
    return packetDecode_0(pkt);
};

var DecodeFerr = module.exports.DecodeFerr = function(pkt) {
    return packetDecode_0(pkt);
};

var DecodePerr = module.exports.DecodePerr = function(pkt) {
    return packetDecode_0(pkt);
};

var DecodeSerr = module.exports.DecodeSerr = function(pkt) {
    return packetDecode_0(pkt);
};

var DecodeTerr = module.exports.DecodeTerr = function(pkt) {
    return packetDecode_0(pkt);
};

var DecodePrs = module.exports.DecodePrs = function(pkt) {
    return packetDecode_data(pkt);
};

var DecodePum = module.exports.DecodePum = function(pkt) {
    return packetDecode_data(pkt);
};

var DecodeUdv = module.exports.DecodeUdv = function(pkt) {
    return packetDecode_data(pkt);
};

var DecodeTmp = module.exports.DecodeTmp = function(pkt) {
    return packetDecode_data(pkt);
};

var DecodeEvent = module.exports.DecodeEvent = function(pkt) {
    var result = packetDecode_16_16(pkt);
    return {typeId: result.a, value: result.b};
};

var CommandError = exports.CommandError = class {
    constructor(data) {
        this.name = 'Error';
        this.data = data;
    }
    stringify() {
        var str = this.name + ' ' + this.data;
        return str.toLowerCase();
    }
    packetize() {
        var packets = [];
        packets.push(EncodeError(this.data));
        return packets;
    }
    depacketize(pkt) {
        var args = DecodeError(pkt);
        this.data = args.data;
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            device.write(Array.from(packet));
        }
        return promise;
    }
};

var CommandDebug = exports.CommandDebug = class {
    constructor(data) {
        this.name = 'Debug';
        this.data = data;
    }
    stringify() {
        var str = '';
        var data = this.data.slice(2,15);
        for (var i = 0; i < data.length; i++) {
            if (data[i] != 0) {
                str += String.fromCharCode(data[i]);
            }
        }
        return str;
    }
    packetize() {
        var packets = [];
        packets.push(EncodeDebug(this.data));
        return packets;
    }
    depacketize(pkt) {
        var args = DecodeDebug(pkt);
        this.data = args.data;
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            promise = device.write(Array.from(packet));
        }
        return promise;
    }
};

var CommandWarn = exports.CommandWarn = class {
    constructor(data) {
        this.name = 'Warn';
        this.data = data;
    }
    stringify() {
        var str = this.name + ' ' + this.data;
        return str.toLowerCase();
    }
    packetize() {
        var packets = [];
        packets.push(EncodeWarn(this.data));
        return packets;
    }
    depacketize(pkt) {
        var args = DecodeWarn(pkt);
        this.data = args.data;
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            promise = device.write(Array.from(packet));
        }
        return promise;
    }
};

var CommandSet = exports.CommandSet = class {
    constructor(address, length, data) {
        this.name = 'Set';
        this.address = address;
        this.length = length;
        this.data = data;
    }
    stringify() {
        var str = this.name + ' ' + this.address + ' ' + this.length + ' ' + this.data;
        return str.toLowerCase();
    }
    packetize() {
        var packets = [];
        packets.push(EncodeSet(this.address, this.length, this.data));
        return packets;
    }
    depacketize(pkt) {
        var args = DecodeSet(pkt);
        this.address = args.address;
        this.length = args.length;
        this.data = args.data;
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            promise = device.write(Array.from(packet));
        }
        return promise;
    }
};

var CommandFlush = exports.CommandFlush = class {
    constructor() {
        this.name = 'Flush';
    }
    stringify() {
        var str = this.name;
        return str.toLowerCase();
    }
    packetize() {
        var packets = [];
        packets.push(EncodeFlush());
        return packets;
    }
    depacketize(pkt) {
        var args = DecodeFlush(pkt);
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            promise = device.write(Array.from(packet));
        }
        return promise;
    }
};

var CommandFill = exports.CommandFill = class {
    constructor() {
        this.name = 'Fill';
    }
    stringify() {
        var str = this.name;
        return str.toLowerCase();
    }
    packetize() {
        var packets = [];
        packets.push(EncodeFill());
        return packets;
    }
    depacketize(pkt) {
        var args = DecodeFill(pkt);
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            promise = device.write(Array.from(packet));
        }
        return promise;
    }
};

var CommandMotor = exports.CommandMotor = class {
    constructor(value) {
        this.name = 'Motor';
        this.value = value;
    }
    stringify() {
        var str = this.name + ' ' + this.value;
        return str.toLowerCase();
    }
    packetize() {
        var packets = [];
        packets.push(EncodeMotor(this.value));
        return packets;
    }
    depacketize(pkt) {
        var args = DecodeMotor(pkt);
        this.value = args.value;
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            promise = device.write(Array.from(packet));
        }
        return promise;
    }
};

var CommandLoad = exports.CommandLoad = class {
    constructor(data) {
        this.name = 'Load';
        this.data = data;
    }
    stringify() {
        var str = this.name + ' ' + this.data;
        return str.toLowerCase();
    }
    packetize() {
        var packets = [];
        packets.push(EncodeLoad(this.data));
        return packets;
    }
    depacketize(pkt) {
        var args = DecodeLoad(pkt);
        this.data = args.data;
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            promise = device.write(Array.from(packet));
        }
        return promise;
    }
};

var CommandNotify = exports.CommandNotify = class {
    constructor(data) {
        this.name = 'Notify';
        this.data = data;
    }
    stringify() {
        var str = this.name + ' ' + this.data;
        return str.toLowerCase();
    }
    packetize() {
        var packets = [];
        packets.push(EncodeNotify(this.data));
        return packets;
    }
    depacketize(pkt) {
        var args = DecodeNotify(pkt);
        this.data = args.data;
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            promise = device.write(Array.from(packet));
        }
        return promise;
    }
};

var CommandAbort = exports.CommandAbort = class {
    constructor() {
        this.name = 'Abort';
    }
    stringify() {
        var str = this.name;
        return str.toLowerCase();
    }
    packetize() {
        var packets = [];
        packets.push(EncodeAbort());
        return packets;
    }
    depacketize(pkt) {
        var args = DecodeAbort(pkt);
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            promise = device.write(Array.from(packet));
        }
        return promise;
    }
};

var CommandPump = exports.CommandPump = class {
    constructor(time, end_ratio, start_ratio) {
        this.name = 'Pump';
        this.time = time;
        this.end_ratio = end_ratio;
        this.start_ratio = start_ratio;
    }
    stringify() {
        var str = this.name + ' ' + this.time + ' ' + this.end_ratio + ' ' + this.start_ratio;
        return str.toLowerCase();
    }
    packetize() {
        var packets = [];
        packets.push(EncodePump(this.time, this.end_ratio, this.start_ratio));
        return packets;
    }
    depacketize(pkt) {
        var args = DecodePump(pkt);
        this.time = args.time;
        this.end_ratio = args.end_ratio;
        this.start_ratio = args.start_ratio;
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            promise = device.write(Array.from(packet));
        }
        return promise;
    }
};

var CommandRefill = exports.CommandRefill = class {
    constructor(data) {
        this.name = 'Refill';
        this.data = data;
    }
    stringify() {
        var str = this.name;
        return str.toLowerCase();
    }
    packetize() {
        var packets = [];
        packets.push(EncodeRefill(this.data));
        return packets;
    }
    depacketize(pkt) {
        var args = DecodeRefill(pkt);
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            promise = device.write(Array.from(packet));
        }
        return promise;
    }
};

var CommandDaq = exports.CommandDaq = class {
    constructor(value) {
        this.name = 'Daq';
        this.value = value;
    }
    stringify() {
        var str = this.name + ' ' + this.value;
        return str.toLowerCase();
    }
    packetize() {
        var packets = [];
        packets.push(EncodeDaq(this.value));
        return packets;
    }
    depacketize(pkt) {
        var args = DecodeDaq(pkt);
        this.value = args.value;
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            promise = device.write(Array.from(packet));
        }
        return promise;
    }
};

var CommandWait = exports.CommandWait = class {
    constructor(value) {
        this.name = 'Wait';
        this.value = value;
    }
    stringify() {
        var str = this.name + ' ' + this.value;
        return str.toLowerCase();
    }
    packetize() {
        var packets = [];
        packets.push(EncodeWait(this.value));
        return packets;
    }
    depacketize(pkt) {
        var args = DecodeWait(pkt);
        this.value = args.value;
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            promise = device.write(Array.from(packet));
        }
        return promise;
    }
};

var CommandValve = exports.CommandValve = class {
    constructor(address, data) {
        this.name = 'Valve';
        this.address = address;
        this.data = data;
    }
    stringify() {
        var str = this.name + ' ' + this.address + ' ' + this.data;
        return str.toLowerCase();
    }
    packetize() {
        var packets = [];
        packets.push(EncodeValve(this.address, this.data));
        return packets;
    }
    depacketize(pkt) {
        var args = DecodeValve(pkt);
        this.address = args.address;
        this.data = args.data;
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            promise = device.write(Array.from(packet));
        }
        return promise;
    }
};

var CommandBerr = exports.CommandBerr = class {
    constructor() {
        this.name = 'Berr';
    }
    stringify() {
        var str = this.name;
        return str.toLowerCase();
    }
    packetize() {
        var packets = [];
        packets.push(EncodeBerr());
        return packets;
    }
    depacketize(pkt) {
        var args = DecodeBerr(pkt);
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            promise = device.write(Array.from(packet));
        }
        return promise;
    }
};

var CommandDerr = exports.CommandDerr = class {
    constructor() {
        this.name = 'Derr';
    }
    stringify() {
        var str = this.name;
        return str.toLowerCase();
    }
    packetize() {
        var packets = [];
        packets.push(EncodeDerr());
        return packets;
    }
    depacketize(pkt) {
        var args = DecodeDerr(pkt);
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            promise = device.write(Array.from(packet));
        }
        return promise;
    }
};

var CommandFerr = exports.CommandFerr = class {
    constructor() {
        this.name = 'Ferr';
    }
    stringify() {
        var str = this.name;
        return str.toLowerCase();
    }
    packetize() {
        var packets = [];
        packets.push(EncodeFerr());
        return packets;
    }
    depacketize(pkt) {
        var args = DecodeFerr(pkt);
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            promise = device.write(Array.from(packet));
        }
        return promise;
    }
};

var CommandPerr = exports.CommandPerr = class {
    constructor() {
        this.name = 'Perr';
    }
    stringify() {
        var str = this.name;
        return str.toLowerCase();
    }
    packetize() {
        var packets = [];
        packets.push(EncodePerr());
        return packets;
    }
    depacketize(pkt) {
        var args = DecodePerr(pkt);
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            promise = device.write(Array.from(packet));
        }
        return promise;
    }
};

var CommandSerr = exports.CommandSerr = class {
    constructor() {
        this.name = 'Serr';
    }
    stringify() {
        var str = this.name;
        return str.toLowerCase();
    }
    packetize() {
        var packets = [];
        packets.push(EncodeSerr());
        return packets;
    }
    depacketize(pkt) {
        var args = DecodeSerr(pkt);
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            promise = device.write(Array.from(packet));
        }
        return promise;
    }
};

var CommandTerr = exports.CommandTerr = class {
    constructor() {
        this.name = 'Terr';
    }
    stringify() {
        var str = this.name;
        return str.toLowerCase();
    }
    packetize() {
        var packets = [];
        packets.push(EncodeTerr());
        return packets;
    }
    depacketize(pkt) {
        var args = DecodeTerr(pkt);
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            promise = device.write(Array.from(packet));
        }
        return promise;
    }
};

var CommandPrs = exports.CommandPrs = class {
    constructor(streamId, channelId, value) {
        this.name = 'Prs';
        this.streamId = streamId;
        this.channelId = channelId;
        this.value = value;
    }
    stringify() {
        var str = this.name + ' ' + this.streamId + ' ' + this.channelId + ' ' + this.value;
        return str.toLowerCase();
    }
    packetize() {
        var packets = [];
        packets.push(EncodePrs(this.streamId, this.channelId, this.value));
        return packets;
    }
    depacketize(pkt) {
        var args = DecodePrs(pkt);
        this.streamId = args.streamId;
        this.channelId = args.channelId;
        this.value = args.value;
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            promise = device.write(Array.from(packet));
        }
        return promise;
    }
};

var CommandPum = exports.CommandPum = class {
    constructor(streamId, channelId, value) {
        this.name = 'Pum';
        this.streamId = streamId;
        this.channelId = channelId;
        this.value = value;
    }
    stringify() {
        var str = this.name + ' ' + this.streamId + ' ' + this.channelId + ' ' + this.value;
        return str.toLowerCase();
    }
    packetize() {
        var packets = [];
        packets.push(EncodePum(this.streamId, this.channelId, this.value));
        return packets;
    }
    depacketize(pkt) {
        var args = DecodePum(pkt);
        this.streamId = args.streamId;
        this.channelId = args.channelId;
        this.value = args.value;
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            promise = device.write(Array.from(packet));
        }
        return promise;
    }
};

var CommandUdv = exports.CommandUdv = class {
    constructor(streamId, channelId, value) {
        this.name = 'Udv';
        this.streamId = streamId;
        this.channelId = channelId;
        this.value = value;
    }
    stringify() {
        var str = this.name + ' ' + this.streamId + ' ' + this.channelId + ' ' + this.value;
        return str.toLowerCase();
    }
    packetize() {
        var packets = [];
        packets.push(EncodeUdv(this.streamId, this.channelId, this.value));
        return packets;
    }
    depacketize(pkt) {
        var args = DecodeUdv(pkt);
        this.streamId = args.streamId;
        this.channelId = args.channelId;
        this.value = args.value;
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            promise = device.write(Array.from(packet));
        }
        return promise;
    }
};

var CommandTmp = exports.CommandTmp = class {
    constructor(streamId, channelId, value) {
        this.name = 'Tmp';
        this.streamId = streamId;
        this.channelId = channelId;
        this.value = value;
    }
    stringify() {
        var str = this.name + ' ' + this.streamId + ' ' + this.channelId + ' ' + this.value;
        return str.toLowerCase();
    }
    packetize() {
        var packets = [];
        packets.push(EncodeTmp(this.streamId, this.channelId, this.value));
        return packets;
    }
    depacketize(pkt) {
        var args = DecodeTmp(pkt);
        this.streamId = args.streamId;
        this.channelId = args.channelId;
        this.value = args.value;
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            promise = device.write(Array.from(packet));
        }
        return promise;
    }
};

var CommandEvent = exports.CommandEvent = class {
    constructor(streamId, channelId, typeId, value) {
        this.name = 'Event';
        this.streamId = streamId;
        this.channelId = channelId;
        this.typeId = typeId;
        this.value = value;
    }
    stringify() {
        var str = this.name + ' ' + this.streamId + ' ' + this.channelId + ' ' + this.typeId + ' ' + this.value;
        return str.toLowerCase();
    }
    packetize() {
        var packets = [];
        packets.push(EncodeEvent(this.streamId, this.channelId, this.typeId, this.value));
        return packets;
    }
    depacketize(pkt) {
        var args = DecodeEvent(pkt);
        this.streamId = args.streamId;
        this.channelId = args.channelId;
        this.typeId = args.typeId;
        this.value = args.value;
    }
    write(device) {
        var packets = this.packetize();
        var promise = null;
        for (var packet of packets) {
            promise = device.write(Array.from(packet));
        }
        return promise;
    }
};

exports.CommandFactory = function CommandFactory(str) {
    var args = str.split(/\s+/);
    if (args[0].toLowerCase() == 'error' && args.length == 2) {
        return new CommandError(...args.slice(1));
    }
    if (args[0].toLowerCase() == 'debug' && args.length == 2) {
        return new CommandDebug(...args.slice(1));
    }
    if (args[0].toLowerCase() == 'warn' && args.length == 2) {
        return new CommandWarn(...args.slice(1));
    }
    if (args[0].toLowerCase() == 'set' && args.length == 4) {
        return new CommandSet(...args.slice(1));
    }
    if (args[0].toLowerCase() == 'flush' && args.length == 1) {
        return new CommandFlush(...args.slice(1));
    }
    if (args[0].toLowerCase() == 'fill' && args.length == 1) {
        return new CommandFill(...args.slice(1));
    }
    if (args[0].toLowerCase() == 'motor' && args.length == 2) {
        return new CommandMotor(...args.slice(1));
    }
    if (args[0].toLowerCase() == 'load' && args.length == 1) {
        return new CommandLoad(...args.slice(1));
    }
    if (args[0].toLowerCase() == 'notify' && args.length == 2) {
        return new CommandNotify(...args.slice(1));
    }
    if (args[0].toLowerCase() == 'abort' && args.length == 1) {
        return new CommandAbort(...args.slice(1));
    }
    if (args[0].toLowerCase() == 'pump' && args.length == 3) {
        return new CommandPump(...args.slice(1));
    }
    if (args[0].toLowerCase() == 'refill' && args.length == 1) {
        return new CommandRefill(...args.slice(1));
    }
    if (args[0].toLowerCase() == 'daq' && args.length == 2) {
        return new CommandDaq(...args.slice(1));
    }
    if (args[0].toLowerCase() == 'wait' && args.length == 2) {
        return new CommandWait(...args.slice(1));
    }
    if (args[0].toLowerCase() == 'valve' && args.length == 3) {
        return new CommandValve(...args.slice(1));
    }
    if (args[0].toLowerCase() == 'berr' && args.length == 1) {
        return new CommandBerr(...args.slice(1));
    }
    if (args[0].toLowerCase() == 'derr' && args.length == 1) {
        return new CommandDerr(...args.slice(1));
    }
    if (args[0].toLowerCase() == 'ferr' && args.length == 1) {
        return new CommandFerr(...args.slice(1));
    }
    if (args[0].toLowerCase() == 'perr' && args.length == 1) {
        return new CommandPerr(...args.slice(1));
    }
    if (args[0].toLowerCase() == 'serr' && args.length == 1) {
        return new CommandSerr(...args.slice(1));
    }
    if (args[0].toLowerCase() == 'terr' && args.length == 1) {
        return new CommandTerr(...args.slice(1));
    }
    if (args[0].toLowerCase() == 'prs' && args.length == 4) {
        return new CommandPrs(...args.slice(1));
    }
    if (args[0].toLowerCase() == 'pum' && args.length == 4) {
        return new CommandPum(...args.slice(1));
    }
    if (args[0].toLowerCase() == 'udv' && args.length == 4) {
        return new CommandUdv(...args.slice(1));
    }
    if (args[0].toLowerCase() == 'tmp' && args.length == 4) {
        return new CommandTmp(...args.slice(1));
    }
    if (args[0].toLowerCase() == 'event' && args.length == 2) {
        return new CommandEvent(...args.slice(1));
    }
    return null;
};
