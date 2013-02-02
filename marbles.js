"use strict";
if (typeof Object.prototype.keys !== 'function') {
    Object.prototype.keys = function() {
        return Object.keys(this);
    };
} else {
    consol.log("not adding keys");
}
if (dbg !== undefined) {
    var dbg;
}
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

var nodeMuxerData = {
    "clampers": {
        "float": numberClamperMaker,
        "int": numberClamperMaker,
    },
    "constraints": {
        "float": {
            "max": "Maximum allowed value",
            "min": "Minimum allowed value"
        },
        "int": {
            "max": "Maximum allowed value",
            "min": "Minimum allowed value"
        },
        "compound": {},
        "root": {}
    }
};

return {
    // returns a conf node based on node from the metaConf variables section
    "mkNode":function makeConfNode(node, pos) {
        // sanitize
        if (pos === undefined) {
            var pos = "";
        }
        if (typeof(node.type) !== "string") {
            // XXX - does this work?
            throw TypeError("node type is not a string", node);
        }
        //begin
        var nodeVal;
        var listeners = [];
        var newNode;
        if (node.type === "root" || node.type === "compound") {
            // If we're a compound node, recurse down "variables"
            nodeVal = {};
            node.variables.keys().forEach(function(nodeKey) {
                nodeVal[nodeKey] = makeConfNode(node.variables[nodeKey], pos + "." + nodeKey);
            });
            newNode = function(val) {
                if (val !== undefined) {
                    throw TypeError("Can't write to compound properties");
                }
                return nodeVal;
            }
        } else {
            var clamper = nodeMuxerData.clampers[node.type](node);
            if (node.dir === "source") {
                newNode = function() {
                    if (arguments.length > 0) {
                        throw TypeError("Can't write marble source");
                    } else {
                        return nodeVal;
                    }
                }
            } else if (node.dir === "sink") {
                newNode = function() {
                    if (arguments.length == 0) {
                        throw TypeError("Can't read marble sink");
                    } else {
                        var newVal = clamper(val);
                        listeners.forEach(function(listener) {
                            if (listener !== undefined) {
                                listener(newVal, val, newNode);
                            }
                        });
                    }
                }
            } else {
                node.dir = "channel";
                newNode = function(val) {
                    if (val === undefined) {
                        return nodeVal;
                    } else {
                        nodeVal = clamper(val);
                        listeners.forEach(function(listener) {
                            if (listener !== undefined) {
                                // listener gets new value, value asked for by setter and node config
                                listener(nodeVal, val, newNode);
                            }
                        });
                        return nodeVal;
                    }
                }
            }
            nodeVal = node.dflt;
        }
        // pass through constraints as read-only subproperties
        nodeMuxerData.constraints[node.type].keys().forEach(function(propName) {
            var consVal = node[propName]; // XXX do I need to do this?
            newNode[propName] = function(arg) {
                if (arg) throw TypeError("Attempt to write read-only metaconf subproperty");
                return consVal;
            }
        });
        // Listener management
        newNode.registerListener = function(listener) {
            var lno = listeners.length;
            listeners[lno] = listener;
            return lno;
        }
        newNode.dropListener = function(lno) {
            listeners[lno] = undefined;
        }
        newNode.treePos = pos;
        newNode.dflt = node.dflt;
        return newNode;
    },
    "connect": function(a, b, wire) {
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
