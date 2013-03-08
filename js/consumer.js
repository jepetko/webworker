importScripts('common.js');

self.consumer = (function() {
    return {
        consume : function(arr,interruptIdx) {
            while( arr.length > 0 ) {
                if( arr.length == interruptIdx )
                    break;
                arr.pop();
            }
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
            //send it to main.js
            self.postMessage(e.data);
            switch(action) {
                case 'consume':
                    self.consumer.consume(arr,randomIdx(arr.length));
                    port.postMessage( {'action' : 'produce', 'arr' : arr, 'iter' : iter } );
                    break;
            }
        }
    }

    var action = e.data.action;
    switch(action) {
        case 'start':
            //do nothing
            break;
    }
}