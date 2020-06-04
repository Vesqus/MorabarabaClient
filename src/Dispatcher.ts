export class Dispatcher {
    events: any;

    constructor() {
        this.events = {};
    }

    addEventListener(event: string, callback: (data?: any) => any) {
        // Create the event if not exists
        if (this.events[event] === undefined) {
            this.events[event] = {
                listeners: []
            };
        }
        this.events[event].listeners.push(callback);
    }

    removeEventListener(event: string, callback: (data?: any) => any) {
        // Check if this event not exists
        if (this.events[event] === undefined) {
            return false;
        }
        this.events[event].listeners = this.events[event].listeners.filter(
            (listener: string) => {
                return listener.toString() !== callback.toString();
            }
        );
    }

    dispatchEvent(event: string, data?: any) {
        // Check if this event not exists
        if (this.events[event] === undefined) {
            return false;
        }
        this.events[event].listeners.forEach((listener: any) => {
            listener(data);
        });
    }
}
