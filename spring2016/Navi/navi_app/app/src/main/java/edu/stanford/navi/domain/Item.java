package edu.stanford.navi.domain;

import java.util.Set;

/**
 * Created by Emma on 6/5/16.
 */
public class Item {
    String name;
    Coordinate coord2D;
    Set<String> categories;

    public Item() {}

    public Item(String name, Coordinate coord2D, Set<String> categories) {
        this.name = name;
        this.coord2D = coord2D;
        this.categories = categories;
    }

    public String getName() { return this.name; }

    public void setName(String name) { this.name = name; }

    public Coordinate getCoord2D() { return this.coord2D; }

    public void setCoord2D(Coordinate coord) { this.coord2D = coord; }

    public Set<String> getCategories() { return this.categories; }

    public void setCategories(Set<String> categories) {
        this.categories = categories;
    }

    public void addToCategories(String c) {
        this.categories.add(c);
    }

    public void removeFromCategories(String c) {
        this.categories.remove(c);
    }

    @Override
    public String toString() {
        String itemStr = "Name: " + getName() +
                " Coord2D: " + getCoord2D().toString() +
                " Categories: " + getCategories().toString();
        return itemStr;
    }
}
