/**
 * Generates a random number between min and max (both included)
 * @param min
 * @param max
 * @param type (can be float or int, default value is int)
 * @returns {random rumber between min and max}
 */
export default function randRange(min, max, type = 'int'){
    if(type == 'float')
        return Math.random() * (max - min + 1) + min;

    if(type == 'int')
        return Math.floor(Math.random() * (max - min + 1)) + min;

    throw 'Choose between int and float as third parameter';
}