//
//  helper.cpp
//  UserViewer
//
//  Created by Zelun Luo on 3/2/16.
//  Copyright © 2016 Zelun Luo. All rights reserved.
//

#include "helper.h"
#include <math.h>

void procFrame(Mat &rgb, Mat &depth) {
    int width = rgb.cols;
    int height = rgb.rows;
    
    int d1 = 0;
    int d2 = 0;
    int p1x = width/2;
    int p1y = height/4;
    int p2x = width/2;
    int p2y = 3*height/4;
    int n1 = 0;
    int n2 = 0;
    
    for (int i = -5; i <= 5; i++) {
        for (int j = -5; j <= 5; j++) {
            int tmp1 = (int)depth.at<uint16_t>(p1x+i, p1y+j);
            d1 += tmp1;
            n1 += (tmp1 == 0) ? 0 : 1;
            int tmp2 = (int)depth.at<uint16_t>(p2x+i, p2y+j);
            d2 += tmp2;
            n2 += (tmp2 == 0) ? 0 : 1;
        }
    }
    if (!n1 || !n2)
        return;
        
    d1 /= n1;
    d2 /= n2;
    
    float s = (1.0/(1+exp((d1-d2)/500.0))-0.5)*2;
    //cout <<(d1-d2)<<","<<s<<endl;
    int minOff = 1;
    int maxOff = 15;
    int off1 = (minOff+maxOff)/2.0-s*(maxOff-(minOff+maxOff)/2.0);
    int off2 = (minOff+maxOff)/2.0+s*(maxOff-(minOff+maxOff)/2.0);
    
    //cout << d1 << ", " << d2 << endl;
    
    vector<Point> vertex;
    vertex.push_back(Point(p1x-off1, p1y+(p2y-p1y)*abs(s))); // tl
    vertex.push_back(Point(p1x+off1, p1y+(p2y-p1y)*abs(s))); // tr
    vertex.push_back(Point(p2x+off2, p2y-(p2y-p1y)*abs(s))); // br
    vertex.push_back(Point(p2x-off2, p2y-(p2y-p1y)*abs(s)   )); // bl
    int counter = (int)vertex.size();
    const Point *vertex_const = &(vertex[0]);
    
    fillPoly(rgb, &vertex_const, &counter, 1, Scalar(255, 0, 0));
    return;
}