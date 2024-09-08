import { Effect } from "effect";
import type { UnknownException } from "effect/Cause";

type User = {
	readonly id: number;
	readonly name: string;
};

const getUser = (userId: number): Effect.Effect<User, Error> => {
	const userDatabase: Record<number, User> = {
		1: { id: 1, name: "John Doe" },
		2: { id: 2, name: "Jane Smith" },
	};

	const user = userDatabase[userId];

	if (user) {
		return Effect.succeed(user);
	} else {
		return Effect.fail(new Error("User not found"));
	}
};

const exampleUserEffect = getUser(1);

// console.log(Effect.runSync(exampleUserEffect));

const delay = (message: string) =>
	Effect.promise<string>(
		() =>
			new Promise((resolve) => {
				setTimeout(() => {
					resolve(message);
				}, 2000);
			}),
	);

const program = delay("Async operation completed successfully!");

// console.log(await Effect.runPromise(program));

const parse1 = (): Effect.Effect<number, UnknownException> =>
	Effect.try(() => JSON.parse("1") as number);

const program2 = parse1();

// console.log(await Effect.runPromise(program2));

const parse2 = (): Effect.Effect<number, Error> =>
	Effect.try({
		try: () => JSON.parse("1") as number,
		catch: () => new Error(`something went wrong`),
	});

const program3 = parse2();

// console.log(await Effect.runPromise(program3));

const getTodo = (id: number) =>
	Effect.tryPromise({
		try: () =>
			fetch(`https://jsonplaceholder.typicode.com/todos/${id.toString()}`),
		catch: () => new Error(`something went wrong`),
	});

const program4 = getTodo(1);

// console.log(await Effect.runPromise(program4));

import * as NodeFS from "node:fs";

const readFile = (filename: string) =>
	Effect.async<Buffer, Error>((resume) => {
		NodeFS.readFile(filename, (error, data) => {
			if (error) {
				resume(Effect.fail(error));
			} else {
				resume(Effect.succeed(data));
			}
		});
	});

const program5 = readFile("pad.ts");

// console.log(await Effect.runPromise(program5));

// 1. Evaluate lazily

let i = 0;

const bad = Effect.succeed(i++);
const good = Effect.suspend(() => Effect.succeed(i++));

console.log(Effect.runSync(bad)); // Output: 0
console.log(Effect.runSync(bad)); // Output: 0

console.log(Effect.runSync(good)); // Output: 1
console.log(Effect.runSync(good)); // Output: 2

// 2. Handle circular dependencies

const fibBlowsUp = (n: number): Effect.Effect<number> =>
	n < 2 ?
		Effect.succeed(1)
	:	Effect.zipWith(fibBlowsUp(n - 1), fibBlowsUp(n - 2), (a, b) => a + b);

// console.log(Effect.runSync(fibBlowsUp(32))) // crash: JavaScript heap out of memory

const fibAllGood = (n: number): Effect.Effect<number> =>
	n < 2 ?
		Effect.succeed(1)
	:	Effect.zipWith(
			Effect.suspend(() => fibAllGood(n - 1)),
			Effect.suspend(() => fibAllGood(n - 2)),
			(a, b) => a + b,
		);

console.log(Effect.runSync(fibAllGood(20))); // Output: 3524578

// 3. Unify return type

const ugly = (
	a: number,
	b: number,
): Effect.Effect<never, Error> | Effect.Effect<number> =>
	b === 0 ?
		Effect.fail(new Error("Cannot divide by zero"))
	:	Effect.succeed(a / b);

const nice = (a: number, b: number): Effect.Effect<number, Error> =>
	Effect.suspend(() =>
		b === 0 ?
			Effect.fail(new Error("Cannot divide by zero"))
		:	Effect.succeed(a / b),
	);

const program6 = Effect.sync(() => {
	console.log("Hello, World!");
	return 1;
});

const result = Effect.runSync(program6);
// Output: Hello, World!

console.log(result);
// Output: 1

// Effect.runSync(Effect.fail("my error")); // throws
// Effect.runSync(Effect.promise(() => Promise.resolve(1))); // throws

const result1 = Effect.runSyncExit(Effect.succeed(1));
console.log(result1);
/*
Output:
{
  _id: "Exit",
  _tag: "Success",
  value: 1
}
*/

const result2 = Effect.runSyncExit(Effect.fail("my error"));
console.log(result2);
/*
Output:
{
  _id: "Exit",
  _tag: "Failure",
  cause: {
    _id: "Cause",
    _tag: "Fail",
    failure: "my error"
  }
}
*/

// Effect.runSyncExit(Effect.promise(() => Promise.resolve(1))); // throws

