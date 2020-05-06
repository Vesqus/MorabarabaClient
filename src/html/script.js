var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var rect = canvas.getBoundingClientRect();
var cx = (canvas.width / 36) + 25;
var cy = (canvas.height / 36) + 25;
var cw = canvas.width - (canvas.width / 18) - 25;
var ch = canvas.height - (canvas.height / 18) - 25;

var Game = {
    name: 'Morabaraba',
    getInstance: function () {
        return (window[this.name] !== undefined ? window[this.name] : false);
    }
};


Morabaraba.prototype = Game;

function Morabaraba() {
    this.board = new Board();
    this.turn = 0;
    this.players = [];
    this.player = function () {
        return this.players[this.turn];
    };
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
    this.updateHud = function () {
        var stats = $('<table><thead><tr><th></th></tr></thead><tbody><tr rel="status"><td>Status :</td></tr><tr rel="cows"><td>Un-played cows:</td></tr><tr rel="fieldcows"><td>Cows grazing:</td></tr><tr rel="mills"><td>Mills made:</td></tr><tr rel="kcows"><td>Cows killed:</td></tr></tbody></table>');

        var hudHtml = '<u><b>Stats</b></u><br>';
        var self = this;
        var rows = this.players.map(function (p) {
            $(stats).find('thead>tr').append('<th>' + p.name + '</th>');
            var sts = (p.cows > 3 ? 'Placing the Cows' : (p.moving ? 'Moving the Cows' : 'Flying the Cows'));
            sts = (p.shooting ? 'Hunting infidel cows.' : sts);
            $(stats).find('tr[rel="status"]').append('<td>' + sts + '</td>');
            $(stats).find('tr[rel="cows"]').append('<td>' + p.cows + '</td>');
            $(stats).find('tr[rel="fieldcows"]').append('<td>' + p.feedingCows() + '</td>');
            $(stats).find('tr[rel="mills"]').append('<td>' + p.mills + '</td>');
            $(stats).find('tr[rel="kcows"]').append('<td>' + p.shotCows.length + '</td>');
        });
        this.players.forEach(function (p) {

            //old
            hudHtml += '<p><b>' + p.name + (self.player().name === p.name ? (self.player().shooting === false ? ' (To Move)' : ' (SHOOTING!)') : '');
            hudHtml += '</b> [ cows:' + p.cows + ', mills:' + p.mills + ', dead cows:' + p.shotCows.length + ' ]<br></p>';
            (self.player().name === p.name ? (self.player().shooting === true ? flashMsg('Cow-Abanaga! Your Shooting!', 'Click on one of your opponents cowardly cows to kill & remove it<br>then start planning dinner...', true) : flashMsg(p.name + '\'s turn.', '<< unHelpfull hint #6297 >><br> Take care of the cow!...', true)) : '');
        });
        //document.getElementById('hud').innerHTML = hudHtml;
        $('#hud').html(stats);
    };

    this.changeTurn = function () {
        //update player state
        this.player().checkState();
        //change player turn
        if (this.player().shooting === false) {
            if (this.turn === 1) {
                this.turn = 0;
            } else {
                this.turn = 1;
            }
        }
        //update again incase of WTF
        this.player().checkState();
        this.updateHud();
    };
    this.moveMadMill = function (sect) {
        var possibleMills = this.millCombos.filter(mill => mill.indexOf(sect.index) > -1);
        var millMade = possibleMills.filter(mill => (
            this.board.iSects[mill[0]].player === this.turn && this.board.iSects[mill[1]].player === this.turn && this.board.iSects[mill[2]].player === this.turn
        ));
        return (millMade.length >= 1);
    };
    this.sendPlaceCow = function (sect) {
        console.log(sect.index);
    }
    this.sendPlaceShotCow = function (sourcesect, targetsect) {
        console.log(sourcesect.index + 'x' + targetsect.index);
    };
    this.sendMoveCow = function (sourcesect, targetsect) {
        console.log(sourcesect.index + '-' + targetsect.index);
    };
    this.sendMoveShotCow = function (sourcesect, targetsect, shotsect) {
        console.log(sourcesect.index + '-' + targetsect.index + 'x' + shotsect.index);
    };
    this.bindEvents = function () {
        function getMousePos(evt) {
            var rect = canvas.getBoundingClientRect();
            return {
                x: evt.clientX - rect.left,
                y: evt.clientY - rect.top
            };
        }
        canvas.addEventListener('mousemove', (e) => {
            var mPos = getMousePos(e);
            this.board.checkHover(mPos, e);
        });
        canvas.addEventListener('click', (e) => {
            var mPos = getMousePos(e);
            var clickedSect = this.board.focusedSect(mPos, e);
            if (this.player().shooting === true) {
                if (clickedSect.isOpen === false && clickedSect.player !== this.turn) {
                    this.player().shotCows.push(clickedSect);
                    this.player().shooting = false;
                    clickedSect.player = false;
                    clickedSect.isOpen = true;
                    if (this.player().moving || this.player().flying) {
                        this.sendMoveShotCow(this.player().sourceCow, this.player().clickedSect, clickedSect);
                    } else {
                        this.sendPlaceShotCow(this.player().placedCow, clickedSect);
                    }
                    this.changeTurn();
                }
            } else if (this.player().moving === true || this.player().flying === true) {
                if (clickedSect.player === this.turn) { //start move && highlight chosen cow, unselect the rest
                    Object.keys(this.board.iSects).forEach((key) => {
                        this.board.iSects[key].selected = (key === clickedSect.index ? true : false);
                    });
                    this.player().cowSelected = clickedSect.index;
                } else if (this.player().cowSelected && clickedSect.isOpen) {
                    //filter mill combinations for mills containing clicked index
                    var sourceCow = this.board.iSects[this.player().cowSelected];
                    if (this.player().moving === true) {
                        var srcMills = this.millCombos.filter(mill => (mill.indexOf(sourceCow.index) > -1));
                        var validIndexes = srcMills.map(function (mill) {
                            var pos = mill.indexOf(sourceCow.index);
                            if (pos === 0 || pos === 2) {
                                return mill[1];
                            }
                            return mill[0] + '|' + mill[2];
                        }).join('|');
                        console.log('Only valid indexes are:', validIndexes)
                        if (validIndexes.indexOf(clickedSect.index) === -1) {
                            return false;
                        }
                    }
                    // click was valid finish move
                    sourceCow.selected = false;
                    sourceCow.isOpen = true;
                    sourceCow.player = false;
                    clickedSect.player = this.turn;
                    clickedSect.isOpen = false;
                    this.player().cowSelected = false;
                    if (this.moveMadMill(clickedSect)) {
                        //  alert( "You made a mill! Time for the gunning of the bulls..." );
                        this.player().mills++;
                        this.player().shooting = true;
                        this.player().sourceCow = sourceCow;
                        this.player().clickedSect = clickedSect;
                    } else {
                        this.sendMoveCow(sourceCow, clickedSect);
                    }
                    this.changeTurn();
                }
            } else if (this.player().cows > 0) {
                if (clickedSect.isOpen === true) {
                    clickedSect.player = this.turn;
                    clickedSect.isOpen = false;
                    this.player().cows--;
                    if (this.moveMadMill(clickedSect)) {
                        //  alert( "You made a mill! Time for the gunning of the bulls..." );
                        this.player().mills++;
                        this.player().shooting = true;
                        this.player().placedCow = clickedSect;
                    } else {
                        this.sendPlaceCow(clickedSect);
                    }
                    this.changeTurn();
                }
            }
        });
        //drawing loop
        window.setInterval(() => {
            this.board.drawBoard();
        }, 20);
    };
    this.setScope = function () {
        window[this.name] = this;
    };
    var _init = (function (game) {
        game.updateHud();
        game.bindEvents();
        game.setScope();
        game.players = [new Player(0), new Player(1)];
        document.body.setAttribute('class', 'loaded');

    })(this);
}

