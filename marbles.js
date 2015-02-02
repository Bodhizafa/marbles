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
    ),
    NumberMarble = PrimitiveMarble.SubClass(
    // Properties
    {
        "dflt": 0,
        "step": 0, // Gates radiate out from default at intervals of step
        "max": Infinity,
        "min": -Infinity
    },
    // Methods
    {},
    // Constructor 
    function(priv) {
        if (this.step && (this.max !== Infinity)) {
            if (!close_enough((this.dflt + this.max) % this.step, 0)) {
                throw "this.max does not appear to be on a gate.";
            }
        }
        if (this.step && (this.min !== -Infinity)) {
            if (!close_enough((this.dflt + this.min) % this.step, 0)) {
                throw "this.min does not appear to be on a gate.";
            }
        }
        if (step === 1 && this.dflt % 1 === 0) {
            // Fast path for integers
            if (!isInteger(this.max) && this.max !== Infinity) {
                throw "Max is not an integer";
            }
            if (!isInteger(this.min) && this.min !== -Infinity) {
                throw "Min is not an integer";
            }
            if (this.max === Infinity && this.min === -Infinity) {
                priv.constraint = Math.round;
            } else {
                priv.constraint = function(newVal, oldVal) {
                    return newVal >= this.max ? this.max : 
                                                (newVal <= this.min ? this.min : 
                                                                      Math.round(newVal));
                }
            }
            // priv.compare comes okay from the superclass
        } else {
            priv.constraint = function(newVal, oldVal) {
                var offset, // How far we are from a gate
                    ret = newVal
                ret = ret > this.max ? this.max : (ret < this.min ? this.min : ret);
                if (this.step === 0) {
                    return ret;
                } else if (ret === oldVal) {
                    return ret;
                }
                // XXX This is when you went to bed
            };
            priv.compare = function(newVal, oldVal) {
                return newVal === oldVal || close_enough(newVal, oldVal);
            }
        }
    },
    // Descriptors
    { // Allowing users to change these post-construction leads to weird cases. See MSDN.
        "dflt": {"writable": false},
        "step": {"writable": false},
        "max": {"writable": false},
        "min": {"writable": false}
    });
