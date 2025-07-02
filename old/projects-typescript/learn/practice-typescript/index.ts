// Basic Types and Variables
const firstName: string = "Adam";
const lastName: string = "Mickiewicz";
const fullName: string = `${firstName} ${lastName}`;
console.log(`Full Name: ${fullName}`);

// Boolean type assertion example (unsafe - avoid in production)
let booleanVal: boolean = true;
const booleanStrVal: string = "false";
booleanVal = booleanStrVal as unknown as boolean;
console.log("booleanVal (after assertion): " + booleanVal);

// Correct string to boolean conversion
let booleanVal2: boolean = true;
const booleanStrVal2: string = "false";
booleanVal2 = Boolean(booleanStrVal2); // "false" string is truthy
console.log("booleanVal2 (after Boolean()): " + booleanVal2);

// Any type with number operations
let anyVar: any = 54.3;
anyVar = Math.round(anyVar);
console.log("anyVar (after rounding): " + anyVar);

// Arrays and Methods
const stringArray: string[] = [
  "abc",
  "cde",
  "fgh",
  "ijk",
  "asdd23",
  "asdd234",
  "asdd623",
];
const stringArray2: string[] = [
  "1abc",
  "1cde",
  "1fgh,",
  "1ijk",
  "1asdd23",
  "11133",
  "111",
];

console.log("\n--- Array Methods ---");

// Non-mutating methods
console.log(
  "Map to uppercase:",
  stringArray.map((item) => item.toUpperCase()),
);
console.log(
  "Filter length > 3:",
  stringArray.filter((item) => item.length > 3),
);

// Mutating operations
stringArray[7] = "added";
console.log("After adding element:", stringArray);

// Array utility methods
console.log("First element:", stringArray.at(0));
console.log("Last element:", stringArray.at(-1));
console.log("Concatenated arrays:", stringArray.concat(stringArray2));

// Copy operations
const copyWithinTest = ["a", "b", "c", "d", "e", "f"];
copyWithinTest.copyWithin(0, 3, 6);
console.log("After copyWithin:", copyWithinTest);

// Array iteration
for (const [index, value] of stringArray.entries()) {
  console.log(`${index}: ${value}`);
}

// Array testing methods
console.log(
  "All items length > 3:",
  stringArray.every((item) => item.length > 3),
);
console.log(
  "Some items length > 3:",
  stringArray.some((item) => item.length > 3),
);
console.log(
  "Find item length > 3:",
  stringArray.find((item) => item.length > 3),
);
console.log(
  "Find index length > 3:",
  stringArray.findIndex((item) => item.length > 3),
);

// Sorting
const numbersToSort = [10, 2, 100, 20, 5];
numbersToSort.sort((a, b) => a - b);
console.log("Sorted numbers:", numbersToSort);

// Reduce operations
const sumOfLengths = stringArray.reduce((acc, val) => acc + val.length, 0);
console.log("Sum of lengths:", sumOfLengths);

// Stack operations
const stackArray = ["apple", "banana"];
stackArray.push("orange", "grape");
const poppedElement = stackArray.pop();
console.log("After push/pop:", stackArray, "Popped:", poppedElement);

// Queue operations
const queueArray = ["first", "second", "third"];
const shiftedElement = queueArray.shift();
queueArray.unshift("new_first");
console.log("After shift/unshift:", queueArray, "Shifted:", shiftedElement);

// Splice and slice
const spliceArray = ["a", "b", "c", "d", "e"];
const removedElements = spliceArray.splice(1, 2, "x", "y");
console.log("After splice:", spliceArray, "Removed:", removedElements);

const sliceArray = ["red", "green", "blue", "yellow", "purple"];
const slicedPart = sliceArray.slice(1, 4);
console.log("Sliced part:", slicedPart, "Original unchanged:", sliceArray);

// Search methods
const searchArray = ["apple", "orange", "apple", "banana"];
console.log("indexOf apple:", searchArray.indexOf("apple"));
console.log("lastIndexOf apple:", searchArray.lastIndexOf("apple"));
console.log("includes orange:", searchArray.includes("orange"));
console.log("join with -:", searchArray.join("-"));

// Object Types and Variables
let nameVar: string = "Mateusz";
const userAge: number = 22;
const isStudentActive: boolean = true;

const numbers: number[] = [1, 2, 3, 4, 5];
const fruits: string[] = ["apple", "banana", "cherry"];

// Type coercion example
console.log(`Result: ${numbers[0] + fruits[0]}`); // "1apple"

// Objects with any type
let personExample: any = {
  name: "Adrian",
  age: 2,
  city: "Warszawa",
};

personExample.street = "Kwiatowa";
console.log("Person with added street:", personExample);

// Interfaces and Type Aliases
interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
}

const product1: Product = {
  id: 1,
  name: "Milk",
  price: 2.99,
};

const product2: Product = {
  id: 2,
  name: "Bread",
  price: 1.99,
  description: "Brown",
};

const productArray: Product[] = [product1, product2];
productArray.forEach((product) => {
  console.log(`Product: ${product.name}, Price: ${product.price}`);
});

