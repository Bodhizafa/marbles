"use strict";
var ou = (function() {
var conMetaConf = {
    "type": "compound",
    "variables": {
        "knob": {
            "type": "compound",
            "variables" : {
                "textLen" : {
                    "type": "number",
                    "step": 1,
                    "dflt": 5
                },
                "multiplier" : {
                    "type": "number",
                    "dflt": 0.01
                }
            }
        }
    }
}
var conConf = o.mkNode(conMetaConf);
dbg.conConf = conConf;
var SVGDoc = document;
var svgns = "http://www.w3.org/2000/svg";

// translate a JSON tree to an SVG DOM element tree
var mkSVGEl = function mkSVGEl (kwargs) {
    var elem = SVGDoc.createElementNS(svgns, kwargs.element);
    if(kwargs.attributes) {
        kwargs.attributes.keys().forEach(function(key) {
            if (key !== "style" || typeof(kwargs.attributes.style) !== "object") {
                console.log(kwargs.attributes.style, key);
                elem.setAttributeNS(null, key, kwargs.attributes[key]);
            } else {
                var styleStr = "";
                kwargs.attributes.style.keys().forEach(function(sKey) {
                    styleStr += sKey +
                                ": " +
                                kwargs.attributes.style[sKey] +
                                "; ";
                });
                elem.setAttributeNS(null, "style", styleStr);
            }
        });
    }
    if (kwargs.contents) {
        elem.appendChild(SVGDoc.createTextNode(kwargs.contents));
    }
    if (kwargs.children) {
        kwargs.children.forEach(function(child) {
            elem.appendChild(mkSVGEl(child));
        });
    }
    return elem;
};
// returns a CSS color for shade * cNum * 2 (i.e. chum ranges 0 to 8, 0 being black)
var mkColor = function(shade, cNum) {
    var ret = "#" + 
            shade.slice(0,3).
            map(function(shadeC) { return (shadeC * Math.min(15, cNum * 2)).toString(16);}).
            join("")
    console.log("Making color for shade", shade, "cNum", cNum, "got", ret);
    return ret;
}

// Takes color as vec3 with each element ranging from 0 to 1
var mkKnobSVGEl = function(color) {
    return mkSVGEl();
}

var SVGDescs = {
    "stoppedKnob": function(color) { return {
        "element": "svg",
        "attributes": {
            "width": 32,
            "height": 32,
            "viewBox": "0 0 1 1",
            "style": {
                "background-color": mkColor(color, 1),
                "border": "1px solid #066"
            }
        },
        "children": [{
            "element": "text",
            "attributes": {
                "class": "value",
                "x": 1./32,
                "y": 31./32,
                "font-family": "sans-serif",
                "font-size": 7./32+"px",
                "fill": mkColor(color, 6)
            },
            "contents": "#"
        },{
            "element":  "line",
            "attributes": {
                "x1":   1./2,
                "y1":   1./2,
                "x2":   1./2,
                "y2":   28./32,
                "transform":    "rotate(-30, 0.5, 0.5)",
                "stroke":   mkColor(color, 3),
                "stroke-width": 1./32
            }
        },{
            "element":  "line",
            "attributes": {
                "x1":   1./2,
                "y1":   1./2,
                "x2":   1./2,
                "y2":   28./32,
                "transform":    "rotate(30, 0.5, 0.5)",
                "stroke":  mkColor(color, 3), 
                "stroke-width": 1./32
            }
        },{
            "element": "g",
            "attributes": {
                "class": "knob_head",
            },
            "children": [{
                "element": "circle",
                "attributes": {
                    "cx": 1./2,
                    "cy": 1./2,
                    "r": 1./4,
                    "style": {
                        "fill": mkColor(color, 2),
                        "stroke": mkColor(color, 3),
                        "stroke-width": 1./32
                    }
                }
            }, {
                "element": "rect",
                "attributes": {
                    "x": 15./32,
                    "y": 6./32,
                    "width": 2./32,
                    "height": 12./32,
                    "style": {
                        "stroke": mkColor(color, 4),
                        "stroke-width": 1./32
                    }
                }
            }]
        }]
    };},
    "unstoppedKnob": function(color) { return {
        "element": "svg",
        "attributes": {
            "width": 32,
            "height": 32,
            "viewBox": "0 0 1 1",
            "style": {
                "background-color": mkColor(color, 1),
                "border": "1px solid #066"
            }
        },
        "children": [{
            "element": "text",
            "attributes": {
                "class": "value",
                "x": 1./32,
                "y": 31./32,
                "font-family": "sans-serif",
                "font-size": 7./32+"px",
                "fill": mkColor(color, 6)
            },
            "contents": "#"
        },{
            "element": "g",
            "attributes": {
                "class": "knob_head",
            },
            "children": [{
                "element": "circle",
                "attributes": {
                    "cx": 1./2,
                    "cy": 1./2,
                    "r": 1./4,
                    "style": {
                        "fill": mkColor(color, 2),
                        "stroke": mkColor(color, 3),
                        "stroke-width": 1./32
                    }
                }
            }, {
                "element": "rect",
                "attributes": {
                    "x": 15./32,
                    "y": 6./32,
                    "width": 2./32,
                    "height": 12./32,
                    "style": {
                        "stroke": mkColor(color, 4),
                        "stroke-width": 1./32
                    }
                }
            }]
        }]
    };}
}
return {
    "mkStoppedKnob": function(container) {
        var svg = mkSVGEl(SVGDescs.stoppedKnob([0, 1.0, 1.0]));
        var marble = o.mkNumberNode({
            "max":  1,
            "min":  0,
            "dflt": 0
        });
        var knob = svg.getElementsByClassName("knob_head")[0];
        var valueText = svg.getElementsByClassName("value")[0];
        (function() {
            var myUID = UID();
            var muname = "mouseup.knob_" + myUID;
            var mmname = "mousemove.knob_" + myUID;
            $(knob).mousedown(function(e) {
                var startProp = marble();
                var startY = e.pageY;
                $(document).bind(mmname, function(e){
                    var diffProp = (startY - e.pageY) * (conConf().knob().multiplier());
                    marble(startProp + diffProp);
                });
                $(document).bind(muname, function(e) {
                    $(document).unbind(mmname);
                    $(document).unbind(muname);
                });
            });
            marble.registerListener(function(val) {
                knob.setAttributeNS(null, 
                    "transform", 
                    "rotate(" + (val * 300 - 150)  + " 0.5 0.5)");
                valueText.textContent = val.toString().substring(0, conConf().knob().textLen());
            });
        })();
        marble(0);
        $(container).append(svg);
        return marble;
    },
    "mkUnstoppedKnob": function(container) {
        var svg = mkSVGEl(SVGDescs.unstoppedKnob([0.0, 1.0, 0.0]));
        var marble = o.mkNumberNode({
            "dflt": 0
        });
        var knob = svg.getElementsByClassName("knob_head")[0];
        var valueText = svg.getElementsByClassName("value")[0];
        (function() {
            var myUID = UID();
            var muname = "mouseup.knob_" + myUID;
            var mmname = "mousemove.knob_" + myUID;
            $(knob).mousedown(function(e) {
                var startProp = marble();
                var startY = e.pageY;
                $(document).bind(mmname, function(e){
                    var diffProp = (startY - e.pageY) * (conConf().knob().multiplier());
                    marble(startProp + diffProp);
                });
                $(document).bind(muname, function(e) {
                    $(document).unbind(mmname);
                    $(document).unbind(muname);
                });
            });
            marble.registerListener(function(val) {
                knob.setAttributeNS(null, 
                    "transform", 
                    "rotate(" + (val * 360)  + " 0.5 0.5)");
                valueText.textContent = val.toString().substring(0, conConf().knob().textLen());
            });
        })();
        marble(0);
        $(container).append(svg);
        return marble;
    },
    "mkText": function(desc) {
        $input = $('<input type="text"></input>');
        $input.change(function(e) {
            prop($(this).val());
        });
        prop.regsiterListener(function(val, attemptedVal, node) {
            $input.val(val);
        });
        return {
            "node": "",     // put marble node here
            "element": ""   // some bullshit that can be jquery.append()'d
        }
    }
};
})();
console.log("MarbleUtil loaded", ou);
