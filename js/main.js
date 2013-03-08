$( function() {
    /**
     * contains the records and notifies the views when the records get reset
      * @constructor
     */
    function Model() {
        this.records = [];
        this.observers = [];
        this.set = function(records) {
            this.records = records;
            this.notify(this.records);
        }
        this.addObserver = function(o) {
            this.observers.push(o);
        },
        this.notify = function() {
            this.observers.forEach( $.proxy(function(o) {
                                                o.update(this.records);
                                            },this) );
        }
    };

    /**
     * list view which reflects the changes of the data
     * @param m
     * @return {*}
     * @constructor
     */
    function ListView(m) {
        this.model = m;
        this.div = null;
        this.lastVal = [];
        this.vals = [];
        this.init = function() {
            this.model.addObserver(this);
            var i = $('div').length;
            var b = $('body');
            b.append('<div class="result"></div>');
            this.div = $('.result');
            return this;
        }
        this.update = function(arr) {
            var len = arr.length, val = this.lastVal.length;
            var delta = len - val;
            var i = 0, f = (delta < 0) ? -1 : 1;
            delta = Math.abs(delta);
            while(i!=delta) {
                this.vals.push( (f == -1) ? '-' : ( arr[val+i] ) );
                i++;
            }
            this.lastVal = arr;
        }
        this.getVals = function() {
            return this.vals;
        }
        this.display = function(val) {
            if( val != '-' ) {
                this.div.append('<div class="element">' + val + '</div>');
            } else {
                this.div.children().last().remove();
            }
        }
        return this.init();
    };

    /**
     * progress view which reflects the changes of the data
     * @param m
     * @return {*}
     * @constructor
     */
    function ProgressView(m) {
        this.model = m;
        this.progress = null;
        this.vals = [];
        this.init = function() {
            this.model.addObserver(this);
            var b = $('body');
            b.append('<progress class="progressbar" value="0" max="' + MAX_ELEMENTS + '"><span>hello</span></progress>');
            this.progress = $('progress');
            return this;
        }
        this.update = function(arr) {
            if( !arr ) return;
            var len = arr.length, val = (this.vals.length == 0) ? 0 : this.vals[this.vals.length-1];
            var delta = len - val;
            var i = 0, f = (delta < 0) ? -1 : 1;
            delta = Math.abs(delta);
            while(i!=delta) {
                i++;
                this.vals.push( parseInt(val) + i*f );
            }
        }
        this.getVals = function() {
            return this.vals;
        }
        this.display = function(val) {
            this.progress.attr('value', val);
        }
        return this.init();
    }

    var model = new Model();
    var views = [new ListView(model), new ProgressView(model)];

    /**
     * contoller which is responsible for
     * <ul>
     *     <li>the instantiation of the workers and the proper initialization of them (see init method)</li>
     *     <li>the animation of changes when the work is done (see play method)</li>
     * </ul>
     * @type {*}
     */
    var controller = (function(m,v) {
        return {
            model : m, views : v, producer : null, consumer : null, channel : null,
            init : function() {
                this.channel = new MessageChannel();
                this.producer = new Worker('js/producer.js');
                this.consumer = new Worker('js/consumer.js');

                var evtHandler = $.proxy( function(e) {
                    if( e.data.action == 'end' ) {
                        this.end();
                    } else {
                        if(e.data.arr)
                            this.model.set(e.data.arr);
                    }
                }, this );

                this.producer.addEventListener('message', evtHandler, false);
                this.consumer.addEventListener('message', evtHandler, false );
                return this;
            },
            start : function()
            {
                this.producer.postMessage({ action : 'start'}, [this.channel.port1]);
                this.consumer.postMessage({ action : 'start'}, [this.channel.port2]);
            },
            play : function() {
                var dataVals = this.views[0].getVals(), progVals = this.views[1].getVals();
                for( var i=0; i<dataVals.length; i++ ) {
                    var dataVal = dataVals[i];
                    var progVal = progVals[i];
                    $(this).queue( (function(t,dataVal,progVal) {
                        var dataView = t.views[0], progView = t.views[1];
                        return function() {
                            dataView.display(dataVal);
                            progView.display(progVal);
                            //dequeue:
                            setTimeout( (function(t) {
                                return function() {
                                    $(t).dequeue();
                                }
                            })(t), 100);
                        }
                    })(this,dataVal,progVal) );
                }
            },
            end : function() {
                this.play();
            }
        };
    })(model,views);

    controller.init().start();
} );