import { indexedDB, IDBKeyRange } from "fake-indexeddb";

var request = indexedDB.open("test", 3);

request.onupgradeneeded = function () {
  var db = request.result;
  var store = db.createObjectStore("books", { keyPath: "isbn" });
  store.createIndex("by_title", "title", { unique: true });

  store.put({ title: "Quarry Memories", author: "Fred", isbn: 123456 });
  store.put({ title: "Water Buffaloes", author: "Fred", isbn: 234567 });
  store.put({ title: "Bedrock Nights", author: "Barney", isbn: 345678 });
};

request.onsuccess = function (event: Event) {
  if (!event.target) return;

  const target = event.target as IDBRequest<IDBDatabase>;

  var db = target.result;

  var tx = db.transaction("books");

  tx.objectStore("books")
    .index("by_title")
    .get("Quarry Memories")
    .addEventListener("success", function (event: Event) {
      if (!event.target) return;

      const target = event.target as IDBRequest<{
        title: string;
        author: string;
        isbn: number;
      }>;

      console.log("From index:", target.result);
    });

  tx.objectStore("books").openCursor(IDBKeyRange.lowerBound(200000)).onsuccess =
    function (event: Event) {
      if (!event.target) return;

      const target = event.target as IDBRequest<IDBCursorWithValue | null>;

      var cursor = target.result;

      if (cursor) {
        console.log("From cursor:", cursor.value);
        cursor.continue();
      }
    };

  tx.oncomplete = function () {
    console.log("All done!");
  };
};
