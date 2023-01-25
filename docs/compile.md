### POST /compile [{id, data, ...}, ...]

Compiles are idempotent. That is, the same response object will always be
returned for the same body given in the response.

```
const getTaskFromData = data => {lang: "1", code: `${JSON.stringify(data)}..`};

const items = getItemsFromRequest(req);
const auth = getAuthFromRequest(req);
const data = await Promise.all(items.map(async item => {
  const { id, data } = item;
  const dataId = postTask({ auth, task: getTaskFromData(data) });
  const taskId = [taskId, dataId].join("+");
  return await getData({ auth, taskId });
}));
```
