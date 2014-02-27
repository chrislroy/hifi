//
//  editVoxels.js
//  hifi
//
//  Created by Philip Rosedale on February 8, 2014
//  Copyright (c) 2014 HighFidelity, Inc. All rights reserved.
//
//  Captures mouse clicks and edits voxels accordingly.
//
//  click = create a new voxel on this face, same color as old (default color picker state)
//  right click or control + click = delete this voxel 
//  shift + click = recolor this voxel
//  1 - 8 = pick new color from palette
//  9 = create a new voxel in front of the camera 
//
//  Click and drag to create more new voxels in the same direction
//

var windowDimensions = Controller.getViewportDimensions();

var NEW_VOXEL_SIZE = 1.0;
var NEW_VOXEL_DISTANCE_FROM_CAMERA = 3.0;
var ORBIT_RATE_ALTITUDE = 200.0;
var ORBIT_RATE_AZIMUTH = 90.0;
var PIXELS_PER_EXTRUDE_VOXEL = 16;
var WHEEL_PIXELS_PER_SCALE_CHANGE = 100;
var MAX_VOXEL_SCALE = 1.0;
var MIN_VOXEL_SCALE = 1.0 / Math.pow(2.0, 8.0);

var zFightingSizeAdjust = 0.002; // used to adjust preview voxels to prevent z fighting
var previewLineWidth = 1.5;

var oldMode = Camera.getMode();

var isAdding = false; 
var isExtruding = false; 
var isOrbiting = false;
var isOrbitingFromTouch = false;
var isPanning = false;
var isPanningFromTouch = false;
var touchPointsToOrbit = 2; // you can change these, but be mindful that on some track pads 2 touch points = right click+drag
var touchPointsToPan = 3; 
var orbitAzimuth = 0.0;
var orbitAltitude = 0.0;
var orbitCenter = { x: 0, y: 0, z: 0 };
var orbitPosition = { x: 0, y: 0, z: 0 };
var torsoToEyeVector = { x: 0, y: 0, z: 0 }; 
var orbitRadius = 0.0;
var extrudeDirection = { x: 0, y: 0, z: 0 };
var extrudeScale = 0.0;
var lastVoxelPosition = { x: 0, y: 0, z: 0 };
var lastVoxelColor = { red: 0, green: 0, blue: 0 };
var lastVoxelScale = 0;
var dragStart = { x: 0, y: 0 };
var wheelPixelsMoved = 0;


var mouseX = 0;
var mouseY = 0; 

//  Create a table of the different colors you can choose
var colors = new Array();
colors[0] = { red: 120, green: 181, blue: 126 };
colors[1] = { red: 75,  green: 155, blue: 103 };
colors[2] = { red: 56,  green: 132, blue: 86 };
colors[3] = { red: 83,  green: 211, blue: 83 };
colors[4] = { red: 236, green: 174,  blue: 0 };
colors[5] = { red: 234, green: 133,  blue: 0 };
colors[6] = { red: 211, green: 115,  blue: 0 };
colors[7] = { red: 48,  green: 116,  blue: 119 };
colors[8] = { red: 31,  green: 64,  blue: 64 };
var numColors = 9;
var whichColor = -1;            //  Starting color is 'Copy' mode

//  Create sounds for adding, deleting, recoloring voxels 
var addSound1 = new Sound("https://s3-us-west-1.amazonaws.com/highfidelity-public/sounds/Voxels/voxel+create+2.raw");
var addSound2 = new Sound("https://s3-us-west-1.amazonaws.com/highfidelity-public/sounds/Voxels/voxel+create+3.raw");
var addSound3 = new Sound("https://s3-us-west-1.amazonaws.com/highfidelity-public/sounds/Voxels/voxel+create+4.raw");

var deleteSound = new Sound("https://s3-us-west-1.amazonaws.com/highfidelity-public/sounds/Voxels/voxel+delete+2.raw");
var changeColorSound = new Sound("https://s3-us-west-1.amazonaws.com/highfidelity-public/sounds/Voxels/voxel+edit+2.raw");
var clickSound = new Sound("https://s3-us-west-1.amazonaws.com/highfidelity-public/sounds/Switches+and+sliders/toggle+switch+-+medium.raw");
var audioOptions = new AudioInjectionOptions();

audioOptions.volume = 0.5;
audioOptions.position = Vec3.sum(MyAvatar.position, { x: 0, y: 1, z: 0 }  ); // start with audio slightly above the avatar

var editToolsOn = true; // starts out off

// previewAsVoxel - by default, we will preview adds/deletes/recolors as just 4 lines on the intersecting face. But if you
//                  the preview to show a full voxel then set this to true and the voxel will be displayed for voxel editing
var previewAsVoxel = false; 

var voxelPreview = Overlays.addOverlay("cube", {
                    position: { x: 0, y: 0, z: 0},
                    size: 1,
                    color: { red: 255, green: 0, blue: 0},
                    alpha: 1,
                    solid: false,
                    visible: false,
                    lineWidth: 4
                });
                
var linePreviewTop = Overlays.addOverlay("line3d", {
                    position: { x: 0, y: 0, z: 0},
                    end: { x: 0, y: 0, z: 0},
                    color: { red: 255, green: 255, blue: 255},
                    alpha: 1,
                    visible: false,
                    lineWidth: previewLineWidth
                });

var linePreviewBottom = Overlays.addOverlay("line3d", {
                    position: { x: 0, y: 0, z: 0},
                    end: { x: 0, y: 0, z: 0},
                    color: { red: 255, green: 255, blue: 255},
                    alpha: 1,
                    visible: false,
                    lineWidth: previewLineWidth
                });

var linePreviewLeft = Overlays.addOverlay("line3d", {
                    position: { x: 0, y: 0, z: 0},
                    end: { x: 0, y: 0, z: 0},
                    color: { red: 255, green: 255, blue: 255},
                    alpha: 1,
                    visible: false,
                    lineWidth: previewLineWidth
                });

var linePreviewRight = Overlays.addOverlay("line3d", {
                    position: { x: 0, y: 0, z: 0},
                    end: { x: 0, y: 0, z: 0},
                    color: { red: 255, green: 255, blue: 255},
                    alpha: 1,
                    visible: false,
                    lineWidth: previewLineWidth
                });


// these will be used below
var sliderWidth = 154;
var sliderHeight = 37;

// These will be our "overlay IDs"
var swatches = new Array();
var swatchExtraPadding = 5;
var swatchHeight = 37;
var swatchWidth = 27;
var swatchesWidth = swatchWidth * numColors + numColors + swatchExtraPadding * 2;
var swatchesX = (windowDimensions.x - (swatchesWidth + sliderWidth)) / 2;
var swatchesY = windowDimensions.y - swatchHeight + 1;

var toolIconUrl = "http://highfidelity-public.s3-us-west-1.amazonaws.com/images/tools/";

