function getRandomColor(){
    const letters = '0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F'.split(',');
    let color = '#';
    for(let i = 0; i < 6; i++){
        color += letters[Math.floor(Math.random() * 16) % letters.length];
    }
    return color;
}

function setRandomColor(element){
    element.setBackgroundColor(getRandomColor());
}

export {getRandomColor, setRandomColor};