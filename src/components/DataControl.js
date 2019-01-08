/**/

var kind = require('enyo/kind'),
    FittableRows = require('layout/FittableRows'),
    FittableColumns = require('layout/FittableColumns'),
    Toolbar = require('onyx/Toolbar'),
    Button = require('onyx/Button'),
    IconButton = require('onyx/IconButton'),
    Scroller = require('enyo/Scroller'),
    Control = require('enyo/Control'),
    Collection = require('enyo/Collection'),
    DataList = require('enyo/DataList'),
    Input = require('enyo/Input'),
    TextArea = require('onyx/TextArea'),
    Picker = require('onyx/Picker'),
    Panels = require('layout/Panels'),
    Signals = require('enyo/Signals'),
    PickerDecorator = require('onyx/PickerDecorator'),
    CollapsingArranger = require('layout/CollapsingArranger'),
    FittableColumnsLayout = require('layout/FittableLayout').Columns,
    ShowingTransitionSupport = require('enyo/ShowingTransitionSupport'),
    Icon = require('onyx/Icon'),
    Drawer = require('onyx/Drawer'),
    DataRepeater = require('enyo/DataRepeater'),
    Checkbox = require('onyx/Checkbox'),
    Filter = require('./Filter.js'),
    List = require('layout/List'),
    Menu = require('onyx/Menu'),
    MenuDecorator = require('onyx/MenuDecorator'),
    MenuItem = require('onyx/MenuItem'),
    Popup = require('enyo/Popup.js'),
    Tooltip = require('onyx/Tooltip'),
    TooltipDecorator = require('onyx/TooltipDecorator'),
    localforage = require('../../lib/localforage');

let JSONfn = require('./JSONfn.js'),
    localForageKeys = require('./localForageKeys.js');
let mergeSortByEnyoJSModelObjectProperty = require('./mergeSortByEnyoJSModelObjectProperty');

