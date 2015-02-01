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

var Class = (function(properties, methods, constructor, descriptors) {
    var functor;
    if (methods[""] !== undefined) {
        functor = methods[""];
        delete methods[""];
    }
    Object.freeze(methods);
    var ret = function(desc) { // If you deliberately shadow, you can't accidentally shadow
        var ret, // becomes this
            privates = {}, proto = Object.create(null), // Becomes the prototype 
            props = sieve(desc, properties), // Instance variable values by property name
            propsDesc = {}; // Becomes property 
        // Construct the prototype (methods with privates curried in by method name)
        Object.keys(methods).forEach(function(k) {
            proto[k] = function() {
                if (arguments.length > 0) {
                    var args = Array.prototype.slice.call(arguments)
                    args.unshift(privates)
                    return methods[k].apply(ret, args);
                } else {
                    return methods[k].call(ret, privates);
                }
            };
        });
        Object.freeze(proto);
        Object.keys(props).forEach(function(k) {
            if (descriptors && descriptors[k]) {
                propsDesc[k] = descriptors[k];
                if (propsDesc[k].value) throw "Can't specify value in descriptors, use properties.";
                // You can't have a property value if there are getters and setters
                if (descriptors[k].get || descriptors[k].set) {
                    if (props[k] !== null) throw "Magic properties must have their properties entry null";
                } else {
                    propsDesc[k].value = props[k];
                }
            } else {
                propsDesc[k] = {
                    "value": props[k],
                    "writable": true,
                    "enumerable": true,
                }
            }
        });
        // Create the object, set prototype and attach properties
        if (functor) {
            ret = function() {
                if (arguments.length > 0) {
                    var args = Array.prototype.slice.call(arguments);
                    args.unshift(privates);
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
    return ret;
});
