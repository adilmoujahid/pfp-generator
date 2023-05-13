// Variables
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const gridCanvas = document.getElementById("gridCanvas");
const gridCtx = gridCanvas.getContext("2d");
const assets = document.getElementById("assets");


let canvasSize = parseInt(document.getElementById("canvasSize").value);
let gridSize = parseInt(document.getElementById("gridSize").value);
canvas.width = gridCanvas.width = canvasSize * gridSize;
canvas.height = gridCanvas.height = canvasSize * gridSize;

let isDrawing = false;
let isGridVisible = true;
let color = "#000000";

// Initialize the color
setColor(document.getElementById("colorPicker").value);

// Functions

// Sets the color
function updateCanvasSize() {
  canvasSize = parseInt(document.getElementById("canvasSize").value);
  gridSize = parseInt(document.getElementById("gridSize").value);
  canvas.width = gridCanvas.width = canvasSize * gridSize;
  canvas.height = gridCanvas.height = canvasSize * gridSize;
  drawGrid();
}

function setColor(newColor) {
  if (newColor) {
    color = newColor;
    document.getElementById("colorPicker").value = newColor;
  }
}

// Draws the grid on the canvas
function drawGrid() {
  gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
  if (!isGridVisible) return;

  gridCtx.strokeStyle = "rgba(0, 0, 0, 0.1)";
  gridCtx.lineWidth = 1;

  for (let i = 0; i <= canvasSize; i++) {
    gridCtx.beginPath();
    gridCtx.moveTo(i * gridSize, 0);
    gridCtx.lineTo(i * gridSize, gridCanvas.height);
    gridCtx.stroke();
    gridCtx.beginPath();
    gridCtx.moveTo(0, i * gridSize);
    gridCtx.lineTo(gridCanvas.width, i * gridSize);
    gridCtx.stroke();
  }
}

// Draws a pixel on the canvas
function drawPixel(x, y) {
  const size = canvas.width / canvasSize;
  if (color === "transparent") {
    ctx.clearRect(x * size, y * size, size, size);
  } else {
    ctx.fillStyle = color;
    ctx.fillRect(x * size, y * size, size, size);
  }
}


// Gets the index of the clicked pixel on the canvas
function getIndex(x, y) {
  const size = canvas.width / canvasSize;
  return { i: Math.floor(x / size), j: Math.floor(y / size) };
}

