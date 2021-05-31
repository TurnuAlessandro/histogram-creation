import blackPencil from "./blackPencil.svg"
import whitePencil from "./whitePencil.svg"


export default function getImage(path){
    switch (path){
        case 'blackPencil.svg':
        case 'blackPencil':
            return blackPencil;
        case 'whitePencil.svg':
        case 'whitePencil':
            return whitePencil;
    }
}