/*
 *  File: DataPanel.js 
 *  
 *  DataPanel.js contains the Data Grid ist and Data List
 *  which display are a 'file system'. When the user clicks
 *  a list item it brings them to DataManager.js which 
 *  displays the data
 * 
 */

var kind = require('enyo/kind'),
    FittableRows = require('layout/FittableRows'),
    FittableColumns = require('layout/FittableColumns'),
    FittableRowsLayout = require('layout/FittableLayout').Rows,
    Icon = require('onyx/Icon'),
    IconButton = require('onyx/IconButton'),
    Input = require('onyx/Input'),
    Checkbox = require('onyx/Checkbox'),
    EnyoImage = require('enyo/Image'),
    ToolDecorator = require('enyo/ToolDecorator'),
    GraphPanel = require('./GraphPanel.js'),
    DataGridList = require('enyo/DataGridList'),
    DataList = require('enyo/DataList'),
    Panels = require('layout/Panels'),
    Plotly = require('plotly'),
    NewViewer = require('./NewViewer.js'),
    DataControl = require('./DataControl.js'),
    PresetData = require('../data/PresetData.js'),
    DataManager = require('./DataManager.js'),
    Collection = require('enyo/Collection'),
    job = require('enyo/job'),
    Button = require('enyo/Button'),
    Popup = require('enyo/Popup'),
    DeviceStatus = require('./DeviceStatus.js'),
    GraphPanel = require('./GraphPanel.js'),
    Method = require('./Method.js'),
    Data = require('./Data.js');

let mergeSortByEnyoJSModelObjectProperty = require('./mergeSortByEnyoJSModelObjectProperty'),
    deepClone = require('./deepClone.js'),
    JSONfn = require('./JSONfn.js'),
    localForageKeys = require('./localForageKeys.js'),
    localforage = require('../../lib/localforage');;

function sortedCollection(sortCollectionData, SORT_COLUMN_NAME, ASC = true, onlyShowThisCharacteristic = false, characteristic = null) {
    /**
     * function: sortedCollection
     * 
     * sortedCollection takes an EnyoJS collection and calls
     * it grabs the data from sortCollectionData and runs it
     * through an EnyoJS variation of the merge sort algorithm.
     * 
     * @param Collection sortCollectionData
     * @param string SORT_COLUMN_NAME
     * @param Boolean ASC
     * @param Boolean onlyShowThisCharacteristic
     * @param string characteristic <-- EnoyJS model key
     * 
     * @return Collection
     */
    let dataArray = [];
    sortCollectionData.forEach((data) => {
        if (onlyShowThisCharacteristic) {
            if (data.get(characteristic)) {
                dataArray.push(data);
            }
        } else {
            dataArray.push(data);
        }
    });

    let sortedData = new Collection();
    mergeSortByEnyoJSModelObjectProperty(dataArray, SORT_COLUMN_NAME, ASC).forEach(function (data) {
        sortedData.add(data);
    });

    return sortedData;
};

const getTime = () => {
    /**
     *  function: getTime
     * 
     *  getTime returns the current time as HH:MM:ss:mm
     * 
     * @return string HH:MM:ss:mm
     */
    let d = new Date();
    let hours = d.getHours();
    if (hours < 10) { hours = '0' + hours; }
    let minutes = d.getMinutes();
    if (minutes < 10) { minutes = '0' + minutes; }
    let seconds = d.getSeconds();
    if (seconds < 10) { seconds = '0' + seconds; }
    let milliseconds = d.getSeconds();
    if (milliseconds < 10) { milliseconds = '0' + milliseconds; }
    return hours + ':' + minutes + ':' + seconds + ':' + milliseconds;
};

/**
 *  function: wait
 * 
 *  wait calls a timeout for a specified period of time
 */
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

let defaultPlotTraces = 4; // For both channels --> update in the future