// create the overlays, position them in a row, set their colors, and for the selected one, use a different source image
// location so that it displays the "selected" marker
for (s = 0; s < numColors; s++) {

    var extraWidth = 0;

    if (s == 0) {
        extraWidth = swatchExtraPadding;
    }

    var imageFromX = swatchExtraPadding - extraWidth + s * swatchWidth;
    var imageFromY = swatchHeight + 1;

    var swatchX = swatchExtraPadding - extraWidth + swatchesX + ((swatchWidth - 1) * s);

    if (s == (numColors - 1)) {
        extraWidth = swatchExtraPadding;
    }

    swatches[s] = Overlays.addOverlay("image", {
                    x: swatchX,
                    y: swatchesY,
                    width: swatchWidth + extraWidth,
                    height: swatchHeight,
                    subImage: { x: imageFromX, y: imageFromY, width: swatchWidth + extraWidth, height: swatchHeight },
                    imageURL: toolIconUrl + "swatches.svg",
                    color: colors[s],
                    alpha: 1,
                    visible: editToolsOn
                });
}


// These will be our tool palette overlays
var numberOfTools = 3;
var toolHeight = 50;
var toolWidth = 50;
var toolVerticalSpacing = 4;
var toolsHeight = toolHeight * numberOfTools + toolVerticalSpacing * (numberOfTools - 1);
var toolsX = 8;
var toolsY = (windowDimensions.y - toolsHeight) / 2;

var voxelToolAt = 0;
var recolorToolAt = 1;
var eyedropperToolAt = 2;

var voxelTool = Overlays.addOverlay("image", {
                    x: 0, y: 0, width: toolWidth, height: toolHeight,
                    subImage: { x: 0, y: toolHeight, width: toolWidth, height: toolHeight },
                    imageURL: toolIconUrl + "voxel-tool.svg",
                    visible: false,
                    alpha: 0.9
                });

var recolorTool = Overlays.addOverlay("image", {
                    x: 0, y: 0, width: toolWidth, height: toolHeight,
                    subImage: { x: 0, y: toolHeight, width: toolWidth, height: toolHeight },
                    imageURL: toolIconUrl + "paint-tool.svg",
                    visible: false,
                    alpha: 0.9
                });

var eyedropperTool = Overlays.addOverlay("image", {
                    x: 0, y: 0, width: toolWidth, height: toolHeight,
                    subImage: { x: 0, y: toolHeight, width: toolWidth, height: toolHeight },
                    imageURL: toolIconUrl + "eyedropper-tool.svg",
                    visible: false,
                    alpha: 0.9
                });
                
// This will create a couple of image overlays that make a "slider", we will demonstrate how to trap mouse messages to
// move the slider

// see above...
//var sliderWidth = 158;
//var sliderHeight = 35;


var sliderX = swatchesX - swatchWidth;
var sliderY = windowDimensions.y - sliderHeight + 1;
var slider = Overlays.addOverlay("image", {
                    // alternate form of expressing bounds
                    bounds: { x: sliderX, y: sliderY, width: sliderWidth, height: sliderHeight},
                    imageURL: toolIconUrl + "voxel-size-slider-bg.svg",
                    alpha: 1,
                    visible: false
                });

// The slider is handled in the mouse event callbacks.
var isMovingSlider = false;
var thumbClickOffsetX = 0;

// This is the thumb of our slider
var minThumbX = 20; // relative to the x of the slider
var maxThumbX = minThumbX + 90;
var thumbExtents = maxThumbX - minThumbX;
var thumbX = (minThumbX + maxThumbX) / 2;
var thumbY = sliderY + 11;
var thumb = Overlays.addOverlay("image", {
                    x: sliderX + thumbX,
                    y: thumbY,
                    width: 17,
                    height: 17,
                    imageURL: toolIconUrl + "voxel-size-slider-handle.svg",
                    alpha: 1,
                    visible: false
                });

var pointerVoxelScale = 0; // this is the voxel scale used for click to add or delete
var pointerVoxelScaleSet = false; // if voxel scale has not yet been set, we use the intersection size

var pointerVoxelScaleSteps = 8; // the number of slider position steps
var pointerVoxelScaleOriginStep = 8; // the position of slider for the 1 meter size voxel
var pointerVoxelScaleMin = Math.pow(2, (1-pointerVoxelScaleOriginStep));
var pointerVoxelScaleMax = Math.pow(2, (pointerVoxelScaleSteps-pointerVoxelScaleOriginStep));
var thumbDeltaPerStep = thumbExtents / (pointerVoxelScaleSteps - 1);

if (editToolsOn) {
    moveTools();
}


function calcThumbFromScale(scale) {
    var scaleLog = Math.log(scale)/Math.log(2);
    var thumbStep = scaleLog + pointerVoxelScaleOriginStep;
    if (thumbStep < 1) {
        thumbStep = 1;
    }
    if (thumbStep > pointerVoxelScaleSteps) {
        thumbStep = pointerVoxelScaleSteps;
    }
    thumbX = (thumbDeltaPerStep * (thumbStep - 1)) + minThumbX;
    Overlays.editOverlay(thumb, { x: thumbX + sliderX } );
}

function calcScaleFromThumb(newThumbX) {
    // newThumbX is the pixel location relative to start of slider,
    // we need to figure out the actual offset in the allowed slider area
    thumbAt = newThumbX - minThumbX;
    thumbStep = Math.floor((thumbAt/ thumbExtents) * (pointerVoxelScaleSteps-1)) + 1;
    pointerVoxelScale = Math.pow(2, (thumbStep-pointerVoxelScaleOriginStep));
    // now reset the display accordingly...
    calcThumbFromScale(pointerVoxelScale);
    
    // if the user moved the thumb, then they are fixing the voxel scale
    pointerVoxelScaleSet = true;
}

function setAudioPosition() {
    var camera = Camera.getPosition();
    var forwardVector = Quat.getFront(MyAvatar.orientation);
    audioOptions.position = Vec3.sum(camera, forwardVector);
}

function getNewVoxelPosition() { 
    var camera = Camera.getPosition();
    var forwardVector = Quat.getFront(MyAvatar.orientation);
    var newPosition = Vec3.sum(camera, Vec3.multiply(forwardVector, NEW_VOXEL_DISTANCE_FROM_CAMERA));
    return newPosition;
}

function fixEulerAngles(eulers) {
    var rVal = { x: 0, y: 0, z: eulers.z };
    if (eulers.x >= 90.0) {
        rVal.x = 180.0 - eulers.x;
        rVal.y = eulers.y - 180.0;
    } else if (eulers.x <= -90.0) {
        rVal.x = 180.0 - eulers.x;
        rVal.y = eulers.y - 180.0;
    }
    return rVal;
}

var trackLastMouseX = 0;
var trackLastMouseY = 0;
var trackAsDelete = false;
var trackAsRecolor = false;
var trackAsEyedropper = false;
var trackAsOrbitOrPan = false;

var voxelToolSelected = true;
var recolorToolSelected = false;
var eyedropperToolSelected = false;

function playRandomAddSound(audioOptions) {
    if (Math.random() < 0.33) {
        Audio.playSound(addSound1, audioOptions);
    } else if (Math.random() < 0.5) {
        Audio.playSound(addSound2, audioOptions);
    } else {
        Audio.playSound(addSound3, audioOptions);
    }
}

