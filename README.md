# PrimeShot - Screenshot & Annotation Tool

PrimeShot is a powerful Chrome extension for capturing, annotating, and sharing screenshots with ease. It provides a complete suite of annotation tools, text detection, and image manipulation features.

<img width="1365" height="598" alt="image" src="https://github.com/user-attachments/assets/913745bb-bc57-48a4-a848-0e45c78c4b71" />


## Features

### Core Functionality

- **Screenshot Capture**: Capture full page, visible area, or custom selection
- **Selection Tool**: Select specific areas of the page to annotate
- **Live Preview**: See real-time preview of your screenshot before saving

### Drawing Tools

- **Pen Tool (P)**: Draw freehand annotations with customizable color and width
- **Line Tool (L)**: Draw straight lines between two points
- **Arrow Tool (A)**: Draw arrows with arrowheads for directional annotations
- **Rectangle Tool (R)**: Create rectangular shapes and outlines
- **Circle Tool (C)**: Draw circles and ellipses
- **Step Counter Tool (N)**: Add numbered step indicators for tutorials and guides
- **Select Tool (S)**: Adjust or change the screenshot selection area

### Enhancement Tools

- **Highlight Tool (H)**: Add semi-transparent colored overlays to emphasize areas
- **Blur Tool (B)**: Pixelate sensitive information (blur/censor areas)
- **Text Tool (T)**: Add and edit text annotations with customizable fonts and sizes

### Text Features

- **Text Detection**: Automatically extract text from screenshots using OCR
- **Text Extraction**: Copy detected text from screenshots
- **Text Annotation**: Add formatted text with custom colors, fonts, and sizes
- **Text Editing**: Edit text annotations after creation
- **Text Repositioning**: Drag text annotations to reposition them

### Advanced Features

- **Color Selection**: Choose from predefined colors or use a color picker
- **Font Selection**: Multiple font options (Arial, Times New Roman, Georgia, and more)
- **Adjustable Line Width**: Customize line thickness for drawing tools
- **Undo Functionality**: Revert the last action with Ctrl+Z or Cmd+Z
- **Annotation Management**: Click to edit or Ctrl+Click to delete annotations
- **Save Screenshots**: Save annotated screenshots as PNG files
- **Print Screenshots**: Print annotated screenshots directly
- **Copy to Clipboard**: Copy screenshots to clipboard for quick sharing

## Installation

### Prerequisites

- Chrome/Chromium browser (version 88 or higher)
- Node.js (for development only)

### Installation Steps

1. **Clone or Download the Repository**

   ```bash
   # If using git
   git clone <repository-url>
   cd Screenshot\ Extension

   # Or download and extract the ZIP file
   ```

2. **Install Dependencies (Optional)**

   ```bash
   npm install
   ```

3. **Load the Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `Screenshot Extension` folder
   - The PrimeShot extension should now appear in your Chrome extensions

4. **Verify Installation**
   - Click the PrimeShot icon in your Chrome toolbar
   - The extension icon should be visible and clickable
   - Keyboard shortcut is `Alt+Shift+S`

## Usage

### Taking a Screenshot

1. Click the PrimeShot icon in the Chrome toolbar, or press `Alt+Shift+S`
2. Select the area you want to capture using the selection tool
3. Adjust the selection by dragging corners or edges if needed
4. The editor will open with the captured screenshot

### Using Annotation Tools

#### Text Tool

1. Select "Text Tool (T)" from the toolbar
2. Click anywhere to create a new text annotation
3. Type your text in the editor
4. Use the toolbar to change:
   - Text color (color picker)
   - Font family (dropdown)
   - Font size (number input)
5. Click "Done" to save or "Cancel" to discard

#### Editing Existing Text

1. Click on any text annotation to edit it
2. Or in Text mode (T), click on existing text
3. Make your changes
4. Click "Done" to save changes
5. Or press Escape/click Cancel to discard

#### Drawing Tools

1. Select a drawing tool (Pen, Line, Arrow, Rectangle, Circle)
2. Click and drag to draw
3. The tool will automatically save when you release the mouse
4. Use the color picker and line width controls to customize appearance

#### Highlight & Blur

1. Select Highlight (H) or Blur (B)
2. Click and drag to select the area to highlight or blur
3. Release to apply the effect

#### Step Counter

1. Select Step Counter (N)
2. Click to add numbered steps
3. Each click increments the step number automatically
4. Use the color picker to customize step colors

### Keyboard Shortcuts

Tool shortcuts work anytime (except while typing in text input):

- `Alt+Shift+S` - Take a screenshot
- `P` - Pen tool
- `L` - Line tool
- `A` - Arrow tool
- `R` - Rectangle tool
- `C` - Circle tool
- `H` - Highlight tool
- `B` - Blur tool
- `T` - Text tool
- `N` - Step counter
- `S` - Selection tool
- `Ctrl+Z` / `Cmd+Z` - Undo last action
- `Escape` - Close editor (when not typing in text input)

### Managing Annotations

- **Edit**: Click on any annotation to edit it
- **Delete**: Ctrl+Click on any annotation to delete it
- **Move**: Drag text annotations by the handle to reposition them
- **Resize Text**: Change font size in the text editor toolbar

### Saving & Sharing

