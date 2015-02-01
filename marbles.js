"use strict";
var PrimitiveMarble = Class(
    // Properties
    {},
    // Methods
    {"": function(priv, arg) {
        if (arg === undefined) {
            return priv.value;
        } else {
            var oldVal = priv.value;
            arg = priv.constraint(arg);
            if (!priv.compare.call(this, arg, priv.value)) {
                priv.value = arg;
                priv.yell.call(this, priv.value, oldVal);
            }
        }
    }, "addListener": function(priv, listener) {
        priv.listeners.push(listener);
    }, "subtractListener": function(priv, listener) {
        var found_idx = null;
        priv.listeners.forEach(function(l, idx) {
            if (l === listener) {
                found_idx = idx;
            }
        });
        delete priv.listeners[found_idx];
    }},
    // Constructor
    function(priv) {
        priv.value = undefined;
        priv.listeners = [];
        // Functions on priv should always be invoked with the same 'this' as this function, i.e. the object
        priv.yell = function() { 
            var args = arguments;
            priv.listeners.forEach(function(listener, idx) {
                listener.apply(this, args);
            }, this);
        };
        priv.constraint = function(arg) { return arg; }; // Subclasses override this
        priv.compare = function(oldVal, newVal) { // And this
            return oldVal === newVal;
        };
    }
    // Descriptors
)