// Exports the selected images
function exportImages(listId) {
  const list = document.getElementById(listId);
  const assetContainers = list.getElementsByClassName("asset-container");

  Array.from(assetContainers).forEach((container, index) => {
    const checkbox = container.querySelector(".asset-checkbox");
    if (!checkbox.checked) return;

    const img = container.querySelector(".saved-image");
    setTimeout(() => {
      const link = document.createElement("a");
      link.href = img.src;
      link.download = `asset_${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 100 * index);
  });
}



// Resizes a saved image to fit the canvas size.
function resizeSavedImage(img) {
  const size = canvasSize * gridSize;
  const ratio = Math.min(size / img.naturalWidth, size / img.naturalHeight);
  img.width = img.naturalWidth * ratio;
  img.height = img.naturalHeight * ratio;
}

// Loads a saved image onto the canvas.
function loadSavedImage(savedImage) {
  const targetSize = canvasSize * gridSize;

  // If the saved image's dimensions match the canvas size, draw the image.
  if (targetSize === savedImage.naturalWidth && targetSize === savedImage.naturalHeight) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(savedImage, 0, 0, savedImage.naturalWidth, savedImage.naturalHeight, 0, 0, targetSize, targetSize);
    displayColors(getColorsInCanvas());
  } else {
    // Calculate the new size of the image to fit the canvas
    const ratio = Math.min(canvas.width / savedImage.naturalWidth, canvas.height / savedImage.naturalHeight);
    const newWidth = savedImage.naturalWidth * ratio;
    const newHeight = savedImage.naturalHeight * ratio;

    // Clear the canvas and draw the resized image
    //ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(savedImage, 0, 0, savedImage.naturalWidth, savedImage.naturalHeight, 0, 0, newWidth, newHeight);

    // Display a message about the resizing
    //alert(`The image has been resized from the original size (${savedImage.naturalWidth}x${savedImage.naturalHeight}) to fit the canvas size (${newWidth.toFixed(0)}x${newHeight.toFixed(0)}).`);

    displayColors(getColorsInCanvas());
  }
}

// Detects all the unique colors in the canvas.
function getColorsInCanvas() {
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const colors = new Set();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a === 0) continue;

    const color = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
    colors.add(color);
  }

  return Array.from(colors);
}

// Takes an array of colors and displays them under "Colors" in the sidebar.
function displayColors(colors) {
  const colorsList = document.getElementById("colorsList");
  colorsList.innerHTML = "";

  colors.forEach(color => {
    const colorDiv = document.createElement("div");
    colorDiv.style.backgroundColor = color;
    colorDiv.style.width = "20px";
    colorDiv.style.height = "20px";
    colorDiv.style.border = "1px solid #000";
    colorDiv.style.display = "inline-block";
    colorDiv.style.margin = "2px";
    colorDiv.style.cursor = "pointer";
    colorDiv.title = color;
    colorDiv.addEventListener("click", () => {
      // Create and configure the color input
      const input = document.createElement("input");
      input.type = "color";
      input.value = color;
      input.style.position = "absolute";
      input.style.opacity = 0;
      input.style.width = "20px";
      input.style.height = "20px";
      input.style.cursor = "pointer";
      input.addEventListener("change", (e) => {
        // Update the color of the colorDiv and the canvas
        const oldColor = colorDiv.style.backgroundColor;
        const newColor = e.target.value;
        colorDiv.style.backgroundColor = newColor;
        updateColorOnCanvas(oldColor, newColor);
      });

      // Append the color input to the colorDiv and trigger a click event to open the color picker
      colorDiv.appendChild(input);
      input.click();
      input.addEventListener("blur", () => {
        colorDiv.removeChild(input);
      });
    });

    colorsList.appendChild(colorDiv);
  });
}

// Converts an RGBA color string to a hexadecimal color string
function rgbaToHex(rgba) {
  // Extracts the rgba values from the input string
  const parts = rgba.match(/[\d.]+/g);

  // Converts the rgba values to hexadecimal and concatenates the result
  return "#" + parts.slice(0, 3).map((x) => {
    const hex = parseInt(x).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

// Converts a hexadecimal color string to an RGB color string
function hexToRgbA(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgb(${r}, ${g}, ${b})`;
}

// Updates the color of the canvas with the new color
function updateColorOnCanvas(oldColor, newColor) {
  // Get image data from the canvas
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Convert colors to hexadecimal and RGB formats
  const oldColorHex = rgbaToHex(oldColor);
  const newColorHex = newColor;
  const newColorRGB = hexToRgbA(newColor);

  // Iterate over the image data to find and replace the old color with the new color
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a === 0) continue;

    const currentColorHex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    if (currentColorHex === oldColorHex) {
      const rgba = newColorRGB.match(/[\d.]+/g);
      data[i] = rgba[0];
      data[i + 1] = rgba[1];
      data[i + 2] = rgba[2];
    }
  }

  // Update the canvas with the modified image data
  ctx.putImageData(imgData, 0, 0);
}

// Event listeners and UI interactions

// Update the canvas size when the "Grid Size" dropdown value changes
document.getElementById("gridSize").addEventListener("change", () => {
  updateCanvasSize();
});

// Draw on canvas when mouse button is pressed
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  const { i, j } = getIndex(e.offsetX, e.offsetY);
  drawPixel(i, j);
});

// Continue drawing on canvas when mouse moves
canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing) return;
  const { i, j } = getIndex(e.offsetX, e.offsetY);
  drawPixel(i, j);
});

