# uvent
Alexa skill to discover events around the University of Maryland

## API

#### `/events`
```
Body: {
  "name": "",
  "description": "",
  "categories": [],
  "startDate": "",
  "endDate": ""
}
```

#### `/events/new`
```
Body: {
  "name": "",
  "description": "",
  "categories": [],
  "startDate": "",
  "endDate": ""
}
```

## DB Schema

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
