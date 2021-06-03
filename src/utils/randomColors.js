function getRandomColor(shade = 'light'){

    let getColor = (digits) => {
        digits = digits.split('');
        let color = '#';
        for(let i = 0; i < 6; i++){
            color += digits[Math.floor(Math.random() * 16) % digits.length];
        }
        return color;
    }

    switch (shade){
        case 'light':
            return getColor('9ABCDEF');
        case 'dark':
            return getColor('012345678');
        default:
            return getColor('0123456789ABCDEF');
    }

}


function setRandomColor(element){
    element.setBackgroundColor(getRandomColor());
}

export {getRandomColor, setRandomColor};