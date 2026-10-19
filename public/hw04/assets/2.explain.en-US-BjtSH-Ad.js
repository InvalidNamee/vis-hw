var e=`### Your Original Case

Original section 6.2.1 used line charts to show usage-frequency changes of French names (Marie / Jean / Camille) over decades.  
The original page bundled “word cloud + hover highlight + time-range filter,” but the code only included the key line segments.

### Embedding Chen Wei's Textbook Theory

-   <strong>Essence of the standard time series chart</strong>: a 2D line chart with x = time, y = measure. The advantage is that <strong>change trends in a linear time domain</strong> are immediately clear.
-   <strong>Drawback</strong>: hard to express <strong>periodicity</strong>—hence section 5.3 calendar heatmap and section 5.4 spiral.
-   <strong>Interaction</strong>: hover highlight, tooltip, time-range filtering—the data-journalism standard.
-   <strong>Choosing in practice</strong>: ≤50 points use linear; 50–500 use monotoneX / curveCatmullRom; >500 consider area / box plot.
`;export{e as default};