module.exports = kind({
    name: 'tst.DataPanel',
    kind: FittableRows,
    classes: 'enyo-fit data-right-column',
    published: {
        collection: null,
        SORT_BY_COLUMN_NAME: "path",
        SORT_BY_ASC: true,
        onlyShowThisCharacteristic: true,
        sortingCharacteristic: null,
        defaultMethods: null,
    },
    events: {
        onReturnToTestScreen: '',
    },
    handlers: {
        onRequestResetDefaults: 'resetDefaults',
        onPassRunDataToModal: 'passRunDataToModal',
        //onUpdateModalData: 'traceChanged2',
        onRequestExportDocModal: 'showDocPopup',
    },
    components: [
        {
            name: 'DataToolbar', kind: FittableColumns, classes: 'data-toolbar', components: [
                {
                    kind: FittableColumns, classes: 'data-label', components: [
                        { name: 'DataPageLogo', kind: EnyoImage, src: './assets/svg/UI-elements-forSVG_gfx-symbol-data-light.svg' },
                        { content: 'DATA' },
                    ]
                },
                { fit: true },
                {
                    kind: ToolDecorator, classes: 'data-logo', components: [
                        { name: 'DataDeviceButton', kind: DeviceStatus, classes: 'btn-icon', style: 'cursor:pointer;margin-right:20px;' },
                        // { name: 'DataSettingsButton', kind: IconButton, classes: 'btn-fade btn-icon', src: './assets/svg/UI-elements-forSVG_gfx-settings-light.svg' },
                    ]
                }
            ]
        },
        {
            name: 'NavigationToolbar', classes: 'navbar', kind: FittableColumns, components: [
                { name: 'ListIconButton', kind: IconButton, src: './assets/svg/UI-elements-forSVG_gfx-view-list-dark.svg', ontap: 'handleListTap' },
                { name: 'GridIconButton', kind: IconButton, src: './assets/svg/UI-elements-forSVG_gfx-view-grid-dark.svg', ontap: 'handleGridTap' },
                { name: 'RecentRuns', content: 'Recent Runs', style:'color:black;' },
                { fit: true },
                { kind: Input, placeholder: 'SEARCH', oninput: 'searchInputChange' }, // search input
                { kind: IconButton, src: './assets/svg/UI-elements-forSVG_gfx-fave-50percntgray.svg', style: 'vertical-align:text-bottom;', ontap: 'displayFavorites' },
                { kind: IconButton, src: './assets/svg/UI-elements-forSVG_gfx-cancelled.svg', style: 'width:23px;vertical-align:middle;', ontap: 'displayCancelled' },
            ]
        },
        {
            name: 'DataPanels', kind: Panels, draggable: false, fit: true, onItemSelected: 'handleItemTap',
            components: [
                {
                    name: 'DataGrid', kind: DataGridList, fit: true, minHeight: 192, minWidth: 192, spacing: 16,
                    events: {
                        onItemSelected: ''
                    },
                    handlers: {
                        ontap: 'handleItemTap',
                    },
                    components: [
                        {
                            style: 'max-width:203px;', components: [
                                {
                                    kind: FittableRows, components: [
                                        //{ name: 'Preview', kind: NewViewer, staticPlot: true, width: 0, height: 128 },
                                        {
                                            name: 'Badges', style: 'width:10%;margin-top:-9px;', kind: FittableColumns, components: [
                                                {
                                                    name: 'favorite', showing: false, kind: IconButton, src: './assets/svg/UI-elements-forSVG_gfx-fave-50percntgray-copy.svg', ontap: 'addOrRemoveStar', style: 'width:20px;height:20px;display:inline-block!important;',
                                                    showingChanged: function () {
                                                        /**
                                                         * function: showingChanged
                                                         * 
                                                         * showingChanged toggles the visibility of the favorite icon
                                                         */
                                                        console.log('qwertyuiopasdfghjklzxcvbnm')
                                                        let element = document.getElementById(this.id);
                                                        if (element) {
                                                            if (element.style.backgroundImage == 'url("./assets/svg/UI-elements-forSVG_gfx-fave-50percntgray-copy.svg")') {
                                                                element.style.backgroundImage = 'url("./assets/svg/UI-elements-forSVG_gfx-fave-50percntgray.svg")';
                                                            }
                                                            else if (element.style.backgroundImage == 'url("./assets/svg/UI-elements-forSVG_gfx-fave-50percntgray.svg")') {
                                                                element.style.backgroundImage = 'url("./assets/svg/UI-elements-forSVG_gfx-fave-50percntgray-copy.svg")';
                                                            }
                                                            /* The weird code is for Safari version 11.1.1. It seems to load the image differently */
                                                            else if (element.style.backgroundImage.match(/(copy)/gm)) {
                                                                element.style.backgroundImage = 'url("./assets/svg/UI-elements-forSVG_gfx-fave-50percntgray.svg")';
                                                            }
                                                            else {
                                                                element.style.backgroundImage = 'url("./assets/svg/UI-elements-forSVG_gfx-fave-50percntgray-copy.svg")';
                                                            }
                                                        } else {
                                                            if (this.src == './assets/svg/UI-elements-forSVG_gfx-fave-50percntgray-copy.svg') {
                                                                this.style = this.style.replace(/(UI-elements-forSVG_gfx-fave-50percntgray-copy.svg)/gm, 'UI-elements-forSVG_gfx-fave-50percntgray.svg')
                                                                this.src = './assets/svg/UI-elements-forSVG_gfx-fave-50percntgray.svg';
                                                            }
                                                            else if (this.src == './assets/svg/UI-elements-forSVG_gfx-fave-50percntgray.svg') {
                                                                this.style = this.style.replace(/(UI-elements-forSVG_gfx-fave-50percntgray.svg)/gm, 'UI-elements-forSVG_gfx-fave-50percntgray-copy.svg')
                                                                this.src = './assets/svg/UI-elements-forSVG_gfx-fave-50percntgray-copy.svg';
                                                            }
                                                        }
                                                    }
                                                },
                                                { name: 'Cancelled', kind: Icon, src: './assets/svg/UI-elements-forSVG_gfx-cancelled.svg', style: 'width:20px;height:20px;' },
                                            ]
                                        },
                                        {
                                            name: 'HoverButtons', kind: FittableRows, classes: 'icon-group-grid', components: [
                                                { name: 'X', kind: IconButton, src: './assets/svg/UI-elements-forSVG_gfx-close-light.svg', classes: 'icon-mini', allowHtml: true, content: "&nbsp;", ontap: 'showPopup' },

                                            ]
                                        },
                                    ]
                                }
                            ],
                            bindings: [
                                { from: 'model', to: '$.Preview.model' },
                                // { from: 'model.method.name', to: '$.MethodName.content' },
                                { from: 'model.favorite', to: '$.Favorite.showing' },
                                { from: 'model.cancelled', to: '$.Cancelled.showing' },
                            ],
                        }
                    ],
                    handleItemTap: function () {
                        // console.log('sel', this.get('selected'));
                        this.doItemSelected({ model: this.get('selected') });
                    }
                },

                {
                    kind: FittableRows, components: [
                        {
                            name: 'SortingOptions', kind: FittableColumns, classes:'header-small',
                            components: [
                                {
                                    name: 'so_FileName', kind: FittableColumns, classes: 'sizer-table', style: 'margin-left:5%;', ASC: true, ontap: 'updateASCDSC', //30% for smaller
                                    components: [
                                        { name: 'FileName', content: 'File Name' },
                                        {
                                            name: 'so_FileName_ASC', kind: IconButton, src: './assets/svg/a-up-arrow.svg', style: "opacity:1;margin-right:-12px;", allowHtml: true, content: "&nbsp;",
                                        },
                                        {
                                            name: 'so_FileName_DSC', kind: IconButton, src: './assets/svg/a-down-arrow.svg', allowHtml: true, content: "&nbsp;",
                                        },
                                    ]
                                },
                                {
                                    name: 'so_MethodName', kind: FittableColumns, ASC: true, classes: 'sizer-table-2-H', ontap: 'updateASCDSC',
                                    components: [
                                        { name: 'MethodName', content: 'Method' },
                                        {
                                            name: 'so_MethodName_ASC', kind: IconButton, src: './assets/svg/a-up-arrow.svg', style: "margin-right:-12px;", allowHtml: true, content: "&nbsp;",
                                        },
                                        {
                                            name: 'so_MethodName_DSC', kind: IconButton, src: './assets/svg/a-down-arrow.svg', allowHtml: true, content: "&nbsp;",
                                        },
                                    ]
                                },
                                {
                                    name: 'so_Date', kind: FittableColumns, ASC: true, classes: 'sizer-table-2-D', ontap: 'updateASCDSC',
                                    components: [
                                        { name: 'Date', content: 'Date' },
                                        {
                                            name: 'so_Date_ASC', kind: IconButton, src: './assets/svg/a-up-arrow.svg', style: "margin-right:-12px;", allowHtml: true, content: "&nbsp;",
                                        },
                                        {
                                            name: 'so_Date_DSC', kind: IconButton, src: './assets/svg/a-down-arrow.svg', allowHtml: true, content: "&nbsp;",
                                        },
                                    ]
                                },
                                {
                                    name: 'so_User', kind: FittableColumns, ASC: true, style: 'width:14%;', ontap: 'updateASCDSC',
                                    components: [
                                        { name: 'User', content: 'User' },
                                        {
                                            name: 'so_User_ASC', kind: IconButton, src: './assets/svg/a-up-arrow.svg', style: "margin-right:-12px;", allowHtml: true, content: "&nbsp;",
                                        },
                                        {
                                            name: 'so_User_DSC', kind: IconButton, src: './assets/svg/a-down-arrow.svg', allowHtml: true, content: "&nbsp;",
                                        },
                                    ]
                                },
                                {
                                    name: 'so_Device_Name', kind: FittableColumns, ASC: true, ontap: 'updateASCDSC',
                                    components: [
                                        { name: 'DeviceName', content: 'Device' },
                                        {
                                            name: 'so_Device_Name_ASC', kind: IconButton, src: './assets/svg/a-up-arrow.svg', style: "margin-right:-12px;", allowHtml: true, content: "&nbsp;",
                                        },
                                        {
                                            name: 'so_Device_Name_DSC', kind: IconButton, src: './assets/svg/a-down-arrow.svg', allowHtml: true, content: "&nbsp;",
                                        },
                                    ]
                                },
                            ]
                        },
                        {
                            name: 'DataList', kind: DataList, layoutKind: FittableRowsLayout, fit: true, bottomUp: true,
                            events: {
                                onItemSelected: ''
                            },
                            handlers: {
                                ontap: 'handleItemTap',
                            },
                            components: [
                                {
                                    classes: 'row-light', components: [
                                        {
                                            kind: FittableColumns, components: [
                                                {
                                                    name: 'HoverButtons', kind: FittableRows, classes: 'icon-mini-group', components: [
                                                        {
                                                            name: 'BottomRow', kind: FittableColumns, components: [

                                                                /**
                                                                 * Bug: This next section is where the SVG fails to load properly.
                                                                 * It appears as so in the HTML:
                                                                 *      <div style="width: 16px; height: 16px; background-image: url(" .="" assets="" svg="" ui-elements-forsvg_gfx-fave-50percntgray.svg");"="" ...
                                                                 * 
                                                                 * This appears after setting the favorite and then going from DataList to DataGridList and back
                                                                 * 
                                                                 */
                                                                {
                                                                    name: 'X', kind: IconButton, src: './assets/svg/UI-elements-forSVG_gfx-close-light.svg', classes: 'icon-mini', style: 'margin:5px!important;',
                                                                    allowHtml: true, content: "&nbsp;", ontap: 'showPopup',
                                                                }
                                                            ]
                                                        },
                                                    ]
                                                },
                                                { style: 'width:auto;' },
                                               /* { name: 'Icon', kind: NewViewer, title: false, staticPlot: true, width: 32, height: 32, style: 'width:auto;' },
                                                {
                                                    name: 'Badges', classes: 'badge-list', kind: FittableColumns,
                                                    events: {
                                                        onupdateShowing: '',
                                                    },
                                                    components: [
                                                        {
                                                            name: 'Favorite', kind: Icon, showing: false, src: './assets/svg/UI-elements-forSVG_gfx-fave-50percntgray-copy.svg', style: 'width:16px;height:16px;display:inline-block!important;margin:4px;', ontap: 'addOrRemoveStar',
                                                            showingChanged: function () {
                                                                // console.log('this', this);
                                                                let element = document.getElementById(this.id);
                                                                if (element) {
                                                                    if (element.style.backgroundImage == 'url("./assets/svg/UI-elements-forSVG_gfx-fave-50percntgray-copy.svg")') {
                                                                        element.style.backgroundImage = 'url("./assets/svg/UI-elements-forSVG_gfx-fave-50percntgray.svg")';
                                                                    }
                                                                    else if (element.style.backgroundImage == 'url("./assets/svg/UI-elements-forSVG_gfx-fave-50percntgray.svg")') {
                                                                        element.style.backgroundImage = 'url("./assets/svg/UI-elements-forSVG_gfx-fave-50percntgray-copy.svg")';
                                                                    }
                                                                    /* The weird code is for Safari version 11.1.1. It seems to load the image differently */
                                                                    /*else if (element.style.backgroundImage.match(/(copy)/gm)) {
                                                                        element.style.backgroundImage = 'url("./assets/svg/UI-elements-forSVG_gfx-fave-50percntgray.svg")';
                                                                    }
                                                                    else {
                                                                        element.style.backgroundImage = 'url("./assets/svg/UI-elements-forSVG_gfx-fave-50percntgray-copy.svg")';
                                                                    }
                                                                } else {
                                                                    if (this.src == './assets/svg/UI-elements-forSVG_gfx-fave-50percntgray-copy.svg') {
                                                                        this.style = this.style.replace(/(UI-elements-forSVG_gfx-fave-50percntgray-copy.svg)/gm, 'UI-elements-forSVG_gfx-fave-50percntgray.svg')
                                                                        this.src = './assets/svg/UI-elements-forSVG_gfx-fave-50percntgray.svg';
                                                                    }
                                                                    else if (this.src == './assets/svg/UI-elements-forSVG_gfx-fave-50percntgray.svg') {
                                                                        this.style = this.style.replace(/(UI-elements-forSVG_gfx-fave-50percntgray.svg)/gm, 'UI-elements-forSVG_gfx-fave-50percntgray-copy.svg')
                                                                        this.src = './assets/svg/UI-elements-forSVG_gfx-fave-50percntgray-copy.svg';
                                                                    }
                                                                }
                                                            },
                                                        },
                                                        { name: 'Cancelled', kind: Icon, classes: '', src: './assets/svg/UI-elements-forSVG_gfx-cancelled.svg', style: 'width:16px;height:16px;' },
                                                    ],
                                                },*/
                                                { name: 'FileName', classes: 'sizer-table-4' }, // large screen 28%
                                                { name: 'MethodName', classes: 'sizer-table-2' }, // for this screen: 13%
                                                { name: 'Date', classes: 'sizer-table-1' },
                                                { name: 'User', classes: 'sizer-table-3' },
                                                { name: 'DeviceName', style: 'width:auto;' },
                                            ]
                                        }
                                    ],
                                    bindings: [
                                        { from: 'model', to: '$.Icon.model' },
                                        { from: 'model.path', to: '$.FileName.content' },
                                        { from: 'model.method.name', to: '$.MethodName.content' },
                                        { from: 'model.date', to: '$.Date.content' },
                                        { from: 'model.user', to: '$.User.content' },
                                        { from: 'model.device', to: '$.DeviceName.content' },
                                        { from: 'model.favorite', to: '$.Favorite.showing' },
                                        { from: 'model.cancelled', to: '$.Cancelled.showing' },
                                    ],
                                }
                            ],
                            handleItemTap: function () {
                                this.doItemSelected({ model: this.get('selected') });
                            }
                        }],
                },

                { name: 'DataManager', kind: DataManager },
                {
                    kind: Popup, name: 'popupModal', modal: true, autoDismiss: false, classes: 'popup',
                    published: {
                        model: null,
                    },
                    components: [
                        {
                            classes: 'popup-box text-center', components: [
                                { content: 'Are you sure you want to delete this file?', classes: '', style: 'font-size:23px;padding-bottom:20px;' },
                                { kind: Button, name: 'yesDeleteFileAndCloseModal', content: 'DELETE', ontap: 'closeModal', classes: 'btn btn-delete' },
                                { kind: Button, name: 'doNotDeleteFileAndCloseModal', content: 'CANCEL', ontap: 'closeModal', classes: 'btn btn-text', style: 'font-size:15px;color:black;' }
                            ]
                        }
                    ]
                },
                {
                    kind: Popup, name: 'popupDocModal', modal: true, autoDismiss: false, classes: 'popup',
                    published: {
                        trace: null,
                    },
                    events: {
                        onUpdateModalData: '',
                    },
                    components: [
                        {
                            classes: 'popup-box', components: [
                                // { name:'CloseModal', kind: IconButton, classes:'btn pull-right', ontap:'closeDocModal', src:'./assets/svg/UI-elements-forSVG_gfx-delete.svg', style:'width:20px;height:20px;' },
                                {
                                    kind: FittableRows, classes: 'text-center', style: 'border-bottom:2px black solid;', components: [
                                        {
                                            kind: EnyoImage, style: 'width:150px', src: './assets/svg/Axcend_main.png'
                                        },
                                    ]
                                },
                                {
                                    name: 'AwesomeModalRows', classes: '', components: [
                                        {
                                            name: 'AwesomeModal_RunInformation', components: [
                                                {
                                                    name: 'Project_Information', kind: FittableRows, components: [
                                                        { name: 'Project_Information_Title', content: 'Project Information:', classes: 'heading' },
                                                        {
                                                            kind: FittableColumns, components: [
                                                                {
                                                                    kind: FittableRows, classes: 'lead', style: 'width: 460px;', components: [
                                                                        {
                                                                            name: 'File_Name', kind: FittableColumns, components: [
                                                                                { name: 'FileNameTitle', allowHtml: true, content: 'File Name:&nbsp;' },
                                                                                { name: 'FileNameText', content: '' },
                                                                            ],
                                                                        },
                                                                        // {
                                                                        //     name: 'File_Location', kind: FittableColumns, components: [
                                                                        //         { name: 'File_LocationTitle', allowHtml: true, content: 'File Location:&nbsp;' },
                                                                        //         { name: 'File_LocationText', content: '' },
                                                                        //     ],
                                                                        // },
                                                                        /* {
                                                                            name: 'Report_Style', kind: FittableColumns, components: [
                                                                                { name: 'Report_StyleTitle', allowHtml: true, content: 'Report Style:&nbsp;' },
                                                                                { name: 'Report_StyleText', content: 'Standard' },
                                                                            ],
                                                                        }, */
                                                                        {
                                                                            name: 'UserName', kind: FittableColumns, components: [
                                                                                { name: 'UserNameTitle', allowHtml: true, content: 'User Name:&nbsp;' },
                                                                                { name: 'UserNameText', content: '' },
                                                                            ],
                                                                        },
                                                                    ]
                                                                },
                                                                // { fit: true },
                                                                {
                                                                    kind: FittableRows, classes: 'lead', components: [
                                                                        {
                                                                            name: 'File_Creation_Date', kind: FittableColumns, components: [
                                                                                { name: 'File_Creation_DateTitle', allowHtml: true, content: 'File Creation Date:&nbsp;' },
                                                                                { name: 'File_Creation_DateText', content: '' },
                                                                            ],
                                                                        },
                                                                        /* {
                                                                            name: 'UserName', kind: FittableColumns, components: [
                                                                                { name: 'UserNameTitle', allowHtml: true, content: 'User Name:&nbsp;' },
                                                                                { name: 'UserNameText', content: '' },
                                                                            ],
                                                                        }, */
                                                                        {
                                                                            name: 'DeviceNameReport', kind: FittableColumns, components: [
                                                                                { name: 'DeviceNameTitle', allowHtml: true, content: 'Device Name:&nbsp;' },
                                                                                { name: 'DeviceNameText', content: '' },
                                                                            ],
                                                                        },

                                                                    ]

                                                                },

                                                            ]
                                                        },
                                                    ]
                                                },
                                                /* {
                                                    name: 'Sample_Information', kind: FittableRows, components: [
                                                        {
                                                            name: 'Sample_Information_Title', content: 'Sample Information:', classes: 'heading'
                                                        },
                                                        {
                                                            kind: FittableColumns, components: [
                                                                {
                                                                    kind: FittableRows, classes: 'lead', style: 'width: 460px;', components: [
                                                                        {
                                                                            name: 'Sample_Name', kind: FittableColumns, components: [
                                                                                { name: 'Sample_Name_Title', allowHtml: true, content: 'Sample Name:&nbsp;' },
                                                                                { name: 'Sample_Name_Text', content: 'Awesome Sample Name' }
                                                                            ]
                                                                        },
                                                                        {
                                                                            name: 'Sample_id', kind: FittableColumns, components: [
                                                                                { name: 'Sample_id_Title', allowHtml: true, content: 'Sample Id:&nbsp;' },
                                                                                { name: 'Sample_id_Text', content: '456' }
                                                                            ]
                                                                        },
                                                                        {
                                                                            name: 'Dilution_Factor', kind: FittableColumns, components: [
                                                                                { name: 'Dilution_Factor_Title', allowHtml: true, content: 'Dilution Factor:&nbsp;' },
                                                                                { name: 'Dilution_Factor_Text', content: '456' }
                                                                            ]
                                                                        },
                                                                        {
                                                                            name: 'Sample_Quantity', kind: FittableColumns, components: [
                                                                                { name: 'Sample_Quantity_Title', allowHtml: true, content: 'Sample Quantity:&nbsp;' },
                                                                                { name: 'Sample_Quantity_Text', content: '456' }
                                                                            ]
                                                                        },
                                                                    ]
                                                                },
                                                                // { fit: true },
                                                                {
                                                                    kind: FittableRows, classes: 'lead', components: [
                                                                        {
                                                                            name: 'VialNum', kind: FittableColumns, components: [
                                                                                { name: 'VialNum_Title', allowHtml: true, content: 'Vial #:&nbsp;' },
                                                                                { name: 'VialNum_Text', content: '456' }
                                                                            ]
                                                                        },
                                                                        {
                                                                            name: 'Injection_Volume', kind: FittableColumns, components: [
                                                                                { name: 'Injection_Volume_Title', allowHtml: true, content: 'Injection Volume:&nbsp;' },
                                                                                { name: 'Injection_Volume_Text', content: '456' }
                                                                            ]
                                                                        },
                                                                        {
                                                                            name: 'Level#', kind: FittableColumns, components: [
                                                                                { name: 'Level_Title', allowHtml: true, content: 'Level #:&nbsp;' },
                                                                                { name: 'Level_Text', content: '456' }
                                                                            ]
                                                                        },
                                                                    ]
                                                                }
                                                            ]
                                                        },
                                                    ]
                                                }, */
                                                {
                                                    name: 'Methods_Information', kind: FittableRows, components: [
                                                        { name: 'Methods_Title', content: 'Methods:', classes: 'heading' },
                                                        {
                                                            name: 'Method_Name', kind: FittableColumns, classes: 'lead', components: [
                                                                { name: 'Method_Name_Title', allowHtml: true, content: 'Method Name:&nbsp;' },
                                                                { name: 'Method_Name_Text', content: '' },
                                                            ]
                                                        },
                                                        {
                                                            name: 'Applied_Filters', kind: FittableColumns, classes: 'lead', components: [
                                                                { name: 'Applied_Filters_Title', allowHtml: true, content: 'Applied Filters:&nbsp;' },
                                                                { name: 'Applied_Filters_Text', content: 'Moving Average, Savitzky-Golay' },
                                                            ]
                                                        },
                                                        /* {
                                                            name: 'Gradient_Info', kind: FittableColumns, classes: 'lead', components: [
                                                                { name: 'Gradient_Info_Title', allowHtml: true, content: 'Gradient Info:&nbsp;' },
                                                                { name: 'Gradient_Info_Text', content: '' },
                                                            ]
                                                        }, */
                                                    ]
                                                },
                                            ]
                                        },
                                        {
                                            name: 'AwesomeModalPlot', kind: FittableRows, components: [
                                                { name: 'ExportModalPlot', kind: NewViewer, classes: 'marker2', style:'padding-left:22px;padding-bottom:20px;', title: false, staticPlot: true,/*  width: 370, height: 185 */ },
                                            ]
                                        },
                                        { allowHtml: true, content: '<br>' },
                                        /* {
                                            name: 'Peak_Table', style: 'font-size:16px;', components: [
                                                {
                                                    name: 'Table_Headers', kind: FittableColumns, classes: 'table-head', components: [
                                                        { name: 'id', content: 'ID', style: 'width: 26px;padding-left:3px;' },
                                                        { name: 'Ret_Time', content: 'Ret. Time', style: 'width: 100px;' },
                                                        { name: 'Pk_Response', content: 'Pk. Response', style: 'width: 136px;' },
                                                        { name: 'Pk_Height', content: 'Pk. Height', style: 'width: 110px;' },
                                                        { name: 'Pk_Area', content: 'Pk. Area', style: 'width: 90px;' },
                                                        { name: 'Pk_Type', content: 'Pk. Type', style: 'width: 90px;' },
                                                        { name: 'Chemical_Name', content: 'Chemical Name', style: 'width: 152px;' },
                                                    ]
                                                },
                                                {
                                                    name: 'Table_Rows', kind: FittableRows, components: [
                                                        // I don't know how these will be generated. This is a sample table
                                                        {
                                                            name: 'Row_1', kind: FittableColumns, components: [
                                                                { name: 'R_id1', content: '1', style: 'width: 26px;padding-left:5px;' },
                                                                { name: 'Ret_Time1', content: '46', style: 'width: 100px;' },
                                                                { name: 'Pk_Response1', content: '82', style: 'width: 136px;' },
                                                                { name: 'Pk_Height1', content: '3', style: 'width: 110px;' },
                                                                { name: 'Pk_Area1', content: '99', style: 'width: 90px;' },
                                                                { name: 'Pk_Type1', content: '23', style: 'width: 90px;' },
                                                                { name: 'Chemical_Name1', content: 'Sulfur', style: 'width: 152px;' },
                                                            ]
                                                        },
                                                        {
                                                            name: 'Row_2', kind: FittableColumns, classes: 'table-row', components: [
                                                                { name: 'R_id2', content: '2', style: 'width: 26px;padding-left:5px;' },
                                                                { name: 'Ret_Time2', content: '46', style: 'width: 100px;' },
                                                                { name: 'Pk_Response2', content: '13', style: 'width: 136px;' },
                                                                { name: 'Pk_Height2', content: '79', style: 'width: 110px;' },
                                                                { name: 'Pk_Area2', content: '3', style: 'width: 90px;' },
                                                                { name: 'Pk_Type2', content: '60', style: 'width: 90px;' },
                                                                { name: 'Chemical_Name2', content: 'Sodium hydroxide', style: 'width: 152px;' },
                                                            ]
                                                        },
                                                        {
                                                            name: 'Row_3', kind: FittableColumns, components: [
                                                                { name: 'R_id3', content: '3', style: 'width: 26px;padding-left:5px;' },
                                                                { name: 'Ret_Time3', content: '5', style: 'width: 100px;' },
                                                                { name: 'Pk_Response3', content: '92', style: 'width: 136px;' },
                                                                { name: 'Pk_Height3', content: '69', style: 'width: 110px;' },
                                                                { name: 'Pk_Area3', content: '2', style: 'width: 90px;' },
                                                                { name: 'Pk_Type3', content: '32', style: 'width: 90px;' },
                                                                { name: 'Chemical_Name3', content: 'Mercury', style: 'width: 152px;' },
                                                            ]
                                                        },
                                                        {
                                                            name: 'Row_4', kind: FittableColumns, classes: 'table-row', components: [
                                                                { name: 'R_id4', content: '4', style: 'width: 26px;padding-left:5px;' },
                                                                { name: 'Ret_Time4', content: '55', style: 'width: 100px;' },
                                                                { name: 'Pk_Response4', content: '36', style: 'width: 136px;' },
                                                                { name: 'Pk_Height4', content: '58', style: 'width: 110px;' },
                                                                { name: 'Pk_Area4', content: '45', style: 'width: 90px;' },
                                                                { name: 'Pk_Type4', content: '1', style: 'width: 90px;' },
                                                                { name: 'Chemical_Name4', content: 'Hydrogen peroxide', style: 'width: 152px;' },
                                                            ]
                                                        },
                                                    ]
                                                },
                                            ]
                                        }, */
                                        { allowHtml: true, content: '<br>' },
                                        {
                                            kind: FittableRows, style: 'padding-bottom:30px;', components: [
                                                { name: 'Save_Data', content: 'SAVE DATA', classes: 'heading' },
                                                {
                                                    name: 'Data_Type', kind: FittableColumns, components: [
                                                        {
                                                            kind: FittableRows, classes: 'pright', components: [
                                                                { name: 'Data_Type_Heading', content: 'Save Data', classes: 'lead' },
                                                                {
                                                                    kind: FittableColumns, classes: 'lead', components: [
                                                                        { kind: Checkbox, classes: 'form-check-input', style: 'background-color:#e8e8e8;' },
                                                                        { content: 'Raw Data' }
                                                                    ]
                                                                },
                                                                {
                                                                    kind: FittableColumns, classes: 'lead', components: [
                                                                        { kind: Checkbox, classes: 'form-check-input', style: 'background-color:#e8e8e8;' },
                                                                        { content: 'Filtered Data' }
                                                                    ]
                                                                },
                                                            ]
                                                        },
                                                        {
                                                            kind: FittableRows, classes: 'pright', components: [
                                                                { name: 'Data_Format_Heading', content: "Data Formats", classes: 'lead' },
                                                                {
                                                                    kind: FittableColumns, classes: 'lead', components: [
                                                                        { kind: Checkbox, classes: 'form-check-input', style: 'background-color:#e8e8e8;' },
                                                                        { content: 'CSV' }
                                                                    ]
                                                                },
                                                                {
                                                                    kind: FittableColumns, classes: 'lead', components: [
                                                                        { kind: Checkbox, classes: 'form-check-input', style: 'background-color:#e8e8e8;' },
                                                                        { content: 'XML' }
                                                                    ]
                                                                },
                                                                {
                                                                    kind: FittableColumns, classes: 'lead', components: [
                                                                        { kind: Checkbox, classes: 'form-check-input', style: 'background-color:#e8e8e8;' },
                                                                        { content: 'ANIML XML' }
                                                                    ]
                                                                },
                                                                {
                                                                    kind: FittableColumns, classes: 'lead', components: [
                                                                        { kind: Checkbox, classes: 'form-check-input', style: 'background-color:#e8e8e8;' },
                                                                        { content: 'Include Screenshots' }
                                                                    ]
                                                                },
                                                            ]
                                                        },
                                                        {
                                                            kind: FittableRows, classes: 'pright', components: [
                                                                { name: 'Data_Convert_Heading', content: "Convert Data to", classes: 'lead' },
                                                                {
                                                                    kind: FittableColumns, classes: 'lead', components: [
                                                                        { kind: Checkbox, classes: 'form-check-input', style: 'background-color:#e8e8e8;' },
                                                                        { content: 'Absorbance' }
                                                                    ]
                                                                },
                                                                {
                                                                    kind: FittableColumns, classes: 'lead', components: [
                                                                        { kind: Checkbox, classes: 'form-check-input', style: 'background-color:#e8e8e8;' },
                                                                        { content: 'Pressure' }
                                                                    ]
                                                                },
                                                            ]
                                                        },
                                                    ]
                                                },
                                                { name: 'Report_Data', content: 'REPORT OPTIONS', classes: 'heading' },
                                                {
                                                    name: 'Report_Type', kind: FittableColumns, components: [
                                                        {
                                                            kind: FittableColumns, classes: 'lead pright', components: [
                                                                { kind: Checkbox, classes: 'form-check-input', style: 'background-color:#e8e8e8;' },
                                                                { content: 'Raw Data' }
                                                            ]
                                                        },
                                                        {
                                                            kind: FittableColumns, classes: 'lead pright', components: [
                                                                { kind: Checkbox, classes: 'form-check-input', style: 'background-color:#e8e8e8;' },
                                                                { content: 'Filter Stack' }
                                                            ]
                                                        },
                                                        {
                                                            kind: FittableColumns, classes: 'lead pright', components: [
                                                                { kind: Checkbox, classes: 'form-check-input', style: 'background-color:#e8e8e8;' },
                                                                { content: 'PDF' }
                                                            ]
                                                        },
                                                        {
                                                            kind: FittableColumns, classes: 'lead pright', components: [
                                                                { kind: Checkbox, classes: 'form-check-input', style: 'background-color:#e8e8e8;' },
                                                                { content: 'Image' }
                                                            ]
                                                        },
                                                    ]
                                                },
                                            ]
                                        },
                                        {
                                            name: 'AwesomeModalOptions', classes: 'text-center', components: [
                                                { kind: Button, name: 'saveDocAndData', content: 'EXPORT', ontap: 'closeDocModal', classes: 'btn btn-success btn-list', style: 'padding-left:3%;padding-right:3%;' },
                                                { kind: Button, name: 'advancedDocAndData', content: 'ADVANCED', ontap: 'closeDocModal', classes: 'btn btn-success btn-list' },
                                                { kind: Button, name: 'printDocAndData', content: 'PRINT', ontap: 'closeDocModal', classes: 'btn btn-go', style: 'color:#4CB048;background-color:white;' },
                                                { kind: Button, name: 'dontsaveDocAndData', content: 'CLOSE', ontap: 'closeDocModal', classes: 'btn btn-go', style: 'color:#4CB048;background-color:white;' },
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ],
                    bindings: [
                        { from: 'trace', to: '$.ExportModalPlot.model' },
                        { from: 'trace.path', to: '$.FileNameText.content' },
                        { from: 'trace.date', to: '$.File_Creation_DateText.content' },
                        { from: 'trace.user', to: '$.UserNameText.content' },
                        { from: 'trace.device', to: '$.DeviceNameText.content' },
                        { from: 'trace.method.name', to: '$.MethodName.content' },
                    ],
                    traceChanged: function () {
                        /**
                         * function: traceChanged
                         * 
                         * EnyoJS' had some trouble updating
                         * the data, so this function updates
                         * the data
                         */
//                        console.log('\t\ttraceChanged');
                        // this.children[0].children[1].children[1].children[0].set('model', this.get('trace'));
                        this.doUpdateModalData();
                    },
                },
            ],
            bindings: [
            ]
        }
    ],
    bindings: [
        { from: 'collection', to: '$.DataGrid.collection' },
        { from: 'collection', to: '$.DataList.collection' },
    ],

    handleExport: function () {
        /**
         * function: handleExport
         * 
         * handleExport triggers the RequestSaveReport
         * and it sends back which checkbox has been
         * activated
         */
        this.set('model.reportExportType', {
            Raw: this.$.OptionRaw.active,
            FilterStack: this.$.OptionStack.active,
            XML: this.$.OptionXml.active,
            PDF: this.$.OptionPdf.active,
            Image: this.$.OptionImage.active,
        });
        this.doRequestSaveReport({
            model: this.get('model'),
        });
    },
    setNoSelections: function () {
        // Uncheck all selected options
        this.$.OptionRaw.set('active', false);
        this.$.OptionStack.set('active', false);
        this.$.OptionXml.set('active', false);
        this.$.OptionPdf.set('active', false);
        this.$.OptionImage.set('active', false);
    },

    callExportReport: function () {
        /**
         * function: callExportReport
         * 
         * callExportReport triggers the RequestSaveReport
         * which saves the repoert. 
         */
        // ToDo: Allow user to configure default export options in Service panel.
        this.set('model.reportExportType', {
            Raw: false,
            FilterStack: false,
            XML: false,
            PDF: true,
            Image: false,
        });
        this.doRequestSaveReport({
            model: this.get('model'),
        });
    },
    traceChanged2: function (s, e) {
        /**
         * function: traceChanged2
         * 
         * EnyoJS' had some trouble updating
         * the data, so this function updates
         * the data
         */
        // Take trace data and update Export Modal Window

        let trace = e.originator.model;
        console.log(trace);
        this.$.popupDocModal.set('trace', trace);
        this.$.ExportModalPlot.set('model', trace);

        // File Name
        this.$.FileNameText.set('content', trace.get('path'));

        // File Location
        // ToDo://!@#$%^&*() This will be updated downloaded to the browser's default location

        // Report Style
        // this.$.Report_StyleText.set('content', 'Standard');

        // File Creation Date
        this.$.File_Creation_DateText.set('content', trace.get('date'));

        // User Name
        this.$.UserNameText.set('content', trace.get('user'));

        // Device Name
        this.$.DeviceNameText.set('content', trace.get('device'));

        // Gradient/Method
        this.$.Method_Name_Text.set('content', trace.get('method').get('name'));

        // Applied Filters
        // this.$.Applied_Filters_Text.set('content', trace.get('method'));

        // Gradient Info
        // this.$.Gradient_Info_Text.set('content', trace.get('method'));

        return true;
    },

    addOrRemoveStar: function (s, e) {
        /**
         * Toggle favorite indicator
         */
        console.log('s', this);
        let element = document.getElementById(s.id);
        s.owner.model.set('favorite', !s.owner.model.get('favorite'));

        if (s.owner.parent.id.match(/(DataGrid)/gm)) {
            if (element.style.backgroundImage == 'url("./assets/svg/UI-elements-forSVG_gfx-fave-50percntgray-copy.svg")') {
                element.style.backgroundImage = 'url("./assets/svg/UI-elements-forSVG_gfx-fave-50percntgray.svg")';
            }
            else if (element.style.backgroundImage == 'url("./assets/svg/UI-elements-forSVG_gfx-fave-50percntgray.svg")') {
                element.style.backgroundImage = 'url("./assets/svg/UI-elements-forSVG_gfx-fave-50percntgray-copy.svg")';
            }
            else if (element.style.backgroundImage.match(/(copy)/gm)) {
                element.style.backgroundImage = 'url("./assets/svg/UI-elements-forSVG_gfx-fave-50percntgray.svg")';
            }
            else {
                element.style.backgroundImage = 'url("./assets/svg/UI-elements-forSVG_gfx-fave-50percntgray-copy.svg")';
            }/* The weird code is for Safari version 11.1.1. It seems to load the image differently */
        }


        return true;
    },
    deleteData: function (s) {
        /**
         * function: deleteData
         * 
         * Delete this run from localForage and the data collection
         */
        let model;
        if (s.model) {
            model = s.model;
        } else if (s.owner.model) {
            model = s.owner.model;
        }
        let key = model.get('path');

        // Remove data from localForage if exists
        let savedData = localForageKeys[localForageKeys.savedData + localForageKeys.suffix];
        this.getSavedDataKeys().then(function (keys) {
            // An array of all the key names
            if (keys.includes(key)) {
                savedData.removeItem(key).then(function () {
                    // Run this code once the key has been removed.
                    console.log(`Key is cleared! - ${key}`);
                }).catch(function (err) {
                    // This code runs if there were any errors
                    console.log(err);
                });
            }
        }).catch(function (err) {
            // This code runs if there were any errors
            console.log(err);
        });

        this.collection.remove(model);
        return true;
    },
    closeModal: function (sender, ev) {
        /**
         * function: closeModal
         * 
         * Closes popupmodal
         */
        // console.log('closeModal');
        this.$.popupModal.setShowing(false);
        if (sender.content == 'DELETE') {
            this.deleteData(this.$.popupModal.model);
        }

        let element = document.getElementById(this.$.popupModal.id);
        element.style.opacity = 0;
        return true;
    },
    showPopup: function (sender, ev) {
        // console.log('showPopup');
        var p = this.$.popupModal;
        if (p) {
            // toggle the visibility of the popup
            p.setShowing(!p.getShowing());
            let element = document.getElementById(p.id);
            element.style.opacity = 1;
            p.model = sender;
        }
        return true;
    },
    updateASCDSC: function (s, e) {
        // console.log('s.name', s.name);
        // console.log('e', e);
        // console.log('this.$[s.name]', this.$[s.name]);
        if (e != 'Skip-Changes-On-Create-Or-handleGridTap-Or-handleListTap') {
            this.$[s.name].ASC = !this.$[s.name].ASC;
        }
        let show = 1;
        let hide = 0.5;
        let style = 'opacity';
        this.$.SortingOptions.children.forEach(child => {
            if (child.name == s.name) {
                if (this.$[s.name].ASC) {
                    this.$[s.name].children[2].applyStyle(style, hide);
                    this.$[s.name].children[1].applyStyle(style, show);
                } else {
                    this.$[s.name].children[2].applyStyle(style, show);
                    this.$[s.name].children[1].applyStyle(style, hide);
                }
            } else {
                child.ASC = true;
                child.children[2].applyStyle(style, hide);
                child.children[1].applyStyle(style, show);
            }
        });

        // REDO THIS! INEFFICIENT!!
        // Only known way (the known EnyoJS way) to sort this.collection is with the sort method
        let atts = { 'FileName': 'path', 'MethodName': 'method', 'Date': 'date', 'User': 'user', 'DeviceName': 'device' },
            sortBy = atts[this.$[s.name].children[0].name],
            ret = this.$[s.name].ASC ? [-1, 1] : [1, -1];

        // console.log('sortBy', sortBy, 'asc:', this.$[s.name].ASC);

        if (this.$[s.name].children[0].name == 'MethodName') {
            this.collection.sort((d, b) => {
                if (d.get('method').get('name') < b.get('method').get('name')) { return ret[0]; }
                if (d.get('method').get('name') > b.get('method').get('name')) { return ret[1]; }

                if (d.get('path') < b.get('path')) { return ret[0]; }
                if (d.get('path') > b.get('path')) { return ret[1]; }

                if (d.get('date') < b.get('date')) { return ret[0]; }
                if (d.get('date') > b.get('date')) { return ret[1]; }

                if (d.get('user') < b.get('user')) { return ret[0]; }
                if (d.get('user') > b.get('user')) { return ret[1]; }

                if (d.get('device') < b.get('device')) { return ret[0]; }
                if (d.get('device') > b.get('device')) { return ret[1]; }

                return 0;
            });
        } else {
            this.collection.sort((d, b) => {
                if (d.get(sortBy) < b.get(sortBy)) { return ret[0]; }
                if (d.get(sortBy) > b.get(sortBy)) { return ret[1]; }

                if (sortBy != 'path') {
                    if (d.get('path') < b.get('path')) { return ret[0]; }
                    if (d.get('path') > b.get('path')) { return ret[1]; }
                }

                if (d.get('method').get('name') < b.get('method').get('name')) { return ret[0]; }
                if (d.get('method').get('name') > b.get('method').get('name')) { return ret[1]; }

                if (sortBy != 'date') {
                    if (d.get('date') < b.get('date')) { return ret[0]; }
                    if (d.get('date') > b.get('date')) { return ret[1]; }
                }

                if (sortBy != 'user') {
                    if (d.get('user') < b.get('user')) { return ret[0]; }
                    if (d.get('user') > b.get('user')) { return ret[1]; }
                }

                if (sortBy != 'device') {
                    if (d.get('device') < b.get('device')) { return ret[0]; }
                    if (d.get('device') > b.get('device')) { return ret[1]; }
                }
                return 0;
            });
        }
        this.$.DataList.reset();
    },

    constructor: function () {
        this.inherited(arguments);
    },
    create: function () {
        this.inherited(arguments);
        this.set('collection', PresetData);
        // Load Data From localForage
        // methodLibrary -> comes from this.$.TestPanel.get('collection')
        // defaultMethods -> comes from this.$.TestPanel.get('defaultMethods')
        wait(800).then(() => { this.loadFromIndexedDB(this, this.get('collection'), this.get('defaultMethods'), this.owner.$.TestPanel.get('collection')); });

        // console.log('coll', this.get('collection'));
        // this.set('collection', sortedCollection(PresetData.get('models'), this.get('SORT_BY_COLUMN_NAME'), this.get('SORT_BY_ASC')));

        // let initialCollection = sortedCollection(this.get('collection').get('models'), this.get('SORT_BY_COLUMN_NAME'), this.get('SORT_BY_ASC'));
        // this.updateASCDSC({ name: 'so_FileName' }, 'Skip-Changes-On-Create-Or-handleGridTap-Or-handleListTap');
        this.updateASCDSC({ name: this.$.so_FileName.name }, 'Skip-Changes-On-Create-Or-handleGridTap-Or-handleListTap');
        // this.set('collection', initialCollection);

        this.handleListTap();
    },
    handleResize: function () {
        this.inherited(arguments);
    },
    rendered: function () {
        this.inherited(arguments);
    },
    handleGridTap: function () {
        this.$.DataPanels.setIndex(0);
        this.$.GridIconButton.setDisabled(true);
        this.$.ListIconButton.setDisabled(false);

        // Resort collection alphabetically
        this.set('SORT_BY_COLUMN_NAME', "path");
        this.updateASCDSC({ name: this.$.so_FileName.name }, 'Skip-Changes-On-Create-Or-handleGridTap-Or-handleListTap');
        // this.set('collection', sortedCollection(this.get('collection').get('models'), this.get('SORT_BY_COLUMN_NAME'), this.get('SORT_BY_ASC')));
    },
    handleListTap: function () {
        this.$.DataPanels.setIndex(1);
        this.$.GridIconButton.setDisabled(false);
        this.$.ListIconButton.setDisabled(true);

        // Resort collection alphabetically
        this.set('SORT_BY_COLUMN_NAME', "path");
        this.updateASCDSC({ name: this.$.so_FileName.name }, 'Skip-Changes-On-Create-Or-handleGridTap-Or-handleListTap');
        // this.set('collection', sortedCollection(this.get('collection').get('models'), this.get('SORT_BY_COLUMN_NAME'), this.get('SORT_BY_ASC')));
    },
    handleItemTap: function (inSender, inEvent) {
        if (inEvent.model) {
            // console.log('sel', inEvent.model);
            this.$.DataManager.set('model', inEvent.model);
            this.$.DataPanels.setIndex(2);
            this.$.GridIconButton.setDisabled(false);
            this.$.ListIconButton.setDisabled(false);

            this.$.DataManager.setOriginalConfig();
            this.$.DataManager.setNoSelections();
        }
    },

    resetDefaults: function (inSender, inEvent) {
        console.log('resetDefaults this', this);
        console.log('resetDefaults iS', inSender);
        console.log('resetDefaults iE', inEvent);
        let resetFilterstoDefaultStack = true;
        if (!inEvent.resetFilterstoDefaultStack && inEvent.hasOwnProperty('resetFilterstoDefaultStack')) {
            resetFilterstoDefaultStack = inEvent.resetFilterstoDefaultStack;
        }

        this.$.DataManager.setOriginalConfig();
        this.$.DataManager.setNoSelections(true, false, false, resetFilterstoDefaultStack);
        return true;
    },

    displayFavorites: function (inSender, inEvent) {
        /**
         * function: displayFavorites
         * 
         * Only display the data that has been marked as a favorite
         */
        // console.log('this.$.DataList', this.$.DataList);
        // console.log('displayFavorites inSender', inSender);
        // console.log('displayFavorites inEvent', inEvent);

        // if (this.get('SORT_BY_COLUMN_NAME') != "favorite") {
        //     this.set('SORT_BY_COLUMN_NAME', "favorite");
        // } else {
        //     this.set('SORT_BY_COLUMN_NAME', "path");
        // }
        if (this.get('onlyShowThisCharacteristic')) {
            this.set('sortingCharacteristic', 'favorite');
        }
        //Favorite Star buttons Comment this until 
        // this.set('collection',
        //     sortedCollection(
        //         this.get('collection').get('models'),
        //         this.get('SORT_BY_COLUMN_NAME'),
        //         this.get('SORT_BY_ASC'),
        //         this.get('onlyShowThisCharacteristic'),
        //         this.get('sortingCharacteristic')
        //     )
        // );
        if (this.get('sortingCharacteristic')) {
            this.set('sortingCharacteristic', null);
        }
        if (this.get('onlyShowThisCharacteristic')) {
            this.set('onlyShowThisCharacteristic', false);
        } else {
            this.set('onlyShowThisCharacteristic', true);
        }
    },
    displayCancelled: function (inSender, inEvent) {
        /**
         * function: displayCancelled
         * 
         * Only the data that has been cancelled
         */
        // console.log('displayCancelled inSender', inSender);
        // console.log('displayCancelled inEvent', inEvent);
        // console.log('onlyShowThisCharacterisitc', this.get('onlyShowThisCharacteristic'), Boolean(this.get('onlyShowThisCharacteristic') % 2));


        if (this.get('onlyShowThisCharacteristic')) {
            this.set('sortingCharacteristic', 'cancelled');
        }
        // this.set('collection',
        //     sortedCollection(
        //         this.get('collection').get('models'),
        //         this.get('SORT_BY_COLUMN_NAME'),
        //         this.get('SORT_BY_ASC'),
        //         this.get('onlyShowThisCharacteristic'),
        //         this.get('sortingCharacteristic')
        //     )
        // );
        if (this.get('sortingCharacteristic')) {
            this.set('sortingCharacteristic', null);
        }
        if (this.get('onlyShowThisCharacteristic')) {
            this.set('onlyShowThisCharacteristic', false);
        } else {
            this.set('onlyShowThisCharacteristic', true);
        }
    },

    // The next three functions filter the data when searched
    searchInputChange: function (sender) {
        job(this.id + ':search', this.bindSafely('filterList', sender.getValue()), 200);
    },
    filterList: function (filter) {
        console.log('this.filter', this.filter);
        console.log('filter', filter);
        if (filter != this.filter) {
            this.filter = filter;
            this.filtered = this.generateFilteredData(filter);
            // this.$.DataList.setCount(this.filtered.length);
            this.$.DataList.reset();
        }
    },
    generateFilteredData: function (filter) {
        var re = new RegExp('^' + filter, 'i');
        /* var r = [],
            db = [];
        this.get('collection').get('models').forEach(filter => {
            db.push(filter);
        }); */
        let atts = ['date', 'device', 'path', 'user', 'method'];
        /*
        for (var i = 0, d; (d = db[i]); i++) {
            let found = false;
            atts.forEach(attribute => {
                if (attribute == 'method') {
                    if (d.get(attribute).get('name').match(re)) {
                        found = true;
                    }
                } else {
                    if (d.get(attribute).match(re)) {
                        found = true;
                    }
                }
            });
            if (found) {
                d.dbIndex = i;
                r.push(d);
            }
        } 
        
        return r;
        */

        // REDO THIS! INEFFICIENT!!
        // Only known way to sort this.collection is with the sort method
        /*this.collection.sort((d, b) => {
            let found = [false, false];
            atts.forEach((attribute, index) => {
                if (attribute == 'method') {
                    if (d.get(attribute).get('name').match(re)) {
                        found[0] = true;
                    }
                    if (b.get(attribute).get('name').match(re)) {
                        found[1] = true;
                    }
                } else {
                    if (d.get(attribute).match(re)) {
                        found[0] = true;
                    }
                    if (b.get(attribute).match(re)) {
                        found[1] = true;
                    }
                }
            });
            console.log(found);
            if (found[0]) {
                return -1;
            } else if (found[1]) {
                return 1;
            }
            return 0;
        });*/
    },

    resetCollection: function () {
        this.$.DataPanels.setIndex(1);
        // this.set('collection', sortedCollection(PresetData.get('models'), this.get('SORT_BY_COLUMN_NAME'), this.get('SORT_BY_ASC')));
        // this.$.DataManager.set('model', null);
        return true;
    },

    jumpToRun: function (trace) {
        // console.log('DataPanel.js jumpToRun', trace);
        let that = this;
        try {
            // console.log('trace', trace);
            // that.displayLoader();
            that.handleItemTap('', { model: trace });
        }
        catch (e) {
            console.warn('Error: Model not found in collection\n\t', trace, '\nError:', e);
        }

        // Display Modal Window
        // We delay to allow the system to propagate the changes.
        wait(500).
            then(
                () => {
                    // Show PopUp
                    //that.showDocPopup(trace, true);
                    // Display Plot in Modal
                    that.$.popupDocModal.setTrace(trace);
                    //that.traceChanged2('', { originator: { model: trace } });
                }
            ).
            then(
                () => {
                    // Pass trace to asynchronous function
                    wait(500).then(() => {
                        that.updatePlot(that, trace);
                    });
                }
            );//.catch(failureCallback);
    },
    updatePlot: (that, source) => {
        // Run Data Through Default Filter Stack
//        console.log('updatePlot that', that, source);
        if (false) { //!@#$%^&*() Remove After Plot Bug Is Fixed
            that.$.DataManager.checkAllFilters();
        } else {
            hideLoader();
        }
    },
    closeDocModal: function (sender) {
        let element = document.getElementById(this.$.popupDocModal.id);
        element.style.opacity = 0;
        element.style.display = 'none';
        this.$.popupDocModal.setShowing(false);

        let that = this;
        if (sender.content == that.$.saveDocAndData.content) {
            // Save PDF & Data
            console.log('SAVING');

            // Exporting Data (Save)
            this.saveDataAsFile();
        } else if (sender.content == this.$.printDocAndData.content) {
            // Save PDF, Data, & Print
            console.log('SAVING & Printing');

            // Exporting Data (Save)
            this.saveDataAsFile();

            // Exporting Report (Print)
            this.callExportReportSave();
        }/*  else if (sender.content == this.$.dontsaveDocAndData.content) {
            // Delete Data & Return to TEST panel
            console.log('deleting Data!!');
            this.doReturnToTestScreen();
            this.deleteData(that.$.popupDocModal);
        } */
        /**
        * There is no if statement for 'Advanced'.
        * Without it, the modal will simply close and
        * leave the user at the advanced settings.
        * 
        * The user will return to the Advanced screen
        * unless they choose to delete the data
        */
        if (sender.content != this.$.dontsaveDocAndData.content) {
            // Saving to IndexedDB
            this.saveToIndexedDB(that, that.$.popupDocModal.get('model'));
        }

        // Reset plot for future runs
        this.returnModalPlotToOriginalConfigs(this);

        return true;
    },
    showDocPopup: function (trace, sentFromRun) {
//        console.log('showDocPopup trace', trace);
        // console.log('showDocPopup');
        let that = this;
        let p = that.$.popupDocModal;
        if (p) {
            // toggle the visibility of the popup
            p.setShowing(true);
            let element = document.getElementById(p.id);
            p.showing = true;
            p.cssText = p.cssText.replace(/(opacity: )\w*;/g, 'opacity: 1;');
            p.cssText = p.cssText.replace(/(display: )\w*;/g, '');
            element.style.opacity = 1;
            element.style.display = 'block';
            p._display = 'block';
            p._opacity = 1;
            p.style = p.style.replace(/(opacity: )\w*;/g, 'opacity: 1;');
            p.style = p.style.replace(/(display: )\w*;/g, 'display: block;');
            p._openTag = p._openTag.replace(/(opacity: )\w*;/g, 'opacity: 1;');
            p._openTag = p._openTag.replace(/(display: )\w*;/g, 'display: block;');

            if (sentFromRun.hasOwnProperty('sentFromGenerateReportTrigger')) {
//                console.log('sentFromRun', sentFromRun.model);
                p.model = sentFromRun.model;
                p.trace = sentFromRun.model; // Delete
                that.$.popupDocModal.setTrace(sentFromRun.model);
                //that.traceChanged2('', { originator: { model: sentFromRun.model } });
//                console.log('that.$.ExportModalPlot', that.$.ExportModalPlot);
                that.$.ExportModalPlot.set('model', sentFromRun.model);
                that.$.ExportModalPlot.model = sentFromRun.model;
                wait(500).then(() => {
                    that.updatePlot(that, 'PIG');
                });
            } else {
//                console.log('NOT sentFromRun', trace);
                p.model = trace;
                p.trace = trace; // Delete
            }
        }
        return true;
    },

    passRunDataToModal: function (s, e) {
        /**
         * function: passRunDataToModal
         * 
         * Once a run finishes this function
         * grabs the processed data and updates
         * the Export Modal Plot
         */
        // console.log('passRunDataToModal');
        let { newLayoutToFront, peaksAndAnnotationsToFront, processedDataToFront } = e.model.get('runDataForPlotting');

        let id = this.$.ExportModalPlot.getPlotConfig().id;
        let data = this.$.ExportModalPlot.getPlotConfig().data_config;

        // Update Layout
        let update = {
            'line.dash': 'dash',
            'line.width': 2,
            // Note: Original Data Color Kept For Clarity
            // 'line.color': 'rgb(230,114,30)',
        };
        Plotly.restyle(id, update, [0, 1, 2, 3]);

        // Show legend
        newLayoutToFront.showlegend = true;
        newLayoutToFront.legend = { "orientation": "h" };

        // Change colors // CSS inserted into JS
        newLayoutToFront.xaxis = { color: '#000' };
        newLayoutToFront.yaxis = { color: '#000' };
        newLayoutToFront.paper_bgcolor = '#fff';
        newLayoutToFront.plot_bgcolor = '#fff';
        Plotly.relayout(id, newLayoutToFront);

        // Update Plot Traces
        Plotly.addTraces(id, processedDataToFront);

        // Update Plot Annotations and Points
        Plotly.addTraces(id, peaksAndAnnotationsToFront);

        hideLoader();
        return true;
    },
    callExportReportSave: function () {
        /**
         * function: callExportReportSave
         * 
         * Trigger PDF Export Process in DataManager
         */
        this.$.DataManager.callExportReport();
    },
    saveDataAsFile: function () {
        /**
         * function: saveDataAsFile
         * 
         * Trigger Saving Process in DataManager
         */
        this.$.DataManager.saveDataAsFile();
    },
    saveToIndexedDB: function (that, model) {
        /**
         * function: saveToIndexedDB
         * 
         * Save data to savedData localForage
         */
        // console.log('saveToIndexedDB', model);

        // Format Method Data
        let saveMethodCommands = [];
        model.get('method').get('commands').forEach(element => {
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

        // Format Channels' Data
        let channels = {};
        model.get('channels').forEach((channel, i) => {
            // console.log('channel.trace', channel, );
            let x = [],
                y = [];
            channel.get('trace').forEach(point => {
                x.push(point.get('x'));
                y.push(point.get('y'));
            });
            channels[i] = { x: x, y: y };
        });

        // Compile all data so save
        let saveModel = {
            path: model.get('path'),
            method: {
                name: model.get('method.name'),
                commands: saveMethodCommands,
            },
            date: model.get('date'),
            user: model.get('user'),
            device: model.get('device'),
            channels: channels,
            favorite: model.get('favorite'),
            cancelled: model.get('cancelled'),
        };

        // Check if current stack already exists in Array
        let savedData = localForageKeys[localForageKeys.savedData + localForageKeys.suffix];
        savedData.setItem(model.get('path'), saveModel, function (err) {
            // if err is non-null, we got an error
            if (err) {
                console.log('beg-err', err);
            }
        });
    },
    loadFromIndexedDB: (that, dataCollection, defaultMethods, methodLibrary) => {
        /**
         * function: loadFromIndexedDB
         * 
         * loadFromIndexedDB loads the previous runs (savedData) from localForage
         * 
         * @param dataCollection // Contains the 
         * @param defaultMethods // Contains an object containing all the default methods & commands
         * @param methodLibrary  // Contains the current collection of methods
         * 
         * @return true // To Stop EnyoJS from propogating the function throughout the system
         */

        let models = {};
         methodLibrary.get('models').forEach(model => {
            models[model.get('name')] = model;
        });
        
        Promise.all([that.getSavedMethodKeys(), that.getSavedDataKeys()]).then(function (values) {
            let savedData = localForageKeys[localForageKeys.savedData + localForageKeys.suffix];
            //console.log(savedData);
            values[1].forEach(dataKey => {
                savedData.getItem(dataKey).then(function (value) {
                    // This code runs once the value has been loaded from the offline store.
                    let method;
                    if (models.hasOwnProperty(value.method.name)) {
                        let model = models[value.method.name];
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

                        // Check to see if data's method is an unmodified default method
                        if (JSONfn.stringify(saveMethodCommands) == JSONfn.stringify(defaultMethods[value.method.name])
                            &&
                            JSONfn.stringify(saveMethodCommands) == JSONfn.stringify(value.method.commands)) {

                            method = model;

                            // Check to see if data's method is a modified & saved default method
                            } /*else if (JSONfn.stringify(saveMethodCommands) != JSONfn.stringify(defaultMethods[value.method.name])) {

                            let newMethod = Method.MethodFactory();
                            newMethod.set('name', value.method.name); // ANDREW //!@#$%^&*() Decide method name for modifed default methods
                            let duplicateMethodCommands = [];
                            value.method.commands.forEach(element => {
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
                            method = newMethod;

                            // Modified & Unsaved Method
                        }*/ 
                         else {
                            let newMethod = Method.MethodFactory();
                            newMethod.set('name', /* 'modified' + ' ' + */ value.method.name);
                            let duplicateMethodCommands = [];
                            value.method.commands.forEach(element => {
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
                            method = newMethod;
                            //console.log(method);
                        }
                    } else {
                        let newMethod = Method.MethodFactory();
                        newMethod.set('name', value.method.name);
                        let duplicateMethodCommands = [];
                        value.method.commands.forEach(element => {
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
                        //console.log(duplicateMethodCommands);
                        method = newMethod;
                        //console.log(method);
                    }

                    // Build Channels --  Turn value.channels Object into our structure for channels
                    let channels = [];
                    for (let [i, channel] of Object.entries(value.channels)) {
                        channels.push(new Data.Channel({ trace: new Data.Trace() }));
                        var points = [];
                        channel.x.forEach((point, iPoint) => {
                            points.push({ x: point, y: channel.y[iPoint] });
                        });
                        channels[i].get('trace').add(points);
                        //channels[i].get('trace').add({x: channel.x[i], y: channel.y[i]});
                        //console.log(channels);
                    }

                    // Build Data
                    let trace = new Data.TraceInfo({
                        id: Data.countTraces(),
                        path: value.path,
                        method: method,
                        date: value.date,
                        user: value.user,
                        channels: channels,
                        device: value.device,
                        favorite: value.favorite,
                        cancelled: value.cancelled,
                    });
                    dataCollection.add(trace);
                    //console.log(dataCollection);
                });
            });
            
        }).catch(function (err) {
            // This code runs if there were any errors
            console.log(err);
        });
        return true;
    },

    getSavedMethodKeys: () => {
        /**
         * function: getSavedMethodKeys
         * 
         * Grab the keys from the localForage savedMethods database
         */
        let savedMethods = localForageKeys[localForageKeys.savedMethods + localForageKeys.suffix];
        return savedMethods.keys();
    },
    getSavedDataKeys: () => {
        /**
         * function: getSavedDataKeys
         * 
         * Grab the keys from the localForage savedData database
         */
        let savedData = localForageKeys[localForageKeys.savedData + localForageKeys.suffix];
        return savedData.keys();
    },
    returnModalPlotToOriginalConfigs: (that) => {
        /**
         * function: returnModalPlotToOriginalConfigs
         * 
         * Delete all of the traces that are NOT considered default
         *  Default Traces:
         *      - Channel 0
         *      - Channel 1
         *      - Method
         */

        // let plotconfigs = this.$.ExportModalPlot.getPlotConfig();
        let plotconfigs = deepClone.getClone(that.$.ExportModalPlot.getPlotConfig());
        // let update1 = {
        //     'marker.opacity': 0,
        // };
        // Plotly.restyle(plotconfigs.id, update1, 4);
        let update = {
            'line.dash': '',
            'line.color': '',
        };
        // Plotly.restyle(plotconfigs.id, update, [0, 1, 2, 3]);

        let layout_config = {
            autosize: false,
            showlegend: false,
            paper_bgcolor: 'rgb(20,20,20)',
            plot_bgcolor: 'rgb(20,20,20)',
            margin: { l: 8, r: 0, b: 0, t: 0, pad: 0 },
            xaxis: {
                autorange: true,
                rangemode: 'tozero',
                showgrid: false,
                showline: false,
                showticklabels: true,
                zeroline: true,
                zerolinewidth: 1,
            },
            yaxis: {
                autorange: true,
                rangemode: 'nonnegative',
                showgrid: false,
                showline: false,
                showticklabels: true,
                zeroline: true,
                zerolinewidth: 1,
            },
            yaxis2: {
                overlaying: 'y',
                side: 'right',
            },
        };
        // Plotly.relayout(plotconfigs.id, layout_config);

        // Delete old Traces
        let graphDiv = document.getElementById(plotconfigs.id);
        let l = graphDiv.data.length - 1;
        while (l > 4/*  > defaultPlotTraces */) {
            try {
                Plotly.deleteTraces(graphDiv, l);
            }
            catch (e) {
                console.log('e', e);
            }
            l--;
        }
        Plotly.purge(plotconfigs.id);
        Plotly.newPlot(
            plotconfigs.id,
            [],
            {},
            {}
        );

        that.$.ExportModalPlot.resetDefaults(that.$.ExportModalPlot);
    },
});

const displayLoader = module.exports.displayLoader = (id, className) => {
    /**
     * function: displayLoader
     * 
     * This function displays the cirlce loading wheel
     */
    if (!id) {
        id = 'loadingWheel';
    }
    if (!className) {
        className = 'loader';
    }
    // Display loading wheel
    let g = document.createElement('div');
    g.setAttribute("id", id);
    g.classList.add(className);
    document.body.appendChild(g);
};
const hideLoader = module.exports.hideLoader = (id) => {
    /**
     * function: hideLoader
     * 
     * This function hides the cirlce loading wheel
     */
    if (!id) {
        id = 'loadingWheel';
    }
    // Remove loading wheel
    let e = document.getElementById(id);
    if (e) {
        e.remove();
    }
};
