var e=`### Your Original Case

Section 5.2.2 used Marching Squares to extract isocontours from Crime data. The original code was a screenshot placeholder.

### Embedded Theory

-   <strong>How Marching Squares works</strong>: discretize the scalar field into a grid. For each cell, the “above threshold / not” state of its 4 corners yields a case index from 0 to 15 (24 = 16 cases). Each case corresponds to 0, 1, or 2 line segments that separate the “above-threshold” region from the “not” region.
-   <strong>16 cases</strong>: encoded as bit0=BL, bit1=BR, bit2=TR, bit3=TL.
-   <strong>Extension to 3D</strong>: Marching Cubes (Lorensen & Cline, 1987), with 28 = 256 cases, widely used for extracting isosurfaces from medical MRI / CT scans.
-   <strong>Application scenarios</strong>:
    -   Terrain contour lines (maps)
    -   Medical imaging (MRI / CT isosurfaces)
    -   Density contours (kernel density estimation)
    -   Weather forecasting (isotherms, isobars)
`;export{e as default};