// Stop drawing when mouse button is released
canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  displayColors(getColorsInCanvas());
});

// Stop drawing when mouse leaves the canvas
canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
});

// Update the current color when the color picker value changes
document.getElementById("colorPicker").addEventListener("input", (e) => {
  setColor(e.target.value);
});

// Clear the canvas when the "Clear Canvas" button is clicked
document.getElementById("clearCanvas").addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Toggle grid visibility when the "Toggle Grid" button is clicked
document.getElementById("toggleGrid").addEventListener("click", () => {
  isGridVisible = !isGridVisible;
  drawGrid();
});

// Save the current canvas as an asset when the "Save Asset" button is clicked
document.getElementById("saveAsset").addEventListener("click", () => {
  // Get the assets list container
  const list = document.getElementById("assetsList");

  // Create an image element for the saved asset
  const img = document.createElement("img");
  img.src = canvas.toDataURL();
  img.classList.add("saved-image");
  resizeSavedImage(img);

  // Add an event listener to load the saved asset when clicked
  img.addEventListener("click", () => {
    loadSavedImage(img);
  });

  // Create a checkbox element for the saved asset
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.classList.add("asset-checkbox");

  // Create an asset container and append the checkbox and image elements
  const assetContainer = document.createElement("div");
  assetContainer.classList.add("asset-container");
  assetContainer.appendChild(checkbox);
  assetContainer.appendChild(img);
  list.appendChild(assetContainer);
});

// Update the canvas size when the "Canvas Size" dropdown value changes
document.getElementById("canvasSize").addEventListener("change", (e) => {
  updateCanvasSize();
});

// Export assets when the "Export Assets" button is clicked
document.getElementById("exportAssets").addEventListener("click", () => {
  exportImages("assetsList");
});


// Toggle transparency when the checkbox is clicked
document.getElementById("toggleTransparency").addEventListener("change", (e) => {
  if (e.target.checked) {
    color = "transparent";
  } else {
    setColor(document.getElementById("colorPicker").value);
  }
});


// Resize all saved images in the assets list
function resizeAllSavedImages() {
  const savedImages = document.querySelectorAll(".saved-image");
  savedImages.forEach((img) => {
    resizeSavedImage(img);
  });
}

// Resize all saved images when the window loads
window.onload = () => {
  resizeAllSavedImages();
};

// Draw the initial grid on the canvas
drawGrid();



// PFP Generator

// DOM elements
const backgroundInput = document.getElementById('background-input');
const backgroundDropdown = document.getElementById('background-dropdown'); 
const bodyInput = document.getElementById('body-input');
const bodyDropdown = document.getElementById('body-dropdown');
const backgrounds = []; 
const bodies = [];
const traits = {};

// Event listeners
backgroundInput.addEventListener('change', handleBackgroundUpload);
bodyInput.addEventListener('change', handleBodyUpload);
document.getElementById('upload-trait').addEventListener('click', handleTraitUpload);

// Handle background upload (New)
function handleBackgroundUpload(e) {
  const files = e.target.files;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileReader = new FileReader();

    fileReader.onload = (e) => {
      const image = new Image();
      image.src = e.target.result;

      const backgroundData = {
        name: file.name,
        image: image,
      };
      backgrounds.push(backgroundData);

      updateBackgroundDropdown();
    };

    fileReader.readAsDataURL(file);
  }
}

// Update background dropdown (New)
function updateBackgroundDropdown() {
  backgroundDropdown.innerHTML = '';

  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = 'Select an option';
  backgroundDropdown.appendChild(emptyOption);

  for (let i = 0; i < backgrounds.length; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = backgrounds[i].name;
    backgroundDropdown.appendChild(option);
  }
}

// Handle body upload
function handleBodyUpload(e) {
  const files = e.target.files;

  // Loop through the selected files
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileReader = new FileReader();

    fileReader.onload = (e) => {
      const image = new Image();
      image.src = e.target.result;

      // Store image and name together in an object
      const bodyData = {
        name: file.name,
        image: image,
      };
      bodies.push(bodyData);

      // Update body dropdown
      updateBodyDropdown();
    };

    fileReader.readAsDataURL(file);
  }
}

