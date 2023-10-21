const SERVICE_UUID = '27df26c5-83f4-4964-bae0-d7b7cb0a1f54';
const CHARACTERISTIC_UUID_axes = ['75f3bc1f-c5c1-4bd7-abac-081a67a0d59d',
                                  '4eb72916-f242-4b6c-8248-c4b4e89d45d3',
                                  '185a1d09-ace8-46fd-b7b9-faedfaaa24a0',
                                  '839b7edd-1c75-4c81-a81d-4085778e01d0'
                                 ];
const CHARACTERISTIC_UUID_buttons = 'c8781ee9-4b8b-4241-9846-7a2ff1771c25';

const bleStatus = document.getElementById('bleStatus');
const connectButton = document.getElementById('connectButton');
const disconnectButton = document.getElementById('disconnectButton');
const gamepadStatus = document.getElementById('gamepadStatus');

connectButton.onclick = connectBLE;
//disconnectButton.onclick = disconnectBLE;

// Display what's happening to user
function displayBleStatus(status) {
   bleStatus.innerHTML = status;
}
function displayGamepadStatus(status) {
   gamepadStatus.innerHTML = status;
}

let flagBle = false;

let device;
let server;
let service;
let characteristic_axes = [];
let characteristic_buttons;

async function connectBLE() {
   displayBleStatus('Searching devices for service ' + SERVICE_UUID);

   try {
      device = await navigator.bluetooth.requestDevice({filters: [{ services: [SERVICE_UUID] }] });
      displayBleStatus('Found device ' + device.name + ' with service');

      server = await device.gatt.connect();
      displayBleStatus('Connected to GATT server');

      service = await server.getPrimaryService(SERVICE_UUID);
      displayBleStatus('Service aquired');

      CHARACTERISTIC_UUID_axes.forEach(async (uuid) => {
         characteristic_axes.push(await service.getCharacteristic(uuid));
      });

      characteristic_buttons = await service.getCharacteristic(CHARACTERISTIC_UUID_buttons);
      displayBleStatus('Characteristics aquired, BLE connection successful');
      flagBle = true;

   } catch (error) {
      displayBleStatus("Error: " + error);
   }
}

document.addEventListener("DOMContentLoaded", () => {
   window.setInterval(renderLoop, 50); // call renderLoop every 20ms
   window.addEventListener("gamepadconnected", updateGamepads);
   window.addEventListener("gamepaddisconnected", updateGamepads);
});

function getGamepads() {
   return Array.from(navigator.getGamepads()).filter(gamepad => gamepad);
}

function anyGamepadsConnected() {
   return Boolean(getGamepads().length);
}

function getSelectedGamepad() {
   return getGamepads().find(gamepad => gamepad.index == 0); 
}

function updateGamepads() {
   if (anyGamepadsConnected()) gamepadStatus.innerHTML = "connected";
}




var lastAxisVal = new Array(4);
var axisValGamepad = 0;
var axisValSlider = 0;

var axisValueElements = document.querySelectorAll('[id^="axisValue"]');
var sliderElements = document.querySelectorAll('[id^="slider"]');

function renderLoop() {
   
   var gamepad = getSelectedGamepad();

   for (let i = 0; i < 4; i++) {
      axisValSlider = sliderElements[i].value
      if (axisValSlider != lastAxisVal[i]) {
         if(flagBle){
            sendAxisBLE(axisValSlider, characteristic_axes[i]); // Pass the axis index to the sendAxisBLE function
         }
         axisValueElements[i].textContent = axisValSlider;
         lastAxisVal[i] = axisValSlider;
      }

      else if (gamepad){
         if (gamepad.axes[i] == 0) axisValGamepad = 127; else axisValGamepad = Math.round((gamepad.axes[i] + 1) * (255 / 2));
         if (axisValGamepad != lastAxisVal[i]) {
            if(flagBle){
               sendAxisBLE(axisValGamepad, characteristic_axes[i]); // Pass the axis index to the sendAxisBLE function
            }
         }
         axisValueElements[i].textContent = axisValGamepad;
         sliderElements[i].value = axisValGamepad;
         lastAxisVal[i] = axisValGamepad;
      }
   }
}


let axisData = new DataView(new ArrayBuffer(1));

async function sendAxisBLE(axisVal, characteristic) {
   try {
       axisData.setUint8(0, axisVal);
       await characteristic.writeValueWithoutResponse(axisData);
   } catch (error) {
       console.error('Error writing characteristic:', error);
   }
}