var FilterDrawer = kind({
    name: "tx.FilterDrawer",
    kind: FittableRows,
    published: {
        title: 'Default Title',
        model: null,
        filters: null,

        defaultFilterStack: null,

        customFilters: null,
        selectedFilter: null,

        customFilterStacks: null,
        selectedFilterStack: null,

        draggedFilter: null,
        deletedFilter: null,
    },
    components: [
        {
            ontap: "activateDrawer", classes: 'editor-drawer', components: [
                {
                    kind: FittableColumns, ontap: 'draw', components: [
                        { kind: Icon, src: './assets/svg/UI-elements-forSVG_gfx-filter-light.svg', classes: 'enyo-icon', style: 'height:24px;width:24px;' },
                        { name: 'Title', content: "Default Title" },
                    ],
                }
            ]
        },
        {
            name: "Drawer", kind: Drawer, classes: 'well borderb', open: true, style: 'overflow:visible;', components: [
                {
                    kind: FittableColumns, components: [
                        {
                            kind: FittableColumns, components: [
                                {
                                    kind: MenuDecorator, onSelect: 'filterItemSelected', components: [
                                        {
                                            name: 'menuFilterV', kind: Button, allowHtml: true, ontap: 'draw2', classes: 'btn btn-drop', components: [
                                                {
                                                    kind: FittableColumns, components: [
                                                        { content: 'Add Filter' },
                                                        { kind: Icon, src: './assets/svg/UI-elements-forSVG_gfx_down.svg', style: 'margin:0px 0px 0px 7px;height:20px;width:20px;' }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            kind: Menu, classes: 'edge', style: '', components: [
                                                {
                                                    name: 'menuFilterScroller', kind: Scroller, defaultKind: MenuItem, vertical: 'auto', classes: 'enyo-unselectable', components: [
                                                        {
                                                            name: 'filterList', kind: DataRepeater, ontap: 'filterSelected',
                                                            components: [
                                                                {
                                                                    kind: FittableRows, defaultKind: MenuItem, classes: 'drop-down-item',
                                                                    components: [
                                                                        {
                                                                            components: [
                                                                                {
                                                                                    name: 'FilterType', kind: FittableColumns, components: [
                                                                                        // ToDo: Fix the next two lines //!@#$%^&*()
                                                                                        // { name: 'orderID', style: 'margin: 0 0 0 2px' },
                                                                                        // { name: 'dot', content: '.', style: 'margin: 0 4px 0 0' },

                                                                                        { name: 'FilterName', style: 'width:100%;' },
                                                                                    ]
                                                                                },
                                                                            ],
                                                                        },
                                                                    ],
                                                                    bindings: [
                                                                        { from: 'model.name', to: '$.FilterName.content' },
                                                                        // { from: 'index', to: '$.orderID.content' },
                                                                    ],
                                                                },
                                                            ],
                                                        },
                                                    ]
                                                },
                                                { name: 'FileInput', kind: Input, classes: 'custom-file-input input-edge input-test', type: 'file', oninput: 'saveFileAddress', style: 'height: auto;' },
                                            ]
                                        }
                                    ]
                                },
                            ]
                        },
                        {
                            kind: FittableColumns, components: [
                                {
                                    kind: MenuDecorator, onSelect: 'stackItemSelected', components: [
                                        {
                                            name: 'menuChooseStack', kind: Button, allowHtml: true, ontap: 'draw2', classes: 'btn btn-drop', components: [
                                                {
                                                    kind: FittableColumns, ontap:'heightMax', components: [
                                                        { content: 'Sequence' },
                                                        { kind: Icon, src: './assets/svg/UI-elements-forSVG_gfx_down.svg', style: 'margin:0px 0px 0px 7px;height:20px;width:20px;' }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            kind: Menu, style:'max-height:none;', components: [
                                                {
                                                    name: 'menuStackScroller', kind: Scroller, classes: 'enyo-unselectable', maxHeight: '205px', components: [
                                                        {
                                                            name: 'savedStacksList', onActivate: 'preventMenuActivate', kind: DataRepeater,
                                                            components: [
                                                                {
                                                                    kind: FittableRows, ontap: 'stackSelected', components: [
                                                                        {
                                                                            name: 'CustomStackList', kind: DataRepeater, classes: 'drop-down-item', defaultKind: MenuItem,
                                                                            components: [
                                                                                {
                                                                                    classes: 'drop-down-group', components: [
                                                                                        {
                                                                                            name: 'FilterType', kind: FittableColumns, components: [
                                                                                                // ToDo: Fix the next two lines //!@#$%^&*()
                                                                                                // { name: 'orderID', style: 'margin: 0 0 0 2px' },
                                                                                                // { name: 'dot', content: '.', style: 'margin: 0 4px 0 0' },
                                                                                                { name: 'FilterName', classes:'padall' },
                                                                                            ]
                                                                                        },
                                                                                    ],
                                                                                    bindings: [
                                                                                        { from: 'model.name', to: '$.FilterName.content' },
                                                                                        // { from: 'index', to: '$.orderID.content' },
                                                                                    ],
                                                                                },
                                                                            ],
                                                                        },
                                                                    ],
                                                                    bindings: [
                                                                        { from: 'model.models', to: '$.CustomStackList.collection' },
                                                                    ],
                                                                },
                                                            ]
                                                        },
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                },
                            ]
                        },
                    ]
                },
                {
                    name: 'List', kind: DataRepeater, selectionType: 'multi', classes: 'form-check',
                    ontap: 'itemSelected', ondragstart: 'startDraggingFilter', ondrop: "dropDraggedFilter", onholdpulse: true,
                    components: [
                        {
                            classes: 'filter-drag', components: [
                                {
                                    name: 'FilterType', kind: FittableColumns, components: [
                                        { name: 'IdBox', kind: Checkbox, classes: 'form-check-input' },
                                        // ToDo: Fix the next two lines //!@#$%^&*()
                                        // { name: 'orderID', style: 'margin: 0 0 0 2px' },
                                        // { name: 'dot', content: '.', style: 'margin: 0 4px 0 0' },

                                        { name: 'FilterName', allowHtml: true, Draggable: true, classes: 'filter-name' },
                                        { name: 'DeleteButton', kind: IconButton, src: './assets/svg/UI-elements-forSVG_gfx-delete.svg', classes: 'btn btn-rm', ontap: 'deleteFilter', style: 'height:18px;vertical-align:middle;' },
                                        {
                                            kind: TooltipDecorator, components: [
                                                { name: 'info', kind: IconButton, src: './assets/svg/info-icon-outline.svg', style: 'width:14px;height:15px;vertical-align:middle;', },
                                                { name: 'tool-tip-text', kind: Tooltip, classes: 'tool-tip-text', style: 'top:auto;' },
                                            ]
                                        },
                                    ]
                                },
                            ],
                            bindings: [
                                { from: 'model.name', to: '$.FilterName.content' },
                                // { from: 'index', to: '$.orderID.content' },
                                { from: '.$.IdBox.checked', to: '.selected' },
                                { from: 'model.info', to: '$.tool-tip-text.content' },
                            ],
                        },
                    ],
                },
                {
                    kind: FittableColumns, classes: 'form-check', components: [
                        {
                            kind: FittableColumns, components: [
                                { name: 'OptionStack', kind: Checkbox, classes: 'form-check-input', disabled:true, showing:false },
                               // { content: 'APPLY AS SEQUENCE', style: 'font-size:15px;' },
                            ]
                        },
                    ]
                },
                {
                    kind: FittableColumns, classes: 'padall', components: [
                        { name: 'ApplyButton', kind: Button, content: 'Apply Filters', ontap: 'applySelectedFilters', classes: 'btn btn-success', style: 'margin-left:0px;' },
                        //{ name: 'SaveButton', kind: Button, content: 'SAVE SEQUENCE', ontap: 'handleSave', classes: 'btn btn-go-lg btn-fade' },
                        { name: 'snackbar', content:'Saved Sequence' },
                    ]
                },
            ]
        }
    ],
    bindings: [
        { from: 'title', to: '$.Title.content' },
        { from: 'filters', to: '$.List.collection' },
        { from: 'defaultFilterStack', to: '$.filterList.collection' },
        { from: 'customFilterStacks', to: '$.savedStacksList.collection' },
    ],

    events: {
        onRequestSaveStack: '',
        onRequestApplyFilters: '',
        onRequestResetDefaults: '',
    },
    constructor: kind.inherit(function (sup) {
        return function () {
            sup.apply(this, arguments);


            const SORT_BY_COLUMN_NAME = "name";

            let filterArray = [];
            Filter.DefaultFilterStack.get('filters').forEach((filter) => {
                filterArray.push(filter);
            });
            // let sortedFilters = new Collection();
            // mergeSortByEnyoJSModelObjectProperty(filterArray, SORT_BY_COLUMN_NAME).forEach(function (filter) {
            //     sortedFilters.add(filter);
            // });

            // this.set('filters', sortedFilters);
            // this.set('defaultFilterStack', sortedFilters);
            this.set('filters', Filter.DefaultFilterStack.get('filters'));
            this.set('defaultFilterStack', Filter.DefaultFilterStack.get('filters'));

            let customFilterStacksCollection = new Collection();
            customFilterStacksCollection.add(this.get('filters'));
            let defaultFilters = [];
            let defaultFiltersRun = [];
            this.get('defaultFilterStack.models').forEach(m => {
                defaultFilters.push(m.get('name'));
                defaultFiltersRun.push(m.run);
            });

            // Retrieve the object from storage
            let savedStacks = localForageKeys[localForageKeys.savedStacks + localForageKeys.suffix];// Check if current stack already exists in Array
            savedStacks.keys().then(function (keys) {
                if (keys.length) {
                    // An Object of all the key names.
                    for (let key in keys) {
                        let newCollection = new Collection();
                        savedStacks.getItem(keys[key], function (err, savedFilter) {
                            if (err) {
                                console.log('beg-err', err);
                            }
                            // if err is non-null, we got an error. otherwise, value is the value
                            console.log('Read savedFilter: ', savedFilter);
                            for (let sF in Object.entries(savedFilter)) {
                                let filter = new Filter.Filter({
                                    name: savedFilter[sF].name,
                                    parameters: savedFilter[sF].parameters,
                                    info: savedFilter[sF].info,
                                });

                                // Copy run if filter is in default stack, otherwise JSONfn.parse it
                                if (defaultFilters.includes(savedFilter[sF].name)) {
                                    filter.run = defaultFiltersRun[defaultFilters.indexOf(savedFilter[sF].name)];
                                } else {
                                    filter.run = JSONfn.parse(savedFilter[sF].run);
                                }
                                newCollection.add(filter);
                            }
                        }).catch(function (err) {
                            // This code runs if there were any errors
                            console.log(err);
                        });
                        customFilterStacksCollection.add(newCollection);
                    }
                }
            }).catch(function (err) {
                // This code runs if there were any errors
                console.log(err);
            });

            this.set('customFilterStacks', customFilterStacksCollection);
        };
    }),
    addToCustomFilterStacksCollection: (newCollection, that) => {
        /**
         * function: addToCustomFilterStacksCollection
         * 
         * This adds a custom filter to the stack of fiters
         * in the Data tab
         * 
         * @param newCollection The data to add
         * @param that same as 'this' but from the method that calls this function
         * 
         * @return True -> Stops EnyoJS propagation throughout the system
         */
        that.get('customFilterStacks').add(newCollection);
        return true;
    },

    showPopup: function (inSender, inEvent) {
        inSender.owner.$.basicPopup.show();
    },
    popupHidden: function (inSender, inEvent) {
        // do something
    },

    heightMax: function (inSender, inEvent) {
        var tall = document.getElementById('application_panels_DataPanel_DataManager_DataControl_FilterControl_menu2_client_strategy_client');
        if  (tall.style.maxHeight == '200px') {
            tall.style.maxHeight = 'none';
        }
    },

    draw: function (inSender, inEvent) {
        var e = document.getElementById('application_panels_DataPanel_DataManager_DataControl_FilterControl_Drawer');
        if (e.style.overflow == 'visible') {
            e.style.overflow = 'hidden';
        }
    },
    draw2: function (application_panels_DataPanel_DataManager_DataControl_FilterControl_Drawer) {
        var m = document.getElementById('application_panels_DataPanel_DataManager_DataControl_FilterControl_Drawer');
        if (m.style.overflow == 'hidden') {
            m.style.overflow = 'visible';
        }
    },

    startDraggingFilter: function (sender, event) {
        /**
         * function: startDraggingFilter
         * 
         * This is triggered when the user starts dragging a filter
         */
        sender._selection = new Array();
        if (sender.get('name') == 'List') {
            this.set('draggedFilter', event.model);
            sender.children[0].children.forEach(child => {
                var x = child.get('id');
                var box = document.getElementById(x);
                box.classList.toggle('drag');
            });
        }
    },

    dropDraggedFilter: function (inSender, inEvent) {
        /**
         * function: dropDraggedFilter
         * 
         * This is triggered when the user lets the filter go
         */
        inSender._selection = new Array();
        if (this.get('draggedFilter')) {
            if (inSender.get('name') == 'List' && this.get('draggedFilter') != inEvent.model) {
                let draggedFilter = this.get('draggedFilter');
                // ReOrder Filters

                let StackOrder = [],
                    spliceLocation = null;
                this.get('filters').get('models').forEach(function (filter, filter_index) {
                    if (draggedFilter != filter) {
                        StackOrder.push(filter);
                    }
                    if (inEvent.model == filter) {
                        spliceLocation = filter_index;
                    }
                });
                StackOrder.splice(spliceLocation, 0, draggedFilter);

                let newStackOrder = new Collection();
                StackOrder.forEach(function (filter) {
                    let newFilter = new Filter.Filter({
                        name: filter.get('name'),
                        parameters: filter.get('parameters'),
                        info:filter.get('info')
                    });
                    newFilter.run = filter.run;
                    newStackOrder.add(newFilter);
                });

                this.set('filters', newStackOrder);

                this.doRequestResetDefaults({
                    model: this.get('model'),
                    resetFilterstoDefaultStack: false,
                });
            }
        }
        this.set('draggedFilter', null);
    },

    filterItemSelected: function (sender, ev) {
        /**
         * function: filterItemSelected
         * 
         * When a filter is selected from the drop down
         * it is added to the selectedFilter object value.
         * 
         * selectedFitler will be added to the stack later
         */

        // Menu items send an onSelect event with a reference to themselves & any directly displayed content
        if (ev.originator.content) {
            this.set('selectedFilter', ev.model);
        } else if (ev.selected) {
            //	Since some of the menu items do not have directly displayed content (they are kinds with subcomponents),
            //	we have to handle those items differently here.
            this.set('selectedFilter', ev.model);
        }
    },
    filterSelected: function (sender, ev) {
        /**
         * function: filterSelected
         * 
         * If a filter has been selected, reset the drop down stack
         * and add the selected filter to the drop down
         */
        if (this.get('selectedFilter')) {
            this.doRequestResetDefaults({
                model: this.get('model'),
                resetFilterstoDefaultStack: false,
            });

            let newfilterStack = new Collection();
            this.get('filters').get('models').forEach((filter, filter_index) => {
                let newFilter = new Filter.Filter({
                    name: filter.get('name'),
                    parameters: filter.get('parameters'),
                    info: filter.get('info'),
                });
                newFilter.run = filter.run;
                newfilterStack.add(newFilter);
            });

            let selectedFilter = new Filter.Filter({
                name: this.get('selectedFilter').get('name'),
                parameters: this.get('selectedFilter').get('parameters'),
                info: this.get('selectedFilter').get('info'),
            });
            selectedFilter.run = this.get('selectedFilter').run;

            newfilterStack.add(selectedFilter);

            this.set('filters', newfilterStack);
            this.set('selectedFilter', null);
        } else {
            console.log('No Filters Have Been Selected');
        }
    },

    stackItemSelected: function (sender, ev) {
        /**
         * function: stackItemSelected
         * 
         * When a filter stack is selected from the dropdown menu
         * it is added to the selectedFilterStack object value
         * 
         * later the filter stack will replace the 
         * current / default filter stack
         */
        // Menu items send an onSelect event with a reference to themselves & any directly displayed content
        if (ev.originator.content) {
            this.set('selectedFilterStack', ev.model);
        } else if (ev.selected) {
            //	Since some of the menu items do not have directly displayed content (they are kinds with subcomponents),
            //	we have to handle those items differently here.
            this.set('selectedFilterStack', ev.model);
        }
    },
    stackSelected: function (sender, ev) {
        /**
         * function: stackSelected
         * 
         * If a stack has been selected, this function
         * triggers the method that replaces
         * the filter stack.
         */
        if (this.get('selectedFilterStack')) {
            this.doRequestResetDefaults({
                model: this.get('model'),
            });

            let selectedStackCollection = new Collection();
            this.get('selectedFilterStack').get('models').forEach((filter) => {
                selectedStackCollection.add(filter);
            });

            this.set('filters', selectedStackCollection);
            this.set('selectedFilterStack', null);
        } else {
            console.log('No Stacks Have Been Selected');
        }
    },

    deleteFilter: function (inSender, inEvent) {
        /**
         * function: deleteFilter
         * 
         * Deletes selected filter from the filter stack
         */
        this.set('deletedFilter', true);
    },

    activateDrawer: function (inSender, inEvent) {
        this.$.Drawer.setOpen(!this.$.Drawer.open);
    },
    handleResize: function () {
        this.inherited(arguments);
    },

    handleSave: function (inSender, inEvent) {
        /**
         * function: handleSave
         * 
         * handleSave records the order of the current
         * filter stack and saves it in the model
         * under the object saveStack
         */
        let filterOrder = {};
        // Get Order of Filters (which filter is displayed where)
        this.$.List.get('children').forEach(function (child) {
            if (child.get('parent.name') == 'List') {
                child.get('children').forEach(function (grandchild, index) {
                    // console.log('gran.model', grandchild.get('model'));
                    // ToDo: Revisit this when filters can be moved //!@#$%^&*()                       
                    filterOrder[index] = {
                        location: index,
                        name: grandchild.get('model.name'),
                        checked: grandchild.get('selected'),
                        model: grandchild.get('model'),
                        info: grandchild.get('model.info')
                    };
                });
            }
        });

        // Bubble tap to top
        this.set('model.saveStack', {
            allFiltersAndOrder: filterOrder,
            applyAsStack: this.$.OptionStack.active,
        });
        this.doRequestSaveStack({
            model: this.get('model'),
        });
                // Get the snackbar DIV
        var x = document.getElementById("application_panels_DataPanel_DataManager_DataControl_FilterControl_snackbar");

        // Add the "show" class to DIV
        x.className = "show";

        // After 3 seconds, remove the show class from DIV
        setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
        
    },

    itemSelected: function (inSender, inEvent) {
        /**
         * function: itemSelected
         * 
         * If a filter has been selected from the
         * current filter stack. This triggers a
         * refresh on EnyoJS' _selection. It also
         * resets the deletedFilter object.
         */
        if (this.get('deletedFilter')) {
            let newStackOrder = new Collection();
            this.get('filters').get('models').forEach(function (filter, filter_index) {
                if (inEvent.model != filter) {
                    console.log('itemSelected filter', filter);
                    let newFilter = new Filter.Filter({
                        name: filter.get('name'),
                        parameters: filter.get('parameters'),
                        info: filter.get('info'),
                    });
                    newFilter.run = filter.run;
                    newStackOrder.add(newFilter);
                }
            });
            this.set('filters', newStackOrder);

            this.doRequestResetDefaults({
                model: this.get('model'),
                resetFilterstoDefaultStack: false,
            });

            this.set('deletedFilter', null);
        } else {

            let checker = false;
            if (inEvent.originator.eventNode.previousSibling) {
                checker = !inEvent.originator.eventNode.previousSibling.checked;
            } else if (inEvent.originator.get('name') == "FilterType") {
                checker = !inEvent.child.children[0].children[0].get('checked');
            }

            let index = inSender._selection.indexOf(inEvent.model);
            if (checker && index > -1) {
                // console.log('Not Checked: In And Leaving');
                inEvent.originator.owner.set('selected', false);
            } else if (!checker && index == -1) {
                // console.log('Checked: Out But Returning');
                inEvent.originator.owner.set('selected', true);
            }

            let selectedSet = new Set(inSender._selection);
            if (!selectedSet.has(inEvent.model) && inEvent.originator.owner.get('selected')) {
                selectedSet.add(inEvent.model);
                inSender._selection = [];
                selectedSet.forEach((selection) => {
                    inSender._selection.push(selection);
                });
                // inSender._selection = Array.from(selectedSet);
            }

            if (inEvent.originator.get('name') != "container") {
                inSender._selection = inSender._selection.filter(function (n) { return n; });
            }
        }
    },
    applySelectedFilters: function (finishedRun) {
        /**
         * function: applySelectedFilters
         * 
         * This sorts through all of the filters that
         * have been checked and then triggers an
         * EnyoJS call that runs them all.
         */
        //console.log('finishedRun', finishedRun);
        // Get DataRepeater Item Order
        let checkedFilterList = this.$.List._selection.slice().filter(function (n) { return n; });
        let filterOrder = {};
        let checkedFilterListLength = checkedFilterList.length;
        if (checkedFilterListLength) {
            // Get Order of Filters (which filter is displayed where)
            this.$.List.get('children').forEach(function (child) {
                if (child.get('parent.name') == 'List') {
                    child.get('children').forEach(function (grandchild, index) {
                        // ToDo: Revisit this
                        filterOrder[index] = { location: index, name: grandchild.get('model.name'), checked: grandchild.get('selected'), model: grandchild.get('model') };
                    });
                }
            });

            let tempObj = {};
            checkedFilterList.forEach(function (e, i) {
                checkedFilterList[i].set('id', i);
                tempObj[i] = checkedFilterList[i];
            });

            // ToDo: Revisit when Drag and Drop filters & add custom filter options are available
            checkedFilterList = [];
            for (let [key, value] of Object.entries(filterOrder)) {
                if (tempObj[value.location]) {
                    checkedFilterList.push(tempObj[value.location]);
                }
            }
        }
        // Bubble tap to top
        this.set('model.applyFilters', {
            selectedAndOrderedFilters: checkedFilterList, // Could cut this down to checkedFilterList.length and pass that
            filterOrder: filterOrder,
            applyAsStack: this.$.OptionStack.active,
            runData: (typeof (finishedRun) == typeof (true)) ? finishedRun : false,
        });
        this.doRequestApplyFilters({
            model: this.get('model'),
        });
    },

    setNoSelections: function (resetFilterstoDefaultStack = true) {
        /**
         * function: setNoSelections
         * 
         * This unselects all checkboxes
         */
        // Uncheck all selected options
        let checkedFilterList = this.$.List._selection.slice().filter(function (n) { return n; });
        if (checkedFilterList.length) {
            // Get Order of Filters (which filter is displayed where)
            this.$.List.get('children').forEach(function (child) {
                if (child.get('parent.name') == 'List') {
                    child.get('children').forEach(function (grandchild, index) {
                        // ToDo: Revisit this
                        grandchild.set('selected', false);
                        grandchild.get('children').forEach(function (greatgrandchild) {
                            greatgrandchild.get('children')[0].set('active', false);
                        });
                    });
                }
            });
        }

        // Uncheck 'Apply As Sequence'
        this.$.OptionStack.set('active', false);
        document.getElementById(this.$.OptionStack.id).removeAttribute('checked');

        this.$.OptionStack.set('active', false);
        if (resetFilterstoDefaultStack) {
            this.set('filters', this.get('defaultFilterStack'));
        }
    },

    /**
     * WARNING ALLOWING THE USER TO DO THIS CREATES AN INHERENT SECURITY RISK.
     */
    saveFileAddress: function () {
        /**
         * function: saveFileAddress
         * 
         * This function grabs the file that is selected by the user
         * (after they select the )
         */
        console.log('saveFileAddress');

        // ToDo: Add this feature //!@#$%^&*()
        // Once File has been added, sort the Choose Filter section
        const SORT_BY_COLUMN_NAME = "name"; // Maybe add Default Property??? //!@#$%^&*()
        let filterCollection = new Collection();
        this.get('filters').forEach((filter) => {
            filterCollection.add(filter);
        });
        let that = this;
        let handleFileSelect = function (evt) {
            var files = evt.target.files; // FileList object

            // files is a FileList of File objects. List some properties.
            for (var i = 0, f; f = files[i]; i++) {
                var reader = new FileReader();

                // Closure to capture the file information.
                reader.onload = (function (theFile) {
                    return function (e) {
                        try {
                            let json = JSONfn.parse(e.target.result);

                            let filter = new Filter.Filter({
                                name: json.name,
                                parameters: json.parameters,
                                info: json.info,
                            });
                            filter.run = json.run;
                            filterCollection.add(filter);


                            that.set('filters', filterCollection);

                            that.doRequestResetDefaults({
                                model: that.get('model'),
                                resetFilterstoDefaultStack: false,
                            });
                        } catch (ex) {
                            console.warn('Error when trying to parse JSON file', ex);
                        }
                    }
                })(f);
                reader.readAsText(f);

                document.getElementById('application_panels_DataPanel_DataManager_DataControl_FilterControl_FileInput').value = null;
            }
        }
        document.getElementById(this.id).addEventListener('change', handleFileSelect, false);
    },

    // Check All Filters For Processing
    checkAllFilters: function () {
        /**
         * function: checkAllFilters
         * 
         * This sorts through the EnyoJS DataRepeater
         * and checks all the filters for the jumpToRun
         */
        // console.log('Checking Filters: DataControl.js - FilterControl');
        this.$.List._selection = new Array();
        this.$.List.children[0].children.forEach(child => {
            let a = child.children[0].children[0];
            if (!a.checked) {
                child.$.IdBox.active = true;
                a.checked = true;
                let b = document.getElementById(a.id);
                b.setAttribute('checked', 'checked');
                child.selected = true;
                child.set('selected', true);
                if (!child.classes) {
                    child.classes = 'selected';
                } else {
                    child.classes = child.classes.replace(/(selected)\w*;/g, '');
                    child.classes = child.classes + ' selected';
                }

                let c = document.getElementById(child.id);
                if (!c.className) {
                    c.className = 'selected';
                } else {
                    c.className = c.className.replace(/(selected)\w*;/g, '');
                    c.className = c.className + ' selected';
                }
            }
            this.$.List._selection.push(child.model);
        });
        this.$.List._selection = Array.from(new Set(this.$.List._selection));

        this.$.OptionStack.active = true;
        let a = document.getElementById(this.$.OptionStack.id);
        a.checked = true;
        a.setAttribute('checked', 'checked');
        this.$.OptionStack.active = true;

        // Apply Filters!
        this.applySelectedFilters(true);
    },
});

// No comments have been added to this section of code as
// it has been moved to a separate part of the program
// namely, the Export Document Modal Window
var DataDrawer = kind({
    name: "tx.DataDrawer",
    kind: FittableRows,
    published: {
        title: 'Default Title',
        model: null,
    },
    components: [
        {
            kind: FittableColumns, ontap: "activateDrawer", classes: 'editor-drawer', components: [
                { kind: Icon, src: './assets/svg/UI-elements-forSVG_gfx-symbol-test-dark.svg', classes: 'enyo-icon', style: 'height:24px;width:24px;' },
                { name: 'Title', content: "Default Title" },
            ]
        },
        {
            name: "Drawer", kind: Drawer, classes: 'well borderb', open: false, components: [
                { content: 'TYPES', style:'font-size:17px;' },
                {
                    kind: FittableRows, classes: 'form-check', style: 'font-size:15px;', components: [
                        {
                            kind: FittableColumns, components: [
                                { name: 'OptionProcessed', kind: Checkbox, classes: 'form-check-input' },
                                { content: 'processed data' },
                            ]
                        },
                        {
                            kind: FittableColumns, components: [
                                { name: 'OptionRaw', kind: Checkbox, checked: true, active: true, classes: 'form-check-input' },
                                { content: 'raw data' },
                            ]
                        },
                    ]
                },
                { content: 'FORMATS', style:'font-size:17px;' },
                {
                    kind: FittableRows, classes: 'form-check', style: 'font-size:15px;', components: [
                        {
                            kind: FittableColumns, components: [
                                { name: 'OptionCsv', kind: Checkbox, classes: 'form-check-input', checked: true },
                                { content: 'csv' },
                            ]
                        },
                        {
                            kind: FittableColumns, components: [
                                { name: 'OptionXml', kind: Checkbox, classes: 'form-check-input' },
                                { content: 'xml' },
                            ]
                        },
                        {
                            kind: FittableColumns, components: [
                                { name: 'OptionScreen', kind: Checkbox, classes: 'form-check-input' },
                                { content: 'Include Screenshot' },
                            ]
                        },
                    ],
                },
                { content: 'CONVERT TO', style:'font-size:17px;' }, // This implies converting from Raw ADC to Absorbance/Pressure values
                {
                    kind: FittableRows, classes: 'form-check', style: 'font-size:15px;', components: [
                        {
                            kind: FittableColumns, components: [
                                { name: 'OptionAbsorbance', kind: Checkbox, classes: 'form-check-input' },
                                { content: 'Absorbance' },
                            ]
                        },
                        {
                            kind: FittableColumns, components: [
                                { name: 'OptionPressure', kind: Checkbox, classes: 'form-check-input' },
                                { content: 'Pressure' },
                            ]
                        },
                    ]
                },
                { name: 'ExportButton', kind: Button, classes: 'btn btn-success', content: 'EXPORT NOW', ontap: 'handleExport' }
            ]
        }
    ],
    bindings: [
        { from: 'title', to: '$.Title.content' },
    ],
    activateDrawer: function (inSender, inEvent) {
        this.$.Drawer.setOpen(!this.$.Drawer.open);
    },
    handleResize: function () {
        this.inherited(arguments);
    },
    events: {
        onRequestSaveData: ''
    },
    handleExport: function (inSender, inEvent) {
        // Bubble tap to top
        this.set('model.exportType', {
            Processed: this.$.OptionProcessed.active,
            Raw: this.$.OptionRaw.active,
            CSV: this.$.OptionCsv.active,
            XML: this.$.OptionXml.active,
            Screen: this.$.OptionScreen.active,
            ConvertAbsorbance: this.$.OptionAbsorbance.active,
            ConvertPressure: this.$.OptionPressure.active,
        });
        this.doRequestSaveData({
            model: this.get('model'),
        });
    },
    setNoSelections: function () {
        // Uncheck all selected options
        this.$.OptionProcessed.set('active', false);
        this.$.OptionRaw.set('active', false);
        this.$.OptionCsv.set('active', false);
        this.$.OptionXml.set('active', false);
        this.$.OptionScreen.set('active', false);
        this.$.OptionAbsorbance.set('active', false);
        this.$.OptionPressure.set('active', false);
    },
    saveDataAsFile: function () {
        console.log('saveDataAsFile');
        // Bubble tap to top
        this.set('model.exportType', {
            Processed: true,
            Raw: false,
            CSV: false,
            XML: true,
            Screen: false,
            ConvertAbsorbance: false,
            ConvertPressure: false,
        });
        this.doRequestSaveData({
            model: this.get('model'),
        });
    },
});

// No comments have been added to this section of code as
// it has been moved to a separate part of the program
// namely, the Export Document Modal Window
var ReportDrawer = kind({
    name: "tx.DataDrawer",
    kind: FittableRows,
    published: {
        title: 'Default Title',
        model: null,
    },
    components: [
        {
            kind: FittableColumns, ontap: "activateDrawer", classes: 'editor-drawer', components: [
                { kind: Icon, src: './assets/svg/UI-elements-forSVG_gfx-report.svg', classes: 'enyo-icon', style: 'height:24px;width:24px;' },
                { name: 'Title', content: "Default Title" },
            ]
        },
        //{ name: 'ExportButton', kind: Button, classes: 'btn btn-success', content: 'EXPORT REPORT', ontap: 'handleExport' },
        {
            name: "Drawer", kind: Drawer, classes: 'well borderb', open: false, components: [
                { content: 'INCLUDE', style:'font-size:17px;' },
                 {
                    kind: FittableRows, classes: 'form-check', style: 'font-size:15px;', components: [
                        {
                            kind: FittableColumns, components: [
                                { name: 'OptionPdf', kind: Checkbox, checked: true, active: true, classes: 'form-check-input' },
                                { content: 'PDF' },
                            ]
                        },
                        {
                            kind: FittableColumns, components: [
                                { name: 'OptionTabular', kind: Checkbox, classes: 'form-check-input' },
                                { content: 'Tabular' },
                            ]
                        },
                    ]
                }, 
                {
                    kind: FittableRows, components:[
                        {
                            kind: FittableColumns, components: [
                                { name: 'SampleNotes', kind: TextArea, placeholder: 'Sample Notes', oninput: 'inputChanged', fit: 'true', style: 'margin-right:25px'},
                            ]
                        },
                       
                    ]
                }, 
                    
                    { name: 'ExportButton', kind: Button, classes: 'btn btn-success', content: 'EXPORT REPORT', ontap: 'handleExport' },
            ]
        }
    ],
    bindings: [
        { from: 'title', to: '$.Title.content' },
        { from: 'model.commands', to: '$.List.collection' },
    ],
    activateDrawer: function (inSender, inEvent) {
        this.$.Drawer.setOpen(!this.$.Drawer.open);
    },
    handleResize: function () {
        this.inherited(arguments);
    },
    events: {
        onRequestSaveReport: ''
    },
    handleExport: function () {
        this.set('model.reportExportType', {
            PDF: this.$.OptionPdf.active,
            Tabular: this.$.OptionTabular.active,
        });
        this.doRequestSaveReport({
            model: this.get('model'),
        });
    },
    setNoSelections: function () {
        // Uncheck all selected options
        /*this.$.OptionRaw.set('active', false);
        this.$.OptionStack.set('active', false);
        this.$.OptionXml.set('active', false);*/
        this.$.OptionPdf.set('active', false);
        //this.$.OptionImage.set('active', false);
    },

    callExportReport: function () {
        // ToDo: Allow user to configure default export options in Service panel.
        this.set('model.reportExportType', {
           // Raw: false,
           // FilterStack: false,
            //XML: false,
            PDF: true,
            //Image: false,
        });
        this.doRequestSaveReport({
            model: this.get('model'),
        });
    },
    inputChanged: function (inSender, inEvent) {
        this.$.SampleNotes.get('value');
    }
});

module.exports = kind({
    name: 'tx.DataControl',
    kind: FittableRows,
    classes: 'slideable-sample right outer data-width',
    published: {
        model: null,
    },
    events: {
        onRequestSaveData: ''
    },
    handlers: {},
    components: [
        { name: 'FilterControl', title: 'FILTER STACK', kind: FilterDrawer },
        { name: 'DataControl', title: 'SAVE DATA', kind: DataDrawer },
        { name: 'ReportControl', title: 'REPORT OPTIONS', kind: ReportDrawer },
    ],
    bindings: [
        { from: 'model', to: '$.FilterControl.model' },
        { from: 'model', to: '$.DataControl.model' },
        { from: 'model', to: '$.ReportControl.model' },
    ],
    constructor: function () {
        this.inherited(arguments);
    },
    create: function () {
        this.inherited(arguments);
    },
    rendered: function () {
        this.inherited(arguments);
    },
    setNoSelections: function (filterControl = true, dataControl = true, reportControl = true, resetFilterstoDefaultStack = true) {
        /**
         * function: setNoSelections
         * 
         * This unselects all checkboxes
         */
        // Uncheck all selected options
        if (filterControl) {
            this.$.FilterControl.setNoSelections(resetFilterstoDefaultStack);
        }
        // if (dataControl) {
        //     this.$.DataControl.setNoSelections();
        // }
        // if (reportControl) {
        //     this.$.ReportControl.setNoSelections();
        // }
    },

    // Check All Filters For Processing
    checkAllFilters: function () {
        /**
         * function: checkAllFilters
         * 
         * This sorts through the EnyoJS DataRepeater
         * and checks all the filters for the jumpToRun
         */
        // console.log('Checking Filters: DataControl.js');
        this.$.FilterControl.checkAllFilters();
    },
    callExportReport: function () {
        console.log('EXPORTING TO NEW LEVEL!!');
        /**
         * callExportReport uses ReportControl's code to export the data
         *  However, it uses the default configuration
         *  (This way we don't forecefully check the checkboxes
         *      and call an export. That would be both bad
         *      practice and EnyoJS fights any adjustments that
         *      it can't do)
         *
         */

         this.$.ReportControl.callExportReport();
    },
    saveDataAsFile: function () {
        /**
         * saveDataAsFile uses DataControl's code to save the data
         *  However, it uses the default configuration
         *  (This way we don't forecefully check the checkboxes
         *      and call an export. That would be both bad
         *      practice and EnyoJS fights any adjustments that
         *      it can't do)
         *
         */
        console.log('this saveDataAsFile', this);
        this.$.DataControl.saveDataAsFile();
    },
    addToCustomFilterStacksCollection: (newCollection, that) => {
        /**
         * function: addToCustomFilterStacksCollection
         * 
         * This adds a custom filter to the stack of fiters
         * in the Data tab
         * 
         * @param newCollection The data to add
         * @param that same as 'this' but from the method that calls this function
         * 
         * @return True -> Stops EnyoJS propagation throughout the system
         */
        that.$.FilterControl.addToCustomFilterStacksCollection(newCollection, that.$.FilterControl);
    },
});