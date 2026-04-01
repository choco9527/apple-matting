<template>
    <div class="image-editor" @mousemove="updateCursor" @wheel="handleZoom">
      <div class="editor-container">
        <div class="canvas-wrapper" @wheel="handleZoom" @mousemove="updateCursor">
          <div class="canvas-container" 
               :class="[{ 'move': mode === 'move', 'erase': mode === 'erase', 'restore': mode === 'restore' }, backgroundClass]"
               :style="containerStyle"
               @mouseleave="handleMouseLeave"
               @mousedown="startInteraction"
               @mouseup="stopInteraction"
               @mousemove="handleInteraction">
            <canvas ref="displayCanvas" :style="canvasStyle" />
            <canvas ref="fullResCanvas" style="display: none;" />
            <canvas ref="originCanvas" style="display: none;" />
            <div v-if="showCursor && (mode === 'erase' || mode === 'restore')" class="eraser-cursor" :style="cursorStyle"></div>
          </div>
        </div>
      </div>
      <div class="toolbar">
        <el-tooltip :content="t('imageEditor.toolbar.undo')" placement="top">
          <button class="toolbar__button" @click="undo">
            <el-icon><RefreshLeft /></el-icon>
          </button>
        </el-tooltip>

        <el-tooltip :content="t('imageEditor.toolbar.redo')" placement="top">
          <button class="toolbar__button" @click="redo">
            <el-icon><RefreshRight /></el-icon>
          </button>
        </el-tooltip>

        <el-tooltip :content="t('imageEditor.toolbar.zoomIn')" placement="top">
          <button class="toolbar__button" @click="zoomIn">
            <el-icon><ZoomIn /></el-icon>
          </button>
        </el-tooltip>

        <span class="toolbar__text">
          {{ Math.round(zoom * 100) }}%
        </span>

        <el-tooltip :content="t('imageEditor.toolbar.zoomOut')" placement="top">
          <button class="toolbar__button" @click="zoomOut">
            <el-icon><ZoomOut /></el-icon>
          </button>
        </el-tooltip>

        <el-tooltip :content="t('imageEditor.toolbar.resetZoom')" placement="top">
          <button class="toolbar__button" @click="resetZoom">
            <el-icon><FullScreen /></el-icon>
          </button>
        </el-tooltip>

        <el-tooltip :content="t('imageEditor.toolbar.move')" placement="top">
          <button class="toolbar__button" @click="setMode('move')" :class="{ 'active': mode === 'move' }">
            <el-icon><Rank /></el-icon>
          </button>
        </el-tooltip>

        <el-tooltip :content="t('imageEditor.toolbar.erase')" placement="top">
          <button class="toolbar__button" @click="setMode('erase')" :class="{ 'active': mode === 'erase' }">
            <el-icon><Brush /></el-icon>
          </button>
        </el-tooltip>

        <el-tooltip :content="t('imageEditor.toolbar.restore')" placement="top">
          <button class="toolbar__button" @click="setMode('restore')" :class="{ 'active': mode === 'restore' }">
            <el-icon><Back /></el-icon>
          </button>
        </el-tooltip>

        <el-tooltip :content="t('imageEditor.toolbar.complete')" placement="top">
          <button class="toolbar__button" @click="exportImage">
            <el-icon><Select /></el-icon>
          </button>
        </el-tooltip>
        <span class="toolbar__text">
          <input type="range" min="1" max="200" v-model="eraserSize" class="range-input" /> {{ eraserSize }}
        </span>
        <el-popover
          placement="top"
          :width="300"
          trigger="click"
          v-model:visible="showBackgroundPicker"
          :append-to="'body'"
          :z-index="3000"
          :popper-style="{
            zIndex: 3000,
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }"
          :teleported="true"
        >
          <template #reference>
            <el-tooltip :content="t('imageEditor.toolbar.setBackground')" placement="top">
              <button class="toolbar__button" @click="showBackgroundPicker = true" >
                <el-icon><PictureRounded /></el-icon>
              </button>
            </el-tooltip>
          </template>

          <div class="background-picker">
            <el-tabs>
              <el-tab-pane :label="t('imageEditor.background.baseColor')">
                <div class="preset-colors">
                  <div
                    v-for="color in presetColors"
                    :key="color"
                    class="color-item"
                    :class="{ active: selectedColor === color }"
                    :style="getColorItemStyle(color)"
                    @click="handleColorChange(color)"
                  >
                    <el-icon v-if="selectedColor === color"><Check /></el-icon>
                  </div>
                </div>
              </el-tab-pane>

              <el-tab-pane :label="t('imageEditor.background.gradientColor')">
                <div class="gradient-colors">
                  <div
                    v-for="gradient in gradientColors"
                    :key="gradient.name"
                    class="gradient-item"
                    :class="{ active: selectedColor === gradient.value }"
                    :style="{ background: gradient.value }"
                    @click="handleColorChange(gradient.value)"
                  >
                    <span class="gradient-name">{{ gradient.name }}</span>
                    <el-icon v-if="selectedColor === gradient.value"><Check /></el-icon>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>

            <div class="custom-color">
              <span class="label">{{ t('imageEditor.background.customColor') }}</span>
              <el-color-picker
                v-model="selectedColor"
                :teleported="false"
                @change="handleColorChange"
              />
            </div>

          </div>
        </el-popover>
        <el-tooltip  placement="top">
          <template #content>
            <div class="shortcut-help">
              <div>{{ t('imageEditor.shortcuts.title') }}</div>
              <div>{{ t('imageEditor.shortcuts.undo') }}</div>
              <div>{{ t('imageEditor.shortcuts.redo') }}</div>
              <div>{{ t('imageEditor.shortcuts.zoom') }}</div>
              <div>{{ t('imageEditor.shortcuts.reset') }}</div>
              <div>{{ t('imageEditor.shortcuts.move') }}</div>
              <div>{{ t('imageEditor.shortcuts.erase') }}</div>
              <div>{{ t('imageEditor.shortcuts.restore') }}</div>
              <div>{{ t('imageEditor.shortcuts.complete') }}</div>
              <div>{{ t('imageEditor.shortcuts.brushSize') }}</div>
            </div>
          </template>
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted, watch, computed, onUnmounted } from 'vue';
  import { useI18n } from 'vue-i18n';
  import {
    RefreshLeft,
    RefreshRight,
    ZoomIn,
    ZoomOut,
    FullScreen,
    Select,
    Brush,
    Check,
    Rank,
    Back,
    PictureRounded,
    QuestionFilled
  } from '@element-plus/icons-vue'

  // Import color configuration
  import { presetColors, gradientColors } from '@/config/colors'

  const { t } = useI18n();
  
  const displayCanvas = ref(null);
  const fullResCanvas = ref(null);
  const displayCtx = ref(null);
  const fullResCtx = ref(null);
  const isErasing = ref(false);
  const baseImage = ref(null);
  const eraserSize = ref(30);
  
  const showCursor = ref(false);
  const cursorX = ref(0);
  const cursorY = ref(0);
  
  const history = reactive({
    states: [],
    currentIndex: -1,
  });
  
  const props = defineProps({
    initialBase64: {
      type: String,
      default: '',
    },
    originBase64: {
      type: String,
      default: '',
    },
    initialBackground: {
      type: String,
      default: 'transparent'
    }
  });
  
  const emit = defineEmits(['export-image']);
  
  const scale = ref(1);
  
  const zoom = ref(1);
  const offsetX = ref(0);
  const offsetY = ref(0);
  const isDragging = ref(false);
  const dragStartX = ref(0);
  const dragStartY = ref(0);
  const mode = ref('move'); // 默认模式为 'move'
  
  const cursorStyle = computed(() => ({
    top: `${cursorY.value - eraserSize.value * zoom.value / 2}px`,
    left: `${cursorX.value - eraserSize.value * zoom.value / 2}px`,
    width: `${eraserSize.value * zoom.value}px`,
    height: `${eraserSize.value * zoom.value}px`,
    borderRadius: '50%',
    border: '1px solid red',
    position: 'absolute',
    pointerEvents: 'none',
    display: (mode.value === 'erase' || mode.value === 'restore') && showCursor.value ? 'block' : 'none',
  }));
  
  
  const backgroundColor = ref('');
  const backgroundClass = ref('checkerboard-background');
  const showBackgroundPicker = ref(false);
  const selectedColor = ref('transparent');
  const containerStyle = computed(() => {
    // 检查是否是渐变色
    if (backgroundColor.value && backgroundColor.value.includes('gradient')) {
      return {
      background: backgroundColor.value
    }
  }
  // 纯色或透明背景
  return {
    backgroundColor: backgroundColor.value
  }
})
  
  const originCanvas = ref(null);
  const originCtx = ref(null);
  const originImage = ref(null);
  
  const canvasStyle = computed(() => ({
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain'
  }));
  
  watch(() => props.initialBase64, (newVal) => {
    if (newVal) {
      loadImage(newVal);
    }
  }, { immediate: true });
  
  function loadImage(base64) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = base64;
    img.onload = () => {
      baseImage.value = img;
      adjustCanvasSize(img);
      drawImage();
      saveState();
    };
  }
  
  function handleMouseLeave() {
    stopErasing();
    hideCursor();
  }
  
  function adjustCanvasSize(img) {
    const container = displayCanvas.value.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
  
    displayCanvas.value.width = containerWidth;
    displayCanvas.value.height = containerHeight;
  
    fullResCanvas.value.width = img.width;
    fullResCanvas.value.height = img.height;
  
    const imageRatio = img.width / img.height;
    const containerRatio = containerWidth / containerHeight;
  
    let scaledWidth, scaledHeight;
    if (imageRatio > containerRatio) {
      scaledWidth = containerWidth * 0.95;
      scaledHeight = scaledWidth / imageRatio;
    } else {
      scaledHeight = containerHeight * 0.95;
      scaledWidth = scaledHeight * imageRatio;
    }
  
    scale.value = scaledWidth / img.width;
    zoom.value = scale.value;
  
    offsetX.value = (containerWidth - scaledWidth) / 2;
    offsetY.value = (containerHeight - scaledHeight) / 2;
  
    if (originCanvas.value) {
      originCanvas.value.width = img.width;
      originCanvas.value.height = img.height;
    }
  }
  
  function drawImage() {
    if (displayCanvas.value && fullResCanvas.value && baseImage.value) {
      fullResCtx.value.clearRect(0, 0, fullResCanvas.value.width, fullResCanvas.value.height);
      fullResCtx.value.drawImage(baseImage.value, 0, 0, fullResCanvas.value.width, fullResCanvas.value.height);
  
      updateCanvas();
    }
  }
  
  function stopErasing() {
    if (isErasing.value) {
      isErasing.value = false;
      saveState();
    }
  }
  
  function updateCursor(e) {
    const rect = displayCanvas.value.getBoundingClientRect();
    cursorX.value = e.clientX - rect.left;
    cursorY.value = e.clientY - rect.top;
  
    if (cursorX.value < 0 || cursorY.value < 0 || cursorX.value > displayCanvas.value.width || cursorY.value > displayCanvas.value.height) {
      showCursor.value = false;
    } else {
      showCursor.value = true;
    }
  }
  
  function hideCursor() {
    showCursor.value = false;
  }
  
  function saveState() {
    try {
      const imageData = fullResCtx.value.getImageData(
        0, 
        0, 
        fullResCanvas.value.width, 
        fullResCanvas.value.height
      );
      
      if (history.currentIndex < history.states.length - 1) {
        history.states.splice(history.currentIndex + 1);
      }
      history.states.push(imageData);
      history.currentIndex++;
  
      if (history.states.length > 20) {
        history.states.shift();
        history.currentIndex--;
      }
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }
  
  function undo() {
    if (history.currentIndex > 0) {
      history.currentIndex--;
      restoreCanvas(history.states[history.currentIndex]);
    }
  }
  
  function redo() {
    if (history.currentIndex < history.states.length - 1) {
      history.currentIndex++;
      restoreCanvas(history.states[history.currentIndex]);
    }
  }
  
  function restoreCanvas(imageData) {
    try {
      fullResCtx.value.clearRect(0, 0, fullResCanvas.value.width, fullResCanvas.value.height);
      fullResCtx.value.putImageData(imageData, 0, 0);
      updateCanvas();
    } catch (error) {
      console.error('Error restoring canvas:', error);
    }
  }
  
  function exportImage() {
    const base64Data = fullResCanvas.value.toDataURL('image/png');
    emit('export-image', {
      base64: base64Data,
      backgroundColor: selectedColor.value
    });
  }
  
  function handleZoom(e) {
    const rect = displayCanvas.value.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (mouseX >= 0 && mouseX <= rect.width && mouseY >= 0 && mouseY <= rect.height) {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      changeZoomWithFocus(factor, mouseX, mouseY);
    }
  }
  
  function resetZoom() {
    zoom.value = 1;
    offsetX.value = 0;
    offsetY.value = 0;
    updateCanvas();
  }
  
  function setMode(newMode) {
    mode.value = newMode;
  }
  
  function startInteraction(e) {
    if (mode.value === 'move') {
      isDragging.value = true;
      dragStartX.value = e.clientX - offsetX.value;
      dragStartY.value = e.clientY - offsetY.value;
    } else if (mode.value === 'erase' || mode.value === 'restore') {
      isErasing.value = true;
      handleBrush(e);
    }
  }
  
  function stopInteraction() {
    isDragging.value = false;
    if (isErasing.value) {
      stopErasing();
    }
  }
  
  function handleInteraction(e) {
    if (mode.value === 'move' && isDragging.value) {
      offsetX.value = e.clientX - dragStartX.value;
      offsetY.value = e.clientY - dragStartY.value;
      updateCanvas();
    } else if ((mode.value === 'erase' || mode.value === 'restore') && isErasing.value) {
      handleBrush(e);
    }
  }
  
  function updateCanvas() {
    if (displayCanvas.value && fullResCanvas.value) {
      const ctx = displayCanvas.value.getContext('2d');
      const width = displayCanvas.value.width;
      const height = displayCanvas.value.height;
  
      ctx.clearRect(0, 0, width, height);
      
      ctx.save();
      ctx.translate(offsetX.value, offsetY.value);
      ctx.scale(zoom.value, zoom.value);
      ctx.drawImage(fullResCanvas.value, 0, 0);
      ctx.restore();
    }
  }
  
  const handleKeyboard = (event) => {
    // 阻止默认行为
    if (['z', 'y', '+', '-', 'r', 'm', 'e', 't', 'Enter'].includes(event.key)) {
      event.preventDefault();
    }

    // 撤销重做
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key === 'z') {
      undo();
    }
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z') {
      redo();
    }

    // 缩放控制
    if (event.key === '+' || event.key === '=') {
      zoomIn();
    }
    if (event.key === '-' || event.key === '_') {
      zoomOut();
    }
    if (event.key.toLowerCase() === 'r') {
      resetZoom();
    }

    // 模式切换
    if (event.key.toLowerCase() === 'm') {
      setMode('move');
    }
    if (event.key.toLowerCase() === 'e') {
      setMode('erase');
    }
    if (event.key.toLowerCase() === 't') {
      setMode('restore');
    }

    // 完成
    if (event.key === 'Enter') {
      exportImage();
    }

    // 画笔大小调整
    if (event.key === '[') {
      eraserSize.value = Math.max(1, eraserSize.value - 5);
    }
    if (event.key === ']') {
      eraserSize.value = Math.min(200, eraserSize.value + 5);
    }
  };
  
  onMounted(() => {
    displayCtx.value = displayCanvas.value.getContext('2d');
    fullResCtx.value = fullResCanvas.value.getContext('2d');
    originCtx.value = originCanvas.value.getContext('2d');
    
    setBackground(props.initialBackground);
    
    if (props.initialBase64) {
      loadImage(props.initialBase4);
    }
    if (props.originBase64) {
      loadOriginImage(props.originBase64);
    }
    window.addEventListener('keydown', handleKeyboard);
  });
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyboard);
  });
  
  function zoomIn() {
    changeZoom(1.1);
  }
  
  function zoomOut() {
    changeZoom(0.9);
  }
  
  function changeZoom(factor) {
    const oldZoom = zoom.value;
    zoom.value = Math.max(0.1, Math.min(5, zoom.value * factor));
  
    const canvasRect = displayCanvas.value.getBoundingClientRect();
    const centerX = canvasRect.width / 2;
    const centerY = canvasRect.height / 2;
    
    offsetX.value = centerX - (centerX - offsetX.value) * (zoom.value / oldZoom);
    offsetY.value = centerY - (centerY - offsetY.value) * (zoom.value / oldZoom);
  
    updateCanvas();
  }
  
  function changeZoomWithFocus(factor, focusX, focusY) {
    const oldZoom = zoom.value;
    zoom.value = Math.max(0.1, Math.min(5, zoom.value * factor));
  
    offsetX.value = focusX - (focusX - offsetX.value) * (zoom.value / oldZoom);
    offsetY.value = focusY - (focusY - offsetY.value) * (zoom.value / oldZoom);
  
    updateCanvas();
  }
  
  function handleColorChange(color) {
    setBackground(color);
    showBackgroundPicker.value = false;
  }
  
  function setBackground(color) {
    selectedColor.value = color;
    if (color === 'transparent') {
      backgroundColor.value = '';
      backgroundClass.value = 'checkerboard-background';
    } else {
      backgroundColor.value = color;
      backgroundClass.value = '';
    }
  }
  
  function loadOriginImage(base64) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = base64;
    img.onload = () => {
      originImage.value = img;
      if (originCanvas.value) {
        originCanvas.value.width = img.width;
        originCanvas.value.height = img.height;
        originCtx.value.drawImage(img, 0, 0);
      }
    };
  }
  
  function handleBrush(e) {
    if (isErasing.value && displayCtx.value && fullResCtx.value) {
      const rect = displayCanvas.value.getBoundingClientRect();
      const x = (e.clientX - rect.left - offsetX.value) / zoom.value;
      const y = (e.clientY - rect.top - offsetY.value) / zoom.value;
  
      showCursor.value = true;
  
      if (mode.value === 'erase') {
        erase(x, y);
      } else if (mode.value === 'restore') {
        restore(x, y);
      }
  
      updateCanvas();
    }
  }
  
  function erase(x, y) {
    applyBrush(x, y, 'destination-out');
  }
  
  function restore(x, y) {
    const ctx = fullResCtx.value;
    const canvas = fullResCanvas.value;
    const radius = eraserSize.value / 2;
  
    ctx.save();
    
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.clip();
  
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, false);
    ctx.clip();
    ctx.drawImage(originCanvas.value, 0, 0);
  
    ctx.restore();
  }
  
  function applyBrush(x, y, operation) {
    const ctx = fullResCtx.value;
    const canvas = fullResCanvas.value;
    const radius = eraserSize.value / 2;
  
    ctx.save();
    ctx.globalCompositeOperation = operation;
  
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.clip();
  
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, false);
    ctx.fill();
  
    ctx.restore();
  }
  
  const getColorItemStyle = (color) => {
    const style = {
      backgroundColor: color === 'transparent' ? 'transparent' : color,
    }
    
    if (color === 'transparent') {
      style.backgroundImage = `
        linear-gradient(45deg, #ccc 25%, transparent 25%),
        linear-gradient(-45deg, #ccc 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #ccc 75%),
        linear-gradient(-45deg, transparent 75%, #ccc 75%)
      `
      style.backgroundSize = '10px 10px'
      style.backgroundPosition = '0 0, 0 5px, 5px -5px, -5px 0px'
    }
    
    return style
  }
  </script>
  
  <style>
  .el-popper {
    z-index: 3000 !important;
  }
  
  .el-select__popper {
    z-index: 3000 !important;
  }
  
  .el-color-dropdown {
    z-index: 3001 !important;
  }
  
  .el-tooltip__popper {
    z-index: 3002 !important;
  }
  </style>
  
  <style scoped>
  .image-editor {
    width: 100%;
    height: 90vh;
    position: relative;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    background-color: #f5f5f5;
  }
  
  .editor-container {
    flex: 1;
    width: 100%;
    display: flex;
    box-sizing: border-box;
    overflow: hidden;
    padding: 20px 20px 0 20px; /* 调整内边距，底部留给工具栏 */
  }
  
  .canvas-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .canvas-container {
    position: relative;
    border: 1px solid #ccc;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: 1;
  }
  
  .checkerboard-background {
    background-image:
      linear-gradient(45deg, #ccc 25%, transparent 25%),
      linear-gradient(-45deg, #ccc 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #ccc 75%),
      linear-gradient(-45deg, transparent 75%, #ccc 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  }
  
  .canvas-container.move {
    cursor: move;
  }
  
  .canvas-container.erase,
  .canvas-container.restore {
    cursor: none;
  }
  
  canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  
  .eraser-cursor {
    position: absolute;
    background-color: rgba(0, 0, 0, 0.1);
    pointer-events: none;
  }
  
  .toolbar {
    flex: 0 0 auto;
    background-color: rgba(0, 0, 0, 0.5);
    height: 2rem;
    padding: 0 20px;
    margin: 10px 20px 20px 20px;
    border-radius: 4px;
    color: #fff;
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
    position: relative;
    z-index: 2000;
  }
  
  .toolbar__button {
    background-color: transparent;
    border: 0;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    width: 2rem;
    height: 2rem;
    line-height: 1;
    transition: background-color 0.2s;
  }
  
  .toolbar__text {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    color: #fff;
  }
  
  .toolbar__button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .toolbar__button.active {
    background-color: rgba(255, 255, 255, 0.2);
  }
  
  .range-input {
    margin-right: 0.5rem;
  }
  
  .position-relative {
    position: relative;
    z-index: 1001;
  }
  
  .background-picker {
    padding: 12px;
  }
  
  .background-picker .preset-colors {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .background-picker .color-item {
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: 6px;
    cursor: pointer;
    border: 2px solid #e4e7ed;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
  }
  
  .background-picker .color-item:hover {
    transform: scale(1.05);
  }
  
  .background-picker .color-item.active {
    border-color: var(--el-color-primary);
  }
  
  .background-picker .color-item.active .el-icon {
    color: #fff;
    filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
  }
  
  .background-picker .custom-color {
    display: flex;
    justify-content: center;
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
  
  :deep(.el-color-picker__panel) {
    position: absolute;
    z-index: 2001;
  }
  
  .background-picker .gradient-colors {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .background-picker .gradient-item {
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: 6px;
    cursor: pointer;
    border: 2px solid #e4e7ed;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
  }
  
  .background-picker .gradient-item:hover {
    transform: scale(1.05);
  }
  
  .background-picker .gradient-item.active {
    border-color: var(--el-color-primary);
  }
  
  .background-picker .gradient-item.active .el-icon {
    color: #fff;
    filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
  }
  
  .gradient-name {
    color: #fff;
    text-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
    font-size: 12px;
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
  }
  
  .el-icon {
    color: #fff;
    filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
  }
  
  .shortcut-help {
    font-size: 13px;
    line-height: 1.6;
    color: #fff;
    text-align: left;
    padding: 4px;
  }
  
  .shortcut-help div:first-child {
    font-weight: bold;
    margin-bottom: 4px;
    color: #fff;
  }
  
  .shortcut-help div {
    color: rgba(255, 255, 255, 0.9);
  }
  </style>