function Player(id, name = 'Player') {
    this.cows = 12,
        this.id = id,
        this.name = (name === 'Player' ? name + ' ' + (id + 1) : name),
        this.mills = 0,
        this.shotCows = [],
        this.flying = false,
        this.moving = false,
        this.cowSelected = false,
        this.shooting = false,
        this.feedingCows = function () {
            return Object.keys(Game.getInstance().board.iSects).filter(key => (Game.getInstance().board.iSects[key].player === this.id)).length;
        },
        this.checkState = function () {
            if (this.cows === 0) {
                if (this.feedingCows() > 3) {
                    this.moving = true;
                } else if (this.feedingCows() === 3) {
                    this.moving = false;
                    this.flying = true;
                } else {
                    flashMsg("Game Over! ", this.name + " is a COWard!", true, '<button onclick="window.newGame()">New Game</button>');
                }
            }
        };
}

function Board() {
    this.iSects = {
        a7: {
            isOpen: true,
            player: false,
            mouseOver: false,
            x: cx,
            y: cy
        },
        a4: {
            isOpen: true,
            player: false,
            mouseOver: false,
            x: cx,
            y: ch / 2 + cy / 2
        },
        a1: {
            isOpen: true,
            player: false,
            mouseOver: false,
            x: cx,
            y: ch + cy / 2
        },
        b6: {
            isOpen: true,
            player: false,
            mouseOver: false,
            x: cx + cw / 6,
            y: cy + ch / 6
        },
        b4: {
            isOpen: true,
            player: false,
            mouseOver: false,
            x: cx + cw / 6,
            y: ch / 2 + cy / 2
        },
        b2: {
            isOpen: true,
            player: false,
            mouseOver: false,
            x: cx + cw / 6,
            y: cy / 2 + ch - (ch / 6)
        },
        c5: {
            isOpen: true,
            player: false,
            mouseOver: false,
            x: cx + cw / 3,
            y: cy + ch / 3
        },
        c4: {
            isOpen: true,
            player: false,
            mouseOver: false,
            x: cx + cw / 3,
            y: ch / 2 + cy / 2
        },
        c3: {
            isOpen: true,
            player: false,
            mouseOver: false,
            x: cx + cw / 3,
            y: ch - (ch / 3)
        },
        d1: {
            isOpen: true,
            player: false,
            mouseOver: false,
            x: cx / 2 + cw / 2,
            y: ch + cy / 2
        },
        d2: {
            isOpen: true,
            player: false,
            mouseOver: false,
            x: cx / 2 + cw / 2,
            y: cy / 2 + ch - (ch / 6)
        },
        d3: {
            isOpen: true,
            player: false,
            mouseOver: false,
            x: cx / 2 + cw / 2,
            y: ch - (ch / 3)
        },
        d5: {
            isOpen: true,
            player: false,
            mouseOver: false,
            x: cx / 2 + cw / 2,
            y: ch / 3 + cy
        },
        d6: {
            isOpen: true,
            player: false,
            mouseOver: false,
            x: cx / 2 + cw / 2,
            y: ch / 6 + cy
        },
        d7: {
            isOpen: true,
            player: false,
            mouseOver: false,
            x: cx / 2 + cw / 2,
            y: cy
        },
        e5: {
            isOpen: true,
            player: false,
            mouseOver: false,
            x: cw - (cw / 3),
            y: cy + ch / 3
        },
        e4: {
            isOpen: true,
            player: false,
            mouseOver: false,
            x: cw - (cw / 3),
            y: ch / 2 + cy / 2
        },
        e3: {
            isOpen: true,
            player: false,
            mouseOver: false,
            x: cw - (cw / 3),
            y: ch - (ch / 3)
        },
        f6: {
            isOpen: true,
            player: false,
            mouseOver: false,
            x: cx / 2 + cw - (cw / 6),
            y: cy + ch / 6
        },
        f4: {
            isOpen: true,
            player: false,
            mouseOver: false,
            x: cx / 2 + cw - (cw / 6),
            y: ch / 2 + cy / 2
        },
        f2: {
            isOpen: true,
            player: false,
            mouseOver: false,
            x: cx / 3 + cw - (cw / 6),
            y: cy / 2 + ch - (ch / 6)
        },
        g7: {
            isOpen: true,
            player: false,
            mouseOver: false,
            x: cw + cx / 2,
            y: cy
        },
        g4: {
            isOpen: true,
            player: false,
            mouseOver: false,
            x: cw + cx / 2,
            y: ch / 2 + cy / 2
        },
        g1: {
            isOpen: true,
            player: false,
            mouseOver: false,
            x: cw + cx / 2,
            y: ch + cy / 2
        },
    };
    var boardSquares = [
        [this.iSects.a7.x, this.iSects.a7.y, this.iSects.g1.x - this.iSects.a7.x, this.iSects.g1.y - this.iSects.a7.y], //outer
        [this.iSects.b6.x, this.iSects.b6.y, this.iSects.f2.x - this.iSects.b6.x, this.iSects.f2.y - this.iSects.b6.y], //mid
        [this.iSects.c5.x, this.iSects.c5.y, this.iSects.e3.x - this.iSects.c5.x, this.iSects.e3.y - this.iSects.c5.y] //inner
    ];
    var boardLines = [ //drawn clockwise starting at 0,0
        [this.iSects.a7.x, this.iSects.a7.y, this.iSects.c5.x, this.iSects.c5.y],
        [this.iSects.d7.x, this.iSects.d7.y, this.iSects.d5.x, this.iSects.d5.y],
        [this.iSects.g7.x, this.iSects.g7.y, this.iSects.e5.x, this.iSects.e5.y],
        [this.iSects.g4.x, this.iSects.g4.y, this.iSects.e4.x, this.iSects.e4.y],
        [this.iSects.g1.x, this.iSects.g1.y, this.iSects.e3.x, this.iSects.e3.y],
        [this.iSects.d1.x, this.iSects.d1.y, this.iSects.d3.x, this.iSects.d3.y],
        [this.iSects.a1.x, this.iSects.a1.y, this.iSects.c3.x, this.iSects.c3.y],
        [this.iSects.a4.x, this.iSects.a4.y, this.iSects.c4.x, this.iSects.c4.y]
    ];
    this.checkHover = (mPos, e) => {
        hoveredSect = this.focusedSect(mPos, e);
        if (hoveredSect) {
            hoveredSect.mouseOver = true;
        }
    };

    this.focusedSect = (mPos, e) => {
        var infocus = false;
        Object.keys(this.iSects).forEach((key) => {
            this.iSects[key].index = key;
            var sect = this.iSects[key];
            if (mPos.x > (sect.x - cw / 36) && mPos.x < (sect.x + cw / 36) && mPos.y > (sect.y - ch / 36) && mPos.y < (sect.y + ch / 36)) {
                infocus = this.iSects[key];
            } else {
                this.iSects[key].mouseOver = false;
            }
        });
        return infocus;
    }
    var backgroundStyle = '#fff';
    var lineStyle = '#000';
    var iSectstyle = 'rgba(0,10,10,0.6)';//'rgba(127,127,127,0.5)';
    var hoverStyle = 'rgba(236,233,0,0.1)';
    this.drawPieces = function () {
        Object.keys(this.iSects).forEach((key) => {
            ctx.beginPath();
            var sect = this.iSects[key];
            ctx.fillStyle = (sect.mouseOver ? hoverStyle : iSectstyle);
            ctx.fillStyle = (sect.isOpen ? ctx.fillStyle : ['rgba(8,4,4,0.9)', 'rgba(255,255,255,0.6)'][sect.player]);
            var scale = 0.8, ix = cx * scale;

            if (!sect.isOpen) {

                var img = document.querySelector('img[player-id="' + sect.player + '"]');
                if (sect.selected === true) {
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.lineWidth = 5;
                    ctx.strokeStyle = 'rgba(255,0,0,0.6)';
                    //  ctx.ellipse( sect.x-ix, sect.y-ix,ix*2,ix*2);
                    ctx.moveTo(sect.x, sect.y);
                    ctx.ellipse(sect.x, sect.y, cx * 0.8, cy * 0.8, 45 * Math.PI / 180, 0, 2 * Math.PI);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = 'rgba(255,255,0,0.2)';
                }
                ctx.drawImage(img, sect.x - ix, sect.y - ix, ix * 2, ix * 2);

            } else {
                ctx.moveTo(sect.x, sect.y);
                //ctx.ellipse( sect.x, sect.y, cw / 36, ch / 36, 45 * Math.PI / 180, 0, 2 * Math.PI );
                ctx.ellipse(sect.x, sect.y, cx / 2, cy / 2, 45 * Math.PI / 180, 0, 2 * Math.PI);
                ctx.fill();
            }
            ctx.strokeStyle = (sect.isOpen ? '#000' : (sect.selected === true ? 'rgba(255,0,0,0.6)' : 'rgba(255,255,0,0.2)'));
            if (sect.isOpen) {
                ctx.lineWidth = 1;
            } else {
                ctx.lineWidth = 2;
            }
            ctx.lineWidth = 1;
            ctx.strokeStyle = (sect.isOpen ? 'rgba(255,255,255,0.3)' : 'green');
            ctx.textAlign = 'center';
            if (sect.isOpen) {
                ctx.strokeText(key, sect.x, sect.y + cy / 8, cw / 18);
            }
        })
    };

    this.drawBoard = function () {
        ctx.strokeStyle = 'rgba(0,10,10,0.7)';
        ctx.lineWidth = 8;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0, 0, 0,0.5)';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        /*  ctx.fillStyle = this.backgroundStyle;
          ctx.fillRect( 0, 0, canvas.width, canvas.height );*/
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();

        boardSquares.forEach(function (square) {
            ctx.rect(square[0], square[1], square[2], square[3]);
        });
        boardLines.forEach(function (line) {
            ctx.moveTo(line[0], line[1]);
            ctx.lineTo(line[2], line[3]);
        });
        //ctx.strokeStyle = "#000";
        ctx.stroke();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        this.drawPieces();
    };

    var _init = (function (board) {
        var gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.width / 2, canvas.width / 2, canvas.width / 2, 100);
        gradient.addColorStop(0, "#8c4f10");
        gradient.addColorStop(1, "#b1600d");
        board.backgroundStyle = gradient;
        board.drawBoard();
    })(this);
}

