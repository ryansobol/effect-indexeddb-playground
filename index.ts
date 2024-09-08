import { Effect, Stream } from "effect";
import {
	createTransaction,
	get,
	getObjectStore,
	open,
	openCursorAsStream,
	openIndex,
} from "./eidb";

const db = open("test", 1, (db) => {
	const store = db.createObjectStore("books", { keyPath: "isbn" });

	store.createIndex("by_title", "title", { unique: true });

	store.put({ title: "Quarry Memories", author: "Fred", isbn: 123456 });
	store.put({ title: "Water Buffaloes", author: "Fred", isbn: 234567 });
	store.put({ title: "Bedrock Nights", author: "Barney", isbn: 345678 });
});

const transaction = createTransaction(db, "books", () => {
	console.log("Transaction complete!");
});

const objectStore = getObjectStore(transaction, "books");

const opennedIndex = openIndex(objectStore, "by_title");

type Book = {
	title: string;
	author: string;
	isbn: number;
};

const book = get<Book>(opennedIndex, "Quarry Memories");

Effect.runPromise(book).then(console.log, console.error);

const opennedCursorStream = openCursorAsStream<Book>(objectStore);

const collectedBooks = Stream.runCollect(opennedCursorStream);

Effect.runPromise(collectedBooks).then(console.log, console.error);
