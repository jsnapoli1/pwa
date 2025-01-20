import bleController from './ble.js';

class UIController {
    constructor() {
        this.connectBtn = document.getElementById('connectBtn');
        this.statusDiv = document.getElementById('status');
        this.controlsDiv = document.getElementById('controls');
        
        this.pinStatusElements = {
            pin3: document.getElementById('pin3Status'),
            pin4: document.getElementById('pin4Status'),
            pin5: document.getElementById('pin5Status'),
            pin6: document.getElementById('pin6Status')
        };

        this.init();
    }

    init() {
        this.connectBtn.addEventListener('click', this.handleConnect.bind(this));
        bleController.onPinStatusUpdate = this.updatePinStatus.bind(this);
    }

    async handleConnect() {
        this.connectBtn.disabled = true;
        this.statusDiv.textContent = 'Connecting...';

        const success = await bleController.connect();
        
        if (success) {
            this.statusDiv.textContent = 'Connected';
            this.connectBtn.textContent = 'Disconnect';
            this.controlsDiv.style.display = 'grid';
            this.connectBtn.addEventListener('click', this.handleDisconnect.bind(this));
        } else {
            this.statusDiv.textContent = 'Connection failed';
            this.connectBtn.disabled = false;
        }
    }

    async handleDisconnect() {
        await bleController.disconnect();
        this.statusDiv.textContent = 'Disconnected';
        this.connectBtn.textContent = 'Connect to ESP32';
        this.controlsDiv.style.display = 'none';
        this.resetPinStatus();
    }

    updatePinStatus(pinStatus) {
        for (const [pin, value] of Object.entries(pinStatus)) {
            const element = this.pinStatusElements[pin];
            if (element) {
                // Convert the pin value to a meaningful status
                const status = value === 1 ? 'HIGH' : value === 0 ? 'LOW' : 'No input available';
                element.textContent = status;
                
                // Update the visual style based on the status
                element.className = 'pin-status ' + (status === 'No input available' ? 'inactive' : status.toLowerCase());
            }
        }
    }

    resetPinStatus() {
        Object.values(this.pinStatusElements).forEach(element => {
            element.textContent = 'No input available';
            element.className = 'pin-status inactive';
        });
    }
}

export default new UIController(); 