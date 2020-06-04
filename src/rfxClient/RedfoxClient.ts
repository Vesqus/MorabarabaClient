import ws from 'websocket-as-promised';
import { Dispatcher } from '../Dispatcher';

export class RedfoxClient extends Dispatcher {
    private wsUrl: string;
    private webSocket: ws;

    public myId: number;

    constructor(_wsUrl: string) {
        super();
        this.wsUrl = _wsUrl;
    }
    public async Connect() {
        this.webSocket = new ws(this.wsUrl);
        this.webSocket.onMessage.addListener((data: string) => this.OnDataReceived(data));
        console.log("connecting...");
        await this.webSocket.open();
        console.log("connected!");
        (window as any).gs = () => this.GetSession();
        (window as any).pm = (move: string) => this.MakeMove(move);
    }
    public SendData(message: any) {
        this.webSocket.send(JSON.stringify(message));
    }
    public async JoinZone(zoneName: string) {
        var message = { "target": "global", "type": "rfx#jz", "zoneName": zoneName };
        this.SendData(message);
        await this.WaitForJoinZone();
    }
    public async WaitForJoinZone(): Promise<any> {
        return new Promise((resolve, reject) => {
            var onData = (data: string) => {
                var message = JSON.parse(data);
                if (message.type == 'rfx#jz') {
                    this.webSocket.onMessage.removeListener(onData);
                    resolve(message.userData);
                }
            }
            this.webSocket.onMessage.addListener(onData);
        });
    }
    public async JoinRoom(roomName: string) {
        var message = { "target": "zone", "type": "rfx#jr", "roomName": roomName };
        this.SendData(message);
        await this.WaitForJoinRoom();
    }
    public async WaitForJoinRoom(): Promise<any> {
        return new Promise((resolve, reject) => {
            var onData = (data: string) => {
                var message = JSON.parse(data);
                if (message.type == 'rfx#jr') {
                    this.webSocket.onMessage.removeListener(onData);
                    resolve(message.roomData);
                }
            }
            this.webSocket.onMessage.addListener(onData);
        });
    }
    public async GetSession() {
        var message = { "target": "zone", "type": "si#gs" };
        this.SendData(message);
        await this.WaitForGameBegin();
    }
    public async WaitForGameBegin(): Promise<any> {
        return new Promise((resolve, reject) => {
            var onData = (data: string) => {
                var message = JSON.parse(data);
                if (message.type == 'si#gb') {
                    this.webSocket.onMessage.removeListener(onData);
                    resolve(message.roomData);
                }
            }
            this.webSocket.onMessage.addListener(onData);
        });
    }
    public async MakeMove(move: string) {
        var message = { "target": "zone", "type": "si#pm", move: move };
        this.SendData(message);
        await this.WaitForPlayerMove();
    }
    public async WaitForPlayerMove(): Promise<any> {
        return new Promise((resolve, reject) => {
            var onData = (data: string) => {
                var message = JSON.parse(data);
                if (message.type == 'si#pm') {
                    this.webSocket.onMessage.removeListener(onData);
                    resolve(message.roomData);
                }
            }
            this.webSocket.onMessage.addListener(onData);
        });
    }
    private async OnDataReceived(data: string) {
        console.log("got data " + data);
        var message = JSON.parse(data);
        switch (message.type) {
            case "si#pm": {
                this.dispatchEvent("player_move", message);
                break;
            }
            case "si#gb": {
                this.dispatchEvent("game_begin", message.isYourTurn);
                break;
            }
        }
    }
}