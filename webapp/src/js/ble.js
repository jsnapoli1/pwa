class BLEController {
    constructor() {
        this.device = null;
        this.characteristic = null;
        this.SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
        this.CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
        this.onPinStatusUpdate = null;
    }

    async connect() {
        try {
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{
                    services: [this.SERVICE_UUID]
                }]
            });

            const server = await this.device.gatt.connect();
            const service = await server.getPrimaryService(this.SERVICE_UUID);
            this.characteristic = await service.getCharacteristic(this.CHARACTERISTIC_UUID);

            // Start notifications for pin status updates
            await this.characteristic.startNotifications();
            this.characteristic.addEventListener('characteristicvaluechanged', this.handlePinStatusUpdate.bind(this));

            return true;
        } catch (error) {
            console.error('Connection error:', error);
            return false;
        }
    }

    handlePinStatusUpdate(event) {
        const value = event.target.value;
        const dataView = new DataView(value.buffer);
        
        // Assuming the ESP32 sends 4 bytes, one for each pin
        const pinStatus = {
            pin3: dataView.getUint8(0),
            pin4: dataView.getUint8(1),
            pin5: dataView.getUint8(2),
            pin6: dataView.getUint8(3)
        };

        if (this.onPinStatusUpdate) {
            this.onPinStatusUpdate(pinStatus);
        }
    }

    async sendData(data) {
        if (!this.characteristic) {
            throw new Error('Not connected to device');
        }
        
        const encoder = new TextEncoder();
        await this.characteristic.writeValue(encoder.encode(data));
    }

    async disconnect() {
        if (this.device && this.device.gatt.connected) {
            await this.device.gatt.disconnect();
        }
    }
}

export default new BLEController(); 