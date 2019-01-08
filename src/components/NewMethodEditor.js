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
    bind = require('enyo/utils').bind,
    Slider = require('onyx/Slider'),
    Control = require('enyo/Control'),
    Root = require('svg/Root'),
    Path = require('svg/Path'),
    Collection = require('enyo/Collection'),
    PickerDecorator = require('onyx/PickerDecorator'),
    Plotly = require('plotly'),
    MethodEditorPullout = require('./MethodEditorPullout.js');

var d3 = require('../../lib/d3/d3-4.10.2.min.js');

var Graph = module.exports = kind({
    name: 'Graph',
    kind: Control,
    realtimeFit: true,
    useFlex: true,
    published: {
        data: new Collection(),
        model: null,
        cursor: 0,
        clickAndDrag: true,
    },
    components: [
        { kind: Root, name: 'svg', classes: 'test-graph' },
        { name: 'Pullout', kind: MethodEditorPullout, onChanged: 'dataChanged' },
    ],
    bindings: [
        { from: 'model', to: '$.Pullout.model' },
        { from: 'model.commands', to: 'data' },
    ],
    constructor: function () {
        this.inherited(arguments);
    },
    create: function () {
        this.inherited(arguments);
    },
    modelChanged: function () {
        var model = this.get('model');
        if (model) {
            this.set('data', model.get('commands'));
        }
        else {
            //            this.set('data', new Collection());
        }

    },
    handleResize: function () {
        this.inherited(arguments);
        //        console.log('resize');
        this.render();
    },
    rendered: function () {
        this.inherited(arguments);

        var that = this;

        this.bounds = this.getBounds();

        var parent_height = this.bounds.height,
            parent_width = this.bounds.width;
        if (parent_height == 0 || parent_width == 0) {
            return;
        }
        var margin = { top: 10, right: 10, bottom: 25, left: 30 },
            width = parent_width - margin.left - margin.right,
            height = parent_height - margin.top - margin.bottom;
        var svg = d3.select("#" + this.$.svg.id)
            .attr('preserveAspectRatio', 'none')
            .attr('viewBox', '-25 -5 ' + parent_width + ' ' + parent_height)
            .attr("width", '100%')
            .attr("height", '97%');
        this.svg = svg;
        this.width = width;
        this.height = height;

        var x = d3.scaleLinear().rangeRound([0, width]);
        this.x = x;

        var y = d3.scaleLinear().rangeRound([height, 0]);
        this.y = y;

        var xAxis = d3.axisBottom(x),
            yAxis = d3.axisLeft(y);

        var line = d3.line()
            .x(function (d) { return x(d.get('x')); })
            .y(function (d) { return y(d.get('y')); });

        var x_extent = d3.extent(this.data.models, function (d) { return d.get('x'); });
        x.domain([x_extent[0], x_extent[1] || 100]);
        y.domain([0, 100]);

        let drag = d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);

        svg.append('rect')
            .attr('class', 'zoom')
            .attr('cursor', 'move')
            .attr('fill', 'none')
            .attr('pointer-events', 'all')
            .attr('width', width)
            .attr('height', height)
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

        var focus = svg.append("g");

        focus.append("path")
            .datum(this.data.models)
            .attr("fill", "none")
            .attr("stroke", "#4CB048")
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5)
            .attr("d", line);

        focus.selectAll('circle')
            .data(this.data.models)
            .enter()
            .append('circle')
            .attr('id', function (d) { return d.get('id'); })
            .attr('r', 4)
            .attr('class', 'circles')
            .attr("stroke", "#C65509")
            .attr("fill", "#ededed")
            .attr("stroke-width", 4)
            .attr('cx', function (d) { return x(d.get("x")); })
            .attr('cy', function (d) { return y(d.get("y")); })
            .style('cursor', 'pointer');

         svg.on('mousedown', function () {
            if (that.app.noEvents()) { return; }
            let clickArea = d3.select(this).node();
            click(clickArea);
        }); 

        focus.selectAll('circle')
            .call(drag);

        focus.append('g')
            .attr('class', 'axis axis--x')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxis)
            .select(".domain")
            .attr("stroke", "#FFF");

        focus.append('g')
            .attr('class', 'axis axis--y')
            .call(yAxis)
            .append("text")
            .attr("fill", "#000")
            .attr("x", "10%")
            .attr("y", "-2%")
            .attr("dy", "0em")
            .attr("text-anchor", "end")
            .text("");

        function sortData() {
            if (that.data) {
                that.data.sort(function (a, b) {
                    if (a.get('x') == b.get('x')) {
                        return a.get('id') - b.get('id');
                    }
                    return a.get('x') - b.get('x')
                });
            }
        }

        function click(clickArea) {
            console.log("click");
            // Ignore the click event if it was suppressed
            if (that.app.noEvents()) { return; }

            if (d3.event.defaultPrevented) { return; }

            console.log("click is enabled");
            if (!that.model.get('unlocked')) {// ToDo: Finish, If this is the best way to approach the problem.
                /** If the model is locked, duplicate if locked
                 *  this is just a thought, may not be the decided
                 *  method.
                 */
            }

            // Append a new point

            var point = d3.mouse(clickArea),
                p = { x: point[0], y: point[1] };
            var max_id = 0;
            var lastval = that.get('model');
            that.data.forEach(function (p) { max_id = Math.max(max_id, p.get('id')); });
            that.data.add({
                id: max_id + 1,
                x: x.invert(p.x),
                y: y.invert(p.y),
                flow: lastval.attributes.commands.models[0].attributes.flow,
                direction: 2,
                valves_a: 3,
                valves_b: 0,
                valves_c: 1,
            });
            sortData();
            that.render();
        }

        var circle;
        function dragstarted(d) {
            console.log("dragStarted");
            if (that.app.noEvents()) { return true; } // This disables dragging if the user has selected this option
            console.log("dragStarted is enabled");
            circle = d3.select(this).raise().classed('active', true);
        }

        function dragged(d) {
            console.log("dragged");
            if (that.app.noEvents()) { return true; } // This disables dragging if the user has selected this option
            console.log("dragged is enabled");
            d.set('x', x.invert(d3.event.x));
            d.set('y', y.invert(d3.event.y));
            d3.select(this)
                .attr('cx', x(d.get("x")))
                .attr('cy', y(d.get("y")));
            focus.select('path').attr('d', line);
            sortData();
        }

        function dragended(d) {
            console.log("dragEnded");
            if (that.app.noEvents()) { return true; } // This disables dragging if the user has selected this option
            console.log("dragEnded is enabled");
            d3.select(this).classed('active', false);
        }
    },
    cursorChanged: function (oldVal, newVal) {
        if (oldVal == 0) {
            var xmin = this.x(this.data.at(0).get('x')),
                xmax = this.x(this.data.at(this.data.length - 1).get('x')),
                duration = this.data.at(this.data.length - 1).get('x') - this.data.at(0).get('x');

            this.svg.selectAll("line").remove();
            this.svg.append("line")
                .style("stroke-width", 2)
                .style("stroke", "red")
                .style("fill", "none")
                .attr("y1", 0)
                .attr("y2", this.height)
                .attr("x1", xmin)
                .attr("x2", xmin)
                .transition()
                .ease(d3.easeLinear)
                .duration(1000 * duration)
                .attr("x1", xmax)
                .attr("x2", xmax);
        }
    },
    dataChanged: function () {
        this.render();
    },
    dragHandlers: undefined,
    clickAndDragChanged: function () {
        /**
         * function: clickAndDragChanged
         * 
         * When the option to click and drag changes,
         * this function changes the cursor's style
         */
        var svg_id = this.$.svg.id;
        var svg    = d3.select("#" + svg_id);
        var cursor = this.clickAndDrag ? 'pointer' : 'default';
        svg.selectAll('.circles').style('cursor', cursor);
    }
});
