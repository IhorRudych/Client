/*
 */

var kind = require('enyo/kind'),
    bind = require('enyo/utils').bind,
    FittableColumns = require('layout/FittableColumns'),
    EnyoJob = require('enyo/job'),
    IconButton = require('onyx/IconButton'),
    MenuDecorator = require('onyx/MenuDecorator'),
    Menu = require('onyx/Menu'),
    MenuItem = require('onyx/MenuItem'),
    Model = require('enyo/Model'),
    Collection = require('enyo/Collection');

var UsbDevice = require('./UsbDevice.js');

var DynamicMenu = kind({
    name: "DynamicMenu",
    kind: Menu,
    classes:'drop-down-item',
    published: {
        collection: null
    },
    components: [
        {classes: 'onyx-menu-divider'},
        {content: 'Disconnect', model: null},
    ],
    collectionChanged: function(newVal, oldVal) {
        var that = this;
        function addItem(sender, e, props) {
            var controls = that.getControls();
            var a = controls[controls.length-2];
            var b = controls[controls.length-1];
            that.removeControl(a);
            that.removeControl(b);
            props.models.forEach(function(model) {
                that.createComponents([{
                    content: model.get('label'),
                    addr: model.get('addr'),
                    port: model.get('port'),
                    model: model
                }], {owner: that});
            });
            that.addControl(a);
            that.addControl(b);
            that.render();
        }
        function removeItem(sender, e, props) {
//            console.log('removing %O %O %O', sender, e, props);
            var controls = that.getControls();
            var controlsToRemove = [];
            props.models.forEach(function(model) {
                for (var control in controls) {
                    if (control.model == model) {
                        controlsToRemove.push(control);
                        break;
                    }
                }
            });
            for (var control in controlsToRemove) {
                that.removeControl(control);
            }
            that.render();
        }
        this.collection.on('add', addItem);
        this.collection.on('remove', removeItem);
        if (oldVal !== null) {
            addItem(null, null, oldVal);
        }
    },
});

module.exports = kind({
    name: 'tx.DeviceStatus',
    kind: FittableColumns,
    classes: 'device-status',
    published: {
        connectedDevice: null,
    },
    events: {
    },
    components: [
        {name: 'Name', showing: false, classes: 'nav-text'},
        {name: 'HostSelect', kind: MenuDecorator, onSelect: "itemSelected", components: [
            {name: 'Disconnected', kind: IconButton, classes: 'status-icon', src: './assets/svg/UI-elements-forSVG_gfx-device-disconnected.svg', showing: true},
            {name: 'Connected', kind: IconButton, classes: 'status-icon', src: './assets/svg/UI-elements-forSVG_gfx-device-connected.svg', showing: false},
            {name: 'DynamicMenu', kind: DynamicMenu}
        ]},
    ],
    bindings: [
        {from: 'app.$.NetworkManager.connectedDevice', to: 'connectedDevice', transform: function(v) {
            this.$.Name.set('showing', v !== null);
            if (v !== null) {
                this.$.Name.set('content', v.get('label'));
                this.$.Disconnected.set('showing', false);
                this.$.Connected.set('showing', true);
            }
            else {
                this.$.Name.set('content', '');
                this.$.Disconnected.set('showing', true);
                this.$.Connected.set('showing', false);
            }
           return v;
        }},
        {from: 'app.$.NetworkManager.availableDevices', to: '$.DynamicMenu.collection'},
    ],
    constructor: function() {
        this.inherited(arguments);
    },
    create: function() {
        this.inherited(arguments);
    },
    itemSelected: function(inSender, inEvent) {
//        console.log('inEvent %O', inEvent.originator);
        if (inEvent.originator.content) {
            if (inEvent.originator.model === null) {
                this.app.$.NetworkManager.disconnect();
            }
            else {
                this.app.$.NetworkManager.connect(inEvent.originator.model);
            }
        }
    },
    rendered: function() {
        this.inherited(arguments);
    },
});
