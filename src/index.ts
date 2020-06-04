import { RedfoxClient } from "./rfxClient/RedfoxClient";
import { Board } from "./morabaraba/Board";
import { BoardField } from "./morabaraba/BoardField";

var rfx = new RedfoxClient('ws://127.0.0.1:81/ws');

async function Initialize() {
    await rfx.Connect();
    await rfx.JoinZone('morabaraba');
    await rfx.JoinRoom('lobby');
    await rfx.GetSession();
}
Initialize();
var board = new Board();

(window as any).board = board;

let placingCowsLeft = 12;
let source: BoardField;
let destination: BoardField;
let state = "";
let canClick = false;
let mycows = 12;
board.addEventListener("field_click", async (field: BoardField) => {
    if (!canClick) return;
    if (board.turn == rfx.myId) {
        if (state == "selectingTarget" || state == "movingSelectingTarget") {
            if (field.value != rfx.myId && field.value != -1) {
                if (state == "selectingTarget") {
                    rfx.MakeMove(destination.name + 'x' + field.name);

                } else if (state == "movingSelectingTarget") {
                    rfx.MakeMove(source.name + "-" + destination.name + 'x' + field.name);
                }
                state = "";
                canClick = false;
            }
        } else if (state == "moving") {
            if (field.value == -1) {
                if (mycows <= 3 || board.fieldGraphMatrix[[source.name, field.name].sort().join('')]) {
                    state = "";
                    source.setOwnership(-1);
                    field.setOwnership(rfx.myId);
                    if (board.isMill(field)) {
                        state = "movingSelectingTarget";
                        destination = field;
                        $('#game-notification').html("Masz młynek! Kliknij pionek wroga do zbicia.");
                    } else {
                        rfx.MakeMove(source.name + '-' + field.name);
                    }
                }
            }

        } else if (field.value == -1 && placingCowsLeft > 0) {
            field.setOwnership(rfx.myId);
            if (board.isMill(field)) {
                //place shoot
                state = "selectingTarget";
                destination = field;
                placingCowsLeft--;
                $('#game-notification').html("Masz młynek! Kliknij pionek wroga do zbicia.");
            } else {
                //place
                placingCowsLeft--;
                rfx.MakeMove(field.name);
                canClick = false;
            }
        } else if (field.value == rfx.myId) {
            //moving
            state = "moving";
            source = field;
            $('#game-notification').html("Kliknj na pole, na które chcesz przenieść pionek.");
        }
    }
});
rfx.addEventListener("game_begin", async (isYourTurn: boolean) => {
    rfx.myId = isYourTurn ? 0 : 1;
    canClick = isYourTurn;
    board.turn = 0;
    $('#wait-for-game').removeClass('is-active');
    $('#game-notification').html(!isYourTurn ? "Ruch przeciwnika" : "Twój ruch");
});
rfx.addEventListener("player_move", async (data: any) => {
    $('#game-notification').html(data.playerId == rfx.myId ? "Ruch przeciwnika" : "Twój ruch");
    canClick = data.playerId != rfx.myId;
    let move = data.move;
    let shooting = move.split('x').length == 2;
    let moving = move.split('-').length == 2;

    let source = move.split('x')[0].split('-')[0];
    let destination = move.split('x')[0].split('-')[1];
    let target = move.split('x')[1];
    if (!moving) { //aka placing
        board.fields.get(source).setOwnership(data.playerId);
    } else {
        board.fields.get(source).setOwnership(-1);
        board.fields.get(destination).setOwnership(data.playerId);
    }
    if (shooting) {
        board.fields.get(target).setOwnership(-1);
        if (data.playerId != rfx.myId) mycows--;
    }
    if (board.turn == 0)
        board.turn = 1;
    else
        board.turn = 0;
});