
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

QList<SceneNode*> SceneNode::takeChildren()
{
    auto cacheChildren = m_childItems;
    m_childItems.clear();
    return cacheChildren;
}

void SceneNode::setParent(SceneNode* parent)
{
    m_parentItem = parent;
}

void SceneNode::appendChild(SceneNode *item)
{
    m_childItems.append(item);
    item->setParent(this);
}

void SceneNode::removeChild(SceneNode* child)
{
    child->setParent(nullptr);
    m_childItems.removeAll(child);
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

void SceneNode::updateData(int column, const QVariant& data)
{
    m_itemData[column] = data;
}

SceneNode *SceneNode::parentNode()
{
    return m_parentItem;
}

int SceneNode::row() const
{
    if (m_parentItem)
        return m_parentItem->m_childItems.indexOf(const_cast<SceneNode*>(this));

    return 0;
}

void SceneNode::deleteAllChildren()
{
    auto it = m_childItems.begin();
    while (it != m_childItems.end()) {
        delete (*it);
        it = m_childItems.erase(it);
    }
}


