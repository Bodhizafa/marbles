"use strict";
if (Math.EPSILON === undefined) {
    Math.EPSILON = 0.0000001;
}
var UID = (function() {
    var cur = 0;
    return function() {
        return cur++;
    }
})();

var mesh = function(A, B) {
    var ret = {}
    Object.keys(B).forEach(function(k) {
        ret[k] = A[k] === undefined ? B[k] : A[k]
    });
    return ret;
}

var Class = (function(defaults, methods, constructor) {
    var functor;
    if (methods[""] !== undefined) {
        functor = methods[""];
        delete methods[""];
    }
    Object.freeze(methods);
    return function(desc) {
        var props = mesh(desc, defaults);
        var ret; // becomes this
        var privates = {};
        var proto = Object.create(null);
        Object.keys(methods).forEach(function(k) {
            if (k == "") {
                return;
            }
            proto[k] = function() {
                arguments[arguments.length] = privates;
                return methods[k].apply(ret, arguments);
            }
        });
        Object.freeze(proto);
        if (functor) {
            ret = function() {
                arguments[arguments.length] = privates;
                return functor.apply(ret, arguments);
            }
            ret.prototype = proto; // __proto__?
        } else {
            ret = Object.create(proto, props);
        }
        if (constructor) {
            constructor.call(ret, privates);
        }
        Object.seal(ret);
        return ret;
    }
});
