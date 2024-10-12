import { ref, Ref, onMounted, createApp } from "vue";
import i18n from "@/locals";
import styles from "@/assets/scss/screenAsk.scss?inline";
import { getImage } from "@/utils/helper";
import QuickAsk from "@/components/shortTools/QuickAsk.vue";
import Katex from "@/plugins/katex";

// 截图, 任意框选的函数
async function _createApp(img: string) {
  const _screenDom = document.querySelector("#studygpt-screen-ask");
  if (_screenDom) {
    document.body.removeChild(_screenDom);
  }
  if (img) {
    const askBox = createApp(QuickAsk);
    const { setting: storageSetting } = await chrome.storage.local.get(
      "setting"
    );
    i18n.global.locale.value = storageSetting.displayLanguage || "en";
    //组件传值
    askBox.provide("imgSrc", img);
    askBox.directive("katex", Katex);

    askBox.use(i18n);
    let rootEle: any = document.getElementById("studygpt-screen-ask");
    if (!rootEle) {
      rootEle = document.createElement("div");
      rootEle.id = "studygpt-screen-ask";
    }
    let shadow = rootEle.shadowRoot;
    if (!shadow) {
      shadow = rootEle.attachShadow({ mode: "open" });
    }
    const style = document.createElement("style");
    shadow.appendChild(style);
    style.textContent = styles;
    const wrap_title = document.createElement("div");
    askBox.mount(wrap_title);
    shadow.appendChild(wrap_title);
    document.body.appendChild(rootEle);
  }
}

