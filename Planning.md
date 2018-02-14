# Muncoordinated-2

```json
{
    "commitees": {
        "6019497035172651252": { // random token
            "name": "Security Council",
            "chair": "Max Bo",
            "topic": "The situation in Somalia",
            "members" : {
                "Russia" : {
                    "present": true,
                    "voting": false,
                    "rank": "Veto" // Veto | Standard | NGO | Observer
                    // assert that ~(~present && voting)
                    // assert that `if voting then status in {Veto, Standard}`
                },
                "US": "AS ABOVE",
                "UK": "AS ABOVE",
                "France": "AS ABOVE",
                "China": "AS ABOVE"
            },
            "caucuses" : {
                "General" : {
                    "topic": "The general speaker's list",
                    "status": "Open", // Open | Closed
                    // assert `if status == "Closed" then `..speaking == null`
                    "speakerTimer" : {
                        "remaining": -1, // indicating overtime
                        "elapsed": 61, // (since last reset) used for report generation
                        "ticking": true // used for machine synchronization
                    },
                    "caucusTimer" : {
                        "remaining": 30,
                        "elapsed": 530, 
                        "ticking": true
                    },
                    "speaking": {  // Nullable
                        "who": "US", // foreign key -> members, assert
                        "stance": "Against",
                        "duration": 3 // how long they've actually spoken for, bar timer shenanigans
                    },
                    "queue": {
                        "0": {
                            "who": "Russia",
                            "stance": "For",
                            "duration": 60
                        }
                    },
                    "history": {
                        "0": { // moved directly from `..speaking`
                            "who": "China",
                            "stance": "Neutral",
                            "duration": 56
                        }
                    }
                },
                "Draft Resolution 1": "as above"
            },
            "resolutions" : {
                "Draft Resolution 1" : {
                    "proposer": "US",
                    "seconder": "UK",
                    "status": "Ongoing", // Passed | Ongoing | Failed 
                    "caucus": "Draft Resolution 1", // associated caucus, nullable, assert bidirectional foreign key
                    "amendments": {
                        "0": {
                            "proposer": "UK",
                            "status": "Passed", // Passed | Ongoing | Failed
                            "text": "Strike clause 1a)",
                            "caucus": "Draft Resolution 1 - UK - 0", // associated caucus, nullable, assert bidrectional foregin key
                            "votes": "AS BELOW" // nullable iff Ongoing
                        }
                    },
                    "votes" : { // nullable iff Ongoing
                        "for": { // assert that all votes are disjunct
                            "0": "US",
                            "1": "UK",
                            "2": "France"
                        },
                        "abstaining": {
                            "0": "China"
                        },
                        "against": {
                            "0": "Russia"
                        }
                    }
                }
            }
        }
    }
}
```

The single source of truth will always be the backend. 

## Component Overview

```typescript
enum Rank {
    Veto = "Veto",
    Standard = "Observer",
    NGO = "NGO",
    Observer = "Observer"
}
```

```typescript
enum Stance {
    For = "For",
    Neutral = "Neutral",
    Against = "Against"
}
```

```typescript
enum Status {
    Passed = "Passed",
    Ongoing = "Ongoing",
    Failed = "Failed"
}
```

### Path component visibility

Define `<CaucusReport />` as having
    - many `<SpeakerEvent />`s
Define `<SpeakerEvent />` as having
    - one `<Member />`
Define `<MemberSelector />` as having
    - many `<Member />`s


- `/` 
    + `exact` `<Welcome />`. It will allow the user to either:
        * Create a new committe by `.push()`ing a new committee `ref` to `.committees`, immediately discarding it, and routing to `/committee/:{newRef.key}`
        * Join a pre-existing one with a key of their choosing, routing directly to `/committe/{key}`
    + `<Footer />`
- `/commitee/:key`
    + `<CommitteeMeta />`
    + `<Nav />`
    + `exact` `<CommitteeOverview />`
- `/commitee/:key/admin/`
    + `exact` `<Admin />`
    + `exact` `<Members />`
        * has many `<Member />`s
- `/committee/:key/caucuses`
    + `exact` `<CaucusOveriew />`
- `/commitee/:key/caucuses/:caucusName`
    + `exact` `<Caucus />`
        * has two `<Timer />`s
        * has many `<SpeakerEvent />`s
- `/commitee/:key/caucuses/:caucusName/report`
    + `exact` `<CaucusReport />`
- `/commitee/:key/report/`
- `/committee/:key/resolutions`
    + `exact` `<ResolutionsOverview />`
- `/commitee/:key/resolutions/:resolutionName`
    + `exact` `<Resolution />`
        * has many `<Amendment />`s
            - has one `<MemberSelector />`
        * has one `<VotingResults />`s
            - has many `<Vote />`s
        * has two `<MemberSelector />`s
- `/commitee/:key/resolutions/:resolutionName/vote`
    + `exact` `<Voting />`
        * has many `<Vote />`s
