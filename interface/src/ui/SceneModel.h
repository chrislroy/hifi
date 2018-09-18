
#ifndef SCENEMODEL_H
#define SCENEMODEL_H

#include <QAbstractItemModel>
#include "SceneNode.h"
#include "EntityItem.h"
#include "EntityTree.h"
#include "DependencyManager.h"

class SceneModel : public QAbstractItemModel {
    Q_OBJECT

public:
    enum NodeRole
    {
        NodeRoleName = Qt::UserRole + 1,
        NodeRoleType,
        NodeRoleID,
        NodeRoleParentID
    };

    SceneModel(QObject* parent = 0);
    ~SceneModel();
    void initialize(const EntityTreePointer treePointer);
    QVariant data(const QModelIndex& index, int role) const Q_DECL_OVERRIDE;
    bool setData(const QModelIndex &index, const QVariant &value, int role = Qt::EditRole);
    Qt::ItemFlags flags(const QModelIndex& index) const Q_DECL_OVERRIDE;
    QVariant headerData(int section, Qt::Orientation orientation, int role = Qt::DisplayRole) const Q_DECL_OVERRIDE;
    QModelIndex index(int row, int column, const QModelIndex& parent = QModelIndex()) const Q_DECL_OVERRIDE;
    QModelIndex parent(const QModelIndex& index) const Q_DECL_OVERRIDE;
    int rowCount(const QModelIndex& parent = QModelIndex()) const Q_DECL_OVERRIDE;
    int columnCount(const QModelIndex& parent = QModelIndex()) const Q_DECL_OVERRIDE;
    QHash<int, QByteArray> roleNames() const Q_DECL_OVERRIDE;
    Q_INVOKABLE int getRoleKey(QString rolename) const;
    void refresh(QUuid, int);
private:
    void setupModelData(QUuid, int);

    SceneNode* _rootItem = { nullptr };
    EntityTreePointer _treePointer = { nullptr };

    QHash<int, QByteArray> m_roleNameMapping;
    QHash<QUuid, SceneNode*> _nodeMap;

};

#endif  // SCENEMODEL_H