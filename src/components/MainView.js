/**/

var kind            = require('enyo/kind'),
    Component       = require('enyo/Component'),
    FittableRows    = require('layout/FittableRows'),
    FittableColumns = require('layout/FittableColumns'),
    Control         = require('enyo/Control'),
    Collection      = require('enyo/Collection'),
    DataRepeater    = require('enyo/DataRepeater'),
    Panels          = require('layout/Panels'),
    TextArea        = require('enyo/TextArea'),
    EnyoImage       = require('enyo/Image'),
    ToggleButton    = require('onyx/ToggleButton');

var SplashPanel     = require('./SplashPanel.js'),
    TestPanel       = require('./TestPanel.js'),
    DataPanel       = require('./DataPanel.js'),
    ConfigPanel     = require('./ConfigPanel.js');
    ServicePanel    = require('./ServicePanel.js');

var Presets         = require('../data/PresetMethods.js'),
    Method          = require('./Method.js'),
    JSONfn          = require('./JSONfn.js'),
    localForageKeys = require('./localForageKeys.js'),
    localforage     = require('../../lib/localforage');

var FooCollection = new Collection([
    { label: 'TEST', index: 0, classes: 'icon-test', showing: true },
    { label: 'DATA', index: 1, classes: 'icon-data', showing: true },
    { label: 'SERVICE', index: 2, classes: 'icon-service', showing: false },
    { label: 'CONFIG', index: 3, classes: 'icon-service', showing: true },
]);

var SelectList = kind({
    name: 'tx.SelectList',
    kind: DataRepeater,
    components: [{
        kind: FittableColumns, components: [
            { name: 'Icon', kind: EnyoImage },
            { name: 'Label', kind: Control },
        ],
        bindings: [
            {
                from: 'model.classes', to: 'dummy', transform: function (v) {
                    this.addClass(v);
                    return v;
                }
            },
            { from: 'model.label', to: '$.Label.content' },
            { from: 'model.showing', to: 'showing' },
        ]
    }]
});

var theTestPanel   = { name: 'TestPanel',
                       kind: TestPanel,
                       fit: true,
                       style:'cursor: pointer'
                     };
var automateButton = { kind:       ToggleButton,
                       name:       "AutomateButton",
                       onContent:  "Automated",
                       offContent: "Manual",
                       onChange:   "updateAutomated",
                       style:      'width:100%; font-size: 1.3rem; font-weight: bold; color: #000000; background-color: #4CB048; ignore: #f0b0b0'
                     };