function calculateVoxelFromIntersection(intersection, operation) {
    //print("calculateVoxelFromIntersection() operation="+operation);
    var resultVoxel;

    var wantDebug = false;
    if (wantDebug) {
        print(">>>>> calculateVoxelFromIntersection().... intersection voxel.red/green/blue=" + intersection.voxel.red + ", " 
                                + intersection.voxel.green + ", " + intersection.voxel.blue);
        print("   intersection voxel.x/y/z/s=" + intersection.voxel.x + ", " 
                                + intersection.voxel.y + ", " + intersection.voxel.z+ ": " + intersection.voxel.s);
        print("   intersection face=" + intersection.face);
        print("   intersection distance=" + intersection.distance);
        print("   intersection intersection.x/y/z=" + intersection.intersection.x + ", " 
                                + intersection.intersection.y + ", " + intersection.intersection.z);
    }
    
    var voxelSize;
    if (pointerVoxelScaleSet) {
        voxelSize = pointerVoxelScale; 
    } else {
        voxelSize = intersection.voxel.s; 
    }

    var x;
    var y;
    var z;
    
    // if our "target voxel size" is larger than the voxel we intersected with, then we need to find the closest
    // ancestor voxel of our target size that contains our intersected voxel.
    if (voxelSize > intersection.voxel.s) {
        if (wantDebug) {
            print("voxelSize > intersection.voxel.s.... choose the larger voxel that encompasses the one selected");
        }
        x = Math.floor(intersection.voxel.x / voxelSize) * voxelSize;
        y = Math.floor(intersection.voxel.y / voxelSize) * voxelSize;
        z = Math.floor(intersection.voxel.z / voxelSize) * voxelSize;
    } else {
        // otherwise, calculate the enclosed voxel of size voxelSize that the intersection point falls inside of.
        // if you have a voxelSize that's smaller than the voxel you're intersecting, this calculation will result
        // in the subvoxel that the intersection point falls in, if the target voxelSize matches the intersecting
        // voxel this still works and results in returning the intersecting voxel which is what we want
        var adjustToCenter = Vec3.multiply(Voxels.getFaceVector(intersection.face), (voxelSize * -0.5));
        if (wantDebug) {
            print("adjustToCenter=" + adjustToCenter.x + "," + adjustToCenter.y + "," + adjustToCenter.z);
        }
        var centerOfIntersectingVoxel = Vec3.sum(intersection.intersection, adjustToCenter);
        x = Math.floor(centerOfIntersectingVoxel.x / voxelSize) * voxelSize;
        y = Math.floor(centerOfIntersectingVoxel.y / voxelSize) * voxelSize;
        z = Math.floor(centerOfIntersectingVoxel.z / voxelSize) * voxelSize;
    }
    resultVoxel = { x: x, y: y, z: z, s: voxelSize };
    highlightAt = { x: x, y: y, z: z, s: voxelSize };

    // we only do the "add to the face we're pointing at" adjustment, if the operation is an add
    // operation, and the target voxel size is equal to or smaller than the intersecting voxel.
    var wantAddAdjust = (operation == "add" && (voxelSize <= intersection.voxel.s));
    if (wantDebug) {
        print("wantAddAdjust="+wantAddAdjust);
    }

    // now we also want to calculate the "edge square" for the face for this voxel
    if (intersection.face == "MIN_X_FACE") {

        highlightAt.x = x - zFightingSizeAdjust;
        if (wantAddAdjust) {
            resultVoxel.x -= voxelSize;
        }
        
        resultVoxel.bottomLeft = {x: highlightAt.x, y: highlightAt.y + zFightingSizeAdjust, z: highlightAt.z + zFightingSizeAdjust };
        resultVoxel.bottomRight = {x: highlightAt.x, y: highlightAt.y + zFightingSizeAdjust, z: highlightAt.z + voxelSize - zFightingSizeAdjust };
        resultVoxel.topLeft = {x: highlightAt.x, y: highlightAt.y + voxelSize - zFightingSizeAdjust, z: highlightAt.z + zFightingSizeAdjust };
        resultVoxel.topRight = {x: highlightAt.x, y: highlightAt.y + voxelSize - zFightingSizeAdjust, z: highlightAt.z + voxelSize - zFightingSizeAdjust };

    } else if (intersection.face == "MAX_X_FACE") {

        highlightAt.x = x + voxelSize + zFightingSizeAdjust;
        if (wantAddAdjust) {
            resultVoxel.x += resultVoxel.s;
        }

        resultVoxel.bottomRight = {x: highlightAt.x, y: highlightAt.y + zFightingSizeAdjust, z: highlightAt.z + zFightingSizeAdjust };
        resultVoxel.bottomLeft = {x: highlightAt.x, y: highlightAt.y + zFightingSizeAdjust, z: highlightAt.z + voxelSize - zFightingSizeAdjust };
        resultVoxel.topRight = {x: highlightAt.x, y: highlightAt.y + voxelSize - zFightingSizeAdjust, z: highlightAt.z + zFightingSizeAdjust };
        resultVoxel.topLeft = {x: highlightAt.x, y: highlightAt.y + voxelSize - zFightingSizeAdjust, z: highlightAt.z + voxelSize - zFightingSizeAdjust };

    } else if (intersection.face == "MIN_Y_FACE") {

        highlightAt.y = y - zFightingSizeAdjust;
        if (wantAddAdjust) {
            resultVoxel.y -= voxelSize;
        }
        
        resultVoxel.topRight = {x: highlightAt.x + zFightingSizeAdjust , y: highlightAt.y, z: highlightAt.z + zFightingSizeAdjust  };
        resultVoxel.topLeft = {x: highlightAt.x + voxelSize - zFightingSizeAdjust, y: highlightAt.y, z: highlightAt.z + zFightingSizeAdjust };
        resultVoxel.bottomRight = {x: highlightAt.x + zFightingSizeAdjust , y: highlightAt.y, z: highlightAt.z  + voxelSize - zFightingSizeAdjust };
        resultVoxel.bottomLeft = {x: highlightAt.x + voxelSize - zFightingSizeAdjust , y: highlightAt.y, z: highlightAt.z + voxelSize - zFightingSizeAdjust };

    } else if (intersection.face == "MAX_Y_FACE") {

        highlightAt.y = y + voxelSize + zFightingSizeAdjust;
        if (wantAddAdjust) {
            resultVoxel.y += voxelSize;
        }
        
        resultVoxel.bottomRight = {x: highlightAt.x + zFightingSizeAdjust, y: highlightAt.y, z: highlightAt.z + zFightingSizeAdjust };
        resultVoxel.bottomLeft = {x: highlightAt.x + voxelSize - zFightingSizeAdjust, y: highlightAt.y, z: highlightAt.z + zFightingSizeAdjust};
        resultVoxel.topRight = {x: highlightAt.x + zFightingSizeAdjust, y: highlightAt.y, z: highlightAt.z  + voxelSize - zFightingSizeAdjust};
        resultVoxel.topLeft = {x: highlightAt.x + voxelSize - zFightingSizeAdjust, y: highlightAt.y, z: highlightAt.z + voxelSize - zFightingSizeAdjust};

    } else if (intersection.face == "MIN_Z_FACE") {

        highlightAt.z = z - zFightingSizeAdjust;
        if (wantAddAdjust) {
            resultVoxel.z -= voxelSize;
        }
        
        resultVoxel.bottomRight = {x: highlightAt.x + zFightingSizeAdjust, y: highlightAt.y + zFightingSizeAdjust, z: highlightAt.z };
        resultVoxel.bottomLeft = {x: highlightAt.x + voxelSize - zFightingSizeAdjust, y: highlightAt.y + zFightingSizeAdjust, z: highlightAt.z};
        resultVoxel.topRight = {x: highlightAt.x + zFightingSizeAdjust, y: highlightAt.y + voxelSize - zFightingSizeAdjust, z: highlightAt.z };
        resultVoxel.topLeft = {x: highlightAt.x + voxelSize - zFightingSizeAdjust, y: highlightAt.y + voxelSize - zFightingSizeAdjust, z: highlightAt.z};

    } else if (intersection.face == "MAX_Z_FACE") {

        highlightAt.z = z + voxelSize + zFightingSizeAdjust;
        if (wantAddAdjust) {
            resultVoxel.z += voxelSize;
        }

        resultVoxel.bottomLeft = {x: highlightAt.x + zFightingSizeAdjust, y: highlightAt.y + zFightingSizeAdjust, z: highlightAt.z };
        resultVoxel.bottomRight = {x: highlightAt.x + voxelSize - zFightingSizeAdjust, y: highlightAt.y + zFightingSizeAdjust, z: highlightAt.z};
        resultVoxel.topLeft = {x: highlightAt.x + zFightingSizeAdjust, y: highlightAt.y + voxelSize - zFightingSizeAdjust, z: highlightAt.z };
        resultVoxel.topRight = {x: highlightAt.x + voxelSize - zFightingSizeAdjust, y: highlightAt.y + voxelSize - zFightingSizeAdjust, z: highlightAt.z};

    }
    
    return resultVoxel;
}

