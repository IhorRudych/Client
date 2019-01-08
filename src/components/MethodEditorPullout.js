var kind = require('enyo/kind'),
    FittableRows = require('layout/FittableRows'),
    FittableColumns = require('layout/FittableColumns'),
    DataRepeater = require('enyo/DataRepeater'),
    Panels = require('layout/Panels'),
    DataList = require('enyo/DataList'),
    Drawer = require('onyx/Drawer'),
    Slideable = require('layout/Slideable'),
    Grabber = require('onyx/Grabber'),
    Button = require('onyx/Button'),
    Input = require('onyx/Input'),
    Icon = require('onyx/Icon'),
    EnyoImage = require('enyo/Image'),
    IconButton = require('onyx/IconButton'),
    ToggleIconButton = require('onyx/ToggleIconButton'),
    Model = require('enyo/Model'),
    Data = require('./Data.js');

var config = require('../data/Config.js');

function clampTime(v) {
    if (v < 0) return 0;
    return v;
}

function clampRatio(v) {
    if (v < 0) return 0;
    if (v > 100) return 100;
    return v;
}

function clampFlow(v) {
    if (v < 0.77) return 0.77;
    if (v > 595.44) return 595.44;
    return v;
}

/*var ValveDrawer = kind({
    name: "tx.ValveDrawer",
    kind: FittableRows,
    published: {
        title: 'Default Title',
        model: null,
    },
    handlers:{
        ontap:'handleTap',
        onAdd2:'handleTap2',
    },
    events: {
        onChanged: '',
        onAdd2:'',
    },
    components: [
        {
            kind: FittableColumns, ontap: "activateDrawer", classes: 'editor-drawer', components: [
                { kind: Icon, src: './assets/svg/UI-elements-forSVG_gfx-injectionpoint.svg', classes: 'enyo-icon sizer-icon' },
                { name: 'Title', content: "Default Title" },
            ]
        },
        {
            name: "Drawer", kind: Drawer, classes: 'well borderb', open: false, components: [
                {
                    name: 'Header', kind: FittableColumns, components: [
                        { content: '', style: 'width:48px;' },
                        {
                            style: 'width:52px;', components: [
                                { name: 'HeaderTime', kind: Icon, src: './assets/svg/UI-elements-forSVG_gfx-clock-gray.svg', style: 'height:24px;width:24px;' },
                            ]
                        },
                        { name: 'HValveA', content: 'A', style: 'width:36px;' },
                        { name: 'HValveB', content: 'B', style: 'width:36px;' },
                        { name: 'HDirection', content: 'D', style: 'width:36px;' },
                    ]
                },
                {
                    name: 'List', classes: '', kind: DataRepeater, selection:false,
                    handlers: {
                        onRemove: 'handleTap',
                        onChanged: 'handleSort',
                    },
                    events: {
                        onChanged: '',
                        onRequestHideRemoveButton: '',
                    },
                    components: [{
                        events: {
                            onRemove: '',
                            onChanged: '',
                        },
                        components: [
                            {
                                name: 'Command', kind: FittableColumns, components: [
                                    { name: 'Id', style: 'width:32px;' },
                                    { name: 'Time', kind: Input, type: 'number', style: 'width:55px;', onchange: 'handleChange'},
                                    { name: 'ValveA', kind: Input, type: 'number', style: 'width:36px;', ontap: 'limiter', classes:'limiter' },
                                    { name: 'ValveB', kind: Input, type: 'number', style: 'width:36px;', ontap: 'limiter', classes:'limiter2' },
                                    { name: 'Direction', kind: ToggleIconButton, src: './assets/direction.svg', style: 'width:16px;height:16px;' },
                                    { name: 'Remove', kind: IconButton, showing: true, src: './assets/svg/UI-elements-forSVG_gfx-delete.svg', classes: 'btn btn-rm', style: 'height:16px;;line-height:10px;', ontap: 'handleRemove' },
                                ]
                            },
                            { name: 'Spacer', kind: FittableRows, style: 'height:30px' }

                        ],
                        bindings: [
                            {
                                from: 'index', to: '$.Id.content', transform: function (v) {
                                    return v + 1;
                                }
                            },
                            {
                                from: 'model.x', to: '$.Time.value', oneWay: false, transform: function (v, dir) {
                                    if (isNaN(v)) {
                                        return clampTime(parseFloat(Number(0).toFixed(2)));
                                    }
                                    return clampTime(parseFloat(Number(v).toFixed(2)));
                                }
                            },
                            { from: 'model.valves_a', to: '$.ValveA.value', oneWay: false },
                            { from: 'model.valves_b', to: '$.ValveB.value', oneWay: false },
                            {
                                from: 'model.direction', to: '$.Direction.value', oneWay: false, transform: function (v) {
                                    return v ? 1 : 0;
                                }
                            },
                        ],
                        handleRemove: function (inSender, inEvent) {
                            this.doRemove()
                            return true
                        },
                        handleChange: function (inSender, inEvent) {
                            this.doChanged()
                            return true
                        },
                        limiter: function () {
                            x = document.getElementsByClassName('limiter');
                            var i;
                            for (i = 0; i < x.length; i++) {
                                x[i].setAttribute('min', '0');
                                x[i].setAttribute('max', '3');   
                            }
                            y = document.getElementsByClassName('limiter2');
                            var q;
                            for (q = 0; q < y.length; q++) {
                                y[q].setAttribute('min', '0');
                                y[q].setAttribute('max', '1');   
                            }

                        }
                    }],
                    handleSort: function () {
                        this.collection.sort(function (a, b) {
                            if (a.get('x') == b.get('x')) {
                                return a.get('id') - b.get('id');
                            }
                            return a.get('x') - b.get('x');
                        });
                    },
                    handleTap: function (inSender, inEvent) {
                        if (inEvent.type == 'onRemove') {
                            this.collection.remove(inEvent.model);

                            // Hide remove button if only one remains
                            if (this.collection.length == 1) {
                                // this.showOrhideRemoveButton();
                                // this.children[0].children[0].children[0].components[4].showing = false;
                                this.doRequestHideRemoveButton();
                            }
                        }
                        else {
                            // Show remove button if they are hidden
                            if (!this.children[0].children[0].children[0].components[4].showing) {
                                // this.showOrhideRemoveButton();
                                this.doRequestHideRemoveButton();
                            }
                            var newPoint = new Data.TracePoint({
                                x: inEvent.model.get('x') + 1,
                                y: inEvent.model.get('y') + 1,
                                flow: inEvent.model.get('flow'),
                                direction: inEvent.model.get('direction'),
                                valves_a: inEvent.model.get('valves_a'),
                                valves_b: inEvent.model.get('valves_b'),
                            });
                            console.log('Valve add point %O', newPoint);
                            this.collection.add(newPoint);
                        }
                        this.collection.sort(function (a, b) {
                            if (a.get('x') == b.get('x')) {
                                return a.get('id') - b.get('id');
                            }
                            return a.get('x') - b.get('x');
                        });
                        this.doChanged();
                        return true;
                    },
                    showOrhideRemoveButton: function () {
                        this.children[0].children[0].children[0].components[4].showing = !this.children[0].children[0].children[0].components[4].showing;
                    },
                },
                { name: 'Add', kind: Button, content: '+ ADD ROW', classes: 'btn btn-add', ontap: 'handleAdd2' },
            ]
        }
    ],
    bindings: [
        { from: 'title', to: '$.Title.content' },
        { from: 'model.commands', to: '$.List.collection', oneWay: false },
    ],
    handleAdd2: function(inSender, inEvent){
        this.doAdd2();
        return true;
    },

    handleTap2: function (inSender, inEvent) {
        //instead of grabing object through inEvent, last object from collection is taken as template for new object.
        var lastElem = this.$.List.collection.models[this.$.List.collection.models.length - 1].attributes;
        //console.log(lastElem);
          var newPoint = new Data.TracePoint({
                x: lastElem.x + 1,
                y: lastElem.y + 1,
                flow: lastElem.flow,
                direction: lastElem.direction,
                valves_a: lastElem.valves_a,
                valves_b: lastElem.valves_b,
            });
            //console.log('Point add point %O', newPoint);
            
            this.$.List.collection.add(newPoint);

            this.$.List.collection.sort(function (a, b) {
                if (a.get('x') == b.get('x')) {
                    return a.get('id') - b.get('id');
                }
                return a.get('x') - b.get('x');
            });
            this.doChanged();
        return true;
        },
    activateDrawer: function (inSender, inEvent) {
        this.$.Drawer.setOpen(!this.$.Drawer.open);
    },
    handleResize: function () {
        this.inherited(arguments);
    },
    showOrhideRemoveButton: function () {
        this.$.List.showOrhideRemoveButton();
    },
});*/

