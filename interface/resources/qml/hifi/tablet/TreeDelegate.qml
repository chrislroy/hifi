import QtQuick 2.0

Rectangle {
    id: item
    color: styleData.row % 2 == 0 ? hifi.colors.tableRowDarkEven : hifi.colors.tableRowDarkOdd;

    Component.onCompleted : { 
        console.log("TreeDelegate in completed:", model.id)
    }

    Text {
        id: text
        anchors.fill: parent
        color: "#ffffff"
        elide: styleData.elideMode
        text: model.name ? model.name : ""

        font.family: "Fira Sans SemiBold"
        font.pixelSize: hifi.fontSizes.textFieldInput
        verticalAlignment: Text.AlignVCenter
    }

    DropArea {
        id: dropArea
        anchors.fill: parent
        keys: ["text/plain"]
        onEntered: console.log('onEntered');
        onDropped: {
            sceneView.sendToScript({ 
                method: "reparent" , 
                params: { child: drop.text, parent: model.id } 
            });
        }
    }

    MouseArea {
        id: mouseArea
        anchors.fill: parent
        drag.target: draggable
        onClicked: {
            sceneView.sendToScript({ 
                method: "selection" , 
                params: { selection: model.id } 
            });
        }
    }

    Item {
        id: draggable
        anchors.fill: parent
        Drag.active: mouseArea.drag.active
        Drag.hotSpot.x: 0
        Drag.hotSpot.y: 0
        Drag.mimeData: { "text/plain": model.id ? model.id : "" }
        Drag.dragType: Drag.Automatic
    }
}

