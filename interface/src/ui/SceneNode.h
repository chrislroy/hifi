

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
    /*
    void setName(QString name)
    {
        m_name = name;
        emit nameChanged(name);
    }
    QString name() const
    {
        return m_name;
    }

    void setId(QString id)
    {
        m_id = id;
        emit idChanged(id);
    }

    QString id() const
    {
        return m_id;
    }

    void setCollapsed(bool collapsed) {
        m_collapsed = collapsed;
        emit collapsedChanged(collapsed);
    }

    bool collapsed() const {
        return m_collapsed;
    }

signals:
    void nameChanged(QString);
    void idChanged(QString);
    void collapsedChanged(bool);
    */
private:
    /*
    bool m_collapsed = { false };
    QString m_name = "";
    QString m_id = "";
    */
    QList<SceneNode*> m_childItems;
    QList<QVariant> m_itemData;
    SceneNode* m_parentItem = nullptr;
};
//! [0]

#endif  // SCENENODE_H

