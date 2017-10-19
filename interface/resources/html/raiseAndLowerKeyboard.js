//
//  Created by Anthony Thibault on 2016-09-02
//  Copyright 2016 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
//  Sends messages over the EventBridge when text input is required.
//
(function () {
    var POLL_FREQUENCY = 500; // ms
    var MAX_WARNINGS = 3;
    var numWarnings = 0;
    var isWindowFocused = true;
    var isKeyboardRaised = false;
    var isNumericKeyboard = false;

    function shouldRaiseKeyboard() {
        var nodeName = document.activeElement.nodeName;
        var nodeType = document.activeElement.type;
        if (nodeName === "INPUT" && ["email", "number", "password", "tel", "text", "url", "search"].indexOf(nodeType) !== -1
            || document.activeElement.nodeName === "TEXTAREA") {
            return true;
        } else {
            // check for contenteditable attribute
            for (var i = 0; i < document.activeElement.attributes.length; i++) {
                if (document.activeElement.attributes[i].name === "contenteditable" &&
                    document.activeElement.attributes[i].value === "true") {
                    return true;
                }
            }
            return false;
        }
    };

    function shouldSetNumeric() {
        return document.activeElement.type === "number";
    };

    function scheduleBringToView(timeout) {

        var timer = setTimeout(function () {
            clearTimeout(timer);

            var elementRect = document.activeElement.getBoundingClientRect();
            var absoluteElementTop = elementRect.top + window.scrollY;
            var middle = absoluteElementTop - (window.innerHeight / 2);

            window.scrollTo(0, middle);
        }, timeout);
    }

    setInterval(function () {
        var keyboardRaised = shouldRaiseKeyboard();
        var numericKeyboard = shouldSetNumeric();

        if (isWindowFocused && (keyboardRaised !== isKeyboardRaised || numericKeyboard !== isNumericKeyboard)) {

            if (typeof EventBridge !== "undefined" && EventBridge !== null) {
                EventBridge.emitWebEvent(
                    keyboardRaised ? ("_RAISE_KEYBOARD" + (numericKeyboard ? "_NUMERIC" : "")) : "_LOWER_KEYBOARD"
                );
            } else {
                if (numWarnings < MAX_WARNINGS) {
                    console.log("WARNING: No global EventBridge object found");
                    numWarnings++;
                }
            }

            if (!isKeyboardRaised) {
                scheduleBringToView(250); // Allow time for keyboard to be raised in QML.
                                          // 2DO: should it be rather done from 'client area height changed' event?
            }

            isKeyboardRaised = keyboardRaised;
            isNumericKeyboard = numericKeyboard;
        }
    }, POLL_FREQUENCY);

    window.addEventListener("click", function () {
        var keyboardRaised = shouldRaiseKeyboard();
        if(keyboardRaised && isKeyboardRaised) {
            scheduleBringToView(150);
        }
    });

    window.addEventListener("focus", function () {
        isWindowFocused = true;
    });

    window.addEventListener("blur", function () {
        isWindowFocused = false;
        isKeyboardRaised = false;
        isNumericKeyboard = false;
    });
})();
