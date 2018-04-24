ig.module('game.biolab').requires('plugins.impact-splash-loader', 'impact.game', 'impact.collision-map', 'impact.background-map', 'impact.font', 'game.camera', 'game.entities.player', 'game.entities.blob', 'game.entities.grunt', 'game.entities.dropper', 'game.entities.spike', 'game.entities.crate', 'game.entities.mine', 'game.entities.spewer', 'game.entities.earthquake', 'game.entities.mover', 'game.entities.debris', 'game.entities.delay', 'game.entities.void', 'game.entities.hurt', 'game.entities.levelchange', 'game.entities.respawn-pod', 'game.entities.test-tube', 'game.entities.glass-dome', 'game.entities.endhub', 'game.levels.nivel1', 'game.levels.biolab2', 'game.levels.biolab3').defines(function () {
    BiolabGame = ig.Game.extend({
        clearColor: '#0d0c0b',
        gravity: 240,
        player: null,
        mode: 0,
        lastCheckpoint: null,
        playerSpawnPos: {
            x: 0,
            y: 0
        },
        deathCount: 0,
        tubeCount: 0,
        tubeTotal: 0,
        levelTime: null,
        levelTimeText: '0',
        musicBiochemie: new ig.Sound('media/music/biochemie.ogg', false),
        font: new ig.Font('media/04b03.font.png'),
        camera: null,
        lastTick: 0.016,
        realTime: 0,
        showFPS: false,
        init: function () {
            var as = new ig.AnimationSheet('media/tiles/biolab.png', 8, 8);
            this.backgroundAnims = {
                'media/tiles/biolab.png': {
                    80: new ig.Animation(as, 0.13, [80, 81, 82, 83, 84, 85, 86, 87]),
                    81: new ig.Animation(as, 0.17, [84, 83, 82, 81, 80, 87, 86, 85]),
                    88: new ig.Animation(as, 0.23, [88, 89, 90, 91, 92, 93, 94, 95]),
                    89: new ig.Animation(as, 0.19, [95, 94, 93, 92, 91, 90, 89, 88])
                }
            };
            this.camera = new Camera(ig.system.width / 4, ig.system.height / 3, 5);
            this.camera.trap.size.x = ig.system.width / 10;
            this.camera.trap.size.y = ig.system.height / 3;
            this.camera.lookAhead.x = ig.ua.mobile ? ig.system.width / 6 : 0;
            ig.music.volume = 0.9;
            ig.music.add(this.musicBiochemie);
            ig.music.play();
            this.loadLevel(LevelBiolab1);
            this.realTime = Date.now();
            this.lastTick = 0.016;
        },
        loadLevel: function (level) {
            if (ig.ua.iPhone4 || ig.ua.android) {
                for (var i = 0; i < level.layer.length; i++) {
                    if (level.layer[i].name == 'background') {
                        level.layer.erase(level.layer[i]);
                    }
                }
            }
            this.parent(level);
            this.player = this.getEntitiesByType(EntityPlayer)[0];
            this.lastCheckpoint = null;
            this.playerSpawnPos = {
                x: this.player.pos.x,
                y: this.player.pos.y
            };
            this.deathCount = 0;
            this.tubeCount = 0;
            this.tubeTotal = this.getEntitiesByType(EntityTestTube).length;
            this.levelTime = new ig.Timer();
            this.mode = BiolabGame.MODE.GAME;
            this.camera.max.x = this.collisionMap.width * this.collisionMap.tilesize - ig.system.width;
            this.camera.max.y = this.collisionMap.height * this.collisionMap.tilesize - ig.system.height;
            this.camera.set(this.player);
            if (ig.ua.mobile) {
                for (var i = 0; i < this.backgroundMaps.length; i++) {
                    this.backgroundMaps[i].preRender = true;
                }
            }
        },
        endLevel: function (nextLevel) {
            this.nextLevel = nextLevel;
            this.levelTimeText = this.levelTime.delta().round(2).toString();
            this.mode = BiolabGame.MODE.STATS;
        },
        end: function () {
            ig.system.setGame(BiolabCredits);
        },
        respawnPlayerAtLastCheckpoint: function (x, y) {
            var pos = this.playerSpawnPos;
            if (this.lastCheckpoint) {
                pos = this.lastCheckpoint.getSpawnPos()
                this.lastCheckpoint.currentAnim = this.lastCheckpoint.anims.respawn.rewind();
            }
            this.player = this.spawnEntity(EntityPlayer, pos.x, pos.y);
            this.player.currentAnim = this.player.anims.spawn;
            this.deathCount++;
        },
        update: function () {
            this.camera.follow(this.player);
            this.parent();
        },
        draw: function () {
            this.parent();
            this.camera.draw();
            if (this.showFPS) {
                this.font.draw((1 / this.lastTick).round(), 4, 4);
            }
        },
        run: function () {
            var now = Date.now();
            this.lastTick = this.lastTick * 0.9 + ((now - this.realTime) / 1000) * 0.1;
            this.realTime = now;
            if (ig.input.pressed('fps')) {
                this.showFPS = !this.showFPS;
            }
            if (this.mode == BiolabGame.MODE.GAME) {
                this.update();
                this.draw();
            } else if (this.mode == BiolabGame.MODE.STATS) {
                this.showStats();
            }
        },
        showStats: function () {
            if (ig.input.pressed('shoot') || ig.input.pressed('jump')) {
                this.loadLevel(this.nextLevel);
                return;
            }
            var mv = ig.ua.mobile ? 20 : 0;
            ig.system.clear(this.clearColor);
            this.font.draw('Bien hecho has salvado a chavana!', ig.system.width / 2, 20, ig.Font.ALIGN.CENTER);
            this.font.draw('Tiempo transcurrido:', 98 - mv, 56, ig.Font.ALIGN.RIGHT);
            this.font.draw(this.levelTimeText + 's', 104 - mv, 56);
            this.font.draw('Puntos obtenidos:', 98 - mv, 68, ig.Font.ALIGN.RIGHT);
            this.font.draw(this.tubeCount + '/' + this.tubeTotal, 104 - mv, 68);
            this.font.draw('Oportunidades:', 98 - mv, 80, ig.Font.ALIGN.RIGHT);
            this.font.draw(this.deathCount.toString(), 104 - mv, 80);
            this.font.draw('Presiona X o C para continuar', ig.system.width / 2, 140, ig.Font.ALIGN.CENTER);
        }
    });
    BiolabGame.MODE = {
        GAME: 1,
        STATS: 2
    };
    BiolabTitle = ig.Class.extend({
        introTimer: null,
        noise: null,
        sound: new ig.Sound('media/sounds/intro.ogg', false),
        biolab: new ig.Image('media/chavana.png'),
        disaster: new ig.Image('media/scape.png'),
        player: new ig.Image('media/in_screen.jpg'),
        font: new ig.Font('media/04b03.font.png'),
        init: function () {
            if (!BiolabTitle.initialized) {
                ig.input.bind(ig.KEY.LEFT_ARROW, 'left');
                ig.input.bind(ig.KEY.RIGHT_ARROW, 'right');
                ig.input.bind(ig.KEY.X, 'jump');
                ig.input.bind(ig.KEY.C, 'shoot');
                ig.input.bind(ig.KEY.F, 'fps');
                if (ig.ua.mobile) {
                    ig.input.bindTouch('#buttonFPS', 'fps');
                    ig.input.bindTouch('#buttonLeft', 'left');
                    ig.input.bindTouch('#buttonRight', 'right');
                    ig.input.bindTouch('#buttonShoot', 'shoot');
                    ig.input.bindTouch('#buttonJump', 'jump');
                }
                BiolabTitle.initialized = true;
            }
            this.introTimer = new ig.Timer(1);
        },
        run: function () {
            if (ig.input.pressed('shoot') || ig.input.pressed('jump')) {
                ig.system.setGame(BiolabGame);
                return;
            }
            var d = this.introTimer.delta();
            if (!this.soundPlayed && d > -0.3) {
                this.soundPlayed = true;
                this.sound.play();
            }
            if (ig.ua.mobile) {
                ig.system.clear('#0d0c0b');
                this.biolab.draw((d * d * -d).limit(0, 1).map(1, 0, -160, 12), 6);
                this.disaster.draw((d * d * -d).limit(0, 1).map(1, 0, 300, 12), 46);
                this.player.draw(0,0);
                if (d > 0 && (d % 1 < 0.5 || d > 2)) {
                    this.font.draw('Presiona el Boton para Jugar', 80, 140, ig.Font.ALIGN.CENTER);
                }
            } else {
                ig.system.clear('#0d0c0b');
                this.biolab.draw((d * d * -d).limit(0, 1).map(1, 0, -160, 44), 26);
                this.disaster.draw((d * d * -d).limit(0, 1).map(1, 0, 300, 44), 70);
                this.player.draw(0, 0);
                if (d > 0 && (d % 1 < 0.5 || d > 2)) {
                    this.font.draw('Presiona X o C para Jugar', 120, 140, ig.Font.ALIGN.CENTER);
                }
            }
        }
    });
    BiolabTitle.initialized = false;
    BiolabCredits = ig.Class.extend({
        introTimer: null,
        font: new ig.Font('media/04b03.font.png'),
        lineHeight: 12,
        scroll: 0,
        scrollSpeed: 10,
        credits: ['          Gracias Por Jugar!', '', '', 'Concept, Graphics & Programming', '    Dominic Szablewski', '', 'Music', '    Andreas Loesch', '', 'Beta Testing', '    Sebastian Gerhard', '    Benjamin Hartmann', '    Jos Hirth', '    David Jacovangelo', '    Tim Juraschka', '    Christopher Klink', '    Mike Neumann', '', '', '', '', 'Made with IMPACT - http://impactjs.org/'],
        init: function () {
            this.timer = new ig.Timer();
        },
        run: function () {
            var d = this.timer.delta();
            var color = Math.round(d.map(0, 3, 255, 0)).limit(0, 255);
            ig.system.clear('rgb(' + color + ',' + color + ',' + color + ')');
            if ((d > 3 && ig.input.pressed('shoot') || ig.input.pressed('jump')) || (ig.system.height - this.scroll + (this.credits.length + 2) * this.lineHeight < 0)) {
                ig.system.setGame(BiolabTitle);
                return;
            }
            var mv = ig.ua.mobile ? 0 : 32;
            if (d > 4) {
                this.scroll += ig.system.tick * this.scrollSpeed;
                for (var i = 0; i < this.credits.length; i++) {
                    var y = ig.system.height - this.scroll + i * this.lineHeight;
                    this.font.draw(this.credits[i], mv, y);
                }
            }
        }
    });
    BiolabGame.start = function () {
        ig.Sound.use = [ig.Sound.FORMAT.MP3, ig.Sound.FORMAT.OGG];
        if (ig.ua.iPad) {
            ig.Sound.enabled = false;
            ig.main('#canvas', BiolabTitle, 60, 240, 160, 2, ig.ImpactSplashLoader);
        } else if (ig.ua.iPhone4) {
            ig.Sound.enabled = false;
            ig.main('#canvas', BiolabTitle, 60, 160, 160, 4, ig.ImpactSplashLoader);
        } else if (ig.ua.mobile) {
            ig.Sound.enabled = false;
            ig.main('#canvas', BiolabTitle, 60, 160, 160, 2, ig.ImpactSplashLoader);
        } else {
            ig.main('#canvas', BiolabTitle, 60, 240, 160, 2, ig.ImpactSplashLoader);
        }
    };
});