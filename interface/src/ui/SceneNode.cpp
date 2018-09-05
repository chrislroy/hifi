
/*
    SceneNode.cpp

    A container for items of data supplied by the simple tree model.
*/

#include <QStringList>

#include "SceneNode.h"

SceneNode::SceneNode(const QList<QVariant> &data, SceneNode *parent)
{
    m_parentItem = parent;
    m_itemData = data;
}

SceneNode::~SceneNode()
{
    qDeleteAll(m_childItems);
}

void SceneNode::appendChild(SceneNode *item)
{
    m_childItems.append(item);
}

SceneNode *SceneNode::child(int row)
{
    return m_childItems.value(row);
}

int SceneNode::childCount() const
{
    return m_childItems.count();
}

int SceneNode::columnCount() const
{
    return m_itemData.count();
}

QVariant SceneNode::data(int column) const
{
    return m_itemData.value(column);
}

SceneNode *SceneNode::parentItem()
{
    return m_parentItem;
}

int SceneNode::row() const
{
    if (m_parentItem)
        return m_parentItem->m_childItems.indexOf(const_cast<SceneNode*>(this));

    return 0;
}


