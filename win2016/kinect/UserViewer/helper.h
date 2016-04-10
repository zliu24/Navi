//
//  helper.h
//  UserViewer
//
//  Created by Zelun Luo on 3/2/16.
//  Copyright © 2016 Zelun Luo. All rights reserved.
//

#ifndef helper_hpp
#define helper_hpp

#include <stdio.h>
#include <vector>
#include "opencv2/core/core.hpp"
#include "opencv2/imgproc/imgproc.hpp"
#include "opencv2/highgui/highgui.hpp"
#include "opencv2/ml.hpp"
#include "opencv2/video/background_segm.hpp"
#include "opencv2/photo.hpp"

using namespace cv;
using namespace std;

#endif /* helper_hpp */

void procFrame(Mat &rgb, Mat &depth);