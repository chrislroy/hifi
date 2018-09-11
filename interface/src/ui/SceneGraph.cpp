

#include "SceneNode.h"
#include "SceneGraph.h"
#include <QStringList>


SceneGraph::SceneGraph(QObject* parent)
    : QAbstractItemModel(parent)
{
    m_roleNameMapping[NodeRoleName] = "name";
    //m_roleNameMapping[NodeRoleID] = "id";
    //m_roleNameMapping[NodeRoleType] = "type";


    QList<QVariant> rootData;
    rootData << "Name";
    //rootData << "Type";
    //rootData << "ID";
    _rootItem = new SceneNode(rootData);
}

SceneGraph::~SceneGraph() {
    delete _rootItem;
}

void SceneGraph::initialize(const EntityTreePointer treePointer)
{
    _treePointer = treePointer;

    // delete rootItem's children
    _rootItem->deleteAllChildren();

    // clear node map
    _nodeMap.clear();

    setupModelData(QUuid(), EntityTree::Add);
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

    // we use only the name for now...
    if (role != NodeRoleName /*&& role != NodeRoleID && role != NodeRoleType && role != NodeRoleParentID*/)
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


void SceneGraph::setupModelData(QUuid entityID, int action)
{
    beginResetModel();

    QHash<EntityItemID, EntityItemPointer> treeMap = _treePointer->getTreeMap();

    if (true || entityID.isNull() || treeMap.contains(entityID)) { // id is null - we are starting the process - trash everything
        // delete rootItem's children
        _rootItem->deleteAllChildren();

        // clear node map
        _nodeMap.clear();

        // regenerate model and populate node map
        QHash<EntityItemID, EntityItemPointer>::iterator itr = treeMap.begin();
        while (!treeMap.empty()) {
            const EntityItemPointer& entityItem = itr.value();
            auto name = entityItem->getName();
            auto type = EntityTypes::getEntityTypeName(entityItem->getType());
            auto id = entityItem->getID();
            auto parentId = entityItem->getParentID();

            QList<QVariant> columnData;
            columnData << name;
            columnData << type;
            columnData << id.toString();;
            columnData << parentId.toString();;

            bool added = false;
            if (parentId.isNull()) {
                auto node = new SceneNode(columnData, _rootItem);
                _rootItem->appendChild(node);
                _nodeMap[id] = node;
                added = true;
            }
            else if (_nodeMap.contains(parentId)){
                auto parent = _nodeMap[parentId];
                auto node = new SceneNode(columnData, parent);
                parent->appendChild(node);
                _nodeMap[id] = node;
                added = true;
            }
            else {
                qDebug() << "Missing parent in node map:" << parentId;
            }

            if (added) {
                itr = treeMap.erase(itr);
            }
            else {
                ++itr;
            }
            if (itr == treeMap.end())
                itr = treeMap.begin();
        }

    }
    else {

        auto entity = treeMap[entityID];

        auto name = entity->getName();
        auto type = EntityTypes::getEntityTypeName(entity->getType());
        auto id = entity->getID();
        auto parentId = entity->getParentID();

        QList<QVariant> columnData;
        columnData << id.toString();
        columnData << type;

        if (action == EntityTree::Add) {
            // add to root
            if (parentId.isNull()) {
                auto node = new SceneNode(columnData, _rootItem);
                _rootItem->appendChild(node);
                _nodeMap[id] = node;
            }
            // add to existing parent
            else {
                qDebug() << "WARNING - add to existing parent - this should not happens";
                auto parent = _nodeMap[parentId];
                auto node = new SceneNode(columnData, parent);
                parent->appendChild(node);
                _nodeMap[id] = node;
            }
        }
        else if (action == EntityTree::Delete) {
            auto node = _nodeMap.find(id);
            delete _nodeMap[id];
            _nodeMap.erase(node);
        }
        else if (action == EntityTree::Edit) {
            // parent changed???
            //auto node = _nodeMap[id];
            //QUuid oldParentId = node->parentItem()->data(0);
            //auto oldParent = _nodeMap[oldParentId];

            //auto parentEntity = treeMap[node->parentItem()->data(0)];
            //auto origParentId = node->parentItem()->data(0);
            //auto origParentType = node->parentItem()->data(1);
            qDebug() << "TODO --- Updating entity name or parent";
        }
        else {
            qDebug("**** invalid action!!!!");
        }
    }
    //emit dataChanged(createIndex(0, 0), createIndex(rowCount(), 1));

    endResetModel();
}

void SceneGraph::refresh(QUuid entityId, int action)
{
    qDebug() << "SceneGraph::refresh()";

    setupModelData(entityId, action);
}