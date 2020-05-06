import { BoardField } from "./BoardField";

export class Board {
    public fields: Map<string, BoardField>;
    private millCombos: Array<Array<string>>;
    private turn: number;


    constructor() {
        this.turn = -1;
        this.fields = new Map<string, BoardField>();
        var fieldlist = ['a7', 'd7', 'g7', 'b6', 'd6', 'f6', 'c5', 'd5', 'e5', 'a4', 'b4', 'c4', 'e4', 'f4', 'g4', 'c3', 'd3', 'e3', 'b2', 'd2', 'f2', 'a1', 'd1', 'g1'];
        for (var fieldname of fieldlist) {
            let field = new BoardField(fieldname);
            this.fields.set(fieldname, field);
            let dom = field.getDOM();
            field.setOwnership(-1);
            dom.onclick = () => this.onFieldClick(field);
            $(dom).html(fieldname.toUpperCase());
            //$(dom).on("click",  });
        }
        this.millCombos = [
            ['a7', 'd7', 'g7'],
            ['b6', 'd6', 'f6'],
            ['c5', 'd5', 'e5'],
            ['a4', 'b4', 'c4'],
            ['e4', 'f4', 'g4'],
            ['c3', 'd3', 'e3'],
            ['b2', 'd2', 'f2'],
            ['a1', 'd1', 'g1'], //end horizontals
            ['a7', 'a4', 'a1'],
            ['b6', 'b4', 'b2'],
            ['c5', 'c4', 'c3'],
            ['d7', 'd6', 'd5'],
            ['d3', 'd2', 'd1'],
            ['e5', 'e4', 'e3'],
            ['f6', 'f4', 'f2'],
            ['g7', 'g4', 'g1'], //end verticals
            ['a7', 'b6', 'c5'],
            ['e5', 'f6', 'g7'],
            ['e3', 'f2', 'g1'],
            ['a1', 'b2', 'c3'] //end diagonals
        ];
    }
    public isMill(field: BoardField) {
        if (field.value == -1) return false;
        for (var millCombo of this.millCombos) {
            if (millCombo.includes(field.name)) {
                var comboMet = true;
                for (var potentialMillFieldName of millCombo) {
                    var potentialMillField = this.fields.get(potentialMillFieldName);
                    if (field.value != potentialMillField.value) {
                        comboMet = false;
                        break;
                    }
                }
                if (comboMet) return true;
            }
        }
        return false;
    }
    public isDraw() {
        for (var field of this.fields.values()) {
            if (field.value != -1) return false;
        }
        return true;
    }
    public onFieldClick(field: BoardField) {
        console.log("clicked on field " + field.name);
    }
}