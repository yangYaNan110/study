// function printLabel(labelledObj: { label: string }) {
//   console.log(labelledObj.label);
// }

// let myObj = { size: 10, label: "Size 10 Object" };
// printLabel(myObj);

interface LabelledValue {
  label: string;
  width?: number;
}

function printLabel(labelledObj: LabelledValue) {
  console.log(labelledObj.label);
  //   if ((labelledObj as any).height) {
  //   }
}

// let myObj = { size: 10, label: "hello ts!!" };
let myObj = { size: 10, width: 100, label: "hello ts..." };

printLabel(myObj);

let a: number[] = [1, 2, 3, 4];
let ro: ReadonlyArray<number> = a;
// ro[0] = 1;
