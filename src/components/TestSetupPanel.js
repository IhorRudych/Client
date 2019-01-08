/**/

var kind = require('enyo/kind'),
    FittableRows = require('layout/FittableRows'),
    FittableColumns = require('layout/FittableColumns'),
    IconButton = require('onyx/IconButton'),
    Icon = require('onyx/Icon'),
    EnyoImage = require('enyo/Image'),
    ToolDecorator = require('enyo/ToolDecorator'),
    SvgRoot = require('svg/Root'),
    SvgText = require('svg/Text'),
    SvgTspan = require('svg/Tspan'),
    GraphPanel = require('./GraphPanel.js'),
    Method = require('./Method.js'),
    MethodLibraryViewer = require('./MethodLibraryViewer.js'),
    MethodEditor = require('./NewMethodEditor.js'),
    //Input = require('enyo/Input'),
    Button = require('enyo/Button');

var MethodControls = kind({
});

var MethodLogo = kind({
});

var TestSetupPanel =
module.exports     = kind({
    name: 'tst.TestSetupPanel',
    kind: FittableRows,
    events: {
        onRunPressed: '',
        onSavePressed: '',
    },
    published: {
        selected: null,
    },
    handlers: {
        onRequestDuplicateMethod: 'duplicateMethod',
        onRequestDeleteMethod: 'deleteMethod',
        // onRequestLockMethod: 'lockMethod',
    },
    components: [
        { kind: IconButton, src: './assets/svg/UI-elements-forSVG_gfx-ratio-light.svg', classes: 'axis-icon' },
        { name: 'TestArea', fit: true, kind: MethodEditor, classes: 'my-graph-panel' },
        // This sets the height of the bottom panel in the test window. Test on different size screens!
        // { kind: EnyoImage, classes: 'btn-fade', ontap: 'collapse', classes:'collapser', src: './assets/svg/UI-elements-forSVG_gfx-play-button.svg' },
        {
            classes: 'axis-x-icon', components: [
                {
                    classes: 'axis-x-icon', components: [
                        { kind: IconButton, src: './assets/svg/UI-elements-forSVG_gfx-clock-light.svg', },
                        { content: 'min', style: 'font-size:.5em;line-height:1;padding-left:7px;', classes: 'text-center' },
                    ]
                },
            ]
        },
        {
            classes: 'btn-row', components: [
                {
                    kind: FittableRows, components: [
                        { name: 'RunButton', kind: Button, content: 'RUN', ontap: 'handleRun', classes: 'btn btn-success bottom', style: 'padding:6px 21px 6px 21px;margin:12px 12px 4px 12px;' },
                    ]
                },
                {
                    kind: FittableRows, style: 'position:relative;', components: [
                        { name: 'SaveButton', kind: Button, content: 'SAVE', ontap: 'handleSave', classes: 'btn btn-go bottom', style: 'position:absolute;color:#FFF;margin-left:12px;margin-bottom:12px;' },
                        // { name: 'snackbar', content:'Saved Method' }
                    ]
                },

            ]
        },
        {
            name: 'TestSelection', kind: FittableColumns, classes: 'library', /*style:'display:none;',*/ components: [
                {
                    kind: FittableColumns, classes: 'padall', fit: false, components: [
                        {
                            kind: FittableColumns, style: 'text-align:center;min-width:57px;', components: [
                                {
                                    kind: FittableRows, fit: true, components: [
                                        {
                                            classes: 'btn-fade', components: [
                                                { kind: Icon, classes: 'cssCircle', style: 'margin-top:25%;', content: '+', ontap: 'tapPlusHandler' },
                                                { content: 'ADD', style: 'font-size:10px;margin-top:-4px;', ontap: 'tapPlusHandler' }
                                            ]
                                        },
                                        /* {
                                             classes: 'btn-fade', components: [
                                                 { kind: Icon, classes: 'cssCircle', style: 'margin-top:25%;', content: '$', ontap: 'tapUploadHandler' },
                                                 { content: 'UPLOAD', style: 'font-size:10px;margin-top:-4px;', ontap: 'tapUploadHandler' } 
                                             ]
                                         },*/
                                        {
                                            classes: 'btn-fade', style: 'width:55px;', components: [
                                                { name: 'ICONLOCK', kind: Icon, classes: 'btn', style: 'margin-top:0%;', style: 'background-image:url(./assets/svg/UI-elements-forSVG_gfx-unlocked.svg)', ontap: 'tapLockHandler' },
                                                { name: 'LOCK', content: 'UNLOCKED', style: 'font-size:10px;margin-top:-15px;', ontap: 'tapLockHandler' }
                                            ]
                                        }

                                    ]
                                }
                                // {
                                //     components: [
                                //         { kind: Icon, classes: 'btn-fade', style: 'width:32px;height:32px;', src: './assets/svg/UI-elements-forSVG_gfx-fave-50percntgray.svg' },
                                //     ]
                                // },
                                // {
                                //     components: [
                                //         // Icon should toggle
                                //         // {kind: Icon, classes: 'btn-fade', style: 'width:32px;height:32px;', src: './assets/svg/UI-elements-forSVG_gfx-view-grid-dark.svg'},
                                //         { kind: Icon, classes: 'btn-fade', style: 'width:32px;height:32px;', src: './assets/svg/UI-elements-forSVG_gfx-view-list-light.svg' },
                                //     ]
                                // },
                            ]
                        },
                        { kind: FittableColumns, fit: true },
                        {
                            kind: FittableColumns, style: 'width:25px;padding-top:15px;', content: 'METHOD LIBRARY', classes: 'padall vertical-text'
                        },
                    ]
                },
                { name: 'Methods', kind: MethodLibraryViewer, fit: true, minWidth: 64, minHeight: 64, spacing: 8, style: 'bottom:4px;', ontap: 'tapHandler' },
                {
                    kind: FittableRows, classes: 'shadowing', components: [
                        { fit: true },
                        { kind: EnyoImage, style: 'width:97px;', classes: 'padall', src: './assets/svg/UI-elements-forSVG_gfx-logo-accent-reverse-.svg' }
                    ]
                },
            ]
        },
    ],
    bindings: [
        { from: 'collection', to: '$.Methods.collection' },
        { from: 'selected', to: '$.TestArea.model' },
    ],
    handleSave: function (inSender, inEvent) {
        if (this.app.noEvents()) {return true;}
        this.doSavePressed({ model: this.$.TestArea.get('model') });
        // Get the snackbar DIV
        var x = document.getElementById("application_panels_TestPanel_TestSetupPanel_snackbar");

        // Add the "show" class to DIV
        x.className = "show";

        // After 3 seconds, remove the show class from DIV
        setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
    },
    handleRun: function (inSender, inEvent) {
        if (this.app.noEvents()) {return true;}
        this.doRunPressed({ model: this.get('model') });
    },
    constructor: function () {
        this.inherited(arguments);
    },
    create: function () {
        this.inherited(arguments);
    },
    handleResize: function () {
        this.inherited(arguments);
    },

    rendered: function () {
        this.inherited(arguments);
        if (this.collection) {
            this.set('selected', this.collection.at(0));
            this.set('parent.owner.$.MTitle.value', this.selected.attributes.name);
        }
    },
    tapHandler: function (inSender, inEvent) {
        if (this.app.noEvents()) {return true;}
        this.set('selected', inEvent.model);
        //line below will update the method name with 'TEST-' 
        this.set('parent.owner.$.MTitle.value', this.selected.attributes.name);
    },
    tapPlusHandler: function () {
        if (this.app.noEvents()) {return true;}
        /**
         * function: tapPlusHandler
         * 
         * This function is triggered when the user
         * clicks the plus icon to add another method
         * to the library. This creates a new method
         * and adds it to the front of the method
         * library
         */
        console.log(this);
        console.log('tapPlusHandler');
        var methodLibrary = this.get('collection');
        var newMethod = Method.MethodFactory();
        methodLibrary.add(newMethod, { index: 0 });
    },
    /*tapUploadHandler: function () {
         
        console.log('tapUploadHandler');
        var
        
    },*/
    tapLockHandler: function () {
        if (this.app.noEvents()) {return true;}
        /**
         * function: tapLockHandler
         * 
         * This function changes the lock/unlocked
         * icon and triggers the function that
         * regulates the user's ability to click
         * the TEST plot to add and drag points
         */
        let lockContent = document.getElementById(this.$.LOCK.id);
        let iconLockContent = document.getElementById(this.$.ICONLOCK.id);
        if (lockContent.innerHTML == 'UNLOCKED') {
            lockContent.innerHTML = 'LOCKED';
            this.app.lock(true);
            iconLockContent.style.backgroundImage = 'url(./assets/svg/UI-elements-forSVG_gfx-locked.svg)';
        } else {
            lockContent.innerHTML = 'UNLOCKED';
            this.app.lock(false);
            iconLockContent.style.backgroundImage = 'url(./assets/svg/UI-elements-forSVG_gfx-unlocked.svg)';
        } //unlocked icons
        this.lockMethod();
    },
    duplicateMethod: function (inSender, inEvent) {
        if (this.app.noEvents()) {return true;}
        /**
         * function: duplicateMethod
         * 
         * This function triggers the method that
         * duplicates a previous method. It also
         * regulates the name of the duplicated
         * method
         */
        console.log('duplicateMethod');
        var methodLibrary = this.get('collection');
        var newMethod = Method.MethodFactory();
        let name = inEvent.model.get('name').match(/(Copy).{0,1}([0-9]*)/gm);
        console.log('name', name);
        if (name) {
            let num = name[0].match(/([0-9]+)/gm);
            let i;
            if (num) {
                i = parseInt(num[0]) + 1;
            } else {
                i = 1;
            }
            let newName = (i == 1) ? (inEvent.model.get('name') + ' ') : (inEvent.model.get('name').slice(0, -1 * num.length));
            newMethod.set('name', newName + i);
        } else {
            newMethod.set('name', inEvent.model.get('name') + ' - Copy');
        }

        let duplicateMethodCommands = [];
        inEvent.model.get('commands').forEach(element => {
            duplicateMethodCommands.push(
                new Method.Command({
                    id: element.get('id'),
                    x: element.get('x'),
                    y: element.get('y'),
                    flow: element.get('flow'),
                    direction: element.get('direction'),
                    valves_a: element.get('valves_a'),
                    valves_b: element.get('valves_b'),
                    valves_c: element.get('valves_c')
                })
            );
        });
        newMethod.set('commands', new Method.Commands(duplicateMethodCommands));

        methodLibrary.add(newMethod, { index: 0 });
        // return true; // ToDo: Bug: Cannot return true. Once this is done, all code associated with deleting the method stops working.
    },
    deleteMethod: function (inSender, inEvent) {
        if (this.app.noEvents()) {return true;}
        /**
         * function: deleteMethod
         * 
         * This removes the selected method
         * from the method library
         */
        console.log('deleteMethod', inSender);
        var methodLibrary = this.get('collection');
        if (inEvent) {
            methodLibrary.remove(inEvent.model);
        } else {
            methodLibrary.remove(inSender);
        }
        // return true; // ToDo: Bug: Cannot return true. Once this is done, all code associated with deleting the method stops working.
    },
    lockMethod: function () {
        /**
         * function: lockMethod
         * 
         * This toggles the clickAndDrag object
         * which lets the system know if the user
         * is allowed to click and drag data points
         */
        console.log('lockMethod');
//        this.$.TestArea.set('clickAndDrag', !this.$.TestArea.get('clickAndDrag'));
        return true;
    },
});
module.exports.handleRun = TestSetupPanel.handleRun;