function showPreviewVoxel() {
    var voxelColor;

    var pickRay = Camera.computePickRay(trackLastMouseX, trackLastMouseY);
    var intersection = Voxels.findRayIntersection(pickRay);

    // if the user hasn't updated the 
    if (!pointerVoxelScaleSet) {
        calcThumbFromScale(intersection.voxel.s);
    }

    if (whichColor == -1) {
        //  Copy mode - use clicked voxel color
        voxelColor = { red: intersection.voxel.red,
                  green: intersection.voxel.green,
                  blue: intersection.voxel.blue };
    } else {
        voxelColor = { red: colors[whichColor].red,
                  green: colors[whichColor].green,
                  blue: colors[whichColor].blue };
    }

    var guidePosition;
    if (trackAsRecolor || recolorToolSelected || trackAsEyedropper || eyedropperToolSelected) {
        Overlays.editOverlay(voxelPreview, { visible: true });
    } else if (trackAsOrbitOrPan) {
        Overlays.editOverlay(voxelPreview, { visible: false });
    } else if (voxelToolSelected && !isExtruding) {
        Overlays.editOverlay(voxelPreview, { visible: true });
    } else if (isExtruding) {
        Overlays.editOverlay(voxelPreview, { visible: false });
    }
}

function showPreviewLines() {

    var pickRay = Camera.computePickRay(trackLastMouseX, trackLastMouseY);
    var intersection = Voxels.findRayIntersection(pickRay);
    
    if (intersection.intersects) {

        // if the user hasn't updated the 
        if (!pointerVoxelScaleSet) {
            calcThumbFromScale(intersection.voxel.s);
        }

        resultVoxel = calculateVoxelFromIntersection(intersection,"");
        Overlays.editOverlay(voxelPreview, { visible: false });
        Overlays.editOverlay(linePreviewTop, { position: resultVoxel.topLeft, end: resultVoxel.topRight, visible: true });
        Overlays.editOverlay(linePreviewBottom, { position: resultVoxel.bottomLeft, end: resultVoxel.bottomRight, visible: true });
        Overlays.editOverlay(linePreviewLeft, { position: resultVoxel.topLeft, end: resultVoxel.bottomLeft, visible: true });
        Overlays.editOverlay(linePreviewRight, { position: resultVoxel.topRight, end: resultVoxel.bottomRight, visible: true });
    } else {
        Overlays.editOverlay(voxelPreview, { visible: false });
        Overlays.editOverlay(linePreviewTop, { visible: false });
        Overlays.editOverlay(linePreviewBottom, { visible: false });
        Overlays.editOverlay(linePreviewLeft, { visible: false });
        Overlays.editOverlay(linePreviewRight, { visible: false });
    }
}

function showPreviewGuides() {
    if (editToolsOn) {
        if (previewAsVoxel) {
            showPreviewVoxel();

            // make sure alternative is hidden
            Overlays.editOverlay(linePreviewTop, { visible: false });
            Overlays.editOverlay(linePreviewBottom, { visible: false });
            Overlays.editOverlay(linePreviewLeft, { visible: false });
            Overlays.editOverlay(linePreviewRight, { visible: false });
        } else {
            showPreviewLines();
        }
    } else {
        // make sure all previews are off
        Overlays.editOverlay(voxelPreview, { visible: false });
        Overlays.editOverlay(linePreviewTop, { visible: false });
        Overlays.editOverlay(linePreviewBottom, { visible: false });
        Overlays.editOverlay(linePreviewLeft, { visible: false });
        Overlays.editOverlay(linePreviewRight, { visible: false });
    }
}

function trackMouseEvent(event) {
    if (!trackAsOrbitOrPan) {
        trackLastMouseX = event.x;
        trackLastMouseY = event.y;
        trackAsDelete = event.isControl;
        trackAsRecolor = event.isShifted;
        trackAsEyedropper = event.isMeta;
        trackAsOrbitOrPan = event.isAlt; // TODO: double check this...??
        showPreviewGuides();
    }
}

function trackKeyPressEvent(event) {
    if (!editToolsOn) {
        return;
    }

    if (event.text == "CONTROL") {
        trackAsDelete = true;
        moveTools();
    }
    if (event.text == "SHIFT") {
        trackAsRecolor = true;
        moveTools();
    }
    if (event.text == "META") {
        trackAsEyedropper = true;
        moveTools();
    }
    if (event.text == "ALT") {
        trackAsOrbitOrPan = true;
        moveTools();
    }
    showPreviewGuides();
}

function trackKeyReleaseEvent(event) {
    // on TAB release, toggle our tool state
    if (event.text == "TAB") {
        editToolsOn = !editToolsOn;
        moveTools();
        Audio.playSound(clickSound, audioOptions);
    }

    if (editToolsOn) {
        if (event.text == "ESC") {
            pointerVoxelScaleSet = false;
        }
        if (event.text == "-") {
            thumbX -= thumbDeltaPerStep;
            calcScaleFromThumb(thumbX);
        }
        if (event.text == "+") {
            thumbX += thumbDeltaPerStep;
            calcScaleFromThumb(thumbX);
        }
        if (event.text == "CONTROL") {
            trackAsDelete = false;
            moveTools();
        }
        if (event.text == "SHIFT") {
            trackAsRecolor = false;
            moveTools();
        }
        if (event.text == "META") {
            trackAsEyedropper = false;
            moveTools();
        }
        if (event.text == "ALT") {
            trackAsOrbitOrPan = false;
            moveTools();
        }
        
        // on F1 toggle the preview mode between cubes and lines
        if (event.text == "F1") {
            previewAsVoxel = !previewAsVoxel;
        }

        showPreviewGuides();
    }    
}

