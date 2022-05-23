Storage
---
Graffiticode API storage package allows for creation and retrieval of Tasks.

## Models

### `Task` [`object`]
Tasks are considered immutable and forever

- `lang`: The language identifier for this task
  - Type: `string`
- `code`: The AST for this task
  - Type: `object`

### `Id` [`string`]
Opaque identifier of a `Task`.

## Task DAO API
- `create(Task) -> Id`
- `get(Id) -> [Task]`
- `appends(Id, ...Ids) -> Id`
