/**/

var Promise = require('../plugins/bluebird-3.5.0.min.js');

Promise.config({
    longStackTraces: true
});

function List(host) {
    if (host === null) {
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        $.xmlrpc({
            url: 'http://' + host + ':8000/RPC2',
            methodName: "list",
            params: [],
            success: function(response, status, jqXHR) {
                resolve(response);
            },
            error: function(jqXHR, status, error) {
                reject(error);
            }
        });
    });
};

function Read(host) {
    if (host === null) {
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        $.xmlrpc({
            url: 'http://' + host + ':8000/RPC2',
            methodName: "read",
            params: [],
            success: function(response, status, jqXHR) {
//                if (response[0].length > 0) {
//                    console.log('UsbRead %O', response);
//                }
                resolve(response);
            },
            error: function(jqXHR, status, error) {
                reject(error);
            }
        });
    });
};

function Write(host, data) {
//    console.log('UsbWrite %O', data);
//    console.log("W %s %s %O", String.fromCharCode(data[0]), String.fromCharCode(data[1]), data.slice(2))
    if (host === null) {
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        $.xmlrpc({
            url: 'http://' + host + ':8000/RPC2',
            methodName: "write",
            params: [data],
            success: function(response, status, jqXHR) {
                resolve(response);
            },
            error: function(jqXHR, status, error) {
                reject(error);
            }
        });
    });
};

function Reset(host) {
    if (host === null) {
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        $.xmlrpc({
            url: 'http://' + host + ':8000/RPC2',
            methodName: "reset",
            params: [],
            success: function(response, status, jqXHR) {
                resolve(response);
            },
            error: function(jqXHR, status, error) {
                reject(error);
            }
        });
    });
};

function Echo (host, data) {
    if (host === null) {
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        $.xmlrpc({
            url: 'http://' + host + ':8000/RPC2',
            methodName: "echo",
            params: [data],
            success: function(response, status, jqXHR) {
                resolve(response);
            },
            error: function(jqXHR, status, error) {
                reject(error);
            }
        });
    });
};

class UsbDevice {
    constructor() {
        this.addr = null;
        this.write_successes = 0;
        this.write_errors = 0;
        this.write_count = 0;
        this.read_successes = 0;
        this.read_errors = 0;
        this.read_count = 0;
        this.promises = Promise.resolve();
    }
    open(addr) {
        this.addr = addr;
        this.promises = Promise.resolve();
        return this.promises;
    }
    cancel() {
        this.promises.cancel();
    }
    reset() {
        this.promises = this.promises.then(() => {
            return Reset(this.addr);
        });
        return this.promises;
    }
    list(addr) {
        var that = this;
        this.read_count++;
        this.promises = this.promises.then(() => {
            return new Promise((resolve, reject) => {
                List(addr)
                    .then(results => { /*console.log('list %O', results);*/ that.read_successes++; resolve(results) })
                    .catch(() => { that.read_errors++; });
            });
        });
        return this.promises;
    }
    read() {
//        console.log('USB Read %O', this.addr);
        var that = this;
        this.read_count++;
        this.promises = this.promises.then(() => {
            return new Promise((resolve, reject) => {
                Read(this.addr)
                    .then(results => { /*console.log('read %O', results);*/ that.read_successes++; resolve(results) })
                    .catch(() => { that.read_errors++; });
            });
        });
        return this.promises;
    }
    write(data) {
//        console.log('USB Write %O', data);
        var that = this;
        this.write_count++;
        this.promises = this.promises.then(() => {
            return new Promise((resolve, reject) => {
                Write(this.addr, data)
                    .then(() => { /*console.log('write %O', data);*/ that.write_successes++; resolve(true) })
                    .catch(() => { that.write_errors++; reject() });
            });
        });
        return this.promises;
    }
    echo(data) {
        var that = this;
        this.promises = this.promises.then(() => {
            return new Promise((resolve, reject) => {
                Echo(this.addr, data)
                    .then(results => { resolve(results) })
                    .catch(() => { reject('echo failed') });
            });
        });
        return this.promises;
    }
}

module.exports = new UsbDevice();