function startOrbitMode(event) {
    mouseX = event.x;
    mouseY = event.y;
    var pickRay = Camera.computePickRay(event.x, event.y);
    var intersection = Voxels.findRayIntersection(pickRay);

    // start orbit camera! 
    var cameraPosition = Camera.getPosition();
    torsoToEyeVector = Vec3.subtract(cameraPosition, MyAvatar.position);
    torsoToEyeVector.x = 0.0;
    torsoToEyeVector.z = 0.0;
    oldMode = Camera.getMode();
    Camera.setMode("independent");
    Camera.keepLookingAt(intersection.intersection);
    // get position for initial azimuth, elevation
    orbitCenter = intersection.intersection; 
    var orbitVector = Vec3.subtract(cameraPosition, orbitCenter);
    orbitRadius = Vec3.length(orbitVector); 
    orbitAzimuth = Math.atan2(orbitVector.z, orbitVector.x);
    orbitAltitude = Math.asin(orbitVector.y / Vec3.length(orbitVector));
    
    //print("startOrbitMode...");
}

function handleOrbitingMove(event) {
    var cameraOrientation = Camera.getOrientation();
    var origEulers = Quat.safeEulerAngles(cameraOrientation);
    var newEulers = fixEulerAngles(Quat.safeEulerAngles(cameraOrientation));
    var dx = event.x - mouseX; 
    var dy = event.y - mouseY;
    orbitAzimuth += dx / ORBIT_RATE_AZIMUTH;
    orbitAltitude += dy / ORBIT_RATE_ALTITUDE;
     var orbitVector = { x:(Math.cos(orbitAltitude) * Math.cos(orbitAzimuth)) * orbitRadius, 
                        y:Math.sin(orbitAltitude) * orbitRadius,
                        z:(Math.cos(orbitAltitude) * Math.sin(orbitAzimuth)) * orbitRadius }; 
    orbitPosition = Vec3.sum(orbitCenter, orbitVector);
    Camera.setPosition(orbitPosition);

    mouseX = event.x; 
    mouseY = event.y;
    //print("handleOrbitingMove...");
}

function endOrbitMode(event) {
    var cameraOrientation = Camera.getOrientation();
    MyAvatar.position = Vec3.subtract(Camera.getPosition(), torsoToEyeVector);
    MyAvatar.headOrientation = cameraOrientation;
    Camera.stopLooking();
    Camera.setMode(oldMode);
    Camera.setOrientation(cameraOrientation);
    //print("endOrbitMode...");
}

function startPanMode(event, intersection) {
    // start pan camera! 
    print("handle PAN mode!!!");
}

function handlePanMove(event) {
    print("PANNING mode!!! ");
    //print("isPanning="+isPanning + " inPanningFromTouch="+isPanningFromTouch + " trackAsOrbitOrPan="+trackAsOrbitOrPan);
}

function endPanMode(event) {
    print("ending PAN mode!!!");
}


function mousePressEvent(event) {

    // if our tools are off, then don't do anything
    if (!editToolsOn) {
        return; 
    }
    
    // Normally, if we're panning or orbiting from touch, ignore these... because our touch takes precedence. 
    // but In the case of a button="RIGHT" click, we may get some touch messages first, and we actually want to 
    // cancel any touch mode, and then let the right-click through
    if (isOrbitingFromTouch || isPanningFromTouch) {
    
        // if the user is holding the ALT key AND they are clicking the RIGHT button (or on multi-touch doing a two
        // finger touch, then we want to let the new panning behavior take over.
        // if it's any other case we still want to bail
        if (event.button == "RIGHT" && trackAsOrbitOrPan) {
            // cancel our current multitouch operation...
            if (isOrbitingFromTouch) {
                endOrbitMode(event);
                isOrbitingFromTouch = false;
            }
            if (isPanningFromTouch) {
                //print("mousePressEvent... calling endPanMode()");
                endPanMode(event);
                isPanningFromTouch = false;
            }
            // let things fall through
        } else {
            return; 
        }
    }
    
    // no clicking on overlays while in panning mode
    if (!trackAsOrbitOrPan) {
        var clickedOnSomething = false;
        var clickedOverlay = Overlays.getOverlayAtPoint({x: event.x, y: event.y});
      

        // If the user clicked on the thumb, handle the slider logic
        if (clickedOverlay == thumb) {
            isMovingSlider = true;
            thumbClickOffsetX = event.x - (sliderX + thumbX); // this should be the position of the mouse relative to the thumb
            clickedOnSomething = true;

            Overlays.editOverlay(thumb, { imageURL: toolIconUrl + "voxel-size-slider-handle.svg", });

        } else if (clickedOverlay == voxelTool) {
            voxelToolSelected = true;
            recolorToolSelected = false;
            eyedropperToolSelected = false;
            moveTools();
            clickedOnSomething = true;
        } else if (clickedOverlay == recolorTool) {
            voxelToolSelected = false;
            recolorToolSelected = true;
            eyedropperToolSelected = false;
            moveTools();
            clickedOnSomething = true;
        } else if (clickedOverlay == eyedropperTool) {
            voxelToolSelected = false;
            recolorToolSelected = false;
            eyedropperToolSelected = true;
            moveTools();
            clickedOnSomething = true;
        } else if (clickedOverlay == slider) {

            if (event.x < sliderX + minThumbX) {
                thumbX -= thumbDeltaPerStep;
                calcScaleFromThumb(thumbX);
            }

            if (event.x > sliderX + maxThumbX) {
                thumbX += thumbDeltaPerStep;
                calcScaleFromThumb(thumbX);
            }

            moveTools();
            clickedOnSomething = true;
        } else {
            // if the user clicked on one of the color swatches, update the selectedSwatch
            for (s = 0; s < numColors; s++) {
                if (clickedOverlay == swatches[s]) {
                    whichColor = s;
                    moveTools();
                    clickedOnSomething = true;
                    break;
                }
            }
        }
        if (clickedOnSomething) {
            return; // no further processing
        }
    }
    
    // TODO: does any of this stuff need to execute if we're panning or orbiting?
    trackMouseEvent(event); // used by preview support
    mouseX = event.x;
    mouseY = event.y;
    var pickRay = Camera.computePickRay(event.x, event.y);
    var intersection = Voxels.findRayIntersection(pickRay);
    audioOptions.position = Vec3.sum(pickRay.origin, pickRay.direction);
    if (intersection.intersects) {
        // if the user hasn't updated the 
        if (!pointerVoxelScaleSet) {
            calcThumbFromScale(intersection.voxel.s);
        }
        
        // Note: touch and mouse events can cross paths, so we want to ignore any mouse events that would
        // start a pan or orbit if we're already doing a pan or orbit via touch...
        if ((event.isAlt || trackAsOrbitOrPan) && !(isOrbitingFromTouch || isPanningFromTouch)) {
            if (event.isLeftButton && !event.isRightButton) {
                startOrbitMode(event);
                isOrbiting = true;
            } else if (event.isRightButton && !event.isLeftButton) {
                startPanMode(event);
                isPanning = true;
            }
        } else if (trackAsDelete || event.isRightButton && !trackAsEyedropper) {
            //  Delete voxel
            voxelDetails = calculateVoxelFromIntersection(intersection,"delete");
            Voxels.eraseVoxel(voxelDetails.x, voxelDetails.y, voxelDetails.z, voxelDetails.s);
            Audio.playSound(deleteSound, audioOptions);
            Overlays.editOverlay(voxelPreview, { visible: false });
        } else if (eyedropperToolSelected || trackAsEyedropper) {
            if (whichColor != -1) {
                colors[whichColor].red = intersection.voxel.red;
                colors[whichColor].green = intersection.voxel.green;
                colors[whichColor].blue = intersection.voxel.blue;
                moveTools();
            }
            
        } else if (recolorToolSelected || trackAsRecolor) {
            //  Recolor Voxel
            voxelDetails = calculateVoxelFromIntersection(intersection,"recolor");

            // doing this erase then set will make sure we only recolor just the target voxel
            Voxels.eraseVoxel(voxelDetails.x, voxelDetails.y, voxelDetails.z, voxelDetails.s);
            Voxels.setVoxel(voxelDetails.x, voxelDetails.y, voxelDetails.z, voxelDetails.s, 
                            colors[whichColor].red, colors[whichColor].green, colors[whichColor].blue);
            Audio.playSound(changeColorSound, audioOptions);
            Overlays.editOverlay(voxelPreview, { visible: false });
        } else if (voxelToolSelected) {
            //  Add voxel on face
            if (whichColor == -1) {
                //  Copy mode - use clicked voxel color
                newColor = {    
                    red: intersection.voxel.red,
                    green: intersection.voxel.green,
                    blue: intersection.voxel.blue };
            } else {
                newColor = {    
                    red: colors[whichColor].red,
                    green: colors[whichColor].green,
                    blue: colors[whichColor].blue };
            }
                    
            voxelDetails = calculateVoxelFromIntersection(intersection,"add");
            Voxels.eraseVoxel(voxelDetails.x, voxelDetails.y, voxelDetails.z, voxelDetails.s);
            Voxels.setVoxel(voxelDetails.x, voxelDetails.y, voxelDetails.z, voxelDetails.s,
                newColor.red, newColor.green, newColor.blue);
            lastVoxelPosition = { x: voxelDetails.x, y: voxelDetails.y, z: voxelDetails.z };
            lastVoxelColor = { red: newColor.red, green: newColor.green, blue: newColor.blue };
            lastVoxelScale = voxelDetails.s;

            playRandomAddSound(audioOptions);
            
            Overlays.editOverlay(voxelPreview, { visible: false });
            dragStart = { x: event.x, y: event.y };
            isAdding = true;
        } 
    }
}

