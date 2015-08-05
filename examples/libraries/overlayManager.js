//
//  overlayManager.js
//  examples/libraries
//
//  Created by Zander Otavka on 7/24/15
//  Copyright 2015 High Fidelity, Inc.
//
//  Manage overlays with object oriented goodness, instead of ugly `Overlays.h` methods.
//  Instead of:
//
//      var billboard = Overlays.addOverlay("image3d", { visible: false });
//      ...
//      Overlays.editOverlay(billboard, { visible: true });
//      ...
//      Overlays.deleteOverlay(billboard);
//
//  You can now do:
//
//      var billboard = new Image3DOverlay({ visible: false });
//      ...
//      billboard.visible = true;
//      ...
//      billboard.destroy();
//
//  See more on usage below.
//
//  Note that including this file will delete Overlays from the global scope.  All the
//  functionality of Overlays is represented here, just better.  If you try to use Overlays in
//  tandem, there may be performance problems or nasty surprises.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//


(function() {
    // Delete `Overlays` from the global scope.
    var Overlays = this.Overlays;
    delete this.Overlays;

    var overlays = {};
    var panels = {};

    var overlayTypes,
        Overlay,
        Overlay2D,
        Base3DOverlay,
        Planar3DOverlay,
        Billboard3DOverlay,
        Volume3DOverlay;


    //
    //  Create a new JavaScript object for an overlay of given ID.
    //
    function makeOverlayFromId(id) {
        var type = Overlays.getOverlayType(id);
        if (!type) {
            return null;
        }
        var overlay = new overlayTypes[type]();
        overlay._id = id;
        var attachedPanel = findPanel(Overlays.getAttachedPanel(id))
        if (attachedPanel) {
            attachedPanel.addChild(overlay);
        }
        overlays[id] = overlay;
        return overlay;
    }

    //
    //  Get or create an overlay object from the id.
    //
    //  @param knownOverlaysOnly (Optional: Boolean)
    //      If true, a new object will not be created.
    //  @param searchList (Optional: Object)
    //      Map of overlay id's and overlay objects.  Can be generated with
    //      `OverlayManager.makeSearchList`.
    //
    function findOverlay(id, knownOverlaysOnly, searchList) {
        if (id > 0) {
            knownOverlaysOnly = Boolean(knownOverlaysOnly);
            searchList = searchList || overlays;
            var foundOverlay = searchList[id];
            if (foundOverlay) {
                return foundOverlay;
            }
            if (!knownOverlaysOnly) {
                return makeOverlayFromId(id);
            }
        }
        return null;
    }

    //
    //  Create a new JavaScript object for a panel of given ID.
    //
    function makePanelFromId(id) {
        if (!Overlays.isAddedPanel(id)) {
            return null;
        }
        var panel = new FloatingUIPanel();
        panel._id = id;
        var attachedPanel = findPanel(Overlays.getAttachedPanel(id))
        if (attachedPanel) {
            attachedPanel.addChild(panel);
        }
        overlays[id] = overlay;
        return overlay;
    }

    //
    //  Get or create a panel object from the id.
    //
    //  @param knownOverlaysOnly (Optional: Boolean)
    //      If true, a new object will not be created.
    //  @param searchList (Optional: Object)
    //      Map of overlay id's and overlay objects.  Can be generated with
    //      `OverlayManager.makeSearchList`.
    //
    function findPanel(id, knownPanelsOnly, searchList) {
        if (id > 0) {
            knownPanelsOnly = Boolean(knownPanelsOnly);
            searchList = searchList || panels;
            var foundPanel = searchList[id];
            if (foundPanel) {
                return foundPanel;
            }
            if (!knownPanelsOnly) {
                return makePanelFromId(id);
            }
        }
        return null;
    }


    //
    //  Perform global scoped operations on overlays, such as finding by ray intersection.
    //
    OverlayManager = {
        findOnRay: function(pickRay, knownOverlaysOnly, searchList) {
            var rayPickResult = Overlays.findRayIntersection(pickRay);
            if (rayPickResult.intersects) {
                return findOverlay(rayPickResult.overlayID, knownOverlaysOnly, searchList);
            }
            return null;
        },
        findAtPoint: function(point, knownOverlaysOnly, searchList) {
            var foundID = Overlays.getOverlayAtPoint(point);
            if (foundID) {
                return findOverlay(foundID, knownOverlaysOnly, searchList);
            } else {
                var pickRay = Camera.computePickRay(point.x, point.y);
                return OverlayManager.findOnRay(pickRay, knownOverlaysOnly, searchList);
            }
        },
        makeSearchList: function(overlayArray) {
            var searchList = {};
            overlayArray.forEach(function(overlay){
                searchList[overlay._id] = overlay;
            });
            return searchList;
        }
    };


    //
    //  Object oriented abstraction layer for overlays.
    //
    //  Usage:
    //      // Create an overlay
    //      var billboard = new Image3DOverlay({
    //          visible: true,
    //          isFacingAvatar: true,
    //          ignoreRayIntersections: false
    //      });
    //
    //      // Get a property
    //      var isVisible = billboard.visible;
    //
    //      // Set a single property
    //      billboard.position = { x: 1, y: 3, z: 2 };
    //
    //      // Set multiple properties at the same time
    //      billboard.setProperties({
    //          url: "http://images.com/overlayImage.jpg",
    //          dimensions: { x: 2, y: 2 }
    //      });
    //
    //      // Clone an overlay
    //      var clonedBillboard = billboard.clone();
    //
    //      // Remove an overlay from the world
    //      billboard.destroy();
    //
    //      // Remember, there is a poor orphaned JavaScript object left behind.  You should
    //      // remove any references to it so you don't accidentally try to modify an overlay that
    //      // isn't there.
    //      billboard = undefined;
    //
    (function() {
        var ABSTRACT = null;
        overlayTypes = {};

        function generateOverlayClass(superclass, type, properties) {
            var that;
            if (type == ABSTRACT) {
                that = function(type, params) {
                    superclass.call(this, type, params);
                };
            } else {
                that = function(params) {
                    superclass.call(this, type, params);
                };
                overlayTypes[type] = that;
            }

            that.prototype = new superclass();
            that.prototype.constructor = that;

            properties.forEach(function(prop) {
                Object.defineProperty(that.prototype, prop, {
                    get: function() {
                        return Overlays.getProperty(this._id, prop);
                    },
                    set: function(newValue) {
                        var keyValuePair = {};
                        keyValuePair[prop] = newValue;
                        this.setProperties(keyValuePair);
                    },
                    configurable: false
                });
            });

            return that;
        }

        // Supports multiple inheritance of properties.  Just `concat` them onto the end of the
        // properties list.
        var PANEL_ATTACHABLE_FIELDS = ["offsetPosition", "facingRotation"];

        Overlay = (function() {
            var that = function(type, params) {
                if (type && params) {
                    this._id = Overlays.addOverlay(type, params);
                    overlays[this._id] = this;
                } else {
                    this._id = 0;
                }
            };

            that.prototype.constructor = that;

            Object.defineProperty(that.prototype, "isLoaded", {
                get: function() {
                    return Overlays.isLoaded(this._id);
                }
            });

            Object.defineProperty(that.prototype, "attachedPanel", {
                get: function() {
                    return findPanel(Overlays.getAttachedPanel(this._id));
                }
            });

            that.prototype.getTextSize = function(text) {
                return Overlays.textSize(this._id, text);
            };

            that.prototype.setProperties = function(properties) {
                Overlays.editOverlay(this._id, properties);
            };

            that.prototype.clone = function() {
                return makeOverlayFromId(Overlays.cloneOverlay(this._id));
            };

            that.prototype.destroy = function() {
                Overlays.deleteOverlay(this._id);
            };

            that.prototype.isPanelAttachable = function() {
                return true;
            };

            return generateOverlayClass(that, ABSTRACT, [
                "alpha", "glowLevel", "pulseMax", "pulseMin", "pulsePeriod", "glowLevelPulse",
                "alphaPulse", "colorPulse", "visible", "anchor"
            ]);
        })();

        Overlay2D = generateOverlayClass(Overlay, ABSTRACT, [
            "bounds", "x", "y", "width", "height"
        ]);

        Base3DOverlay = generateOverlayClass(Overlay, ABSTRACT, [
            "position", "lineWidth", "rotation", "isSolid", "isFilled", "isWire", "isDashedLine",
            "ignoreRayIntersection", "drawInFront", "drawOnHUD"
        ]);

        Planar3DOverlay = generateOverlayClass(Base3DOverlay, ABSTRACT, [
            "dimensions"
        ]);

        Billboard3DOverlay = generateOverlayClass(Planar3DOverlay, ABSTRACT, [
            "isFacingAvatar"
        ].concat(PANEL_ATTACHABLE_FIELDS));
        Billboard3DOverlay.prototype.isPanelAttachable = function() { return true; };

        Volume3DOverlay = generateOverlayClass(Base3DOverlay, ABSTRACT, [
            "dimensions"
        ]);

        generateOverlayClass(Overlay2D, "image", [
            "subImage", "imageURL"
        ]);

        generateOverlayClass(Billboard3DOverlay, "image3d", [
            "url", "subImage"
        ]);

        generateOverlayClass(Overlay2D, "text", [
            "font", "text", "backgroundColor", "backgroundAlpha", "leftMargin", "topMargin"
        ]);

        generateOverlayClass(Billboard3DOverlay, "text3d", [
            "text", "backgroundColor", "backgroundAlpha", "lineHeight", "leftMargin", "topMargin",
            "rightMargin", "bottomMargin"
        ]);

        generateOverlayClass(Volume3DOverlay, "cube", [
            "borderSize"
        ]);

        generateOverlayClass(Volume3DOverlay, "sphere", [
        ]);

        generateOverlayClass(Planar3DOverlay, "circle3d", [
            "startAt", "endAt", "outerRadius", "innerRadius", "hasTickMarks",
            "majorTickMarksAngle", "minorTickMarksAngle", "majorTickMarksLength",
            "minorTickMarksLength", "majorTickMarksColor", "minorTickMarksColor"
        ]);

        generateOverlayClass(Planar3DOverlay, "rectangle3d", [
        ]);

        generateOverlayClass(Base3DOverlay, "line3d", [
            "start", "end"
        ]);

        generateOverlayClass(Planar3DOverlay, "grid", [
            "minorGridWidth", "majorGridEvery"
        ]);

        generateOverlayClass(Volume3DOverlay, "localmodels", [
        ]);

        generateOverlayClass(Volume3DOverlay, "model", [
            "url", "dimensions", "textures"
        ]);
    })();

    ImageOverlay = overlayTypes["image"];
    Image3DOverlay = overlayTypes["image3d"];
    TextOverlay = overlayTypes["text"];
    Text3DOverlay = overlayTypes["text3d"];
    Cube3DOverlay = overlayTypes["cube"];
    Sphere3DOverlay = overlayTypes["sphere"];
    Circle3DOverlay = overlayTypes["circle3d"];
    Rectangle3DOverlay = overlayTypes["rectangle3d"];
    Line3DOverlay = overlayTypes["line3d"];
    Grid3DOverlay = overlayTypes["grid"];
    LocalModelsOverlay = overlayTypes["localmodels"];
    ModelOverlay = overlayTypes["model"];


    //
    //  Object oriented abstraction layer for panels.
    //
    FloatingUIPanel = (function() {
        var that = function(params) {
            this._id = Overlays.addPanel(params);
            this._children = [];
            this._visible = Boolean(params.visible);
            panels[this._id] = this;
        };

        that.prototype.constructor = that;

        that.AddChildException = function(message) {
            this.message = message;
        };

        [
            "anchorPosition", "anchorPositionBinding", "offsetRotation", "offsetRotationBinding", 
            "offsetPosition", "facingRotation", "visible"
        ].forEach(function(prop) {
            Object.defineProperty(that.prototype, prop, {
                get: function() {
                    return Overlays.getPanelProperty(this._id, prop);
                },
                set: function(newValue) {
                    var keyValuePair = {};
                    keyValuePair[prop] = newValue;
                    this.setProperties(keyValuePair);
                },
                configurable: false
            });
        });

        Object.defineProperty(that.prototype, "attachedPanel", {
            get: function() {
                return findPanel(Overlays.getAttachedPanel(this._id));
            }
        });

        Object.defineProperty(that.prototype, "children", {
            get: function() {
                return this._children.slice();
            }
        });

        that.prototype.addChild = function(child) {
            if (child instanceof Overlay && child.isPanelAttachable() ||
                child instanceof FloatingUIPanel) {
                Overlays.setAttachedPanel(child._id, this._id);
            } else {
                throw new that.AddChildException("Given child is not panel attachable.");
            }
            child.visible = this.visible;
            this._children.push(child);
            return child;
        };

        that.prototype.removeChild = function(child) {
            var i = this._children.indexOf(child);
            if (i >= 0) {
                Overlays.setAttachedPanel(child._id, 0);
                this._children.splice(i, 1);
            }
        };

        that.prototype.setProperties = function(properties) {
            Overlays.editPanel(this._id, properties);
        };

        that.prototype.setChildrenVisible = function() {
            this._children.forEach(function(child) {
                child.visible = true;
                if (child.setChildrenVisible !== undefined) {
                    child.setChildrenVisible();
                }
            });
        };

        that.prototype.destroy = function() {
            Overlays.deletePanel(this._id);
        };

        return that;
    })();


    function onOverlayDeleted(id) {
        if (id in overlays) {
            if (overlays[id].attachedPanel) {
                overlays[id].attachedPanel.removeChild(overlays[id]);
            }
            delete overlays[id];
        }
    }

    function onPanelDeleted(id) {
        if (id in panels) {
            if (panels[id].attachedPanel) {
                panels[id].attachedPanel.removeChild(panels[id]);
            }
            delete panels[id];
        }
    }

    Overlays.overlayDeleted.connect(onOverlayDeleted);
    Overlays.panelDeleted.connect(onPanelDeleted);
})();