Effect.runPromise(Effect.succeed(1))
	.then(console.log)
	.catch((err: unknown) => {
		console.error(err);
	}); // Output: 1

// Effect.runPromise(Effect.fail("my error"))
// 	.then(console.log)
// 	.catch((err: unknown) => {
// 		console.error(err);
// 	}); // (FiberFailure) Error: my error

const result3 = await Effect.runPromiseExit(Effect.succeed(42));

console.log(result3);
/*
Output:
{
  _id: "Exit",
  _tag: "Success",
  value: 42
}
*/

const result4 = await Effect.runPromiseExit(Effect.fail("my promise error"));

console.log(result4);
/*
Output:
{
  _id: "Exit",
  _tag: "Failure",
  cause: {
    _id: "Cause",
    _tag: "Fail",
    failure: "my promise error"
  }
}
*/

import { Console, Schedule } from "effect";

const program7 = Effect.repeat(
	Console.log("running..."),
	Schedule.spaced("200 millis"),
);

// const fiber = Effect.runFork(program7);

// setTimeout(() => {
// 	Effect.runFork(Fiber.interrupt(fiber));
// }, 500);

// Function to add a small service charge to a transaction amount
const addServiceCharge = (amount: number) => amount + 1;

// Function to apply a discount safely to a transaction amount
const applyDiscount = (
	total: number,
	discountRate: number,
): Effect.Effect<number, Error> =>
	discountRate === 0 ?
		Effect.fail(new Error("Discount rate cannot be zero"))
	:	Effect.succeed(total - (total * discountRate) / 100);

// Simulated asynchronous task to fetch a transaction amount from a database
const fetchTransactionAmount = Effect.promise(() => Promise.resolve(100));

// Simulated asynchronous task to fetch a discount rate from a configuration file
const fetchDiscountRate = Effect.promise(() => Promise.resolve(5));

// Assembling the program using a generator function
const program8 = Effect.gen(function* () {
	// Retrieve the transaction amount
	const transactionAmount = yield* fetchTransactionAmount;

	// Retrieve the discount rate
	const discountRate = yield* fetchDiscountRate;

	// Calculate discounted amount
	const discountedAmount = yield* applyDiscount(
		transactionAmount,
		discountRate,
	);

	// Apply service charge
	const finalAmount = addServiceCharge(discountedAmount);

	// Return the total amount after applying the charge
	return `Final amount to charge: ${finalAmount.toString()}`;
});

// Execute the program and log the result
Effect.runPromise(program8)
	.then(console.log)
	.catch((err: unknown) => {
		console.error(err);
	}); // Output: "Final amount to charge: 96"

const calculateTax = (
	amount: number,
	taxRate: number,
): Effect.Effect<number, Error> =>
	taxRate > 0 ?
		Effect.succeed((amount * taxRate) / 100)
	:	Effect.fail(new Error("Invalid tax rate"));

