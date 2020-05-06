import { RedfoxClient } from "./rfxClient/RedfoxClient";
import { Board } from "./morabaraba/Board";

async function Initialize() {
    var rfx = new RedfoxClient('ws://127.0.0.1:81/ws');
    await rfx.Connect();
    await rfx.JoinZone('morabaraba');
    await rfx.JoinRoom('lobby');
}

Initialize();
(window as any).board = new Board();