import React from 'react';
import logo from './logo.svg';
import './App.css';
import * as PIXI from 'pixi.js';

function App() {

  function keyboard(value) {
    let key = {};
    key.value = value;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    //The `downHandler`
    key.downHandler = event => {
      if (event.key === key.value) {
        if (key.isUp && key.press) key.press();
        key.isDown = true;
        key.isUp = false;
        event.preventDefault();
      }
    };

    //The `upHandler`
    key.upHandler = event => {
      if (event.key === key.value) {
        if (key.isDown && key.release) key.release();
        key.isDown = false;
        key.isUp = true;
        event.preventDefault();
      }
    };

    //Attach event listeners
    const downListener = key.downHandler.bind(key);
    const upListener = key.upHandler.bind(key);
    
    window.addEventListener(
      "keydown", downListener, false
    );
    window.addEventListener(
      "keyup", upListener, false
    );
    
    // Detach event listeners
    key.unsubscribe = () => {
      window.removeEventListener("keydown", downListener);
      window.removeEventListener("keyup", upListener);
    };
    
    return key;
  }

  let rightKey = keyboard("ArrowRight")
  let leftKey = keyboard("ArrowLeft")
  let upKey = keyboard("ArrowUp")

  let tabKey = keyboard("Tab")

  //Create a Pixi Application
  let app = new PIXI.Application({width: 256, height: 256});

  app.renderer.backgroundColor = 0x069639;
  app.renderer.view.style.position = "absolute";
  app.renderer.view.style.display = "block";
  app.renderer.autoResize = true;
  app.renderer.resize(window.innerWidth, window.innerHeight/2.6);

  //Add the canvas that Pixi automatically created for you to the HTML document
  document.body.appendChild(app.view);

  app.loader
  .add("logo192.png")
  .add("stages/floatingskyes/sky.png")
  .add("stages/floatingskyes/sea.png")
  .add("stages/floatingskyes/tileset.png")
  .add("stages/floatingskyes/clouds.png")
  .add("stages/floatingskyes/far-grounds.png")
  .add("char/adventurer.png")
  .add("char/adventurerss.json")
  .add("char/spacecadet.png")
  .add("char/spacecadet.json")
  .add("char/fireball.png")
  .add("char/fireball.json")
  .load(setup);

  let TextureCache = app.loader.resources;
  let Rectangle = PIXI.Rectangle;

  //groupNum = 0

  class Projectile {
    constructor(groupNum, col, x, y, resourcepath, app, lookRight) {
      this.x = x
      this.y = y + 6
      if (lookRight) {
        this.vx = 20
      } else {
        this.vx = -20
      }
      this.vy = 0
      this.lookRight = lookRight
      this.app = app
      this.sheet = app.loader.resources[resourcepath].spritesheet
      if (lookRight) {
        this.currentSprite = new PIXI.AnimatedSprite(this.sheet.animations["fb-right"])
      } else {
        this.currentSprite = new PIXI.AnimatedSprite(this.sheet.animations["fb-left"])
      }
      this.currentSprite.scale.x = 0.07 
      this.currentSprite.scale.y = 0.07
      this.currentSprite.play()
      this.appear()
      this.changeSprite()
      col.push(this)

      this.groupNum = groupNum
      this.isProjectile = true

      this.exist = true
    }

    changeSprite() {
      this.currentSprite.x = this.x
      this.currentSprite.y = this.y
    }

    appear() {
      this.app.stage.addChild(this.currentSprite)
    }

    disappear() {
      this.app.stage.removeChild(this.currentSprite)
    }

    damage(damageAmount) {
      this.disappear()
      return true
    }

    gameLoop(delta) {
      this.x += this.vx * delta
      this.y += this.vy * delta

      if (this.currentSprite) {
        this.changeSprite()
      }
    }

    currentSprite() {
      return this.currentSprite
    }
  }


  //3 inputs: object interaction / collision, time step for speed and position, keyboard input
  class Character {
    constructor(groupNum, col, x, y, animated, resourcepath, app, beingDamaged, hp, baseAttack, element, attackSpeed, melee, flying, projectileobj) {
      this.x = x
      this.y = y
      this.vx = 0
      this.vy = 0
      this.app = app
      this.currentSprite = null
      this.beingDamaged = beingDamaged
      this.hp = hp
      this.baseAttack = baseAttack
      this.element = element
      this.attackSpeed = attackSpeed
      this.melee = melee
      this.stayInFrame = true
      this.beingDamaged = false
      this.flying = flying
      this.onTheGround = true
      this.sheet = app.loader.resources[resourcepath].spritesheet
      this.lookRight = true
      this.curAnim = null
      this.projectileobj = projectileobj
      this.shooting = false
      this.collect = col
      col.push(this)

      this.groupNum = groupNum
      groupNum += 1
      this.isProjectile = false

      this.exist = true
    }

    changeAnimation(animationName) {
      if (this.curAnim !== animationName) {
        if (this.currentSprite) {
          this.disappear()
        }
        this.curAnim = animationName
        this.currentSprite = new PIXI.AnimatedSprite(this.sheet.animations[animationName])
        this.currentSprite.animationSpeed = 0.13
        this.currentSprite.play()
        this.appear()
      }
      this.changeSprite()
    }

    changeSprite() {
      this.currentSprite.x = this.x
      this.currentSprite.y = this.y
    }

    appear() {
      this.app.stage.addChild(this.currentSprite)
    }

    disappear() {
      this.app.stage.removeChild(this.currentSprite)
    }

    damage(damageAmount) {
      if (this.hp >= damageAmount) {
        this.hp -= damageAmount
      } else {
        this.hp = 0
      }

      if (this.hp === 0) {
        this.disappear()
        return true
      }

      return false
    }

    walkright() {
      this.vx = 3
      this.lookRight = true
      this.updateAnimation()
    }

    walkleft() {
      this.vx = -3
      this.lookRight = false
      this.updateAnimation()
    }

    stopWalking() {
      this.vx = 0
      this.updateAnimation()
    }

    updateAnimation() {
      if (this.shooting) {
        if (this.lookRight) {
          this.changeAnimation("right-shoot")
        } else {
          this.changeAnimation("left-shoot")
        }
        return
      }
      if (this.onTheGround) {
        if (this.lookRight) {
          if (this.vx === 0) {
            this.changeAnimation("right-seeleft")
          } else {
            this.changeAnimation("right-walk")
          }
        } else {
          if (this.vx === 0) {
            this.changeAnimation("left-seeright")
          } else {
            this.changeAnimation("left-walk")
          }
        }
      } else {
        if (this.lookRight) {
          this.changeAnimation("right-jump")
        } else {
          this.changeAnimation("left-jump")
        }
      }
    }

    jump() {
      if (this.onTheGround) {
        this.onTheGround = false
        this.vy = -10
        this.updateAnimation()
      }
    }

    hitGround() {
      this.onTheGround = true
      this.vy = 0
      this.updateAnimation()
    }

    shoot() {
      this.shooting = true
      let newBullet = new this.projectileobj(this.groupNum, this.collect, this.x, this.y, "char/fireball.json", this.app, this.lookRight)
      this.app.ticker.add((delta) => newBullet.gameLoop(delta));
      this.updateAnimation()
      setTimeout(() => {
        this.shooting = false
        this.updateAnimation()
      }, 300)
    }

    gameLoop(delta) {
      this.x += this.vx * delta
      this.y += this.vy * delta
      if (!this.onTheGround) {
        this.vy += delta * 0.3  
      }

      if (this.y > 200) {
        this.y = 200
        this.onTheGround = true
      }

      if (this.currentSprite) {
        this.updateAnimation()
        this.changeSprite()
      }
    }

    currentSprite() {
      return this.currentSprite
    }
  }

  function setup() {
    skybgsetup();
    char1setup();

    app.ticker.add((delta) => gameLoop(delta));
  }

  function skybgsetup() {
    //Sky

    let sky1 = new PIXI.Sprite(app.loader.resources["stages/floatingskyes/sky.png"].texture);
    sky1.x = 0;
    sky1.y = 0;
    sky1.scale.x = 2;
    sky1.scale.y = 1;

    app.stage.addChild(sky1);

    let sky2 = new PIXI.Sprite(app.loader.resources["stages/floatingskyes/sky.png"].texture);
    sky2.x = 220;
    sky2.y = 0;
    sky2.scale.x = 2;
    sky2.scale.y = 1;

    app.stage.addChild(sky2);

    let sky3 = new PIXI.Sprite(app.loader.resources["stages/floatingskyes/sky.png"].texture);
    sky3.x = 440;
    sky3.y = 0;
    sky3.scale.x = 2;
    sky3.scale.y = 1;

    app.stage.addChild(sky3);

    let sky4 = new PIXI.Sprite(app.loader.resources["stages/floatingskyes/sky.png"].texture);
    sky4.x = 660;
    sky4.y = 0;
    sky4.scale.x = 2;
    sky4.scale.y = 1;

    app.stage.addChild(sky4);

    let sky5 = new PIXI.Sprite(app.loader.resources["stages/floatingskyes/sky.png"].texture);
    sky5.x = 880;
    sky5.y = 0;
    sky5.scale.x = 2;
    sky5.scale.y = 1;

    app.stage.addChild(sky5);

    let sky6 = new PIXI.Sprite(app.loader.resources["stages/floatingskyes/sky.png"].texture);
    sky6.x = 1100;
    sky6.y = 0;
    sky6.scale.x = 2;
    sky6.scale.y = 1;

    app.stage.addChild(sky6);


    //Cloud

    let cloud1 = new PIXI.Sprite(app.loader.resources["stages/floatingskyes/clouds.png"].texture);
    cloud1.x = 0;
    cloud1.y = 70;
    cloud1.scale.x = 1;
    cloud1.scale.y = 1;

    app.stage.addChild(cloud1);

    let cloud2 = new PIXI.Sprite(app.loader.resources["stages/floatingskyes/clouds.png"].texture);
    cloud2.x = 540;
    cloud2.y = 70;
    cloud2.scale.x = 1;
    cloud2.scale.y = 1;

    app.stage.addChild(cloud2);


    //Sea

    let sea1 = new PIXI.Sprite(app.loader.resources["stages/floatingskyes/sea.png"].texture);
    sea1.x = 0;
    sea1.y = 210;
    sea1.scale.x = 1;
    sea1.scale.y = 1;

    app.stage.addChild(sea1);

    let sea2 = new PIXI.Sprite(app.loader.resources["stages/floatingskyes/sea.png"].texture);
    sea2.x = 112;
    sea2.y = 210;
    sea2.scale.x = 1;
    sea2.scale.y = 1;

    app.stage.addChild(sea2);

    let sea3 = new PIXI.Sprite(app.loader.resources["stages/floatingskyes/sea.png"].texture);
    sea3.x = 224;
    sea3.y = 210;
    sea3.scale.x = 1;
    sea3.scale.y = 1;

    app.stage.addChild(sea3);

    let sea4 = new PIXI.Sprite(app.loader.resources["stages/floatingskyes/sea.png"].texture);
    sea4.x = 336;
    sea4.y = 210;
    sea4.scale.x = 1;
    sea4.scale.y = 1;

    app.stage.addChild(sea4);

    let sea5 = new PIXI.Sprite(app.loader.resources["stages/floatingskyes/sea.png"].texture);
    sea5.x = 448;
    sea5.y = 210;
    sea5.scale.x = 1;
    sea5.scale.y = 1;

    app.stage.addChild(sea5);

    let sea6 = new PIXI.Sprite(app.loader.resources["stages/floatingskyes/sea.png"].texture);
    sea6.x = 560;
    sea6.y = 210;
    sea6.scale.x = 1;
    sea6.scale.y = 1;

    app.stage.addChild(sea6);

    let sea7 = new PIXI.Sprite(app.loader.resources["stages/floatingskyes/sea.png"].texture);
    sea7.x = 672;
    sea7.y = 210;
    sea7.scale.x = 1;
    sea7.scale.y = 1;

    app.stage.addChild(sea7);


    //Far BG

    let fbg1 = new PIXI.Sprite(app.loader.resources["stages/floatingskyes/far-grounds.png"].texture);
    fbg1.x = 272;
    fbg1.y = 194;
    fbg1.scale.x = 1;
    fbg1.scale.y = 1;

    app.stage.addChild(fbg1);
  }

  let collect = []

  function char1setup() {
    // let char1sheet = app.loader.resources["char/adventurerss.json"].spritesheet

    // // let char1texture = TextureCache["char/adventurer.png"];
    // // let Rectanglele = new PIXI.Rectangle(7, 12, 15, 20);
    // // char1texture.frame = rectangle;
    // let char1 = new PIXI.AnimatedSprite(char1sheet.animations["adventurer-right-walk"]);

    let char2 = new Character(1, collect, 600, 200, true, "char/spacecadet.json", app, false, 100, 10, 1, 10, true, false, Projectile)
    char2.changeAnimation("left-seeright")

    char2 = new Character(1, collect, 400, 200, true, "char/spacecadet.json", app, false, 100, 10, 1, 10, true, false, Projectile)
    char2.changeAnimation("left-seeright")

    char2 = new Character(1, collect, 200, 200, true, "char/spacecadet.json", app, false, 100, 10, 1, 10, true, false, Projectile)
    char2.changeAnimation("left-seeright")

    let char1 = new Character(0, collect, 10, 200, true, "char/spacecadet.json", app, false, 100, 10, 1, 10, true, false, Projectile)
    char1.changeAnimation("right-seeleft")

    rightKey.press = () => {
      char1.walkright()
    };
    rightKey.release = () => {
      char1.stopWalking()
    };

    leftKey.press = () => {
      char1.walkleft()
    };
    leftKey.release = () => {
      char1.stopWalking()
    };

    upKey.press = () => {char1.jump()};

    tabKey.press = () => {char1.shoot()};

    app.ticker.add((delta) => char1.gameLoop(delta))
  }

  function closefunc(sp1, sp2) {
    return ((sp1.x - sp2.x) * (sp1.x - sp2.x) + (sp1.y - sp2.y) * (sp1.y - sp2.y)) < 400
  }

  function gameLoop(delta) {
    console.log(collect)

    let numObjects = collect.length
    for (let i = 0; i < numObjects; i++) {
      for (let j = 0; j < numObjects; j++) {
        if (i > j) {
          let obj1 = collect[i]
          let obj2 = collect[j]
          if (!obj1.exist || !obj2.exist) {
            continue
          }
          let sprite1 = obj1.currentSprite
          if (sprite1 === null) {
            continue
          }
          let sprite2 = obj2.currentSprite
          if (sprite2 === null) {
            continue
          }
          if (closefunc(sprite1, sprite2)) {
            if (obj1.isProjectile || obj2.isProjectile) {
              if (obj1.groupNum !== obj2.groupNum) {
                let del1 = obj1.damage(200)
                let del2 = obj2.damage(200)
                if (del1) {
                  obj1.exist = false
                }
                if (del2) {
                  obj2.exist = false
                }
              }
            }
          }
        }
      }
    }

    // let newcollect = []
    // for (let i = 0; i < numObjects; i++) {
    //   if (exist[i] === 1) {
    //     newcollect.push(collect[i])
    //   }
    // }

    // collect = newcollect

    //Check if there are any bad collisions

    //If hit, reduce hp

    //If one hp is zero, set winner (or draw). Then end game
  }

  return (
    <div className="App">
    </div>
  );
}

export default App;
