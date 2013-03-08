importScripts('common.js');

self.producer = (function() {
    return {
        fibonacci : function(arr,max,idxInterrupt) {
            if( !arr || arr.length == 0 )
                arr = [0,1];
            if( !max )
                max = 20;
            if( arr.length < 2 )
                arr = [0,1];
            var len = arr.length;
            if( len == idxInterrupt )
                return arr;

            arr[len] = arr[len-2] + arr[len-1];
            if( len < max )
                arguments.callee(arr, max, idxInterrupt);

            return arr;
        },
        anyNumber : function(arr,max,idxInterrupt) {
            var arr = [];
            for( var i=0; i<max; i++ ) {
                if( i == idxInterrupt )
                    break;
                arr[arr.length] = Math.random() * 100000000000;
            }
            return arr;
        },
        anyString : function(arr,max,idxInterrupt) {
            if( !arr || arr.length == 0 )
                arr = [];
            var bBreak = false;
            while( arr.length < max) {
                var str = "";
                for( var j=0; j<10; j++ ) {
                    if( arr.length == idxInterrupt ) {
                        bBreak = true;
                        break;
                    }
                    str += String.fromCharCode( 65 + Math.ceil(Math.random() * 25) );
                }
                if( bBreak ) break;
                arr[arr.length] = str;
            }
            return arr;
        },
        generate : function(arr,idxInterrupt) {
            var methods = ['fibonacci', 'anyNumber', 'anyString'];
            //var m = methods[ randomIdx(2) ];
            var m = methods[ 0 ];

            return this[m](arr,MAX_ELEMENTS,idxInterrupt);
        }
    }
})();

self.onmessage = function(e) {
    var port = e.ports[0];
    if( !port.onmessage ) {
        port.onmessage = function(e) {
            var action = e.data.action;
            var arr = e.data.arr;
            var iter = e.data.iter;
            self.postMessage(e.data);
            switch(action) {
                case 'produce':
                    if( iter == MAX_ITERATIONS ) {
                        self.postMessage( { 'action' : 'end' } );
                        self.close();
                    } else {
                        var arr = self.producer.generate( arr, randomIdx(MAX_ELEMENTS) );
                        port.postMessage( { 'action' : 'consume', 'arr' : arr, 'iter' : ++iter } );
                    }
                    break;
            }
        }
    }
    var action = e.data.action;
    switch(action) {
        case 'start':
            var arr = self.producer.generate( [], randomIdx(MAX_ELEMENTS) );
            port.postMessage( { 'action' : 'consume', 'arr' : arr, 'iter' : 0 } );
            break;
        default:
    }
}