<template>
  <div class="drawing-board">
    <div class="controls">
      <input
        type="color"
        v-model="color"
        class="color-picker"
        title="Choose color"
      />
      <input
        type="range"
        v-model="lineWidth"
        min="1"
        max="50"
        class="line-width"
        title="Adjust brush size"
      />
      <span class="line-width-value">{{ lineWidth }}</span>
      <button @click="clearCanvas" class="clear-btn">Clear</button>
      <button @click="saveCanvas" class="save-btn">Save</button>
    </div>
    <div class="canvas-container">
      <canvas
        ref="canvas"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
        @touchstart.prevent="handleTouch"
        @touchmove.prevent="handleTouch"
        @touchend.prevent="stopDrawing"
        class="drawing-canvas"
      ></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from "vue";

const canvas = ref(null);
const ctx = ref(null);
const isDrawing = ref(false);
const color = ref("#000000");
const lineWidth = ref(5);
const lastX = ref(0);
const lastY = ref(0);
const scale = ref(1);

const startDrawing = (event) => {
  isDrawing.value = true;
  [lastX.value, lastY.value] = getCoordinates(event);
};

const draw = (event) => {
  if (!isDrawing.value) return;

  const [x, y] = getCoordinates(event);

  ctx.value.beginPath();
  ctx.value.moveTo(lastX.value, lastY.value);
  ctx.value.lineTo(x, y);
  ctx.value.stroke();

  [lastX.value, lastY.value] = [x, y];
};

const stopDrawing = () => {
  isDrawing.value = false;
};

const getCoordinates = (event) => {
  const rect = canvas.value.getBoundingClientRect();
  const scaleX = canvas.value.width / rect.width;
  const scaleY = canvas.value.height / rect.height;

  if (event.touches && event.touches[0]) {
    return [
      (event.touches[0].clientX - rect.left) * scaleX,
      (event.touches[0].clientY - rect.top) * scaleY,
    ];
  }

  return [
    (event.clientX - rect.left) * scaleX,
    (event.clientY - rect.top) * scaleY,
  ];
};

const handleTouch = (event) => {
  const touch = event.touches[0];
  const mouseEvent = new MouseEvent("mousemove", {
    clientX: touch.clientX,
    clientY: touch.clientY,
  });

  if (event.type === "touchstart") {
    startDrawing(mouseEvent);
  } else {
    draw(mouseEvent);
  }
};

const clearCanvas = () => {
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
  ctx.value.beginPath();
  setupContext();
};

const saveCanvas = () => {
  const image = canvas.value.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = image;
  link.download = "drawing.png";
  link.click();
};

const resizeCanvas = () => {
  const rect = canvas.value.getBoundingClientRect();
  scale.value = window.devicePixelRatio || 1;

  // Store the current drawing
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvas.value.width;
  tempCanvas.height = canvas.value.height;
  tempCanvas.getContext("2d").drawImage(canvas.value, 0, 0);

  // Resize the main canvas
  canvas.value.width = rect.width * scale.value;
  canvas.value.height = rect.height * scale.value;
  canvas.value.style.width = `${rect.width}px`;
  canvas.value.style.height = `${rect.height}px`;

  // Restore the drawing
  ctx.value.drawImage(
    tempCanvas,
    0,
    0,
    tempCanvas.width,
    tempCanvas.height,
    0,
    0,
    canvas.value.width,
    canvas.value.height
  );

  setupContext();
};

const setupContext = () => {
  ctx.value.lineCap = "round";
  ctx.value.lineJoin = "round";
  ctx.value.strokeStyle = color.value;
  ctx.value.lineWidth = lineWidth.value * scale.value;
};

onMounted(() => {
  ctx.value = canvas.value.getContext("2d");
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
});

onUnmounted(() => {
  window.removeEventListener("resize", resizeCanvas);
});

watch(color, (newColor) => {
  if (ctx.value) ctx.value.strokeStyle = newColor;
});

watch(lineWidth, (newWidth) => {
  if (ctx.value) ctx.value.lineWidth = newWidth * scale.value;
});
</script>

<style scoped>
.drawing-board {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #f0f0f0;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.controls {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: center;
}

.color-picker {
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
}

.line-width {
  width: 100px;
}

.line-width-value {
  min-width: 20px;
  text-align: center;
}

.clear-btn,
.save-btn {
  padding: 8px 16px;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.clear-btn {
  background-color: #ff4757;
}

.clear-btn:hover {
  background-color: #ff6b81;
}

.save-btn {
  background-color: #2ecc71;
}

.save-btn:hover {
  background-color: #27ae60;
}

.canvas-container {
  width: 100%;
  height: 400px;
  overflow: hidden;
}

.drawing-canvas {
  width: 100%;
  height: 100%;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  touch-action: none;
}

@media (max-width: 600px) {
  .controls {
    flex-wrap: wrap;
    justify-content: center;
  }

  .canvas-container {
    height: 300px;
  }
}
</style>
