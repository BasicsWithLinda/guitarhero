/**
 * Inside this file you will use the classes and functions from rx.js
 * to add visuals to the svg element in index.html, animate them, and make them interactive.
 *
 * Study and complete the tasks in observable exercises first to get ideas.
 *
 * Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
 *
 * You will be marked on your functional programming style
 * as well as the functionality that you implement.
 *
 * Document your code!
 */

import "./style.css";

import { from, fromEvent, interval, merge, Observable, range, timer, zip } from "rxjs";
import { map, filter, scan, mergeMap, takeUntil, toArray, take, startWith, sample, takeLast, tap } from "rxjs/operators";
import * as Tone from "tone";
import { SampleLibrary } from "./tonejs-instruments";

import { Key, Event, Viewport, Constants } from './types';
import { parseCsv } from "./util";
import { CreateNote, Tick, PlayBackgroundNoteAction, PushKey, LastTime } from "./actions";
import { reduceState, initialState } from "./states";
import { updateView } from "./view";


/**
 * This is the function called on page load. Your main game loop
 * should be called here.
 */

export function main(
    csvContents: string,
    samples: { [key: string]: Tone.Sampler },
) {
    
     // Canvas elements
     const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
     HTMLElement;
    const preview = document.querySelector(
        "#svgPreview",
    ) as SVGGraphicsElement & HTMLElement;
    const gameover = document.querySelector("#gameOver") as SVGGraphicsElement &
        HTMLElement;
    const container = document.querySelector("#main") as HTMLElement;

    svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
    svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);

    // Text fields
    const multiplier = document.querySelector("#multiplierText") as HTMLElement;
    const scoreText = document.querySelector("#scoreText") as HTMLElement;
    const highScoreText = document.querySelector(
        "#highScoreText",
    ) as HTMLElement;

 /** User input */

    /** This identifies the user's key inputs which are H, J, K, L */
    const observeKey = <T>(eventName:Event, k:Key, result:()=>T)=>
        fromEvent<KeyboardEvent>(document,eventName)
        .pipe(
            filter(({code})=>code === k),
            filter(({repeat})=>!repeat),
            map(result))

    /** Parses the CSV into Note datatype */
    const {note, notesNumber} = parseCsv(csvContents);
    
    // the time to ground is following s = d/t
    // multiply by the tick rate to ensure that all units are the same in the calculation
    // multiply by 1000 to convert to seconds as code is originally in ms
    const timeToGround = (Constants.BUTTON_HEIGHT * Constants.TICK_RATE_MS) / 1000 * (Constants.NOTE_SPEED)

    /** Observable streams */
    const note$ = from(note).pipe(
        mergeMap((note) => timer(1000 * (note.start - timeToGround)).pipe(map(() => note))),
        map((n) =>  new CreateNote(n))
    );

    const notePlay$ = note$.pipe(filter((note) => note.note.userPlayed));

    const backgroundNotes$ = from(note).pipe(
        filter((n) => !n.userPlayed),
        mergeMap((n) => timer(1000 * (n.start)).pipe(map(() => n))),
        map((n) => new PlayBackgroundNoteAction(n))
    );

    const keyPress$ = merge(
        observeKey('keydown', 'KeyH', () => new PushKey('KeyH')),
        observeKey('keydown', 'KeyJ', () => new PushKey('KeyJ')),
        observeKey('keydown', 'KeyK', () => new PushKey('KeyK')),
        observeKey('keydown', 'KeyL', () => new PushKey('KeyL'))
        );

        const interval$ = interval(10).pipe(map((elapsed) => new Tick(elapsed)));

    const lastNote$ = from(note).pipe(
        takeLast(1),
        map((note) => new LastTime((Number(note.end)) * 100)),
    );

    /** Applying Model-View Controler (MVC) architecture */

    const subscription = merge(interval$, notePlay$, keyPress$, backgroundNotes$, lastNote$).pipe(
        scan(reduceState, initialState)
        ).subscribe(updateView);

    subscription;
};



// The following simply runs your main function on window load.  Make sure to leave it in place.
// You should not need to change this, beware if you are.
if (typeof window !== "undefined") {
    // Load in the instruments and then start your game!
    const samples = SampleLibrary.load({
        instruments: [
            "bass-electric",
            "violin",
            "piano",
            "trumpet",
            "saxophone",
            "trombone",
            "flute",
        ], // SampleLibrary.list,
        baseUrl: "samples/",
    });

    const startGame = (contents: string) => {
        document.body.addEventListener(
            "mousedown",
            function () {
                main(contents, samples);
            },
            { once: true },
        );
    };

    const { protocol, hostname, port } = new URL(import.meta.url);
    const baseUrl = `${protocol}//${hostname}${port ? `:${port}` : ""}`;

    Tone.ToneAudioBuffer.loaded().then(() => {
        for (const instrument in samples) {
            samples[instrument].toDestination();
            samples[instrument].release = 0.5;
        }

        fetch(`${baseUrl}/assets/${Constants.SONG_NAME}.csv`)
            .then((response) => response.text())
            .then((text) => startGame(text))
            .catch((error) =>
                console.error("Error fetching the CSV file:", error),
            );
    });
}
