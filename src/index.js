Array.prototype.parse2d = function(number_of_tiles_wide){
    const rows = [];
    for (let ix=0; ix < this.length; ix+=number_of_tiles_wide){
        rows.push(this.slice(ix, ix+number_of_tiles_wide));    }
    return rows;    }

Array.prototype.createObjectsFrom2D = function (object_width_pixels, object_height_pixels){
    const collision_symbol = 888;
    let collisionBlocks = [];
    for (iy = 0; iy < parsedCollisions.length; iy++) {
        for (ix = 0; ix < parsedCollisions[iy].length; ix++) {
            if (parsedCollisions[iy][ix] === collision_symbol){  //places with collisions are noted by 888 in the tiled array
                let this_collision_dict = {position: {x: ix*object_width_pixels, y: iy*object_height_pixels},
                                           width: object_width_pixels, height: object_height_pixels };
                collisionBlocks.push(new CollisionBlock(this_collision_dict))        }}}
    return collisionBlocks;     }
    
class Fade{
    constructor(number_of_values){
        this.initial_value;
        this.final_value;
        this.current_value;
        this.number_of_values = number_of_values;
        this.remaining_values = number_of_values;
        this.allow_setting = true;    }
    set_initial_value(value){
        if (this.allow_setting){
            this.initial_value = value;
            this.current_value = value;
            this.remaining_values = this.number_of_values;        }}
    set_final_value(value){
        if (this.allow_setting){
            this.final_value = value;
            this.remaining_values = this.number_of_values;        }}
    set_number_of_values(number_of_values){
        if (this.allow_setting){
            this.number_of_values = number_of_values;        }}
    set_all_values(initial_value, final_value, number_of_values){
        if (this.allow_setting){
            this.set_initial_value(initial_value);
            this.set_final_value(final_value);
            this.set_number_of_values(number_of_values);    }}
    update_value(){
        if (this.remaining_values > 0){
            this.remaining_values -= 1;        }
        const quotient1 = (this.number_of_values - this.remaining_values)/(this.number_of_values);
        this.current_value = this.initial_value + (quotient1)*(this.final_value - this.initial_value);
        return this.current_value;    }}

class CollisionBlock{
    constructor({position, width, height}){
        this.position = position;
        this.width = width;
        this.height = height;    }
    draw(){
        //c.fillStyle = 'red';
        //c.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
} // end of class CollisionBlock

class Sprite{
    constructor({position, img_src, frame_count, name, ticks_per_frame=1, animations, loop=true, autoplay=true}) {      //this constructor takes an object, and decomposes it into its two values
        this.name = name;
        this.position = position;
        this.loop = loop;
        this.autoplay = autoplay;
        this.image = new Image();
        this.image.onload = () => {     // () => {} indicates an anonymous function call, it can also take arguments inside the ()
            this.loaded = true;
            this.width = this.image.width / this.frame_count;
            this.height = this.image.height;        }
        this.image.src = img_src;
        this.loaded = false;
        this.frame_count = frame_count;
        this.current_frame = 0;
        this.tick = 0;    
        this.ticks_per_frame = ticks_per_frame;
        this.animations = animations;
        this.current_animation;

        if (this.animations){
            for (let key in this.animations){
                const image = new Image();
                image.src = this.animations[key].img_src;
                this.animations[key].image = image          }}}
    
    play(){
        this.autoplay = true;
        current_door = this.name;
        x = 2;    }
        
    draw(){
        if (! this.loaded){     //don't try to render the image if it hasn't loaded yet
            return;        }
        let pos_current_frame_in_animation = this.width*this.current_frame;
        const cropbox = { position: {x: pos_current_frame_in_animation, y:0}, width: this.width, height: this.height }
        
        this.update_frames();
        c.drawImage(this.image, cropbox.position.x, cropbox.position.y, cropbox.width,  cropbox.height,
                                this.position.x,    this.position.y,    this.width,     this.height);       }
    