const program9 = Effect.gen(function* () {
	let i = 1;

	while (true) {
		if (i === 10) {
			break; // Break the loop when counter reaches 10
		} else {
			if (i % 2 === 0) {
				// Calculate tax for even numbers
				console.log(yield* calculateTax(100, i));
			}

			i++;
			continue;
		}
	}
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
Effect.runPromise(program9);
/*
Output:
2
4
6
8
*/

const program10 = Effect.gen(function* () {
	console.log("Task1...");
	console.log("Task2...");

	// Introduce an error into the flow
	yield* Effect.fail("Something went wrong!");
});

// Effect.runPromiseExit(program10).then(console.log, console.error);
/*
Output:
Task1...
Task2...
{
  _id: 'Exit',
  _tag: 'Failure',
  cause: { _id: 'Cause', _tag: 'Fail', failure: 'Something went wrong!' }
}
*/

const program11 = Effect.gen(function* () {
	console.log("Task1...");
	console.log("Task2...");
	yield* Effect.fail("Something went wrong!");
	console.log("This won't be executed");
});

// Effect.runPromise(program11).then(console.log, console.error);
/*
Output:
Task1...
Task2...
(FiberFailure) Error: Something went wrong!
*/

class MyService {
	readonly local = 1;

	compute = Effect.gen(this, function* () {
		return yield* Effect.succeed(this.local + 1);
	});
}

console.log(Effect.runSync(new MyService().compute)); // Output: 2

import { pipe } from "effect";

// Define simple arithmetic operations
const increment = (x: number) => x + 1;
const double = (x: number) => x * 2;
const subtractTen = (x: number) => x - 10;

// Sequentially apply these operations using `pipe`
const result5 = pipe(5, increment, double, subtractTen);

console.log(result5); // Output: 2

// Apply service charge to the transaction amount
const finalAmount = Effect.map(fetchTransactionAmount, addServiceCharge);

// Or
// const finalAmount = pipe(
// 	fetchTransactionAmount,
// 	Effect.map(addServiceCharge),
// );

Effect.runPromise(finalAmount).then(console.log, console.error); // Output: 101

const program12 = pipe(Effect.succeed(5), Effect.as("new value"));

Effect.runPromise(program12).then(console.log, console.error); // Output: "new value"

const finalAmount2 = Effect.flatMap(fetchTransactionAmount, (amount) =>
	applyDiscount(amount, 5),
);

// Or
// const finalAmount2 = pipe(
// 	fetchTransactionAmount,
// 	Effect.flatMap((amount) => applyDiscount(amount, 5)),
// );

Effect.runPromise(finalAmount2).then(console.log, console.error); // Output: 95

// Using Effect.map and Effect.flatMap
const result6 = pipe(
	fetchTransactionAmount,
	Effect.map((amount) => amount * 2),
	Effect.flatMap((amount) => applyDiscount(amount, 5)),
);

Effect.runPromise(result6).then(console.log, console.error); // Output: 190

// Using Effect.andThen
const result7 = pipe(
	fetchTransactionAmount,
	Effect.andThen((amount) => amount * 2),
	Effect.andThen((amount) => applyDiscount(amount, 5)),
);

Effect.runPromise(result7).then(console.log, console.error); // Output: 190

import { Option } from "effect";

// Simulated asynchronous task fetching a number from a database
const fetchNumberValue = Effect.promise(() => Promise.resolve(42));

// Although one might expect the type to be Effect<Option<number>, never, never>,
// it is actually Effect<number, NoSuchElementException, never>
const program13 = pipe(
	fetchNumberValue,
	Effect.andThen((x) => (x > 0 ? Option.some(x) : Option.none())),
);

Effect.runPromise(program13).then(console.log, console.error); // Output: 42

import { Either } from "effect";

// Function to parse an integer from a string that can fail

const parseInteger = (input: string): Either.Either<number, string> =>
	isNaN(parseInt(input)) ?
		Either.left("Invalid integer")
	:	Either.right(parseInt(input));

// Simulated asynchronous task fetching a string from a database
const fetchStringValue = Effect.promise(() => Promise.resolve("24"));

// Although one might expect the type to be Effect<Either<number, string>, never, never>,
// it is actually Effect<number, string, never>
const program14 = pipe(
	fetchStringValue,
	Effect.andThen((str) => parseInteger(str)),
);

Effect.runPromise(program14).then(console.log, console.error); // Output: 24

const finalAmount3 = pipe(
	fetchTransactionAmount,
	Effect.tap((amount) =>
		Effect.sync(() => {
			console.log(`Apply a discount to: ${amount.toString()}`);
		}),
	),
	// `amount` is still available!
	Effect.flatMap((amount) => applyDiscount(amount, 5)),
);

Effect.runPromise(finalAmount3).then(console.log, console.error);
/*
Output:
Apply a discount to: 100
95
*/

// Simulated function to read configuration from a file
const webConfig = Effect.promise(() =>
	Promise.resolve({ dbConnection: "localhost", port: 8080 }),
);

// Simulated function to test database connectivity
const checkDatabaseConnectivity = Effect.promise(() =>
	Promise.resolve("Connected to Database"),
);

// Combine both effects to perform startup checks
const startupChecks = Effect.all([webConfig, checkDatabaseConnectivity]);

Effect.runPromise(startupChecks).then(([config, dbStatus]) => {
	console.log(
		`Configuration: ${JSON.stringify(config)}, DB Status: ${dbStatus}`,
	);
}, console.error);
/*
Output:
Configuration: {"dbConnection":"localhost","port":8080}, DB Status: Connected to Database
*/

// Assembling the program using a pipeline of effects
const program15 = pipe(
	Effect.all([fetchTransactionAmount, fetchDiscountRate]),
	Effect.flatMap(([transactionAmount, discountRate]) =>
		applyDiscount(transactionAmount, discountRate),
	),
	Effect.map(addServiceCharge),
	Effect.map(
		(finalAmount) => `Final amount to charge: ${finalAmount.toString()}`,
	),
);

// Or
// const program15 = Effect.all([fetchTransactionAmount, fetchDiscountRate]).pipe(
// 	Effect.flatMap(([transactionAmount, discountRate]) =>
// 		applyDiscount(transactionAmount, discountRate),
// 	),
// 	Effect.map(addServiceCharge),
// 	Effect.map(
// 		(finalAmount) => `Final amount to charge: ${finalAmount.toString()}`,
// 	),
// );

// Execute the program and log the result
Effect.runPromise(program15).then(console.log, console.error);
// Output: "Final amount to charge: 96"
