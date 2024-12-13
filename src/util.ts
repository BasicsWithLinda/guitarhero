import { Note, Column, Key, Bodys, OnGuitar, Vec, Viewport, Constants } from './types';
import * as Tone from "tone";
import { SampleLibrary } from "./tonejs-instruments";
export { createRandomNote, noteDuration, calculateXPosition, getColumnForNote, getColorForColumn, getColumnForKey, handleGameOver, createNoteBody, parseCsv, moveObj, startSound };

/** importing sounds so that startSound can actually make a noise */

const samples = SampleLibrary.load({
    instruments: SampleLibrary.list,
    baseUrl: "samples/",
});

Tone.ToneAudioBuffer.loaded().then(() => {
    for (const instrument in samples) {
        samples[instrument].toDestination();
        samples[instrument].release = 0.5;
    }
});

export abstract class RNG {
    // LCG using GCC's constants
    private static m = 0x80000000; // 2**31
    private static a = 1103515245;
    private static c = 12345;

    /**
     * Call `hash` repeatedly to generate the sequence of hashes.
     * @param seed 
     * @returns a hash of the seed
     */
    public static hash = (seed: number) => (RNG.a * seed + RNG.c) % RNG.m;

    /**
     * Takes hash value and scales it to the range [0, max]]
     */
    public static scale = (hash: number) => (max: number) => (max * hash) / (RNG.m - 1);

    };

/** Creates a note with a random duration and random pitch. It will be made when the user misses the note
 * or randomly hits the keys when there is no notes no the guitar */    
const createRandomNote = (n?: Note): Note => {
    
    // Random duration between 0 and 0.5
    const randomDuration = RNG.scale(1)(RNG.hash(0));
    
    // Random pitch
    const randomPitch = Math.floor(RNG.scale(127)(RNG.hash(1)));

    return {
        instrumentName: n ? n.instrumentName : "piano",  // Add the randomly selected instrument
        velocity: 0.5,
        pitch: randomPitch,
        start: 0,
        end: randomDuration
    } as Note;
};

/** Finds the duration at which the note should be played for */
const noteDuration = (start: number) => (end: number): number => {
    // converting s to ms with the * 1000
    return Math.abs((end - start) * 1000);
}

/** Finds the x position of the note based off of its column */
const calculateXPosition = (column: Column): number => {
    const xPositionMap: { [key in Column]: number } = {
      green: 20,
      red: 40,
      blue: 60,
      yellow: 80,
    };
    return (xPositionMap[column]/100) * Viewport.CANVAS_WIDTH;
  };

/** Randomly assigns which column the note should be on by finding the modulo of the pitch */
const getColumnForNote = (note: Note) => (seed: number = 0): Column => {
    const index =  Math.floor(note.pitch % 4);
    const columns: Column[] = ["green", "red", "blue", "yellow"];
    return columns[index];
};

/** Gets the colour of the column */
const getColorForColumn = (column: Column): string => {
    const colorMap: { [key in Column]: string } = {
        green: "green",
        red: "red",
        blue: "blue",
        yellow: "yellow",
    };
    return colorMap[column];
};

/** Directly assigns which key is for what column */
function getColumnForKey(key: Key): Column {
    const keyToColumnMap: { [key in Key]: Column } = {
        KeyH: "green",
        KeyJ: "red",
        KeyK: "blue",
        KeyL: "yellow",
    };

    return keyToColumnMap[key];
}

/** Handlees the game over by making the visibility of the gameover HTML element visible */
function handleGameOver() {
    const gameOverElement = document.getElementById("gameOver");
    if (gameOverElement) {
        gameOverElement.style.visibility = "visible";
    }
}

/** Creates the NoteBody object which is all the details needed for anything scrolling down the guitar and needs to be hit */
const createNoteBody = () => (oid:number) => (time:number) => (radius: number) =>
    (note: Note): Bodys & OnGuitar => {
            const columnNote = getColumnForNote(note)(oid);
            const pos = new Vec(calculateXPosition(columnNote), 0)
            
            return {
                id: 'note'+oid,
                pos: pos,
                createTime: time,
                radius: radius,
                note: note,
                column: columnNote,
                speed: Constants.NOTE_SPEED,
                successfullyPressed: false,
                visibility: false,
            } as Bodys & OnGuitar;
        
    };

/** Parses the CSV file and skips the header row and filters out the empty spaces */
const parseCsv = (csvContents: string): { note: Note[], notesNumber: number } => {
    const rows = csvContents.split("\n").slice(1); // skip header row
    const note = rows
        .filter(row => row.trim() !== "") // filter out empty or whitespace-only lines
        .map((row) => {
            const [userPlayed, instrument, velocity, pitch, start, end] = row.split(",");
            return {
                userPlayed: userPlayed.toLowerCase() === "true",
                instrumentName: instrument,
                velocity: Number(velocity) / 127,
                pitch: Number(pitch),
                start: Number(start),
                end: Number(end),
            } as Note;
        });

    return {
        note,
        notesNumber: note.length,
    };
}

/** moves based on the speed */
const moveObj = (o: Bodys & OnGuitar) => <Bodys & OnGuitar>{
    ...o,
    pos: o.pos.add(Vec.unitVecInDirection(180).scale(Constants.NOTE_SPEED))
};

/** Registers the sound of the note and makes it audible */
const startSound = (note: Note) => {
    const instrumentName = note.instrumentName;
    const instrument = samples[instrumentName];

    // error checking if the note does not exist to then prompt the developer that there is an issue with the instruments
    if (!instrument) {
        console.error(`Instrument "${instrumentName}" not found. Available instruments are: ${Object.keys(samples).join(', ')}`);
        return;
    }

    const sound = Tone.Frequency(note.pitch, "midi").toNote(); // Convert MIDI note to frequency

    // Start the note
    instrument.triggerAttack(
        sound,
        undefined, // Use default time for note onset
        note.velocity,
    );

    setTimeout(() => {
        instrument.triggerRelease(
            sound, // Use the converted frequency
        );
    }, noteDuration(note.start)(note.end));
}    