"use strict";
//   __  __    _    ____  ____  _     _____ ____      _ ____
//  |  \/  |  / \  |  _ \| __ )| |   | ____/ ___|    | / ___|
//  | |\/| | / _ \ | |_) |  _ \| |   |  _| \___ \ _  | \___ \
//  | |  | |/ ___ \|  _ <| |_) | |___| |___ ___) | |_| |___) |
//  |_|  |_/_/   \_\_| \_\____/|_____|_____|____(_)___/|____/
// Property names must be valid JS identifiers

var o = (function() {
// create a function that clamps a number between min and max

// Basic unit - returns a function such that when called with zero arguments, it evaluates to reader,
// and when called with one or more evaluates to writer.
var mkRawChannel = function(nodeDesc, reader, writer) {
    // XXX - haven't tested passing this writer == undefined. If it crashes, fix it.
    var sieve = {}; // Don't give a FUCK
    var newNode;
    if (reader && writer) {
        newNode = function() {
            //console.log("RW rawChannel", arguments);
            if (!arguments.length) {
                return reader();
            } else {
                //console.log("Rawchannel appplying", arguments);
                return writer.apply(null, arguments);
            }
        }
    } else if (reader) {
        newNode = function() {
            //console.log("RO rawChannel", arguments);
            if (!arguments.length) {
                return reader();
            } else {
                throw "Can't write from read only marble";
            }
        };
    } else if (writer) {
        newNode = function() {
            //console.log("WO rawChannel", arguments);
            if (!arguments.length) {
                throw "Can't read from write only marble";
            } else {
                return writer.apply(null, arguments);
            }
        }
    }
    newNode.toString = function() {
        return "rawChannel";
    };
    newNode.desc = {};
    return newNode;
}

return {
    // Channel:
    // When read from, calls reader and returns its result
    // When written to, calls writer with the arguments given.
    //      Also calls each listener with the first argument being the value returned by writer, and the rest of the arguments passed through.
    "mkChannel":        function(nodeDesc, reader, writer) {
        var listeners = [];
        var sieve = {
        };
        var desc = nodeDesc.sieve(sieve);
        var newNode = mkRawChannel(desc, reader, function() {
            arguments[0] = writer.apply(null, arguments);
            //console.log("applying listener", arguments);
            var oa = arguments;
            listeners.forEach(function(listener) {
                if (listener !== undefined) {
                    listener.apply(null, oa);
                }
            });
            return arguments[0];
        });
        newNode.registerListener = function(listener) {
            var lno = listeners.length;
            listeners[lno] = listener;
            return lno;
        }
        newNode.dropListener = function(lno) {
            listeners[lno] = undefined;
        }
        newNode.desc = newNode.desc.unsieve(desc);
        return newNode;
    },
    "mkNumberNode":    function(nodeDesc, dbg) {
        var sieve = {
            "max"   :   "Maximum value (inclusive)",
            "min"   :   "Minimum value (inclusive)",
            "step"  :   "Snap node value to multiples of this",
            "dflt"  :   "Default value"
        };
        var desc = nodeDesc.sieve(sieve);
        if (desc.step)  {
            if (desc.dflt % desc.step) {
                throw TypeError("Can't create a node with step" + desc.step + " and dflt " + desc.dflt);
            }
            if (desc.max && desc.max % desc.step) {
                throw TypeError("Can't create a node with step " + desc.step + " and max " +  desc.max);
            }
            if (desc.min && desc.min % desc.step) {
                throw TypeError("Can't create a node with step " + desc.step + " and min" + desc.min);
            }
        }
        var nodeVal = desc.dflt;
        var snap = function(n) {
            if (((n - desc.dflt) % desc.step) > Math.EPSILON) {
                return (n - ((n - desc.dflt) % desc.step));
            } else {
                return n;
            }
        }
        var clamper = (function() {
            var max = desc.max;
            var min = desc.min;
            if (max !== undefined && min !== undefined) {
                return function(input) {
                    return snap(Math.min(Math.max(input, min), max));
                }
            } else if (max !== undefined) {
                return function(input) {
                    return snap(Math.min(max, input));
                }
            } else if (min !== undefined) {
                return function(input) {
                    return snap(Math.max(min, input));
                }
            } else {
                return function(input) {
                    return snap(input);
                };
            }
        })();
        var newNode = o.mkChannel(desc,
            function() {
                return nodeVal;
            }, function(newVal) {
                return (nodeVal = clamper(newVal));
            }
        );
        newNode.desc = newNode.desc.unsieve(desc);
        return newNode
    },
    "mkCompoundNode":     function(nodeDesc) {
        var sieve = {
            "variables":    "Map from subproperty names to subproperty node descriptions",
        };
        var desc = nodeDesc.sieve(sieve);
        var nodeVal = {};
        desc.variables.keys().forEach(function(nodeKey) {
            nodeVal[nodeKey] = o.mkNode(desc.variables[nodeKey]);
        });
        var newNode = mkRawChannel(desc, function() {
            return nodeVal;
        }, null);
        newNode.desc = newNode.desc.unsieve(desc);
        return newNode;
    },
    // Returns a conf node based on node from the metaConf variables section
    "mkNode":           function (nodeDesc) {
        var desc = {};
        // come up with a better sieving algorithm so you don't have to do this.
        nodeDesc.keys().forEach(function(k) {
            desc[k] = nodeDesc[k];
        });
        if (typeof(desc.type) !== "string") {
            throw TypeError("node type is not a string", nodeDesc, desc);
        }
        var newNode;
        switch(desc.type) {
            case "compound":
                return o.mkCompoundNode(desc);
                break;
            case "number":
                return o.mkNumberNode(desc);
                break;
            default:
                throw TypeError("Can't create a node of type " + nodeDesc.type);
                break;
        }
        return newNode;
    },
    "connect":          function(a, b, wire) {
        b.dbg = "b";
        a.dbg = "a";
        if (wire.a_b && wire.b_a) {
            a.registerListener(function(val, src) {
                if(src != b) {
                    b(wire.a_b(val), a);
                }
            });
            b.registerListener(function(val, src) {
                if(src != a) {
                    a(wire.b_a(val), b);
                }
            });
        }
        /*
        else if (wire.a_b) {
            a.registerListener(function(val, tryVal, node) {
                b(val);
            });
        } else if (wire.b_a) {
            b.registerListener(function(val, tryVal, node) {
                a(val);
            });
        }
        */
    },
    // Connect two nodes such that A is proportional to B
    // a = pb + o
    // b (a - o)/p
    "connectProportional":    function(a, b, prop, offset) {
        if (prop === undefined) {
            prop = 1;
        }
        if (offset === undefined) {
            offset = 0;
        };
        o.connect(a, b, {
            "a_b":  function(aval) { return prop * aval + offset },
            "b_a":  function(bval) { return (bval - offset) / prop }
        });
    }
};
})();
console.log("Marbles loaded", o);
