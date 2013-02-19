"use strict";
// Object.keys() - return a list of the keys in an object
if (typeof Object.prototype.keys !== 'function') {
    Object.prototype.keys = function() {
        return Object.keys(this);
    };
} 

// Object.sieve() - return a new object such that for each key in sieve.keys(), ret.key = this.key.
if (typeof Object.prototype.sieve !== 'function') {
    Object.prototype.sieve = function(sieve) {
        var ret = {};
        var that = this;
        sieve.keys().forEach(function(k) {
            ret[k] = that[k];
        });
        return ret;
    }
}

// Add the properties of unsieve to this, clobbering any that conflict
// object.unsieve(object.sieve(anything)) == object;
if (typeof Object.prototype.unsieve !== 'function') {
    Object.prototype.unsieve = function(unsieve) {
        var that = this;
        unsieve.keys().forEach(function(key) {
            that[key] = unsieve[key];
        });
        return that;
    }
}

if (Math.EPSILON === undefined || Math.EPSILON > 0.0000001) {
    Math.EPSILON = 0.0000001;
}
var UID = (function() {
    var cur = 0;
    return function() {
        return cur++;
    }
})();
var dbg = {};
