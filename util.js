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

// Arguments will be frozen, and may already be
var Class = (function(properties, methods, constructor, descriptors) {
    var ret; // becomes the class constructor function
    Object.freeze(properties);
    if (methods !== undefined) Object.freeze(methods);
    if (descriptors !== undefined) {
        Object.keys(descriptors).forEach(function(k) {
            if (descriptors[k].value !== undefined) throw "Descriptors may not specify value. Use properties";
            if ((descriptors[k].get || descriptors[k].set) && (properties[k] !== null)) throw "Magic properties must be null in properties";
            Object.freeze(descriptors[k]);
        });
        Object.freeze(descriptors);
    }
    ret = function(spec) {
        var ret, // becomes this, If you deliberately shadow, you can't accidentally shadow
            privs = {},
            proto = Object.create(null), // Becomes the prototype 
            propsDesc = {}; // Becomes property 
        if (spec === undefined) spec = {};
        // Construct the prototype (methods with privs curried in by method name)
        if (methods !== undefined) Object.keys(methods).forEach(function(k) {
            proto[k] = function() {
                if (arguments.length > 0) {
                    var args = Array.prototype.slice.call(arguments)
                    args.unshift(privs);
                    return methods[k].apply(ret, args);
                } else {
                    return methods[k].call(ret, privs);
                }
            };
        });
        // Create a properties descriptor by merging spec and descriptors into propsDesc
        Object.keys(properties).forEach(function(k) {
            if (descriptors && descriptors[k]) {
                propsDesc[k] = {}
                Object.keys(descriptors[k]).forEach(function(dk) { 
                    propsDesc[k][dk] = descriptors[k][dk];
                    if ((dk === "get" || dk === "set") && (spec[k] !== undefined)) throw "Magic properties must not be in spec";
                });
            } else {
                propsDesc[k] = {
                    "writable": true,
                    "enumerable": true,
                };
            }
            if (!(propsDesc[k].get || propsDesc[k].set)) {
                propsDesc[k].value = spec[k] !== undefined ? spec[k] : properties[k];
            }
        });
        // Create the object, set prototype and attach properties
        if (proto[''] !== undefined) {
            ret = proto[''];
            delete proto[''];
            ret.__proto__ = proto;  // XXX probably not a great idea
            Object.defineProperties(ret, propsDesc);
        } else {
            ret = Object.create(proto, propsDesc);
        }
        // Call the constructor
        if (constructor) constructor.call(ret, privs);
        // Seal it up ans ship it out.
        Object.freeze(proto);
        Object.seal(privs);
        Object.seal(ret);
        // Clean up our closure XXX I have no idea if this actually does anything.
        proto = undefined;
        propsDesc = undefined;
        return ret;
    };
    // Arguments will be mutated and frozen
    ret.SubClass = function(scProperties, scMethods, scConstructor, scDescriptors) {
        var c = function(privs) {
            var args = Array.prototype.slice.call(arguments)
            args.unshift(privs);
            if (constructor) constructor.apply(this, args);
            if (scConstructor) scConstructor.apply(this, args);
        };
        Object.keys(properties).forEach(function(k) {
            if (!scProperties.hasOwnProperty(k)) scProperties[k] = properties[k];
        });
        if (scMethods) Object.keys(methods).forEach(function(k) {
            if (!scMethods.hasOwnProperty(k)) scMethods[k] = methods[k];
        });
        if (scDescriptors && descriptors) Object.keys(descriptors).forEach(function(k) {
            if (!scDescriptors.hasOwnProperty(k)) scMethods[k] = methods[k];
        }); else if (descriptors) scDescriptors = descriptors;
        return Class(scProperties, scMethods, c, scDescriptors);
    };
    return ret;
});
