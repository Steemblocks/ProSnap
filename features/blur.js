/**
 * Blur Tool
 * Pixelated blur effect to hide sensitive info
 */

window.TOOLS = window.TOOLS || {};

window.TOOLS.blur = {
  id: "blur",

  // Render completed annotation
  render(ctx, ann) {
    const x = Math.min(ann.start.x, ann.end.x);
    const y = Math.min(ann.start.y, ann.end.y);
    const w = Math.abs(ann.end.x - ann.start.x);
    const h = Math.abs(ann.end.y - ann.start.y);

    if (w > 0 && h > 0) {
      // Optimization: Cache blurred result to avoid expensive getImageData loop on every frame
      if (ann._cachedData && ann._cachedW === w && ann._cachedH === h) {
        ctx.putImageData(ann._cachedData, x, y);
        return;
      }

      try {
        const pixelSize = 10;
        const imageData = ctx.getImageData(x, y, w, h);
        const data = imageData.data;

        for (let py = 0; py < h; py += pixelSize) {
          for (let px = 0; px < w; px += pixelSize) {
            // Get average color of pixel block
            let r = 0,
              g = 0,
              b = 0,
              count = 0;
            for (let dy = 0; dy < pixelSize && py + dy < h; dy++) {
              for (let dx = 0; dx < pixelSize && px + dx < w; dx++) {
                const i = ((py + dy) * w + (px + dx)) * 4;
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                count++;
              }
            }
            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);

            // Apply average to all pixels in block
            for (let dy = 0; dy < pixelSize && py + dy < h; dy++) {
              for (let dx = 0; dx < pixelSize && px + dx < w; dx++) {
                const i = ((py + dy) * w + (px + dx)) * 4;
                data[i] = r;
                data[i + 1] = g;
                data[i + 2] = b;
              }
            }
          }
        }
        ctx.putImageData(imageData, x, y);

        // Cache the processed data
        ann._cachedData = imageData;
        ann._cachedW = w;
        ann._cachedH = h;
      } catch (e) {
        // Fallback: draw a gray box if we can't access image data
        ctx.fillStyle = "rgba(128, 128, 128, 0.7)";
        ctx.fillRect(x, y, w, h);
      }
    }
  },

  // Render preview while drawing
  renderPreview(ctx, state) {
    if (state.mode !== "blur") return;

    ctx.fillStyle = "rgba(128, 128, 128, 0.7)";
    ctx.fillRect(
      Math.min(state.startPos.x, state.currentPos.x),
      Math.min(state.startPos.y, state.currentPos.y),
      Math.abs(state.currentPos.x - state.startPos.x),
      Math.abs(state.currentPos.y - state.startPos.y),
    );
  },

  // Create new annotation on mouse down
  create(x, y, color, lineWidth) {
    return {
      type: "blur",
      color: color,
      lw: lineWidth,
      start: { x, y },
      end: { x, y },
    };
  },

  // Update end point on mouse move
  update(x, y) {
    return { x, y };
  },

  // Finish annotation
  finish(annotation) {
    return annotation;
  },

  // Check if annotation is valid (must have minimum size for pixelation to work)
  shouldSave(annotation) {
    if (!annotation.start || !annotation.end) return false;
    const w = Math.abs(annotation.end.x - annotation.start.x);
    const h = Math.abs(annotation.end.y - annotation.start.y);
    return w > 10 && h > 10; // Blur needs at least 10px to look good
  },
};
