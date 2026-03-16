const $video = $("#camera");
const $canvas = $("#canvas");
const ctx = $canvas[0].getContext("2d");
const $timerInput = $("#timer");
const $countdownDiv = $("#countdown");
const $captureBtn = $("#capture");
const $shutterSound = $("#shutterSound");
const $flashOverlay = $("#flashOverlay");

const $previewModal = $("#previewModal");
const $previewImage = $("#previewImage");
const $downloadPopup = $("#downloadPopup");
const $deletePopup = $("#deletePopup");

let capturedPhotos = [];
let currentFilter = "none";

const themes = {
    "none": { bg:"#ffffff", border:"#e5e5e5" },
    "grayscale(1)": { bg:"#111111", border:"#444444" },
    "sepia(1)": { bg:"#f3e1c7", border:"#b08968" },
    "brightness(1.3)": { bg:"#fff7cc", border:"#ffd166" },
    "saturate(2)": { bg:"#ffe4ec", border:"#ff4d8d" }
}

navigator.mediaDevices.getUserMedia({ video: true })
.then(stream => {
    $video[0].srcObject = stream
    $video.css("filter", currentFilter)
})

$('input[name="filter"]').on("change", function(){
    currentFilter = $(this).val()
    $video.css("filter", currentFilter)
})

function sleep(ms){ return new Promise(resolve => setTimeout(resolve, ms)) }

function countdown(seconds){
    return new Promise(resolve=>{
        let time = seconds
        $countdownDiv.text(time)
        const timer = setInterval(()=>{
            time--
            if(time < 0){
                clearInterval(timer)
                $countdownDiv.text("")
                resolve()
            }else{
                $countdownDiv.text(time)
            }
        },1000)
    })
}

$captureBtn.on("click", async ()=>{
    window.scrollTo({ top: 0, behavior: 'smooth' });
    capturedPhotos = []
    const selected = parseInt($('input[name="photoCount"]:checked').val())
    for(let i=0;i<selected;i++){
        await countdown(parseInt($timerInput.val()))

        $flashOverlay.addClass("bg-white")

        const photo = takePhoto()
        capturedPhotos.push(photo)

        $shutterSound[0].currentTime = 0
        $shutterSound[0].play()

        setTimeout(()=>{
            $flashOverlay.removeClass("bg-white")
        }, 200)

        const $previewOverlay = $('<img>')
        $previewOverlay.attr("src", photo)
        $previewOverlay.addClass("absolute top-0 left-0 w-full h-full object-cover rounded-xl z-50")
        $video.parent().append($previewOverlay)
        
        await sleep(1200)
        $previewOverlay.remove()
    }
    await buildStrip()
    $previewImage.attr("src", $canvas[0].toDataURL("image/png"))
    $previewModal.removeClass("hidden").addClass("flex")
})

$downloadPopup.on("click", ()=>{
    const link = document.createElement("a")
    link.download = "photobooth.png"
    link.href = $canvas[0].toDataURL("image/png")
    link.click()
})

$deletePopup.on("click", ()=>{
    $previewModal.addClass("hidden").removeClass("flex")
    $previewImage.attr("src", "")
})