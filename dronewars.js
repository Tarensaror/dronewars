var config = {
    type: Phaser.CANVAS,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y:0 },
            debug: true
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
        spawnDrone: spawnDrone
    }
};

var player;
var stadium;
var game = new Phaser.Game(config);
var graphA;
var sectorA = [];
var sectorB = [];
var sectorC = [];
var sectorD = [];
var sectorE = [];
var sectorF = [];
var sectorG = [];
var sectorH = [];

var sectors = [];
var path;

var angle;
var sector;
var sensorSector;

var graphs = [];

var drones;
var sensor;

var halfHeight = config.height / 2;
var halfWidth = (config.width / 2)*0.8;

var speedFactorX = config.width * 0.1;
var speedFactorY = config.height * 0.1;

var sensorSpeedX = speedFactorX * 2;
var sensorSpeedY = speedFactorY * 2;

var droneSpeed = 1;

var spawnDroneEvent;

var overlay;
var oldSector;

var foo = [];
var highlight;

var oneOutOfEightX = halfWidth/4;
var oneOutOfEightY = halfHeight/4;


function preload ()
{
    // Load statics
    this.load.spritesheet('droneSprite', 'assets/droneSprite.png', {frameWidth: 280, frameHeight: 280});
    this.load.image('map', 'assets/board_new.jpg');
    this.load.image('player', 'assets/player.png');
    this.load.image('stadium', 'assets/stadium.png');
}

function create ()
{
    cursors = this.input.keyboard.createCursorKeys();

    this.add.image(halfWidth, halfHeight, 'map').setScale(2.0);
    stadium = this.physics.add.image(halfWidth, halfHeight, 'stadium').setScale(0.05);
    stadium.setDepth(0);

    sensor = this.physics.add.image(halfWidth, halfHeight, 'player').setScale(0.4);

    drones = this.physics.add.group(0);

    spawnDroneEvent = this.time.addEvent({ delay: Math.random()*1500+5000, callback: spawnDrone, callbackScope: this, loop: true });



    var a, b, x, y;
    var a2, b2, x2, y2;
    var index = 0;
    var lala = this.add.graphics(0, 0);



    for (var m = 0; m < 24 ; m++) {
        foo[m] = this.add.graphics(0, 0);
    }

    for (var i = 0; i < 3;i++) {
        for(var j = 0; j < 8; j++ ) {

            a = oneOutOfEightX * (1 + i%3);
            b = oneOutOfEightY * (1 + i%3);

            x = a * Math.cos((Math.PI/4) * (j%8)) + halfWidth;
            y = b * Math.sin((Math.PI/4) * (j%8)) + halfHeight;

            graphs[index] = this.add.path(x, y);

            a2 = oneOutOfEightX * (2 + i%3);
            b2 = oneOutOfEightY * (2 + i%3);

            x2 = a2 * Math.cos((Math.PI/4) * (j%8)) + halfWidth;
            y2 = b2 * Math.sin((Math.PI/4) * (j%8)) + halfHeight;

            graphs[index].lineTo(x2, y2);
            graphs[index].ellipseTo(oneOutOfEightX * (2 + i%3), oneOutOfEightY * (2 + i%3), (45 * j), 45 * (1 + j), false, 0);
            graphs[index].lineTo((halfWidth - graphs[index].getEndPoint().x) / (2 + i%3) + graphs[index].getEndPoint().x, (halfHeight - graphs[index].getEndPoint().y) / (2+i%3) + graphs[index].getEndPoint().y) ;

            graphs[index].ellipseTo(oneOutOfEightX * (1 + i%3), (oneOutOfEightY * (1 + i%3)), 45 * (1 + j), (45 * j), true, 0);
            graphs[index].closePath();
            graphs[index].draw(foo[index]);

            index++;
        }
    }

    // make graphic for highlighting
    foo[foo.length] = this.add.graphics(0, 0);
    overlay = foo[foo.length - 1];


    sectors[0] = sectorA;
    sectors[1] = sectorB;
    sectors[2] = sectorC;
    sectors[3] = sectorD;
    sectors[4] = sectorE;
    sectors[5] = sectorF;
    sectors[6] = sectorG;
    sectors[7] = sectorH;

    var map = [4, 5, 6, 7, 0, 1, 2, 3];

    {
        for (var sec =0; sec < 8; sec++) {
            for (var area = 0; area < 3; area++) {
                sectors[sec][area] = foo[map[sec] + (area * 8)];
            }
        }
    }

    //drone animation
    this.anims.create({
        key: 'fly',
        frames: this.anims.generateFrameNumbers('droneSprite', {start: 0, end: 3}),
        frameRate: 15,
        repeat: -1
    });
}

function spawnDrone() {
    //außerhalb vom bildschirm
    var xPosition = (Math.random()*(halfWidth*2+400))-200;
    var yPosition =0;
    if(xPosition < 0 || xPosition > halfWidth*2){
        yPosition = Math.random()*config.height;
    } else {
        if((Math.random())>0.5){
            yPosition = Math.random()*200-200;
        } else {
            yPosition = Math.random()*200+config.height;
        }
    }

    var newDrone = (this.physics.add.sprite(xPosition, yPosition, 'droneSprite').setScale(0.2));
    newDrone.setDepth(20);

    drones.add(newDrone);
    this.physics.add.overlap(stadium, drones, collectDrone, null, this);


    //richtung stadion. szenengröße beachten (bei geschwindigkeit)!
    var distance = Phaser.Math.Distance.Between(xPosition, yPosition, halfWidth, halfHeight);
    var speed = droneSpeed*distance*0.1;
    this.physics.moveTo(newDrone, halfWidth, halfHeight, speed);


    //sensor fängt drohne - brauchen wir nicht, ist aber lustig
    //this.physics.add.overlap(player, newDrone, collectDrone, null, this);
}

function collectDrone(stadium, newDrone) {
    drones.remove(newDrone);
    newDrone.destroy();
}

function update ()
{
    // highlight handling

    // get sector
    angle = Math.acos( ((halfWidth-game.input.mousePointer.x) / (Math.sqrt( Math.pow(halfWidth - game.input.mousePointer.x,2) + Math.pow(halfHeight - game.input.mousePointer.y,2 ) ))));
    if(game.input.mousePointer.y > halfHeight) {
        angle *= -1;
    }

    sector = Number(angle/(Math.PI/4));
    sector= Math.floor(sector);
    if(sector < 0) {
        sector = 8 + sector;
    }

    // get distance
    var distance = (Math.sqrt( Math.pow(halfWidth - game.input.mousePointer.x,2) + Math.pow(halfHeight - game.input.mousePointer.y,2 )));
    //if (distance > on)

    highlight = sectors[sector][0];

    if(oldSector != sector) {
        overlay.clear();
        overlay.lineStyle(4, 0x00ff00, 1);
        graphs[foo.indexOf(highlight)].draw(overlay);
    }
    oldSector = sector


    var currentDrones = drones.getChildren();
    for(var i = 0; i < currentDrones.length; i++){
        currentDrones[i].anims.play('fly', true);
    }

    // place sensor at selected sector
    this.input.on('pointerdown', function(pointer){
        var highSector = graphs[foo.indexOf(highlight)];
        var endPoint = highSector.curves[2].p1;
        sensorSector = sectors[sector];
        sensor.x = highSector.startPoint.x - ((highSector.startPoint.x - endPoint.x)/2);
        sensor.y = highSector.startPoint.y - ((highSector.startPoint.y - endPoint.y)/2);
    }, this);
}