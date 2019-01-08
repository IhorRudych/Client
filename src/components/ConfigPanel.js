/**/

var kind = require('enyo/kind'),
    FittableRows = require('layout/FittableRows'),
    FittableColumns = require('layout/FittableColumns'),
    IconButton = require('onyx/IconButton'),
    Icon = require('onyx/Icon'),
    RadioGroup = require('onyx/RadioGroup'),
    Radio = require('onyx/RadioButton'),
    EnyoImage = require('enyo/Image'),
    ToolDecorator = require('enyo/ToolDecorator'),
    Button = require('enyo/Button'),
    Input = require('onyx/Input'),
    Drawer = require('enyo/Drawer'),
    GraphPanel = require('./GraphPanel.js'),
    DeviceStatus = require('./DeviceStatus.js'),
    Tooltip = require('onyx/Tooltip'),
    TooltipDecorator = require('onyx/TooltipDecorator'),
    Select = require('enyo/Select'),
    $ = require('../../lib/jquery/dist/jquery');

module.exports = kind({
    name: 'tst.ConfigPanel',
    kind: FittableRows,
    classes: 'enyo-fit data-right-column',
    published: {
        collection: null
    },
    handlers: {},
    components: [
        {name: 'ConfigToolbar', kind: FittableColumns, classes: 'data-toolbar', components: [
            {kind: FittableColumns, classes: 'data-label', components: [
                {name: 'ConfigPageLogo', kind: EnyoImage, src: './assets/svg/UI-elements-forSVG_gfx-symbol-svc-light.svg'},
                {content: 'CONFIG'},
            ]},
            { kind: ToolDecorator, classes: 'data-logo nav-icon-group', components: [
                { name: 'ConfigDeviceButton', classes: 'btn-icon', kind: DeviceStatus },
                // { name: 'ConfigSettingsButton', classes: 'btn-fade btn-icon', kind: IconButton, src: './assets/svg/UI-elements-forSVG_gfx-settings-light.svg' },
            ]},
        ]},
        {name: 'ConfigArea', fit: true, classes:'padall', components: [
            {content: 'Pressurize (Adaptive)', ontap: 'activateDrawer'},
            {name: 'PressurizeDrawer', kind: Drawer, open: false, components: [
                {kind: FittableRows, components: [
                    {kind: FittableColumns, components: [
                        {content: 'Target Pressure A'},
                        {name: 'TargetPressureA', kind: Input},
                    ]},
                    {tag: 'br'},
                    {kind: FittableColumns, components: [
                        {content: 'Target Pressure B'},
                        {name: 'TargetPressureB', kind: Input},
                    ]},
                    {tag: 'br'},
                    {kind: FittableColumns, components: [
                        {content: 'Error Band'},
                        {name: 'ErrorBand', kind: Input},
                    ]},
                    {tag: 'br'},
                    {kind: FittableColumns, components: [
                        {content: 'Phase 0 Flow Rate (80% Pressure)'},
                        {name: 'Phase0FlowRate', kind: Input},
                    ]},
                    {tag: 'br'},
                    {kind: FittableColumns, components: [
                        {content: 'Phase 1 Flow Rate (90% Pressure)'},
                        {name: 'Phase1FlowRate', kind: Input},
                    ]},
                    {tag: 'br'},
                    {kind: FittableColumns, components: [
                        {content: 'Phase 2 Flow Rate (Final)'},
                        {name: 'Phase2FlowRate', kind: Input},
                    ]},
                    {tag: 'br'},
                    {kind: FittableColumns, components: [
                        {content: 'Interpolation Point 1'},
                        {name: 'InterpolationX', kind: Input, placeholder: 'flow'},
                        {name: 'InterpolationY', kind: Input, placeholder: 'pressure'},
                    ]},
                ]}
            ]},
            {content: 'Network Settings', ontap: 'activateNetworkDrawer', handlers: {onActivate:"activated"},},
            {name: 'NetworkDrawer', kind: Drawer, open: false, classes:'padall',
            components: [
                {kind: FittableRows, components: [
                    {kind: FittableRows, components: [
                        {content: 'SSID', style:'font-weight:300;', classes:'lead'},
                        {name: 'SSID', kind: Input},
                    ]},
                    {tag: 'br'},
                    {kind: FittableRows, components: [
                        {content: 'Password', style:'font-weight:300;', classes:'lead'},
                        {name: 'Password', kind: Input},
                    ]},
                    {tag: 'br'},
                    {kind:FittableColumns, name:"mode", attributes:{mode: ""}, 
                        components:[{ 
                            kind: FittableRows, components:[{ 
                                kind:RadioGroup, oninput: "mytap", components: [{ 
                                    kind: Input, type:'radio', name: "access_point",
                                        attributes:{
                                            name:"group1", 
                                            checked:""
                                        }, 
                                        content: "Access Point", 
                                        style:'font-weight:300;',  
                                        value: 'access_point', 
                                    },{ 
                                    kind: Input, type:'radio', name: "client", 
                                        attributes:{
                                            name:"group1", 
                                            checked:""
                                        }, 
                                        content:"Client", 
                                        style:'font-weight:300;',  
                                        value:"client", 
                                    }],
                            }],
                        }], 
                    }, 
                    {tag: 'br'},
                    {name: 'Connect', kind: Button, content: 'Connect', classes:'btn btn-go', style:'color:white', ontap: 'connect' },
                    {name: 'Confirmation', kind: Icon, src:'../assets/svg/UI-elements-forSVG_gfx-checkmark.svg', style:"display:none;", },
                    {content:"Connection Information", tag:"p", style:'font-weight:400; margin-bottom:0;'},
                    {kind: FittableColumns, fits:true, components:[
                        {kind: FittableColumns,fits:true, classes:'lead', style:"padding:1em", components: [
                            {kind: TooltipDecorator, style:"padding-right:1em;", components: [
                                { kind: IconButton, src: './assets/svg/info-icon-outline-white-trace.svg', style: 'width:14px;height:15px;vertical-align:middle;'},
                                { name: 'tool-tip-text_wireless', kind: Tooltip, classes: 'tool-tip-text', style: 'top:auto; font-size:1em;', 
                                content:"The device is set to the default IP address 10.42.0.1 when in Access Point mode." },
                            ]},
                            {content: 'Wireless Status', style:'font-weight:300;'},
                            {name: 'WirelessStatus', content: ': '},
                            {tag: 'br'},
                            {content: 'Wireless IP Address', style:'font-weight:300;'},
                            {name: 'WirelessIP', content: ': '},
                            {tag: 'br'},
                            {content: 'Wireless MAC Address', style:'font-weight:300;'},
                            {name: 'WirelessMAC', content: ': '},
                        ]},
                        {kind: FittableColumns, fits:true, classes:'lead', style:"padding:1em", components: [
                            {kind: TooltipDecorator, style:"padding-right:1em;", components: [
                                { name: 'info_wired', kind: IconButton, src: './assets/svg/info-icon-outline-white-trace.svg', style: 'width:14px;height:15px;vertical-align:middle;'},
                                { name: 'tool-tip-text_wired', kind: Tooltip, classes: 'tool-tip-text', style: 'top:auto; font-size:1em;', 
                                content:"Current address of the wired port." },
                            ]},
                            {content: 'Wired Status', style:'font-weight:300;'},
                            {name: 'WiredStatus', content: ': '},
                            {tag: 'br'},
                            {content: 'Wired IP Address', style:'font-weight:300;'},
                            {name: 'WiredIP', content: ': '},
                            {tag: 'br'},
                            {content: 'Wired MAC Address', style:'font-weight:300;'},
                            {name: 'WiredMAC', content: ': '},
                        ]},
                    ]},
                ]}
            ]}
        ]},
        {name: 'VersionArea', fit: true, components: [
            {content: 'Software Version', ontap: 'activateDrawer2'},
            {name: 'VersionDrawer', kind: Drawer, open: true, components: [
                {kind: FittableRows, components: [
                    {kind: FittableColumns, components: [
                        {content: 'Version 1.1.2'},
                        {tag: 'br'},
                    ]},
                ]}
            ]}
        ]},
    ],
    bindings: [
        {from: 'app.$.Session.pressurize.target_pressure_a', to: '$.TargetPressureA.value', oneWay: false},
        {from: 'app.$.Session.pressurize.target_pressure_b', to: '$.TargetPressureB.value', oneWay: false},
        {from: 'app.$.Session.pressurize.error_band', to: '$.ErrorBand.value', oneWay: false},
        {from: 'app.$.Session.pressurize.phase0_flow_rate', to: '$.Phase0FlowRate.value', oneWay: false},
        {from: 'app.$.Session.pressurize.phase1_flow_rate', to: '$.Phase1FlowRate.value', oneWay: false},
        {from: 'app.$.Session.pressurize.phase2_flow_rate', to: '$.Phase2FlowRate.value', oneWay: false},
        {from: 'app.$.Session.pressurize.phase3_flow_rate', to: '$.Phase3FlowRate.value', oneWay: false},
        {from: 'app.$.Session.pressurize.algorithm', to: '$.Algorithm.value', oneWay: false},
        {from: 'app.$.Session.pressurize.interpolation_x', to: '$.InterpolationX.value', oneWay: false},
        {from: 'app.$.Session.pressurize.interpolation_y', to: '$.InterpolationY.value', oneWay: false},
    ],
    constructor: function () {
        this.inherited(arguments);
    },
    create: function () {
        this.inherited(arguments);
        that = this;       
        $.ajax({
            url: '/app2',
            dataType: 'text',
            type: 'post',
            contentType: 'application/x-www-form-urlencoded',
            data: {SSID: this.$.SSID.value, PSK: this.$.Password.value },
            success: function( data, textStatus, jQxhr ){
                data = JSON.parse(data);
                that.$.WirelessStatus.setContent(": " + ((data.wlan0 === undefined) ? "Not Connected" : "Connected"));
                that.$.WirelessIP.setContent(": " + ((data.wlan0 === undefined) ? " " : data.wlan0));
                that.$.WirelessMAC.setContent(": " + ((data.wlan0_mac === undefined) ? " " : data.wlan0_mac));
                that.$.WiredStatus.setContent(": " + ((data.eth0 === undefined) ? "Not Connected" : "Connected"));
                that.$.WiredIP.setContent(": " + ((data.eth0 === undefined) ? " " : data.eth0));
                that.$.WiredMAC.setContent(": " + ((data.eth0_mac === undefined) ? " " : data.eth0_mac));
                that.$.access_point.setAttribute('checked', (data.mode ? "checked": ""));
                that.$.client.setAttribute('checked', (data.mode ? "" : "checked"));
            },
            error: function( jqXhr, textStatus, errorThrown ){
                console.log( errorThrown );
            }
        });
    },
    handleResize: function() {
        this.inherited(arguments);
    },
    rendered: function() {
        this.inherited(arguments);
    },
    activateDrawer: function() {
        this.$.PressurizeDrawer.setOpen(!this.$.PressurizeDrawer.open);
    },
    activateDrawer2: function() {
        this.$.VersionDrawer.setOpen(!this.$.VersionDrawer.open);
    },
    activateNetworkDrawer: function() {
        this.$.NetworkDrawer.setOpen(!this.$.NetworkDrawer.open);
        //console.log('this is', this);
    },
    mytap: function(inSender, inEvent){
        this.$.mode.attributes.mode = inEvent.dispatchTarget.content;
    },
    connect: function() {
        that = this;
        that.$.Confirmation.applyStyle("display", "initial");
        $.ajax({
            url: '/app2',
            dataType: 'text',
            type: 'post',
            contentType: 'application/x-www-form-urlencoded',
            data: {SSID: this.$.SSID.value, PSK: this.$.Password.value, mode:this.$.mode.attributes.mode},
            success: function( data, textStatus, jQxhr ){
                data = JSON.parse(data);
                that.$.WirelessStatus.setContent(": " + ((data.wlan0 === undefined) ? "Not Connected" : "Connected"));
                that.$.WirelessIP.setContent(": " + ((data.wlan0 === undefined) ? " " : data.wlan0));
                that.$.WirelessMAC.setContent(": " + ((data.wlan0_mac === undefined) ? " " : data.wlan0_mac));
                that.$.WiredStatus.setContent(": " + ((data.eth0 === undefined) ? "Not Connected" : "Connected"));
                that.$.WiredIP.setContent(": " + ((data.eth0 === undefined) ? " " : data.eth0));
                that.$.WiredMAC.setContent(": " + ((data.eth0_mac === undefined) ? " " : data.eth0_mac));
                that.$.Confirmation.applyStyle("display", "inline-block");
            },
            error: function( jqXhr, textStatus, errorThrown ){
                console.log( errorThrown );
            }
        });
    }
});

