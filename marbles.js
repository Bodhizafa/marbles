"use strict";
//    ____ ___  _   _ _____
//   / ___/ _ \| \ | |  ___|
//  | |  | | | |  \| | |_
//  | |__| |_| | |\  |  _|
//   \____\___/|_| \_|_|
//CONF!!
// Don't use dots in config property names. That's a dick move.

var o = (function() {
// create a function that clamps a number between min and max
var numberClamperMaker = function(node) {
    var max = node.max;
    var min = node.min;
    if (max !== undefined && min !== undefined) {
        return function(input) {
            return Math.min(Math.max(input, min), max);
        }
    } else if (max !== undefined) {
        return function(input) {
            return Math.min(max, input);
        }
    } else if (min !== undefined) {
        return function(input) {
            return Math.max(min, input);
        }
    } else {
        return function(input) { return input };
    }
};

var mkRawChannel = function(nodeDesc, reader, writer) {
    // XXX - haven't tested passing this writer == undefined. If it crashes, fix it.
    var sieve = {}; // Don't give a FUCK
    var newNode;
    if (reader && writer) {
        newNode = function(val) {
            if (val === undefined) {
                return reader();
            } else {
                return writer(val);
            }
        }
    } else if (reader) {
        newNode = function(val) {
            if (val === undefined) {
                return reader();
            } else {
                throw "Can't write from read only marble";
            }
        };
    } else if (writer) {
        newNode = function(val) { 
            if (val === undefined) {
                throw "Can't read from write only marble";
            } else {
                return writer(val);
            }
        }
    }
    return newNode;
}

return {
    "mkChannel":        function(nodeDesc, reader, writer) {
        var listeners = [];
        var sieve = {
            "type":     "Node type"
        };
        var desc = nodeDesc.sieve(sieve);
        var newNode = mkRawChannel(desc, reader, function(val) {
            listeners.forEach(function(listener) {
                if (listener !== undefined) {
                    writer(listener(nodeVal, val, newNode));
                }
            });
            return writer(val);
        });
        newNode.desc = desc;
        newNode.registerListener = function(listener) {
            var lno = listeners.length;
            listeners[lno] = listener;
            return lno;
        }
        newNode.dropListener = function(lno) {
            listeners[lno] = undefined;
        }
        newNode.desc = nodeDesc
        return newNode;
    },
    "mkFloatNode":     function(nodeDesc) {
        var sieve = {
            "max"   :   "Maximum value the node can hold",
            "min"   :   "Minumum value the node can hold",
            "dflt"  :   "Default value",
        }
        var desc = nodeDesc.sieve(sieve);
        // Node closure
        var newNode = (function() {
            var nodeVal = nodeDesc.dflt;
            var clamper = numberClamperMaker(desc);
            return o.mkChannel(desc, 
                function() { return nodeVal; }, 
                function(arg) { return (nodeVal = clamper(arg)); }
            );
        })();
        newNode.desc = desc;
        return newNode;
    },
    // Returns a conf node based on node from the metaConf variables section
    "mkNode":           function mkNode(nodeDesc) {
        var desc = {};
        // come up with a better sieving algorithm so you don't have to do this.
        nodeDesc.keys().forEach(function(k) {
            desc[k] = nodeDesc[k];
        });
        if (typeof(desc.type) !== "string") {
            throw TypeError("node type is not a string", nodeDesc, desc);
        }
        var newNode;
        if (desc.type === "compound") {
            // If we're a compound node, recurse down "variables"
            var nodeVal = {};
            desc.variables.keys().forEach(function(nodeKey) {
                nodeVal[nodeKey] = mkNode(desc.variables[nodeKey]);
            });
            newNode = mkRawChannel(desc, function() {
                return nodeVal;
            }, null);
            newNode.desc = desc;
        } else {
            switch(nodeDesc.type) {
                case "float":
                    return o.mkFloatNode(desc);
                    break;
                default:
                    throw TypeError("Can't create a node of type" + nodeDesc.type);
                    break;
            }
        }
        return newNode;
    },
    "connect":          function(a, b, wire) {
        if (wire.a_b && wire.b_a) {
            a.registerListener(function(val, tryVal, node) {
                b(val);
            });
            b.registerListener(function(val, tryVal, node) {
                a(val);
            });
        } else if (wire.a_b) {
            a.registerListener(function(val, tryVal, node) {
                b(val);
            });
        } else if (wire.b_a) {
            b.registerListener(function(val, tryVal, node) {
                a(val);
            });
        }
    }
};
})();
