
# Animated SPLOMs

Using animation to alleviate overdraw in a multiclass scatterplot matrix (SPLOM).

## Parameters

Our tool supports the following URL query parameters. Default values are in bold.

| Parameter | Values | Description |
|:----------|:-------|:------------|
| `animate` | **true**, false | If `true`, enables the animation loop. |
| `prerender` | **true**, false | If `true,`` prerenders the entire dataset before the first animation frame. |
| `shuffle` | true, **false** | If `true`, shuffles the row order every loop through the dataset. |
| `encoding` | **normal**, open, alpha, blend | Changes the point encoding. If `normal`, uses a circle filled by class with a white outline. If `open`, uses a circle with a outline colored by class and no fill. If `alpha`, uses the normal encoding plus alpha blending (turning on transparency). If `blend`, uses the normal encoding plus color blending. |
| `rows` | **1**, 2, ..., n | A positive integer value that controls the number of rows redrawn every animation frame. Must be less than n, the total number of rows in the dataset. |
| `scale` | 0.75, **1.0**, 1.5, ... | A positive floating point value that controls the scale of the SPLOM. Sizes between 0 and 1 will result in a smaller SPLOM, and sizes greater than 1 will increase the SPLOM size. |
