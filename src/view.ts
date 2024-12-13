import { State } from './types';
import { handleGameOver, getColorForColumn, startSound } from './util';
export { updateView };

/** updates the view of the function. all side effects should be stored here */
function updateView (s: State) {
    const svg = document.getElementById("svgCanvas")!;

    // check if game over is done
    if (s.gameover) {
        handleGameOver();
    }

    // shows the score of the user. increments by 1 for each successful hit
    const scoreDisplay = document.getElementById("scoreText");
    if (scoreDisplay) {
        scoreDisplay.textContent = `${s.score}`;
    }

    // creates the visual for each note to be on the page
    s.notes.forEach(n=> {
        const createNoteView = () => {
            const v = document.createElementNS(svg.namespaceURI, "circle")!;
            v.setAttribute("id", n.id);
            v.setAttribute("fill", getColorForColumn(n.column));
            v.setAttribute("class", "shadow");
            v.setAttribute("visibility", '${n.visibility}');
            v.classList.add("note");
            svg.appendChild(v)
            return v;
        }

        const v = document.getElementById(n.id) || createNoteView();
        v.setAttribute("cx", String(n.pos.x));
        v.setAttribute("cy", String(n.pos.y));
        v.setAttribute("r", String(n.radius));
    
    })

    s.notes.forEach(n=> {
        const createNoteView = () => {
            const v = document.createElementNS(svg.namespaceURI, "circle")!;
            v.setAttribute("id", n.id);
            v.setAttribute("fill", getColorForColumn(n.column));
            v.setAttribute("class", "shadow");
            v.setAttribute("visibility", "visible");
            v.classList.add("note");
            svg.appendChild(v)
            return v;
        }

        const v = document.getElementById(n.id) || createNoteView();
        v.setAttribute("cx", String(n.pos.x));
        v.setAttribute("cy", String(n.pos.y));
        v.setAttribute("r", String(n.radius));
    
    })
    
    // removes notes from screen which have expired (either not hit or have been hit)
    s.exit.forEach(o=>{
        const v = document.getElementById(o.id);
        if(v) svg.removeChild(v)
      })

};
