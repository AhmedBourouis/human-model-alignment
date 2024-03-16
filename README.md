# human-model-alignment
The following is the code for the implementation and deployment of the web interface for the user study conducted in our CVPR'24 paper https://ahmedbourouis.github.io/Scene_Sketch_Segmentation/

# Sketch groups
We identified four distinct sketch groups that are challenging for our model: 
1. Ambiguous sketches: sketches where it might be hard even for a human observer to understand an input sketch;
2.  Interchangeable categories: sketches containing multiple objects with labels that can interchange each other, like ‘tower’ and ‘building’, or ‘girl’ and ‘man’;
3. Correlated categories: sketches with categories that typically co-occur in scenes, e.g., ‘train’- ‘railway’ and ‘airplane’-‘runway’; and
4. merous-categories: sketches with six or more categories.

We supplement these four groups with sketches where our model labels correctly more than 80% of pixels: 

5. Strong performance.
