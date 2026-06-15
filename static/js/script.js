// --- HYDRO PHYSICS ENGINE CONFIGURATION ---
const MAX_CAPACITY = 15; // Total messages before empty
let currentVolume = 0;   // Starts Empty
let isPumping = false;   // Motor State

// DOM Node References
const waterMass = document.getElementById('water-mass');
const fuelText = document.getElementById('fuel-text');
const ledScreen = document.getElementById('led-screen');
const fan = document.getElementById('fan');
const motorCasing = document.getElementById('motor-casing');
const inputPipe = document.getElementById('input-flow');
const outputSlug = document.getElementById('output-slug');
const chatBox = document.getElementById('chat-box');
const inputField = document.getElementById('user-input');

// --- 1. SYSTEM ACTIVATION (MOTOR REFILL) ---
function startMotor() {
    // Prevent overfilling or double clicking
    if (isPumping || currentVolume >= MAX_CAPACITY) {
        if(currentVolume >= MAX_CAPACITY) botReply("⚠️ Reservoir is already full.");
        return;
    }
    
    isPumping = true;
    
    // A. VISUALS: Start Motor Physics
    fan.classList.add('spinning');
    motorCasing.classList.add('shaking'); // Physics vibration effect
    ledScreen.classList.add('led-active');
    ledScreen.innerText = "PRESSURE: 120PSI";
    
    // B. VISUALS: Fill Input Pipe Stream
    inputPipe.style.width = "100%";
    
    // C. LOGIC: Fill Tank (Simulate travel time delay)
    setTimeout(() => {
        currentVolume = MAX_CAPACITY;
        updateTankVisuals();
        
        // D. VISUALS: Stop Motor Auto-Shutoff
        setTimeout(() => {
            isPumping = false;
            fan.classList.remove('spinning');
            motorCasing.classList.remove('shaking');
            ledScreen.classList.remove('led-active');
            ledScreen.innerText = "STANDBY MODE";
            inputPipe.style.width = "0%";
            
            botReply("✅ System Pressurized. Reservoir at 100%. Ready for data transmission.");
        }, 1500); // Motor runs for 1.5 seconds after fill
        
    }, 800); // Pipe travel time
}

// Update the height and color of the water in the glass tank
function updateTankVisuals() {
    const percent = (currentVolume / MAX_CAPACITY) * 100;
    waterMass.style.height = `${percent}%`;
    fuelText.innerText = `LEVEL: ${Math.floor(percent)}%`;
    
    // Logic: Turn water RED if critical low
    if(currentVolume < 4 && currentVolume > 0) {
        waterMass.style.background = "linear-gradient(180deg, #f87171 0%, #dc2626 100%)";
    } else {
        // Normal Cyan Water
        waterMass.style.background = "linear-gradient(180deg, rgba(34,211,238,0.8) 0%, rgba(14,165,233,0.9) 100%)";
    }
}

// --- 2. DATA TRANSMISSION (SEND MESSAGE) ---
async function transmit() {
    const text = inputField.value.trim();
    if(!text) return;
    
    // CHECK FUEL: Stop if empty
    if(currentVolume <= 0) {
        botReply("❌ ERROR: Hydraulic failure. Reservoir Empty. Please activate Main Pump.");
        return;
    }
    
    // 1. UI: Append User Message
    chatBox.innerHTML += `<div class="msg-user">${text}</div>`;
    inputField.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;
    
    // 2. PHYSICS: Consume 1 unit of Water
    currentVolume--;
    updateTankVisuals();
    
    // 3. ANIMATION: Shoot "Slug" from tank to chat
    outputSlug.classList.remove('slug-anim'); // Reset animation
    void outputSlug.offsetWidth; // Trigger Reflow (CSS Magic)
    outputSlug.classList.add('slug-anim'); // Fire animation
    
    // 4. NETWORK: Fetch Bot Answer
    const loadingID = "load_" + Date.now();
    // Add temporary loading text
    chatBox.innerHTML += `<div id="${loadingID}" class="msg-bot" style="opacity:0.7">... Processing Fluid Dynamics ...</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const formData = new FormData();
        formData.append("question", text);
        
        const response = await fetch("/ask", { method: "POST", body: formData });
        const data = await response.json();
        
        // Remove loader and show answer
        document.getElementById(loadingID).remove();
        botReply(data.answer);
        
    } catch (e) {
        document.getElementById(loadingID).remove();
        botReply("⚠️ Pipe Burst. Connection Failed.");
    }
}

// Helper to add bot message
function botReply(msg) {
    chatBox.innerHTML += `<div class="msg-bot">${msg}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Allow "Enter" key to send
inputField.addEventListener("keypress", (e) => {
    if(e.key === "Enter") transmit();
});
