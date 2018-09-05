import QtQuick 2.7
import QtQuick.Controls 2.3

// FIXME pretty non-DRY code, should figure out a way to optionally hide one tab from the tab view, keep in sync with Edit.qml
StackView {
    id: sceneView
    objectName: "stack"

    signal sendToScript(var message);

    topPadding: 40
    leftPadding: 0
    rightPadding: 0
    bottomPadding: 0

    anchors.fill: parent

    property var itemProperties: {"y": sceneView.topPadding,
                                  "width": sceneView.availableWidth,
                                  "height": sceneView.availableHeight }
    Component.onCompleted: {
        tab.currentIndex = 0

        console.log("**** CROY **** eventBridge:" + eventBridge)
        if (eventBridge) {
            eventBridge.scriptEventReceived.connect(eventReceived);
        }
    }

    background: Rectangle {
        color: "#404040" //default background color
        SceneTabView {
            id: tab
            anchors.fill: parent
            currentIndex: -1
            onCurrentIndexChanged: {
                sceneView.replace(null, tab.itemAt(currentIndex).visualItem,
                                 itemProperties,
                                 StackView.Immediate)
            }
        }
    }

    function pushSource(path) {
        sceneView.push(Qt.resolvedUrl("../../" + path), itemProperties,
                      StackView.Immediate);
        sceneView.currentItem.sendToScript.connect(editRoot.sendToScript);
    }

    function popSource() {
        sceneView.pop(StackView.Immediate);
    }

    // Passes script messages to the item on the top of the stack
    function fromScript(message) {

        var currentItem = sceneGraph.currentItem;
        if (currentItem && currentItem.fromScript) {
            currentItem.fromScript(message);
        } else if (tab.fromScript) {
            tab.fromScript(message);
        }
    }

    function eventReceived(data) {
        console.log("**** CROY **** SceneView.qml eventReceived type:" + JSON.stringify(data));
        if (data.type == "update") {
            // console.log("**** CROY **** EditTools.qml eventReceived data:" + JSON.stringify(data));
        }
    }
}
