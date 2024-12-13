import { Action, State, Bodys, Note, Key, Viewport, Constants } from "./types";
import { moveObj, createNoteBody, startSound, createRandomNote, getColumnForKey} from "./util";
export { Tick, CreateNote, PushKey, PlayBackgroundNoteAction, LastTime }

/** Tick is called every interval and moves expired objects into the exit list, and moves notes */
class Tick implements Action {
    constructor(public readonly elapsed: number) {}
    apply(s:State):State {
        const not = <T>(f:(x:T)=>boolean)=>(x:T)=>!f(x),
            // remove expired notes which have exited the screen or have been already hit
            expired = (b:Bodys) => b.pos.y > Viewport.CANVAS_HEIGHT,
            expiredNotes:Bodys[] = s.notes.filter(expired),
            activeNotes = s.notes.filter(not(expired));
        return <State>{
            ...s,
            notes: activeNotes.map(moveObj),
            exit: expiredNotes,
            time: this.elapsed,
            // game ends if the song has ended
            gameover: this.elapsed >= s.lastCount ? true : false
        }
    }
}

/** Called when you want to create a note that shows on the screen */
class CreateNote implements Action {
    constructor(public readonly note: Note) {}
    apply(s:State):State {
        return <State>{
            ...s,
            notes: s.notes.concat(createNoteBody()(s.objCount+1)(s.time)(Constants.RADIUS)(this.note)),
            objCount: s.objCount + 1
        }                
    }
};

/** Play the background notes! */
class PlayBackgroundNoteAction implements Action {
    constructor(public readonly note: Note) {}

    apply(s: State): State {
        startSound(this.note); // Trigger sound directly here
        return s; // State doesn't need to be modified for background notes
    }
}

/** Tracks what key is pushed and either:
 *      - causes a random note to play if user misses
 *      - playes the right note if the user doesn't miss
 */
class PushKey implements Action {
    constructor(public readonly key: Key) {}

    apply(s: State): State {
        const column = getColumnForKey(this.key);

        // Find the note closest to the button based on the y value
        const closestNote = s.notes
            .filter(note => note.column === column && note.pos.y <= Constants.BUTTON_HEIGHT * (1 + Constants.ALLOWED_MARGIN))
            .sort((a, b) => b.pos.y - a.pos.y)[0]; 

        if (closestNote) {
            const withinRange = Math.abs(closestNote.pos.y - Constants.BUTTON_HEIGHT) <= Constants.BUTTON_HEIGHT * Constants.ALLOWED_MARGIN;

            if (withinRange) {
                startSound(closestNote.note); 

                return {
                    ...s,
                    notes: s.notes.filter(note => note.id !== closestNote.id), // Remove the closestNote from the notes array
                    exit: [...s.exit, closestNote],
                    // incrementing score because user actually did it on time!
                    score: s.score + 1
                };
            } else {
                // Closest note is out of range, play a random note
                const randomNote = createRandomNote(closestNote.note);
                startSound(randomNote); 

                return {
                    ...s,
                    objCount: s.objCount + 1,
                };
            }
        } else {
            // No closest note found, create a random note and play sound
            const randomNote = createRandomNote();
            startSound(randomNote); 

            return {
                ...s,
                objCount: s.objCount + 1,
            };
        }
    }
}

/** Sets when the song ends so that the gameover can occur at the right time */
class LastTime implements Action {
    constructor(public readonly time: number) {}

    apply(s: State): State {
        console.log("SADIHSAUDHASU")
        return {
            ...s,
            lastCount: this.time
        }
    }
}