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

if (dbg !== undefined) {
    var dbg;
}

