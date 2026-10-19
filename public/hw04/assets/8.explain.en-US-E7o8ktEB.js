var e=`### 3 "classic paper figure" cases

-   <strong>Figure 1: 5-category scatter (Wong palette)</strong>—Nature style
-   <strong>Figure 2: Sequential heatmap (Viridis)</strong>—the most common scientific figure
-   <strong>Figure 3: Red-green contrast (mistake case)</strong>—common but serious

### CVD testing workflow

1.  Export the figure as PNG
2.  Simulate with [Coblis](https://www.color-blindness.com/coblis-color-blindness-simulator/) or [Color Oracle](https://colororacle.org/)
3.  Check whether elements can still be distinguished (lightness contrast / shape / labels)

### Test results

-   Wong / Okabe-Ito / Paul Tol: distinguishable under all 3 types of CVD
-   Red-green contrast: almost the same color to green-blind viewers (most severe)
-   Nature / Science / Cell have been gradually migrating to CVD-friendly palettes
`;export{e as default};