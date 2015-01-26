"use strict";
var EPSILON = Number.EPSILON;

// Make a name
var make_uid = (function() {
    var cur = 0;
    return function() {
        return cur++;
    }
})();

var random_color = function() {
    return "#" + (Math.floor(Math.random()*0x1000)).toString(16);
}

var close_enough = function(a, b, eps) {
    if (eps === undefined) eps = EPSILON;
    return Math.abs(a - b) <= eps;
}


// Sieve A through B, 
// Produces an object O such that for each key in B, 
//   O[key] is A[key] if key is in a, else B[key]
var sieve = function(A, B) {
    var ret = {}
    Object.keys(B).forEach(function(k) {
        ret[k] = ((A === undefined) || (A[k] === undefined)) ? B[k] : A[k]
    });
    return ret;
}

var Class = (function(defaults, methods, constructor, properties) {
    var functor;
    if (methods[""] !== undefined) {
        functor = methods[""];
        delete methods[""];
    }
    Object.freeze(methods);
    return function(desc) {
        var ret; // becomes this
        var privates = {};
        // Make a prototype
        var proto = Object.create(null);
        Object.keys(methods).forEach(function(k) {
            if (k == "") return; // functors don't go in props

            proto[k] = function() {
                if (arguments.length > 0) {
                    var args = Array.prototype.slice.call(arguments)
                    args.unshift(privates)
                    return methods[k].apply(ret, args);
                } else {
                    return methods[k].call(ret, privates);
                }
            }
        });
        Object.freeze(proto);
        // Make the property descriptors
        var props = sieve(desc, defaults);
        var propsDesc = {};
        Object.keys(props).forEach(function(key) {
            if (properties && properties[key]) {
                propsDesc[key] = properties[key];
                if (propsDesc[key].value) throw "Can't specify value in properties. Use defaults.";
                // If getters and setters are set, make sure that value is null and don't set value in the descriptor
                if (properties[key].get || properties[key].set) {
                    if (props[key] !== null) throw "Magic properties must have their defaults entry null";
                } else {
                    propsDesc[key].value = props[key];
                }
            } else {
                propsDesc[key] = {
                    "value": props[key],
                    "writable": true,
                    "enumerable": true,
                }
            }
        });
        // Create the object, set prototype and attach properties
        if (functor) {
            ret = function() {
                if (arguments.length > 0) {
                    var args = Array.prototype.slice.call(arguments)
                    args.unshift(privates)
                    return functor.apply(ret, args);
                } else {
                    return functor.call(ret, privates);
                }
            }
            ret.__proto__ = proto;  // XXX probably not a great idea
            Object.defineProperties(ret, propsDesc);
        } else {
            ret = Object.create(proto, propsDesc);
        }
        // Call the constructor
        if (constructor) {
            constructor.call(ret, privates);
        }
        // Seal it up ans ship it out.
        Object.seal(ret);
        Object.seal(privates);
        return ret;
    }
});
