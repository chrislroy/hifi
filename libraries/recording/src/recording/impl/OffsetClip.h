//
//  Created by Bradley Austin Davis 2015/11/05
//  Copyright 2015 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

#pragma once
#ifndef hifi_Recording_Impl_OffsetClip_h
#define hifi_Recording_Impl_OffsetClip_h

#include "WrapperClip.h"

namespace recording {

class OffsetClip : public WrapperClip {
public:
    using Pointer = std::shared_ptr<OffsetClip>;

    OffsetClip(const Clip::Pointer& wrappedClip, Time offset);
    virtual ~OffsetClip();

    virtual Time duration() const override;
    virtual void seek(Time offset) override;
    virtual Time position() const override;

    virtual FrameConstPointer peekFrame() const override;
    virtual FrameConstPointer nextFrame() override;

protected:
    const Time _offset;
};

}

#endif