- **Save Screenshot**: Click the save button to download as PNG
- **Copy to Clipboard**: Click copy button to copy the image
- **Print**: Click print button to print the screenshot
- **Extract Text**: Click extract button to detect and copy text from the screenshot

## File Structure

```
Screenshot Extension/
├── README.md                 # This file
├── manifest.json            # Extension manifest
├── package.json             # Project dependencies
│
├── popup.html              # Extension popup UI
├── popup.js                # Popup functionality
├── editor.html             # Screenshot editor interface
├── editor.js               # Main editor logic (1700+ lines)
├── content.js              # Content script for page integration
├── background.js           # Service worker background script
│
├── features/               # Modular annotation tools
│   ├── pen.js             # Pen/freehand drawing tool
│   ├── line.js            # Line drawing tool
│   ├── arrow.js           # Arrow drawing tool
│   ├── rect.js            # Rectangle tool
│   ├── circle.js          # Circle/ellipse tool
│   ├── highlight.js       # Highlight tool
│   ├── blur.js            # Blur/pixelate tool
│   ├── text.js            # Text annotation tool
│   └── step.js            # Step counter tool
│
├── src/
│   ├── core/
│   │   └── canvas.js      # Canvas utilities
│   ├── features/
│   │   └── text-extraction/
│   │       ├── index.js   # Text extraction module
│   │       ├── ocr.js     # OCR functionality
│   │       └── text-panel.js # Text detection UI
│   ├── shared/
│   │   └── state.js       # Shared state management
│   └── utils/
│       ├── clipboard.js   # Clipboard utilities
│       ├── dom.js         # DOM utilities
│       └── toast.js       # Toast notification utility
│
├── lib/
│   └── ocrad.js           # OCR library (OCRAD.js)
│
├── styles.css             # Global styles
├── icons/                 # Extension icons
└── ocr-sandbox.html       # OCR sandbox environment
```

## Architecture

### Modular Tool System

The extension uses a modular architecture where each annotation tool is implemented as an independent module:

```javascript
// Each tool follows a consistent interface
window.TOOLS.toolName = {
  render(ctx, annotation)           // Draw completed annotation
  renderPreview(ctx, state)          // Draw preview while drawing
  create(x, y, color, lineWidth)    // Create new annotation
  update(x, y)                       // Update position during drawing
  finish(annotation)                 // Finalize annotation
  shouldSave(annotation)             // Validate before saving
}
```

### State Management

The editor maintains a global STATE object containing:

- Current tool mode
- Color and line width settings
- Selected area coordinates
- Annotations array
- Drawing state flags

### Event Handling

- Mouse events (down/move/up) drive the drawing workflow
- Keyboard shortcuts trigger tool selection
- Escape key cancels current operations
- Ctrl+Z triggers undo functionality

## Development

### Setting Up Development Environment

1. Navigate to the project directory
2. Install dependencies:

   ```bash
   npm install
   ```

3. Modifying Features:
   - Edit tool files in the `features/` folder
   - Each tool is a self-contained module
   - Changes are automatically reflected after reloading in Chrome

4. Adding New Tools:
   - Create a new file in `features/new-tool.js`
   - Implement the standard tool interface
   - Add the script reference to `editor.html`
   - Add the tool to `TOOL_REGISTRY` in `editor.js`

### Testing

1. After making changes, reload the extension in `chrome://extensions/`
2. Test the functionality in a browser tab
3. Check the console for errors (Right-click > Inspect > Console)

## Known Limitations

- Text extraction (OCR) requires internet connection for some operations
- Some annotation tools may have minor rendering differences across browsers
- Blur effect performance depends on selection size
- Maximum screenshot size limited by browser memory

## Browser Compatibility

- Chrome 88+
- Chromium 88+
- Edge 88+ (Chromium-based)

## Version History

### v1.2.3

- Minor bug fixes and performance improvements

### v1.2.1

- Rebranded to PrimeShot
- Improved internal naming consistency

### v1.2.0

- Improved text annotation interface with toolbar
- Added support for text repositioning and editing
- Fixed coordinate system for accurate text clicking
- Enhanced tool modularization
- Added step counter tool

### v1.1.0

- Added text extraction (OCR) functionality
- Improved annotation management
- Better keyboard shortcuts

### v1.0.0

- Initial release
- Core annotation tools
- Screenshot capture functionality

## Troubleshooting

### Extension not appearing in toolbar

- Ensure it's loaded in `chrome://extensions/`
- Check that "Developer mode" is enabled
- Try reloading the extension

### Screenshots not saving

- Check browser permissions for file downloads
- Ensure sufficient disk space
- Try clearing browser cache

### Text annotations not clickable

- Make sure you're clicking within the text area
- Ensure the text tool is properly loaded
- Try reloading the extension

### OCR/Text extraction not working

- Check internet connection
- Verify the OCR sandbox is properly configured
- Check browser console for errors

## Contributing

When contributing to this project:

1. Follow the existing code style
2. Maintain the modular architecture
3. Update the README with new features
4. Test thoroughly before submitting changes
5. Keep the tool interface consistent

## License

This project is provided as-is for educational and personal use.

## Support

For issues, feature requests, or contributions, please refer to the project repository.

---

Last Updated: February 2026

# PrimeShot
