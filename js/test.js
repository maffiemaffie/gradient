import { Gradient } from "./gradient.js";

const gradient = new Gradient();
gradient.addStop(
    0,
    {
        r: 0,
        g: 0,
        b: 0,
        a: 1
    }
);

gradient.addStop(
    0.5, 
    {
        r: 255,
        g: 255,
        b: 255,
        a: 1
    }
);

console.log(gradient.getColor(0.25));