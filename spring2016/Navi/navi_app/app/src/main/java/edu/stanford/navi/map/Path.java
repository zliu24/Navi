package edu.stanford.navi.map;

import java.io.Serializable;

/**
 * Created by lucasliu on 5/17/16.
 */
public class Path implements Serializable{
    private static final long serialVersionUID = 1L;
    float[][] path;
    private static Path singletonObject;
    public static Path getSingletonObject() {
        if (singletonObject == null) {
            singletonObject = new Path ();
        }
        return singletonObject;
    }
    public void setpath(float[][] path)
    {
        this.path = path;
    }
    public float[][] getPath()
    {
        return path;
    }

}
