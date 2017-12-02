# uvent
Alexa skill to discover events around the University of Maryland

Events
```
{
	eventID:integer,
	name:string,
	startDate:Date, //format: `date "+%Y-%m-%dT%H:%M:%SZ"`
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
