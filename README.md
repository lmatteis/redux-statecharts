# Redux Statechart

To use this please check out my article https://medium.freecodecamp.org/how-to-model-the-behavior-of-redux-apps-using-statecharts-5e342aad8f66 and the xstate project: https://github.com/davidkpiano/xstate

* [Install](#install)
  * [Create your statechart JSON](#create-your-statechart-json)
  * [Install xstate](#install-xstate)
  * [The Redux middleware](#the-redux-middleware)
  * [Reducer](#reducer)
  * [Finally put everything together](#finally-put-everything-together)
* [Best practices](#best-practices)
  * [Folder structure](#folder-structure)

## Install

### Create your statechart JSON

```js
const statechart = {
  initial: 'Init',
  states: {
    Init: {
      on: { CLICKED_PLUS: 'Init.Increment' },
      states: {
        Increment: {
          onEntry: INCREMENT
        }
      }
    }
  }
}
```

### Install xstate

Install xstate `yarn add xstate` and create the machine object

```js
import { Machine } from 'xstate' // yarn add xstate

const machine = Machine(statechart)
```

### The Redux middleware

```js
const UPDATE = '@@statechart/UPDATE'

export const statechartMiddleware = store => next => (action) => {
  const state = store.getState()
  const currentStatechart = state.statechart // this has to match the location where you mount your reducer

  const nextMachine = machine.transition(currentStatechart, action)

  const result = next(action)

  // run actions
  nextMachine.actions.forEach(actionType =>
    store.dispatch({ type: actionType, payload: action.payload }))

  // save current statechart
  if (nextMachine && action.type !== UPDATE) {
    if (nextMachine.history !== undefined) {
      // if there's a history, it means a transition happened
      store.dispatch({ type: UPDATE, payload: nextMachine.value })
    }
  }

  return result
}
```

### Reducer

```js
export function statechartReducer(state = machine.initialState, action) {
  if (action.type === UPDATE) {
    return action.payload
  }
  return state
}
```

### Finally put everything together

```js
const rootReducer = combineReducers({
  statechart: statechartReducer
})

const store = createStore(
  rootReducer,
  applyMiddleware(
    statechartMiddleware,
  ),
)

// make sure your initial state actions are called
machine.initialState.actions.forEach(actionType =>
  store.dispatch({ type: actionType }))
```

## Best practices

### Folder structure

It makes sense to separate your states into specific folders, and have each folder contain the reducers, epics, constants, selectors and containers pertaining that specific state. Turns out statechart not only are a great tool to model behavior, but also to organize our apps in a filesystem! Since a statechart is hierarchical, this follows perfectly the filesystem structure. 

For instance, imagine this statechart example:

```js
{
  initial: 'Init',
  states: {
    Init: {
      on: {
        FETCH_DATA_CLICKED: 'FetchingData',
      },
      initial: 'NoData',
      states: {
        ShowData: {},
        Error: {},
        NoData: {}
      }
    },
    FetchingData: {
      on: {
        FETCH_DATA_SUCCESS: 'Init.ShowData',
        FETCH_DATA_FAILURE: 'Init.Error',
        CLICKED_CANCEL: 'Init.NoData',
      },
      onEntry: 'FETCH_DATA_REQUEST',
      onExit: 'FETCH_DATA_CANCEL',
    },
  }
}
```

One can imagine separating this JSON into several files:

```
├── FetchingData.js
├── Init
│   ├── Error.js
│   ├── NoData.js
│   ├── ShowData.js
│   └── index.js
└── index.js
```

Notice that states without any substate can just be files, and that there's always an `index.js` within each folder.

If we explore the contents of the main root `index.js` we can see that it's the starting point for the statechart:

```js
import Init from './Init'
import FetchingData from './FetchingData'

export default {
  initial: 'Init',
  states: {
    ...Init,
    ...FetchinData,
  }
}
```

Furthemore we can also contain our redux logic within these folders/files:

```js
import Init, {
  reducer as initReducer,
  epic as initEpic,
} from './Init'
import FetchingData, {
  reducer as fetchinDataReducer,
  epic as fetchingDataEpic,
} from './FetchingData'

export const rootEpic = combineEpics(
  initEpic,
  fetchingDataEpic
)

export const rootReducer = combineReducers({
  init: initReducer,
  data: fetchingDataReducer
})

export default {
  initial: 'Init',
  states: {
    ...Init,
    ...FetchinData,
  }
}
```
