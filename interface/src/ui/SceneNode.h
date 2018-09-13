

#ifndef SCENENODE_H
#define SCENENODE_H

#include <QList>
#include <QVariant>

//! [0]
class SceneNode {
public:
    explicit SceneNode(const QList<QVariant>& data, SceneNode* parent = 0);
    ~SceneNode();

    void setParent(SceneNode* parent);
    void appendChild(SceneNode* child);
    void removeChild(SceneNode* child);
    SceneNode* child(int row);
    int childCount() const;
    int columnCount() const;
    QVariant data(int column) const;
    void updateData(int column, const QVariant& data);
    int row() const;
    SceneNode* parentNode();

    void deleteAllChildren();
    QList<SceneNode*> takeChildren();

private:
    QList<SceneNode*> m_childItems;
    QList<QVariant> m_itemData;
    SceneNode* m_parentItem;
};
//! [0]

#endif  // SCENENODE_H