var FlowDrawer = kind({
    name: "tx.FlowDrawer",
    kind: FittableRows,
    published: {
        title: 'Default Title',
        model: null,
    },
    handlers:{
        ontap:'handleTap',
        onAdd2:'handleTap2',
        onRemove: 'handleTap',
        onChanged: 'handleSort',
    },
    events: {
        onChanged: '',
        onAdd2:'',
    },
    components: [
        {
            kind: FittableColumns, ontap: "activateDrawer", classes: 'editor-drawer', components: [
                { kind: Icon, src: './assets/svg/UI-elements-forSVG_gfx-flowrate-lines-white.svg', classes: 'enyo-icon' },
                { name: 'Title', content: "Default Title" },
            ]
        },
        {
            name: "Drawer", kind: Drawer, classes: 'well borderb', open: false, 
            
            components: [
                { name: 'FlowR', kind: Input, allowHtml:true, content:'Flow Rate - &#x3BC;L/Min', type:'number', style: 'width:50px;', value: 1, onchange: 'handleFlow' },
                { kind: FittableRows, name:'AdvancedReveal', content:'Advanced v', classes:'btn-link pull-right', ontap:'collapse' },
                {
                    kind: FittableRows, name: 'AdvancedFlow', style:'display:none;', components: [
                        {
                            name: 'Header', kind: FittableColumns, components: [
                                { content: '', style: 'width:9px;' },
                                
                                //{ content: '', style: 'width:49px;' },
                                {
                                    style: 'width:35;margin-left:13px;', components: [
                                        { name: 'HeaderTime', kind: Icon, src: './assets/svg/UI-elements-forSVG_gfx-clock-gray.svg', style: 'height:24px;width:24px;' },
                                    ]
                                },
                                {
                                    style: 'width:55px;', kind: FittableColumns, components: [
                                        { name: 'HeaderUnits', allowHtml: true, content: "&#x3BC;L/Min", style: 'height:24px;width:64px;text-align:right;' },
                                    ]
                                },
                                { name: 'HValveA', content: 'A', style: 'width:44px;margin-left:25px;' },
                                { name: 'HValveB', content: 'B', style: 'width:36px;' },
                                { name: 'HDirection', content: 'D', style: 'width:36px;' },
                            ]
                        },
                        {
                            name: 'List', classes: '', kind: DataRepeater, 
                            handlers: {
                                onRemove: 'handleTap',
                                onChanged: 'handleSort',
                            },
                            events: {
                                onChanged: '',
                                onRequestHideRemoveButton: '',
                            },
                            components: [{
                                events: {
                                    onRemove: '',
                                    onChanged: '',
                                },
                                components: [
                                    {
                                        name: 'Command', kind: FittableColumns, components: [
                                            { name: 'Id', style: 'width:10px;' },
                                            { name: 'Time', kind: Input, type: 'number', style: 'width:50px;', onchange: 'handleChange' },
                                            { name: 'FlowRate', kind: Input, type: 'number', style: 'width:50px;', onchange: 'handleChange' },
                                            { name: 'ValveA', kind: Input, type: 'number', style: 'width:36px;', ontap: 'limiter', classes:'limiter' },
                                            { name: 'ValveB', kind: Input, type: 'number', style: 'width:36px;', ontap: 'limiter2', classes:'limiter2' },
                                            { name: 'Direction', kind: ToggleIconButton, src: './assets/direction.svg', style: 'width:16px;height:16px;' },
                                            { name: 'Remove', kind: IconButton, src: './assets/svg/UI-elements-forSVG_gfx-delete.svg', classes: 'btn btn-rm', style: 'height:16px;;line-height:10px;', ontap: 'handleRemove' },
                                        ]
                                    },
                                ],
                                bindings: [
                                    {
                                        from: 'index', to: '$.Id.content', transform: function (v) {
                                            return v + 1;
                                        }
                                    },
                                    {
                                        from: 'model.x', to: '$.Time.value', oneWay: false, transform: function (v, dir) {
                                            if (isNaN(v)) {
                                                return clampTime(parseFloat(Number(0).toFixed(2)));
                                            }
                                            return clampTime(parseFloat(Number(v).toFixed(2)));
                                        }
                                    },
                                    {
                                        from: 'model.flow', to: '$.FlowRate.value', oneWay: false, transform: function (v, dir) {
                                            if (isNaN(v)) {
                                                return clampFlow(parseFloat(Number(0).toFixed(2)));
                                            }
                                            return clampFlow(parseFloat(Number(v).toFixed(2)));
                                        }
                                    },
                                    { from: 'model.valves_a', to: '$.ValveA.value', oneWay: false },
                                    { from: 'model.valves_b', to: '$.ValveB.value', oneWay: false },
                                    {
                                        from: 'model.direction', to: '$.Direction.value', oneWay: false, transform: function (v) {
                                            return v ? 1 : 0;
                                        }
                                    },
                                ],
                                handleRemove: function (inSender, inEvent) {
                                    if (this.app.noEvents()) {return true;}
                                    this.doRemove();
                                    return true
                                },
                                handleChange: function (inSender, inEvent) {
                                    if (this.app.noEvents()) {return true;}
                                    this.doChanged()
                                    return true
                                },
                                limiter: function () {
                                    x = document.getElementsByClassName('limiter');
                                    var i;
                                    for (i = 0; i < x.length; i++) {
                                        x[i].setAttribute('min', '0');
                                        x[i].setAttribute('max', '3');   
                                    }
        
                                },
                                limiter2: function () {
                                    
                                    y = document.getElementsByClassName('limiter2');
                                    var q;
                                    for (q = 0; q < y.length; q++) {
                                        y[q].setAttribute('min', '0');
                                        y[q].setAttribute('max', '1');   
                                    }
        
                                },

                            }],
                            handleSort: function () {
                               
                                this.collection.sort(function (a, b) {
                                    if (a.get('x') == b.get('x')) {
                                        return a.get('id') - b.get('id');
                                    }
                                    return a.get('x') - b.get('x');
                                });
                                /*for (i=0;i<this.$.List.collection.models.length; i++){
                                    this.$.List.collection.models[i].attributes.flow  = ;
                                }*/
                                this.owner.$.FlowR.setValue('--');
                            },
                            handleTap: function (inSender, inEvent) {
                                if (this.app.noEvents()) {return true;}
                                if (inEvent.type == 'onRemove') {
                                    this.collection.remove(inEvent.model);
        
                                    // Hide remove button if only one remains
                                    if (this.collection.length == 1) {
                                        // this.showOrhideRemoveButton();
                                        // this.children[0].children[0].children[0].components[4].showing = false;
                                        this.doRequestHideRemoveButton();
                                    }
                                }
                                else {
                                    // Show remove button if they are hidden
                                    if (!this.children[0].children[0].children[0].components[4].showing) {
                                        // this.showOrhideRemoveButton();
                                        this.doRequestHideRemoveButton();
                                    }
                                    var newPoint = new Data.TracePoint({
                                        x: inEvent.model.get('x'),
                                        y: inEvent.model.get('y'),
                                        flow: inEvent.model.get('flow'),
                                        direction: inEvent.model.get('direction'),
                                        valves_a: inEvent.model.get('valves_a'),
                                        valves_b: inEvent.model.get('valves_b'),
                                    });
                                    //console.log('Flow add point %O', newPoint);
                                    this.collection.add(newPoint);
                                }
                                this.collection.sort(function (a, b) {
                                    if (a.get('x') == b.get('x')) {
                                        return a.get('id') - b.get('id');
                                    }
                                    return a.get('x') - b.get('x');
                                });
                                this.doChanged();
                                return true;
                            },
                            showOrhideRemoveButton: function () {
                                this.children[0].children[0].children[0].components[4].showing = !this.children[0].children[0].children[0].components[4].showing;
                            },
                            
                        },
                    ]
                },
                { name: 'Add', kind: Button, content: '+ ADD ROW', classes: 'btn btn-add', ontap: 'handleAdd2' },
            ]
        }
    ],
    bindings: [
        { from: 'title', to: '$.Title.content' },
        { from: 'model.commands', to: '$.List.collection', oneWay: false },
    ],
    collapse: function (inSender, inEvent) {
        var e = document.getElementById('application_panels_TestPanel_TestSetupPanel_TestArea_Pullout_FlowRate_AdvancedFlow');
        if (e.style.display == 'none') {
            e.style.display = 'block';
        }
        else if (e.style.display == 'block') {
            e.style.display = 'none';
        }
    },
    handleAdd2: function(inSender, inEvent){
        if (this.app.noEvents()) {return true;}
        this.doAdd2();
        return true;
    },
    handleTap2: function (inSender, inEvent) {
        if (this.app.noEvents()) {return true;}
        //instead of grabing object through inEvent, last object from collection is taken as template for new object.
        var lastElem = this.$.List.collection.models[this.$.List.collection.models.length - 1].attributes;
          var newPoint = new Data.TracePoint({
                x: lastElem.x + 1,
                y: lastElem.y + 1,
                flow: lastElem.flow,
                direction: lastElem.direction,
                valves_a: lastElem.valves_a,
                valves_b: lastElem.valves_b,
            });
            //console.log('Point add point %O', newPoint);
            
            this.$.List.collection.add(newPoint);

            this.$.List.collection.sort(function (a, b) {
                if (a.get('x') == b.get('x')) {
                    return a.get('id') - b.get('id');
                }
                return a.get('x') - b.get('x');
            });
            this.doChanged();
            
       
        return true;
    },
    //
    activateDrawer: function (inSender, inEvent) {
        if (this.app.noEvents()) {return true;}
        this.$.Drawer.setOpen(!this.$.Drawer.open);
        this.$.FlowR.setValue(this.$.List.collection.models[0].attributes.flow);
    },
    handleResize: function () {
        this.inherited(arguments);
    },
    showOrhideRemoveButton: function () {
        this.$.List.showOrhideRemoveButton();
    },
    handleFlow: function(){
        var val = this.$.FlowR.value;
        for (i=0;i<this.$.List.collection.models.length; i++){
            this.$.List.collection.models[i].attributes.flow  = val;
        }
        this.doChanged();
        return true;
    },
});

