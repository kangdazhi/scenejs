/**
 * @class A scene node that specifies the spatial boundaries of scene graph subtrees to support visibility and
 * level-of-detail culling.
 *
 * <p>The subgraphs of these are only traversed when the boundary intersect the current view frustum. When this node
 * is within the subgraph of a SceneJS.Locality node, it the boundary must also intersect the inner radius of the Locality.
 * the outer radius of the Locality is used internally by SceneJS to support content staging strategies.</p> 
 *  
 * <p>When configured with a projected size threshold for each child, they can also function as level-of-detail (LOD) selectors.</p>
 * <p><b>Live Demo</b></p>
 * <ul><li><a target = "other" href="http://bit.ly/scenejs-lod-boundingbox-example">Level of Detail Example</a></li></ul>
 *  <p><b>Example 1.</b></p><p>This BoundingBox is configured to work as a level-of-detail selector. The 'levels'
 * property specifies thresholds for the boundary's projected size, each corresponding to one of the node's children,
 * such that the child corresponding to the threshold imediately below the boundary's current projected size is only one
 * currently traversable.</p><p>This boundingBox will select exactly one of its child nodes to render for its current projected size, where the
 * levels parameter specifies for each child the size threshold above which the child becomes selected. No child is
 * selected (nothing is drawn) when the projected size is below the lowest level.</p>
 * <pre><code>
 * var bb = new SceneJS.BoundingBox({
 *          xmin: -2,
 *          ymin: -2,
 *          zmin: -2,
 *          xmax:  2,
 *          ymax:  2,
 *          zmax:  2,
 *
 *           // Levels are optional - acts as regular
 *          // frustum-culling bounding box when not specified
 *
 *          levels: [
 *             10,
 *             200,
 *             400,
 *             600
 *         ]
 *     },
 *
 *     // When size > 10px, draw a cube
 *
 *     new SceneJS.objects.Cube(),
 *
 *     // When size > 200px,  draw a low-detail sphere
 *
 *     new SceneJS.objects.Sphere({
 *         radius: 1,
 *         slices:10,
 *         rings:10
 *     }),
 *
 *     // When size > 400px, draw a medium-detail sphere
 *
 *     new SceneJS.objects.Sphere({
 *         radius: 1,
 *         slices:20,
 *         rings:20
 *     }),
 *
 *     // When size > 600px, draw a high-detail sphere
 *
 *     new SceneJS.objects.Sphere({
 *         radius: 1,
 *         slices:120,
 *         rings:120
 *     })
 * )
 * </code></pre>
 * @extends SceneJS.Node
 * @constructor
 * Create a new SceneJS.boundingBox
 * @param {Object} config Configuration object, followed by zero or more child nodes
 */
SceneJS.BoundingBox = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType="boundingBox";
    this._xmin = 0;
    this._ymin = 0;
    this._zmin = 0;
    this._xmax = 0;
    this._ymax = 0;
    this._zmax = 0;
    this._levels = null;
    this._states = [];
    this._objectsCoords = null;  // Six object-space vertices for memo level 1
    this._viewBox = null;         // Axis-aligned view-space box for memo level 2
    if (this._fixedParams) {
        this._init(this._getParams());
    }
};

SceneJS._inherit(SceneJS.BoundingBox, SceneJS.Node);

/**
 * Sets the minimum X extent
 *
 * @function {SceneJS.BoundingBox} setXMin
 * @param {float} xmin Minimum X extent
 * @returns {SceneJS.BoundingBox} this
 */
SceneJS.BoundingBox.prototype.setXMin = function(xmin) {
    this._xmin = xmin;
    this._memoLevel = 0;
    return this;
};

/**
 * Gets the minimum X extent
 *
 * @function {float} getXMin
 * @returns {float} Minimum X extent
 */
SceneJS.BoundingBox.prototype.getXMin = function() {
    return this._xmin;
};

/**
 * Sets the minimum Y extent
 *
 * @function  {SceneJS.BoundingBox} setYMin
 * @param {float} ymin Minimum Y extent
 * @returns {SceneJS.BoundingBox} this
 */
