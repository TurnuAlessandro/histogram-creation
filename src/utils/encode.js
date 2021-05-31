
export default function encode(uuid){
    return uuid?.split("").reverse().join("");
}
