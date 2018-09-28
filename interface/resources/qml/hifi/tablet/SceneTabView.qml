import QtQuick 2.7
import QtQuick.Controls 2.2
import QtQuick.Controls 1.4
import QtQuick.Controls.Styles 1.4
import QtQml.Models 2.2
import QtWebChannel 1.0
import "../../controls"
import "../toolbars"
import QtGraphicalEffects 1.0
import "../../controls-uit" as HifiControls
import "../../styles-uit"

TabBar {
    id: sceneTabView
    width: parent.width
    contentWidth: parent.width
    padding: 0
    spacing: 0

    readonly property QtObject tabIndex: QtObject {
        readonly property int list: 0
        readonly property int graph: 1
    }

    signal sendToScript(var message);

    readonly property HifiConstants hifi: HifiConstants {}

    EditTabButton {
        title: "LIST"
        active: true
        enabled: true
        property string originalUrl: ""

        property Component visualItem: Component {
            WebView {
                id: entityListWebView
                url: Paths.defaultScripts + "/system/html/entityList.html"
                enabled: true
            }
        }
    }

    EditTabButton {
        title: "GRAPH"
        active: true
        enabled: true
        property string originalUrl: ""

        property Component visualItem: Component {

            Rectangle {
                
                id: container

                Flickable {
                    height: parent.height
                    width: parent.width
                    clip: true

                    contentHeight: height

                    contentWidth: width

                    ScrollBar.vertical : ScrollBar {
                        visible: parent.contentHeight > parent.height
                        width: 20
                        background: Rectangle {
                            color: hifi.colors.tableScrollBackgroundDark
                        }
                    }
                    
                    MouseArea {
                        id: dndarea;
                        anchors.fill: parent;
                        drag.target: treeView;

                        TreeView {
                            id: treeView
                            anchors.fill: parent
                            model: sceneModel
                            alternatingRowColors: true
                            backgroundVisible: false
                            headerVisible: false
                            itemDelegate: TreeDelegate {}
                            selectionMode: SelectionMode.SingleSelection

                            TableViewColumn {
                                title: "Name"
                                role: "name"
                            } // TableViewColumn

                            rowDelegate: Rectangle {
                                height: hifi.dimensions.tableRowHeight
                                color: styleData.row % 2 == 0 ? hifi.colors.tableRowDarkEven : hifi.colors.tableRowDarkOdd;
                            } // Rectangle

                        } // TreeView
                    } // MouseArea
                } // Flickable
            } // Rectangle
        } // Component

    } // EditTabButton

}


