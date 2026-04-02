let list: number[] = [1, 2, 3];
let list1: Array<number> = [1, 2, 3];
console.log(list);
console.log(list1);
//元组 tuple
let x: [string, number] = ["hello", 10];
// console.log(x[1].substr(1)); // error TS2339: Property 'substr' does not exist on type 'number'.
// x[3] = "world";
