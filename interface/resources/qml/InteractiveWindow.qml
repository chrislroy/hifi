//
//  InteractiveWindow.qml
//
//  Created by Thijs Wenker on 2018-06-25
//  Copyright 2018 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

import QtQuick 2.3

import "windows" as Windows
import "controls"
import "controls-uit" as Controls
import "styles"
import "styles-uit"

Windows.Window {
    id: root;
    HifiConstants { id: hifi }
    title: "InteractiveWindow";
    resizable: true;
    // Virtual window visibility
    shown: false;
    focus: true;
    property var channel;
    // Don't destroy on close... otherwise the JS/C++ will have a dangling pointer
    destroyOnCloseButton: false;

    signal selfDestruct();

    property var flags: 0;

    property var source;
    property var dynamicContent;
    property var nativeWindow;

    // custom visibility flag for interactiveWindow to proxy virtualWindow.shown / nativeWindow.visible
    property var interactiveWindowVisible: true;
    property point interactiveWindowPosition;

    property size interactiveWindowSize;

    // Keyboard control properties in case needed by QML content.
    property bool keyboardEnabled: false;
    property bool keyboardRaised: false;
    property bool punctuationMode: false;

    property int presentationMode: 0;

    property var initialized: false;

    // for app minimized
    property var applicationMinimized: false;
    property var windowMinimized: false;
    property var appHasFocus: true;

    onSourceChanged: {
        if (dynamicContent) {
            dynamicContent.destroy();
            dynamicContent = null; 
        }
        QmlSurface.load(source, contentHolder, function(newObject) {
            dynamicContent = newObject;
            if (dynamicContent && dynamicContent.anchors) {
                dynamicContent.anchors.fill = contentHolder;
            }
        });
    }

    function updateInteractiveWindowPositionForMode() {
        if (presentationMode === Desktop.PresentationMode.VIRTUAL) {
            x = interactiveWindowPosition.x;
            y = interactiveWindowPosition.y;
        } else if (presentationMode === Desktop.PresentationMode.NATIVE && nativeWindow) {
            if (interactiveWindowPosition.x === 0 && interactiveWindowPosition.y === 0) {
                // default position for native window in center of main application window
                nativeWindow.x = Math.floor(Window.x + (Window.innerWidth / 2) - (interactiveWindowSize.width / 2));
                nativeWindow.y = Math.floor(Window.y + (Window.innerHeight / 2) - (interactiveWindowSize.height / 2));
            } else {
                nativeWindow.x = interactiveWindowPosition.x;
                nativeWindow.y = interactiveWindowPosition.y;
            }
        }
    }

    function updateInteractiveWindowSizeForMode() {
        if (presentationMode === Desktop.PresentationMode.VIRTUAL) {
            width = interactiveWindowSize.width;
            height = interactiveWindowSize.height;
        } else if (presentationMode === Desktop.PresentationMode.NATIVE && nativeWindow) {
            nativeWindow.width = interactiveWindowSize.width;
            nativeWindow.height = interactiveWindowSize.height;
        }
    }

    function updateContentParent() {
        if (presentationMode === Desktop.PresentationMode.VIRTUAL) {
            contentHolder.parent = root;
        } else if (presentationMode === Desktop.PresentationMode.NATIVE && nativeWindow) {
            contentHolder.parent = nativeWindow.contentItem;
        }
    }

    function setupPresentationMode() {
        if (presentationMode === Desktop.PresentationMode.VIRTUAL) {
            if (nativeWindow) {
                nativeWindow.setVisible(false);
            }
            updateContentParent();
            updateInteractiveWindowPositionForMode();
            shown = interactiveWindowVisible;
        } else if (presentationMode === Desktop.PresentationMode.NATIVE) {
            shown = false;
            if (nativeWindow) {
                updateContentParent();
                updateInteractiveWindowPositionForMode();
                nativeWindow.setVisible(interactiveWindowVisible);
            }
        } else if (presentationMode === modeNotSet) {
            console.error("presentationMode should be set.");
        }
    }
    
    Component.onCompleted: {
        // Fix for parent loss on OSX:
        parent.heightChanged.connect(updateContentParent);
        parent.widthChanged.connect(updateContentParent);

        x = interactiveWindowPosition.x;
        y = interactiveWindowPosition.y;
        width = interactiveWindowSize.width;
        height = interactiveWindowSize.height;

        // console.log("**** CROY **** interactiveWindow.qml - calling Qt.createQmlObject.");

        nativeWindow = Qt.createQmlObject('
            import QtQuick 2.3;
            import QtQuick.Window 2.3;

            Window {
                id: root;
                Rectangle {
                    color: hifi.colors.baseGray
                    anchors.fill: parent
                }
            }', root, 'InteractiveWindow.qml->nativeWindow');

        nativeWindow.title = root.title;
        var nativeWindowFlags = Qt.Window |
            Qt.WindowTitleHint |
            Qt.WindowSystemMenuHint |
            Qt.WindowCloseButtonHint |
            Qt.WindowMaximizeButtonHint |
            Qt.WindowMinimizeButtonHint;
        if ((flags & Desktop.ALWAYS_ON_TOP) === Desktop.ALWAYS_ON_TOP) {
            nativeWindowFlags |= Qt.WindowStaysOnTopHint;
        }

        nativeWindow.flags = nativeWindowFlags;

        nativeWindow.x = interactiveWindowPosition.x;
        nativeWindow.y = interactiveWindowPosition.y;

        nativeWindow.width = interactiveWindowSize.width;
        nativeWindow.height = interactiveWindowSize.height;

        nativeWindow.xChanged.connect(function() {
            if (presentationMode === Desktop.PresentationMode.NATIVE && nativeWindow.visible) {
                interactiveWindowPosition = Qt.point(nativeWindow.x, interactiveWindowPosition.y);
            }
        });
        nativeWindow.yChanged.connect(function() {
            if (presentationMode === Desktop.PresentationMode.NATIVE && nativeWindow.visible) {
                interactiveWindowPosition = Qt.point(interactiveWindowPosition.x, nativeWindow.y);
            }
        });

        nativeWindow.widthChanged.connect(function() {
            if (presentationMode === Desktop.PresentationMode.NATIVE && nativeWindow.visible) {
                interactiveWindowSize = Qt.size(nativeWindow.width, interactiveWindowSize.height);
            }
        });
        nativeWindow.heightChanged.connect(function() {
            if (presentationMode === Desktop.PresentationMode.NATIVE && nativeWindow.visible) {
                interactiveWindowSize = Qt.size(interactiveWindowSize.width, nativeWindow.height);
            }
        });

        // console.log('**** CROY **** interactveWindow.qml - creating window');

        // parent of native window state changed
        
        nativeWindow.windowStateChanged.connect(function(state) {
            // Qt::WindowNoState - 0 - normal
            // Qt::WindowMinimized - 1 - minimized
            if (!applicationMinimized) {
                windowMinimized = state;
                // console.log('**** CROY **** interactveWindow.qml - interactveWindow state changed', windowMinimized);
            }
        })
        

        nativeWindow.closing.connect(function(closeEvent) {
            closeEvent.accepted = false;
            windowClosed();
        });

        // finally set the initial window mode:
        setupPresentationMode();

        initialized = true;
    }

    Component.onDestruction: {
        parent.heightChanged.disconnect(updateContentParent);
        parent.widthChanged.disconnect(updateContentParent);
    }

    // Handle message traffic from the script that launched us to the loaded QML
    function fromScript(message) {
        if (root.dynamicContent && root.dynamicContent.fromScript) {
            root.dynamicContent.fromScript(message);
        }
    }

    function show() {
        interactiveWindowVisible = true;
        raiseWindow();
    }

    function raiseWindow() {
        // console.log("**** CROY **** - raisonWindow")
        if (presentationMode === Desktop.PresentationMode.VIRTUAL) {
            raise();
        } else if (presentationMode === Desktop.PresentationMode.NATIVE && nativeWindow) {
            nativeWindow.raise();
        }
    }
    
    // Handle message traffic from our loaded QML to the script that launched us
    signal sendToScript(var message);

    onDynamicContentChanged: {
        if (dynamicContent && dynamicContent.sendToScript) {
            dynamicContent.sendToScript.connect(sendToScript);
        }
    }

    onAppHasFocusChanged: {
        // console.log("**** CROY **** - onAppHasFocusChanged - appHasFocus:", appHasFocus);
        if (appHasFocus) {
            nativeWindow.flags = (nativeWindow.flags |= Qt.WindowStaysOnTopHint);
        }
        else {
            nativeWindow.flags = (nativeWindow.flags &= ~Qt.WindowStaysOnTopHint);
        }
        //if (interactiveWindowVisible)
        //    nativeWindow.showNormal();
    }

    onApplicationMinimizedChanged: {
        // console.log("**** CROY **** - onApplicationMinimizedChanged - applicationMinimized:", applicationMinimized);

        if (applicationMinimized) {
            nativeWindow.showMinimized();
        }
        else if (!windowMinimized) {
            if (presentationMode === Desktop.PresentationMode.VIRTUAL) {
                shown = interactiveWindowVisible;
            } else if (presentationMode === Desktop.PresentationMode.NATIVE && nativeWindow && interactiveWindowVisible) {
                nativeWindow.showNormal();
            }
        }
    }

    onInteractiveWindowVisibleChanged: {
        console.log("onInteractiveWindowVisibleChanged - interactiveWindowVisible:", interactiveWindowVisible);
        if (presentationMode === Desktop.PresentationMode.VIRTUAL) {
            shown = interactiveWindowVisible;
        } else if (presentationMode === Desktop.PresentationMode.NATIVE && nativeWindow) {
            if (!nativeWindow.visible && interactiveWindowVisible) {
                nativeWindow.showNormal();
            } else {
                nativeWindow.setVisible(interactiveWindowVisible);
            }
        }
    }

    onTitleChanged: {
        if (nativeWindow) {
            nativeWindow.title = title;
        }
    }

    onXChanged: {
        if (presentationMode === Desktop.PresentationMode.VIRTUAL) {
            interactiveWindowPosition = Qt.point(x, interactiveWindowPosition.y);
        }
    }

    onYChanged: {
        if (presentationMode === Desktop.PresentationMode.VIRTUAL) {
            interactiveWindowPosition = Qt.point(interactiveWindowPosition.x, y);
        }
    }

    onWidthChanged: {
        if (presentationMode === Desktop.PresentationMode.VIRTUAL) {
            interactiveWindowSize = Qt.size(width, interactiveWindowSize.height);
        }
    }

    onHeightChanged: {
        if (presentationMode === Desktop.PresentationMode.VIRTUAL) {
            interactiveWindowSize = Qt.size(interactiveWindowSize.width, height);
        }
    }

    onPresentationModeChanged: {
        if (initialized) {
            setupPresentationMode();
        }
    }

    onWindowClosed: {
        // set invisible on close, to make it not re-appear unintended after switching PresentationMode
        // console.log("**** CROY **** windowClosed")
        interactiveWindowVisible = false;

        if ((flags & Desktop.CLOSE_BUTTON_HIDES) !== Desktop.CLOSE_BUTTON_HIDES) {
            selfDestruct();
        }
    }

    Item {
        id: contentHolder
        anchors.fill: parent
    }
}
