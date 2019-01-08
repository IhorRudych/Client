/**/

var kind = require('enyo/kind'),
    FittableRows = require('layout/FittableRows'),
    FittableColumns = require('layout/FittableColumns'),
    IconButton = require('onyx/IconButton'),
    EnyoImage = require('enyo/Image'),
    ToolDecorator = require('enyo/ToolDecorator'),
    Panels = require('layout/Panels'),
    TestSetupPanel = require('./TestSetupPanel.js'),
    TestRunPanel = require('./TestRunPanel.js'),
    DeviceStatus = require('./DeviceStatus.js'),
    SolventSelection = require('./SolventSelection.js'),
    Button = require('enyo/Button'),
    ToggleButton = require('onyx/ToggleButton'),
    Popup = require('enyo/Popup'),
    Input = require('enyo/Input'),
    RadioGroup = require('onyx/RadioGroup'),
    Radio = require('onyx/RadioButton'),
    Checkbox = require('onyx/Checkbox'),
    Scroller = require('enyo/Scroller'),
    EnyoText = require('enyo/RichText'),
    Method = require('./Method.js'),
    Presets = require('../data/PresetMethods.js'),
    Signals = require('enyo/Signals');

let JSONfn = require('./JSONfn.js'),
    localForageKeys = require('./localForageKeys.js'),
    localforage = require('../../lib/localforage');

