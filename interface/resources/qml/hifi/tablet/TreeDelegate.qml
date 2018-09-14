import QtQuick 2.0

Item {
    Text {
        anchors.fill: parent
        color: "#afafaf"
        elide: styleData.elideMode
        text: styleData.value
        //text: "Name: " + name + " - " + id
        font.family: "Fira Sans SemiBold"
        font.pixelSize: hifi.fontSizes.textFieldInput
        height: hifi.dimensions.tableRowHeight
    }
}
