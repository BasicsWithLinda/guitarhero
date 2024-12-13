export type { State, Bodys, Note, OnGuitar, Column, Key, Event, ObjectId }
export { Viewport, Constants, Vec}

/** Vector class which includes all properties concerning vectors */
class Vec {
    constructor(public readonly x: number = 0, public readonly y: number = 0) {}
    add = (b:Vec) => new Vec(this.x + b.x, this.y + b.y)
    sub = (b:Vec) => this.add(b.scale(-1))
    len = ()=> Math.sqrt(this.x*this.x + this.y*this.y)
    scale = (s:number) => new Vec(this.x*s,this.y*s)
    ortho = ()=> new Vec(this.y,-this.x)
    rotate = (deg:number) =>
              (rad =>(
                  (cos,sin,{x,y})=>new Vec(x*cos - y*sin, x*sin + y*cos)
                )(Math.cos(rad), Math.sin(rad), this)
              )(Math.PI * deg / 180)
  
    static unitVecInDirection = (deg: number) => new Vec(0,-1).rotate(deg)
    static Zero = new Vec();
  }

const Viewport = {
    CANVAS_WIDTH: 200,
    CANVAS_HEIGHT: 400,
    
} as const;

const Constants = {
    TICK_RATE_MS: 10,
    SONG_NAME: "RockinRobin",
    StartTime: 0,
    StartNotesCount: 0,
    RADIUS: 0.07 * Viewport.CANVAS_WIDTH,
    TAIL_WIDTH: 10,
    BUTTON_HEIGHT: 350,
    // decided for the margin to be 0.2 based on playability. can adjust accordingly to math calculation if needed
    ALLOWED_MARGIN: 0.2,
    NOTE_SPEED: 1
} as const;

type State = Readonly<{
    time: number,
    exit: ReadonlyArray<Bodys>,
    objCount: number,
    notes: ReadonlyArray<Bodys & OnGuitar>,
    score: number,
    gameover: boolean,
    lastCount: number
}>

type Bodys = Readonly< ObjectId & {
    pos: Vec,
    createTime: number,
    radius: number
}>

type ObjectId = Readonly<{ id: string}>

type Note = Readonly<{
    userPlayed: boolean;
    instrumentName: string;
    velocity: number;
    pitch: number;
    start: number;
    end: number;
}>

type OnGuitar = Readonly<{
    note: Note,
    column: Column,
    speed: number,
    successfullyPressed: boolean
}>

type Column = "green" | "red" | "blue" | "yellow";

type Key = "KeyH" | "KeyJ" | "KeyK" | "KeyL";

type Event = "keydown" | "keyup" | "keypress";

export interface Action {
    apply(s: State): State;
}