SceneJS.BoundingBox.prototype.setYMin = function(ymin) {
    this._ymin = ymin;
    this._memoLevel = 0;
    return this;
};

/**
 * Gets the minimum Y extent
 * @function {float} getYMin
 * @returns {float} Minimum Y extent
 */
SceneJS.BoundingBox.prototype.getYMin = function() {
    return this._ymin;
};

/**
 * Sets the minimum Z extent
 *
 * @function {SceneJS.BoundingBox} setZMin
 * @param {float} zmin Minimum Z extent
 * @returns {SceneJS.BoundingBox} this
 */
SceneJS.BoundingBox.prototype.setZMin = function(zmin) {
    this._zmin = zmin;
    this._memoLevel = 0;
    return this;
};

/**
 * Gets the minimum Z extent
 * @function {float} getZMin
 * @returns {float} Minimum Z extent
 */
SceneJS.BoundingBox.prototype.getZMin = function() {
    return this._zmin;
};

/**
 * Sets the maximum X extent
 *
 * @function  {SceneJS.BoundingBox} setXMax
 * @param {float} xmax Maximum X extent
 * @returns {SceneJS.BoundingBox} this
 */
SceneJS.BoundingBox.prototype.setXMax = function(xmax) {
    this._xmax = xmax;
    this._memoLevel = 0;
    return this;
};

/**
 * Gets the maximum X extent
 * @function  {SceneJS.BoundingBox} setXMax
 * @returns {float} Maximum X extent
 */
SceneJS.BoundingBox.prototype.getXMax = function() {
    return this._xmax;
};

/**
 * Sets the maximum Y extent
 *
 * @function {SceneJS.BoundingBox} setYMax
 * @param {float} ymax Maximum Y extent
 * @returns {SceneJS.BoundingBox} this
 */
SceneJS.BoundingBox.prototype.setYMax = function(ymax) {
    this._ymax = ymax;
    this._memoLevel = 0;
    return this;
};

/**
 * Gets the maximum Y extent
 * @function {float} getYMax
 * @return {float} Maximum Y extent
 */
SceneJS.BoundingBox.prototype.getYMax = function() {
    return this._ymax;
};

/**
 * Sets the maximum Z extent
 *
 * @function {SceneJS.BoundingBox} setZMax
 * @param {float} zmax Maximum Z extent
 * @returns {SceneJS.BoundingBox} this
 */
SceneJS.BoundingBox.prototype.setZMax = function(zmax) {
    this._zmax = zmax;
    this._memoLevel = 0;
    return this;
};

/**
 * Gets the maximum Z extent
 * @function {float} getZMax
 * @returns {float} Maximum Z extent
 */
SceneJS.BoundingBox.prototype.getZMax = function() {
    return this._zmax;
};

/**
 * Sets all extents
 * @function {SceneJS.BoundingBox} setBoundary
 * @param {Object} boundary All extents, Eg. { xmin: -1.0, ymin: -1.0, zmin: -1.0, xmax: 1.0, ymax: 1.0, zmax: 1.0}
 * @returns {SceneJS.BoundingBox} this
 */
SceneJS.BoundingBox.prototype.setBoundary = function(boundary) {
    this._xmin = boundary.xmin || 0;
    this._ymin = boundary.ymin || 0;
    this._zmin = boundary.zmin || 0;
    this._xmax = boundary.xmax || 0;
    this._ymax = boundary.ymax || 0;
    this._zmax = boundary.zmax || 0;
    this._memoLevel = 0;
    return this;
};

/**
 * Gets all extents
 * @function {Object} getBoundary
 * @returns {Object} All extents, Eg. { xmin: -1.0, ymin: -1.0, zmin: -1.0, xmax: 1.0, ymax: 1.0, zmax: 1.0}
 */
SceneJS.BoundingBox.prototype.getBoundary = function() {
    return {
        xmin: this._xmin,
        ymin: this._ymin,
        zmin: this._zmin,
        xmax: this._xmax,
        ymax: this._ymax,
        zmax: this._zmax
    };
};

