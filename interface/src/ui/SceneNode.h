

#ifndef SCENENODE_H
#define SCENENODE_H

#include <QList>
#include <QVariant>

//! [0]
class SceneNode : public QObject
{
    Q_OBJECT

public:

    //Q_PROPERTY(QString name READ name WRITE setName NOTIFY nameChanged)
    //Q_PROPERTY(QString id READ id WRITE setId NOTIFY idChanged)
    //Q_PROPERTY(bool collapsed READ collapsed WRITE setCollapsed NOTIFY collapsedChanged)

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
//! [0]

#endif  // SCENENODE_H

