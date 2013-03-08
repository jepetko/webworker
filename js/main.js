$( function() {

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
            //console.log( 'INPUT' );
            //console.log( arr );
            var len = arr.length, val = this.lastVal.length;
            var delta = len - val;
            var i = 0, f = (delta < 0) ? -1 : 1;
            delta = Math.abs(delta);
            while(i!=delta) {
                this.vals.push( (f == -1) ? '-' : ( arr[val+i] ) );
                i++;
            }
            //console.log('CURRENT VALUES');
            //console.log( this.vals );
            this.lastVal = arr;
        }
        this.getVals = function() {
            return this.vals;
        }
        return this.init();
    };

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
            //console.log('PROGRESS');
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
        return this.init();
    }

    var model = new Model();
    var views = [new ListView(model), new ProgressView(model)];

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
                            if( dataVal != '-' ) {
                                dataView.div.append('<div class="element">' + dataVal + '</div>');
                            } else {
                                dataView.div.children().last().remove();
                            }
                            progView.progress.attr('value', progVal);

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