// @private
SceneJS.BoundingBox.prototype._init = function(params) {
    this._xmin = params.xmin || 0;
    this._ymin = params.ymin || 0;
    this._zmin = params.zmin || 0;
    this._xmax = params.xmax || 0;
    this._ymax = params.ymax || 0;
    this._zmax = params.zmax || 0;
    if (params.levels) {
        if (params.levels.length != this._children.length) {
            SceneJS_errorModule.fatalError(new SceneJS.NodeConfigExpectedException
                    ("SceneJS.boundingBox levels property should have a value for each child node"));
        }

        for (var i = 1; i < params.levels.length; i++) {
            if (params.levels[i - 1] >= params.levels[i]) {
                SceneJS_errorModule.fatalError(new SceneJS.NodeConfigExpectedException
                        ("SceneJS.boundingBox levels property should be an ascending list of unique values"));
            }
        }
        this._levels = params.levels;
    }
};

// @private
SceneJS.BoundingBox.prototype._render = function(traversalContext, data) {
    if (this._memoLevel == 0) {
        if (!this._fixedParams) {
            this._init(this._getParams(data));
        } else {
            this._memoLevel = 1;
        }
        var modelTransform = SceneJS_modelTransformModule.getTransform();
        if (!modelTransform.identity) {

            /* Model transform exists
             */
            this._objectCoords = [
                [this._xmin, this._ymin, this._zmin],
                [this._xmax, this._ymin, this._zmin],
                [this._xmax, this._ymax, this._zmin],
                [this._xmin, this._ymax, this._zmin],
                [this._xmin, this._ymin, this._zmax],
                [this._xmax, this._ymin, this._zmax],
                [this._xmax, this._ymax, this._zmax],
                [this._xmin, this._ymax, this._zmax]
            ];
        } else {

            /* No model transform
             */
            this._viewBox = {
                min: [this._xmin, this._ymin, this._zmin],
                max: [this._xmax, this._ymax, this._zmax]
            };
            this._memoLevel = 2;
        }
    }

    if (this._memoLevel < 2) {
        var modelTransform = SceneJS_modelTransformModule.getTransform();
        this._viewBox = new SceneJS_math_Box3().fromPoints(
                SceneJS_math_transformPoints3(
                        modelTransform.matrix,
                        this._objectCoords)
                );
        if (modelTransform.fixed && this._memoLevel == 1 && (!SceneJS_instancingModule.instancing())) {
            this._objectCoords = null;
            this._memoLevel = 2;
        }
    }
    if (SceneJS_localityModule.testAxisBoxIntersectOuterRadius(this._viewBox)) {
        if (SceneJS_localityModule.testAxisBoxIntersectInnerRadius(this._viewBox)) {
            var result = SceneJS_frustumModule.testAxisBoxIntersection(this._viewBox);
            switch (result) {
                case SceneJS_math_INTERSECT_FRUSTUM:  // TODO: GL clipping hints
                case SceneJS_math_INSIDE_FRUSTUM:
                    if (this._levels) { // Level-of-detail mode
                        var size = SceneJS_frustumModule.getProjectedSize(this._viewBox);
                        for (var i = this._levels.length - 1; i >= 0; i--) {
                            if (this._levels[i] <= size) {
                                var state = this._states[i];
                                this._renderNode(i, traversalContext, data);
                                return;
                            }
                        }
                    } else {
                        this._renderNodes(traversalContext, data);
                    }
                    break;

                case SceneJS_math_OUTSIDE_FRUSTUM:
                    break;
            }
        } else {

            /* Allow content staging for subgraph
             */

            // TODO:

            this._renderNodes(traversalContext, data);
        }
    }
};

/** Returns a new SceneJS.BoundingBox instance
 * @param {Arguments} args Variable arguments that are passed to the SceneJS.BoundingBox constructor
 * @returns {SceneJS.BoundingBox}
 */
SceneJS.boundingBox = function() {
    var n = new SceneJS.BoundingBox();
    SceneJS.BoundingBox.prototype.constructor.apply(n, arguments);
    return n;
};
