/**/

var kind = require('enyo/kind'),
    DataList = require('enyo/DataList'),
    FittableColumns = require('layout/FittableColumns'),
    IconButton = require('onyx/IconButton'),
    FittableRows = require('layout/FittableRows'),
    Button = require('enyo/Button'),
    Popup = require('enyo/Popup');

var Graph = require('./Graph.js'),
    NewViewer = require('./NewViewer.js'),
    MethodViewer = require('./MethodViewer.js');

module.exports = kind({
    name: 'tx.MethodLibraryViewer',
    kind: DataList,
    events: {
        onRequestDuplicateMethod: '',
        onRequestDeleteMethod: '',
        onShowPopUpToDeleteMethod: '',
        // onRequestLockMethod: '',
    },
    handlers: {
        ontap: 'tapHandler'
    },
    components: [
        {
            kind: FittableColumns, classes: 'btn-fade inputhead icon-mini-group pull-left', style: 'border-left:none;', components: [
                {
                    name: 'Method', kind: NewViewer, height: 85, width: 85, style: 'margin-left:5%;', components: [
                        {
                            name: 'HoverButtons', classes: 'crud', components: [
                                {
                                    name: 'Rows', kind: FittableRows, components: [
                                        {
                                            name: 'TopRow', kind: FittableColumns, classes:'text-center', components: [
                                                {
                                                    name: 'VIEW', classes: 'btn-text', style:'width:100%;height:100%;', allowHtml: true, content: "OPEN",
                                                },
                                            ],
                                        },
                                        {
                                            name: 'BottomRow', kind: FittableRows, classes:'text-center', style: 'margin-top:-10px;', components: [
                                                {
                                                    name: 'DUPLICATE', kind: IconButton, src: './assets/svg/UI-elements-forSVG_gfx-report.svg', classes: 'btn-icon btn-fade', 
                                                },
                                                {
                                                    name: 'REMOVE', kind: IconButton, showing: true, ontap: 'showPopup', classes: 'btn-icon btn-fade', src: './assets/svg/UI-elements-forSVG_gfx-close-light.svg', style: 'display:inline-block!important;margin-left:11px;'
                                                },
                                            ]

                                        },
                                    ],
                                },
                            ]
                        },

                    ]
                },
            ],
            bindings: [
                { from: 'model', to: '$.Method.method' },
                { from: 'model.unlocked', to: '$.DELETE.showing' },
                // { from: 'model.dragAndDropPoints', to: '$.LOCK.showing' },
            ]
        },
    ],
    bindings: [],
    constructor: function () {
        this.inherited(arguments);
    },
    create: function () {
        this.inherited(arguments);
    },
    rendered: function () {
        this.inherited(arguments);
    },
    handleResize: function () {
        this.inherited(arguments);
    },
    tapHandler: function (inSender, inEvent) {
        if (this.app.noEvents()) {return true;}
        if (inEvent.originator.name == 'REMOVE') {
            this.doShowPopUpToDeleteMethod({
                inSender: inSender,
                model: inEvent.model
            });
            return true;
        } else if (inEvent.originator.name == 'DELETE') {
            this.doRequestDeleteMethod({
                model: inEvent.model,
            });
            return true;
        } else if (inEvent.originator.name == 'DUPLICATE') {
            this.doRequestDuplicateMethod({
                model: inEvent.model,
            });
            return true;
        } /* else if (inEvent.originator.name == 'LOCK') {
            let lockContent = document.getElementById(inEvent.originator.id);
            if (lockContent.innerHTML == 'LOCK') {
                lockContent.innerHTML = 'UNLOCK';
            } else {
                lockContent.innerHTML = 'LOCK';
            }
            inEvent.originator.content = lockContent.innerHTML;

            this.doRequestLockMethod({
                model: inEvent.model,
            });
            inEvent.model.set('dragAndDropPoints', !inEvent.model.get('dragAndDropPoints'));

            return true;
        } */ else if (inEvent.originator.name != 'Plot' && inEvent.originator.name != 'VIEW') {
            // console.log('inEvent.originator.name', inEvent.originator.name);
            return true;
        }
    },
});
