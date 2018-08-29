import QtQuick 2.7
import QtQuick.Controls 2.3

// FIXME pretty non-DRY code, should figure out a way to optionally hide one tab from the tab view, keep in sync with Edit.qml
StackView {
    id: editRoot
    objectName: "stack"

    signal sendToScript(var message);

    topPadding: 40
    leftPadding: 0
    rightPadding: 0
    bottomPadding: 0

    anchors.fill: parent

    property var itemProperties: {"y": editRoot.topPadding,
                                  "width": editRoot.availableWidth,
                                  "height": editRoot.availableHeight }
    Component.onCompleted: {
        tab.currentIndex = 0
        console.log("**** CROY **** eventBridge:" + eventBridge)
        if (eventBridge) {
            console.log("**** CROY **** EditTools.qml connect eventBridge.scriptEventReceived !!!")
            eventBridge.scriptEventReceived.connect(eventReceived);
        }
    }

    background: Rectangle {
        color: "#404040" //default background color
        EditToolsTabView {
            id: tab
            anchors.fill: parent
            currentIndex: -1
            onCurrentIndexChanged: {
                editRoot.replace(null, tab.itemAt(currentIndex).visualItem,
                                 itemProperties,
                                 StackView.Immediate)
            }
        }
    }

    function pushSource(path) {
        editRoot.push(Qt.resolvedUrl("../../" + path), itemProperties,
                      StackView.Immediate);
        editRoot.currentItem.sendToScript.connect(editRoot.sendToScript);
    }

    function popSource() {
        editRoot.pop(StackView.Immediate);
    }

    // Passes script messages to the item on the top of the stack
    function fromScript(message) {
        var currentItem = editRoot.currentItem;
        if (currentItem && currentItem.fromScript) {
            currentItem.fromScript(message);
        } else if (tab.fromScript) {
            tab.fromScript(message);
        }
    }

    function eventReceived(data) {
        console.log("**** CROY **** EditTools.qml eventReceived type:" + data.type);
        if (data.type == "update") {
            // console.log("**** CROY **** EditTools.qml eventReceived data:" + JSON.stringify(data));
        }
        
    }

}
