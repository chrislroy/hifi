

#ifndef SCENENODE_H
#define SCENENODE_H

#include <QList>
#include <QVariant>

//! [0]
class SceneNode {
public:
    explicit SceneNode(const QList<QVariant>& data, SceneNode* parentItem = 0);
    ~SceneNode();

    void appendChild(SceneNode* child);

    SceneNode* child(int row);
    int childCount() const;
    int columnCount() const;
    QVariant data(int column) const;
    void setData(const QList<QVariant>& data);
    int row() const;
    SceneNode* parentItem();

    void deleteAllChildren();

private:
    QList<SceneNode*> m_childItems;
    QList<QVariant> m_itemData;
    SceneNode* m_parentItem;
};
//! [0]

#endif  // SCENENODE_H