function keyPressEvent(event) {
    // if our tools are off, then don't do anything
    if (editToolsOn) {
        var nVal = parseInt(event.text);
        if (event.text == "`") {
            print("Color = Copy");
            whichColor = -1;
            Audio.playSound(clickSound, audioOptions);
            moveTools();
        } else if ((nVal > 0) && (nVal <= numColors)) {
            whichColor = nVal - 1;
            print("Color = " + (whichColor + 1));
            Audio.playSound(clickSound, audioOptions);
            moveTools();
        } else if (event.text == "0") {
            // Create a brand new 1 meter voxel in front of your avatar 
            var color = whichColor; 
            if (color == -1) color = 0;
            var newPosition = getNewVoxelPosition();
            var newVoxel = {    
                        x: newPosition.x,
                        y: newPosition.y ,
                        z: newPosition.z,    
                        s: NEW_VOXEL_SIZE,
                        red: colors[color].red,
                        green: colors[color].green,
                        blue: colors[color].blue };
            Voxels.eraseVoxel(voxelDetails.x, voxelDetails.y, voxelDetails.z, voxelDetails.s);
            Voxels.setVoxel(newVoxel.x, newVoxel.y, newVoxel.z, newVoxel.s, newVoxel.red, newVoxel.green, newVoxel.blue);
            setAudioPosition();
            playRandomAddSound(audioOptions);
        }
    }
    
    // do this even if not in edit tools
    if (event.text == " ") {
        //  Reset my orientation!
        var orientation = { x:0, y:0, z:0, w:1 };
        Camera.setOrientation(orientation);
        MyAvatar.orientation = orientation;
    }
    trackKeyPressEvent(event); // used by preview support
}

function keyReleaseEvent(event) {
    trackKeyReleaseEvent(event); // used by preview support
}

function setupMenus() {
    // hook up menus
    Menu.menuItemEvent.connect(menuItemEvent);

    // delete the standard application menu item
    Menu.addSeparator("Edit", "Voxels");
    Menu.addMenuItem({ menuName: "Edit", menuItemName: "Cut", shortcutKey: "CTRL+X", afterItem: "Voxels" });
    Menu.addMenuItem({ menuName: "Edit", menuItemName: "Copy", shortcutKey: "CTRL+C", afterItem: "Cut" });
    Menu.addMenuItem({ menuName: "Edit", menuItemName: "Paste", shortcutKey: "CTRL+V", afterItem: "Copy" });
    Menu.addMenuItem({ menuName: "Edit", menuItemName: "Nudge", shortcutKey: "CTRL+N", afterItem: "Paste" });
    Menu.addMenuItem({ menuName: "Edit", menuItemName: "Delete", shortcutKeyEvent: { text: "backspace" }, afterItem: "Nudge" });

    Menu.addSeparator("File", "Voxels");
    Menu.addMenuItem({ menuName: "File", menuItemName: "Export Voxels", shortcutKey: "CTRL+E", afterItem: "Voxels" });
    Menu.addMenuItem({ menuName: "File", menuItemName: "Import Voxels", shortcutKey: "CTRL+I", afterItem: "Export Voxels" });
}