// Update body dropdown
function updateBodyDropdown() {
  // Clear previous options
  bodyDropdown.innerHTML = '';

  // Add an empty option
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = 'Select an option';
  bodyDropdown.appendChild(emptyOption);

  // Add new options
  for (let i = 0; i < bodies.length; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = bodies[i].name;
    bodyDropdown.appendChild(option);
  }
}

// Handle trait upload
function handleTraitUpload() {
  const traitName = document.getElementById('trait-name').value;
  const files = document.getElementById('trait-input').files;

  if (!traitName || files.length === 0) {
    alert('Please enter a trait name and select images.');
    return;
  }

  traits[traitName] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileReader = new FileReader();

    fileReader.onload = (e) => {
      const image = new Image();
      image.src = e.target.result;

      // Store image and name together in an object
      const traitData = {
        name: file.name,
        image: image,
      };
      traits[traitName].push(traitData);

      // Update trait dropdown
      updateTraitDropdown(traitName);
    };

    fileReader.readAsDataURL(file);
  }
}

// Update trait dropdown
function updateTraitDropdown(traitName) {
  // Check if a dropdown for this trait already exists
  let traitDropdown = document.getElementById(`trait-dropdown-${traitName}`);

  // If not, create a new dropdown and label
  if (!traitDropdown) {
    const label = document.createElement('label');
    label.textContent = traitName;

    traitDropdown = document.createElement('select');
    traitDropdown.id = `trait-dropdown-${traitName}`;

    const container = document.getElementById('trait-dropdown-container');
    container.appendChild(label);
    container.appendChild(traitDropdown);

    // Add a break between dropdown menus
    const lineBreak = document.createElement('br');
    container.appendChild(lineBreak);
  } else {
    // Clear existing options
    traitDropdown.innerHTML = '';
  }

  // Add new options
  const traitImages = traits[traitName];

  // Add an empty option
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = 'Select an option';
  traitDropdown.appendChild(emptyOption);

  for (let i = 0; i < traitImages.length; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = traitImages[i].name;
    traitDropdown.appendChild(option);
  }
}



// New function for drawing the selected body and traits
function drawSelectedBackgroundBodyAndTraits(selectedBackground, selectedBody, selectedTraits) {
  if (selectedBackground !== null) {
    loadSavedImage(selectedBackground.image);
  }
  if (selectedBody !== null) {
    loadSavedImage(selectedBody.image);
  }
  if (selectedTraits.length > 0) {
    for (let trait of selectedTraits) {
      if (trait !== null) {
        loadSavedImage(trait.image);
      }
    }
  }
}
// Update the "Generate PFP" button's event listener
document.getElementById('generatePFP').addEventListener('click', () => {
  
  // Update selectedBackground (New)
  const selectedBackground = backgroundDropdown.value ? backgrounds[parseInt(backgroundDropdown.value)] : null;

  // Update selectedBody
  const selectedBody = bodyDropdown.value ? bodies[parseInt(bodyDropdown.value)] : null;
  
  // Update selectedTraits
  const selectedTraits = [];
  const traitDropdownContainer = document.getElementById('trait-dropdown-container');
  const traitDropdowns = traitDropdownContainer.getElementsByTagName('select');
  
  for (let i = 0; i < traitDropdowns.length; i++) {
    const traitDropdown = traitDropdowns[i];
    const traitName = traitDropdown.id.replace('trait-dropdown-', '');
    const selectedIndex = traitDropdown.value ? parseInt(traitDropdown.value) : null;

    if (selectedIndex !== null) {
      selectedTraits.push(traits[traitName][selectedIndex]);
    }
  }
  
  drawSelectedBackgroundBodyAndTraits(selectedBackground, selectedBody, selectedTraits);
});
