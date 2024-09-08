import { indexedDB } from "fake-indexeddb";
import { Data, Effect, Option, pipe, Stream } from "effect";
import { RuntimeException, UnknownException } from "effect/Cause";

export class EIDBError extends Data.TaggedError("EIDBError")<{
	cause: Error;
}> {}

const createOpenDBRequest = (name: string, version?: number) => {
	return Effect.try({
		try: () => indexedDB.open(name, version),
		catch: (err: unknown) => {
			if (err instanceof Error) {
				return new EIDBError({ cause: err });
			}

			return new EIDBError({ cause: new UnknownException(err) });
		},
	});
};

const handleOnUpgradeNeeded = (callback: (db: IDBDatabase) => void) => {
	return (openDBRequest: IDBOpenDBRequest) => {
		return Effect.try({
			try: () => {
				openDBRequest.addEventListener("upgradeneeded", () => {
					// Throws a "InvalidStateError" DOMException if the request is still pending.
					// https://www.w3.org/TR/IndexedDB/#request-api
					const db = openDBRequest.result;

					callback(db);
				});
			},
			catch: (err: unknown) => {
				if (err instanceof Error) {
					return new EIDBError({ cause: err });
				}

				return new EIDBError({ cause: new UnknownException(err) });
			},
		});
	};
};

const handleOpenDBRequest = (openDBRequest: IDBOpenDBRequest) => {
	return Effect.async<IDBDatabase, EIDBError>((resume) => {
		openDBRequest.addEventListener("success", () => {
			resume(Effect.succeed(openDBRequest.result));
		});

		openDBRequest.addEventListener("error", () => {
			const error =
				openDBRequest.error ??
				new RuntimeException("DOMException Error is missing");

			resume(Effect.fail(new EIDBError({ cause: error })));
		});
	});
};

export const open = (
	name: string,
	version: number,
	onUpgrade: (db: IDBDatabase) => void,
) => {
	return pipe(
		createOpenDBRequest(name, version),
		Effect.tap(handleOnUpgradeNeeded(onUpgrade)),
		Effect.flatMap(handleOpenDBRequest),
	);
};

const handleOnComplete = (callback: () => void) => {
	return (transaction: IDBTransaction) => {
		return Effect.try({
			try: () => {
				transaction.addEventListener("complete", () => {
					callback();
				});
			},
			catch: (err: unknown) => {
				if (err instanceof Error) {
					return new EIDBError({ cause: err });
				}

				return new EIDBError({ cause: new UnknownException(err) });
			},
		});
	};
};

export const createTransaction = (
	eidb: Effect.Effect<IDBDatabase, EIDBError>,
	name: string,
	onComplete: () => void,
) => {
	return pipe(
		Effect.map(eidb, (db: IDBDatabase) => db.transaction(name)),
		Effect.tap(handleOnComplete(onComplete)),
	);
};

export const getObjectStore = (
	eidbTransaction: Effect.Effect<IDBTransaction, EIDBError>,
	name: string,
) => {
	return Effect.map(eidbTransaction, (tx: IDBTransaction) =>
		tx.objectStore(name),
	);
};

export const openIndex = (
	eidbStore: Effect.Effect<IDBObjectStore, EIDBError>,
	name: string,
) => {
	return Effect.map(eidbStore, (store: IDBObjectStore) => store.index(name));
};

const createDBRequest = (
	eidbIndex: Effect.Effect<IDBIndex, EIDBError>,
	key: string,
) => {
	return Effect.map(eidbIndex, (idx: IDBIndex) => idx.get(key));
};

const handleDBRequest = <T>(dbRequest: IDBRequest) => {
	return Effect.async<T, EIDBError>((resume) => {
		dbRequest.addEventListener("success", () => {
			resume(Effect.succeed(dbRequest.result as T));
		});

		dbRequest.addEventListener("error", () => {
			const error =
				dbRequest.error ??
				new RuntimeException("DOMException Error is missing");

			resume(Effect.fail(new EIDBError({ cause: error })));
		});
	});
};

export const get = <T>(
	eidbIndex: Effect.Effect<IDBIndex, EIDBError>,
	key: string,
) => {
	return pipe(
		createDBRequest(eidbIndex, key),
		Effect.flatMap(handleDBRequest<T>),
	);
};

const handleDBRequestOfCursor = <T>(
	dbRequest: IDBRequest<IDBCursorWithValue | null>,
) => {
	return Effect.async<T, Option.Option<EIDBError>>((resume) => {
		dbRequest.addEventListener("success", () => {
			if (dbRequest.result === null) {
				resume(Effect.fail(Option.none()));
				return;
			}

			const cursor = dbRequest.result;

			resume(Effect.succeed(cursor.value as T));

			cursor.continue();
		});

		dbRequest.addEventListener("error", () => {
			const error =
				dbRequest.error ??
				new RuntimeException("DOMException Error is missing");

			resume(Effect.fail(Option.some(new EIDBError({ cause: error }))));
		});
	});
};

export const openCursorAsStream = <T>(
	eidbStore: Effect.Effect<IDBObjectStore, EIDBError>,
	query?: IDBValidKey | IDBKeyRange | null,
) => {
	return Stream.repeatEffectOption(
		pipe(
			eidbStore,
			Effect.map((store: IDBObjectStore) => store.openCursor(query)),
			Effect.mapError((err: EIDBError) => Option.some(err)),
			Effect.flatMap(handleDBRequestOfCursor<T>),
		),
	);
};