var PointDrawer = kind({
    name: "tx.PointDrawer",
    kind: FittableRows,
    published: {
        title: 'Default Title',
        model: null,
    },
    handlers:{
        ontap:'handleTap',
        onAdd2:'handleTap2',
        onReset:'handleReset',
    },
    events: {
        onChanged: '',
        onAdd2:'',
        onReset:'',
    },
    components: [
        {
            kind: FittableColumns, ontap: "activateDrawer", classes: 'editor-drawer', components: [
                { kind: Icon, src: './assets/svg/UI-elements-forSVG_gfx-graphpoint-orange.svg', classes: 'enyo-icon' },
                { name: 'Title', content: "Default Title" },
            ]
        },
        {
            name: "Drawer", kind: Drawer, classes: 'well borderb', open: true, ontap:'', 
            components: [
                {
                    name: 'Header', kind: FittableColumns, components: [
                        { content: '', style: 'width:48px;' },
                        {
                            style: 'width:55px;', components: [
                                { name: 'HeaderTime', kind: Icon, src: './assets/svg/UI-elements-forSVG_gfx-clock-gray.svg', style: 'height:24px;width:24px;' },
                            ]
                        },
                        {
                            style: 'width:55px;', components: [
                                { name: 'HeaderUnits', kind: Icon, src: './assets/svg/UI-elements-forSVG_gfx-ratio-gray.svg', style: 'height:24px;width:24px;' },
                            ]
                        },
                    ]
                },

                {
                    name: 'List', classes: '', kind: DataRepeater, 
                    handlers: {
                        onRemove: 'handleTap',
                        onChanged: 'handleSort',
                    },
                    events: {
                        onChanged: '',
                        onRequestHideRemoveButton: '',
                    },
                    components: [{
                        events: {
                            onRemove: '',
                            onChanged: '',
                        },
                        components: [
                            {
                                name: 'Command', kind: FittableColumns, components: [
                                    { name: 'Id', style: 'width:32px;' },
                                    { name: 'Time', kind: Input, type: 'number', style: 'width:55px;', onchange: 'handleChange' },
                                    { name: 'Value', kind: Input, type: 'number', style: 'width:55px;', onchange: 'handleChange' },
                                    { name: 'Remove', showing: true, kind: IconButton, src: './assets/svg/UI-elements-forSVG_gfx-delete.svg', classes: 'btn btn-rm', style: 'height:16px;;line-height:10px;', ontap: 'handleRemove' },
                                ], 
                            }  
                        ],
                        bindings: [
                            {
                                from: 'index', to: '$.Id.content', transform: function (v) {
                                
                                    return v + 1;
                                }
                            },
                            {
                                from: 'model.x', to: '$.Time.value', oneWay: false, transform: function (v, dir) {
                                    if (isNaN(v)) {
                                        return clampTime(parseFloat(Number(0).toFixed(2)));
                                    }
                                    return clampTime(parseFloat(Number(v).toFixed(2)));
                                }
                            },
                            {
                                from: 'model.y', to: '$.Value.value', oneWay: false, transform: function (v, dir) {
                                    if (isNaN(v)) {
                                        return clampRatio(parseFloat(Number(0).toFixed(1)));
                                    }
                                    return clampRatio(parseFloat(Number(v).toFixed(1)));
                                }
                            },
                        ],
                       
                        handleRemove: function (inSender, inEvent) {
                            if (this.app.noEvents()) {return true;}
                            this.doRemove();
                            return true
                        },
                        handleChange: function (inSender, inEvent) {
                            if (this.app.noEvents()) {return true;}
                            this.doChanged()
                            return true
                        }
                    }],
                    handleSort: function () {
                        if (this.app.noEvents()) {return true;}
                        this.collection.sort(function (a, b) {
                            if (a.get('x') == b.get('x')) {
                                return a.get('id') - b.get('id');
                            }
                            return a.get('x') - b.get('x');
                        });
                    },
                    handleTap: function (inSender, inEvent) {
                        if (this.app.noEvents()) {return true;}
                        console.log('original function');
                        
                        if (inEvent.type == 'onRemove') {
                            this.collection.remove(inEvent.model);
                            // Hide remove button if only one remains
                            if (this.collection.length == 1) {
                                // this.showOrhideRemoveButton();
                                // this.children[0].children[0].children[0].components[4].showing = false;
                                this.doRequestHideRemoveButton();
                            }
                        }
                        else {
                            // Show remove button if they are hidden
                            if (!this.children[0].children[0].children[0].components[4].showing) {
                                // this.showOrhideRemoveButton();
                                this.doRequestHideRemoveButton();
                            }
                        }
                        this.collection.sort(function (a, b) {
                            if (a.get('x') == b.get('x')) {
                                return a.get('id') - b.get('id');
                            }
                            return a.get('x') - b.get('x');
                        });
                        this.doChanged();
                        return true;
                    },
                    showOrhideRemoveButton: function () {
                        this.children[0].children[0].children[0].components[4].showing = !this.children[0].children[0].children[0].components[4].showing;
                    },
                },
                { name: 'Add', kind: Button, content: '+ ADD ROW', classes: 'btn btn-add', ontap: 'handleAdd2' },
                { name: 'Reset', kind: Button, content: 'RESET', disabled:false, classes: 'btn btn-go', ontap: 'handleReset', style:'padding:2px 11px 3px 11px;color:black;font-size:13px;font-weight:300;' },
            ],
        },
    ],
    bindings: [
        { from: 'title', to: '$.Title.content' },
        { from: 'model.commands', to: '$.List.collection', oneWay: false },
    ],
    handleAdd2: function(inSender, inEvent){
        if (this.app.noEvents()) {return true;}
        this.doAdd2();
        return true;
    },
    handleReset: function(inSender, inEvent){
        if (this.app.noEvents()) {return true;}
        this.doReset();
        return true;
    },
    handleTap2: function (inSender, inEvent) {
        if (this.app.noEvents()) {return true;}
        //instead of grabing object through inEvent, last object from collection is taken as template for new object.
        var lastElem = this.$.List.collection.models[this.$.List.collection.models.length - 1].attributes;
          var newPoint = new Data.TracePoint({
                x: lastElem.x + 1,
                y: lastElem.y + 1,
                flow: lastElem.flow,
                direction: lastElem.direction,
                valves_a: lastElem.valves_a,
                valves_b: lastElem.valves_b,
            });
            //console.log('Point add point %O', newPoint);          
            this.$.List.collection.add(newPoint);
            this.$.Reset.set('disabled', false);
            //sort the list
            this.$.List.collection.sort(function (a, b) {
                if (a.get('x') == b.get('x')) {
                    return a.get('id') - b.get('id');
                }
                return a.get('x') - b.get('x');
            });
            this.doChanged();
        return true;
    },
    handleReset:function(){
        if (this.app.noEvents()) {return true;}
        //This function is responsible for reseting the any changes that were made to methods to default method settings.
        var methodLibrary = this.parent.parent.parent.owner.owner.owner.$.TestPanel.get('defaultMethods');
        var modelName = this.model.attributes.name;
        var modelx = methodLibrary[modelName]; 
        this.$.List.collection.remove(this.$.List.collection.models);
        this.$.List.collection.add(modelx)
        //Sorting
        this.$.List.collection.sort(function (a, b) {
        if (a.get('x') == b.get('x')) {
            return a.get('id') - b.get('id');
        }
        return a.get('x') - b.get('x');
    });
    this.doChanged();
    },
    activateDrawer: function (inSender, inEvent) {
        if (this.app.noEvents()) {return true;}
        this.$.Drawer.setOpen(!this.$.Drawer.open);
    },
    handleResize: function () {
        this.inherited(arguments);
    },
    showOrhideRemoveButton: function () {
        this.$.List.showOrhideRemoveButton();
    },
});