module.exports = kind({
    name: 'tst.TestPanel',
    kind: FittableRows,
    events: {
        onRequestDeleteMethod: '',
    },
    classes: 'enyo-fit data-right-column',
    published: {
        collection: null,
        defaultMethods: null,
    },
    handlers: {
        onSavePressed: 'showMethodPopup',//'saveMethod',
        onShowPopUpToDeleteMethod: 'showPopup',
    },
    components: [
        {kind: Signals, onGpioChanged: "handleGpioChanged"},
        {
            name: 'TestToolbar', kind: FittableColumns, classes: 'data-toolbar', style: 'transform:none!important;', components: [
                {
                    kind: FittableColumns, classes: 'data-label', components: [
                        { name: 'TestPageLogo', kind: EnyoImage, src: './assets/svg/UI-elements-forSVG_gfx-symbol-test-light.svg' },
                        { content: 'TEST' },
                        { content: '  -  '},
                        { name: 'MTitle', kind:EnyoText, value:'Default'},
                    ]
                },
                { kind: FittableColumns, classes:'temp-class', components: [
                    { style:'font-size:17px;', content:'Solvent B:' }, 
                    { name: 'SolventButton', classes:'solvent-select', kind: SolventSelection },
                    ]
                },
                {
                    kind: ToolDecorator, classes: 'data-logo nav-icon-group', components: [
                        { name: 'TestDeviceButton', classes: 'btn-icon', kind: DeviceStatus, style:'margin-right:20px;' },
                        // { name: 'TestSettingsButton', classes: 'btn-fade btn-icon', kind: IconButton, src: './assets/svg/UI-elements-forSVG_gfx-settings-light.svg', ontap: "revealPopup" },
                    ]
                },
                {name: "basicPopup", kind: Popup, floating: true, classes:'setting-popup', ontap: "popupHidden", 
                    components: [
                        {content: "About Instrument", classes:'setting-text', ontap:'namePopup'},                        
                        {content: "Themes", classes:'setting-text'},
                    ]
                },
            ]
        },
        {
            kind: Popup, name: 'nameSerial', modal: true, autoDismiss: false, classes: 'popup', style:'overflow-y:initial;',
            published: {
                model: null,
            },
            components: [
                {
                    kind: Scroller, classes: 'popup-box modal-mobile', style:'position:fixed;font-size:15px;', components: [
                        { content:'About Your Axcend Instrument', classes:'lead text-center', style:'font-size:1.7em;padding-bottom:10px;'},
                        { content: 'Axcend Instrument Name', style: 'padding-bottom:10px;font-weight:300;' },
                        { 
                            kind:FittableRows, style:'margin-bottom:15px;', components:[
                                { 
                                    kind: FittableColumns, classes:'border-spacer', components: [
                                        { kind:Input, placeholder:'AxcendName' },
                                        { content:'serialNumber', style:'font-size:.8em;' },            
                                    ] 
                                },
                                { classes:'border-spacer', components:[
                                    { content: 'Setting for Run', style:'font-size:.97em;font-weight:300;' },
                                    { kind:RadioGroup, classes:'text-center', components: [
                                        { kind: Radio, content:'Seconds', classes:'btn btn-go' },
                                        { kind: Radio, content:'Minutes', classes:'btn btn-go' },
                                        ] 
                                    },    
                                    { kind: FittableColumns, components:[
                                        { kind: Checkbox, classes: 'form-check-input', style: 'background-color:#e8e8e8;' },
                                        { content:'Save aborted runs' },
                                        ] 
                                    },
                                    ]
                                },
                                { content: 'Additional Export Preferences', style:'font-size:.97em;font-weight:300;' },
                                { content:'Automatically appply filters after run', style:'font-size:.97em;font-weight:300;' },
                                {
                                    kind: FittableColumns, components: [
                                        { kind:FittableRows, style:'margin-right:10px;', components:[
                                            { kind: FittableColumns, components:[
                                                { kind: Checkbox, classes: 'form-check-input', style: 'background-color:#e8e8e8;' },
                                                { content:'Invert' },
                                            ] 
                                            },
                                            { kind: FittableColumns, components:[
                                                { kind: Checkbox, classes: 'form-check-input', style: 'background-color:#e8e8e8;' },
                                                { content:'Moving Average' },
                                            ] 
                                            },
                                        ]},
                                        {
                                            kind: FittableRows, components: [
                                            { kind: FittableColumns, components:[
                                                { kind: Checkbox, classes: 'form-check-input', style: 'background-color:#e8e8e8;' },
                                                { content:'Savitzky-Golay' },
                                            ] 
                                            },
                                            { kind: FittableColumns, components:[
                                                { kind: Checkbox, classes: 'form-check-input', style: 'background-color:#e8e8e8;' },
                                                { content:'Peak Finder' },
                                            ] 
                                            },
                                
                                        ] 
                                    },                                            ]
                                },
                            ] 
                        },
                        { kind: Button, name: 'SaveNewName', content: 'SAVE', onkeypress: 'pressEnterDefault', classes: 'btn btn-delete' },
                        { kind: Button, name: 'CancelNewName', content: 'CANCEL', ontap: 'serialHidden', classes: 'btn btn-text', style: 'font-size:15px;color:black;' },
                    ],
                },
            ],
            bindings: [
                
            ],
        },
        {
            name: 'Panels', kind: Panels, fit: true, draggable: false, components: [
                { name: 'TestSetupPanel', kind: TestSetupPanel, onRunPressed:  'startHandler' },
                { name: 'TestRunPanel',   kind: TestRunPanel,   onGpioRun:     'startHandler', onStopPressed: 'stopHandler' },
                {
                    kind: Popup, name: 'popupModal', modal: true, autoDismiss: false, classes: 'popup',
                    published: {
                        model: null,
                    },
                    components: [
                        {
                            classes: 'popup-box text-center', components: [
                                { content: 'Are you sure you want to delete this method?', classes: '', style: 'font-size:23px;padding-bottom:20px;' },
                                { kind: Button, name: 'DELETE', content: 'DELETE', ontap: 'deleteMethod', classes: 'btn btn-delete' },
                                { kind: Button, name: 'doNotDeleteFileAndCloseModal', content: 'CANCEL', ontap: 'closeModal', classes: 'btn btn-text', style: 'font-size:15px;color:black;' }
                            ]
                        }
                    ]
                },
                {
                    kind: Popup, name: 'popupMethodModal', modal: true, autoDismiss: false, classes: 'popup',
                    published: {
                        model: null,
                    },
                    components: [
                        {
                            classes: 'popup-box text-center', components: [
                                { content: 'Save As New Method:', classes: '', style: 'font-size:23px;' },
                                { content: 'Give method a unique name:', classes: '', style: 'font-size:15px;padding-bottom:4px;' },
                                { name: 'MethodName', kind: Input, type: 'text', placeholder: 'Method Name Goes Here', required: true, onkeypress: 'pressEnter', },
                                { kind: Button, name: 'SAVE', content: 'SAVE', ontap: 'closeMethodModal', onkeypress: 'pressEnter', classes: 'btn btn-delete' },
                                { kind: Button, name: 'doNotSaveFileAndCloseMethodModalCancel', content: 'CANCEL', ontap: 'closeMethodModal', classes: 'btn btn-text', style: 'font-size:15px;color:black;' },
                            ],
                        },
                    ],
                    bindings: [
                        { from: 'model.content', to: '$.MethodName.content', oneWay: false },
                    ],
                },
                {
                    kind: Popup, name: 'popupMethodModalDefaultMethod', modal: true, autoDismiss: false, classes: 'popup',
                    published: {
                        model: null,
                    },
                    components: [
                        {
                            classes: 'popup-box text-center', components: [
                                { content: 'Cannot Save Over Default Method:', classes: '', style: 'font-size:23px;padding-bottom:20px;' },
                                { kind: Button, name: 'OK', content: 'CLOSE', ontap: 'closeMethodDefaultModal', onkeypress: 'pressEnterDefault', classes: 'btn btn-delete' },
                                // { kind: Button, name: 'doNotSaveFileAndCloseMethodModalOK', content: 'CANCEL', ontap: 'closeMethodDefaultModal', classes: 'btn btn-text', style: 'font-size:15px;color:black;' },
                            ],
                        },
                    ],
                    bindings: [
                        { from: 'model.content', to: '$.MethodName.content', oneWay: false },
                    ],
                },
            ],
        },
    ],
    bindings: [
        { from: 'collection', to: '$.TestSetupPanel.collection' },
        { from: 'model', to: '$.Method.method' },
        { from: '$.TestSetupPanel.selected', to: '$.TestRunPanel.model' },
    ],
    updateMethodName:function(){
        var namex = this.$.TestSetupPanel.selected.get('name');
        //console.log(name);
        this.$.MTitle.setValue(namex);
    },
    closeModal: function (sender, ev) {
        /**
         * function: closeModal
         * 
         * This closes the popupModal window.
         * If the user clicks the DELETE button,
         * then it triggers the deleteData
         * method. It then hides the modal
         * window.
         */
        this.$.popupModal.setShowing(false);

        let element = document.getElementById(this.$.popupModal.id);
        element.style.opacity = 0;
        return true;
    },
    showPopup: function (sender, ev) {
        /**
         * function: showPopup
         * 
         * This activates the modal window and renders
         * it visible for the user. It then passes
         * the data (model) for storage until the user
         * decides what to do with the data.
         */
        let p = this.$.popupModal;
        if (p) {
            // toggle the visibility of the popup
            p.setShowing(!p.getShowing());
            let element = document.getElementById(p.id);
            p.model = ev.model
            element.style.opacity = 1;
        }
        return true;
    },
    revealPopup: function(inSender, inEvent) {
        this.$.basicPopup.show();
    },
    namePopup: function(inSender, inEvent) {
        this.$.nameSerial.show();
    },
    serialHidden: function(inSender, inEvent) {
        this.$.nameSerial.setShowing(false);
    },
    aboutPopup: function(inSender, inEvent) {
        console.log('run away');
        this.$.aboutAxcend.show();
    },
    popupHidden: function(inSender, inEvent) {
        // do something
        this.$.basicPopup.setShowing(false);
    },
    deleteMethod: function (sender) {
        /**
         * function: deleteMethod
         * 
         * Called when the modal window is closed.
         * This calls a function that method that
         * deletes the method
         */
        this.$.popupModal.setShowing(false);
        if (sender.content == 'DELETE') {
            this.$.TestSetupPanel.deleteMethod(this.$.popupModal.model);

            // Remove method from localForage if exists
            let that = this;
            let savedMethods = localForageKeys[localForageKeys.savedMethods + localForageKeys.suffix];
            savedMethods.keys().then(function (keys) {
                // An array of all the key names
                if (keys.includes(that.$.popupModal.model.get('name'))) {
                    savedMethods.removeItem(that.$.popupModal.model.get('name')).then(function () {
                        // Run this code once the key has been removed.
                        console.log('Key is cleared!');
                    }).catch(function (err) {
                        // This code runs if there were any errors
                        console.log(err);
                    });
                }
            }).catch(function (err) {
                // This code runs if there were any errors
                console.log(err);
            });
        }

        let element = document.getElementById(this.$.popupModal.id);
        element.style.opacity = 0;
        return true;
    },
    constructor: function () {
        this.inherited(arguments);
    },
    create: function () {
        this.inherited(arguments);
        this.app.set('runHandler', this.startHandler);
    },
    handleResize: function () {
        this.inherited(arguments);
    },
    rendered: function () {
        this.inherited(arguments);
        this.app.set('runHandler', this.startHandler);
    },
    startHandler: function (inSender, inEvent) {
        this.app.testing(true);
        this.$.Panels.setIndex(1);
        this.$.TestRunPanel.start();
        this.updateMethodName();
        this.app.set('runHandler', this.startHandler);
    },
    handleGpioChanged: function (inSender, inEvent) {
        console.log("handleGpioChanged");
        if (!this.app.noEvents()) {console.log("Rejected"); return true;}
        console.log("Received GPIO Event");
        startHandler(inSender, inEvent);
        return true;
    },
    stopHandler: function (inSender, inEvent) {
        this.$.Panels.setIndex(0);
    },
    closeHandler: function () {
        if (!this.$.TestRunPanel.busy()) {
            this.$.Panels.setIndex(0);
        }
    },

    // Save Method & Method Popup
    pressEnter: function (inSender, inEvent) {
        /**
         * function: pressEnter
         */
        // Use inEvent.charCode to detect enter
        if (inEvent.charCode === 13) {
            this.closeMethodModal({ content: 'SAVE' });
        }
    },
    pressEnterDefault: function (inSender, inEvent) {
        /**
         * function: pressEnterDefault
         */
        // Use inEvent.charCode to detect enter
        if (inEvent.charCode === 13) {
            this.closeMethodDefaultModal()
        }
    },
    showMethodPopup: function (sender, ev) {
        /**
         * function: showMethodPopup
         * 
         * 
         */
        let isDefault = false;
        // Get Preset Data
        let Methods = this.get('defaultMethods');
        // Get New Data
        let saveMethodCommands = [];
        ev.model.get('commands').forEach(element => {
            saveMethodCommands.push({
                id: element.get('id'),
                x: element.get('x'),
                y: element.get('y'),
                flow: element.get('flow'),
                direction: element.get('direction'),
                valves_a: element.get('valves_a'),
                valves_b: element.get('valves_b'),
                valves_c: element.get('valves_c')
            });
        });
        let method = {
            name: ev.methodName,
            commands: saveMethodCommands,
        };
        console.log('ev.get("name")', ev.model.get('name'));
        console.log('Methods', Methods)
        if (Methods.hasOwnProperty(ev.model.get('name'))) {
            console.log('Default Name');
            if (JSONfn.stringify(saveMethodCommands) == JSONfn.stringify(Methods[ev.model.get('name')])) {
                isDefault = true;
            }
        }
        console.log('isDefault', isDefault);
        let p = isDefault ? this.$.popupMethodModalDefaultMethod : this.$.popupMethodModal;
        if (isDefault) {
            // let p = this.$.popupMethodModal;
            // if (false) { // ToDo: Defaults to false to temporarily allow user to save all info
            console.log('showMethodDefaultPopup');
            // Toggle the visibility of the popup
            p.setShowing(!p.getShowing());
            p.model = ev.model;
            let element = document.getElementById(p.id);
            element.style.opacity = 1;
            isDefault = false;
        } else {
            console.log('showMethodPopup');
            // Toggle the visibility of the popup
            p.setShowing(!p.getShowing());
            p.model = ev.model;
            this.$.MethodName.set('content', p.model.get('name'));
            this.$.MethodName.set('placeholder', p.model.get('name'));
            let element = document.getElementById(p.id);
            element.style.opacity = 1;
        }
        return true;
    },
    closeMethodModal: function (sender, ev) {
        /**
         * function: closeMethodModal
         * 
         * 
         */
        console.log('closeMethodModal');
        this.$.popupMethodModal.setShowing(false);
        if (sender.content == 'SAVE') {
            let name = this.$.MethodName.get('value') ? this.$.MethodName.get('value') : this.$.MethodName.get('placeholder');
            this.$.popupMethodModal.get('model').set('name', name);
            this.saveMethod('', { model: this.$.popupMethodModal.model, methodName: name });
        }
        this.$.MethodName.set('value', '');

        let element = document.getElementById(this.$.popupMethodModal.id);
        element.style.opacity = 0;
        return true;
    },
    closeMethodDefaultModal: function (sender, ev) {
        /**
         * function: closeMethodDefaultModal
         * 
         * 
         */
        console.log('closeMethodDefaultModal');
        this.$.popupMethodModalDefaultMethod.setShowing(false);

        let element = document.getElementById(this.$.popupMethodModalDefaultMethod.id);
        element.style.opacity = 0;
        return true;
    },
    saveMethod: function (inSender, inEvent) {
        /**
         * function: saveMethod
         * 
         * 
         */
        console.log('saveMethod');
        // Grab Method //!@#$%^&*() ToDo: Pass this looped data into popupMethodModal and grab it from there
        let saveMethodCommands = [];
        inEvent.model.get('commands').forEach(element => {
            saveMethodCommands.push({
                id: element.get('id'),
                x: element.get('x'),
                y: element.get('y'),
                flow: element.get('flow'),
                direction: element.get('direction'),
                valves_a: element.get('valves_a'),
                valves_b: element.get('valves_b'),
                valves_c: element.get('valves_c')
            });
        });
        let method = {
            name: inEvent.methodName,
            commands: saveMethodCommands,
        };
        // Check if current stack already exists in Array
        let savedMethods = localForageKeys[localForageKeys.savedMethods + localForageKeys.suffix];
        savedMethods.keys().then(function (keys) {
            // An array of all the key names.
            savedMethods.getItem(inEvent.model.get('name'), function (err, savedMethod) { // saveMethod should also check the default library
                try {
                    if (savedMethod) {
                        if (JSONfn.stringify(savedMethod['commands']) != JSONfn.stringify(saveMethodCommands) && !keys.includes(inEvent.methodName)) {
                            console.log('Unique Commands && Unique Name\tSaving');
                            savedMethods.setItem(inEvent.methodName, method, function (err) {
                                // if err is non-null, we got an error
                                if (err) {
                                    console.log('beg-err', err);
                                }
                            });
                        } else if (JSONfn.stringify(savedMethod['commands']) != JSONfn.stringify(saveMethodCommands) && keys.includes(inEvent.methodName)) {
                            console.log('Unique Commands && Same - Name\tNot Saving');
                            alert('Cannot save models with identical names'); // ToDo: What to do with this condition? //!@#$%^&*()
                            // alert('Same Name\nNon-Unique Names\nUnique Commands && Same - Name\nNot Saving'); // ToDo: What to do with this condition? //!@#$%^&*()
                        } else if (JSONfn.stringify(savedMethod['commands']) == JSONfn.stringify(saveMethodCommands) && !keys.includes(inEvent.methodName)) {
                            console.log('Same - Commands && Unique Name\tSaving');
                            savedMethods.setItem(inEvent.methodName, method, function (err) {
                                // if err is non-null, we got an error
                                if (err) {
                                    console.log('beg-err', err);
                                }
                            });
                        } else if (JSONfn.stringify(savedMethod['commands']) == JSONfn.stringify(saveMethodCommands) && keys.includes(inEvent.methodName)) {
                            console.log('Same - Commands && Same - Name\tNot Saving');
                            alert('Cannot save models with identical names'); // ToDo: What to do with this condition? //!@#$%^&*()
                            // alert('Identical Info \nSame - Commands && Same - Name \nNot Saving'); // ToDo: What to do with this condition? //!@#$%^&*()
                            // Do nothing, everything is the same
                        }
                    } else {
                        console.log('Method Name Defined in method Box (Not Modal)\nDoes not Yet Exist in database\tSaving');
                        savedMethods.setItem(inEvent.methodName, method, function (err) {
                            // if err is non-null, we got an error
                            if (err) {
                                console.log('beg-err', err);
                            }
                        });
                    }
                } catch (ex) {
                    console.log('saveMethod undefined', ex);
                    console.log('Method Name Defined in method Box (Not Modal)\nDoes not Yet Exist in database\tSaving');
                    savedMethods.setItem(inEvent.methodName, method, function (err) {
                        // if err is non-null, we got an error
                        if (err) {
                            console.log('beg-err', err);
                        }
                    });
                }
            });
        }).catch(function (err) {
            // This code runs if there were any errors
            console.log('beg-err', err);
        });
    },
});
