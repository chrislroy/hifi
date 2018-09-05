

#include "SceneNode.h"
#include "SceneGraph.h"
#include <QStringList>


SceneGraph::SceneGraph(const QString& data, QObject* parent) : QAbstractItemModel(parent) {

    m_roleNameMapping[TreeModelRoleName] = "name";
    m_roleNameMapping[TreeModelRoleDescription] = "type";

    QList<QVariant> rootData;

    rootData << "Name" << "Type";
    rootItem = new SceneNode(rootData);
    setupModelData(data.split(QString("\n")), rootItem);
}

SceneGraph::~SceneGraph() {
    delete rootItem;
}

int SceneGraph::columnCount(const QModelIndex& parent) const {
    if (parent.isValid())
        return static_cast<SceneNode*>(parent.internalPointer())->columnCount();
    else
        return rootItem->columnCount();
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
        return rootItem->data(section);

    return QVariant();
}

QModelIndex SceneGraph::index(int row, int column, const QModelIndex& parent) const {
    if (!hasIndex(row, column, parent))
        return QModelIndex();

    SceneNode* parentItem;

    if (!parent.isValid())
        parentItem = rootItem;
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

    if (parentItem == rootItem)
        return QModelIndex();

    return createIndex(parentItem->row(), 0, parentItem);
}

int SceneGraph::rowCount(const QModelIndex& parent) const {
    SceneNode* parentItem;
    if (parent.column() > 0)
        return 0;

    if (!parent.isValid())
        parentItem = rootItem;
    else
        parentItem = static_cast<SceneNode*>(parent.internalPointer());

    return parentItem->childCount();
}


void SceneGraph::setupModelData(const QStringList& lines, SceneNode* parent) {
    QList<SceneNode*> parents;
    QList<int> indentations;
    parents << parent;
    indentations << 0;

    int number = 0;

    while (number < lines.count()) {
        int position = 0;
        while (position < lines[number].length()) {
            if (lines[number].at(position) != ' ')
                break;
            position++;
        }

        QString lineData = lines[number].mid(position).trimmed();

        if (!lineData.isEmpty()) {
            // Read the column data from the rest of the line.
            QStringList columnStrings = lineData.split("\t", QString::SkipEmptyParts);
            QList<QVariant> columnData;
            for (int column = 0; column < columnStrings.count(); ++column)
                columnData << columnStrings[column];

            if (position > indentations.last()) {
                // The last child of the current parent is now the new parent
                // unless the current parent has no children.

                if (parents.last()->childCount() > 0) {
                    parents << parents.last()->child(parents.last()->childCount() - 1);
                    indentations << position;
                }
            } else {
                while (position < indentations.last() && parents.count() > 0) {
                    parents.pop_back();
                    indentations.pop_back();
                }
            }

            // Append a new item to the current parent's list of children.
            parents.last()->appendChild(new SceneNode(columnData, parents.last()));
        }

        ++number;
    }
}
