

#include "SceneNode.h"
#include "SceneGraph.h"
#include <QStringList>


SceneGraph::SceneGraph(const EntityTreePointer treePointer, QObject* parent)
    : _treePointer(treePointer)
    , _rootItem(nullptr)
{
    m_roleNameMapping[TreeModelRoleName] = "name";
    m_roleNameMapping[TreeModelRoleDescription] = "type";

    setupModelData();
}

SceneGraph::~SceneGraph() {
    delete _rootItem;
}

int SceneGraph::columnCount(const QModelIndex& parent) const {
    if (parent.isValid())
        return static_cast<SceneNode*>(parent.internalPointer())->columnCount();
    else
        return _rootItem->columnCount();
}

QVariant SceneGraph::data(const QModelIndex& index, int role) const {
    if (!index.isValid())
        return QVariant();

    if (role != TreeModelRoleName && role != TreeModelRoleDescription)
        return QVariant();

    SceneNode* item = static_cast<SceneNode*>(index.internalPointer());

    return item->data(role - Qt::UserRole - 1);
}

Qt::ItemFlags SceneGraph::flags(const QModelIndex& index) const {
    if (!index.isValid())
        return 0;

    return QAbstractItemModel::flags(index);
}

QVariant SceneGraph::headerData(int section, Qt::Orientation orientation, int role) const {
    if (orientation == Qt::Horizontal && role == Qt::DisplayRole)
        return _rootItem->data(section);

    return QVariant();
}

QModelIndex SceneGraph::index(int row, int column, const QModelIndex& parent) const {
    if (!hasIndex(row, column, parent))
        return QModelIndex();

    SceneNode* parentItem;

    if (!parent.isValid())
        parentItem = _rootItem;
    else
        parentItem = static_cast<SceneNode*>(parent.internalPointer());

    SceneNode* childItem = parentItem->child(row);
    if (childItem)
        return createIndex(row, column, childItem);
    else
        return QModelIndex();
}

QHash<int, QByteArray> SceneGraph::roleNames() const {
    return m_roleNameMapping;
}

QModelIndex SceneGraph::parent(const QModelIndex& index) const {
    if (!index.isValid())
        return QModelIndex();

    SceneNode* childItem = static_cast<SceneNode*>(index.internalPointer());
    SceneNode* parentItem = childItem->parentItem();

    if (parentItem == _rootItem)
        return QModelIndex();

    return createIndex(parentItem->row(), 0, parentItem);
}

int SceneGraph::rowCount(const QModelIndex& parent) const {
    SceneNode* parentItem;
    if (parent.column() > 0)
        return 0;

    if (!parent.isValid())
        parentItem = _rootItem;
    else
        parentItem = static_cast<SceneNode*>(parent.internalPointer());

    return parentItem->childCount();
}


void SceneGraph::setupModelData()
{
    QList<int> indentations;
    indentations << 0;

    beginResetModel();

    int number = 0;

    // TODO - delete all nodes - but we need to better manage the nodes

    // delete exiting rootItem
    if (_rootItem!=nullptr)
        delete _rootItem;

    // create new root item
    QList<QVariant> rootData;

    rootData << "Name"
             << "Type";
    _rootItem = new SceneNode(rootData);

    // clear node map
    _nodeMap.clear();

    // regenerate model and populate node map
    const QHash<EntityItemID, EntityItemPointer> treeMap = _treePointer->getTreeMap();

    for (auto itr = treeMap.constBegin(); itr != treeMap.constEnd(); ++itr) {
        const EntityItemPointer& entityItem = itr.value();
        auto name = entityItem->getName();
        auto type = EntityTypes::getEntityTypeName(entityItem->getType());
        auto id = entityItem->getID();
        auto parentId = entityItem->getParentID();

        QList<QVariant> columnData;
        columnData << name;
        columnData << type;

        if (parentId.isNull()) {
            qDebug() << "adding to root";
            auto node = new SceneNode(columnData, _rootItem);
            _rootItem->appendChild(node);
            _nodeMap[id] = node;
        }
        else {
            auto parent = _nodeMap[parentId];
            auto node = new SceneNode(columnData, parent);
            parent->appendChild(node);
            _nodeMap[id] = node;
        }
    }

    endResetModel();
}

void SceneGraph::refresh()
{
    qDebug() << "SceneGraph::refresh()";

    setupModelData();
}