window.newGame = function () {
    var a = new Morabaraba();
    flashMsg('Game is beginning...', 'Player 1 to move.<br>Click anywhere to start playing.', true, '');
}

var screens = {
    start: {
        title: 'Welcome!',
        msg: 'Marvel at my Maraculous Marabraba Madness...<br> majestically modelled meticulously in quite a mindless mediocre way, mis-represented and masquerading as a modern medium.<br><br><small>For game info, rules and more than you care to know look <a target="_blank" href="https://en.wikipedia.org/wiki/Morabaraba">Here</a>',
        actions: [
            {
                text: 'New Game',
                callback: newGame
            }
        ]
    }
}
$(document).ready(function () {
    function showWelcome() {
        var actions = $('<span></span>');
        var dact = {};
        screens.start.actions.forEach(function (act) {
            var btn = $('<button></button').text(act.text);
            dact.callback = act.callback;
            $(actions).append(btn);
        });
        flashMsg(screens.start.title, screens.start.msg, false, actions, dact.callback);
    }
    showWelcome();

});
function flashMsg(title, msg, flash, actions, cb) {
    //  $('.overlay').clearQueue();
    //$('.overlay').stop();
    $('.overlay').each(function () {
        $(this).trigger('kickMsg');
    });
    var newMsg = $('.overlay').clone().hide();
    actions = (actions === undefined ? '' : actions);
    flash = (flash === undefined ? false : flash);
    cb = (cb === undefined ? false : cb);
    $(newMsg).find('h2').text(title);
    $(newMsg).find('p').html(msg);
    $(newMsg).find('.actions').html(actions);
    $(newMsg).find('button').one('click', function () {
        $(this).closest('.overlay').remove();
        cb(true);
    })
    if (flash === true && $('#hud th').length > 2) {
        $(newMsg).prepend($('#hud').clone().show());
    }
    $('body').prepend(newMsg);
    if (flash === true) {
        $(newMsg).addClass('flash').slideDown(function () {
            $(newMsg).on('kickMsg', function () {
                $(this).slideUp().remove();
            });
        });//.delay(2500).slideUp(100).remove();

    } else {
        $(newMsg).removeClass('flash').slideDown(function () {
            if (actions = '') {
                $(this).one('click', function () {
                    $(this).slideUp().remove();
                });
            }
        });
    }


}