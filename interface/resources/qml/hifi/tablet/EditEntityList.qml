import QtQuick 2.7
import QtQuick.Controls 2.2
import QtWebChannel 1.0
import "../../controls"
import "../toolbars"
import QtGraphicalEffects 1.0
import "../../controls-uit" as HifiControls
import "../../styles-uit"

TabBar {
    id: sceneTabViews
    width: parent.width
    contentWidth: parent.width
    padding: 0
    spacing: 0

    readonly property QtObject tabIndex: QtObject {
        readonly property int list: 0
        readonly property int graph: 1
    }

    readonly property HifiConstants hifi: HifiConstants {}

    EditTabButton {
        title: "LIST"
        active: true
        enabled: true
        property string originalUrl: ""

        property Component visualItem: Component {
            WebView {
                id: entityListToolWebView
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
            WebView {
                id: entityListToolWebView2
                url: Paths.defaultScripts + "/system/html/entityList.html"
                enabled: true
            }
        }
    }
    

    function fromScript(message) {

        console.log('editEntityList.fromScript');
        switch (message.method) {
            case 'selectTab':
                selectTab(message.params.id);
                break;
            default:
                console.warn('Unrecognized message:', JSON.stringify(message));
        }
    }

    // Changes the current tab based on tab index or title as input
    function selectTab(id) {
        console.log('editEntityList.selectTab');
        if (typeof id === 'number') {
            if (id >= tabIndex.create && id <= tabIndex.particle) {
                sceneTabViews.currentIndex = id;
            } else {
                console.warn('Attempt to switch to invalid tab:', id);
            }
        } else if (typeof id === 'string'){
            switch (id.toLowerCase()) {
                case 'list':
                    sceneTabViews.currentIndex = tabIndex.list;
                    break;
                case 'graph':
                    sceneTabViews.currentIndex = tabIndex.graph;
                    break;
                default:
                    console.warn('Attempt to switch to invalid tab:', id);
            }
        } else {
            console.warn('Attempt to switch tabs with invalid input:', JSON.stringify(id));
        }
    }

}


