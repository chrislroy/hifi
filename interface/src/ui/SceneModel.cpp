

#include "SceneNode.h"
#include "SceneModel.h"
#include <QStringList>

SceneModel::SceneModel(QObject* parent)
    : QAbstractItemModel(parent)
{

    m_roleNameMapping[NodeRoleName] = "name";
    m_roleNameMapping[NodeRoleID] = "id";

    //m_roleNameMapping[NodeRoleType] = "type";

    QList<QVariant> rootData;
    rootData << "Name";

    _rootItem = new SceneNode(rootData);
}

SceneModel::~SceneModel() {
    delete _rootItem;
}

void SceneModel::initialize(const EntityTreePointer treePointer) {
    _treePointer = treePointer;

    // delete rootItem's children
    _rootItem->deleteAllChildren();

    // clear node map
    m_nodeMap.clear();

    setupModelData(QUuid(), EntityTree::InitializeAction);
}

int SceneModel::columnCount(const QModelIndex& parent) const {
    if (parent.isValid())
        return static_cast<SceneNode*>(parent.internalPointer())->columnCount();
    else
        return _rootItem->columnCount();
}

QVariant SceneModel::data(const QModelIndex& index, int role) const {
    if (!index.isValid())
        return QVariant();

    // we use only the name for now...
    if (role != NodeRoleName && role != NodeRoleID)
        return QVariant();

    SceneNode* item = static_cast<SceneNode*>(index.internalPointer());

    return item->data(role - Qt::UserRole - 1);
}

bool SceneModel::setData(const QModelIndex &index, const QVariant &value, int role)
{
    // TODO - TO TEST
    if (!index.isValid())
        return false;
    if (role != NodeRoleName && role != NodeRoleID)
        return false;
    SceneNode* item = static_cast<SceneNode*>(index.internalPointer());
    item->updateData(role, value);
    QVector<int> roleChanged = { role };
    emit dataChanged(index, index, roleChanged);
    return true;
}

Qt::ItemFlags SceneModel::flags(const QModelIndex& index) const {
    if (!index.isValid())
        return 0;

    return QAbstractItemModel::flags(index);
}

QVariant SceneModel::headerData(int section, Qt::Orientation orientation, int role) const {
    if (orientation == Qt::Horizontal && role == Qt::DisplayRole)
        return _rootItem->data(section);

    return QVariant();
}

