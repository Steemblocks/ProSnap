/**
 * Highlight Tool
 * Semi-transparent colored overlay
 */

window.TOOLS = window.TOOLS || {};

window.TOOLS.highlight = {
  id: "highlight",

  // Render completed annotation
  render(ctx, ann) {
    ctx.save();
    ctx.globalAlpha = 0.25; // Reduced opacity for better dark mode visibility
    ctx.fillStyle = ann.color;
    const w = ann.end.x - ann.start.x;
    const h = ann.end.y - ann.start.y;
    ctx.fillRect(ann.start.x, ann.start.y, w, h);
    ctx.restore();
  },

  // Render preview while drawing
  renderPreview(ctx, state) {
    if (state.mode !== "highlight") return;

    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = state.color;
    ctx.fillRect(
      state.startPos.x,
      state.startPos.y,
      state.currentPos.x - state.startPos.x,
      state.currentPos.y - state.startPos.y,
    );
    ctx.restore();
  },

  // Create new annotation on mouse down
  create(x, y, color, lineWidth) {
    return {
      type: "highlight",
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

  // Check if annotation is valid (must have minimum size)
  shouldSave(annotation) {
    if (!annotation.start || !annotation.end) return false;
    const w = Math.abs(annotation.end.x - annotation.start.x);
    const h = Math.abs(annotation.end.y - annotation.start.y);
    return w > 5 && h > 5;
  },
};
