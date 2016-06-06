package edu.stanford.navi.domain;

/**
 * Created by lucasliu on 5/26/16.
 */
public class Coordinate {
    float x;
    float y;
    public Coordinate(float x, float y) {
        this.x = x;
        this.y = y;
    }

    public float getX() {
        return x;
    }

    public int getXInt() {
        return (int) x;
    }

    public int getYInt() {
        return (int) y;
    }

    public void setX(float x) {
        this.x = x;
    }

    public float getY() {
        return y;
    }

    public void setY(float y) {
        this.y = y;
    }

    @Override
    public String toString() {
        return "x = " + getX() + " y = " + getX();
    }
}
