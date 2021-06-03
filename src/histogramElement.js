import {getRandomColor} from "./utils/randomColors";

function element(uuid, value, color, name){
    let letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    let getLetter = () => letters[Math.floor(Math.random()*16)%letters.length];
    return {
        uuid,
        value: value ? parseFloat(value) : Math.floor(Math.random() * 100 * 4 + 1), // +20 per evitare la presenza di zeri
        color: color ? color : getRandomColor(),
        name: name ? name : `${getLetter()}${getLetter()}${getLetter()}${getLetter()}${getLetter()}`
    };
}

export default element;