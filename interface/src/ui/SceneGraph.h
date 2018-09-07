
#ifndef SCENEGRAPH_H
#define SCENEGRAPH_H

#include <QAbstractItemModel>
#include "SceneNode.h"
#include "EntityItem.h"
#include "EntityTree.h"
#include "DependencyManager.h"

class SceneGraph : public QAbstractItemModel {
    Q_OBJECT

public:
    enum NodeRole
    {
        NodeRoleName = Qt::UserRole + 1,
        NodeRoleType,
        NodeRoleID
    };

    SceneGraph(const EntityTreePointer treePointer = nullptr, QObject* parent = 0);
    ~SceneGraph();

    QVariant data(const QModelIndex& index, int role) const Q_DECL_OVERRIDE;
    Qt::ItemFlags flags(const QModelIndex& index) const Q_DECL_OVERRIDE;
    QVariant headerData(int section, Qt::Orientation orientation, int role = Qt::DisplayRole) const Q_DECL_OVERRIDE;
    QModelIndex index(int row, int column, const QModelIndex& parent = QModelIndex()) const Q_DECL_OVERRIDE;
    QModelIndex parent(const QModelIndex& index) const Q_DECL_OVERRIDE;
    int rowCount(const QModelIndex& parent = QModelIndex()) const Q_DECL_OVERRIDE;
    int columnCount(const QModelIndex& parent = QModelIndex()) const Q_DECL_OVERRIDE;
    QHash<int, QByteArray> roleNames() const Q_DECL_OVERRIDE;

    void refresh(QUuid, int);
private:
    void setupModelData(QUuid, int);

    SceneNode* _rootItem;
    QHash<int, QByteArray> m_roleNameMapping;
    QHash<QUuid, SceneNode*> _nodeMap;

    const EntityTreePointer _treePointer;
};

#endif  // SCENEGRAPH_H