function menuItemEvent(menuItem) {

    // handle clipboard items
    if (selectToolSelected) {
        var pickRay = Camera.computePickRay(trackLastMouseX, trackLastMouseY);
        var intersection = Voxels.findRayIntersection(pickRay);
        selectedVoxel = calculateVoxelFromIntersection(intersection,"select");
        if (menuItem == "Copy") {
            print("copying...");
            Clipboard.copyVoxel(selectedVoxel.x, selectedVoxel.y, selectedVoxel.z, selectedVoxel.s);
        }
        if (menuItem == "Cut") {
            print("cutting...");
            Clipboard.cutVoxel(selectedVoxel.x, selectedVoxel.y, selectedVoxel.z, selectedVoxel.s);
        }
        if (menuItem == "Paste") {
            print("pasting...");
            Clipboard.pasteVoxel(selectedVoxel.x, selectedVoxel.y, selectedVoxel.z, selectedVoxel.s);
        }
        if (menuItem == "Delete") {
            print("deleting...");
            Clipboard.deleteVoxel(selectedVoxel.x, selectedVoxel.y, selectedVoxel.z, selectedVoxel.s);
        }
    
        if (menuItem == "Export Voxels") {
            print("export");
            Clipboard.exportVoxel(selectedVoxel.x, selectedVoxel.y, selectedVoxel.z, selectedVoxel.s);
        }
        if (menuItem == "Import Voxels") {
            print("import");
            Clipboard.importVoxels();
        }
        if (menuItem == "Nudge") {
            print("nudge");
            Clipboard.nudgeVoxel(selectedVoxel.x, selectedVoxel.y, selectedVoxel.z, selectedVoxel.s, { x: -1, y: 0, z: 0 });
        }
    }
}

function mouseMoveEvent(event) {
    if (!editToolsOn) {
        return;
    }

    // if we're panning or orbiting from touch, ignore these... because our touch takes precedence. 
    if (isOrbitingFromTouch || isPanningFromTouch) {
        return; 
    }
    
    // double check that we didn't accidentally miss a pan or orbit click request
    if (trackAsOrbitOrPan && !isPanning && !isOrbiting) {
        if (event.isLeftButton && !event.isRightButton) {
            startOrbitMode(event);
            isOrbiting = true;
        }
        if (!event.isLeftButton && event.isRightButton) {
            startPanMode(event);
            isPanning = true;
        }
    }

    if (!trackAsOrbitOrPan && isMovingSlider) {
        thumbX = (event.x - thumbClickOffsetX) - sliderX;
        if (thumbX < minThumbX) {
            thumbX = minThumbX;
        }
        if (thumbX > maxThumbX) {
            thumbX = maxThumbX;
        }
        calcScaleFromThumb(thumbX);
        
    } else if (isOrbiting) {
        handleOrbitingMove(event);
    } else if (isPanning) {
        handlePanMove(event);
    } else if (!trackAsOrbitOrPan && isAdding) {
        //  Watch the drag direction to tell which way to 'extrude' this voxel
        if (!isExtruding) {
            var pickRay = Camera.computePickRay(event.x, event.y);
            var lastVoxelDistance = { x: pickRay.origin.x - lastVoxelPosition.x, 
                                    y: pickRay.origin.y - lastVoxelPosition.y, 
                                    z: pickRay.origin.z - lastVoxelPosition.z };
            var distance = Vec3.length(lastVoxelDistance);
            var mouseSpot = { x: pickRay.direction.x * distance, y: pickRay.direction.y * distance, z: pickRay.direction.z * distance };
            mouseSpot.x += pickRay.origin.x;
            mouseSpot.y += pickRay.origin.y;
            mouseSpot.z += pickRay.origin.z;
            var dx = mouseSpot.x - lastVoxelPosition.x;
            var dy = mouseSpot.y - lastVoxelPosition.y;
            var dz = mouseSpot.z - lastVoxelPosition.z;
            extrudeScale = lastVoxelScale;
            extrudeDirection = { x: 0, y: 0, z: 0 };
            isExtruding = true;
            if (dx > lastVoxelScale) extrudeDirection.x = extrudeScale;
            else if (dx < -lastVoxelScale) extrudeDirection.x = -extrudeScale;
            else if (dy > lastVoxelScale) extrudeDirection.y = extrudeScale;
            else if (dy < -lastVoxelScale) extrudeDirection.y = -extrudeScale;
            else if (dz > lastVoxelScale) extrudeDirection.z = extrudeScale;
            else if (dz < -lastVoxelScale) extrudeDirection.z = -extrudeScale;
            else isExtruding = false; 
        } else {
            //  We have got an extrusion direction, now look for mouse move beyond threshold to add new voxel
            var dx = event.x - mouseX; 
            var dy = event.y - mouseY;
            if (Math.sqrt(dx*dx + dy*dy) > PIXELS_PER_EXTRUDE_VOXEL)  {
                lastVoxelPosition = Vec3.sum(lastVoxelPosition, extrudeDirection);
                Voxels.eraseVoxel(voxelDetails.x, voxelDetails.y, voxelDetails.z, voxelDetails.s);
                Voxels.setVoxel(lastVoxelPosition.x, lastVoxelPosition.y, lastVoxelPosition.z, 
                            extrudeScale, lastVoxelColor.red, lastVoxelColor.green, lastVoxelColor.blue);
                mouseX = event.x;
                mouseY = event.y;
            }
        }
    }
    
    // update the add voxel/delete voxel overlay preview
    trackMouseEvent(event);
}

function mouseReleaseEvent(event) {
    // if our tools are off, then don't do anything
    if (!editToolsOn) {
        return; 
    }

    if (isMovingSlider) {
        isMovingSlider = false;
    }
    
    if (isOrbiting) {
        endOrbitMode(event);
        isOrbiting = false;
    }
    if (isPanning) {
        print("mouseReleaseEvent... calling endPanMode()");
        endPanMode(event);
        isPanning = false;
    }
    isAdding = false;
    isExtruding = false; 
}

function moveTools() {
    // move the swatches
    swatchesX = (windowDimensions.x - (swatchesWidth + sliderWidth)) / 2;
    swatchesY = windowDimensions.y - swatchHeight + 1;

    // create the overlays, position them in a row, set their colors, and for the selected one, use a different source image
    // location so that it displays the "selected" marker
    for (s = 0; s < numColors; s++) {
	    var extraWidth = 0;

	    if (s == 0) {
	        extraWidth = swatchExtraPadding;
	    }

	    var imageFromX = swatchExtraPadding - extraWidth + s * swatchWidth;
	    var imageFromY = swatchHeight + 1;
	    if (s == whichColor) {
	        imageFromY = 0;
	    }

	    var swatchX = swatchExtraPadding - extraWidth + swatchesX + ((swatchWidth - 1) * s);

	    if (s == (numColors - 1)) {
	        extraWidth = swatchExtraPadding;
	    }
		
        Overlays.editOverlay(swatches[s], {
                        x: swatchX,
                        y: swatchesY,
                        subImage: { x: imageFromX, y: imageFromY, width: swatchWidth + extraWidth, height: swatchHeight },
                        color: colors[s],
                        alpha: 1,
                        visible: editToolsOn
                    });
    }

    // move the tools
    toolsY = (windowDimensions.y - toolsHeight) / 2;

    var voxelToolOffset = 1,
        recolorToolOffset = 1,
        eyedropperToolOffset = 1;

    if (trackAsRecolor || recolorToolSelected) {
        recolorToolOffset = 2;
    } else if (trackAsEyedropper || eyedropperToolSelected) {
        eyedropperToolOffset = 2;
    } else if (trackAsOrbitOrPan) {
        // nothing gets selected in this case...
    } else {
        voxelToolOffset = 2;
    }

    Overlays.editOverlay(voxelTool, {
                    subImage: { x: 0, y: toolHeight * voxelToolOffset, width: toolWidth, height: toolHeight },
                    x: toolsX, y: toolsY + ((toolHeight + toolVerticalSpacing) * voxelToolAt), width: toolWidth, height: toolHeight,
                    visible: editToolsOn
                });

    Overlays.editOverlay(recolorTool, {
                    subImage: { x: 0, y: toolHeight * recolorToolOffset, width: toolWidth, height: toolHeight },
                    x: toolsX, y: toolsY + ((toolHeight + toolVerticalSpacing) * recolorToolAt), width: toolWidth, height: toolHeight,
                    visible: editToolsOn
                });

    Overlays.editOverlay(eyedropperTool, {
                    subImage: { x: 0, y: toolHeight * eyedropperToolOffset, width: toolWidth, height: toolHeight },
                    x: toolsX, y: toolsY + ((toolHeight + toolVerticalSpacing) * eyedropperToolAt), width: toolWidth, height: toolHeight,
                    visible: editToolsOn
                });

    sliderX = swatchesX + swatchesWidth - 17;
    sliderY = windowDimensions.y - sliderHeight + 1;
    thumbY = sliderY + 11;
    Overlays.editOverlay(slider, { x: sliderX, y: sliderY, visible: editToolsOn });

    // This is the thumb of our slider
    Overlays.editOverlay(thumb, { x: sliderX + thumbX, y: thumbY, visible: editToolsOn });

}

