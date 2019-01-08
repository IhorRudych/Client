/*
 */

var kind = require('enyo/kind'),
    bind = require('enyo/utils').bind,
    EnyoJob = require('enyo/job'),
    FittableRows = require('layout/FittableRows');

module.exports = kind({
    name: "Timer",
    kind: FittableRows,
    published: {
        title: '',
        max: 5,
        step: 1000,
        tick: 0,
        running: false,
        classes: 'btn',
        countdown: false,
        message: 'RUN TIME'
    },
    events: {
        onTick: "",
        onDone: ""
    },
    components: [
        {name: 'Title', classes: 'head-info'},
        {name: 'Message', content: 'RUN TIME', classes: 'run-text'},
        {name: 'Elapsed', content: '0', classes: 'run-text'},
        {content: 'SECONDS',  classes: 'head-info'},
    ],
    bindings: [
        {from: 'tick', to: '$.Elapsed.content', transform: function(v) {
            if (!this.get('running')) {
                return '-';
            }
            if (this.get('countdown')) {
                return (this.get('max') - v).toFixed(0);
            }
            else {
                return v.toFixed(0);
            }
        }},
        {from: 'title', to: '$.Title.content', transform: function(v) {
            return 'NAME: ' + v;
        }},
        {from: 'message', to: '$.Message.content' },
    ],
    create: function() {
        this.inherited(arguments);
    },
    start: function() {
        this.set('running', true);
        this.setTick(0);
        EnyoJob("CountdownTicks", bind(this, "nextTick"), this.getStep());
    },
    stop: function() {
        this.set('running', false);
        EnyoJob.stop("CountdownTicks");
    },
    restart: function() {
        this.stop();
        this.start();
    },
    destroy: function() {
        this.stop();
    },
    nextTick: function() {
        this.setTick(this.getTick() + 1);
        if (this.getTick() >= this.getMax()) {
            this.stop();
            this.doDone({tick: this.getTick()});
        }
        else {
            EnyoJob("CountdownTicks", bind(this, "nextTick"), this.getStep());
        }
        this.doTick({tick: this.getTick()});
    },
    maxChanged: function() {
//        this.restart();
    },
    stepChanged: function() {
//        this.restart();
    }
})
