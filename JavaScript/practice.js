const prompt = require('prompt-sync')({ sigint: true });

// console.log("Helloooo")

// console.log("Mayankraj");
// console.log(10);
// console.log(10 + 20);
// console.log("10 + 20");

// let a = 2;
// console.log(a)

// a = "b";
// console.log(a)

// let result;
// console.log(result);

// result = null;
// console.log(result);

// console.log(2 / 0)
// console.log(-2 / 0)

// console.log(2 / "Hello")
// console.log(typeof a)

// console.log(typeof result)

// console.log(10 + "5")

// console.log(5 == "5");
// console.log(5 === "5");

// console.log(1 == true)
// console.log(0 == true)

// let age = 20;
// let hasID = true;

// console.log(age >= 18 && hasID);
// console.log(age < 18 || hasID);
// console.log(!hasID);

// let name = prompt("Enter your name:");
// console.log(name);

// let x = prompt("Enter first number:");
// let y = prompt("Enter second number:");

// console.log(x + y);

// let p = Number(prompt("Enter first number:"));
// let q = Number(prompt("Enter second number:"));

// console.log(p + q);

// function addd() {
//     let a = Number(prompt("Enter first number:"));
//     let b = Number(prompt("Enter second number:"));
//     console.log(a + b);
// }

// addd();

// const multiply = function (a, b) {
//     return a * b;
// };

// console.log(multiply(4, 5));

// const square = (n) => {
//     return n * n;
// };

// console.log(square(5));

// const addd = (a, b, c) => {
//     return a + b + c;
// };

// console.log(addd(1, 2, 3));

// let nums = [10, 20, 30];
// console.log(nums.length);


// let arr = [10, 20, 30];
// arr.push(40);
// console.log(arr);

// let nums = [10, 20, 30];
// nums.pop();
// console.log(nums);

// let fruits = ["Apple", "Mango"];
// console.log(fruits.includes("Mango"));

// fruits[1] = "Orange";

// console.log(fruits);

// let student = {
//     name: "Mayank",
//     age: 20
// };

// console.log(student.name);
// console.log(student.age);

// console.log(student["name"]);


// let car = {
//     make: "Toyota",
//     model: "Camry",
//     year: 2022,
//     isElectric: true,
//     features: ["AC", "Power Steering", "Music System"]
// };

// console.log(car.features[1]);
// console.log(car.features.includes("AC"));

// console.log(car.features.length);

let students = [
    { name: "Aman", marks: 85 },
    { name: "Riya", marks: 45 },
    { name: "Karan", marks: 92 }
];

// Get all student names
let names = students.map(s => s.name);

// Get students who passed
let passed = students.filter(s => s.marks >= 50);

// Find one student
let student = students.find(s => s.name === "T");

console.log(names);
console.log(passed);
console.log(student);