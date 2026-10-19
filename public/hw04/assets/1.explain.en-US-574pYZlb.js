var e=`### Why learn color models?

When designing a colormap, <strong>do not interpolate directly in RGB</strong>—because RGB is not perceptually uniform (255,0,0 and 0,255,0 "look" very different in lightness). You need a perceptually uniform color space (Lab / HCL) to interpolate and get smooth gradients.

### The 4 major color spaces

-   <strong>RGB</strong>: additive model, device-dependent. The default for screen display.
-   <strong>HSL</strong>: artist-friendly (independent hue / saturation / lightness), but <strong>still not perceptually uniform</strong>.
-   <strong>CIE Lab</strong>: perceptually uniform, <strong>the gold standard for designing colormaps</strong>.
-   <strong>CMYK</strong>: subtractive (print). Not used in web visualizations.

### CVD (Color Vision Deficiency)

About 8% of men and 0.5% of women are color-blind. Three common types:

-   <strong>Protanopia (red-blind)</strong>: ~1% of men
-   <strong>Deuteranopia (green-blind)</strong>: ~6% of men (most common)
-   <strong>Tritanopia (blue-blind)</strong>: extremely rare
`;export{e as default};