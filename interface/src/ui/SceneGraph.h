
#ifndef SCENEGRAPH_H
#define SCENEGRAPH_H

#include <QAbstractItemModel>
#include "SceneNode.h"

#include "DependencyManager.h"

class SceneGraph : public QAbstractItemModel {
    Q_OBJECT

public:
    enum TreeModelRoles
    {
        TreeModelRoleName = Qt::UserRole + 1,
        TreeModelRoleDescription
    };

    explicit SceneGraph(const QString& data = "", QObject* parent = 0);
    ~SceneGraph();

    QVariant data(const QModelIndex& index, int role) const Q_DECL_OVERRIDE;
    Qt::ItemFlags flags(const QModelIndex& index) const Q_DECL_OVERRIDE;
    QVariant headerData(int section, Qt::Orientation orientation, int role = Qt::DisplayRole) const Q_DECL_OVERRIDE;
    QModelIndex index(int row, int column, const QModelIndex& parent = QModelIndex()) const Q_DECL_OVERRIDE;
    QModelIndex parent(const QModelIndex& index) const Q_DECL_OVERRIDE;
    int rowCount(const QModelIndex& parent = QModelIndex()) const Q_DECL_OVERRIDE;
    int columnCount(const QModelIndex& parent = QModelIndex()) const Q_DECL_OVERRIDE;
    QHash<int, QByteArray> roleNames() const Q_DECL_OVERRIDE;

private:
    void setupModelData(const QStringList& lines, SceneNode* parent);

    SceneNode* rootItem;
    QHash<int, QByteArray> m_roleNameMapping;
};

#endif  // SCENEGRAPH_H