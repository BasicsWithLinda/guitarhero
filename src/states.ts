import { State, Action, Constants } from "./types";
export { reduceState, initialState };

/** reduces the state by applying the action */
const reduceState = (s: State, action: Action) => action.apply(s);

const initialState:State = {
    score: 0,
    time: 0,
    notes: [],
    exit: [],
    objCount: 0,
    gameover: false,
    // Set to infinity as the comparison checker we have in actions
    lastCount: Infinity
};