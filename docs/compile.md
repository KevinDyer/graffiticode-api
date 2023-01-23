## POST /compile

Takes a `taskId` and `data` and returns `data`.


### POST /compile {item: {id, data, options}}
### POST /compile {item: [{id, data, options}, ...]
### POST /compile [{id, data, options}, ...]

const items = normalizeReqBody(req.body);
const data = items.map(async item => {
  const { id, data, options } = item;
  const dataId = await postTask({lang: "1", code: `${JSON.stringify(data)}..`});
  const taskId = [taskId, dataId].join("+");
  return await getData(task);
});
