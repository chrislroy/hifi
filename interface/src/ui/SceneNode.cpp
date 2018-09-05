
/*
    SceneNode.cpp

    A container for items of data supplied by the simple tree model.
*/

#include <QStringList>

#include "SceneNode.h"

//! [0]
SceneNode::SceneNode(const QList<QVariant> &data, SceneNode *parent)
{
    m_parentItem = parent;
    m_itemData = data;
}
//! [0]

//! [1]
SceneNode::~SceneNode()
{
    qDeleteAll(m_childItems);
}
//! [1]

//! [2]
void SceneNode::appendChild(SceneNode *item)
{
    m_childItems.append(item);
}
//! [2]

//! [3]
SceneNode *SceneNode::child(int row)
{
    return m_childItems.value(row);
}
//! [3]

//! [4]
int SceneNode::childCount() const
{
    return m_childItems.count();
}
//! [4]

//! [5]
int SceneNode::columnCount() const
{
    return m_itemData.count();
}
//! [5]

//! [6]
QVariant SceneNode::data(int column) const
{
    return m_itemData.value(column);
}
//! [6]

//! [7]
SceneNode *SceneNode::parentItem()
{
    return m_parentItem;
}
//! [7]

//! [8]
int SceneNode::row() const
{
    if (m_parentItem)
        return m_parentItem->m_childItems.indexOf(const_cast<SceneNode*>(this));

    return 0;
}
//! [8]
