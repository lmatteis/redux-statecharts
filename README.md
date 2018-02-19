# Redux Statechart

To use this please check out my article https://medium.freecodecamp.org/how-to-model-the-behavior-of-redux-apps-using-statecharts-5e342aad8f66 and the xstate project: https://github.com/davidkpiano/xstate

* [Install](#install)
  * [Create your statechart JSON](#create-your-statechart-json)
  * [Install xstate](#install-xstate)
  * [The Redux middleware](#the-redux-middleware)
  * [Reducer](#reducer)
  * [Finally put everything together](#finally-put-everything-together)

# Install

## Create your statechart JSON

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

## Install xstate

Install xstate `yarn add xstate` and create the machine object

```js
import { Machine } from 'xstate' // yarn add xstate

const machine = Machine(statechart)
```

## The Redux middleware

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

## Reducer

```js
export function statechartReducer(state = machine.initialState, action) {
  if (action.type === UPDATE) {
    return action.payload
  }
  return state
}
```

## Finally put everything together

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
