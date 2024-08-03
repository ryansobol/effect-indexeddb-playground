import { Effect } from "effect";

interface User {
	readonly id: number;
	readonly name: string;
}

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

const getTodo = (id: number) =>
	Effect.tryPromise({
		try: () =>
			fetch(`https://jsonplaceholder.typicode.com/todos/${id.toString()}`),
		catch: () => new Error(`something went wrong`),
	});

const program2 = getTodo(1);

// console.log(await Effect.runPromise(program2));

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

const program3 = readFile("pad.ts");

console.log(await Effect.runPromise(program3));