module.exports = kind({
    name: 'tx.MethodEditorPullout',
    kind: Slideable,
    axis: 'h',
    unit: '%',
    min: 0,
    max: 100,
    value: 0,
    // draggable: false, // //!@#$%^&*() ToDo: Especially for mobile devices dragging will be needed
    classes: 'enyo-fit slideable-sample right test-width',
    published: {
        model: null,
    },
    events: {
        onRunPressed: '',
        onSavePressed: '',
        onChanged: '',
    },
    handlers: {
        onRequestHideRemoveButton: 'showHideRemoveButton',
    },
    components: [
        {
            name: 'Pull_Thingy', kind: Grabber, ontap: 'handleToggle', classes: "pullout-grabbutton", components: [
                { name: 'PullIcon', kind: IconButton, src: './assets/svg/right-arrow.png' }
            ]
        },
        {
            kind: FittableRows, classes: 'enyo-fit lead scroller outer', components: [
                { name: 'FlowRate', title: 'FLOW RATE', kind: FlowDrawer },
                //{ name: 'Valves', title: 'VALVES', kind: ValveDrawer },
                { name: 'Points', title: 'COMPOSITION', kind: PointDrawer },
            ]
        }
    ],
    bindings: [
        { from: 'model', to: '$.FlowRate.model' },
        { from: 'model', to: '$.Points.model' },
        { from: 'model', to: '$.Valves.model' },
        {
            from: 'value', to: '$.PullIcon.src', transform: function (v) {
                if (v < 50) {
                    return './assets/svg/right-arrow.png'
                }
                else if (v > 50) {
                    return './assets/svg/left-arrow.png'
                }
                return this.$.PullIcon.get('src')
            }
        },
    ],
    handleToggle: function (inSender, inEvent) {
        if (this.app.noEvents()) {return true;}
        this.toggleMinMax();
    },
    showHideRemoveButton: function (inSender, inEvent) {
        // console.log('showHideRemoveButton');

        // if (inEvent.originator.get('id').search(/(FlowRate)/g) < 0) {
        // console.log('Changing FlowRate');
        this.$.FlowRate.showOrhideRemoveButton();
        // }
        // if (inEvent.originator.get('id').search(/(Points)/g) < 0) {
        // console.log('Changing Points');
        this.$.Points.showOrhideRemoveButton();
        // }
        // if (inEvent.originator.get('id').search(/(Valves)/g) < 0) {
        // console.log('Changing Valves');
        this.$.Valves.showOrhideRemoveButton();
        // }
        return true;
    },
});
