const video = document.getElementById("camera")
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")
const timerInput = document.getElementById("timer")
const countdownDiv = document.getElementById("countdown")
const captureBtn = document.getElementById("capture")
const shutterSound = document.getElementById("shutterSound")
const flashOverlay = document.getElementById("flashOverlay")

const previewModal = document.getElementById("previewModal")
const previewImage = document.getElementById("previewImage")
const downloadPopup = document.getElementById("downloadPopup")
const deletePopup = document.getElementById("deletePopup")

let capturedPhotos = []
let currentFilter = "none"

const themes = {
    "none": { bg:"#ffffff", border:"#e5e5e5" },
    "grayscale(1)": { bg:"#111111", border:"#444444" },
    "sepia(1)": { bg:"#f3e1c7", border:"#b08968" },
    "brightness(1.3)": { bg:"#fff7cc", border:"#ffd166" },
    "saturate(2)": { bg:"#ffe4ec", border:"#ff4d8d" }
}

navigator.mediaDevices.getUserMedia({ video: true })
.then(stream => {
    video.srcObject = stream
    video.style.filter = currentFilter
})

document.querySelectorAll('input[name="filter"]').forEach(radio => {
    radio.addEventListener("change", e => {
        currentFilter = e.target.value
        video.style.filter = currentFilter
    })
})

function sleep(ms){ return new Promise(resolve => setTimeout(resolve, ms)) }

function countdown(seconds){
    return new Promise(resolve=>{
        let time = seconds
        countdownDiv.innerText = time
        const timer = setInterval(()=>{
            time--
            if(time < 0){
                clearInterval(timer)
                countdownDiv.innerText = ""
                resolve()
            }else{
                countdownDiv.innerText = time
            }
        },1000)
    })
}

function takePhoto(){
    const vw = video.videoWidth
    const vh = video.videoHeight
    const cw = video.clientWidth
    const ch = video.clientHeight
    const tempCanvas = document.createElement("canvas")
    const tempCtx = tempCanvas.getContext("2d")

    tempCanvas.width = cw
    tempCanvas.height = ch

    const targetRatio = cw / ch
    const videoRatio = vw / vh

    let sx, sy, sw, sh

    if(videoRatio > targetRatio){
        sh = vh
        sw = vh * targetRatio
        sx = (vw - sw) / 2
        sy = 0
    }else{
        sw = vw
        sh = vw / targetRatio
        sx = 0
        sy = (vh - sh) / 2
    }

    tempCtx.translate(cw,0)
    tempCtx.scale(-1,1)
    tempCtx.filter = currentFilter

    tempCtx.drawImage(video, sx, sy, sw, sh, 0, 0, cw, ch)

    return tempCanvas.toDataURL("image/png")
}

async function buildStrip(){
    const width = video.clientWidth;
    const padding = 20;
    const gap = 20;

    const photoWidth = width - (padding * 2);
    
    const photoRatio = video.clientWidth / video.clientHeight;
    const photoHeight = photoWidth / photoRatio; 

    canvas.width = width;
    canvas.height = (photoHeight * capturedPhotos.length) + (gap * (capturedPhotos.length - 1)) + (padding * 2);

    ctx.fillStyle = themes[currentFilter].bg;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    let y = padding;

    for(const photo of capturedPhotos){
        const img = new Image();
        await new Promise(resolve=>{
            img.onload = resolve;
            img.src = photo;
        });
        
        ctx.drawImage(img, padding, y, photoWidth, photoHeight);
        ctx.strokeStyle = themes[currentFilter].border;
        ctx.lineWidth = 6;
        ctx.strokeRect(padding, y, photoWidth, photoHeight);
        y += photoHeight + gap;
    }
}

captureBtn.onclick = async ()=>{
    window.scrollTo({ top: 0, behavior: 'smooth' });
    capturedPhotos = []
    const selected = parseInt(document.querySelector('input[name="photoCount"]:checked').value)
    for(let i=0;i<selected;i++){
        await countdown(parseInt(timerInput.value))

        flashOverlay.classList.add("bg-white")

        const photo = takePhoto()
        capturedPhotos.push(photo)

        shutterSound.currentTime = 0
        shutterSound.play()

        setTimeout(()=>{
            flashOverlay.classList.remove("bg-white")
        }, 200)

        const previewOverlay = document.createElement("img")
        previewOverlay.src = photo
        previewOverlay.className = "absolute top-0 left-0 w-full h-full object-cover rounded-xl z-50"
        video.parentElement.appendChild(previewOverlay)
        
        await sleep(1200)
        previewOverlay.remove()
    }
    await buildStrip()
    previewImage.src = canvas.toDataURL("image/png")
    previewModal.classList.remove("hidden")
    previewModal.classList.add("flex")
}

downloadPopup.onclick = ()=>{
    const link = document.createElement("a")
    link.download = "photobooth.png"
    link.href = canvas.toDataURL("image/png")
    link.click()
}

deletePopup.onclick = ()=>{
    previewModal.classList.add("hidden")
    previewModal.classList.remove("flex")
    previewImage.src = ""
}