QModelIndex SceneModel::index(int row, int column, const QModelIndex& parent) const {
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

QHash<int, QByteArray> SceneModel::roleNames() const {
    return m_roleNameMapping;
}

QModelIndex SceneModel::parent(const QModelIndex& index) const {
    if (!index.isValid())
        return QModelIndex();

    SceneNode* childItem = static_cast<SceneNode*>(index.internalPointer());
    SceneNode* parentItem = childItem->parentNode();

    if (parentItem == _rootItem)
        return QModelIndex();

    return createIndex(parentItem->row(), 0, parentItem);
}

int SceneModel::rowCount(const QModelIndex& parent) const {
    SceneNode* parentItem;
    if (parent.column() > 0)
        return 0;

    if (!parent.isValid())
        parentItem = _rootItem;
    else
        parentItem = static_cast<SceneNode*>(parent.internalPointer());

    return parentItem->childCount();
}

// TOTO - refactor 
// TOTO - recursively validate the skipped node
// TODO - optimise using QModelIndex add/delete/edit nodes
void SceneModel::setupModelData(QUuid entityID, int action) {
    static QStringList ignoredType;
    if (ignoredType.isEmpty()) {
        ignoredType << "Polyline";
        ignoredType << "PolylineEffect";
        ignoredType << "ParticleEffect";
    }

    QHash<EntityItemID, EntityItemPointer> treeMap = _treePointer->getTreeMap();
    if (action == EntityTree::InitializeAction) {
        qDebug() << "Buidling model" << entityID.toString();
        beginResetModel();

        // delete rootItem's children
        _rootItem->deleteAllChildren();

        // clear node map
        m_nodeMap.clear();

        // regenerate model and populate node map
        QHash<EntityItemID, EntityItemPointer> skippedNode;
        QHash<EntityItemID, EntityItemPointer>::iterator itr = treeMap.begin();
        while (!treeMap.empty()) {
            const EntityItemPointer& entityItem = itr.value();
            auto type = EntityTypes::getEntityTypeName(entityItem->getType());

            // skipping nodes of given type
            if (ignoredType.contains(type, Qt::CaseInsensitive)) {
                itr = treeMap.erase(itr);
                continue;
            }
            auto parentId = entityItem->getParentID();
            auto id = entityItem->getID();

            auto parentNode = _rootItem;
            if (!parentId.isNull()) {
                if (!m_nodeMap.contains(entityID)) {
                    skippedNode[id] = entityItem;
                    itr = treeMap.erase(itr);
                    continue;
                }
                parentNode = m_nodeMap[parentId];
            }

            auto name = entityItem->getName();

            QList<QVariant> columnData;
            columnData << name;
            columnData << id.toString();

            auto node = new SceneNode(columnData, parentNode);
            parentNode->appendChild(node);
            m_nodeMap[id] = node;
            itr = treeMap.erase(itr);
        }
        endResetModel();
    }
    else if (action == EntityTree::EntityDeletedAction) {
        // TODO - TEST
        qDebug() << "Delete entity " << entityID.toString();
        auto node = m_nodeMap.find(entityID);
        auto nodeRow = (*node)->row();
        auto parentNode = (*node)->parentNode();
        auto parentIndex = createIndex(nodeRow, 0, parentNode);

        beginRemoveRows(parentIndex, nodeRow, nodeRow);

        parentNode->removeChild((*node));
        m_nodeMap.erase(node);

        delete (*node);
        
        endRemoveRows();
    }
    else if (action == EntityTree::EntityAddedAction) {
        // TODO - TEST
        qDebug() << "Adding entity " << entityID.toString();

        Q_ASSERT(treeMap.contains(entityID));

        auto entity = treeMap[entityID];

        auto name = entity->getName();
        auto id = entity->getID();
        auto parentId = entity->getParentID();

        QList<QVariant> columnData;
        columnData << name;
        columnData << id.toString();

        auto parentNode = _rootItem;
        if (!parentId.isNull())
            parentNode = m_nodeMap[parentId];

        auto nodeRow = parentNode->childCount();

        auto parentIndex = createIndex(parentNode->row(), 0, parentNode);

        qDebug() << "Adding element: " << qPrintable(name) << " id " << qPrintable(id.toString()) << " row " << nodeRow;

        beginInsertRows(parentIndex, nodeRow, nodeRow);

        auto node = new SceneNode(columnData, parentNode);
        parentNode->appendChild(node);
        m_nodeMap[id] = node;

        endInsertRows();
    } else if (action == EntityTree::ParentChangedAction) {
        // TODO -TEST
        auto entity = treeMap[entityID];
        auto node = m_nodeMap.find(entityID);
        auto sourceRow = (*node)->row();
        auto sourceParent = (*node)->parentNode();
        auto sourceIndex = createIndex(sourceParent->row(), 0, sourceParent);

        auto targetNode = m_nodeMap.find(entity->getParentID());
        auto targetIndex = createIndex((*targetNode)->row(), 0, (*targetNode));

        beginMoveRows(sourceIndex, sourceRow, sourceRow, targetIndex, (*targetNode)->childCount());

        // remove this item from its parent
        sourceParent->removeChild((*node));
        // reparent it
        targetNode->appendChild((*node));
        endMoveRows();

    } else if (action == EntityTree::NameChangedAction) {
        // TODO - TEST
        qDebug() << "Entity name changed";

        // being lazy - remove node from its parent
        auto entity = treeMap[entityID];
        auto node = m_nodeMap.find(entityID);
        auto itemIndex = createIndex((*node)->row(), 0, (*node));
        setData(itemIndex, entity->getName(), NodeRoleName);

    }
    else {
         qDebug("**** ERROR UPDATING SCENE MODEL ****");
    }

}

void SceneModel::refresh(QUuid entityId, int action) {
    qDebug() << "SceneModel::refresh()";

    setupModelData(entityId, action);
}

int SceneModel::getRoleKey(const QString& rolename) const
{
    return roleNames().key(rolename.toLatin1());
}