    update_frames(){   
        if (! this.autoplay){
            return;        }
        this.tick++;
        if (this.tick % this.ticks_per_frame == 0){     //refreshes at 60 Hz, must wait ticks_per_frame before showing naxt frame
            if ( (this.current_frame < this.frame_count - 1)   ){   //show next frame
                this.tick = 0;
                this.current_frame++;            }
            else if (this.loop){
                this.current_frame = 0;            }}
        if (this.current_animation?.on_complete){       //? is the optional chaining operator.  It returns undefined if on_complete doesn't exist.
            if( (this.current_frame = this.frame_count - 1) && !(this.current_animation.isActive)){
                this.current_animation.on_complete()        }}}
} // end of class Sprite

class Player extends Sprite{
    constructor(  {position, velocity, collisionBlocks=[], img_src, frame_count = 1, name='', ticks_per_frame=1, animations, loop}){
        super({position, img_src, frame_count, name, ticks_per_frame, animations, loop});
        this.position = position;
        this.velocity = velocity;
        //this.width = 25;
        //this.height = 25;    
        this.sides = { bottom: this.position.y + this.height }
        this.collisionBlocks = collisionBlocks;
        this.last_direction = 'right';     
        x=2;    }

    update(){
        c.fillStyle = 'rgba(0, 0, 255, 0.2)';
        this.position.x += this.velocity.x;
        this.update_hitbox();
        this.check_for_horizontal_collisions();
        // apply gravity and vertical velocity
        this.velocity.y += gravity;
        this.position.y += this.velocity.y;
        this.update_hitbox();
        this.check_for_vertical_collisions();    }

    update_hitbox(){
        this.hitbox = { position: {x: this.position.x + 62, y: this.position.y + 34}, width: 40, height: 54};       }
    
    handle_input(keys){
        if (keys.d.pressed){
            this.switch_sprite('run_right');
            this.velocity.x = 5; 
            this.last_direction = 'right';   }
        else if (keys.a.pressed){
            this.switch_sprite('run_left');
            this.velocity.x = -5    
            this.last_direction = 'left';    }
        else{
            if (this.last_direction === 'right'){
                this.switch_sprite('idle_right');        }
            else{
                this.switch_sprite('idle_left');        }}}
    
    switch_sprite(name){
        if (this.image === this.animations[name].image){
            return;  }
        this.current_frame = 0;
        this.image = this.animations[name].image;
        this.frame_count = this.animations[name].frame_count;
        this.ticks_per_frame = this.animations[name].ticks_per_frame;
        this.loop = this.animations[name].loop;
        this.current_animation = this.animations[name]         }

    check_for_horizontal_collisions(){
        // check for horizontal collisions
        for (const collisionb of this.collisionBlocks) {
            if ((this.hitbox.position.x <= collisionb.position.x + collisionb.width) && 
                (this.hitbox.position.x + this.hitbox.width >= collisionb.position.x) &&
                (this.hitbox.position.y + this.hitbox.height >= collisionb.position.y) &&
                (this.hitbox.position.y <= collisionb.position.y + collisionb.height)) {
                    if (this.velocity.x < 0){
                        const offset = this.hitbox.position.x - this.position.x;
                        this.position.x = collisionb.position.x + collisionb.width -offset + 0.01;
                        break;      }
                    if (this.velocity.x > 0){
                        const offset = this.hitbox.position.x - this.position.x + this.hitbox.width;
                        this.position.x = collisionb.position.x -offset - 0.01;
                        break;      }}}}
    