document.title = "Axcend-FocusLC";
module.exports = kind({
    kind: Panels,
    fit: true,
    realtimeFit: true,
    draggable: false,
    handlers: {
        onJumpToFinishedRun: 'jumpToRun',
        onReturnToTestScreen: 'returnToTestScreen',
        onDisplayLoader: 'displayLoader'
    },
    classes:'background', components: [
        { kind: EnyoImage, sizing: 'contain', src: './assets/screens/axcend-screens-v1_pc-splash-login.svg', ontap: 'splashTapHandler' },
        {
            kind: FittableColumns, classes:'container', components: [
                {
                    name: 'Left', kind: FittableRows, classes: 'data-left-column', sizing:'center', components: [
                        { name: 'MainLogo', kind: EnyoImage, classes: 'logo-large', src: './assets/svg/Axcend main_reverse.png' },
                        automateButton,
                        { classes: 'spacer' },
                        { name: 'PageSelection', kind: SelectList, ontap: 'setPanel' },
                        { name: 'NotesArea', kind:TextArea, placeholder:'Notes for Current Run', classes:'note-box'},
                    ]
                },
                {
                    name: 'Panels', kind: Panels, fit: true, draggable: false, components: [
                        theTestPanel,
                        { name: 'DataPanel', kind: DataPanel, fit: true },
                        { name: 'ServicePanel', kind: ServicePanel, fit: true },
                        { name: 'ConfigPanel', kind: ConfigPanel, fit: true },
                    ]
                },
            ]
        },
    ],
    bindings: [],
    constructor: function () {
        this.inherited(arguments);
    },
    updateAutomated: function(inSender, inEvent)
    {
      if (this.app.isRunningTest())
      {
          console.log("Test is running, automation not permitted at this time.");
          inSender.set('value', false);
      }
      this.app.automate(inSender.value);
      console.log("isAutomated is now: " + this.app.isAutomated());
    },
    create: function () {
        this.inherited(arguments);

        this.$.TestPanel.set('collection', Presets);

        // Add saved localForage method data to Method Library
        this.addStoredMethodsToCollection(this, this.$.TestPanel.get('collection'), Presets);// ToDo: Add Presets to LocalForage

        document.addEventListener('deviceready', function () {
            console.log("Cordova is initialized and ready!");
        });
    },
    rendered: function () {
        this.inherited(arguments);
        this.$.PageSelection.set('collection', FooCollection);
        this.$.PageSelection.select(0);
        this.$.Panels.setIndex(0);
    },
    setPanel: function (inSender, inEvent) {
        /**
         * function: setPanel
         * 
         * 
         */
        var index = inEvent.model.get('index');
        this.$.Panels.setIndex(index);
        this.$.Panels.children.forEach((panel, i) => {
            let element = document.getElementById('application_panels_fittableColumns' + (i + 2));
            let str = element.childNodes[1].innerHTML;

            let element_X = document.getElementById('application_panels_' + str[0].toUpperCase() + str.slice(1).toLowerCase() + 'Panel');

            panel.attributes.class = panel.attributes.class.replace(/ \bselected\b/g, "");
            element.className = element.className.replace(/ \bselected\b/g, "");
            if (i == index) {
                panel.showing = true;
                element.className = element.className + ' selected';
                element_X.style.display = 'block';
                element_X.style.opacity = 1;
            } else {
                panel.showing = false;
                element_X.style.display = 'none';
                element_X.style.opacity = 0;
            }
        });
        if (inEvent.model.get('label') == 'DATA') {
            this.$.DataPanel.resetCollection();
        }
    },
    splashTapHandler: function () {
        /**
         * function: splashTapHandler
         * 
         * When the user clicks the splash screen
         * this redirects them to the TEST screen
         */
        var device = this.app.$.NetworkManager.getDevice(location.host)
        this.app.$.NetworkManager.connect(device);
        this.setIndex(1);
    },

    displayLoader: () => {
        /**
         * function: displayLoader
         * This function displays the cirlce loading wheel
         */
        // Display spining loading circle
        DataPanel.displayLoader();
        return true;
    },
    jumpToRun: function (is, ie) {
        /**
         * function: jumpToRun
         * 
         * After a run finishes, this brings the user from
         * the TEST screen to the DATA screen and triggers
         * the the data do be analyzed and viewed in a modal
         * window
         */
        let index = 1;
        // console.log('MainView.js jumpToRun');
        this.$.Panels.setIndex(index);
        this.$.Panels.children.forEach((panel, i) => {
            let element = document.getElementById('application_panels_fittableColumns' + (i + 2));
            console.log(element);
            let str = element.childNodes[1].innerHTML;

            let element_X = document.getElementById('application_panels_' + str[0].toUpperCase() + str.slice(1).toLowerCase() + 'Panel');

            panel.attributes.class = panel.attributes.class.replace(/ \bselected\b/g, "");
            element.className = element.className.replace(/ \bselected\b/g, "");
            if (i == index) {
                panel.showing = true;
                element.className = element.className + ' selected';
                element_X.style.display = 'block';
                element_X.style.opacity = 1;
            } else {
                panel.showing = false;
                element_X.style.display = 'none';
                element_X.style.opacity = 0;
            }
        });
        this.$.TestPanel.closeHandler();

        this.$.DataPanel.jumpToRun(ie.trace);
        if (this.app.isAutomated())
        {
            that = this;
            setTimeout(function () {
                console.log("Emitting Automated returnToTestScreen");
                that.returnToTestScreen(is, ie);
                that.app.testing(false);
            },
            3000);
        }
        return true;
    },
    returnToTestScreen: function (is, ie) {
        /**
         * function: returnToTestScreen
         * 
         * When called, this function resets all of the buttons on the 
         * left side of the screen and closes the run data
         */
        let index = 0;
        // console.log('MainView.js returnToTestScreen');
        this.$.Panels.setIndex(index);
        this.$.Panels.children.forEach((panel, i) => {
            let element = document.getElementById('application_panels_fittableColumns' + (i + 2));
            let str = element.childNodes[1].innerHTML;

            let element_X = document.getElementById('application_panels_' + str[0].toUpperCase() + str.slice(1).toLowerCase() + 'Panel');

            panel.attributes.class = panel.attributes.class.replace(/ \bselected\b/g, "");
            element.className = element.className.replace(/ \bselected\b/g, "");
            if (i == index) {
                panel.showing = true;
                element.className = element.className + ' selected';
                element_X.style.display = 'block';
                element_X.style.opacity = 1;
            } else {
                panel.showing = false;
                element_X.style.display = 'none';
                element_X.style.opacity = 0;
            }
        });
        this.$.TestPanel.closeHandler();
        return true;
    },

    addStoredMethodsToCollection: (that, methodLibrary, Presets) => {
        /**
         * function: addStoredMethodsToCollection
         * 
         * This function grabs the data stored in localForage
         * and patches it into the Method Library EnyoJS Collection
         */
        // Get Preset Data
        let presetMethods = {};
        Presets.get("models").forEach(model => {
            let saveMethodCommands = [];
            model.get('commands').forEach(element => {
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
            presetMethods[model.get("name")] = saveMethodCommands;
        });
        that.$.TestPanel.set('defaultMethods', presetMethods);
        that.$.DataPanel.set('defaultMethods', presetMethods);

        // Upload from localForage
        let savedMethods = localForageKeys[localForageKeys.savedMethods + localForageKeys.suffix];
        savedMethods.keys().then(function (keys) {
            // An array of all the key names
            keys.forEach(key => {
                let notDuplicateMethod = true;
                savedMethods.getItem(key).then(function (value) {
                    // This code runs once the value has been loaded from the offline store.
                    if (presetMethods.hasOwnProperty(value.name)) {
                        console.log('HERE!!', value.name);
                        if (JSONfn.stringify(presetMethods[value.name]) == JSONfn.stringify(value.commands)) {
                            console.log('WE HAVE A PERFECT DUPLICATE'); // ToDo: What happens if we have a duplicate in storage? --> Probably skip uploading it
                            notDuplicateMethod = false;
                        }
                    }
                    if (notDuplicateMethod) {
                        let newMethod = Method.MethodFactory();
                        newMethod.set('name', value.name);
                        let duplicateMethodCommands = [];
                        value.commands.forEach(element => {
                            duplicateMethodCommands.push(
                                new Method.Command({
                                    id: element.id,
                                    x: element.x,
                                    y: element.y,
                                    flow: element.flow,
                                    direction: element.direction,
                                    valves_a: element.valves_a,
                                    valves_b: element.valves_b,
                                    valves_c: element.valves_c
                                })
                            );
                        });
                        newMethod.set('commands', new Method.Commands(duplicateMethodCommands));
                        methodLibrary.add(newMethod, { index: Method.MethodCount() });
                    }
                }).catch(function (err) {
                    // This code runs if there were any errors
                    console.log(err);
                });

            });
        }).catch(function (err) {
            // This code runs if there were any errors
            console.log(err);
        });
    },
});
