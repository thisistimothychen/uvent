# uvent
Alexa skill to discover events around the University of Maryland

Events
```
{
	uid:integer,
	name:string,
	startDate:Date, //format: `date "+%Y-%m-%dZ%H:%M:%S"`
	endDate:Date,
	description:string,
	categories:[string],
	creationDate:Date
}
```

User
```
{
	alexaId,
	eventHistory:[Event uid],
	categoryWeights:{
		category:weight
  }
}
```