// Spread operator
const product3: Product = {
  id: 3,
  name: "Chocolate",
  price: 3.99,
  description: "Dark chocolate",
};

const extendedProduct = {
  ...product3,
  kcal: 300,
};

// Type aliases
type ID = number;
type Status = "available" | "unavailable" | "ordered";

let userID: ID = 1;
let productStatus: Status = "available";

// Interface inheritance
interface Person {
  name: string;
  surname: string;
}

interface Employee extends Person {
  position: string;
  salary: number;
}

const employee1: Employee = {
  name: "Adam",
  surname: "Mickiewicz",
  position: "writer",
  salary: 3000,
};

// Functions
function add(a: number, b: number): number {
  return a + b;
}

function welcome(name: string): string {
  return "Hello, " + name;
}

function calculateTax(amount: number, taxRate?: number): number {
  return amount * (taxRate ?? 0.23);
}

function logMsg(msg: string): void {
  console.log("Message:", msg);
}

// Union types
let userId: string | number;
userId = "123";
userId = 123;

function showInfo(data: string | number | boolean): void {
  console.log("Information:", data);
}

// Interface for functions
interface Loggable {
  log(msg: string): void;
}

const customLogger: Loggable = {
  log: (message: string) => {
    console.log("Custom Logger:", message);
  },
};

// Classes and Inheritance
interface Drawable {
  draw(): void;
}

abstract class Shape {
  constructor(protected name: string = "Shape") {}

  abstract calculateArea(): number;

  getName(): string {
    return this.name;
  }
}

class Square extends Shape implements Drawable {
  constructor(
    name: string,
    private side: number = 0,
  ) {
    super(name);
  }

  calculateArea(): number {
    return this.side * this.side;
  }

  draw(): void {
    console.log("Drawing a square");
  }

  getSide(): number {
    return this.side;
  }

  setSide(side: number): void {
    if (side < 0) {
      console.warn("Side length cannot be negative");
      return;
    }
    this.side = side;
  }
}

class Circle extends Shape implements Drawable {
  constructor(
    name: string,
    private radius: number = 0,
  ) {
    super(name);
  }

  calculateArea(): number {
    return Math.PI * this.radius * this.radius;
  }

  draw(): void {
    console.log("Drawing a circle");
  }

  getRadius(): number {
    return this.radius;
  }

  setRadius(radius: number): void {
    if (radius < 0) {
      console.warn("Radius cannot be negative");
      return;
    }
    this.radius = radius;
  }
}

// Shape examples
const square = new Square("Square 5x5", 5);
const circle = new Circle("Circle R=3", 3);

console.log(`${square.getName()} | Area: ${square.calculateArea().toFixed(2)}`);
console.log(`${circle.getName()} | Area: ${circle.calculateArea().toFixed(2)}`);

const shapes: (Shape & Drawable)[] = [square, circle];
shapes.forEach((shape) => {
  console.log(`\n--- ${shape.getName()} ---`);
  shape.draw();
  console.log(`Area: ${shape.calculateArea().toFixed(2)}`);
});

// Algorithm functions
function maxAdjacentDistance(nums: number[]): number {
  if (
    nums.length < 2 ||
    nums.length > 100 ||
    nums.some((i) => i > 100 || i < -100)
  ) {
    console.log("Input constraints not met");
    return 0;
  }

  let maxDiff = Math.abs(nums[0] - nums[nums.length - 1]);

  for (let i = 0; i < nums.length - 1; i++) {
    const currentDiff = Math.abs(nums[i] - nums[i + 1]);
    if (currentDiff > maxDiff) {
      maxDiff = currentDiff;
    }
  }
  return maxDiff;
}

