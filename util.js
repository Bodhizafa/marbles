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
/*
props
An object whose own enumerable properties constitute descriptors for the properties to be defined or modified. Properties have the following optional keys:
configurable
true if and only if the type of this property descriptor may be changed and if the property may be deleted from the corresponding object.
Defaults to false.
enumerable
true if and only if this property shows up during enumeration of the properties on the corresponding object.
Defaults to false.
value
The value associated with the property. Can be any valid JavaScript value (number, object, function, etc).
Defaults to undefined.
writable
true if and only if the value associated with the property may be changed with an assignment operator.
Defaults to false.
get
A function which serves as a getter for the property, or undefined if there is no getter. The function return will be used as the value of property.
Defaults to undefined.
set
A function which serves as a setter for the property, or undefined if there is no setter. The function will receive as only argument the new value being assigned to the property.
Defaults to undefined.
*/
