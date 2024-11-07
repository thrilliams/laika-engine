# laika

is a bare-bones typescript state machine/game engine primarily developed for use in my [digital implementation](https://github.com/thrilliams/leaving-earth) of [leaving earth](https://boardgamegeek.com/boardgame/173064/leaving-earth)

### usage

some root function that takes an all-in-one game type and some maps/lists of functions and returns necessary architectural functions e.g. createState, resolveDecision, etc.

helpers like decisionReducer, choiceValidator, and interruptReducer are provided for your convenience

### structure

states are comprised of some arbitrary payload as well as one of a set of decisions. the reducer accepts this state, as well as some choice responding to the decision that is validated at runtime, and produces another valid state.

this extremely generic setup allows for a great deal of structural flexibility in terms of what shape decisions and choices take, and the ways in which they are presented to players

### technical information

this library uses [immer](https://immerjs.github.io/immer/) to maintain immutability during choice validation and allow concise mutating code during decision resolution. as a side effect, this also gives the functionality of undo/redo history and JSON patching for large total payload sizes for (more or less) free.

it also uses [zod](https://zod.dev/) to ensure type safety and validity of choices (i.e. user input) and make writing decision reducers _even easier_ (since choices only ever passed to reducers after being evaluated for validity) [and i think that's neat]

### planned features

-   networking helpers (i.e. multiplayer); either websockets or polling, updates to state communicated as history objects rather than complete states
-   hidden state
    -   "safe" undo/redo for choices that do not interact with hidden state (i.e. choices whose outcomes can be known without hidden state)
    -   optimistic refreshing for remote moves that do not interact with hidden state
-   choice queueing/"play by mail"; allow choices to mark the state that they depend on and then create a queue of them that can be resolved if that state is them as when the queue was created, or cancelled if that state has changed
    -   compare return value of selector functions with current state to value of selector functions for state in which they were queued
