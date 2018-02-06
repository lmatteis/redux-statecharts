# Redux Statechart

To use this please check out my article https://medium.freecodecamp.org/how-to-model-the-behavior-of-redux-apps-using-statecharts-5e342aad8f66 and the xstate project: https://github.com/davidkpiano/xstate

## Step 1

Create your statechart JSON

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

## Step 2

Import `xstate` and create the machine object

```js
import { Machine } from 'xstate' // yarn add xstate

const machine = Machine(statechart)
```

## Step 3

The Redux middleware

```js
export const statechartMiddleware = store => next => (action) => {
  const state = store.getState()
  const currentStatechart = state.statechart // this has to match the location where you mount your reducer

  const nextMachine = machine.transition(currentStatechart, action)

  const result = next(action)

  // run actions
  nextMachine.actions.forEach(actionType =>
    store.dispatch({ type: actionType, payload: action.payload }))

  return result
}
```

## Step 4

The statechart reducer (to save the current state information)

```js
export function statechartReducer(state = machine.initialState, action) {
  const nextState = machine.transition(state, action)
  if (nextState) {
    return nextState.value
  }
  return state
}
```

## Step 5

Finally put everything together

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