function multiply(a: number, b: number): number {
  return a * b;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runWithTiming(): Promise<void> {
  const a = 42;
  const b = 73;

  for (let i = 0; i < 1000; i++) {
    multiply(a, b);
    await delay(1);
  }
}

// Two Sum implementations
function twoSum(nums: number[], target: number): number[] {
  for (let i = 0; i < nums.length - 1; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}

function twoSumOptimized(nums: number[], target: number): number[] {
  if (!nums || nums.length < 2) return [];

  const numMap = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (numMap.has(complement)) {
      return [numMap.get(complement)!, i];
    }
    numMap.set(nums[i], i);
  }
  return [];
}

// Number manipulation
function maxDiff(num: number): number {
  const strNum = num.toString();

  // Maximize: replace first non-9 digit with 9
  let maxNum = strNum;
  for (const ch of strNum) {
    if (ch !== "9") {
      maxNum = strNum.split(ch).join("9");
      break;
    }
  }

  // Minimize: replace first digit with 1, or first non-0,1 digit with 0
  let minNum = strNum;
  if (strNum[0] !== "1") {
    minNum = strNum.split(strNum[0]).join("1");
  } else {
    for (let i = 1; i < strNum.length; i++) {
      if (strNum[i] !== "0" && strNum[i] !== "1") {
        minNum = strNum.split(strNum[i]).join("0");
        break;
      }
    }
  }

  return parseInt(maxNum) - parseInt(minNum);
}

function divideArray(nums: number[], k: number): number[][] {
  if (nums.length % 3 !== 0) return [];

  nums.sort((a, b) => a - b);
  const result: number[][] = [];

  for (let i = 0; i < nums.length; i += 3) {
    const group = [nums[i], nums[i + 1], nums[i + 2]];
    if (group[2] - group[0] > k) return [];
    result.push(group);
  }

  return result;
}

// Practical examples
const testArray = [];
testArray.push(1);
for (let i = 0; i < 5; i++) {
  testArray.push(i);
}

const splicedElements = testArray.splice(2, 2);
console.log("Spliced elements:", splicedElements);
console.log("Modified array:", testArray);

const testObject = { name: "John", surname: "Doe" };
console.log("Surname:", testObject["surname"]);

// Async operations
setTimeout(() => console.log("Timeout callback"), 3000);

const testNumbers = [1, 2, 3, 4, 5, 77, 33];
const multipliedNumbers = testNumbers.map((i) => i * 2);
console.log("Multiplied numbers:", multipliedNumbers);

// Promise examples
function sumAsync(a: number, b: number): Promise<number> {
  return new Promise((resolve, reject) => {
    if (a > 5) {
      reject("a > 5");
    } else {
      resolve(a + b);
    }
  });
}

sumAsync(7, 3)
  .then((result) => console.log("Sum result:", result))
  .catch((error) => console.log("Error:", error));

// Function binding
const personObj = { name: "Alice" };
const personObj2 = { name: "Bob" };

function printName(this: { name: string }): void {
  console.log(this.name);
}

const boundPrintName = printName.bind(personObj2);
boundPrintName();
printName.call(personObj);

// Constructor function
function PersonConstructor(this: any, name: string, age: number) {
  this.name = name;
  this.age = age;
}

PersonConstructor.prototype.describe = function (text: string) {
  console.log("This person is", text);
};

// Nullish coalescing and optional chaining
let nullValue = null;
let textValue = "text";
let coalescedValue = nullValue ?? textValue;
console.log("Coalesced value:", coalescedValue);

const nullishObject = { name: "test" };
const optionalSurname = (nullishObject as any)?.surname;
console.log("Optional surname:", optionalSurname);

// Logical assignment
let logicalVar = 0;
logicalVar ||= 5;
console.log("Logical assignment result:", logicalVar);

// Rest parameters
function logElementTypes(...params: any[]): void {
  params.forEach((param) => {
    console.log(`Type of ${param}: ${typeof param}`);
  });
}

logElementTypes(1, "string", true, { key: "value" });

// Higher-order functions
function createMinFinder(fn: (...args: number[]) => number) {
  return (...args: number[]) => fn(...args);
}

const minFinder = createMinFinder(Math.min);
console.log("Min of 1,2,3:", minFinder(1, 2, 3));

// Array operations
const testArrayForFilter = [5, 4, 3, 7, 15];
const filteredArray = testArrayForFilter.filter((element) => element > 6);
console.log("Filtered array:", filteredArray);

const mappedArray = testArrayForFilter.map((val) => (val > 6 ? val + 1 : val));
console.log("Mapped array:", mappedArray);

const reducedSum = testArrayForFilter.reduce(
  (prev, current) => prev + current,
  0,
);
console.log("Reduced sum:", reducedSum);

// Interface examples
interface SimpleInterface {
  fooProp: string;
}

interface NumberInterface {
  prop1: number;
  prop2?: number;
}

// Class examples with different patterns
class ExplicitFieldsClass {
  name: string;
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
}

class ShorthandFieldsClass {
  constructor(
    public name: string,
    public age: number,
  ) {}
}

abstract class AbstractPersonClass {
  constructor(
    public name: string,
    public age: number,
  ) {}
  abstract getInfo(): string;
}

class ConcretePersonClass
  extends AbstractPersonClass
  implements SimpleInterface
{
  fooProp: string = "default";

  constructor(name: string, age: number) {
    super(name, age);
  }

  getInfo(): string {
    return `${this.name}, ${this.age} years old`;
  }
}

// Object destructuring and calculations
const userWithBalance = {
  id: 1,
  name: "John Doe",
  balance: { usd: 100, pln: 7 },
};

const { id: extractedUserId, name: extractedUserName } = userWithBalance;
const totalMoney =
  userWithBalance.balance.usd * 4.3 + userWithBalance.balance.pln;

console.log(
  "User info:",
  extractedUserId,
  extractedUserName,
  "Total money:",
  totalMoney,
);

// Array type examples
const numberArray1: number[] = [1, 2, 3];
const numberArray2: Array<number> = [1, 2, 3];

numberArray1.forEach((i) => console.log("Array1 item:", i));
numberArray2.forEach((i) => console.log("Array2 item:", i));

const doubledArray = numberArray1.map((i) => i * 2);
const stringArray3: string[] = ["a", "b", "c"];
const uppercaseArray = stringArray3.map((i) => i.toUpperCase());

console.log("Doubled:", doubledArray);
console.log("Uppercase:", uppercaseArray);
