import { indexedDB, IDBKeyRange } from "fake-indexeddb";
import { Effect, Console } from "effect";

const program = Console.log("Hello, World!");

Effect.runSync(program);

const request = indexedDB.open("test", 3);

request.onupgradeneeded = (event: Event) => {
	if (!event.target) return;

	const target = event.target as IDBRequest<IDBDatabase>;
	const db = target.result;

	const store = db.createObjectStore("books", { keyPath: "isbn" });

	store.createIndex("by_title", "title", { unique: true });

	store.put({ title: "Quarry Memories", author: "Fred", isbn: 123456 });
	store.put({ title: "Water Buffaloes", author: "Fred", isbn: 234567 });
	store.put({ title: "Bedrock Nights", author: "Barney", isbn: 345678 });
};

request.onsuccess = (event: Event) => {
	if (!event.target) return;

	const target = event.target as IDBRequest<IDBDatabase>;
	const db = target.result;

	const tx = db.transaction("books");

	tx.objectStore("books")
		.index("by_title")
		.get("Quarry Memories")
		.addEventListener("success", (event: Event) => {
			if (!event.target) return;

			const target = event.target as IDBRequest<{
				title: string;
				author: string;
				isbn: number;
			}>;

			console.log("From index:", target.result);
		});

	tx.objectStore("books").openCursor(IDBKeyRange.lowerBound(200000)).onsuccess =
		(event: Event) => {
			if (!event.target) return;

			const target = event.target as IDBRequest<IDBCursorWithValue | null>;
			const cursor = target.result;

			if (cursor) {
				console.log("From cursor:", cursor.value);
				cursor.continue();
			}
		};

	tx.oncomplete = () => {
		console.log("All done!");
	};
};
