export class BoardField {
    public name: string;
    public value: number;

    constructor(_name: string) {
        this.name = _name;
    }
    public getDOM() {
        return document.getElementById('field-' + this.name);
    }
    public setOwnership(playerid: number) {
        var colors = ["gray", "blue", "red"];
        this.getDOM().style.backgroundColor = colors[playerid + 1];
        this.value = playerid;
    }
}