

#ifndef SCENENODE_H
#define SCENENODE_H

#include <QList>
#include <QVariant>

class SceneNode : public QObject
{
    Q_OBJECT

public:

    explicit SceneNode(const QList<QVariant>& data, SceneNode* parent);
    ~SceneNode();

    SceneNode* parentNode();
    void setParent(SceneNode*);

    void appendChild(SceneNode *child);
    void removeChild(SceneNode* child);

    SceneNode* child(int row);
    int childCount() const;
    int columnCount() const;
    QVariant data(int column) const;
    void updateData(int column, const QVariant& data);
    int row() const;
    
    void deleteAllChildren();
    QList<SceneNode*> takeChildren();

private:

    QList<SceneNode*> m_childItems;
    QList<QVariant> m_itemData;
    SceneNode* m_parentItem = nullptr;
};

#endif  // SCENENODE_H

