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
        sceneTabView.currentIndex = 0
    }


    background: Rectangle {
        color: "#404040" //default background color
        SceneTabView {
            id: sceneTabView
            anchors.fill: parent
            currentIndex: -1
            onCurrentIndexChanged: {

                sceneView.replace(null, sceneTabView.itemAt(currentIndex).visualItem,
                                 itemProperties,
                                 StackView.Immediate)
            }

        }
    }

    function pushSource(path) {
        console.log("sceneView.qml pushSource");

        sceneView.push(Qt.resolvedUrl("../../" + path), itemProperties,
                      StackView.Immediate);
        sceneView.currentItem.sendToScript.connect(sceneView.sendToScript);
    }

    function popSource() {
        console.log("sceneView.qml popSource");
        sceneView.pop(StackView.Immediate);
    }

    // Passes script messages to the item on the top of the stack
    function fromScript(message) {
        console.log("SceneView.fromScript");
        var currentItem = sceneModel.currentItem;
        if (currentItem && currentItem.fromScript) {
            currentItem.fromScript(message);
        } else if (sceneTabView.fromScript) {
            sceneTabView.fromScript(message);
        }
    }
}
