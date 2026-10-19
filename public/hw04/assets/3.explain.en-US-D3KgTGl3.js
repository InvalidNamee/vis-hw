var e=`### Why do we need a Lab gamut diagram?

RGB space is a cube, but you cannot tell "which colors actually exist and which would be distorted". CIE Lab is a perceptually uniform space, <strong>distance ≈ perceived difference</strong>, and is the standard for designing colormaps and checking gamut.

### Three gamuts (nested relationship)

-   <strong>sRGB</strong>: universal screen standard (Web / PPT / general scientific figures)
-   <strong>Adobe RGB</strong>: photography / print, wider green gamut
-   <strong>Rec.2020</strong>: 4K TV / HDR, the largest gamut

Colors outside sRGB (e.g., highly saturated pure green) <strong>cannot be displayed</strong> on ordinary screens and get clamped.

### Practical usage

-   When converting from \`d3.lab(L, a, b).rgb()\`, colors outside sRGB are clamped automatically
-   When designing colormaps, use \`d3.interpolateLab\` (interpolates in Lab space), which is far smoother than \`d3.interpolateRgb\`
-   Highly saturated colors only "exist" on print / 4K screens, and may not look accurate on the Web
`;export{e as default};