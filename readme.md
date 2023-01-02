# sqlite-cloudflare-d1

This library provides a minimal and flexible interface for cloudflare d1.  
The `CURD` operations are supported.

## insert
Inserts a single row into and returns the inserted row.

Example:
```js
insert(db, {
  into: "users",
  data: { name: "bob", age: 30 }
});
// { id: 1, name: "bob", age: 30 }
```

## query
Query database for one or more rows.
See the last example on how to join tables.

Example 1: Returns every row in albums table.
```js
await query(db, { from: "albums" });
// [{id: 1, title: "Carry On"}, ...]
```

Example 2: Returns every album that starts with "Carry".
```js
await query(db, {
  from: "albums",
  where: {
    "Title LIKE ?": "Carry%",
  },
});
// [{id: 1, title: "Carry On"}]
```

Example 3: A more complex query.
           Note that in "where" clauses objects mean "AND" and arrays mean "OR".
```js
await query(db, {
  from: "albums",
  where: [
    { Title: "Transmission" },
    {
      "Title LIKE ?": "%On",
      "ArtistId > ?": 57,
    },
  ],
});
// This would effectively run the following query:
// "SELECT * FROM albums WHERE (Title = ?) OR (Title LIKE ? AND ArtisID > ?)"
```

Example 4: A join example with select and group by.
```js
await query(db, {
  select: {
    "a.Name": "Name",
    "count(*)": "count",
  },
  from: "artists a join albums b on a.ArtistId = b.ArtistId",
  group_by: "a.ArtistId",
  having: { "count > ?": 12 },
});
```

## update
Update the matching rows to the given values.
Similar to other functions, update returns the affected rows.

Example:
```js
await update(db, {
 table: "albums",
 where: { title: "Carry On" },
 set: { title: "Carry On!" },
});
// [{id: 1, title: "Carry On!"}]
```

## remove
Remove one or more rows from a table, and returns the deleted rows.

Example 1: Deletes every row that matches the condition.
```js
await remove(db, {
 from: "albums",
 where: { title: "Carry On" },
});
// [{id: 1, title: "Carry On"}]
```

### More examples of the "where:" clause

Example 1: The keys are expressions and they reference the values by "?".
           Object keys are "AND"ed together.
```js
 query({ ...,
   where: {
     name: "bob",
     "age > ?": 31,
   }
 })
 // { sql: "name = ? AND age > ?", values: ["bob", 31] }
```

Example 2: Arrays represent an "OR".
```js
 query({ ...
   [
     {
       "name LIKE ?": "Frank%",
       "age > ?": 31,
     },
     { height: 181 },
   ]
 })
 // { sql: "(name = ? AND age > ?) OR (height = ?)", values: ["Frank%", 31, 181] }
```

Note that `height: 31` is a shorthand for `"height = ?": 31`.