export function useScreenshot() {
  const root: Ref<HTMLDivElement | null> = ref(null);
  const canvas: Ref<HTMLCanvasElement | null> = ref(null);
  const isDrawing: Ref<boolean> = ref(false);
  const startX: Ref<number> = ref(0);
  const startY: Ref<number> = ref(0);
  const currentX: Ref<number> = ref(0);
  const currentY: Ref<number> = ref(0);
  const image: Ref<HTMLImageElement | null> = ref(null);
  const imgSrc: Ref<string> = ref("");
  const screenImg: Ref<string> = ref("");
  root.value = document.createElement("div");
  //遮罩层
  root.value.id = "studygpt-screen-shot";
  root.value.style.background = "transparent";
  root.value.style.position = "fixed";
  root.value.style.top = "0px";
  root.value.style.left = "0px";
  root.value.style.width = "100%";
  root.value.style.height = "100%";
  root.value.style.zIndex = "9999";

  const shadowRoot = root.value.attachShadow({ mode: "open" });
  canvas.value = document.createElement("canvas")!;
  const bodyWidth = window.innerWidth;
  const bodyHeight = window.innerHeight;
  const dpr = window.devicePixelRatio;
  canvas.value.width = bodyWidth * dpr;
  canvas.value.height = bodyHeight * dpr;
  shadowRoot.appendChild(canvas.value);

  const ctx = canvas.value.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  ctx.fillStyle = "rgba(0, 0, 0, 0)";
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
  chrome.runtime.onMessage.addListener(async (payload: any) => {
    const { type } = payload;
    if (type !== "update_screenImg") return;
    screenImg.value = payload.screenImg;
    image.value = new Image();
    image.value.crossOrigin = "anonymous";
    image.value.src = screenImg.value;

    image.value.onload = () => {
      if (image.value && canvas.value) {
        const newWidth = image.value.width;
        const newHeight = image.value.height;
        const x = (canvas.value.width - newWidth) / 2;
        const y = (canvas.value.height - newHeight) / 2;
        ctx.drawImage(image.value, x, y, newWidth, newHeight);
        canvas.value.style.width = `${bodyWidth}px`;
      }
    };
    removeEscBtn();
    createEscBtn();
    removeCaptureBtn();
    createCaptureBtn();
  });
  document.body.appendChild(root.value);
  document.body.style.overflow = "visible";
  document.body.style.overscrollBehavior = "none";
  document.body.style.cursor = `url(${getImage("mouse.png")}), auto`;

  const onMouseDown = (e: MouseEvent) => {
    removeEscBtn();
    removeCaptureBtn();
    e.preventDefault();
    isDrawing.value = true;
    startX.value = e.offsetX * dpr;
    startY.value = e.offsetY * dpr;
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDrawing.value) return;
    currentX.value = e.offsetX * dpr;
    currentY.value = e.offsetY * dpr;

    const ctx = canvas.value?.getContext("2d");
    if (!ctx) return;
    if (canvas.value) {
      ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
    }
    if (image.value?.complete && canvas.value) {
      const newWidth = image.value.width;
      const newHeight = image.value.height;
      const x = (canvas.value?.width - newWidth) / 2;
      const y = (canvas.value?.height - newHeight) / 2;
      ctx.drawImage(image.value, x, y, newWidth, newHeight);
    }
    const width = currentX.value - startX.value;
    const height = currentY.value - startY.value;
    ctx.strokeStyle = "#0386FF";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 2]);
    ctx.strokeRect(startX.value, startY.value, width, height);
  };

  const onMouseUp = () => {
    isDrawing.value = false;
    const width = Math.abs(currentX.value - startX.value);
    const height = Math.abs(currentY.value - startY.value);
    const ctx = canvas.value?.getContext("2d");
    if (!ctx) return;

    // 减去border的宽度
    const imageData = ctx.getImageData(
      startX.value + 1,
      startY.value + 1,
      width - 2,
      height - 2
    );
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    tempCtx.putImageData(imageData, 0, 0);
    imgSrc.value = tempCanvas.toDataURL("image/png");
    // 将截图数据发送给后端进行处理
    _createApp(imgSrc.value);
  };
  canvas.value.addEventListener("mousedown", onMouseDown);
  canvas.value.addEventListener("mousemove", onMouseMove);
  canvas.value.addEventListener("mouseup", onMouseUp);
}
export function sliderIcon(val: string) {
  // val:1显示 0隐藏
  const shadowContainer = document.querySelector("#studygpt-root")!;
  const shortcut: HTMLElement =
    shadowContainer.shadowRoot!.querySelector("#shortcut-btn")!;

  shortcut.style.visibility = val === "1" ? "visible" : "hidden";
}
export function removeEscBtn() {
  const escBtn = document.querySelector("#studygpt-screen-shot-esc");
  if (escBtn) {
    escBtn.remove();
  }
}
export function createEscBtn() {
  const escBtn = document.createElement("div");
  escBtn.id = "studygpt-screen-shot-esc";
  escBtn.style.position = "fixed";
  escBtn.style.zIndex = "99999";
  // 添加图片作为按钮
  escBtn.innerHTML = `<img src="${getImage(
    "esc.png"
  )}" alt="esc" style="width:124px;"/>`;
  document.body.appendChild(escBtn); // 将按钮添加到页面中

  // 更新按钮位置的函数
  const updateButtonPosition = () => {
    const rightOffset = 20; // 按钮距离右侧的偏移量
    const bottomOffset = 20; // 按钮距离底部的偏移量
    escBtn.style.right = `${rightOffset}px`;
    escBtn.style.bottom = `${bottomOffset}px`;
  };

  updateButtonPosition(); // 初次加载时更新按钮位置
  // 监听窗口大小变化事件，并更新按钮位置
  window.addEventListener("resize", updateButtonPosition);
  // 添加鼠标悬停事件监听器
  escBtn.addEventListener("mouseover", () => {
    // 移除元素
    document.body.removeChild(escBtn);
  });
}
export function useElementToRemove() {
  removeEscBtn();
  removeCaptureBtn();
  sliderIcon("1");
  //问答的盒子
  const _screenDom = document.querySelector("#studygpt-screen-ask")!;
  const _screenshot = document.querySelector("#screenshot-area")!;
  const overlay = document.querySelectorAll("#studygpt-screen-shot")!;
  document.body.style.overflow = "revert-layer";
  document.body.style.overscrollBehavior = "auto";
  document.body.style.cursor = `auto`;
  if (_screenshot) {
    document.body.removeChild(_screenshot);
  }
  if (_screenDom) {
    document.body.removeChild(_screenDom);
  }
  overlay.forEach((ele) => {
    ele.remove();
  });
}
export function setBodyStyle() {
  // document.body.style.overflow = "visible";
  document.body.style.overscrollBehavior = "none";
  document.body.style.outline = "none";
  document.body.style.cursor = `url(${getImage("mouse.png")}), auto`;
}
export function removeOverlay() {
  removeEscBtn();

  const overlay = document.querySelector("#studygpt-screen-shot")!;
  overlay && overlay.remove();
  document.body.style.overflow = "visible";
  document.body.style.overscrollBehavior = "auto";
  document.body.style.cursor = `auto`;
}

export function createCaptureBtn() {
  const captureBtn = document.createElement("div");
  captureBtn.id = "studygpt-capture-btn";
  captureBtn.style.position = "fixed";
  captureBtn.style.zIndex = "99999";
  // 添加图片作为按钮
  captureBtn.innerHTML = `<img src="${getImage(
    "capture.png"
  )}" alt="capture" style="width:392px;height:72px;"/>`;
  document.body.appendChild(captureBtn); // 将按钮添加到页面中

  // 更新按钮位置的函数
  const updateButtonPosition = () => {
    const rightOffset = window.innerWidth / 2 - captureBtn.offsetWidth / 2; // 计算按钮距离右侧的偏移量
    const bottomOffset = 65; // 按钮距离底部的偏移量
    captureBtn.style.right = `${rightOffset}px`;
    captureBtn.style.bottom = `${bottomOffset}px`;
  };

  updateButtonPosition(); // 初次加载时更新按钮位置
  // 监听窗口大小变化事件，并更新按钮位置
  window.addEventListener("resize", updateButtonPosition);
  // 添加鼠标悬停事件监听器
  captureBtn.addEventListener("mouseover", () => {
    // 移除元素
    document.body.removeChild(captureBtn);
  });
}
export function removeCaptureBtn() {
  const captureBtn = document.querySelector("#studygpt-capture-btn")!;
  captureBtn && captureBtn.remove();
}
