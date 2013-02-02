"use strict";
var oU = (function() {
var conMetaConf = {
    "type": "root",
    "variables": {
        "defaultStep": {
            "type" : "int",
            "dflt" : 1 
        },
        "knob": {
            "type": "compound",
            "variables" : {
                "multiplier": {
                    "doc": "multiplier from pixel movement to prop movement",
                    "type": "float",
                    "dflt": 5
                },
                "textLen" : {
                    "type": "int",
                    "dflt": 5
                }
            }
        }
    }
}
var conConf = o.mkNode(conMetaConf);
var SVGDoc = document.ownerDocument;
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
return {
    "mkKnob": function(desc) {
        var svg = mkSVGEl({
            "element": "svg",
            "attributes": {
                "width": 32,
                "height": 32,
                "viewBox": "0 0 1 1",
                "style": {
                    "background-color": "#022",
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
                    "fill": "#0cc"
                },
                "contents": prop.dflt
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
                            "fill": "#044",
                            "stroke": "#066",
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
                            "stroke": "#088",
                            "stroke-width": 1./32,
                        }
                    }
                }]
            }]
        });
        var knob = svg.getElementsByClassName("knob_head")[0];
        var valueText = svg.getElementsByClassName("value")[0];
        (function() {
            var startY;
            var startProp;
            $(knob).mousedown(function(e) {
                startY = e.pageY;
                startProp = 30; // XXX should be a value
                var multiplier = control.multiplier; 
                $(document).bind("mousemove.knob_" + prop.treePos, function(e){
                    diffProp = (startY - e.pageY) * (multiplier || conConf().knob().multiplier());
                    prop(startProp + diffProp);
                });
                $(document).bind("mouseup.knob_" + prop.treePos, function(e) {
                    $(document).unbind("mousemove.knob_" + prop.treePos);
                    $(document).unbind("mouseup.knob_" + prop.treePos);
                });
            });
            prop.registerListener(function(val, attemptedVal, node) {
                var valText = val.toString().substring(0, conConf().knob().textLen());
                knob.setAttributeNS(null, "transform", "rotate(" + (Math.PI/8 * val)  + " 0.5 0.5)");
                valueText.textContent = valText;
            });
        })();
        $conCon.append(svg);
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