    check_for_vertical_collisions(){
        // check for vertical collisions
        for (const collisionb of this.collisionBlocks) {
            if ((this.hitbox.position.x <= collisionb.position.x + collisionb.width) && 
                (this.hitbox.position.x + this.hitbox.width >= collisionb.position.x) &&
                (this.hitbox.position.y + this.hitbox.height >= collisionb.position.y) &&
                (this.hitbox.position.y <= collisionb.position.y + collisionb.height)) {
                    if (this.velocity.y < 0){   //going up
                        const offset = this.hitbox.position.y - this.position.y;
                        this.position.y = collisionb.position.y + collisionb.height - offset + 0.01;
                        this.velocity.y = 0;
                        break;      }
                    if (this.velocity.y > 0){   //falling
                        const offset = this.hitbox.position.y - this.position.y + this.hitbox.height;
                        this.position.y = collisionb.position.y - offset - 0.01;
                        this.velocity.y = 0;
                        break;      }}}}
} // end of class Player

function keydown_listener(event){
    if (player1.prevent_input){
        return;    }
    console.log(event);
    switch (event.key){
        case 'w':
            //check if we are inside a doorway
            for (const door of doors) {
                if ((player1.hitbox.position.x + player1.hitbox.width <= door.position.x + door.width) && 
                (player1.hitbox.position.x  >= door.position.x) &&
                (player1.hitbox.position.y + player1.hitbox.height >= door.position.y) &&
                (player1.hitbox.position.y <= door.position.y + door.height)) {
                    console.log('we are colliding');
                    player1.velocity.x = 0;
                    player1.prevent_input = true;
                    player1.switch_sprite('enter_door');
                    door.play();
                    return;                }}
            // jump up
            if (player1.velocity.y === 0){      //supposed to detect sitting on terra firma, but it could also be at the highest peak of jump (buggy)
                player1.velocity.y = -20;            }
            break;
        case 'a':            
            //move player to the left
            keys.a.pressed = true;
            break;
        case 'd':
            //move player to the right
            keys.d.pressed = true;
            break;              }}

function keyup_listener(event){
    console.log(event);
    switch (event.key){
        case 'a':
            keys.a.pressed = false;
        case 'd':
            keys.d.pressed = false;
            break;              }}

function game_over(){
    c.fillStyle = "white";
    c.font = "bold 72px Arial";
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText("Game over", (canvas.width / 2), (canvas.height / 2));       }

function animate(){
    window.requestAnimationFrame(animate);      //generates a new frame.  runs at 60 frames per second.
    player1.velocity.x = 0;
    if (! player1.prevent_input){
        player1.handle_input(keys);        }
    background_level.draw();
    for (const collisionb of collisionBlocks) {
        collisionb.draw();  }
        for (const door of doors) {
            door.draw();  }
    player1.draw();
    player1.update();

    if (player1.hitbox.position.y > canvas.height + 500){
        game_over();    }
    
    c.save();
    if (! run_fade){
        c.globalAlpha = 0;
        fade.allow_setting = true;    }
    else{
        //fade to black, and then move to the next room ...
        fade.set_all_values(0, 1, 90);
        fade.allow_setting = false;
        c.globalAlpha = fade.update_value();
        if (fade.remaining_values == 0){
            // room complete, load next room.  reinitialize sprite.  
            room = door_map[current_door]['room'];
            fade.allow_setting = true;
            run_fade = false;
            player1.switch_sprite('idle_right');
            player1.prevent_input = false;
            rooms[room].init();
            let pos = door_map[current_door]['player_pos'];
            player1.position = {... pos};   //copy by value with spreading operator
            //player1.current_animation.isActive = false;            
            x = 2;        }}
    c.fillStyle = 'black';
    c.fillRect(0, 0, canvas.width, canvas.height);
    c.restore();
} // end of function animate


///Begin program ----------------------------------------------------------------------------------------------------------------

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
const tilesize = 64;
canvas.width = tilesize*16;    canvas.height= tilesize*9;
let gravity = 1;
let x = 2;

let parsedCollisions;
let collisionBlocks;
let background_level_sprite_dict;
let background_level;
let doors;
let current_door = 'initial';

const door_map ={initial: {room: 'room_01', player_pos: {x: 200, y: 200}},
                door_r01_1: {room: 'room_02', player_pos: {x: 100, y: 100}},
                door_r02_1: {room: 'room_03', player_pos: {x: 782, y: 447-112}},
                door_r03_1: {room: 'room_01', player_pos: {x: 200, y: 200}}
}

let player1_dict = {position: door_map[current_door]['player_pos'], velocity: {x:0, y:0}, 
                collisionBlocks: collisionBlocks, img_src: './images/king/idle.png',
                frame_count: 11, name: 'king', ticks_per_frame:8, loop: true,
                animations: {idle_right: {frame_count: 11, ticks_per_frame: 8, loop: true, img_src: './images/king/idle.png'},
                             idle_left: {frame_count: 11, ticks_per_frame: 8, loop: true, img_src: './images/king/idleLeft.png'},
                             run_right: {frame_count: 8, ticks_per_frame: 4, loop: true, img_src: './images/king/runRight.png'},
                             run_left: {frame_count: 8, ticks_per_frame: 4, loop: true, img_src: './images/king/runLeft.png'},
                             enter_door: {frame_count: 8, ticks_per_frame: 5, loop: false, img_src: './images/king/enterDoor.png',
                             on_complete: () => {
                                console.log('completed animation ...');
                                run_fade = true;        }}}};
const player1 = new Player(player1_dict);

let room = 'room_01';
let rooms = {
    room_01: {
        init: () => {
            parsedCollisions = collisions_room_01.parse2d(16);
            collisionBlocks = parsedCollisions.createObjectsFrom2D(tilesize, tilesize);
            player1.collisionBlocks = collisionBlocks;
            let pos = door_map[current_door]['player_pos'];
            player1.position = {... pos};
            background_level_sprite_dict = {position: {x: 0, y: 0},
                                        img_src: 'images/backgroundLevel1.png', frame_count: 1, name:'background', loop: false};
            background_level = new Sprite(background_level_sprite_dict);
            let door1 = {position: {x: 790, y: 270}, img_src: './images/doorOpen.png', frame_count: 5, name: 'door_r01_1',
                                        ticks_per_frame: 8, loop: false, autoplay: false};
            doors = [new Sprite(door1), ];        }},
    room_02: {
        init: () => {
            parsedCollisions = collisions_room_02.parse2d(16);
            collisionBlocks = parsedCollisions.createObjectsFrom2D(tilesize, tilesize);
            player1.collisionBlocks = collisionBlocks;
            let pos = door_map[current_door]['player_pos'];
            player1.position = {... pos};
            background_level_sprite_dict = {position: {x: 0, y: 0},
                                        img_src: 'images/background_room2_edited.png', frame_count: 1, name:'background', loop: false};
            background_level = new Sprite(background_level_sprite_dict);
            let door1 = {position: {x: 782, y: 447-112}, img_src: './images/doorOpen.png', frame_count: 5, name: 'door_r02_1',
                                        ticks_per_frame: 8, loop: false, autoplay: false};
            doors = [new Sprite(door1), ];        }},
    room_03: {
        init: () => {
            parsedCollisions = collisions_room_03.parse2d(16);
            collisionBlocks = parsedCollisions.createObjectsFrom2D(tilesize, tilesize);
            player1.collisionBlocks = collisionBlocks;
            let pos = door_map[current_door]['player_pos'];
            player1.position = {... pos};
            background_level_sprite_dict = {position: {x: 0, y: 0},
                                        img_src: 'images/backgroundLevel3_no_door.png', frame_count: 1, name:'background', loop: false};
            background_level = new Sprite(background_level_sprite_dict);
            let door1 = {position: {x: 178, y: 446-112}, img_src: './images/doorOpen.png', frame_count: 5, name: 'door_r03_1',
                                        ticks_per_frame: 8, loop: false, autoplay: false};
            doors = [new Sprite(door1), ];        }}
} //end of rooms object

const keys = {w: {pressed: false}, a: {pressed: false}, d: {pressed: false}}
let run_fade = false;
let fade = new Fade(90);
rooms[room].init();

animate();
window.addEventListener('keydown', keydown_listener)
window.addEventListener('keyup', keyup_listener)

