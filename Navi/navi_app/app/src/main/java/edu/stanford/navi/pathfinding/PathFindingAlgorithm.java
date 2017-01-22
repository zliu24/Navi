package edu.stanford.navi.pathfinding;

/**
 * Created by alan on 4/17/16.
 * Reference: https://github.com/Ohohcakester/Any-Angle-Pathfinding
 * Template for all Path Finding Algorithms used
 */

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;
import edu.stanford.navi.pathfinding.datatypes.GridGraph;
import edu.stanford.navi.pathfinding.datatypes.Memory;

public abstract class PathFindingAlgorithm {
    private static final int SNAPSHOT_INTERVAL = 0;
    private int snapshotCountdown = 0;

    protected GridGraph graph;

    protected int parent[];
    protected final int sizeX;
    protected final int sizeXplusOne;
    protected final int sizeY;

    protected final int sx;
    protected final int sy;
    protected final int ex;
    protected final int ey;
    
    private int ticketNumber = -1;
    
    private boolean recordingMode;
    private boolean usingStaticMemory = false;

    public PathFindingAlgorithm(GridGraph graph, int sizeX, int sizeY,
            int sx, int sy, int ex, int ey) {
        this.graph = graph;
        this.sizeX = sizeX;
        this.sizeXplusOne = sizeX+1;
        this.sizeY = sizeY;
        this.sx = sx;
        this.sy = sy;
        this.ex = ex;
        this.ey = ey;
    }
    
    protected void initialiseMemory(int size, float defaultDistance, int defaultParent, boolean defaultVisited) {
        usingStaticMemory = true;
        ticketNumber = Memory.initialise(size, defaultDistance, defaultParent, defaultVisited);
    }
    
    /**
     * Call to start tracing the algorithm's operation.
     */
    public void startRecording() {
        recordingMode = true;
    }
    
    /**
     * Call to stop tracing the algorithm's operation.
     */
    public void stopRecording() {
        recordingMode = false;
    }
    
    /**
     * Call this to compute the path.
     */
    public abstract void computePath();

    /**
     * @return retrieve the path computed by the algorithm
     */
    public abstract int[][] getPath();
    
    /**
     * An optimal overridable method which prints some statistics when called for.
     */
    public void printStatistics() {
    }
    
    protected int toOneDimIndex(int x, int y) {
        return graph.toOneDimIndex(x, y);
    }
    
    protected int toTwoDimX(int index) {
        return graph.toTwoDimX(index);
    }
    
    protected int toTwoDimY(int index) {
        return graph.toTwoDimY(index);
    }
    
    protected final boolean isRecording() {
        return recordingMode;
    }
    
    protected int goalParentIndex() {
        return toOneDimIndex(ex,ey);
    }
    
    private int getParent(int index) {
        if (usingStaticMemory) return Memory.parent(index);
        else return parent[index];
    }
    
    private void setParent(int index, int value) {
        if (usingStaticMemory) Memory.setParent(index, value);
        else parent[index] = value;
    }
    
    protected int getSize() {
        if (usingStaticMemory) return Memory.size();
        else return parent.length;
    }
    
    protected Integer[] snapshotEdge(int endIndex) {
        Integer[] edge = new Integer[4];
        int startIndex = getParent(endIndex);
        edge[2] = toTwoDimX(endIndex);
        edge[3] = toTwoDimY(endIndex);
        if (startIndex < 0) {
            edge[0] = edge[2];
            edge[1] = edge[3];
        } else {
            edge[0] = toTwoDimX(startIndex);
            edge[1] = toTwoDimY(startIndex);
        }
        
        return edge;
    }
    
    protected Integer[] snapshotVertex(int index) {
        if (selected(index)) {
            Integer[] edge = new Integer[2];
            edge[0] = toTwoDimX(index);
            edge[1] = toTwoDimY(index);
            return edge;
        }
        return null;
    }
    
    protected boolean selected(int index) {
        return false;
    }
}