function touchBeginEvent(event) {
    if (!editToolsOn) {
        return;
    }
    
    // if we're already in the middle of orbiting or panning, then ignore these multi-touch events...
    if (isOrbiting || isPanning) {
        return;
    }    
    
    if (event.isAlt || trackAsOrbitOrPan) {
        if (event.touchPoints == touchPointsToOrbit) {
            // we need to double check that we didn't start an orbit, because the touch events will sometimes
            // come in as 2 then 3 touches... 
            if (isPanningFromTouch) {
                print("touchBeginEvent... calling endPanMode()");
                endPanMode(event);
                isPanningFromTouch = false;
            }
            startOrbitMode(event);
            isOrbitingFromTouch = true;
        } else if (event.touchPoints == touchPointsToPan) {
            // we need to double check that we didn't start an orbit, because the touch events will sometimes
            // come in as 2 then 3 touches... 
            if (isOrbitingFromTouch) {
                endOrbitMode(event);
                isOrbitingFromTouch = false;
            }
            startPanMode(event);
            isPanningFromTouch = true;
        }
    }
}

function touchUpdateEvent(event) {
    if (!editToolsOn) {
        return;
    }

    // if we're already in the middle of orbiting or panning, then ignore these multi-touch events...
    if (isOrbiting || isPanning) {
        return;
    }    
    
    if (isOrbitingFromTouch) {
        // we need to double check that we didn't start an orbit, because the touch events will sometimes
        // come in as 2 then 3 touches... 
        if (event.touchPoints == touchPointsToPan) {
            //print("we now have touchPointsToPan touches... switch to pan...");
            endOrbitMode(event);
            isOrbitingFromTouch = false;
            startPanMode(event);
            isPanningFromTouch = true;
        } else {
            handleOrbitingMove(event);
        }
    }
    if (isPanningFromTouch) {
        //print("touchUpdateEvent... isPanningFromTouch... event.touchPoints=" + event.touchPoints);
        // we need to double check that we didn't start an orbit, because the touch events will sometimes
        // come in as 2 then 3 touches... 
        if (event.touchPoints == touchPointsToOrbit) {
            //print("we now have touchPointsToOrbit touches... switch to orbit...");
            //print("touchUpdateEvent... calling endPanMode()");
            endPanMode(event);
            isPanningFromTouch = false;
            startOrbitMode(event);
            isOrbitingFromTouch = true;
            handleOrbitingMove(event);
        } else {
            handlePanMove(event);
        }
    }
}

function touchEndEvent(event) {
    if (!editToolsOn) {
        return;
    }

    // if we're already in the middle of orbiting or panning, then ignore these multi-touch events...
    if (isOrbiting || isPanning) {
        return;
    }    
    
    if (isOrbitingFromTouch) {
        endOrbitMode(event);
        isOrbitingFromTouch = false;
    }
    if (isPanningFromTouch) {
        print("touchEndEvent... calling endPanMode()");
        endPanMode(event);
        isPanningFromTouch = false;
    }
}

function update() {
    var newWindowDimensions = Controller.getViewportDimensions();
    if (newWindowDimensions.x != windowDimensions.x || newWindowDimensions.y != windowDimensions.y) {
        windowDimensions = newWindowDimensions;
        moveTools();
    }
}

function wheelEvent(event) {
    wheelPixelsMoved += event.delta;
    if (Math.abs(wheelPixelsMoved) > WHEEL_PIXELS_PER_SCALE_CHANGE)
    {
        if (!pointerVoxelScaleSet) {
            pointerVoxelScale = 1.0;
            pointerVoxelScaleSet = true;
        }
        if (wheelPixelsMoved > 0) {
            pointerVoxelScale /= 2.0;
            if (pointerVoxelScale < MIN_VOXEL_SCALE) {
                pointerVoxelScale = MIN_VOXEL_SCALE;
            }  
        } else {
            pointerVoxelScale *= 2.0;
            if (pointerVoxelScale > MAX_VOXEL_SCALE) {
                pointerVoxelScale = MAX_VOXEL_SCALE;
            }
        }
        calcThumbFromScale(pointerVoxelScale);
        trackMouseEvent(event);
        wheelPixelsMoved = 0;
    }
}

Controller.wheelEvent.connect(wheelEvent);
Controller.mousePressEvent.connect(mousePressEvent);
Controller.mouseReleaseEvent.connect(mouseReleaseEvent);
Controller.mouseMoveEvent.connect(mouseMoveEvent);
Controller.keyPressEvent.connect(keyPressEvent);
Controller.keyReleaseEvent.connect(keyReleaseEvent);
Controller.touchBeginEvent.connect(touchBeginEvent);
Controller.touchUpdateEvent.connect(touchUpdateEvent);
Controller.touchEndEvent.connect(touchEndEvent);
Controller.captureKeyEvents({ text: "+" });
Controller.captureKeyEvents({ text: "-" });


function scriptEnding() {
    Overlays.deleteOverlay(voxelPreview);
    Overlays.deleteOverlay(linePreviewTop);
    Overlays.deleteOverlay(linePreviewBottom);
    Overlays.deleteOverlay(linePreviewLeft);
    Overlays.deleteOverlay(linePreviewRight);
    for (s = 0; s < numColors; s++) {
        Overlays.deleteOverlay(swatches[s]);
    }
    Overlays.deleteOverlay(voxelTool);
    Overlays.deleteOverlay(recolorTool);
    Overlays.deleteOverlay(eyedropperTool);
    Overlays.deleteOverlay(slider);
    Overlays.deleteOverlay(thumb);
    Controller.releaseKeyEvents({ text: "+" });
    Controller.releaseKeyEvents({ text: "-" });
}
Script.scriptEnding.connect(scriptEnding);

Script.willSendVisualDataCallback.connect(update);

setupMenus();
