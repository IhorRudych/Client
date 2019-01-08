/**********************************************************************************
 * @preserve
 * 
 * Copyright (c) 2018 Axcend Corporation
 * 
 * No portion of this information may be copied, shared, distributed, printed,
 * broadcast, or disseminated in any form without the express WRITTEN permission
 * of the copyright holder.
 * 
 *********************************************************************************/


var kind = require('enyo/kind'),
    Application = require('enyo/Application'),
    Collection = require('enyo/Collection'),
    MainView = require('./components/MainView.js'),
    Session = require('./components/Session.js'),
    ReadHandler = require('./components/ReadHandler.js'),
    Network = require('./components/Network.js');

var allDevices = new Collection([
    new Network.Device({ id: 0, name: 'AP-1532',    label: 'AP-1532',    addr: '192.168.4.1',     port: 8000, favorite: true }),
    new Network.Device({ id: 1, name: 'LOCAL-2379', label: 'LOCAL-2379', addr: '192.168.102.241', port: 8000, favorite: true }),
    new Network.Device({ id: 2, name: 'BYU-1',      label: 'BYU-1',      addr: '192.168.102.138', port: 8000, favorite: true }),
    new Network.Device({ id: 4, name: 'COMANCHE-1', label: 'COMANCHE-1', addr: '10.10.10.177',    port: 8000, favorite: true }),
    new Network.Device({ id: 5, name: 'NANOPI-1',   label: 'NANOPI-1',   addr: '192.168.1.143',   port: 8000, favorite: true }),
]);

var app = module.exports = kind({
    name: 'tst.Application',
    kind: Application,
    components: [
        {name: 'Session', kind: Session, user: 'JF', device: null, solvent_type:'Water'},
        {name: 'NetworkManager', kind: Network.Manager, availableDevices: allDevices, scanEnabled: true},
        {name: 'ReadHandler', kind: ReadHandler},
    ],
    locked:              false,
    automated:           false,
    runningTest:         false,
    automateBit:         0x01,
    automateActiveState: 0x01,
    curExternalGpio:     0x00,
    runHandler:          undefined,
    view:                MainView,

    lock: function(state) {
      this.locked = state;
    },
    automate: function(state) {
      this.automated = state;
    },
    testing: function(state) {
        this.runningTest = state;
    },

    isLocked: function() {
      return this.locked;
    },
    isAutomated: function() {
      return this.automated;
    },
    isRunningTest: function() {
        return this.runningTest;
    },
    noEvents: function() {
      return this.isLocked() || this.isAutomated();
    },
    setRunHandler: function(func) {
      runHandler = func;
    },

    constructor: function() {
        this.inherited(arguments);
    },
    create: function() {
        this.inherited(arguments);
    },
});

module.exports.testing          = app.testing;
module.exports.automate         = app.automate;
module.exports.lock             = app.lock;
module.exports.runHandler       = app.runHandler;

module.exports.isRunningTesting = app.isRunningTest;
module.exports.isAutomated      = app.isAutomated;
module.exports.isLocked         = app.isLocked;
module.exports.noEvents         = app.noEvents;
module.exports.setRunHandler    = app.setRunHandler;
